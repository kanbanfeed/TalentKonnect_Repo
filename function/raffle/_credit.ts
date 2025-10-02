import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

// Ensure Node runtime (Stripe SDK requires Node, not Edge)
export const config = { runtime: 'nodejs' };

// Read env once, trim for safety
const STRIPE_SECRET_KEY = (process.env.STRIPE_SECRET_KEY || '').trim();
const STRIPE_WEBHOOK_SECRET = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
const SITE_URL = (process.env.SITE_URL || '').trim();

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, {apiVersion: '2024-06-20'}) : null;

// You likely store tickets in your JSON/DB; using the same credit endpoint logic keeps behavior consistent.
async function creditTickets(userId: string, entries: number) {
  // Call your internal function or refactor /api/raffle/credit logic into a helper
  await fetch(`${SITE_URL}/api/raffle/credit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, entries }),
  }).catch((err) => console.error('Error crediting tickets:', err));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  try {
    if (!stripe || !STRIPE_WEBHOOK_SECRET) {
      return res.status(501).json({ error: 'Stripe webhook not configured' });
    }

    const sig = req.headers['stripe-signature'] as string;
    const buf = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(buf, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      return res.status(400).send(`Webhook signature verification failed: ${err?.message || err}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      // If you used metadata in the link/product, read it here; otherwise resolve by email/customer:
      const userId = (session.metadata && (session.metadata.userId as string)) ||
                     (session.customer_email as string) ||
                     (session.customer as string) ||
                     '';
      // Convert amount to entries if using a fixed price (e.g., $7 per entry)
      const total = (session.amount_total || 0); // in cents
      const entries = total ? Math.max(1, Math.round(total / 700)) : 1;

      if (userId) await creditTickets(userId, entries);
    }

    return res.json({ received: true });
  } catch (e: any) {
    console.error('[stripe/webhook] error', e);
    return res.status(500).json({ error: 'webhook_failed', message: String(e?.message || e) });
  }
}
