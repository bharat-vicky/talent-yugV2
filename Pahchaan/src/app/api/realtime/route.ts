import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { collection } from "@/infrastructure/transaction";
import { RBACService } from "@/application/services/RBACService";
import { eventRepository } from "@/infrastructure/repositories/EventRepository";
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({error:"Unauthorized"},{status:401});
  const params = new URL(request.url).searchParams, channel = params.get("channel") || "", cursor = params.get("cursor");
  const match = /^(workspace|event)_([a-f0-9]{24})$/.exec(channel);
  if (!match) return Response.json({error:"Invalid channel"},{status:400});
  const workspaceId = match[1] === "workspace" ? match[2] : (await eventRepository.findById(match[2]))?.workspaceId;
  if (!workspaceId || !await RBACService.checkPermission(session.user.id,workspaceId,"viewer")) return Response.json({error:"Forbidden"},{status:403});
  const events = await (await collection("realtime_events")).find({channel,expiresAt:{$gt:new Date()},...(cursor && ObjectId.isValid(cursor) ? {_id:{$gt:new ObjectId(cursor)}} : {})}).sort({_id:1}).limit(100).toArray();
  return Response.json({events:events.map(item=>({id:item._id.toString(),event:item.event,createdAt:item.createdAt})),cursor:events.at(-1)?._id.toString()||cursor},{headers:{"Cache-Control":"no-store"}});
}
