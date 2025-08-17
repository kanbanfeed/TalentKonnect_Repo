// api/spotlight/run.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';

// same demo candidates used in /api/spotlight/current
const CANDIDATES = [
  { id: 'u1', name: 'Alex Kumar', points: 847, title: 'Advanced React Performance Optimization Techniques' },
  { id: 'u2', name: 'Priya N',   points: 802, title: 'Type-safe APIs with Zod + tRPC' },
  { id: 'u3', name: 'Rahul S',   points: 780, title: 'Edge caching patterns for SPA' },
  { id: 'u4', name: 'Meera T',   points: 765, title: 'Queue + Cron for reliable jobs' },
];

function pickDeterministic<T>(list: T[], seed: string, secret = process.env.DAILY_SEED_SECRET || 'local') {
  const hash = crypto.createHash('sha256').update(seed + secret).digest('hex');
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


  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const todaySeed = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const winner = pickDeterministic(CANDIDATES, todaySeed);

  // mock “email” + “credit allocation” for logs (you’ll see this in vercel dev logs)
  console.log(`[CRON] Winner ${todaySeed}: ${winner.name} — +100 credits`);
  console.log(`[MAIL] to=${winner.name.replace(/\s+/g,'.').toLowerCase()}@example.com subject="You won!"`);

  return res.status(200).json({
    ok: true,
    date: todaySeed,
    winner,
    creditsGranted: 100,
  });
}
