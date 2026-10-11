import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {getActiveWorkspaceData} from "@/lib/workspace";
import {RBACService} from "@/application/services/RBACService";
import {collection} from "@/infrastructure/transaction";
export default async function IntegrationsPage(){
 const session=await getServerSession(authOptions);if(!session?.user?.id)return null;
 const {activeWorkspace}=await getActiveWorkspaceData(session.user.id);if(!activeWorkspace)return null;
 const workspaceId=String(activeWorkspace._id),admin=await RBACService.checkPermission(session.user.id,workspaceId,"admin");
 const jobs=admin?await(await collection("jobs")).find({workspaceId},{projection:{type:1,status:1,attempts:1,updatedAt:1}}).sort({createdAt:-1}).limit(20).toArray():[];
 return <div className="max-w-4xl space-y-6"><h1 className="text-3xl font-bold">Delivery & integrations</h1><p>Email: {process.env.SMTP_HOST&&process.env.SMTP_USER&&process.env.SMTP_PASS&&process.env.SMTP_FROM?"Configured":"Needs configuration"}. SMS: {process.env.TWILIO_ACCOUNT_SID&&process.env.TWILIO_AUTH_TOKEN&&process.env.TWILIO_FROM?"Configured":"Needs configuration"}.</p><p>Queued deliveries need a running background worker. Configure outbound webhooks in workspace settings. CRM connections will be added in a later release.</p>{admin&&<><h2 className="text-xl font-semibold">Recent background jobs</h2>{jobs.length?<table className="w-full text-sm"><thead><tr><th className="text-left">Type</th><th className="text-left">Status</th><th className="text-left">Attempts</th></tr></thead><tbody>{jobs.map(job=><tr key={job._id.toString()} className="border-t"><td className="py-2">{job.type}</td><td>{job.status}</td><td>{job.attempts}</td></tr>)}</tbody></table>:<p>No background jobs yet.</p>}</>}</div>;
}
