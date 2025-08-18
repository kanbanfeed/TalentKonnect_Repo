import type { VercelRequest, VercelResponse } from '@vercel/node';
export const config = { runtime: 'nodejs' };

const store: Record<string, number> =
  (global as any).__tkTickets || ((global as any).__tkTickets = {});

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const uid = String(body.userId || '').trim();
  const n = Number(body.entries || 0);

  if (!uid || !n || n < 1) return res.status(400).json({ error: 'userId and entries required' });

  store[uid] = (store[uid] || 0) + n;

  const paymentId = 'pay_' + Math.random().toString(36).slice(2, 10);
  return res.status(200).json({
    ok: true,
    userId: uid,
    entries: n,
    totalTickets: store[uid],
    paymentId,
    timestamp: new Date().toISOString(),
  });
}
