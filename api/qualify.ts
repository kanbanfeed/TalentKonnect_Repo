// api/qualify.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // --- CORS ---
  const origin = req.headers.origin || "";
const isLocalhost = /^http:\/\/localhost:\d+$/.test(origin);

// If it's any localhost port, echo it; otherwise use your deployed domain from env
const allowOrigin = isLocalhost
  ? origin
  : (process.env.CORS_ORIGIN || "");

// If nothing configured (local dev), fall back to "*"
res.setHeader("Access-Control-Allow-Origin", allowOrigin || "*");
res.setHeader("Vary", "Origin");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");
res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

if (req.method === "OPTIONS") {
  return res.status(204).end();
}

  // ------------

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let body: any = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { path, skill, fun, feedback } = body;

  if (!path) return res.status(400).json({ error: 'Path is required' });
  if (path === 'paid' && (!skill || !fun || !feedback)) {
    return res.status(400).json({ error: 'All quiz fields are required' });
  }

  const ticketToken = `ticket_${Math.random().toString(36).slice(2, 10)}`;

  return res.status(200).json({
    message: 'Qualification submitted successfully',
    token: ticketToken,
    tier: path === 'paid' ? 'paid' : 'free',
  });
}
