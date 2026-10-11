/* eslint-disable @typescript-eslint/no-require-imports */
// Additional destructive/concurrency probes use only the disposable test database.
module.exports = async function hardening({from,db,test,assert,owner,a,b,event,other,answers,password,setSession}) {
 const {ObjectId}=require("mongodb"),{AccountService}=from("application/services/AccountService.ts"),{authOptions}=from("lib/auth.ts");
 const accountEmail = async to => { const jobs=await db.collection("jobs").find({workspaceId:"account"}).toArray(); return jobs.map(job=>({payload:from("lib/job-encryption.ts").decryptJobPayload(job.encryptedPayload)})).find(job=>job.payload.to===to); };
 const credentials=authOptions.providers.find(p=>p.id==="credentials").options.authorize;
 await test("Recovery does not expose a raw token to callers",async()=>{
  await AccountService.createPasswordUser("recover@example.com",password);
  assert.equal(await AccountService.requestToken("recover@example.com","reset"),undefined);
 });
 await test("Reset is single use and invalidates old sessions",async()=>{
  const user=await db.collection("users").findOne({email:"recover@example.com"});
  const job=await accountEmail(user.email);const token=job.payload.html.match(/token=([a-f0-9]{64})/)[1];
  const old={sub:user._id.toString(),sessionVersion:1};
  await AccountService.consumeToken(token,"reset","A different secure password");
  await assert.rejects(AccountService.consumeToken(token,"reset",password));
  assert.equal(await credentials({email:user.email,password}),null);
  assert((await credentials({email:user.email,password:"A different secure password"})).id);
  assert.equal((await authOptions.callbacks.jwt({token:old})).sub,undefined);
 });
 await test("Expired verification token cannot verify account",async()=>{
  await AccountService.createPasswordUser("expired@example.com",password);await AccountService.requestToken("expired@example.com","verify");
  const job=await accountEmail("expired@example.com");const token=job.payload.html.match(/token=([a-f0-9]{64})/)[1];
  await db.collection("auth_tokens").updateMany({purpose:"verify"},{$set:{expiresAt:new Date(0)}});
  await assert.rejects(AccountService.consumeToken(token,"verify",password), error => error.status === 400 && /expired/.test(error.message));
 });
 const {readJson,checkOrigin}=from("lib/http.ts"), req=body=>new Request("http://localhost/api",{method:"POST",headers:{"Content-Type":"application/json"},body});
 await test("Malformed JSON is a 400 error",async()=>assert.rejects(readJson(req("{")),error=>error.status===400));
 await test("Chunked oversized JSON is a 413 error",async()=>assert.rejects(readJson(req(JSON.stringify({text:"a".repeat(70000)}))),error=>error.status===413));
 await test("Cross-origin mutations are rejected",()=>assert.throws(()=>checkOrigin(new Request("http://localhost/api",{headers:{Origin:"https://attacker.example"}}))));
 const {RateLimitService}=from("application/services/RateLimitService.ts");
 await test("Distributed rate limit accepts exactly its allowance",async()=>{
  const result=await Promise.all(Array.from({length:20},()=>RateLimitService.consume("isolated-limit",3,60000)));assert.equal(result.filter(Boolean).length,3);
 });
 const {validateRegistrationAnswers,isFieldVisible}=from("lib/registration-validation.ts");
 const field=(id,type,extra={})=>({id,type,label:id,required:true,hidden:false,readOnly:false,width:"full",...extra});
 await test("Choice membership is enforced",()=>assert.throws(()=>validateRegistrationAnswers([field("choice","dropdown",{options:["Allowed"]})],{choice:"Forged"})));
 await test("Read-only and hidden fields use server defaults",()=>assert.deepEqual(validateRegistrationAnswers([field("fixed","text",{readOnly:true,defaultValue:"Default"}),field("hidden","text",{hidden:true,defaultValue:"Hidden"})],{fixed:"Forged",hidden:"Forged"}),{fixed:"Default",hidden:"Hidden"}));
 await test("Conditional AND and OR rules agree with public visibility",()=>{
  const f=field("conditional","text",{conditionalVisibility:{operator:"AND",conditions:[{fieldId:"a",operator:"equals",value:"yes"},{fieldId:"b",operator:"equals",value:"yes"}]}});
  assert.equal(isFieldVisible(f,{a:"yes",b:"no"}),false);f.conditionalVisibility.operator="OR";assert.equal(isFieldVisible(f,{a:"yes",b:"no"}),true);
 });
 await test("Unknown and MongoDB operator answer fields are rejected",()=>assert.throws(()=>validateRegistrationAnswers([field("name","text")],{name:"Valid","$set":"injection"})));
 await test("Invalid calendar dates and unsafe URLs are rejected",()=>{assert.throws(()=>validateRegistrationAnswers([field("date","date")],{date:"2026-02-31"}));assert.throws(()=>validateRegistrationAnswers([field("url","url")],{url:"javascript:alert(1)"}));});
 const {RegistrationService}=from("application/services/RegistrationService.ts");
 await test("Concurrent retry keys provision one submission",async()=>{
  const responses=await Promise.all(Array.from({length:5},()=>RegistrationService.submitRegistration(event._id,{...answers,[Object.keys(answers).find(k=>String(answers[k]).includes("@"))]:"retry@example.com"},undefined,"retry-key-test")));
  assert.equal(new Set(responses.map(r=>r._id)).size,1);await assert.rejects(RegistrationService.submitRegistration(event._id,{...answers},undefined,"retry-key-test"));
 });
 const {withTransaction,collection}=from("infrastructure/transaction.ts");
 await test("Transaction rollback removes all partial provisioning writes",async()=>{
  await assert.rejects(withTransaction(async()=>{await(await collection("guests")).insertOne({workspaceId:a._id,eventId:event._id,marker:"rollback"});await(await collection("qr_codes")).insertOne({workspaceId:a._id,eventId:event._id,marker:"rollback"});throw new Error("Injected downstream failure");}));
  assert.equal(await db.collection("guests").countDocuments({marker:"rollback"}),0);assert.equal(await db.collection("qr_codes").countDocuments({marker:"rollback"}),0);
 });
 const {isPublicAddress,webhookUrl}=from("lib/outbound-http.ts");
 await test("Pahchaan rebrand preserves existing webhook signature and delivery headers",async()=>{
  const outbound=from("lib/outbound-http.ts"),{WebhookService}=from("application/services/WebhookService.ts"),crypto=require("node:crypto");const webhook=await WebhookService.registerWebhook(a._id,"Compatibility fixture","https://example.com/webhook",["fixture"]);const original=outbound.postWebhook;let headers;
  outbound.postWebhook=async(url,data,value)=>{assert.equal(url,webhook.endpointUrl);assert.equal(data,'{"fixture":true}');headers=value;};
  try{await WebhookService.deliver({workspaceId:a._id,webhookId:webhook._id,deliveryId:"compatibility-delivery",dataString:'{"fixture":true}'});assert.equal(headers["X-Identity-Delivery"],"compatibility-delivery");assert.equal(headers["X-Identity-Signature"],crypto.createHmac("sha256",webhook.secret).update('{"fixture":true}').digest("hex"));}
  finally{outbound.postWebhook=original;}
 });
 await test("Webhooks reject private, metadata, mapped IPv6 and redirect destinations",()=>{
  for(const url of ["http://example.com","https://127.0.0.1","https://169.254.169.254","https://10.0.0.1","https://[::1]","https://[::ffff:127.0.0.1]","https://example.com:8443","https://user:pass@example.com"])assert.throws(()=>webhookUrl(url),url);
  assert(isPublicAddress("8.8.8.8"));assert(isPublicAddress("2606:4700:4700::1111"));assert(!isPublicAddress("100.64.0.1"));assert(!isPublicAddress("192.168.1.1"));
 });
 const {StorageService}=from("application/services/StorageProvider.ts");
 await test("Storage persists bytes and scopes deletion by tenant",async()=>{
  const url=await StorageService.upload(Buffer.from("Private fixture"),"../fixture.txt","text/plain",a._id);const id=new ObjectId(url.split("/").at(-1));
  assert((await db.collection("stored_files").findOne({_id:id})).filename.includes("fixture.txt"));
  await StorageService.delete(url,b._id);assert(await db.collection("stored_files").findOne({_id:id}));
  await StorageService.delete(url,a._id);assert.equal(await db.collection("stored_files").findOne({_id:id}),null);
 });
 await test("Storage rejects forged file types and oversized files",async()=>{await assert.rejects(StorageService.upload(Buffer.from("<html>"),"fake.png","image/png",a._id));await assert.rejects(StorageService.upload(Buffer.alloc(6*1024*1024),"large.txt","text/plain",a._id));});
 const {JobQueueService}=from("application/services/JobQueue.ts");
 await db.collection("jobs").deleteMany({});
 await test("Durable worker atomically claims a job across workers",async()=>{
  let calls=0;JobQueueService.registerHandler("bulk_export",async()=>{calls++;await new Promise(r=>setTimeout(r,40));return{ok:true};});
  const id=await JobQueueService.enqueue("bulk_export",{workspaceId:a._id});await Promise.all(Array.from({length:10},()=>JobQueueService.runNext()));
  assert.equal(calls,1);assert.equal((await JobQueueService.getJobStatus(id,a._id)).status,"completed");assert.equal(await JobQueueService.getJobStatus(id,b._id),null);
 });
 await test("Worker retries failures then records terminal failure",async()=>{
  JobQueueService.registerHandler("bulk_export",async()=>{throw new Error("Fixture failure");});const id=await JobQueueService.enqueue("bulk_export",{workspaceId:a._id});
  for(let i=0;i<5;i++){await db.collection("jobs").updateOne({_id:new ObjectId(id)},{$set:{availableAt:new Date(0)}});await JobQueueService.runNext();}
  const job=await JobQueueService.getJobStatus(id,a._id);assert.equal(job.status,"failed");assert.equal(job.attempts,5);assert.equal(job.payload,undefined);
 });
 await test("Worker recovers a crashed final attempt",async()=>{
  const inserted=await db.collection("jobs").insertOne({type:"bulk_export",status:"processing",attempts:5,leaseUntil:new Date(0),workspaceId:a._id});await JobQueueService.runNext();assert.equal((await JobQueueService.getJobStatus(inserted.insertedId.toString(),a._id)).status,"failed");
 });
 const {EmailService}=from("application/services/EmailService.ts"),{SmsService}=from("application/services/SmsService.ts");
 await test("Missing provider settings fail instead of reporting sent",async()=>{await assert.rejects(EmailService.deliver({}));await assert.rejects(SmsService.deliver({}));});
 const {TemplateService}=from("application/services/TemplateService.ts");
 await test("Template updates cannot reassign tenant or become official",async()=>{const template=await TemplateService.createTemplate(owner.id,a._id,{name:"Fixture"});await TemplateService.updateTemplate(owner.id,a._id,template._id,{workspaceId:b._id,isOfficial:true});const stored=await db.collection("event_templates").findOne({_id:new ObjectId(template._id)});assert.equal(stored.workspaceId,a._id);assert.equal(stored.isOfficial,false);});
 const {QRService}=from("application/services/QRService.ts");
 await test("QR creation rejects an event in another workspace",async()=>assert.rejects(QRService.createQR(owner.id,a._id,other._id,"Forged",{data:"test"})));
 const {DataLifecycleService}=from("application/services/DataLifecycleService.ts");
 await test("Approval pipeline failure rolls back submission, guest and QR provisioning",async()=>{
  const {GuestService}=from("application/services/GuestService.ts"),{RegistrationService}=from("application/services/RegistrationService.ts");const form=await db.collection("registration_forms").findOne({eventId:event._id});const previous=form.settings;
  await db.collection("registration_forms").updateOne({_id:form._id},{$set:{settings:{...previous,autoApprove:true,createGuest:true,generateQR:true}}});
  const names=["registration_submissions","guests","qr_codes","audit_logs","event_notifications"],counts=await Promise.all(names.map(name=>db.collection(name).countDocuments({eventId:event._id})));
  const original=GuestService.approveGuest;GuestService.approveGuest=async()=>{throw new Error("Injected QR provisioning failure");};
  try{const input={...answers};for(const field of form.fields)if(field.type==="email")input[field.id]="rollback-pipeline@example.com";await assert.rejects(RegistrationService.submitRegistration(event._id,input),/Injected QR provisioning failure/);assert.deepEqual(await Promise.all(names.map(name=>db.collection(name).countDocuments({eventId:event._id}))),counts);}
  finally{GuestService.approveGuest=original;await db.collection("registration_forms").updateOne({_id:form._id},{$set:{settings:previous}});}
 });
 await test("Encrypted delivery payloads reject tampering",async()=>{
  const {encryptJobPayload,decryptJobPayload}=from("lib/job-encryption.ts");const envelope=encryptJobPayload({token:"private-reset-token"});assert(!JSON.stringify(envelope).includes("private-reset-token"));assert.deepEqual(decryptJobPayload(envelope),{token:"private-reset-token"});assert.throws(()=>decryptJobPayload({...envelope,tag:Buffer.alloc(16).toString("base64")}));
 });
 await test("Offline replay preserves the original admission result exactly once",async()=>{
  setSession({user:{id:owner.id,email:"owner@example.com",emailVerified:true}});
  const ticket=await QRService.createQR(owner.id,a._id,event._id,"Offline replay fixture",{});await db.collection("qr_codes").updateOne({_id:new ObjectId(ticket._id)},{$set:{status:"active"}});
  const route=from("app/api/events/[eventId]/scanner/sync/route.ts"),payload={queue:[{id:"offline-replay-0001",qrPayload:ticket._id,direction:"in"}]};
  const send=()=>route.POST(new Request("http://localhost/api/scanner/sync",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}),{params:Promise.resolve({eventId:event._id})});
  const initial=await send();assert.equal(initial.status,200);const result=await initial.json();assert.equal(result.results[payload.queue[0].id].status,"success");const replay=await send();assert.deepEqual(await replay.json(),result);assert.equal(await db.collection("offline_receipts").countDocuments({eventId:event._id,operatorId:owner.id}),1);
 });
 await test("Event deletion cascades attendee and QR data only in its tenant",async()=>{
  const id=new ObjectId();await db.collection("events").insertOne({_id:id,workspaceId:a._id});await db.collection("guests").insertMany([{workspaceId:a._id,eventId:id.toString(),marker:"cascade"},{workspaceId:b._id,eventId:id.toString(),marker:"cascade"}]);await db.collection("qr_codes").insertOne({workspaceId:a._id,eventId:id.toString()});
  await EmailService.sendEmail(a._id,"fixture@example.com","Fixture","<p>Fixture</p>",undefined,id.toString());await SmsService.sendSms(a._id,"+12025550123","Fixture",id.toString());
  assert.equal(await db.collection("jobs").countDocuments({workspaceId:a._id,eventId:id.toString()}),2);
  await DataLifecycleService.removeEvent(a._id,id.toString());assert.equal(await db.collection("guests").countDocuments({workspaceId:a._id,marker:"cascade"}),0);assert.equal(await db.collection("guests").countDocuments({workspaceId:b._id,marker:"cascade"}),1);assert.equal(await db.collection("qr_codes").countDocuments({eventId:id.toString()}),0);assert.equal(await db.collection("jobs").countDocuments({eventId:id.toString()}),0);
 });
};
