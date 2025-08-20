import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTickets } from '../../_store.ts';


function normalizeUserId(q: unknown): string {
  // Vercel can provide string | string[]
  const raw = Array.isArray(q) ? q[0] : (q ?? '');
  // decode, trim, and remove any trailing stray bracket or whitespace
  const decoded = decodeURIComponent(String(raw)).trim();
  // common accidental values to guard against (e.g., DOM nodes passed by mistake)
  if (!decoded || /\[object\s+HTML/i.test(decoded)) return '';
  // strip a trailing ']' if someone built the URL poorly (…%5D)
  return decoded.replace(/\]$/, '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    // CORS preflight (harmless if you don't need it)
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = normalizeUserId(req.query?.userId);

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  const tickets = getTickets(userId);
  return res.status(200).json({ userId, tickets });
}
