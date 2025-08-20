import { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

const DB = path.join(process.cwd(), 'api', '_raffle.json');

function readDb() {
  try { return JSON.parse(fs.readFileSync(DB, 'utf-8')); }
  catch { return { tickets:{}, payments:[], emails:[], credits:{}, submissions:[] }; }
}
function writeDb(data:any){ fs.mkdirSync(path.dirname(DB), { recursive:true }); fs.writeFileSync(DB, JSON.stringify(data,null,2)); }

function pickRaffleWinner(db:any){
  const entries = db.tickets || {};
  const pool:string[] = [];
  for (const [uid, count] of Object.entries(entries)) {
    for (let i = 0; i < Number(count || 0); i++) pool.push(String(uid));
  }
  if (!pool.length) return null;
  const seed = new Date().toISOString().slice(0,10).replace(/-/g,''); // yyyymmdd
  const idx = Number(seed) % pool.length;
  const winnerId = pool[idx];
  return { userId: winnerId, tickets: entries[winnerId] || 0 };
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const db = readDb();
  const win = pickRaffleWinner(db);
  if (!win) return res.json({ ok:true, message:'No tickets to draw' });

  db.raffle = db.raffle || { history: [] };
  db.raffle.lastWinner = { ...win, selectedAtUTC: new Date().toISOString() };
  db.raffle.history.push(db.raffle.lastWinner);

  // optional: reset tickets after draw
  // db.tickets = {};

  writeDb(db);
  return res.json({ ok:true, winner: db.raffle.lastWinner });
}
