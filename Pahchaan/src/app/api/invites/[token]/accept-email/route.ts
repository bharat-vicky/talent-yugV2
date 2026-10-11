import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const url = new URL("/pahchaan/invite", request.url);
  url.searchParams.set("token",token);
  return NextResponse.redirect(url);
}
