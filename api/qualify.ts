// api/qualify.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
export const config = { runtime: 'nodejs' };

export default function handler(req: VercelRequest, res: VercelResponse) {

  const origin = req.headers.origin ?? '';
  const allowOrigin = /^https?:\/\/localhost(:\d+)?$/.test(origin)
    ? origin
    : 'https://talentkonnect-liard.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {

    const raw = (req as any).body;
    const body =
      raw && typeof raw === 'object' ? raw :
      raw && typeof raw === 'string' ? JSON.parse(raw) :
      {};

    const { path, skill, fun, feedback } = body as Record<string, string>;

    if (!path) return res.status(400).json({ error: 'Path is required' });
    if (path === 'paid' && (!skill || !fun || !feedback)) {
      return res.status(400).json({ error: 'All quiz fields are required' });
    }

    const token = `ticket_${Math.random().toString(36).slice(2, 10)}`;
    const tier = path === 'paid' ? 'paid' : 'free';
    return res.status(200).json({ message: 'Qualification submitted successfully', token, tier });
  } catch (e: any) {
    console.error('[QUALIFY] error:', e);
    return res.status(500).json({ error: 'Internal Error', detail: String(e?.message || e) });
  }
}
