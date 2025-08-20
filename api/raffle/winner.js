// api/raffle/winner.js
// Self-contained (no imports). Uses a tiny in-memory users map on globalThis.
// NOTE: This shares state with /api/raffle *only if* the same serverless container stays warm.
// For QA demo flows, call /api/raffle (POST) a couple times, then call this endpoint.

const g = globalThis;
if (!g.__raffle) g.__raffle = { users: new Map(), version: 0 };
const users = g.__raffle.users;

function leaderboard() {
  return Array.from(users.values()).sort((a, b) => b.tickets - a.tickets);
}

function totalTickets() {
  return leaderboard().reduce((s, u) => s + (u.tickets || 0), 0);
}

// weighted random pick by total ticket count
function pickWinner() {
  const list = leaderboard();
  const total = totalTickets();
  if (!total) return null;

  let r = Math.floor(Math.random() * total) + 1; // 1..total
  for (const u of list) {
    r -= u.tickets;
    if (r <= 0) return u;
  }
  return null;
}

export default function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }
    const winner = pickWinner();
    if (!winner) return res.status(400).json({ error: 'No tickets' });
    return res.status(200).json({ winner });
  } catch (e) {
    return res.status(500).json({ error: 'winner_failed', message: String((e && e.message) || e) });
  }
}
