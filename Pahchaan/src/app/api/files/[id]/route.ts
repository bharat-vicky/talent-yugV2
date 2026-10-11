import { ObjectId, Binary } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { collection } from "@/infrastructure/transaction";
import { RBACService } from "@/application/services/RBACService";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" },{status:401});
  const { id } = await params;
  const file = ObjectId.isValid(id) ? await (await collection("stored_files")).findOne({_id:new ObjectId(id)}) : null;
  if (!file || !await RBACService.checkPermission(session.user.id,file.workspaceId,"viewer")) return Response.json({error:"Not found"},{status:404});
  const bytes = file.data instanceof Binary ? file.data.buffer : file.data;
  return new Response(new Uint8Array(bytes),{headers:{"Content-Type":file.mimeType,"Content-Disposition":`attachment; filename="${file.filename}"`,"X-Content-Type-Options":"nosniff","Cache-Control":"private, no-store"}});
}
