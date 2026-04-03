import type { NextApiRequest, NextApiResponse } from 'next'
import { clearSession, getSessionToken } from '../../../lib/auth'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  clearSession(res, getSessionToken(req))
  return res.status(200).json({ ok: true })
}
