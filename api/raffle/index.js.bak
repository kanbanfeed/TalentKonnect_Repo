// api/raffle/index.js
// Single-file, no imports. Robust JSON body parsing for POST.

const g = globalThis;
if (!g.__raffle) g.__raffle = { users: new Map(), version: 0 };
const users = g.__raffle.users;

function upsertUser(id, name) {
  const key = String(id || '').toLowerCase();
  if (!key) return null;
  const existing = users.get(key);
  if (existing) {
    if (name) existing.name = name;
    return existing;
  }
  const u = { id: key, name: name || '', tickets: 0 };
  users.set(key, u);
  return u;
}

function addTickets(id, n) {
  const u = upsertUser(id);
  if (!u) return 0;
  u.tickets += Number(n || 0);
  g.__raffle.version++;
  return u.tickets;
}

function leaderboard() {
  return Array.from(users.values()).sort((a, b) => b.tickets - a.tickets);
}

function totalTickets() {
  return leaderboard().reduce((sum, u) => sum + (u.tickets || 0), 0);
}

// Fallback body reader (works even if req.body is empty)
function readJson(req) {
  return new Promise((resolve) => {
    // If Vercel already parsed it, use it
    if (req && typeof req.body !== 'undefined') {
      try {
        const parsed = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
        return resolve(parsed);
      } catch {
        // fall through to stream parse
      }
    }
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); }
      catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      return res.status(200).json({
        totalTickets: totalTickets(),
        leaderboard: leaderboard(),
      });
    }

    if (req.method === 'POST') {
      const body = await readJson(req);
      const userId = String(body.userId || '').trim();
      const n = Number(body.addTickets ?? 1);
      const name = body.name ? String(body.name) : '';

      if (!userId) return res.status(400).json({ error: 'userId required' });
      if (!n || n < 1) return res.status(400).json({ error: 'addTickets must be >= 1' });

      upsertUser(userId, name);
      const tickets = addTickets(userId, n);
      return res.status(200).json({ ok: true, userId, tickets });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: 'raffle_failed', message: String((e && e.message) || e) });
  }
}
