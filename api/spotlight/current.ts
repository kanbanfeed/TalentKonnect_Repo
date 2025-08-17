// api/spotlight/current.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';

// ✅ make sure this is a Node function (NOT Edge)
export const config = { runtime: 'nodejs' };

// Demo candidates
const CANDIDATES = [
  { id: 'u1', name: 'Alex Kumar', points: 847, title: 'Advanced React Performance Optimization Techniques' },
  { id: 'u2', name: 'Priya N',   points: 802, title: 'Type-safe APIs with Zod + tRPC' },
  { id: 'u3', name: 'Rahul S',   points: 780, title: 'Edge caching patterns for SPA' },
  { id: 'u4', name: 'Meera T',   points: 765, title: 'Queue + Cron for reliable jobs' },
];

// Deterministic pick (uses crypto; falls back to a tiny hash if needed)
function pickDeterministic<T>(list: T[], seed: string) {
  try {
    const hash = crypto.createHash('sha256').update(seed).digest('hex');
    const n = parseInt(hash.slice(0, 8), 16);
    return list[n % list.length];
  } catch {
    // fallback (works everywhere)
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return list[h % list.length];
  }
}

function next10amISTasUTC(): string {
  const tz = 'Asia/Kolkata';
  const now = new Date();
  const nowIST = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  const targetIST = new Date(nowIST);
  targetIST.setHours(10, 0, 0, 0);
  if (targetIST <= nowIST) targetIST.setDate(targetIST.getDate() + 1);
  return new Date(targetIST.toLocaleString('en-US', { timeZone: 'UTC' })).toISOString();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  const origin = req.headers.origin || '';
  const isLocal = /^http:\/\/localhost(:\d+)?$/.test(origin);
  const allowOrigin = isLocal ? origin : (process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const today = new Date().toISOString().slice(0, 10);
    const winner = pickDeterministic(CANDIDATES, today);
    return res.status(200).json({
      ok: true,
      date: today,
      nextSelectionUTC: next10amISTasUTC(),
      winner,
      creditsGranted: 100,
    });
  } catch (e: any) {
    console.error('[spotlight/current] error', e);
    // never crash the function—return a JSON error instead
    return res.status(200).json({ ok: false, error: String(e?.message || e) });
  }
}
