export default function handler(req, res) {
  try {
    res.status(200).json({ ok: true, runtime: 'node', path: req.url });
  } catch (e) {
    res.status(500).json({ error: 'health_failed', message: String(e && e.message || e) });
  }
}
