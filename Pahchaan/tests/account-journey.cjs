/* eslint-disable @typescript-eslint/no-require-imports */
// Disposable MongoDB and a loopback SMTP inbox. No real credentials or mail.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const Module = require('node:module');
const ts = require('typescript');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(request, ...args) {
  return resolve.call(this, request.startsWith('@/') ? path.join(root, 'src', request.slice(2)) : request, ...args);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }, fileName: filename,
}).outputText, filename);

async function main() {
  const inbox = [];
  const sockets = new Set();
  const smtp = net.createServer(socket => {
    sockets.add(socket); socket.on('close', () => sockets.delete(socket));
    socket.setEncoding('utf8'); socket.write('220 localhost test inbox\r\n');
    let buffer = '', data = null;
    socket.on('data', chunk => {
      buffer += chunk;
      while (buffer.includes('\r\n')) {
        const i = buffer.indexOf('\r\n'), line = buffer.slice(0, i); buffer = buffer.slice(i + 2);
        if (data !== null) {
          if (line === '.') { inbox.push(data); data = null; socket.write('250 queued\r\n'); }
          else data += line + '\r\n';
        } else if (/^EHLO/.test(line)) socket.write('250-localhost\r\n250 AUTH PLAIN\r\n');
        else if (/^AUTH/.test(line)) socket.write('235 authenticated\r\n');
        else if (/^DATA/.test(line)) { data = ''; socket.write('354 send mail\r\n'); }
        else if (/^QUIT/.test(line)) socket.end('221 bye\r\n');
        else socket.write('250 OK\r\n');
      }
    });
  });
  await new Promise(resolve => smtp.listen(0, '127.0.0.1', resolve));
  // Only this isolated loopback sink omits TLS. Production transport retains TLS.
  const mail = require('nodemailer'), createTransport = mail.createTransport.bind(mail);
  mail.createTransport = options => {
    assert.equal(options.host, '127.0.0.1'); assert.equal(options.requireTLS, true);
    return createTransport({ ...options, requireTLS: false });
  };
  let mongo, client;
  try {
    mongo = await MongoMemoryReplSet.create({
      binary: { systemBinary: path.join(root, 'node_modules/.cache/mongodb-memory-server/mongod-x64-win32-8.2.6.exe'), version: '8.2.6' },
      replSet: { count: 1, storageEngine: 'wiredTiger' },
    });
    Object.assign(process.env, { MONGODB_URI: mongo.getUri('account_journey'), NODE_ENV: 'test',
      NEXTAUTH_SECRET: 'isolated-account-journey-secret-32-characters', NEXTAUTH_URL: 'http://localhost:3000/pahchaan/api/auth',
      JOB_WORKER_SECRET: 'isolated-worker-secret-over-32-characters', JOB_ENCRYPTION_KEY: require('crypto').randomBytes(32).toString('base64'),
      SMTP_HOST: '127.0.0.1', SMTP_PORT: String(smtp.address().port), SMTP_USER: 'test', SMTP_PASS: 'test', SMTP_FROM: 'test@example.test' });
    const from = file => require(path.join(root, 'src', file));
    client = await from('infrastructure/db.ts').default(); const db = client.db();
    const { POST } = from('app/api/account/[action]/route.ts');
    const { AccountService } = from('application/services/AccountService.ts');
    const { JobQueueService } = from('application/services/JobQueue.ts');
    const credentials = from('lib/auth.ts').authOptions.providers.find(p => p.id === 'credentials').options.authorize;
    const post = (action, body) => POST(new Request('http://localhost:3000/pahchaan/api/account/' + action, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' }, body: JSON.stringify(body),
    }), { params: Promise.resolve({ action }) });
    const key = process.env.JOB_ENCRYPTION_KEY; process.env.JOB_ENCRYPTION_KEY = 'invalid';
    assert.equal((await post('register', { email: 'blocked@example.test' })).status, 503);
    assert.equal(await db.collection('users').countDocuments(), 0);
    // Also prove service-level failures roll back the pending user.
    await assert.rejects(AccountService.register('rollback@example.test'));
    assert.equal(await db.collection('users').countDocuments(), 0);
    process.env.JOB_ENCRYPTION_KEY = key;
    const email = 'owner@example.test', password = 'A long unique testing passphrase';
    assert.equal((await post('register', { email: ' Owner@example.test ' })).status, 202);
    assert.equal((await db.collection('users').findOne({ email })).passwordHash, undefined);
    assert.equal(await credentials({ email, password }), null);
    assert.equal(await JobQueueService.runNext(), true);
    assert.equal(inbox.length, 1);
    function token() {
      const decoded = inbox.at(-1).replace(/=\r\n/g, '').replace(/=3D/g, '=');
      const match = decoded.match(/token=([a-f0-9]{64})/); assert(match); return match[1];
    }
    const verification = token();
    assert.equal((await post('check', { token: verification, purpose: 'verify' })).status, 200);
    assert.equal((await post('check', { token: verification, purpose: 'reset' })).status, 400);
    assert.equal(await db.collection('auth_tokens').countDocuments(), 1);
    assert.equal((await post('verify', { token: verification, password })).status, 200);
    assert.equal((await post('verify', { token: verification, password })).status, 400);
    assert.equal((await post('check', { token: verification, purpose: 'verify' })).status, 400);
    assert(await credentials({ email, password }));
    assert.equal((await post('forgot', { email })).status, 202);
    await JobQueueService.runNext(); assert.equal(inbox.length, 2);
    const recovery = token(), newPassword = 'Another long unique testing passphrase';
    assert.equal((await post('check', { token: recovery, purpose: 'reset' })).status, 200);
    assert.equal((await post('reset', { token: recovery, password: newPassword })).status, 200);
    assert.equal(await credentials({ email, password }), null);
    assert(await credentials({ email, password: newPassword }));
    assert.equal((await post('reset', { token: recovery, password: newPassword })).status, 400);
    assert.equal(await db.collection('jobs').countDocuments({ status: 'completed' }), 2);
    await AccountService.register('expired@example.test');
    const record = await db.collection('auth_tokens').findOne();
    const pending = await db.collection('jobs').findOne({status:'pending'});
    const raw = from('lib/job-encryption.ts').decryptJobPayload(pending.encryptedPayload).html.match(/token=([a-f0-9]{64})/)[1];
    await db.collection('auth_tokens').updateOne({_id:record._id},{$set:{expiresAt:new Date(Date.now()-1000)}});
    assert.equal((await post('check',{token:raw,purpose:'verify'})).status,400);
    assert.equal((await post('verify',{token:raw,password})).status,400);
    const { RateLimitService } = from('application/services/RateLimitService.ts');
    const consume = RateLimitService.consume;
    try {
      RateLimitService.consume = async () => false;
      await assert.rejects(credentials({email,password}), /TooManyAttempts/);
      RateLimitService.consume = async () => { throw new Error('private database details'); };
      await assert.rejects(credentials({email,password}), error => error.message === 'AccountUnavailable');
    } finally { RateLimitService.consume = consume; }
    const outage = new (require('mongodb').MongoNetworkError)('getaddrinfo ENOTFOUND private-test-host');
    const { httpError } = from('lib/http.ts');
    const unavailable = httpError(outage);
    assert.equal(unavailable.status,503);
    assert.equal(unavailable.headers.get('retry-after'),'30');
    assert.equal((await unavailable.json()).code,'DATABASE_UNAVAILABLE');
    const runNext = JobQueueService.runNext;
    try {
      JobQueueService.runNext = async () => { throw outage; };
      const worker = from('app/api/internal/jobs/route.ts');
      const failure = await worker.POST(new Request('http://localhost/pahchaan/api/internal/jobs',{
        method:'POST',headers:{Authorization:'Bearer '+process.env.JOB_WORKER_SECRET},
      }));
      assert.equal(failure.status,503);
      assert(!(await failure.text()).includes('private-test-host'));
    } finally { JobQueueService.runNext = runNext; }
    // Deliver a real multipart QR email through the same queue and SMTP sink.
    await db.collection('jobs').deleteMany({status:'pending'});
    const {EmailService}=from('application/services/EmailService.ts');
    await EmailService.sendGuestBadge('test-workspace',{_id:'test-event',name:'Welcome Summit',date:new Date('2026-12-01T09:00:00Z'),venue:'Patna'},'guest@example.test','Asha',JSON.stringify({guestId:'unique-test-guest'}));
    const before=inbox.length;
    assert(await JobQueueService.runNext());
    assert.equal(inbox.length,before+1);
    assert(inbox.at(-1).includes('Content-ID: <check-in-qr>'));
    assert(inbox.at(-1).includes('image/png'));
    assert(inbox.at(-1).includes('Check-in-QR.png'));
    assert.equal(await db.collection('jobs').countDocuments({status:'pending'}),0);
    console.log('PASS: config failure, transaction rollback, email-first signup, SMTP inbox, verification, login, recovery, replay rejection and multipart QR delivery.');
  } finally {
    if (client) await client.close(); if (mongo) await mongo.stop();
    for (const socket of sockets) socket.destroy();
    await new Promise(resolve => smtp.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
