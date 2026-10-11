import {apiSchemas} from "@/lib/api-schemas";
import {z} from "zod";
import {readJson,HttpError,httpError} from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import getMongoClient from "@/infrastructure/db";
import { membershipRepository } from "@/infrastructure/repositories/MembershipRepository";
import { ObjectId } from "mongodb";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
    }

    const { getActiveWorkspaceData } = await import("@/lib/workspace");
    const data = await getActiveWorkspaceData(session.user.id);
    return NextResponse.json(successResponse(data));
  } catch (error: unknown) {
    if (error instanceof HttpError || error instanceof z.ZodError) return httpError(error);
    return NextResponse.json(errorResponse((error as Error).message || "Internal server error"), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
    }

    const { workspaceId } = apiSchemas.active.parse(await readJson(req));
    if (!workspaceId) {
      return NextResponse.json(errorResponse("workspaceId is required"), { status: 400 });
    }

    // Verify membership
    const memberships = await membershipRepository.findByUserId(session.user.id);
    const hasMembership = memberships.some((m) => m.workspaceId === workspaceId);
    if (!hasMembership) {
      return NextResponse.json(errorResponse("Forbidden"), { status: 403 });
    }

    const client = await getMongoClient();
    let userQuery: Record<string, unknown> = { _id: session.user.id };
    if (ObjectId.isValid(session.user.id)) {
      userQuery = { $or: [{ _id: new ObjectId(session.user.id) }, { _id: session.user.id }] };
    }

    await client.db().collection("users").updateOne(userQuery, {
      $set: { lastActiveWorkspaceId: workspaceId, updatedAt: new Date() }
    });

    const response = NextResponse.json(successResponse({ workspaceId }, "Active workspace updated"));
    response.cookies.set("active-workspace-id", workspaceId, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });

    return response;
  } catch (error: unknown) {
    if (error instanceof HttpError || error instanceof z.ZodError) return httpError(error);
    return NextResponse.json(errorResponse((error as Error).message || "Internal server error"), { status: 500 });
  }
}
