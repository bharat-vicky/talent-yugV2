import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { membershipRepository } from "@/infrastructure/repositories/MembershipRepository";
import { collection, withTransaction } from "@/infrastructure/transaction";
import { checkOrigin, readJson, HttpError, httpError } from "@/lib/http";
type Context = {params:Promise<{id:string;memberId:string}>};
async function mutate(request: Request, context: Context, remove: boolean) {
  try {
    checkOrigin(request);
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new HttpError("Unauthorized",401);
    const {id,memberId} = await context.params;
    const role = remove ? undefined : z.enum(["owner","admin","manager","member","viewer"]).parse((await readJson(request)).role);
    return await withTransaction(async () => {
      if (!ObjectId.isValid(id)) throw new HttpError("Workspace not found",404);
      const locked = await (await collection("workspaces")).updateOne({_id:new ObjectId(id)},{$inc:{membershipRevision:1}});
      if (!locked.matchedCount) throw new HttpError("Workspace not found",404);
      const actor = await membershipRepository.findOne({workspaceId:id,userId:session.user.id,role:"owner"});
      if (!actor) throw new HttpError("Forbidden - Requires owner role",403);
      const member = await membershipRepository.findById(memberId);
      if (!member || member.workspaceId !== id) throw new HttpError("Member not found",404);
      if (member.role === "owner" && (remove || role !== "owner")) {
        if ((await membershipRepository.findMany({workspaceId:id,role:"owner"})).length <= 1) throw new HttpError("Workspace must retain an owner",409);
      }
      if (remove) { await membershipRepository.delete(memberId); return Response.json({success:true}); }
      return Response.json(await membershipRepository.update(memberId,{role}));
    });
  } catch(error) {return httpError(error);}
}
export async function PATCH(request:Request,context:Context){return mutate(request,context,false);}
export async function DELETE(request:Request,context:Context){return mutate(request,context,true);}
