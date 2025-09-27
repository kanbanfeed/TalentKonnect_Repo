import { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../../lib/mongo';  // Importing MongoDB connection

// Function to get the leaderboard from the MongoDB collection
async function leaderboard() {
  const { db } = await connectToDatabase();
  const ticketsCollection = db.collection('tickets');
  const users = await ticketsCollection.find({}).toArray(); // Fetch all users
  return users.sort((a, b) => b.tickets - a.tickets); // Sort by tickets
}

// Function to calculate the total tickets of all users
async function totalTickets() {
  const users = await leaderboard();
  return users.reduce((s, u) => s + (u.tickets || 0), 0);
}

// Function to pick a random winner based on total tickets
async function pickWinner() {
  const users = await leaderboard();
  const total = await totalTickets();
  if (!total) return null;

  let r = Math.floor(Math.random() * total) + 1; // 1..total
  for (const u of users) {
    r -= u.tickets;
    if (r <= 0) return u;
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }
    const winner = await pickWinner();
    if (!winner) return res.status(400).json({ error: 'No tickets' });
    return res.status(200).json({ winner });
  } catch (e) {
    return res.status(500).json({ error: 'winner_failed', message: String((e && e.message) || e) });
  }
}
