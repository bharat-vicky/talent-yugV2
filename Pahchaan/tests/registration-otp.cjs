const crypto=require('node:crypto');
module.exports=async({from,db,test,assert,event,other,form,answers,publicRoute,request,context})=>{
 const {RegistrationEmailVerification:otp}=from('application/services/RegistrationEmailVerification.ts');
 const decode=from('lib/job-encryption.ts').decryptJobPayload;
 const previous=Object.fromEntries(['SMTP_HOST','SMTP_USER','SMTP_PASS','SMTP_FROM'].map(key=>[key,process.env[key]]));
 Object.assign(process.env,{SMTP_HOST:'127.0.0.1',SMTP_USER:'test',SMTP_PASS:'test',SMTP_FROM:'test@example.test'});
 const emailField=form.fields.find(f=>f.type==='email');
 async function issued(email){const challenge=await otp.request(event._id,event.workspaceId,event.name,email);const job=await db.collection('jobs').findOne({type:'email',eventId:event._id},{sort:{createdAt:-1}});const payload=decode(job.encryptedPayload);return {...challenge,code:payload.text.match(/code is (\d{6})/)[1]};}
 try{
  await test('OTP cannot submit a public registration without verification',async()=>{
   const response=await publicRoute.POST(request('/api/r/summit-a',{answers:{...answers,[emailField.id]:'unverified@example.test'}}),context({slug:['summit-a']}));assert.equal(response.status,400);
   assert.equal(await db.collection('registration_submissions').countDocuments({[`answers.${emailField.id}`]:'unverified@example.test'}),0);
  });
  await test('OTP queue is encrypted, resend has a cooldown and old codes expire',async()=>{
   const email='expired-otp@example.test',issuedCode=await issued(email);const stored=await db.collection('registration_email_verifications').findOne({email});assert(!JSON.stringify(stored).includes(issuedCode.code));
   await assert.rejects(otp.request(event._id,event.workspaceId,event.name,email),error=>error.status===429);
   await db.collection('registration_email_verifications').updateOne({email},{$set:{expiresAt:new Date(Date.now()-1)}});
   await assert.rejects(otp.verify(event._id,email,issuedCode.challenge,issuedCode.code));
  });
  await test('OTP allows at most five guesses and binds verification to its event',async()=>{
   const email='guesses-otp@example.test',issuedCode=await issued(email);
   await assert.rejects(otp.verify(other._id,email,issuedCode.challenge,issuedCode.code));
   const wrong=issuedCode.code==='111111'?'222222':'111111';
   for(let i=0;i<5;i++)await assert.rejects(otp.verify(event._id,email,issuedCode.challenge,wrong));
   await assert.rejects(otp.verify(event._id,email,issuedCode.challenge,issuedCode.code));
  });
  await test('OTP proof rejects changed email and replay but supports safe registration retries',async()=>{
   const email='verified-otp@example.test',issuedCode=await issued(email);const {proof}=await otp.verify(event._id,email,issuedCode.challenge,issuedCode.code);
   await assert.rejects(otp.verify(event._id,email,issuedCode.challenge,issuedCode.code));
   await assert.rejects(otp.consume(other._id,email,proof,'otp-retry-test'));
   await assert.rejects(otp.consume(event._id,'changed@example.test',proof,'otp-retry-test'));
   for(let i=0;i<2;i++){
    const req=request('/api/r/summit-a',{answers:{...answers,[emailField.id]:email},emailProof:proof});req.headers.set('idempotency-key','otp-retry-test');
    const result=await publicRoute.POST(req,context({slug:['summit-a']}));assert.equal(result.status,200,await result.clone().text());
   }
   assert.equal(await db.collection('registration_submissions').countDocuments({[`answers.${emailField.id}`]:email}),1);
   assert((await db.collection('registration_submissions').findOne({[`answers.${emailField.id}`]:email})).emailVerifiedAt);
   await assert.rejects(otp.consume(event._id,email,proof,crypto.randomUUID()));
   await db.collection('registration_email_verifications').updateOne({email},{$set:{expiresAt:new Date(Date.now()-1)}});
   await assert.rejects(otp.consume(event._id,email,proof,'otp-retry-test'));
  });
 }finally{for(const [key,value]of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
};
