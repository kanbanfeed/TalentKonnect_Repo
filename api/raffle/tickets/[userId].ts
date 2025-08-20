import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';

export const config = { runtime: 'nodejs' };

const DB_PATH = '/tmp/_raffle.json';
function readDb() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch { return { tickets: {}, payments: [], emails: [], credits: {} }; }
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin ?? '';
  const allowOrigin = /^https?:\/\/localhost(:\d+)?$/.test(origin)
    ? origin
    : 'https://talentkonnect-liard.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const userId = String(req.query.userId ?? '').trim();
  const db = readDb();
  const tickets = db.tickets?.[userId] || 0;
  return res.status(200).json({ userId, tickets });
}
