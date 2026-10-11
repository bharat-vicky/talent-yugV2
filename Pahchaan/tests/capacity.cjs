/* eslint-disable @typescript-eslint/no-require-imports */
module.exports = async function ({from,db,test,assert,event,owner,setSession}) {
  const {ObjectId}=require('mongodb');
  const {JobQueueService:queue}=from('application/services/JobQueue.ts');
  const {EmailService}=from('application/services/EmailService.ts');
  const jobs=db.collection('jobs'),pending=await jobs.find({status:'pending'}).toArray();
  await jobs.updateMany({status:'pending'},{$set:{availableAt:new Date(Date.now()+86400000)}});
  const deliver=EmailService.deliver;
  try {
    await test('Email retry policy distinguishes quota, permanent and transient failure',async()=>{
      const {jobRetry}=from('lib/job-retry.ts');
      assert(jobRetry({responseCode:550},1,true).failed);
      assert(!jobRetry({responseCode:550,response:'Daily sending limit exceeded'},1,true).failed);
      assert.equal(jobRetry({responseCode:550,response:'Daily sending limit exceeded'},1,true).delay,3600000);
      assert(!jobRetry({code:'ETIMEDOUT'},5,true).failed);
      assert(jobRetry({},30,true).failed);assert(jobRetry({},5,false).failed);
    });
    await test('Urgent email bypasses invitations; expired OTP never sends',async()=>{
      const sent=[];EmailService.deliver=async payload=>sent.push(payload.to);
      await queue.enqueue('email',{workspaceId:'capacity-test',to:'ordinary@example.test'});
      await queue.enqueue('email',{workspaceId:'capacity-test',to:'urgent@example.test'},{priority:100,deliveryDeadline:new Date(Date.now()+600000)});
      const expired=await queue.enqueue('email',{workspaceId:'capacity-test',to:'expired@example.test'},{priority:100,deliveryDeadline:new Date(0)});
      await queue.runNext();assert.deepEqual(sent,['urgent@example.test']);
      await queue.runNext();assert.deepEqual(sent,['urgent@example.test','ordinary@example.test']);
      assert.equal((await jobs.findOne({_id:new ObjectId(expired)})).status,'failed');
    });
    await test('Quota delay persists and permanent delivery rejection stops',async()=>{
      EmailService.deliver=async()=>{throw Object.assign(new Error('Fixture'),{responseCode:550,response:'Daily sending limit exceeded'});};
      const id=await queue.enqueue('email',{workspaceId:'capacity-test'});await queue.runNext();
      const stored=await jobs.findOne({_id:new ObjectId(id)});assert.equal(stored.status,'pending');assert(stored.availableAt.getTime()>Date.now()+3500000);
      EmailService.deliver=async()=>{throw Object.assign(new Error('Fixture'),{responseCode:550});};
      const rejected=await queue.enqueue('email',{workspaceId:'capacity-test'});await queue.runNext();assert.equal((await jobs.findOne({_id:new ObjectId(rejected)})).status,'failed');
      assert((await queue.health()).failedLastDay>=2);
    });
    await test('Shared proxy allows separate emails while keeping individual limits',async()=>{
      const {rateLimit}=from('lib/http.ts'),scope='capacity-'+Date.now(),req=new Request('http://localhost/');
      for(let i=0;i<60;i++)await rateLimit(req,scope,`person${i}@example.test`,5);
      for(let i=0;i<4;i++)await rateLimit(req,scope,'person0@example.test',5);
      await assert.rejects(()=>rateLimit(req,scope,'person0@example.test',5),/Too many requests/);
    });
    await test('Guest API bounds queries and returns every guest across stable pages',async()=>{
      setSession({user:{id:owner.id}});
      const route=from('app/api/events/[eventId]/guests/route.ts'),prefix='pagination-fixture';
      await db.collection('guests').insertMany(Array.from({length:55},(_,i)=>({workspaceId:event.workspaceId,eventId:event._id,firstName:prefix+i,status:'approved',createdAt:new Date(0)})));
      try {
        const get=qs=>route.GET({nextUrl:new URL('http://localhost/?'+qs)},{params:Promise.resolve({eventId:event._id})});
        for(const qs of ['limit=0','limit=-1','limit=101','limit=wat','page=0','page=1.5'])assert.equal((await get(qs)).status,400);
        const one=await(await get(`search=${prefix}&page=1`)).json(),two=await(await get(`search=${prefix}&page=2`)).json();
        assert.equal(one.data.length,50);assert.equal(two.data.length,5);assert.equal(two.meta.total,55);assert.equal(two.meta.totalPages,2);
        assert.equal(new Set([...one.data,...two.data].map(g=>g._id)).size,55);
      } finally {await db.collection('guests').deleteMany({firstName:{$regex:'^'+prefix}});}
    });
    await test('Registration response API paginates without losing older responses',async()=>{
      setSession({user:{id:owner.id}});
      const records=db.collection('registration_submissions');
      const ids=Array.from({length:55},()=>new ObjectId());
      await records.insertMany(ids.map(_id=>({_id,eventId:event._id,workspaceId:event.workspaceId,status:'pending',answers:{},submittedAt:new Date(0)})));
      try {
        const route=from('app/api/events/[eventId]/registration/submissions/route.ts');
        const total=await records.countDocuments({eventId:event._id});
        const pages=[];
        for(let page=1;page<=Math.ceil(total/50);page++){
          const res=await route.GET({nextUrl:new URL(`http://localhost/?page=${page}`)},{params:Promise.resolve({eventId:event._id})});
          assert.equal(res.status,200);assert.equal(Number(res.headers.get('X-Total-Count')),total);pages.push(...await res.json());
        }
        assert.equal(new Set(pages.map(item=>item._id)).size,total);
        for(const id of ids)assert(pages.some(item=>item._id===id.toString()));
      } finally {await records.deleteMany({_id:{$in:ids}});}
    });
  } finally {
    EmailService.deliver=deliver;
    await jobs.deleteMany({workspaceId:'capacity-test'});
    for(const job of pending)await jobs.updateOne({_id:job._id},{$set:{availableAt:job.availableAt}});
    setSession(null);
  }
};
