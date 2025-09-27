import { VercelRequest, VercelResponse } from '@vercel/node';
import { getStore } from '../../lib/store'; // MongoDB store integration

// Normalize userId from the query parameter (sanitize and validate it)
function normalizeUserId(q: unknown): string {
  const raw = Array.isArray(q) ? q[0] : (q ?? '');
  const decoded = decodeURIComponent(String(raw)).trim();
  if (!decoded || /\[object\s+HTML/i.test(decoded)) return '';
  return decoded.replace(/\]$/, ''); // clean potential stray characters
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  // Handle non-GET requests
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Extract and normalize userId from the query parameter in URL
  const userId = normalizeUserId(req.query?.userId); // `userId` should be available from the dynamic route

  // Check if userId is valid
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    // Get MongoDB store from store.ts
    const store = await getStore(); // MongoDB Store or memory store

    // Add or update tickets for the user
    const tickets = await store.addTickets(userId, 1); // Defaulting to 1 ticket added

    return res.status(200).json({ userId, tickets });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
