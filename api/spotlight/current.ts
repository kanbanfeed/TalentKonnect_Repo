// api/spotlight/current.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';

// simple deterministic picker from a fixed list using today's date as seed
const CANDIDATES = [
  { id: 'u1', name: 'Alex Kumar', points: 847, title: 'Advanced React Performance Optimization Techniques' },
  { id: 'u2', name: 'Priya N', points: 802, title: 'Type-safe APIs with Zod + tRPC' },
  { id: 'u3', name: 'Rahul S', points: 780, title: 'Edge caching patterns for SPA' },
  { id: 'u4', name: 'Meera T', points: 765, title: 'Queue + Cron for reliable jobs' },
];

function pickDeterministic<T>(list: T[], seed: string) {
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  const n = parseInt(hash.slice(0, 8), 16);
  return list[n % list.length];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS for local dev (UI on 5173)
 const origin = req.headers.origin || "";
const isLocalhost = /^http:\/\/localhost:\d+$/.test(origin);

// If it's any localhost port, echo it; otherwise use your deployed domain from env
const allowOrigin = isLocalhost
  ? origin
  : (process.env.CORS_ORIGIN || "");

// If nothing configured (local dev), fall back to "*"
res.setHeader("Access-Control-Allow-Origin", allowOrigin || "*");
res.setHeader("Vary", "Origin");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");
res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

if (req.method === "OPTIONS") {
  return res.status(204).end();
}

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const today = new Date();
  const seed = today.toISOString().slice(0, 10); // YYYY-MM-DD
  const winner = pickDeterministic(CANDIDATES, seed);

  // next run at 10:00 IST (04:30 UTC)
  const nextUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 4, 30, 0));
  if (today > nextUTC) nextUTC.setUTCDate(nextUTC.getUTCDate() + 1);

  return res.status(200).json({
    date: seed,
    nextSelectionUTC: nextUTC.toISOString(),
    winner,
  });
}
