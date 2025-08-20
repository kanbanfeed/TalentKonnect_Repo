import type { VercelRequest, VercelResponse } from '@vercel/node';
import { totalTickets, leaderboard, upsertUser, addTickets, bumpVersion } from '../_store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ totalTickets: totalTickets(), leaderboard: leaderboard() });
  }
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { userId, addTickets: n = 1, name } = body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    upsertUser(userId, name);
    const total = addTickets(userId, n);
    bumpVersion();
    return res.status(200).json({ ok: true, userId, tickets: total });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
