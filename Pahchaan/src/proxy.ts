import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { authSecret } from "@/lib/auth-secret";
import getMongoClient from "@/infrastructure/db";
export default withAuth(async function proxyHandler(req) {
  const token = req.nextauth.token;
  const api = req.nextUrl.pathname.startsWith("/api/");
  if (!token?.sub || !ObjectId.isValid(token.sub)) return api ? NextResponse.json({error:"Unauthorized"},{status:401}) : NextResponse.redirect(new URL(`/pahchaan/login?callbackUrl=${encodeURIComponent("/pahchaan" + req.nextUrl.pathname + req.nextUrl.search)}`,req.url));
  const db = (await getMongoClient()).db();
  const user = await db.collection("users").findOne({_id:new ObjectId(token.sub)});
  if (!user?.emailVerified || token.sessionVersion !== (user.sessionVersion || 0)) return api ? NextResponse.json({error:"Session expired"},{status:401}) : NextResponse.redirect(new URL("/pahchaan/login",req.url));
  const match = /^\/api\/events\/([a-f0-9]{24})(?:\/|$)/.exec(req.nextUrl.pathname);
  if (match) {
    const event = await db.collection("events").findOne({_id:new ObjectId(match[1])});
    const member = event && await db.collection("memberships").findOne({workspaceId:event.workspaceId,userId:token.sub});
    if (!member) return NextResponse.json({error:"Forbidden"},{status:403});
    const child = /^\/api\/events\/[a-f0-9]{24}\/(guests|qr)\/([a-f0-9]{24})(?:\/|$)/.exec(req.nextUrl.pathname);
    if (child && !await db.collection(child[1] === "guests" ? "guests" : "qr_codes").findOne({_id:new ObjectId(child[2]),workspaceId:event!.workspaceId,eventId:match[1]})) return NextResponse.json({error:"Not found"},{status:404});
  }
  if (api && !["GET","HEAD","OPTIONS"].includes(req.method)) {
    const origin = req.headers.get("origin");
    const appOrigin = new URL(process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || req.url).origin;
    if (req.headers.get("sec-fetch-site") === "cross-site" || origin && origin !== appOrigin) return NextResponse.json({error:"Forbidden origin"},{status:403});
    if (Number(req.headers.get("content-length")) > 5 * 1024 * 1024) return NextResponse.json({error:"Request too large"},{status:413});
  }
  return NextResponse.next();
},{secret:authSecret,callbacks:{authorized:()=>true}});
export const config = { matcher:["/dashboard/:path*","/onboarding/:path*","/workspace/:path*","/profile/:path*","/api/events/:path*","/api/workspaces/:path*","/api/templates/:path*"] };
