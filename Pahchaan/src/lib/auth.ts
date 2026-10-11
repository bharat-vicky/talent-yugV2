import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import * as bcrypt from "bcrypt";
import { ObjectId, type WithId, type Document } from "mongodb";
import { z } from "zod";
import { authSecret } from "./auth-secret";
import { exactEmailPattern, normalizeEmail } from "./email";
import getMongoClient from "@/infrastructure/db";
import { AuditService } from "@/application/services/AuditService";
import { RateLimitService } from "@/application/services/RateLimitService";
import { collection, withTransaction } from "@/infrastructure/transaction";
import { safeSessionRedirect } from "./auth-navigation";

// Constant cost even for missing accounts reduces the timing discrepancy.
const dummyPasswordHash = bcrypt.hashSync("not-a-real-account-password", 12);
const googleId = process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID;
const googleSecret =
  process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET;

declare module "next-auth" {
  interface User {
    emailVerified?: boolean;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      emailVerified?: boolean;
    };
  }
}

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  providers: [
    ...(googleId && googleSecret
      ? [GoogleProvider({
          clientId: googleId,
          clientSecret: googleSecret,
          // Discovery, token exchange and signing-key requests share this
          // timeout. The library's 3.5s default is too short on slow networks.
          httpOptions: { timeout: 15000 },
        })]
      : []),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        mode: { label: "Mode", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (credentials?.mode === "signup") return null;
          if (!credentials?.email || !credentials.password) return null;
          const email = normalizeEmail(credentials.email);
          if (
            !z.string().email().max(254).safeParse(email).success ||
            Buffer.byteLength(credentials.password, "utf8") > 72
          )
            return null;
          if (
            !(await RateLimitService.consume("login:global", 200, 600000)) ||
            !(await RateLimitService.consume(`login:${email}`, 20, 600000))
          )
            throw new Error("TooManyAttempts");
          const users = (await getMongoClient()).db().collection("users");
          const candidates = await users
            .find({ email: { $regex: exactEmailPattern(email) } })
            .limit(2)
            .toArray();
          if (candidates.length > 1) return null;
          const user = candidates[0];
          const correctPassword = await bcrypt.compare(
            credentials.password,
            user?.passwordHash || dummyPasswordHash,
          );
          if (!user?.passwordHash || !correctPassword || !user.emailVerified)
            return null;
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            emailVerified: !!user.emailVerified,
          };
        } catch (error) {
          if (error instanceof Error && error.message === "TooManyAttempts")
            throw error;
          const failure = error as { name?: string; code?: number };
          console.error("Password sign-in unavailable", {
            name: failure.name,
            code: failure.code,
          });
          throw new Error("AccountUnavailable");
        }
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 86400 },
  pages: { signIn: "/pahchaan/login", error: "/pahchaan/login" },
  callbacks: {
    async redirect({ url, baseUrl }) {
      return new URL(safeSessionRedirect(url, baseUrl), baseUrl).toString();
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "credentials")
        return user.emailVerified === true;
      if (
        account?.provider !== "google" ||
        !user.email ||
        (profile as { email_verified?: boolean } | undefined)
          ?.email_verified !== true
      )
        return false;
      try {
        const email = normalizeEmail(user.email);
        await withTransaction(async () => {
          const users = await collection("users"),
            accounts = await collection("accounts");
          const existing = await accounts.findOne({
            provider: "google",
            providerAccountId: account.providerAccountId,
          });
          // Existing links use Google's stable subject, even if its email changes.
          const matches = await users
            .find({ email: { $regex: exactEmailPattern(email) } })
            .limit(2)
            .toArray();
          if (matches.length > 1)
            throw new Error("Ambiguous legacy account; recovery required");
          let dbUser: WithId<Document> | null = existing
            ? await users.findOne({
                _id: new ObjectId(existing.userId.toString()),
              })
            : matches[0] || null;
          if (existing && !dbUser)
            throw new Error("Linked account no longer exists");
          if (!existing && dbUser?.emailVerified) {
            // Google is authoritative for Gmail and verified Workspace addresses.
            // A verified third-party address alone can reflect outdated ownership.
            const hostedDomain = (profile as { hd?: unknown } | undefined)?.hd;
            const authoritative = email.endsWith("@gmail.com") ||
              (typeof hostedDomain === "string" && hostedDomain.length > 0);
            if (!authoritative) throw new Error("AccountLinkRequired");
            // Serialize first-time linking; never replace a different Google identity.
            await users.updateOne({ _id: dbUser._id }, { $inc: { authRevision: 1 } });
            const otherGoogle = await accounts.findOne({
              provider: "google",
              userId: { $in: [dbUser._id, dbUser._id.toString()] },
              providerAccountId: { $ne: account.providerAccountId },
            });
            if (otherGoogle) throw new Error("AccountLinkRequired");
          }
          if (!dbUser) {
            const created = await users.insertOne({
              email,
              normalizedEmail: email,
              name: user.name || email.split("@")[0],
              image: user.image || null,
              emailVerified: new Date(),
              sessionVersion: 1,
              createdAt: new Date(),
            });
            dbUser = await users.findOne({ _id: created.insertedId });
          }
          if (!dbUser) throw new Error("Account persistence failed");
          if (!dbUser.emailVerified) {
            await users.updateOne(
              { _id: dbUser._id },
              {
                $set: { emailVerified: new Date(), normalizedEmail: email },
                $unset: { passwordHash: "" },
                $inc: { sessionVersion: 1 },
              },
            );
            await (
              await collection("auth_tokens")
            ).deleteMany({ userId: dbUser._id.toString() });
          }
          if (existing && existing.userId.toString() !== dbUser._id.toString())
            throw new Error("Provider identity mismatch");
          if (!existing)
            await accounts.insertOne({
              userId: dbUser._id,
              type: account.type,
              provider: "google",
              providerAccountId: account.providerAccountId,
            });
          user.id = dbUser._id.toString();
          await (
            await collection("memberships")
          ).updateMany(
            { userId: account.providerAccountId },
            { $set: { userId: user.id } },
          );
        });
        return true;
      } catch (error) {
        // Do not log OAuth tokens, email addresses, database URIs or raw errors.
        const failure = error as {
          name?: string;
          code?: number;
          cause?: { name?: string; code?: number };
        };
        console.error("Google account persistence failed", {
          name: failure.name,
          code: failure.code,
          causeName: failure.cause?.name,
          causeCode: failure.cause?.code,
        });
        return error instanceof Error && error.message === "AccountLinkRequired"
          ? "/pahchaan/login?error=AccountLinkRequired"
          : "/pahchaan/login?error=AccountUnavailable";
      }
    },
    async jwt({ token, user }) {
      const id = user?.id || token.sub;
      if (!id || !ObjectId.isValid(id)) {
        delete token.sub;
        return token;
      }
      try {
        const dbUser = await (
          await getMongoClient()
        )
          .db()
          .collection("users")
          .findOne({ _id: new ObjectId(id) });
        if (
          !dbUser?.emailVerified ||
          (!user && token.sessionVersion !== (dbUser.sessionVersion || 0))
        ) {
          delete token.sub;
          return token;
        }
        token.sub = dbUser._id.toString();
        token.sessionVersion = dbUser.sessionVersion || 0;
        token.emailVerified = true;
        token.email = dbUser.email;
        token.name = dbUser.name;
        token.picture = dbUser.image || null;
      } catch {
        delete token.sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
        session.user.emailVerified =
          token.emailVerified === true && !!token.sub;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user.id)
        await AuditService.log(user.id, "USER_LOGIN", { email: user.email });
    },
  },
};
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
