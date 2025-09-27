// server.local.cjs — All APIs combined
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

const SITE_URL = process.env.SITE_URL || '';
const CORS_ORIGIN = process.env.CORS_ORIGIN || SITE_URL;

app.use(express.json());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin) || origin === CORS_ORIGIN) return cb(null, true);
    return cb(new Error('Not allowed'), false);
  }
}));

// ---------- DB helpers ----------
const LOCAL_DB = path.join(process.cwd(), 'api', '_raffle.json');

async function getMongoDB() {
  try {
    if (!process.env.MONGO_URI) return null;
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    return client.db();
  } catch (e) {
    console.warn('MongoDB connection failed, falling back to local JSON', e.message);
    return null;
  }
}

function readLocalDB() {
  try { return JSON.parse(fs.readFileSync(LOCAL_DB, 'utf-8')); }
  catch { return { tickets:{}, users:{}, raffle:{history:[]}, spotlight:{}, credits:{}, emails:[], submissions:[] }; }
}

function writeLocalDB(db) {
  fs.mkdirSync(path.dirname(LOCAL_DB), { recursive: true });
  fs.writeFileSync(LOCAL_DB, JSON.stringify(db,null,2));
}

// ---------- Helpers ----------
function next10amISTasUTC() {
  const now = new Date();
  const nowIST = new Date(now.toLocaleString('en-US', { timeZone:'Asia/Kolkata' }));
  const target = new Date(nowIST); target.setHours(10,0,0,0);
  if (target <= nowIST) target.setDate(target.getDate()+1);
  return new Date(target.toLocaleString('en-US',{ timeZone:'UTC' })).toISOString();
}

function pickRaffleWinner(db) {
  const entries = db.tickets || {};
  const pool = [];
  for (const [uid,count] of Object.entries(entries)) for(let i=0;i<count;i++) pool.push(uid);
  if (!pool.length) return null;
  const idx = Number(new Date().toISOString().slice(0,10).replace(/-/g,'')) % pool.length;
  const winnerId = pool[idx];
  return { userId:winnerId, tickets:entries[winnerId]||0 };
}

function pickSpotlightWinner(db) {
  const subs = db.submissions?.length ? db.submissions : [
    { id: 'u1', name: 'Alex Kumar', points: 847, title: 'Advanced React Performance Optimization Techniques', submittedAt:'2025-08-14T03:00:00Z' },
    { id: 'u2', name: 'Priya N', points: 802, title: 'Type-safe APIs with Zod + tRPC', submittedAt:'2025-08-14T04:30:00Z' },
    { id: 'u3', name: 'Rahul S', points: 780, title: 'Edge caching patterns for SPA', submittedAt:'2025-08-14T05:00:00Z' },
    { id: 'u4', name: 'Meera T', points: 765, title: 'Queue + Cron for reliable jobs', submittedAt:'2025-08-14T06:00:00Z' },
  ];
  subs.sort((a,b)=>(b.points-a.points) || (new Date(a.submittedAt)-new Date(b.submittedAt)) || a.id.localeCompare(b.id));
  return subs[0];
}

// ---------- Cron Jobs ----------
async function runDailySpotlight() {
  const db = await getMongoDB() || readLocalDB();
  const winner = pickSpotlightWinner(db);
  const nowUTC = new Date().toISOString();
  const today = nowUTC.slice(0,10);

  db.spotlight = db.spotlight || {};
  if (db.spotlight.date !== today) {
    db.credits = db.credits || {};
    db.credits[winner.id] = (db.credits[winner.id]||0) + 100;
    db.spotlight.creditsGranted = 100;
    db.spotlight.credited = true;
  }
  db.spotlight.date = today;
  db.spotlight.winner = winner;
  db.spotlight.selectedAtUTC = nowUTC;
  db.spotlight.nextSelectionUTC = next10amISTasUTC();

  db.emails = db.emails || [];
  db.emails.push({ to:winner.name, subject:"Daily Spotlight Winner!", body:`Congrats ${winner.name}`, timestamp:nowUTC });

  if (!db.collection) writeLocalDB(db);
  console.log(`[cron] Spotlight winner: ${winner.name} (+100 credits)`);
}

function scheduleDailySpotlight() {
  const nextUTC = new Date(next10amISTasUTC());
  const delay = nextUTC - new Date();
  setTimeout(async () => { await runDailySpotlight(); scheduleDailySpotlight(); }, Math.max(1000, delay));
}
scheduleDailySpotlight();

function scheduleRaffle() {
  const nextUTC = new Date();
  nextUTC.setHours(nextUTC.getHours(), nextUTC.getMinutes()+1); // every 1 min demo
  setTimeout(async function plan() {
    const db = await getMongoDB() || readLocalDB();
    const win = pickRaffleWinner(db);
    if (win) {
      db.raffle = db.raffle || { history:[] };
      db.raffle.lastWinner = win;
      db.raffle.history.push(win);
      if (!db.collection) writeLocalDB(db);
      console.log(`[cron] Raffle winner: ${win.userId}`);
    }
    setTimeout(plan, 60*60*1000); // 1 hour for production
  }, nextUTC - new Date());
}
scheduleRaffle();

// ---------- API Endpoints ----------

// Health
app.get('/api/health', (_req,res)=>res.json({ ok:true }));

// Qualification
app.post('/api/qualify', (req,res)=>{
  const { path:userPath, skill, fun, feedback } = req.body || {};
  if (!userPath) return res.status(400).json({ error:'Path required' });
  if (userPath==='paid' && (!skill||!fun||!feedback)) return res.status(400).json({ error:'All fields required' });
  return res.json({ message:'Qualification submitted', token:'ticket_'+Math.random().toString(36).slice(2,10), tier:userPath==='paid'?'paid':'free' });
});

// Raffle
app.post('/api/raffle/credit', async (req,res)=>{
  const { userId, entries } = req.body || {};
  const uid = String(userId||'').trim(); const n = Number(entries||0);
  if (!uid || !n || n<1) return res.status(400).json({ error:'userId and entries required' });
  const db = await getMongoDB() || readLocalDB();
  if (db.collection) {
    const coll = db.collection('tickets'); await coll.updateOne({ userId:uid }, { $inc:{ tickets:n } }, { upsert:true });
  } else { db.tickets[uid] = (db.tickets[uid]||0)+n; writeLocalDB(db); }
  res.json({ ok:true, userId:uid, entries:n, totalTickets: db.tickets?.[uid]||n });
});

app.get('/api/raffle/tickets/:userId', async (req,res)=>{
  const uid = String(req.params.userId||'').trim();
  const db = await getMongoDB() || readLocalDB();
  let tickets = 0;
  if (db.collection) { const coll = db.collection('tickets'); const doc = await coll.findOne({ userId:uid }); tickets = doc?.tickets||0; }
  else tickets = db.tickets?.[uid]||0;
  res.json({ userId:uid, tickets });
});

app.get('/api/raffle/winner', async (_req,res)=>{
  const db = await getMongoDB() || readLocalDB();
  const win = pickRaffleWinner(db);
  db.raffle = db.raffle || { history:[] };
  db.raffle.lastWinner = win;
  db.raffle.history.push(win);
  if (!db.collection) writeLocalDB(db);
  res.json({ winner:win });
});

// Spotlight
app.get('/api/spotlight/current', async (_req,res)=>{
  const db = await getMongoDB() || readLocalDB();
  const spot = db.spotlight || {};
  res.json({
    date: spot.date||new Date().toISOString().slice(0,10),
    nextSelectionUTC: spot.nextSelectionUTC||next10amISTasUTC(),
    winner: spot.winner||{ id:'u1', name:'Alex', points:100, title:'Demo' },
    creditsGranted: spot.creditsGranted||100
  });
});

app.post('/api/spotlight/run', async (_req,res)=>{
  await runDailySpotlight();
  res.json({ ok:true });
});

app.post('/api/spotlight/email', async (_req,res)=>{
  const db = await getMongoDB() || readLocalDB();
  if (!db.spotlight?.winner) await runDailySpotlight();
  const winner = db.spotlight.winner;
  db.emails = db.emails || [];
  db.emails.push({ to:winner.name, subject:"Today's Spotlight", body:`Congrats ${winner.name}`, timestamp:new Date().toISOString() });
  if (!db.collection) writeLocalDB(db);
  res.json({ ok:true, sentAt:new Date().toISOString(), to:winner.name });
});

// Users / Credits
app.get('/api/users', async (_req,res)=>{
  const db = await getMongoDB() || readLocalDB();
  res.json({ users:Object.values(db.users||{}) });
});

app.get('/api/users/:id', async (req,res)=>{
  const uid = String(req.params.id||'').trim();
  const db = await getMongoDB() || readLocalDB();
  const u = db.users?.[uid] || { id:uid, credits:db.credits?.[uid]||0, raffleTickets:db.tickets?.[uid]||0 };
  db.users = db.users||{}; db.users[uid]=u;
  if (!db.collection) writeLocalDB(db);
  res.json(u);
});

app.get('/api/credits/:userId', async (req,res)=>{
  const uid = String(req.params.userId||'').trim();
  const db = await getMongoDB() || readLocalDB();
  res.json({ userId:uid, credits: db.credits?.[uid]||0 });
});

// Start server
app.listen(PORT, ()=>console.log(`✅ Local API running at http://localhost:${PORT}`));
