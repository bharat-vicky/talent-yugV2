import {z} from "zod";
import crypto from "node:crypto";
import {ObjectId} from "mongodb";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {eventRepository} from "@/infrastructure/repositories/EventRepository";
import {RBACService} from "@/application/services/RBACService";
import {ScannerService, ScanResult} from "@/application/services/ScannerService";
import {collection,withTransaction} from "@/infrastructure/transaction";
import {readJson,httpError,HttpError} from "@/lib/http";
const scanSchema=z.object({id:z.string().min(8).max(100),qrPayload:z.string().max(10000),guestId:z.string().regex(/^[a-fA-F0-9]{24}$/).optional(),direction:z.enum(["in","out"]),location:z.string().max(300).optional()});
export async function POST(request:Request,{params}:{params:Promise<{eventId:string}>}){
 try{
  const session=await getServerSession(authOptions);if(!session?.user?.id)throw new HttpError("Unauthorized",401);
  const {eventId}=await params,event=await eventRepository.findById(eventId);if(!event)throw new HttpError("Event not found",404);
  if(!await RBACService.checkPermission(session.user.id,event.workspaceId,"member"))throw new HttpError("Forbidden",403);
  const {queue}=z.object({queue:z.array(scanSchema).min(1).max(50)}).parse(await readJson(request,524288));
  const results:Record<string,ScanResult>={};
  for(const scan of queue){
   const receiptId=new ObjectId(crypto.createHash("sha256").update(`${event.workspaceId}:${eventId}:${session.user.id}:${scan.id}`).digest("hex").slice(0,24));
   results[scan.id]=await withTransaction(async()=>{
    const receipts=await collection("offline_receipts"),existing=await receipts.findOne({_id:receiptId});if(existing)return existing.result as ScanResult;
    const result=await ScannerService.processScan(event.workspaceId,eventId,session.user.id,{qrData:scan.qrPayload,guestId:scan.guestId},scan.direction,scan.location);
    await receipts.insertOne({_id:receiptId,workspaceId:event.workspaceId,eventId,operatorId:session.user.id,result,createdAt:new Date(),expiresAt:new Date(Date.now()+30*86400000)});
    return result;
   });
  }
  return Response.json({success:true,results});
 }catch(error){return httpError(error);}
}
