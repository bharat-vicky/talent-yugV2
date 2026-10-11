import { ObjectId } from "mongodb";
import crypto from "node:crypto";
import { z } from "zod";
import { collection, withTransaction } from "@/infrastructure/transaction";
import { EmailService } from "./EmailService";
import { authSecret } from "@/lib/auth-secret";
import { HttpError } from "@/lib/http";

const hash = (text: string) => crypto.createHash("sha256").update(text).digest("hex");
const canonicalEmail = (email: string) => z.string().email().max(254).parse(email.trim().toLowerCase());
const verificationId = (eventId: string, email: string) => new ObjectId(hash(`${eventId}:${email}`).slice(0,24));
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]!);
let indexes: Promise<unknown> | undefined;
async function challenges() {
  const records = await collection("registration_email_verifications");
  indexes ??= records.createIndex({expiresAt: 1}, {expireAfterSeconds: 0}).catch(error => { indexes = undefined; throw error; });
  await indexes;
  return records;
}
function codeHash(challenge: string, code: string) {
  if (!authSecret) throw new Error("Authentication secret is required");
  return crypto.createHmac("sha256", authSecret).update(`registration-otp:${challenge}:${code}`).digest("hex");
}

export class RegistrationEmailVerification {
  static async request(eventId: string, workspaceId: string, eventName: string, inputEmail: string) {
    const email = canonicalEmail(inputEmail);
    if (![process.env.SMTP_HOST, process.env.SMTP_USER, process.env.SMTP_PASS, process.env.SMTP_FROM].every(Boolean)) {
      throw new HttpError("Verification email is temporarily unavailable. Please try again shortly.", 503);
    }
    await challenges();
    const challenge = crypto.randomBytes(32).toString("hex");
    const code = crypto.randomInt(100000, 1000000).toString();
    await withTransaction(async () => {
      const records = await collection("registration_email_verifications");
      const id = verificationId(eventId, email);
      const existing = await records.findOne({_id: id});
      if (existing && new Date(existing.sentAt).getTime() > Date.now() - 60000) throw new HttpError("Please wait 60 seconds before requesting another code.", 429);
      await records.replaceOne({_id: id}, {
        _id: id, eventId, email, challengeHash: hash(challenge), codeHash: codeHash(challenge, code),
        attempts: 0, sentAt: new Date(), expiresAt: new Date(Date.now() + 10 * 60000),
      }, {upsert: true});
      await EmailService.sendEmail(workspaceId, email, "Your Pahchaan registration verification code",
        `<div style="font-family:Arial,sans-serif;color:#184c40;max-width:520px;margin:auto;padding:32px"><h2>One step closer to your next gathering.</h2><p>Verify your email to register for <strong>${escape(eventName)}</strong>.</p><p style="font-size:32px;font-weight:bold;letter-spacing:8px">${code}</p><p>This code expires in 10 minutes. Enter it on the registration form. Please do not share it.</p><p>If you did not request this code, you can ignore this email.</p><p>Pahchaan by TalentYug</p></div>`, undefined, eventId,
        `Your verification code is ${code}. It expires in 10 minutes. Enter it on the Pahchaan registration form. Do not share this code. If you did not request it, ignore this email.`);
    });
    return {challenge, expiresIn: 600, resendAfter: 60};
  }

  static async verify(eventId: string, inputEmail: string, challenge: string, code: string) {
    const email = canonicalEmail(inputEmail);
    const records = await challenges();
    const filter = {_id: verificationId(eventId, email), eventId, email, challengeHash: hash(challenge), expiresAt: {$gt: new Date()}, attempts: {$lt: 5}, proofHash: {$exists: false}};
    const attempted = await records.findOneAndUpdate(filter, {$inc: {attempts: 1}}, {returnDocument: "after"});
    if (!attempted || attempted.codeHash !== codeHash(challenge, code)) throw new HttpError("The code is incorrect or expired. Request a new code if needed.", 400);
    const proof = crypto.randomBytes(32).toString("hex");
    const verified = await records.updateOne({...filter, codeHash: attempted.codeHash, attempts: {$lte: 5}}, {$set: {proofHash: hash(proof), verifiedAt: new Date(), expiresAt: new Date(Date.now() + 20 * 60000)}, $unset: {codeHash: ""}});
    if (!verified.modifiedCount) throw new HttpError("Please request a new verification code.", 400);
    return {proof, expiresIn: 1200};
  }

  // Called inside the same transaction as guest, QR and submission creation.
  static async consume(eventId: string, inputEmail: string, proof: unknown, retryKey: string) {
    if (typeof proof !== "string" || !/^[a-f0-9]{64}$/.test(proof)) throw new HttpError("Verify your email before submitting the registration.", 400);
    const result = await (await collection("registration_email_verifications")).findOneAndUpdate({
      _id: verificationId(eventId, canonicalEmail(inputEmail)), eventId, email: canonicalEmail(inputEmail), proofHash: hash(proof), expiresAt: {$gt: new Date()},
      $or: [{usedKey: {$exists: false}}, {usedKey: retryKey}],
    }, {$set: {usedKey: retryKey}}, {returnDocument: "after"});
    if (!result) throw new HttpError("Email verification expired or the email changed. Please verify again.", 400);
    return new Date(result.verifiedAt);
  }
}
