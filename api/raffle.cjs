const g = globalThis;
if (!g.__raffle) g.__raffle = { users: new Map(), version: 0 };
const users = g.__raffle.users;

function upsertUser(id, name) {
  const key = String(id || '').toLowerCase();
  if (!key) return null;
  const ex = users.get(key);
  if (ex) {
    if (name) ex.name = name;
    return ex;
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
  return leaderboard().reduce((s, u) => s + (u.tickets || 0), 0);
}

function pickWinner() {
  const list = leaderboard();
  const total = totalTickets();
  if (!total) return null;
  let r = Math.floor(Math.random() * total) + 1;
  for (const u of list) {
    r -= u.tickets;
    if (r <= 0) return u;
  }
  return null;
}

function readJson(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({ __invalid: true, __raw: data });
      }
    });
    req.on('error', () => resolve({}));
  });
}

function normalizeUserId(q) {
  const raw = Array.isArray(q) ? q[0] : q ?? '';
  const decoded = decodeURIComponent(String(raw)).trim();
  if (!decoded || /\[object\s+HTML/i.test(decoded)) return '';
  return decoded.replace(/\]$/, '');
}

module.exports = async function handler(req, res) {
  try {
    // Set CORS headers to allow requests from your domain
    const allowedOrigin = 'https://talentkonnect-liard.vercel.app';
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      // Handle preflight requests
      return res.status(204).end();
    }

    const base = `http://${req.headers.host || 'localhost'}`;
    const u = new URL(req.url, base);
    const parts = u.pathname.split('/').filter(Boolean);

    // Check path root is "api"
    if (parts[0] !== 'api') {
      return res.status(404).json({ error: 'Invalid path root', path: u.pathname });
    }

    const resource = parts[1]; // expected to be "raffle"
    const rest = parts.slice(2);

    // /api/raffle
    if (resource === 'raffle' && rest.length === 0) {
      if (req.method === 'GET') {
        return res.status(200).json({ totalTickets: totalTickets(), leaderboard: leaderboard() });
      }
      if (req.method === 'POST') {
        const body = await readJson(req);
        if (body.__invalid) {
          return res.status(400).json({ error: 'Invalid JSON', received: body.__raw?.slice(0, 120) });
        }
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
    }

    // /api/raffle/tickets/:userId
    if (resource === 'raffle' && rest[0] === 'tickets') {
      if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method not allowed' });
      }
      const userId = normalizeUserId(rest[1] || '');
      if (!userId) return res.status(400).json({ error: 'userId required' });
      const uRec = users.get(userId.toLowerCase());
      return res.status(200).json({ userId, tickets: (uRec && uRec.tickets) || 0 });
    }

    // /api/raffle/winner
    if (resource === 'raffle' && rest[0] === 'winner') {
      if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
      }
      const winner = pickWinner();
      if (!winner) return res.status(400).json({ error: 'No tickets' });
      return res.status(200).json({ winner });
    }

    return res.status(404).json({ error: 'Not found', path: u.pathname });
  } catch (e) {
    return res.status(500).json({ error: 'raffle_failed', message: String((e && e.message) || e) });
  }
};
