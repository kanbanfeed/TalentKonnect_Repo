// server.local.cjs  — Local API for dev (no Vercel needed)
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// ---------- middleware ----------
app.use(cors({ origin: /^http:\/\/localhost:\d+$/, credentials: false }));
app.use(express.json());

// ---------- helpers ----------
const DB = path.join(process.cwd(), 'api', '_raffle.json');

function readDb() {
  try { return JSON.parse(fs.readFileSync(DB, 'utf-8')); }
  catch { return { tickets: {}, payments: [], emails: [], credits: {}, submissions: [] }; }
}

function writeDb(data) {
  fs.mkdirSync(path.dirname(DB), { recursive: true });
  fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}

function next10amIST_UTC() {
  const now = new Date();
  const istNow = new Date(now.getTime() + 5.5 * 3600 * 1000);
  const target = new Date(istNow);
  target.setHours(10, 0, 0, 0);               // 10:00 IST today
  if (istNow >= target) target.setDate(target.getDate() + 1);
  const utc = new Date(target.getTime() - 5.5 * 3600 * 1000);
  return utc.toISOString();
}

// ---------- endpoints ----------

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Qualification Gate (simple validation)
app.post('/api/qualify', (req, res) => {
  const { path: userPath, skill, fun, feedback } = req.body || {};
  if (!userPath) return res.status(400).json({ error: 'Path is required' });
  if (userPath === 'paid' && (!skill || !fun || !feedback)) {
    return res.status(400).json({ error: 'All quiz fields are required' });
  }
  const ticketToken = `ticket_${Math.random().toString(36).slice(2, 10)}`;
  return res.status(200).json({
    message: 'Qualification submitted successfully',
    token: ticketToken,
    tier: userPath === 'paid' ? 'paid' : 'free',
  });
});

// Raffle: credit entries + log “payment”
app.post('/api/raffle/credit', (req, res) => {
  const { userId, entries } = req.body || {};
  const uid = String(userId || '').trim();
  const n = Number(entries || 0);
  if (!uid || !n || n < 1) return res.status(400).json({ error: 'userId and entries required' });

  const db = readDb();
  db.tickets[uid] = (db.tickets[uid] || 0) + n;

  const paymentId = 'pay_' + Math.random().toString(36).slice(2, 10);
  db.payments.push({
    paymentId,
    userId: uid,
    entries: n,
    amount: n * 100, // cents
    timestamp: new Date().toISOString(),
    source: 'local_mock_or_payment_link'
  });

  writeDb(db);
  res.json({ ok: true, userId: uid, entries: n, paymentId, totalTickets: db.tickets[uid] });
});

// Query tickets
app.get('/api/raffle/tickets/:userId', (req, res) => {
  const db = readDb();
  const uid = String(req.params.userId || '').trim();
  
  res.json({ userId: uid, tickets: db.tickets?.[uid] || 0 });
});

// Payments log (optional)
app.get('/api/raffle/payments', (_req, res) => {
  const db = readDb();
  const payments = Array.isArray(db.payments) ? [...db.payments].reverse().slice(0, 50) : [];
  res.json({ payments });
});

// --------- Daily Spotlight (deterministic) ---------
function pickWinner(db) {
  const subs = db.submissions?.length ? db.submissions : [
    { id: 'u1', name: 'Alex Kumar', points: 847, title: 'Advanced React Performance Optimization', submittedAt: '2025-08-14T03:00:00Z' },
    { id: 'u2', name: 'Priya N',    points: 802, title: 'Type-safe APIs with Zod + tRPC',         submittedAt: '2025-08-14T04:30:00Z' },
    { id: 'u3', name: 'Rahul S',    points: 780, title: 'Edge caching patterns for SPA',           submittedAt: '2025-08-14T05:00:00Z' },
  ];
  subs.sort((a, b) =>
    (b.points - a.points) ||
    (new Date(a.submittedAt) - new Date(b.submittedAt)) ||
    String(a.id).localeCompare(String(b.id))
  );
  return subs[0];
}

function runSpotlightOnce() {
  const db = readDb();
  const winner = pickWinner(db);
  const nowUTC = new Date().toISOString();
  const today = nowUTC.slice(0, 10);

  // ensure objects exist
  db.credits   = db.credits   || {};
  db.users     = db.users     || {};
  db.spotlight = db.spotlight || {};
  db.emails    = db.emails    || [];

  // 🔒 idempotent: only credit once per day
  if (db.spotlight.date !== today) {
    // update both maps so /api/credits/:id and /api/users/:id stay in sync
    db.credits[winner.id] = (db.credits[winner.id] || 0) + 100;

    const u = db.users[winner.id] || { id: winner.id, credits: 0, raffleTickets: db.tickets?.[winner.id] || 0 };
    u.credits = (u.credits || 0) + 100;
    db.users[winner.id] = u;

    db.spotlight.date           = today;
    db.spotlight.credited       = true;
    db.spotlight.creditsGranted = 100;
  }

  // always update winner + timestamps
  db.spotlight.winner         = winner;
  db.spotlight.selectedAtUTC  = nowUTC;
  db.spotlight.nextSelectionUTC = next10amISTasUTCDate().toISOString();

  // log a “sent” email (demo)
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
// === 10:00 IST scheduler helpers ===
function next10amISTasUTCDate() {
  const tz = 'Asia/Kolkata';
  const now = new Date();

  // current time in IST
  const nowIST = new Date(now.toLocaleString('en-US', { timeZone: tz }));

  // today 10:00 IST
  const targetIST = new Date(nowIST);
  targetIST.setHours(10, 0, 0, 0);

  // if already passed, use tomorrow 10:00 IST
  if (targetIST <= nowIST) targetIST.setDate(targetIST.getDate() + 1);

  // convert that IST time to a real UTC Date
  const targetUTC = new Date(targetIST.toLocaleString('en-US', { timeZone: 'UTC' }));
  return targetUTC;
}

function scheduleDailySpotlight(runOnceFn) {
  function planNext() {
    const nextUTC = next10amISTasUTCDate();
    const ms = nextUTC - new Date();
    console.log('[cron] Next selection at', nextUTC.toISOString(), '(UTC)');
    setTimeout(async () => {
      try { await runOnceFn(); } catch (e) { console.error('[cron] run error', e); }
      planNext(); // schedule the following day
    }, ms);
  }
  planNext();
}
// Boot-time: ensure nextSelectionUTC is present for the dashboard
(() => {
  const db = readDb();
  db.spotlight = db.spotlight || {};
  db.spotlight.nextSelectionUTC = next10amISTasUTCDate().toISOString();
  writeDb(db);
})();

// Start daily cron (10:00 IST)
scheduleDailySpotlight(async () => {
  const spot = runSpotlightOnce(); // your deterministic pick; also writes db.spotlight
  // also persist the NEXT run time for the dashboard
  const db = readDb();
  db.spotlight = db.spotlight || {};
  db.spotlight.nextSelectionUTC = next10amISTasUTCDate().toISOString();
  writeDb(db);
  console.log('[cron] picked winner:', spot?.winner?.name);
});


// current spotlight (read)
app.get('/api/spotlight/current', (_req, res) => {
  const db = readDb();
  const spot = db.spotlight || null;
  const payload = spot ? {
    date: spot.date,
    nextSelectionUTC: spot.nextSelectionUTC || next10amIST_UTC(), // ← use stored value
    winner: spot.winner,
    creditsGranted: spot.creditsGranted
  } : {
    date: new Date().toISOString().slice(0, 10),
    nextSelectionUTC: next10amIST_UTC(),
    winner: { id: 'u3', name: 'Rahul S', points: 780, title: 'Edge caching patterns for SPA' },
    creditsGranted: 100
  };
  res.json(payload);
});

// manual trigger
app.post('/api/spotlight/run', (_req, res) => {
  const result = runSpotlightOnce();
  res.json({ ok: true, ...result });
});

// last 10 “emails”
app.get('/api/spotlight/emails', (_req, res) => {
  const db = readDb();
  res.json({ emails: (db.emails || []).slice(-10).reverse() });
});

// credits for a user
app.get('/api/credits/:userId', (req, res) => {
  const db = readDb();
  const uid = String(req.params.userId || '').trim();
  res.json({ userId: uid, credits: (db.credits || {})[uid] || 0 });
});

// ---------- scheduler: next 10:00 IST ----------
// function scheduleSpotlight() {
//   const nextISO = next10amIST_UTC();
//   const next = new Date(nextISO);
//   const delay = Math.max(1000, next.getTime() - Date.now());
//   console.log('[cron] Next selection at', next.toISOString(), '(UTC)');
//   setTimeout(() => {
//     runSpotlightOnce();
//     setInterval(runSpotlightOnce, 24 * 60 * 60 * 1000);
//   }, delay);
// }
// scheduleSpotlight();
// // POST /api/spotlight/email  → log/send email for current winner
// POST /api/spotlight/email  → log/send email for current winner
app.post('/api/spotlight/email', (_req, res) => {
  // Ensure a winner exists (auto-run selection if missing)
  let db = readDb();
  if (!db.spotlight || !db.spotlight.winner) {
    const spot = runSpotlightOnce();   // writes to DB
    db = readDb();                     // reload after write
    db.spotlight = spot;
  }

  const winner = db.spotlight.winner;
  const nowUTC = new Date().toISOString();

  db.emails = db.emails || [];
  db.emails.push({
    to: winner.name,
    subject: "You're Today's Daily Spotlight Winner!",
    body: `Congrats ${winner.name}! "${winner.title}" won with ${winner.points} points. 100 credits added.`,
    timestamp: nowUTC
  });

  writeDb(db);
  return res.json({ ok: true, sentAt: nowUTC, to: winner.name, title: winner.title });
});

// ---- quick debug routes ----
app.get('/__ping', (_req, res) => res.json({ ok: true, file: __filename }));
// app.get('/__routes', (_req, res) => {
//   const routes = [];
//   app._router.stack.forEach((m) => {
//     if (m.route) {
//       const methods = Object.keys(m.route.methods).map(x => x.toUpperCase()).join(',');
//       routes.push(`${methods} ${m.route.path}`);
//     }
//   });
//   res.json({ routes });
// });

// ---- winner email handler ----
function sendWinnerEmail(_req, res) {
  let db = readDb();
  if (!db.spotlight || !db.spotlight.winner) {
    const spot = runSpotlightOnce(); // auto-pick if missing
    db = readDb();
    db.spotlight = spot;
  }
  const winner = db.spotlight.winner;
  const nowUTC = new Date().toISOString();

  db.emails = db.emails || [];
  db.emails.push({
    to: winner.name,
    subject: "You're Today's Daily Spotlight Winner!",
    body: `Congrats ${winner.name}! "${winner.title}" won with ${winner.points} points. 100 credits added.`,
    timestamp: nowUTC
  });

  writeDb(db);
  return res.json({ ok: true, sentAt: nowUTC, to: winner.name, title: winner.title });
}

// expose both (singular for UI; plural as fallback)
app.post('/api/spotlight/email',  sendWinnerEmail);
app.post('/api/spotlight/emails', sendWinnerEmail);

function creditUser(userId, amount) {
  const db = readDb();
  db.users = db.users || {};
  const u = db.users[userId] || { id: userId, credits: 0, raffleTickets: 0 };
  u.credits = Number(u.credits || 0) + Number(amount || 0);
  db.users[userId] = u;
  writeDb(db);
  return u.credits;
}

// const today = new Date().toISOString().slice(0,10);
// if (db.spotlight?.date !== today) {
//   const total = creditUser(winner.id || 'u1', 100);
//   db.spotlight = {
//     date: today,
//     winner,
//     // nextSelectionUTC: next10amISTasUTCDate().toISOString(),
//     credited: true,
//     creditsGranted: 100,
//     winnerCreditsTotal: total
//   };
// } else {
//   // already selected today; keep existing credited flag
//   db.spotlight = { ...(db.spotlight || {}), winner };
// }

app.get('/api/users', (_req, res) => {
  const db = readDb();
  res.json({ users: Object.values(db.users || {}) });
});

// Get one user by id
app.get('/api/users/:id', (req, res) => {
  const db = readDb();
  const id = String(req.params.id || '').trim();

  const fromUsers   = (db.users || {})[id];
  const fromCredits = (db.credits || {})[id] || 0;
  const fromTickets = (db.tickets || {})[id] || 0;

  const user = fromUsers || { id, credits: fromCredits, raffleTickets: fromTickets };

  // persist so next time it exists in users
  db.users = db.users || {};
  db.users[id] = user;
  writeDb(db);

  res.json(user);
});


// ---- Raffle winner (daily, 10:05 IST)
function pickRaffleWinner(db) {
  const entries = db.tickets || {};      // { userId: count }
  const pool = [];
  for (const [uid, count] of Object.entries(entries)) {
    for (let i = 0; i < Number(count || 0); i++) pool.push(uid);
  }
  if (!pool.length) return null;
  // deterministic pick by date (stable)
  const seed = new Date().toISOString().slice(0,10).replace(/-/g,''); // yyyymmdd
  const idx = Number(seed) % pool.length;
  const winnerId = pool[idx];
  return { userId: winnerId, tickets: entries[winnerId] || 0 };
}

function scheduleRaffleWinners() {
  function next105ISTasUTC() {
    const tz = 'Asia/Kolkata';
    const now = new Date();
    const nowIST = new Date(now.toLocaleString('en-US', { timeZone: tz }));
    const t = new Date(nowIST);
    t.setHours(10, 5, 0, 0);                 // 10:05 IST
    if (t <= nowIST) t.setDate(t.getDate() + 1);
    return new Date(t.toLocaleString('en-US', { timeZone: 'UTC' }));
  }
  const plan = () => {
    const next = next105ISTasUTC();
    const ms = next - new Date();
    console.log('[cron] Next raffle winner at', next.toISOString(), '(UTC)');
    setTimeout(() => {
      const db = readDb();
      const win = pickRaffleWinner(db);
      if (win) {
        db.raffle = db.raffle || { history: [] };
        db.raffle.lastWinner = { ...win, selectedAtUTC: new Date().toISOString() };
        db.raffle.history.push(db.raffle.lastWinner);
        // optional: reset tickets after draw
        // db.tickets = {};
        writeDb(db);
        console.log('[cron] Raffle winner:', win.userId, 'with', win.tickets, 'tickets');
      } else {
        console.log('[cron] Raffle winner: no tickets to draw');
      }
      plan();
    }, Math.max(1000, ms));
  };
  plan();
}
scheduleRaffleWinners();

// (optional) endpoint to view last raffle winner
app.get('/api/raffle/winner', (_req, res) => {
  const db = readDb();
  res.json({ winner: db.raffle?.lastWinner || null, history: db.raffle?.history?.slice(-10) || [] });
});


// POST/GET /api/raffle/run → pick winner now (weighted by tickets)
app.all('/api/raffle/run', (_req, res) => {
  const db = readDb();
  const win = pickRaffleWinner(db);
  if (!win) return res.json({ ok: true, message: 'No tickets to draw' });

  db.raffle = db.raffle || { history: [] };
  db.raffle.lastWinner = { ...win, selectedAtUTC: new Date().toISOString() };
  db.raffle.history.push(db.raffle.lastWinner);

  // optional: reset tickets after draw
  // db.tickets = {};

  writeDb(db);
  return res.json({ ok: true, winner: db.raffle.lastWinner });
});

app.get('/__routes', (_req, res) => {
  try {
    const stack = (app && app._router && Array.isArray(app._router.stack))
      ? app._router.stack
      : [];
    const routes = [];

    for (const layer of stack) {
      if (layer && layer.route && layer.route.path) {
        const methods = Object.keys(layer.route.methods || {})
          .map(m => m.toUpperCase()).join(',');
        routes.push(`${methods} ${layer.route.path}`);
      } else if (
        layer &&
        layer.name === 'router' &&
        layer.handle &&
        Array.isArray(layer.handle.stack)
      ) {
        for (const h of layer.handle.stack) {
          if (h && h.route && h.route.path) {
            const methods = Object.keys(h.route.methods || {})
              .map(m => m.toUpperCase()).join(',');
            routes.push(`${methods} ${h.route.path}`);
          }
        }
      }
    }

    res.json({ routes });
  } catch (e) {
    res.status(200).json({
      routes: [],
      note: 'route inspector disabled',
      error: String(e && e.message),
    });
  }
});



// ---------- start ----------
app.listen(PORT, () => {
  console.log(`✅ Local API running at http://localhost:${PORT}`);
});
