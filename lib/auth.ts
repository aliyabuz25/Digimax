import crypto from 'crypto'
import type { NextApiRequest, NextApiResponse } from 'next'
import db from './db'

const SESSION_COOKIE = 'netflix_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30

type SessionRow = {
  token: string
  user_id: number
  expires_at: string
}

type UserRow = {
  id: number
  email: string
  password_hash: string
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, originalHash] = storedHash.split(':')

  if (!salt || !originalHash) {
    return false
  }

  const hashBuffer = crypto.scryptSync(password, salt, 64)
  const originalBuffer = Buffer.from(originalHash, 'hex')

  if (hashBuffer.length !== originalBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(hashBuffer, originalBuffer)
}

export function createUser(email: string, password: string) {
  const statement = db.prepare(
    'INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)'
  )

  const result = statement.run(
    email.toLowerCase(),
    hashPassword(password),
    new Date().toISOString()
  )

  return {
    id: Number(result.lastInsertRowid),
    email: email.toLowerCase(),
  }
}

export function findUserByEmail(email: string) {
  return db
    .prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
    .get(email.toLowerCase()) as UserRow | undefined
}

export function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString('hex')
  const createdAt = new Date()
  const expiresAt = new Date(createdAt.getTime() + SESSION_MAX_AGE * 1000)

  db.prepare(
    'INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)'
  ).run(token, userId, createdAt.toISOString(), expiresAt.toISOString())

  return {
    token,
    expiresAt,
  }
}

export function getSessionToken(req: NextApiRequest) {
  const cookieHeader = req.headers.cookie || ''
  const cookies = cookieHeader.split(';').map((part) => part.trim())
  const sessionCookie = cookies.find((part) => part.startsWith(`${SESSION_COOKIE}=`))
  return sessionCookie?.split('=').slice(1).join('=') || null
}

export function getSessionUser(req: NextApiRequest) {
  const token = getSessionToken(req)

  if (!token) {
    return null
  }

  const session = db
    .prepare(
      `SELECT token, user_id, expires_at
       FROM sessions
       WHERE token = ?`
    )
    .get(token) as SessionRow | undefined

  if (!session) {
    return null
  }

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
    return null
  }

  const user = db
    .prepare('SELECT id, email FROM users WHERE id = ?')
    .get(session.user_id) as { id: number; email: string } | undefined

  return user || null
}

export function clearSession(res: NextApiResponse, token?: string | null) {
  if (token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
  }

  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  )
}

export function setSessionCookie(res: NextApiResponse, token: string) {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`
  )
}
