import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

const DB_PATH = process.env.VERCEL ? '/tmp/_raffle.json'
                                   : path.join(process.cwd(), 'api', '_raffle.json');

function readDb(): any {
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch { return { tickets: {} }; }
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  const origin = req.headers.origin || '';
  const isLocal = /^http:\/\/localhost:\d+$/.test(origin);
  const allowOrigin = isLocal ? origin : (process.env.CORS_ORIGIN || 'https://talentkonnect-liard.vercel.app');
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const uid = String(req.query.userId ?? '').trim();
  if (!uid) return res.status(400).json({ error: 'userId required' });

  const db = readDb();
  const n = Number(db.tickets?.[uid] || 0);
  return res.status(200).json({ userId: uid, tickets: n });
}
