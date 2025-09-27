// api/payment/create-checkout.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

// Ensure Node runtime (Stripe SDK requires Node, not Edge)
export const config = { runtime: 'nodejs' };

// Read env once, trim for safety
const STRIPE_SECRET_KEY = (process.env.STRIPE_SECRET_KEY || '').trim();
const SITE_URL = (process.env.SITE_URL || '').trim();           // e.g. https://www.talentkonnect.com
const CORS_ORIGIN = (process.env.CORS_ORIGIN || '').trim();     // e.g. https://www.talentkonnect.com

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, { timeout: 120_000 }) : (null as any);

// $7 per entry (in cents)
const PRICE_PER_ENTRY = 700;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ---------- CORS ----------
  const origin = req.headers.origin || '';
  const isLocalhost = /^http:\/\/localhost:\d+$/.test(origin);
  const allowOrigin = isLocalhost ? origin : (CORS_ORIGIN || SITE_URL || '');
  const reqHeaders = (req.headers['access-control-request-headers'] as string | undefined) || 'Content-Type';

  res.setHeader('Access-Control-Allow-Origin', allowOrigin || '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', reqHeaders);
  if (req.method === 'OPTIONS') return res.status(204).end();
  // ---------------------------

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    if (!stripe) return res.status(501).json({ error: 'Stripe not configured', hint: 'STRIPE_SECRET_KEY missing' });
    if (!STRIPE_SECRET_KEY.startsWith('sk_')) return res.status(401).json({ error: 'Invalid Stripe key' });
    if (!SITE_URL) return res.status(500).json({ error: 'SITE_URL not set' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const userId  = String(body.userId || '').trim();
    const entries = Number(body.entries || 0);
    if (!userId || !entries || entries < 1) {
      return res.status(400).json({ error: 'userId and entries are required (entries >= 1)' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${SITE_URL}/payment-success/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${SITE_URL}/modules/raffle/?canceled=1`,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Raffle Entry' },
            unit_amount: PRICE_PER_ENTRY, // 700 for $7
          },
          quantity: entries,
        },
      ],
      metadata: { userId, entriesPurchased: String(entries) },
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    const detail = {
      message: err?.message || String(err),
      type: err?.type,
      code: err?.code,
      rawType: err?.raw?.type,
      rawCode: err?.raw?.code,
      param: err?.param,
    };
    console.error('[create-checkout] error:', detail);
    return res.status(500).json({ error: 'Internal Error', detail });
  }
}
