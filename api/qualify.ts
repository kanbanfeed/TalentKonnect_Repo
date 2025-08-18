// api/qualify.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { runtime: 'nodejs' }; // plain string

function setCors(req: VercelRequest, res: VercelResponse) {
  const origin = (req.headers.origin as string) || '';
  const isLocal = /^http:\/\/localhost:\d+$/.test(origin);
  const allowOrigin = isLocal ? origin : (process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    setCors(req, res);
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST')   return res.status(405).json({ error: 'Method Not Allowed' });

    const { path: userPath, skill, fun, feedback } = (req.body || {}) as {
      path?: string; skill?: string; fun?: string; feedback?: string;
    };

    if (!userPath) return res.status(400).json({ error: 'Path is required' });
    if (userPath === 'paid' && (!skill || !fun || !feedback)) {
      return res.status(400).json({ error: 'All quiz fields are required' });
    }

    const token = `ticket_${Math.random().toString(36).slice(2, 10)}`;
    return res.status(200).json({
      message: 'Qualification submitted successfully',
      token,
      tier: userPath === 'paid' ? 'paid' : 'free',
    });
  } catch (e: any) {
    console.error('[qualify] error', e);
    return res.status(500).json({ error: 'Internal Error', detail: String(e?.message || e) });
  }
}
