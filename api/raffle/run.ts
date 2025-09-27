import { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';
import { connectToDatabase } from '../../lib/mongo'; // MongoDB connection if using MongoDB for production

const IS_PRODUCTION = process.env.NODE_ENV === 'production'; // Check if in production or local

// If in local environment, use file-based storage
const DB = IS_PRODUCTION
  ? null // In production, use MongoDB
  : path.join(process.cwd(), 'api', '_raffle.json'); // Local file path for development

// Function to read data from DB (file or MongoDB)
async function readDb() {
  if (IS_PRODUCTION) {
    // Read from MongoDB
    const { db } = await connectToDatabase();
    const ticketsCollection = db.collection('tickets');
    return ticketsCollection.find({}).toArray(); // Fetch all ticket data
  } else {
    // Read from local JSON file in development
    try {
      return JSON.parse(fs.readFileSync(DB, 'utf-8'));
    } catch {
      return { tickets: {}, payments: [], emails: [], credits: {}, submissions: [] };
    }
  }
}

// Function to write data to DB (file or MongoDB)
async function writeDb(data: any) {
  if (IS_PRODUCTION) {
    // Write to MongoDB in production
    const { db } = await connectToDatabase();
    const ticketsCollection = db.collection('tickets');
    await ticketsCollection.insertOne(data); // Insert data into MongoDB
  } else {
    // Write to file in local development
    fs.mkdirSync(path.dirname(DB), { recursive: true });
    fs.writeFileSync(DB, JSON.stringify(data, null, 2));
  }
}

// Function to pick a raffle winner
function pickRaffleWinner(db: any) {
  const entries = db.tickets || {};
  const pool: string[] = [];
  for (const [uid, count] of Object.entries(entries)) {
    for (let i = 0; i < Number(count || 0); i++) pool.push(String(uid));
  }
  if (!pool.length) return null;
  const seed = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // yyyymmdd
  const idx = Number(seed) % pool.length;
  const winnerId = pool[idx];
  return { userId: winnerId, tickets: entries[winnerId] || 0 };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const db = await readDb();
  const win = pickRaffleWinner(db);
  if (!win) return res.json({ ok: true, message: 'No tickets to draw' });

  db.raffle = db.raffle || { history: [] };
  db.raffle.lastWinner = { ...win, selectedAtUTC: new Date().toISOString() };
  db.raffle.history.push(db.raffle.lastWinner);

  // optional: reset tickets after draw
  // db.tickets = {};

  await writeDb(db);
  return res.json({ ok: true, winner: db.raffle.lastWinner });
}
