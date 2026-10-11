import {apiSchemas} from "@/lib/api-schemas";
import {z} from "zod";
import {readJson,HttpError,httpError} from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RBACService } from "@/application/services/RBACService";
import { ApiKeyService } from "@/application/services/ApiKeyService";
import { apiKeyRepository } from "@/infrastructure/repositories/ApiKeyRepository";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    
    // Only Managers or Admins can view API Keys
    const hasAccess = await RBACService.checkPermission(session.user.id, id, "manager");
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const keys = await apiKeyRepository.findByWorkspaceId(id);
    
    // Remove the hashes before sending to client for safety
    const safeKeys = keys.map(k => ({ ...k, hash: undefined }));
    
    return NextResponse.json(safeKeys);
  } catch (error: unknown) {
    if (error instanceof HttpError || error instanceof z.ZodError) return httpError(error);
    return NextResponse.json({ error: (error as Error).message || String(error) }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    
    const hasAccess = await RBACService.checkPermission(session.user.id, id, "manager");
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = apiSchemas.key.parse(await readJson(req));
    if (!body.name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const { apiKey, plaintextKey } = await ApiKeyService.generateKey(id, body.name, session.user.id);
    
    // Only return plaintext once
    return NextResponse.json({ ...apiKey, hash: undefined, plaintextKey });
  } catch (error: unknown) {
    if (error instanceof HttpError || error instanceof z.ZodError) return httpError(error);
    return NextResponse.json({ error: (error as Error).message || String(error) }, { status: 500 });
  }
}
