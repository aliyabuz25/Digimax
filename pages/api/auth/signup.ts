import type { NextApiRequest, NextApiResponse } from 'next'
import {
  createSession,
  createUser,
  findUserByEmail,
  setSessionCookie,
} from '../../../lib/auth'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password } = req.body || {}

  if (!email || !password || String(password).length < 4) {
    return res.status(400).json({ error: 'Invalid email or password' })
  }

  const existingUser = findUserByEmail(String(email))
  if (existingUser) {
    return res.status(409).json({ error: 'User already exists' })
  }

  const user = createUser(String(email), String(password))
  const session = createSession(user.id)

  setSessionCookie(res, session.token)
  return res.status(201).json({ user })
}
