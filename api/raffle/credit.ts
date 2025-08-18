import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

const DB_PATH = process.env.VERCEL ? '/tmp/_raffle.json' : path.join(process.cwd(), 'api', '_raffle.json');

function readDb(): any {
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch { return { tickets: {}, payments: [] }; }
}
function writeDb(db: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  const origin = req.headers.origin || '';
  const isLocal = /^http:\/\/localhost:\d+$/.test(origin);
  const allowOrigin = isLocal ? origin : (process.env.CORS_ORIGIN || 'https://talentkonnect-liard.vercel.app');
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { userId, entries } = (req.body ?? {}) as { userId?: string; entries?: number };
  const uid = String(userId || '').trim();
  const n   = Number(entries || 0);
  if (!uid || !n || n < 1) return res.status(400).json({ error: 'userId and entries required' });

  const db = readDb();
  db.tickets[uid] = (db.tickets[uid] || 0) + n;
  db.payments.push({ paymentId: 'pay_' + Math.random().toString(36).slice(2, 10), userId: uid, entries: n, ts: new Date().toISOString() });
  writeDb(db);

  return res.status(200).json({ ok: true, userId: uid, totalTickets: db.tickets[uid] });
}
