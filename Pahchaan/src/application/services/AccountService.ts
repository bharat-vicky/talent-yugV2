import crypto from "node:crypto";
import * as bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import { z } from "zod";
import getMongoClient from "@/infrastructure/db";
import { collection, withTransaction } from "@/infrastructure/transaction";
import { normalizeEmail, exactEmailPattern } from "@/lib/email";
import { JobQueueService } from "./JobQueue";
import { HttpError } from "@/lib/http";

export class AccountService {
  static async checkToken(token: string, purpose: "verify" | "reset") {
    if (!/^[a-f0-9]{64}$/.test(token))
      throw new HttpError("Invalid or expired link. Request a new email.", 400);
    const record = await (
      await collection("auth_tokens")
    ).findOne({
      digest: crypto.createHash("sha256").update(token).digest("hex"),
      purpose,
      expiresAt: { $gt: new Date() },
    });
    if (
      !record ||
      typeof record.sessionVersion !== "number" ||
      !ObjectId.isValid(record.userId)
    )
      throw new HttpError("Invalid or expired link. Request a new email.", 400);
    const user = await (
      await collection("users")
    ).findOne({ _id: new ObjectId(record.userId) });
    if (!user || (user.sessionVersion || 0) !== record.sessionVersion)
      throw new HttpError("Invalid or expired link. Request a new email.", 400);
    // Checking a link never consumes it; mail scanners cannot activate accounts.
  }

  // Email ownership comes first; the owner chooses a password from the link.
  // Account, token and outbox entry either all commit or all roll back.
  static async register(rawEmail: string) {
    const email = z.string().email().max(254).parse(normalizeEmail(rawEmail));
    const register = () =>
      withTransaction(async () => {
        const users = await collection("users");
        if (
          !(await users.findOne({
            email: { $regex: exactEmailPattern(email) },
          }))
        ) {
          await users.insertOne({
            email,
            normalizedEmail: email,
            name: email.split("@")[0],
            emailVerified: null,
            sessionVersion: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        await this.requestToken(email, "verify");
      });
    try {
      await register();
    } catch (error) {
      // A concurrent registration may win the unique email index race.
      if ((error as { code?: number }).code !== 11000) throw error;
      await register();
    }
  }

  static validatePassword(password: string) {
    if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72)
      throw new HttpError(
        "Use a password with at least 12 characters and at most 72 bytes",
        400,
      );
  }

  static async createPasswordUser(rawEmail: string, password: string) {
    const email = z.string().email().max(254).parse(normalizeEmail(rawEmail));
    this.validatePassword(password);
    const users = (await getMongoClient()).db().collection("users");
    if (
      await users.countDocuments({
        email: { $regex: exactEmailPattern(email) },
      })
    )
      return null;
    const hash = await bcrypt.hash(password, 12);
    try {
      const result = await users.insertOne({
        email,
        normalizedEmail: email,
        name: email.split("@")[0],
        passwordHash: hash,
        emailVerified: null,
        sessionVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return users.findOne({ _id: result.insertedId });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) return null;
      throw error;
    }
  }

  static async requestToken(rawEmail: string, purpose: "verify" | "reset") {
    const email = z.string().email().max(254).parse(normalizeEmail(rawEmail));
    const matches = await (
      await collection("users")
    )
      .find({ email: { $regex: exactEmailPattern(email) } })
      .limit(2)
      .toArray();
    if (matches.length !== 1) return;
    const user = matches[0];
    if (purpose === "verify" && user.emailVerified) return;
    const token = crypto.randomBytes(32).toString("hex");
    await withTransaction(async () => {
      // Serialize token issuance with password changes and verification.
      const currentUser = await (
        await collection("users")
      ).findOneAndUpdate(
        { _id: user._id },
        { $inc: { authRevision: 1 } },
        { returnDocument: "after" },
      );
      if (!currentUser || (purpose === "verify" && currentUser.emailVerified))
        return;
      const tokens = await collection("auth_tokens");
      // Repeated requests must not immediately invalidate the email just sent.
      if (
        await tokens.findOne({
          userId: user._id.toString(),
          purpose,
          createdAt: { $gt: new Date(Date.now() - 60000) },
        })
      )
        return;
      await tokens.deleteMany({ userId: user._id.toString(), purpose });
      await tokens.insertOne({
        digest: crypto.createHash("sha256").update(token).digest("hex"),
        userId: user._id.toString(),
        purpose,
        sessionVersion: currentUser.sessionVersion || 0,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 1800000),
      });
      const base = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
      if (!base)
        throw new Error("App URL must be configured to send account links");
      const url = new URL(
        purpose === "verify"
          ? "/pahchaan/verify-email"
          : "/pahchaan/reset-password",
        base,
      );
      url.searchParams.set("token", token);
      await JobQueueService.enqueue("email", {
        workspaceId: "account",
        to: email,
        subject:
          purpose === "verify" ? "Verify your email" : "Reset your password",
        html: `<p><a href="${url.toString().replace(/&/g, "&amp;")}">${purpose === "verify" ? "Verify email" : "Reset password"}</a></p><p>This link expires in 30 minutes.</p>`,
      }, {priority: 100, deliveryDeadline: new Date(Date.now() + 1800000)});
    });
  }

  static async consumeToken(
    token: string,
    purpose: "verify" | "reset",
    password?: string,
  ) {
    if (!/^[a-f0-9]{64}$/.test(token))
      throw new HttpError("Invalid or expired link", 400);
    // The email owner chooses the final password. Never activate a password
    // supplied by somebody who pre-registered another person's address.
    this.validatePassword(password || "");
    const passwordHash = await bcrypt.hash(password!, 12);
    await withTransaction(async () => {
      const tokens = await collection("auth_tokens");
      const record = await tokens.findOne({
        digest: crypto.createHash("sha256").update(token).digest("hex"),
        purpose,
        expiresAt: { $gt: new Date() },
      });
      if (!record) throw new HttpError("Invalid or expired link", 400);
      const consumed = await tokens.deleteOne({ _id: record._id });
      if (!consumed.deletedCount) throw new HttpError("Link already used", 400);
      if (typeof record.sessionVersion !== "number")
        throw new HttpError("Request a new email to continue.", 400);
      const updated = await (
        await collection("users")
      ).updateOne(
        {
          _id: new ObjectId(record.userId),
          $expr: {
            $eq: [{ $ifNull: ["$sessionVersion", 0] }, record.sessionVersion],
          },
        },
        {
          $set: {
            emailVerified: new Date(),
            updatedAt: new Date(),
            ...(passwordHash ? { passwordHash } : {}),
          },
          $inc: { sessionVersion: 1 },
        },
      );
      if (!updated.matchedCount)
        throw new HttpError(
          "Invalid or expired link. Request a new email.",
          400,
        );
      await tokens.deleteMany({ userId: record.userId });
    });
  }
}
