// server.mongo.cjs — Production-ready API with MongoDB
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- MongoDB Setup ----------
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error('MONGO_URI not set in .env');
const client = new MongoClient(MONGO_URI);
let db;
async function connectDb() {
  await client.connect();
  db = client.db('talentkonnect');
}
connectDb().catch(console.error);

// ---------- Middleware ----------
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json());

// ---------- Stripe Setup ----------
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, { timeout: 120000 }) : null;
const PRICE_PER_ENTRY = 700; // cents

// ---------- Health ----------
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ---------- Qualification Gate ----------
app.post('/api/qualify', async (req, res) => {
  const { path: userPath, skill, fun, feedback } = req.body || {};
  if (!userPath) return res.status(400).json({ error: 'Path is required' });
  if (userPath === 'paid' && (!skill || !fun || !feedback))
    return res.status(400).json({ error: 'All quiz fields required' });

  const token = `ticket_${Math.random().toString(36).slice(2, 10)}`;
  await db.collection('qualifications').insertOne({
    token,
    tier: userPath === 'paid' ? 'paid' : 'free',
    createdAt: new Date()
  });

  res.json({ message: 'Qualification submitted', token, tier: userPath === 'paid' ? 'paid' : 'free' });
});

// ---------- Raffle ----------
function pickRaffleWinner(tickets) {
  const pool = [];
  for (const [uid, count] of Object.entries(tickets)) {
    for (let i = 0; i < Number(count || 0); i++) pool.push(uid);
  }
  if (!pool.length) return null;
  const idx = Number(new Date().toISOString().slice(0, 10).replace(/-/g, '')) % pool.length;
  return { userId: pool[idx], tickets: tickets[pool[idx]] || 0 };
}

app.get('/api/raffle/tickets/:userId', async (req, res) => {
  const uid = req.params.userId.trim();
  const ticketDoc = await db.collection('tickets').findOne({ userId: uid }) || { userId: uid, tickets: 0 };
  res.json({ userId: uid, tickets: ticketDoc.tickets });
});

app.post('/api/raffle/credit', async (req, res) => {
  const { userId, entries } = req.body || {};
  if (!userId || entries < 1) return res.status(400).json({ error: 'userId and entries required' });

  const ticketDoc = await db.collection('tickets').findOne({ userId }) || { userId, tickets: 0 };
  const newTickets = (ticketDoc.tickets || 0) + Number(entries);

  await db.collection('tickets').updateOne({ userId }, { $set: { tickets: newTickets } }, { upsert: true });
  await db.collection('payments').insertOne({
    paymentId: `pay_${Math.random().toString(36).slice(2, 10)}`,
    userId,
    entries,
    amount: entries * PRICE_PER_ENTRY,
    timestamp: new Date(),
    source: 'local_mock'
  });

  res.json({ ok: true, userId, entries, totalTickets: newTickets });
});

// ---------- Stripe Checkout ----------
app.post('/api/payment/create-checkout', async (req, res) => {
  try {
    const { userId, entries } = req.body || {};
    if (!stripe) return res.status(501).json({ error: 'Stripe not configured' });
    if (!userId || entries < 1) return res.status(400).json({ error: 'userId and entries required' });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      success_url: `${SITE_URL}/modules/raffle/success.html?session_id={CHECKOUT_SESSION_ID}&success=1`,
      cancel_url: `${SITE_URL}/modules/raffle/?canceled=1`,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'Raffle Entry' },
          unit_amount: PRICE_PER_ENTRY
        },
        quantity: entries
      }],
      metadata: { userId, entriesPurchased: String(entries) }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ---------- Stripe Webhook ----------
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    if (!stripe) return res.status(501).json({ error: 'Stripe not configured' });

    if (!sig || process.env.NODE_ENV === 'development') {
      if (!req.body || !req.body.length) throw new Error('Empty body');
      event = JSON.parse(req.body.toString('utf8'));
    } else {
      if (!STRIPE_WEBHOOK_SECRET) throw new Error('Webhook secret not set');
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.userId || '';
      const total = Number(session.amount_total || 0);
      const entries = total ? Math.max(1, Math.round(total / PRICE_PER_ENTRY)) : 1;

      if (userId && entries > 0) {
        const ticketDoc = await db.collection('tickets').findOne({ userId }) || { userId, tickets: 0 };
        await db.collection('tickets').updateOne({ userId }, { $set: { tickets: (ticketDoc.tickets || 0) + entries } }, { upsert: true });
        await db.collection('payments').insertOne({
          paymentId: `pay_${Math.random().toString(36).slice(2, 10)}`,
          userId,
          entries,
          amount: total,
          timestamp: new Date(),
          source: 'stripe'
        });
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('[stripe/webhook]', err);
    res.status(400).json({ error: 'Webhook error', message: err.message || String(err) });
  }
});

// ---------- Users ----------
app.get('/api/users/:id', async (req, res) => {
  const id = req.params.id.trim();
  const user = await db.collection('tickets').findOne({ userId: id }) || { userId: id, tickets: 0 };
  res.json(user);
});

// ---------- Start ----------
app.listen(PORT, () => console.log(`✅ Production API running at ${SITE_URL}`));
