const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { connectToDatabase } = require('./lib/mongo'); // MongoDB connection

const app = express();
const PORT = 3000;

// ---------- middleware ----------
app.use(cors({ origin: ['http://localhost:3000', 'https://talent-konnect-repo.vercel.app'], credentials: true }));
app.use(express.json());

// ---------- helpers ----------
const DB = path.join(process.cwd(), 'api', '_raffle.json'); // Path to your local DB

// Function to read data from the local database (for local dev)
function readDb() {
  try { return JSON.parse(fs.readFileSync(DB, 'utf-8')); }
  catch { return { tickets: {}, payments: [], users: {}, credits: {}, submissions: [] }; }
}

// Function to write data back to the local database
function writeDb(data) {
  fs.mkdirSync(path.dirname(DB), { recursive: true });
  fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}

// ---------- endpoints ----------

// Health check endpoint
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Raffle: credit entries + log "payment"
app.post('/api/raffle/credit', async (req, res) => {
  const { userId, entries } = req.body || {};
  const uid = String(userId || '').trim();
  const n = Number(entries || 0);

  if (!uid || !n || n < 1) return res.status(400).json({ error: 'userId and entries required' });

  try {
    const { db } = await connectToDatabase(); // Mongo connection

    const ticketsCollection = db.collection('tickets'); // MongoDB collection for storing tickets

    // Update ticket count in MongoDB
    const existingUser = await ticketsCollection.findOne({ userId: uid });
    if (existingUser) {
      await ticketsCollection.updateOne({ userId: uid }, { $inc: { tickets: n } });
    } else {
      await ticketsCollection.insertOne({ userId: uid, tickets: n });
    }

    const paymentId = 'pay_' + Math.random().toString(36).slice(2, 10);
    const payment = {
      paymentId,
      userId: uid,
      entries: n,
      amount: n * 100, // amount in cents
      timestamp: new Date().toISOString(),
      source: 'local_mock_or_payment_link'
    };

    // Log payment in local DB
    const dbLocal = readDb();
    dbLocal.payments.push(payment);
    writeDb(dbLocal);

    res.json({ ok: true, userId: uid, entries: n, paymentId, totalTickets: (existingUser ? existingUser.tickets + n : n) });
  } catch (error) {
    console.error('[credit error]', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Query tickets
app.get('/api/raffle/tickets/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { db } = await connectToDatabase();
    const ticketsCollection = db.collection('tickets');
    const userTickets = await ticketsCollection.findOne({ userId });

    if (userTickets) {
      return res.status(200).json({ userId, tickets: userTickets.tickets });
    } else {
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('[tickets error]', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Payments log (optional)
app.get('/api/raffle/payments', (_req, res) => {
  const db = readDb();
  const payments = db.payments.slice(0, 50);
  res.json({ payments });
});

// --------- Daily Spotlight (deterministic) ---------
function pickWinner(db) {
  const subs = db.submissions || [];
  subs.sort((a, b) => (b.points - a.points) || (new Date(a.submittedAt) - new Date(b.submittedAt)) || String(a.id).localeCompare(String(b.id)));
  return subs[0];
}

function runSpotlightOnce() {
  const db = readDb();
  const winner = pickWinner(db);
  const nowUTC = new Date().toISOString();
  const today = nowUTC.slice(0, 10);

  // ensure objects exist
  db.credits = db.credits || {};
  db.users = db.users || {};
  db.spotlight = db.spotlight || {};
  db.emails = db.emails || [];

  // idempotent: only credit once per day
  if (db.spotlight.date !== today) {
    db.credits[winner.id] = (db.credits[winner.id] || 0) + 100;

    const u = db.users[winner.id] || { id: winner.id, credits: 0, raffleTickets: db.tickets?.[winner.id] || 0 };
    u.credits = (u.credits || 0) + 100;
    db.users[winner.id] = u;

    db.spotlight.date = today;
    db.spotlight.credited = true;
    db.spotlight.creditsGranted = 100;
  }

  // always update winner + timestamps
  db.spotlight.winner = winner;
  db.spotlight.selectedAtUTC = nowUTC;
  db.spotlight.nextSelectionUTC = next10amISTasUTC().toISOString();

  // log a "sent" email (demo)
  db.emails.push({
    to: winner.name,
    subject: "You're Today's Daily Spotlight Winner!",
    body: `Congrats ${winner.name}! "${winner.title}" won with ${winner.points} points. 100 credits added.`,
    timestamp: nowUTC
  });

  writeDb(db);
  console.log(`[cron] Spotlight: ${winner.name} (${winner.points}) — credited 100 (once per day).`);
  return db.spotlight;
}

function scheduleDailySpotlight(runOnceFn) {
  function planNext() {
    const nextUTC = next10amISTasUTC();
    const ms = nextUTC - new Date();
    console.log('[cron] Next selection at', nextUTC.toISOString(), '(UTC)');
    setTimeout(async () => {
      try { await runOnceFn(); } catch (e) { console.error('[cron] run error', e); }
      planNext(); // schedule the following day
    }, ms);
  }
  planNext();
}

// Scheduler: Next 10:00 IST selection
scheduleDailySpotlight(async () => {
  const spot = runSpotlightOnce(); // your deterministic pick; also writes db.spotlight
  const db = readDb();
  db.spotlight = db.spotlight || {};
  db.spotlight.nextSelectionUTC = next10amISTasUTC().toISOString();
  writeDb(db);
  console.log('[cron] picked winner:', spot?.winner?.name);
});

// ---------- start server ----------
app.listen(PORT, () => {
  console.log(`✅ Local API running at http://localhost:${PORT}`);
});
