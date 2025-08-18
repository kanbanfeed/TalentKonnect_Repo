import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS: allow localhost in dev, your prod origin otherwise
  const origin = req.headers.origin || '';
  const isLocal = /^http:\/\/localhost:\d+$/.test(origin);
  const allowOrigin = isLocal ? origin : (process.env.CORS_ORIGIN || 'https://talentkonnect-liard.vercel.app');
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { path, skill, fun, feedback } = (req.body ?? {}) as Record<string, string>;

  if (!path) return res.status(400).json({ error: 'Path is required' });
  if (path === 'paid' && (!skill || !fun || !feedback)) {
    return res.status(400).json({ error: 'All quiz fields are required' });
  }

  const token = `ticket_${Math.random().toString(36).slice(2, 10)}`;
  return res.status(200).json({
    message: 'Qualification submitted successfully',
    token,
    tier: path === 'paid' ? 'paid' : 'free',
  });
}
