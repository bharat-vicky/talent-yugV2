import {apiSchemas} from "@/lib/api-schemas";
import {z} from "zod";
import {readJson,HttpError,httpError} from "@/lib/http";
import type { FormField, RegistrationForm } from "@/domain/types";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { MongoRepository } from "@/infrastructure/repositories/MongoRepository";

export interface FormPresetDoc {
  _id?: string;
  id?: string;
  userId?: string;
  name: string;
  category: string;
  description?: string;
  isCustom: boolean;
  fields: FormField[];
  branding?: Partial<RegistrationForm["branding"]>;
  createdAt: Date | string;
}

class FormPresetRepositoryImpl extends MongoRepository<FormPresetDoc> {
  constructor() {
    super("registration_presets");
  }
}

const formPresetRepo = new FormPresetRepositoryImpl();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
    const presets = await formPresetRepo.findMany({ $or: [{ isCustom: false }, { userId: session.user.id }] });
    return NextResponse.json(successResponse(presets));
  } catch (error: unknown) {
    if (error instanceof HttpError || error instanceof z.ZodError) return httpError(error);
    return NextResponse.json(errorResponse(error instanceof Error ? error.message : "Failed to fetch form presets"), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
    const body = apiSchemas.preset.parse(await readJson(req));

    if (!body.name) {
      return NextResponse.json(errorResponse("Preset name is required"), { status: 400 });
    }

    const presetDoc: FormPresetDoc = {
      userId: session.user.id,
      name: body.name,
      category: body.category || "Custom",
      description: body.description || "",
      isCustom: true,
      fields: body.fields || [],
      branding: body.branding || {},
      createdAt: new Date()
    };

    const created = await formPresetRepo.create(presetDoc);
    return NextResponse.json(successResponse(created, "Preset saved globally across all events"), { status: 201 });
  } catch (error: unknown) {
    if (error instanceof HttpError || error instanceof z.ZodError) return httpError(error);
    return NextResponse.json(errorResponse(error instanceof Error ? error.message : "Failed to save form preset"), { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
    const searchParams = req.nextUrl.searchParams;
    const presetId = searchParams.get("id");
    if (!presetId) {
      return NextResponse.json(errorResponse("Preset ID is required"), { status: 400 });
    }

    const preset = await formPresetRepo.findById(presetId);
    if (!preset || preset.userId !== session.user.id || !preset.isCustom) return NextResponse.json(errorResponse("Preset not found"), { status: 404 });
    await formPresetRepo.delete(presetId);
    return NextResponse.json(successResponse(null, "Preset deleted globally"));
  } catch (error: unknown) {
    if (error instanceof HttpError || error instanceof z.ZodError) return httpError(error);
    return NextResponse.json(errorResponse(error instanceof Error ? error.message : "Failed to delete preset"), { status: 500 });
  }
}
