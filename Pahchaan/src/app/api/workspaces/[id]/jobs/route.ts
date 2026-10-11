import { getServerSession } from "next-auth";
import {authOptions} from "@/lib/auth";
import {RBACService} from "@/application/services/RBACService";
import {collection} from "@/infrastructure/transaction";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const session=await getServerSession(authOptions);if(!session?.user?.id)return Response.json({error:"Unauthorized"},{status:401});
 const {id}=await params;if(!await RBACService.checkPermission(session.user.id,id,"admin"))return Response.json({error:"Forbidden"},{status:403});
 const jobs=await(await collection("jobs")).find({workspaceId:id},{projection:{type:1,status:1,attempts:1,progress:1,error:1,createdAt:1,updatedAt:1}}).sort({createdAt:-1}).limit(50).toArray();
 return Response.json({jobs},{headers:{"Cache-Control":"no-store"}});
}
