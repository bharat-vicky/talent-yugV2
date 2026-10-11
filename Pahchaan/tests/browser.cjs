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
  await test('BROWSER Pahchaan syncs scans saved in the existing offline database',async()=>{
   const {ObjectId}=require('mongodb'),id=new ObjectId(),owner=await db.collection('users').findOne({email:'owner@example.com'});await db.collection('qr_codes').insertOne({_id:id,workspaceId:a._id,eventId:event._id,status:'active',name:'Legacy offline queue fixture',scanCount:0});
   await page.evaluate(async ({eventId,operatorId,ticketId})=>{await new Promise((resolve,reject)=>{const opening=indexedDB.open('IdentityScannerDB',1);opening.onupgradeneeded=()=>{const store=opening.result.createObjectStore('scans',{keyPath:'id'});store.createIndex('by-event','eventId');store.createIndex('by-status','syncStatus');};opening.onerror=()=>reject(opening.error);opening.onsuccess=()=>{const database=opening.result,transaction=database.transaction('scans','readwrite');transaction.objectStore('scans').put({id:'legacy-offline-browser',eventId,operatorId,qrPayload:ticketId,direction:'in',timestamp:new Date(),scannerId:'test',method:'qr_scan',retryCount:0,syncStatus:'pending'});transaction.oncomplete=()=>{database.close();resolve();};transaction.onerror=()=>reject(transaction.error);};});},{eventId:event._id,operatorId:owner._id.toString(),ticketId:id.toString()});
   const pending=page.waitForResponse(response=>response.url().includes(`/events/${event._id}/scanner/sync`)&&response.request().method()==='POST',{timeout:20000});await page.goto(base+`/events/${event._id}/scanner`);const result=await pending;assert.equal(result.status(),200);assert.equal((await result.json()).results['legacy-offline-browser'].status,'success');assert.equal((await db.collection('qr_codes').findOne({_id:id})).admissionState,'in');
  });
  await test('BROWSER mobile navigation and workspace switching',async()=>{
   await page.setViewportSize({width:390,height:844});await page.goto(base+'/dashboard');await page.getByRole('button',{name:'Toggle Menu'}).click();await page.getByRole('combobox').filter({hasText:a.name}).click();await page.getByRole('menuitem').filter({hasText:second.name}).click();await page.waitForURL('**/dashboard');await page.waitForTimeout(1000);
   const user=await db.collection('users').findOne({email:'owner@example.com'});assert.equal(user.lastActiveWorkspaceId,second._id);assert.equal(errors.length,0,errors.join('\n'));await page.screenshot({path:path.join(__dirname,'../docs/test-results/mobile-dashboard.png'),fullPage:true});
  });
  await context.close();
  const anon=await browser.newContext(),signup=await anon.newPage();
  await test('BROWSER missing email configuration blocks signup clearly',async()=>{
   await signup.goto(base+'/signup');await signup.locator('#auth-email').fill('browser-signup@example.com');assert.equal(await signup.locator('#auth-password').count(),0);await signup.getByRole('button',{name:'Continue with email',exact:true}).click();await signup.getByRole('alert').filter({hasText:'Email signup is temporarily unavailable'}).waitFor({timeout:15000});
   const user=await db.collection('users').findOne({email:'browser-signup@example.com'});assert.equal(user,null);await signup.goto(base+'/dashboard');await signup.waitForURL('**/login?**');
  });
  await anon.close();
 }finally{await browser.close();}
};

