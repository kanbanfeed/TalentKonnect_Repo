// api/spotlight/email.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    ok: true,
    sentAt: new Date().toISOString(),
    note: 'Simulated send (stubbed in serverless)'
  });
}
