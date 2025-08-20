module.exports = async function handler(req, res) {
  try {
    const { method, url } = req;

    // --- POST /api/raffle ---
    if (method === 'POST' && url === '/api/raffle') {
      const body = await readBody(req);
      if (!body.userId) {
        return res.status(400).json({ error: "userId required" });
      }
      return res.status(200).json({ ok: true, userId: body.userId, tickets: body.addTickets || 0 });
    }

    // --- GET /api/raffle/tickets/:userId ---
    if (method === 'GET' && url.startsWith('/api/raffle/tickets/')) {
      const userId = decodeURIComponent(url.split('/').pop());
      return res.status(200).json({ userId, tickets: Math.floor(Math.random() * 5) });
    }

    // --- GET /api/raffle/credit ---
    if (method === 'GET' && url === '/api/raffle/credit') {
      return res.status(200).json({ credits: 10 });
    }

    // --- POST /api/raffle/winner ---
    if (method === 'POST' && url === '/api/raffle/winner') {
      return res.status(200).json({ ok: true, winner: "test@example.com" });
    }

    // Fallback
    res.status(404).json({ error: "Not Found", path: url });

  } catch (e) {
    res.status(500).json({ error: "raffle_failed", message: String(e) });
  }
};

// helper: read JSON body
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => { data += chunk });
    req.on("end", () => {
      try { resolve(JSON.parse(data || "{}")); }
      catch (e) { reject(e); }
    });
  });
}
