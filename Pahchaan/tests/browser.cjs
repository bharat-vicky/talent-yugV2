/* eslint-disable @typescript-eslint/no-require-imports */
const {chromium}=require('@playwright/test');
const path=require('node:path');
module.exports=async function browserChecks({base,db,test,assert,event,a,second,password}){
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  await db.collection('users').updateOne({email:'owner@example.com'},{$set:{lastActiveWorkspaceId:a._id}});
  const context=await browser.newContext();const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await test('BROWSER Pahchaan landing branding, journey and payment-free content',async()=>{
   await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/');await page.getByRole('heading',{name:/Every gathering/}).waitFor();await page.locator('.welcome-pass').waitFor();await page.screenshot({path:path.join(__dirname,'../docs/test-results/pahchaan-home.png')});
   const body=await page.locator('body').innerText();assert(!/Identity|pricing|subscription|billing|payment|\$\d|₹/i.test(body));assert((await page.title()).includes('Pahchaan'));
   await page.getByRole('tab',{name:/Know your guests/}).click();await page.getByRole('tabpanel').getByRole('list').getByText('Guest groups, notes, and details',{exact:true}).waitFor();await page.getByRole('tab',{name:/Know your guests/}).press('ArrowRight');assert.equal(await page.getByRole('tab',{name:/Open the doors/}).getAttribute('aria-selected'),'true');
   await page.getByText('What can I manage with Pahchaan?',{exact:true}).click();assert(await page.getByText('Create events, collect registrations, organize guests, design QR passes, manage check-ins, and follow event analytics from a shared workspace.',{exact:true}).isVisible());await page.screenshot({path:path.join(__dirname,'../docs/test-results/pahchaan-home-desktop.png'),fullPage:true});assert.equal(errors.length,0,errors.join('\n'));
  });
  await test('BROWSER Pahchaan mobile navigation has no horizontal overflow',async()=>{
   await page.setViewportSize({width:390,height:844});await page.goto(base+'/');await page.getByRole('button',{name:'Open navigation',exact:true}).click();await page.getByRole('navigation',{name:'Mobile navigation',exact:true}).getByRole('link',{name:'The experience',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Open navigation',exact:true}).getAttribute('aria-expanded'),'false');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));await page.goto(base+'/');await page.screenshot({path:path.join(__dirname,'../docs/test-results/pahchaan-home-mobile.png'),fullPage:true});await page.setViewportSize({width:1440,height:1000});
  });
  await test('BROWSER password login reaches authenticated dashboard',async()=>{
   await page.goto(base+'/login');await page.locator('#auth-email').waitFor();await page.waitForFunction(()=>{let element=document.querySelector('#auth-email');while(element){if(Number(getComputedStyle(element).opacity)<.99)return false;element=element.parentElement;}return true;});await page.screenshot({path:path.join(__dirname,'../docs/test-results/pahchaan-login.png'),fullPage:true});await page.locator('#auth-email').fill('owner@example.com');await page.locator('#auth-password').fill(password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('**/dashboard',{timeout:20000});assert.equal(errors.length,0,errors.join('\n'));await page.screenshot({path:path.join(__dirname,'../docs/test-results/pahchaan-dashboard.png'),fullPage:true});
  });
  await test('BROWSER form builder hydrates and renders questions',async()=>{
   await page.goto(base+`/events/${event._id}/registration`);await page.locator('input[value="First Name"]').first().waitFor({timeout:15000});assert.equal(errors.length,0,errors.join('\n'));
  });
  await test('BROWSER Guest Library exports selected registration data by mouse and keyboard',async()=>{
   const {ObjectId}=require('mongodb'),fs=require('node:fs'),Papa=require('papaparse');
   const selectedId=new ObjectId(),otherId=new ObjectId();
   await db.collection('guests').insertMany([
    {_id:selectedId,workspaceId:a._id,eventId:event._id,firstName:'Export',lastName:'Selected',email:'selected-export@example.test',phone:'+919876543210',status:'approved',organization:'Company, "Quoted"',customData:{Comment:'पहचान\nWelcome',Formula:'=1+1'},groupIds:[],tags:[],checkIns:[],createdAt:new Date(),updatedAt:new Date()},
    {_id:otherId,workspaceId:a._id,eventId:event._id,firstName:'Export',lastName:'Other',email:'other-export@example.test',status:'approved',groupIds:[],tags:[],checkIns:[],createdAt:new Date(),updatedAt:new Date()}
   ]);
   try {
    await page.goto(base+`/events/${event._id}/guests`);
    await page.getByPlaceholder('Search by name, email, or company...').fill('export@example.test');
    await page.getByRole('checkbox',{name:'Select Export Selected',exact:true}).check();
    await page.getByRole('button',{name:'More Actions',exact:true}).click();
    const downloaded=page.waitForEvent('download');
    await page.getByRole('menuitem',{name:'Export Selected',exact:true}).click();
    const download=await downloaded;
    assert(download.suggestedFilename().endsWith('.csv'));assert.equal(await download.failure(),null);
    const text=fs.readFileSync(await download.path(),'utf8');
    assert(text.startsWith('\uFEFF'));
    const rows=Papa.parse(text,{header:true,skipEmptyLines:true});assert.equal(rows.errors.length,0);
    assert.equal(rows.data.length,1);assert.equal(rows.data[0].Email,'selected-export@example.test');
    assert.equal(rows.data[0].Organization,'Company, "Quoted"');assert.equal(rows.data[0]['Registration: Comment'],'पहचान\nWelcome');assert.equal(rows.data[0]['Registration: Formula'],"'=1+1");
    await page.getByText('Export started for 1 guest',{exact:true}).waitFor();
    await page.screenshot({path:path.join(__dirname,'../docs/test-results/guest-export.png'),fullPage:true});
    await page.getByRole('button',{name:'More Actions',exact:true}).click();
    const keyboardDownload=page.waitForEvent('download');
    await page.getByRole('menuitem',{name:'Export Selected',exact:true}).focus();
    await page.getByRole('menuitem',{name:'Export Selected',exact:true}).press('Enter');
    assert.equal(await (await keyboardDownload).failure(),null);
    await page.goto(base+`/events/${event._id}/guests/${selectedId}/badge`);
    await page.getByRole('button',{name:'Send Invitation',exact:true}).waitFor();
    const responsePromise=page.waitForResponse(response=>response.url().endsWith('/guests/notify') && response.request().method()==='POST');
    await page.getByRole('button',{name:'Send Invitation',exact:true}).click();
    const response=await responsePromise;assert.equal(response.status(),202);assert.equal((await response.json()).count,1);
    const job=await db.collection('jobs').findOne({type:'email',eventId:event._id},{sort:{createdAt:-1}});
    const payload=require('../src/lib/job-encryption.ts').decryptJobPayload(job.encryptedPayload);
    assert.equal(payload.to,'selected-export@example.test');
    const pdf=payload.attachments.find(item=>item.filename==='Badge.pdf');assert(pdf);assert.equal(Buffer.from(pdf.content,'base64').subarray(0,5).toString(),'%PDF-');
    assert(payload.attachments.some(item=>item.filename==='Check-in-QR.png'));
    await page.getByText('Invitation queued with badge attached. Delivery will follow shortly.',{exact:true}).waitFor();
    await page.screenshot({path:path.join(__dirname,'../docs/test-results/badge-invitation.png'),fullPage:true});
    await page.goto(base+`/events/${event._id}/guests`);
    await page.getByPlaceholder('Search by name, email, or company...').fill('Other');
    assert.equal(await page.getByRole('button',{name:'More Actions',exact:true}).count(),0);
   } finally { await db.collection('guests').deleteMany({_id:{$in:[selectedId,otherId]}}); }
  });
  await test('BROWSER Pahchaan syncs scans saved in the existing offline database',async()=>{
   const {ObjectId}=require('mongodb'),id=new ObjectId(),owner=await db.collection('users').findOne({email:'owner@example.com'});await db.collection('qr_codes').insertOne({_id:id,workspaceId:a._id,eventId:event._id,status:'active',name:'Legacy offline queue fixture',scanCount:0});
   await page.evaluate(async ({eventId,operatorId,ticketId})=>{await new Promise((resolve,reject)=>{const opening=indexedDB.open('IdentityScannerDB',1);opening.onupgradeneeded=()=>{const store=opening.result.createObjectStore('scans',{keyPath:'id'});store.createIndex('by-event','eventId');store.createIndex('by-status','syncStatus');};opening.onerror=()=>reject(opening.error);opening.onsuccess=()=>{const database=opening.result,transaction=database.transaction('scans','readwrite');transaction.objectStore('scans').put({id:'legacy-offline-browser',eventId,operatorId,qrPayload:ticketId,direction:'in',timestamp:new Date(),scannerId:'test',method:'qr_scan',retryCount:0,syncStatus:'pending'});transaction.oncomplete=()=>{database.close();resolve();};transaction.onerror=()=>reject(transaction.error);};});},{eventId:event._id,operatorId:owner._id.toString(),ticketId:id.toString()});
   const pending=page.waitForResponse(response=>response.url().includes(`/events/${event._id}/scanner/sync`)&&response.request().method()==='POST',{timeout:20000});await page.goto(base+`/events/${event._id}/scanner`);const result=await pending;assert.equal(result.status(),200);assert.equal((await result.json()).results['legacy-offline-browser'].status,'success');assert.equal((await db.collection('qr_codes').findOne({_id:id})).admissionState,'in');
  });
  await test('BROWSER mobile navigation and workspace switching',async()=>{
   await page.setViewportSize({width:390,height:844});await page.goto(base+'/dashboard');await page.getByRole('button',{name:'Toggle Menu'}).click();await page.getByRole('combobox').filter({hasText:a.name}).click();const switched=page.waitForResponse(response=>response.url().endsWith('/api/workspaces/active')&&response.request().method()==='POST');await page.getByRole('menuitem').filter({hasText:second.name}).click();assert.equal((await switched).status(),200);await page.waitForURL('**/dashboard');
   const user=await db.collection('users').findOne({email:'owner@example.com'});assert.equal(user.lastActiveWorkspaceId,second._id);assert.equal(errors.length,0,errors.join('\n'));await page.screenshot({path:path.join(__dirname,'../docs/test-results/mobile-dashboard.png'),fullPage:true});
  });
  await context.close();
  const anon=await browser.newContext(),signup=await anon.newPage();
  await test('BROWSER email signup queues verification and remains signed out',async()=>{
   await signup.goto(base+'/signup');await signup.locator('#auth-email').fill('browser-signup@example.com');assert.equal(await signup.locator('#auth-password').count(),0);await signup.getByRole('button',{name:'Continue with email',exact:true}).click();await signup.getByText(/Check your inbox/).waitFor({timeout:15000});
   const user=await db.collection('users').findOne({email:'browser-signup@example.com'});assert(user);assert(!user.emailVerified);await signup.goto(base+'/dashboard');await signup.waitForURL('**/login?**');
  });
  await anon.close();
 }finally{await browser.close();}
};

