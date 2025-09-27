import { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../../../lib/mongo'; // MongoDB connection
import { db, saveToDb } from '../../_db'; // In-memory database

// Normalize userId from the query parameter (sanitize and validate it)
function normalizeUserId(q: unknown): string {
  const raw = Array.isArray(q) ? q[0] : (q ?? '');
  const decoded = decodeURIComponent(String(raw)).trim();
  if (!decoded || /\[object\s+HTML/i.test(decoded)) return '';
  return decoded.replace(/\]$/, ''); // Clean potential stray characters
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  // Handle non-GET requests
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Extract and normalize userId from the query parameter in URL
  const userId = normalizeUserId(req.query?.userId); // `userId` should be available from the dynamic route

  // Check if userId is valid
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    if (process.env.NODE_ENV === 'production') {
      // Production: MongoDB logic
      const { db } = await connectToDatabase(); // Connect to MongoDB
      const ticketsCollection = db.collection('tickets'); // MongoDB collection for storing tickets

      // Get the ticket count for the given userId
      const userTickets = await ticketsCollection.findOne({ userId });

      if (userTickets) {
        return res.status(200).json({ userId, tickets: userTickets.tickets }); // Return tickets for the user
      } else {
        return res.status(404).json({ error: 'User not found' }); // If no user found, return an error
      }
    } else {
      // Local: In-memory logic
      const state = await db(); // Fetch state from in-memory
      const ticketCount = state.tickets[userId] || 0; // Get ticket count from in-memory state
      return res.status(200).json({ userId, tickets: ticketCount }); // Return tickets for the user
    }
  } catch (err) {
    console.error('Error connecting to MongoDB or in-memory DB:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Utility function to get tickets (used in both local and production environments)
export async function getTickets(userId: string) {
  if (process.env.NODE_ENV === 'production') {
    const { db } = await connectToDatabase();
    const ticketsCollection = db.collection('tickets');
    const userTickets = await ticketsCollection.findOne({ userId });
    return userTickets ? userTickets.tickets : 0;
  } else {
    const state = await db();
    return state.tickets[userId] || 0;
  }
}

// Utility function to update tickets (used in both local and production environments)
export async function updateTickets(userId: string, count: number) {
  if (process.env.NODE_ENV === 'production') {
    const { db } = await connectToDatabase();
    const ticketsCollection = db.collection('tickets');
    await ticketsCollection.updateOne(
      { userId },
      { $inc: { tickets: count } },
      { upsert: true }
    );
  } else {
    const state = await db();
    state.tickets[userId] = (state.tickets[userId] || 0) + count;
    await saveToDb(state); // Save in-memory state
  }
}
