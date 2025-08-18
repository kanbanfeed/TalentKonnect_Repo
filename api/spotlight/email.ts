// api/spotlight/email.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
export const config = { runtime: 'nodejs'  };

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const now = new Date().toISOString();
  // mocked “send”
  return res.status(200).json({
    ok: true,
    sentAt: now,
    to: 'Daily Spotlight Winner',
    title: 'Your submission has won!'
  });
}
