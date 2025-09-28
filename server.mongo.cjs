// server.mongo.cjs — Production-ready API with MongoDB

const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('Error: MONGO_URI not set in .env');
  process.exit(1);
}

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, { timeout: 120000 }) : null;
const PRICE_PER_ENTRY = 700; // cents
const allowedOrigins = [
  'https://talent-konnect-repo.vercel.app',
  'https://www.talentkonnect.com',
];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (e.g., curl, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true // if you use cookies or authentication headers
}));
// ---------- MongoDB Setup ----------
const client = new MongoClient(MONGO_URI);
let db;

// Connect to DB before starting server
async function connectDb() {
  try {
    await client.connect();
    db = client.db('talentkonnect');
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
}

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Qualification Gate
app.post('/api/qualify', async (req, res) => {
  try {
    const { path: userPath, skill, fun, feedback } = req.body || {};
    if (!userPath) return res.status(400).json({ error: 'Path is required' });
    if (userPath === 'paid' && (!skill || !fun || !feedback))
      return res.status(400).json({ error: 'All quiz fields required' });

    const token = `ticket_${Math.random().toString(36).slice(2, 10)}`;
    await db.collection('qualifications').insertOne({
      token,
      tier: userPath === 'paid' ? 'paid' : 'free',
      createdAt: new Date(),
    });

    res.json({ message: 'Qualification submitted', token, tier: userPath === 'paid' ? 'paid' : 'free' });
  } catch (err) {
    console.error('/api/qualify error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Raffle tickets retrieval
app.get('/api/raffle/tickets/:userId', async (req, res) => {
  try {
    const uid = req.params.userId.trim();
    const ticketDoc = (await db.collection('tickets').findOne({ userId: uid })) || { userId: uid, tickets: 0 };
    res.json({ userId: uid, tickets: ticketDoc.tickets });
  } catch (err) {
    console.error('/api/raffle/tickets/:userId error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Raffle credit add
app.post('/api/raffle/credit', async (req, res) => {
  try {
    const { userId, entries } = req.body || {};
    if (!userId || entries < 1) return res.status(400).json({ error: 'userId and entries required' });

    const ticketDoc = (await db.collection('tickets').findOne({ userId })) || { userId, tickets: 0 };
    const newTickets = (ticketDoc.tickets || 0) + Number(entries);

    await db.collection('tickets').updateOne({ userId }, { $set: { tickets: newTickets } }, { upsert: true });
    await db.collection('payments').insertOne({
      paymentId: `pay_${Math.random().toString(36).slice(2, 10)}`,
      userId,
      entries,
      amount: entries * PRICE_PER_ENTRY,
      timestamp: new Date(),
      source: 'local_mock',
    });

    res.json({ ok: true, userId, entries, totalTickets: newTickets });
  } catch (err) {
    console.error('/api/raffle/credit error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stripe Checkout create session
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
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Raffle Entry' },
            unit_amount: PRICE_PER_ENTRY,
          },
          quantity: entries,
        },
      ],
      metadata: { userId, entriesPurchased: String(entries) },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('/api/payment/create-checkout error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stripe webhook
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
        const ticketDoc = (await db.collection('tickets').findOne({ userId })) || { userId, tickets: 0 };
        await db.collection('tickets').updateOne({ userId }, { $set: { tickets: (ticketDoc.tickets || 0) + entries } }, { upsert: true });
        await db.collection('payments').insertOne({
          paymentId: `pay_${Math.random().toString(36).slice(2, 10)}`,
          userId,
          entries,
          amount: total,
          timestamp: new Date(),
          source: 'stripe',
        });
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('[stripe/webhook]', err);
    res.status(400).json({ error: 'Webhook error', message: err.message || String(err) });
  }
});

// Users API
app.get('/api/users/:id', async (req, res) => {
  try {
    const id = req.params.id.trim();
    const user = (await db.collection('tickets').findOne({ userId: id })) || { userId: id, tickets: 0 };
    res.json(user);
  } catch (err) {
    console.error('/api/users/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Wait for DB connection and then start server
connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Production API running at ${SITE_URL} on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
