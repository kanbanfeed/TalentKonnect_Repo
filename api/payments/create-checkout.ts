import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

// trim just in case the key has stray spaces/newlines
const stripeKey = (process.env.STRIPE_SECRET_KEY || '').trim();
const stripe = stripeKey ? new Stripe(stripeKey, { timeout: 120_000 }) : (null as any);
const PRICE_PER_ENTRY = 100; // $1 per entry

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // --- CORS (robust for localhost) ---
  const origin = req.headers.origin || '';
  const isLocalhost = /^http:\/\/localhost:\d+$/.test(origin);
  const allowOrigin = isLocalhost ? origin : (process.env.CORS_ORIGIN || '');
  const reqHeaders = (req.headers['access-control-request-headers'] as string | undefined) || 'Content-Type';

  res.setHeader('Access-Control-Allow-Origin', allowOrigin || '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', reqHeaders);
  if (req.method === 'OPTIONS') return res.status(204).end();
  // -----------------------------------

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    if (!stripe) {
      return res.status(501).json({ error: 'Stripe not configured', hint: 'STRIPE_SECRET_KEY missing' });
    }
    if (!stripeKey.startsWith('sk_')) {
      return res.status(401).json({ error: 'Invalid Stripe key', hint: 'Use your sk_test_... secret key' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const userId = String(body.userId || '').trim();
    const entries = Number(body.entries || 0);
    if (!userId || !entries || entries < 1) {
      return res.status(400).json({ error: 'userId and entries are required' });
    }

    // IMPORTANT: point SITE_URL to your shell (5174) if that’s where the UI runs
    const siteEnv = (process.env.SITE_URL || '').trim();
    const site = siteEnv || (isLocalhost ? origin : '');
    if (!site) return res.status(500).json({ error: 'SITE_URL not set' });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${site}/payment-success/index.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/modules/raffle/index.html?canceled=1`,
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

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    // return detailed info so we can see what Stripe complained about
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
