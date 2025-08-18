import type { VercelRequest, VercelResponse } from '@vercel/node';
export const config = { runtime: 'nodejs' };

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { path: userPath, skill, fun, feedback } = body;

  if (!userPath) return res.status(400).json({ error: 'Path is required' });
  if (userPath === 'paid' && (!skill || !fun || !feedback)) {
    return res.status(400).json({ error: 'All quiz fields are required' });
  }

  const ticketToken = `ticket_${Math.random().toString(36).slice(2, 10)}`;
  return res.status(200).json({
    message: 'Qualification submitted successfully',
    token: ticketToken,
    tier: userPath === 'paid' ? 'paid' : 'free',
  });
}
