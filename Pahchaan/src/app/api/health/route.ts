import getMongoClient from "@/infrastructure/db";
export async function GET() {
  try {
    const client=await getMongoClient();
    const topology=await client.db().command({hello:1});
    if(!topology.setName && topology.msg!=="isdbgrid")throw new Error("Transactions require a replica set");
    return Response.json({status:"ready"},{headers:{"Cache-Control":"no-store"}});
  } catch (error) {
    const failure = error as { name?: string; code?: number; cause?: { name?: string; code?: number } };
    console.error("Database readiness failed", { name: failure.name, code: failure.code, causeName: failure.cause?.name, causeCode: failure.cause?.code });
    return Response.json({status:"unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});
  }
}
