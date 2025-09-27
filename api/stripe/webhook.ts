import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { connectToDatabase } from '../../lib/mongo'; // MongoDB connection
import 'dotenv/config';

export const config = { runtime: 'nodejs' };

const stripeKey = (process.env.STRIPE_SECRET_KEY || '').trim();
const stripe = stripeKey ? new Stripe(stripeKey) : null;

async function rawBody(req: VercelRequest): Promise<Buffer> {
  if (typeof req.body === 'string') return Buffer.from(req.body);
  if (Buffer.isBuffer(req.body)) return req.body;
  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  const origin = String(req.headers.origin || '');
  const allow =
    /^http:\/\/localhost(:\d+)?$/.test(origin)
      ? origin
      : (process.env.CORS_ORIGIN || process.env.SITE_URL || '');
  res.setHeader('Access-Control-Allow-Origin', allow || '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Stripe-Signature');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  if (!stripe) return res.status(501).json({ error: 'Stripe not configured' });

  try {
    const sig = req.headers['stripe-signature'] as string | undefined;
    const whSecret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
    const buf = await rawBody(req);

    let event: Stripe.Event;
    if (whSecret && sig) {
      event = stripe.webhooks.constructEvent(buf, sig, whSecret);
    } else {
      event = JSON.parse(buf.toString('utf8'));
    }

    if (event.type === 'checkout.session.completed' || 
        event.type === 'payment_intent.succeeded' || 
        event.type === 'payment_intent.payment_failed') {
        
      const session = event.data.object as Stripe.Checkout.Session;

      // Pull line items to compute quantity/entries
      const full = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items', 'customer'],
      });

      let entries = 0;
      const items = full.line_items?.data || [];
      for (const li of items) {
        const q = Number(li.quantity || 0);
        entries += q > 0 ? q : 0;
      }

      const userId = String(session?.metadata?.userId || '').trim() ||
        String(session?.customer_details?.email || '').trim();

      if (userId && entries > 0) {
        try {
          // Connect to MongoDB and update ticket count
          const { db } = await connectToDatabase();
          const ticketsCollection = db.collection('tickets');

          // Store the event in the database and update ticket count
          await ticketsCollection.updateOne(
            { userId },
            { 
              $inc: { tickets: entries },  // Increment tickets
              $set: { 
                lastPaymentStatus: event.type, // Store the event type
                lastPaymentDate: new Date() // Store the timestamp of the event
              }
            },
            { upsert: true } // Create new record if not exists
          );
        } catch (e) {
          console.error('[webhook] credit call failed:', e);
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('[stripe/webhook] error:', err?.message || err);
    return res.status(400).json({ error: 'Webhook Error', message: err?.message || String(err) });
  }
}
