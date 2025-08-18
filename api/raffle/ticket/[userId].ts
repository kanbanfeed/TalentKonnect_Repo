import type { VercelRequest, VercelResponse } from '@vercel/node';
export const config = { runtime: 'nodejs' };

// Ephemeral in-memory store (OK for demo)
const store: Record<string, number> =
  (global as any).__tkTickets || ((global as any).__tkTickets = {});

export default function handler(req: VercelRequest, res: VercelResponse) {
  const uid = String(req.query.userId || '').trim();
  if (!uid) return res.status(400).json({ error: 'userId required' });

  return res.status(200).json({ userId: uid, tickets: store[uid] || 0 });
}
