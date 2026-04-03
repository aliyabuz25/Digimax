import type { NextApiRequest, NextApiResponse } from 'next'
import {
  createSession,
  findUserByEmail,
  setSessionCookie,
  verifyPassword,
} from '../../../lib/auth'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password } = req.body || {}
  const user = findUserByEmail(String(email || ''))

  if (!user || !verifyPassword(String(password || ''), user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const session = createSession(user.id)
  setSessionCookie(res, session.token)

  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
    },
  })
}
