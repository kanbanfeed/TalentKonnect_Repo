import type { VercelRequest, VercelResponse } from '@vercel/node';

// Ensure this is a Node function (runtime: nodejs)
export const config = { runtime: 'nodejs' };

export default function handler(req: VercelRequest, res: VercelResponse) {
  const now = new Date().toISOString();

  // Here you could use an actual email service like SendGrid, Mailgun, etc.
  // The recipient could be dynamically passed (e.g., from req.body).
  const recipient = req.body?.email || 'Daily Spotlight Winner';
  
  // Mocking email "send"
  return res.status(200).json({
    ok: true,
    sentAt: now,
    to: recipient,
    title: 'Your submission has won!',
  });
}
