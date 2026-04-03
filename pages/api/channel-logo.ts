import fs from 'fs'
import path from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'

const fallbackPath = path.join(process.cwd(), 'public', 'channel-fallback.svg')
const LOGO_CACHE_TTL = 1000 * 60 * 60 * 6
const FAILED_LOGO_CACHE_TTL = 1000 * 60 * 30

let logoCache = new Map<
  string,
  {
    expiresAt: number
    body: Buffer
    contentType: string
  }
>()

function readFallback() {
  return fs.readFileSync(fallbackPath)
}

function sendFallback(res: NextApiResponse) {
  const fallback = readFallback()
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  res.status(200).send(fallback)
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const src = Array.isArray(req.query.src) ? req.query.src[0] : req.query.src

  if (!src || typeof src !== 'string') {
    sendFallback(res)
    return
  }

  const cached = logoCache.get(src)

  if (cached && cached.expiresAt > Date.now()) {
    res.setHeader('Content-Type', cached.contentType)
    res.setHeader('Cache-Control', 'public, max-age=21600, stale-while-revalidate=86400')
    res.status(200).send(cached.body)
    return
  }

  try {
    const targetUrl = new URL(src)

    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      sendFallback(res)
      return
    }

    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DigimaxTV/1.0)',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        Referer: 'https://iptv-org.github.io/',
      },
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      const fallback = readFallback()
      logoCache.set(src, {
        expiresAt: Date.now() + FAILED_LOGO_CACHE_TTL,
        body: fallback,
        contentType: 'image/svg+xml',
      })
      sendFallback(res)
      return
    }

    const contentType = response.headers.get('content-type') || 'image/png'
    const body = Buffer.from(await response.arrayBuffer())

    logoCache.set(src, {
      expiresAt: Date.now() + LOGO_CACHE_TTL,
      body,
      contentType,
    })

    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=21600, stale-while-revalidate=86400')
    res.status(200).send(body)
  } catch (error) {
    const fallback = readFallback()
    logoCache.set(src, {
      expiresAt: Date.now() + FAILED_LOGO_CACHE_TTL,
      body: fallback,
      contentType: 'image/svg+xml',
    })
    sendFallback(res)
  }
}
