import { NextResponse } from "next/server";

// Database inspection belongs in local tooling, never a public HTTP route.
export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
