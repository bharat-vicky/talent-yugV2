/* eslint-disable @typescript-eslint/no-require-imports */
// Explicit opt-in: real Atlas, a unique disposable database, and one approved
// recipient. Never runs as part of npm test or processes the application's queue.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const net = require('node:net');
const Module = require('node:module');
const { spawn } = require('node:child_process');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
require(path.join(root, '../node_modules/@next/env')).loadEnvConfig(path.join(root, '..'), true);
const recipient = process.env.AUTH_TEST_RECIPIENT;
assert(process.argv.includes('--send-test-email') && recipient, 'Explicit recipient and --send-test-email are required');
const configuredUri = process.env.MONGODB_URI;
const uri = new URL(configuredUri);
const database = 'pahchaan_auth_' + Date.now().toString(36) + '_' + crypto.randomBytes(4).toString('hex');
uri.pathname = '/' + database;
Object.assign(process.env, { MONGODB_URI: uri.toString(), NODE_ENV:'test',
  NEXTAUTH_SECRET:crypto.randomBytes(32).toString('base64'), JOB_ENCRYPTION_KEY:crypto.randomBytes(32).toString('base64'),
  DEV_JOB_WORKER:'false' });
const resolve = Module._resolveFilename;
Module._resolveFilename = function(request, ...args) {
  return resolve.call(this, request.startsWith('@/') ? path.join(root,'src',request.slice(2)) : request, ...args);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'), {
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true},fileName:filename,
}).outputText,filename);
const from = file => require(path.join(root,'src',file));
async function main() {
  let client, server, ownsDatabase = false;
  const steps = [];
  const passed = name => { steps.push(name); console.log('PASS '+name); };
  const report = { database, startedAt:new Date().toISOString(), steps };
  try {
    const port = await new Promise(resolvePort => {
      const probe=net.createServer();probe.listen(0,'127.0.0.1',()=>{const p=probe.address().port;probe.close(()=>resolvePort(p));});
    });
    const base='http://localhost:'+port+'/pahchaan';
    Object.assign(process.env,{NEXTAUTH_URL:base+'/api/auth',NEXTAUTH_URL_INTERNAL:base+'/api/auth',NEXT_PUBLIC_APP_URL:base});
    report.stage='Atlas database initialization';
    client = new (require('mongodb').MongoClient)(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000,connectTimeoutMS:10000});
    await client.connect();
    assert.equal((await client.db().listCollections().toArray()).length,0,'Test namespace must be new');
    ownsDatabase=true;
    const appClient = await from('infrastructure/db.ts').default();
    await client.close();client=appClient;
    const db=client.db();assert.equal(db.databaseName,database);
    // Initialization creates empty indexes; reject any unexpected existing data.
    report.stage='test database isolation';
    for (const {name} of await db.listCollections().toArray()) assert.equal(await db.collection(name).countDocuments(),0);
    ownsDatabase=true;
    passed('Atlas connection and index permissions');
    server=spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'start','-H','127.0.0.1','-p',String(port)],{
      cwd:root,windowsHide:true,env:{...process.env,NODE_ENV:'production'},stdio:['ignore','pipe','pipe'],
    });
    // Do not persist request logs: verification URLs and cookies are sensitive.
    server.stdout.on('data',()=>{});server.stderr.on('data',()=>{});
    const jar=new Map();
    async function http(route,options={}) {
      const response=await fetch(base+route,{...options,redirect:'manual',headers:{...options.headers,
        Cookie:Array.from(jar,([k,v])=>k+'='+v).join('; ')},signal:AbortSignal.timeout(20000)});
      for(const item of response.headers.getSetCookie()){const pair=item.split(';')[0];jar.set(pair.slice(0,pair.indexOf('=')),pair.slice(pair.indexOf('=')+1));}
      return response;
    }
    let ready=false;
    for(let i=0;i<50;i++){try{if((await http('/api/auth/session')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}
    assert(ready,'Test HTTP server did not start');
    const post=(action,body)=>http('/api/account/'+action,{method:'POST',headers:{'Content-Type':'application/json',Origin:new URL(base).origin},body:JSON.stringify(body)});
    const { JobQueueService }=from('application/services/JobQueue.ts');
    const { decryptJobPayload }=from('lib/job-encryption.ts');
    const { EmailService }=from('application/services/EmailService.ts');
    const deliver=EmailService.deliver.bind(EmailService);
    EmailService.deliver=async payload=>{
      assert.equal(payload.to,recipient,'Only the explicitly approved test recipient may receive email');
      return deliver({...payload,subject:'[Pahchaan auth test] '+payload.subject,
        html:'<p>This is an authorised automated test. Its link will be consumed during the test; no action is required.</p>'+payload.html});
    };
    async function mailToken() {
      const job=await db.collection('jobs').findOne({status:'pending'});assert(job);
      const payload=decryptJobPayload(job.encryptedPayload);assert.equal(payload.to,recipient);
      const token=payload.html.match(/token=([a-f0-9]{64})/)[1];
      assert(await JobQueueService.runNext());
      const status=await db.collection('jobs').findOne({_id:job._id});
      assert.equal(status.status,'completed','SMTP test message was not accepted');
      return token;
    }
    assert.equal((await post('register',{email:recipient})).status,202);passed('Email-first signup over HTTP');
    const password=crypto.randomBytes(24).toString('base64');
    async function login(pw,callbackUrl=base+'/dashboard') {
      const csrf=await (await http('/api/auth/csrf')).json();
      return (await http('/api/auth/callback/credentials',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body:new URLSearchParams({csrfToken:csrf.csrfToken,email:recipient,password:pw,callbackUrl,json:'true'})})).json();
    }
    assert((await login(password)).url.includes('CredentialsSignin'));passed('Unverified account cannot sign in');
    const verification=await mailToken();passed('Verification email accepted by real SMTP');
    assert.equal((await post('check',{token:verification,purpose:'verify'})).status,200);
    assert.equal((await post('verify',{token:verification,password})).status,200);
    assert.equal((await post('verify',{token:verification,password})).status,400);passed('Verification and single-use token');
    assert((await login('incorrect')).url.includes('CredentialsSignin'));passed('Incorrect password rejected');
    const signedIn=await login(password,base+'/invite?token=test-destination');
    assert(signedIn.url.endsWith('/invite?token=test-destination'));passed('Invitation destination preserved');
    const session=await (await http('/api/auth/session')).json();assert(session.user.id);passed('Real NextAuth credential session');
    assert.equal((await http('/onboarding')).status,200);passed('First-account onboarding access');
    assert.equal((await post('forgot',{email:recipient})).status,202);
    const recovery=await mailToken();passed('Recovery email accepted by real SMTP');
    const replacement=crypto.randomBytes(24).toString('base64');
    assert.equal((await post('reset',{token:recovery,password:replacement})).status,200);
    assert.equal((await http('/api/events')).status,401);passed('Password reset invalidates existing session');
    assert.equal((await post('reset',{token:recovery,password:replacement})).status,400);
    assert((await login(password)).url.includes('CredentialsSignin'));
    assert(!(await login(replacement)).url.includes('error='));passed('Old password rejected, new password works, reset cannot replay');
    const csrf=await (await http('/api/auth/csrf')).json();
    const out=await (await http('/api/auth/signout',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({csrfToken:csrf.csrfToken,callbackUrl:base+'/login',json:'true'})})).json();
    assert.equal(out.url,base+'/login');assert(!(await (await http('/api/auth/session')).json()).user);passed('Sign-out clears session and returns to login');
    // Controlled callback profiles test persistence without pretending to complete Google consent.
    const {authOptions}=from('lib/auth.ts');const subject=crypto.randomUUID();
    const google={id:subject,email:'google-auth-test@example.invalid',name:'Auth test'};
    assert.equal(await authOptions.callbacks.signIn({user:google,account:{provider:'google',type:'oauth',providerAccountId:subject},profile:{email_verified:true}}),true);
    assert.equal(await authOptions.callbacks.signIn({user:{...google},account:{provider:'google',type:'oauth',providerAccountId:subject},profile:{email_verified:true}}),true);
    assert.equal(await db.collection('accounts').countDocuments(),1);passed('Google callback persistence on Atlas (controlled profile)');
    report.success=true;report.emailMessagesAccepted=2;
  } catch(error) {
    report.success=false;report.failure={name:error.name,code:error.code,causeName:error.cause?.name,causeCode:error.cause?.code};
    console.error('Auth test failed:',JSON.stringify({stage:report.stage,...report.failure}));process.exitCode=1;
  } finally {
    if(server){server.kill();await new Promise(r=>{if(server.exitCode!==null)return r();server.once('exit',r);});}
    if(client){
      if(ownsDatabase && client.db().databaseName===database && /^pahchaan_auth_[a-z0-9]+_[a-f0-9]{8}$/.test(database)){
        await client.db().dropDatabase();report.testDatabaseRemoved=true;
      }
      await client.close();
    }
    report.finishedAt=new Date().toISOString();
    fs.mkdirSync(path.join(root,'../docs/test-results'),{recursive:true});
    fs.writeFileSync(path.join(root,'../docs/test-results/atlas-auth.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({success:report.success,passed:steps.length,emailMessagesAccepted:report.emailMessagesAccepted,testDatabaseRemoved:report.testDatabaseRemoved}));
  }
}
main().catch(error=>{console.error('Auth test setup failed:',error.name);process.exitCode=1;});
