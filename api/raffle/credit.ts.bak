import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';

export const config = { runtime: 'nodejs' };

const DB_PATH = '/tmp/_raffle.json';
function readDb() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch { return { tickets: {}, payments: [], emails: [], credits: {} }; }
}
function writeDb(db: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db));
}

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
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const userId = String(body.userId || '').trim();
    const entries = Number(body.entries || 0);
    if (!userId || entries < 1) return res.status(400).json({ error: 'userId and entries required' });

    const db = readDb();
    db.tickets[userId] = (db.tickets[userId] || 0) + entries;
    db.payments.push({
      paymentId: 'pay_' + Math.random().toString(36).slice(2, 10),
      userId,
      entries,
      amount: entries * 100,
      timestamp: new Date().toISOString(),
      source: 'vercel_mock',
    });
    writeDb(db);
    return res.status(200).json({ ok: true, userId, entries, totalTickets: db.tickets[userId] });
  } catch (e: any) {
    console.error('CREDIT ERROR', e);
    return res.status(500).json({ error: 'Internal Error', detail: String(e?.message || e) });
  }
}
