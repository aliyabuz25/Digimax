import Head from 'next/head'
import { useEffect, useMemo, useRef, useState } from 'react'
import Header from '../components/Header'

type IptvChannel = {
  id: string
  name: string
  country: 'TR' | 'AZ'
  countryName: 'Türkiyə' | 'Azərbaycan'
  categories: string[]
  logo: string | null
  streamUrl: string
  streamTitle: string
  quality: string | null
  website: string | null
  label: string | null
}

type ApiChannel = {
  id?: string
  name?: string
  country?: 'TR' | 'AZ' | string
  categories?: string[]
  is_nsfw?: boolean
  logo?: string | null
  website?: string | null
}

type ApiStream = {
  channel?: string | null
  url?: string | null
  title?: string | null
  quality?: string | null
  label?: string | null
}

type ApiLogo = {
  channel?: string | null
  url?: string | null
}

type Props = {
  channels: IptvChannel[]
  sourceError: string | null
}

const CHANNEL_CACHE_TTL = 1000 * 60 * 10

let channelsCache:
  | {
      expiresAt: number
      channels: IptvChannel[]
      sourceError: string | null
    }
  | null = null

const countryLabels = {
  TR: 'Türkiyə',
  AZ: 'Azərbaycan',
} as const

function parseQualityScore(quality: string | null | undefined) {
  if (!quality) {
    return 0
  }

  const match = quality.match(/\d+/)
  return match ? Number(match[0]) : 0
}

function getStreamScore(stream: ApiStream) {
  const url = stream.url || ''
  const qualityScore = parseQualityScore(stream.quality)
  const label = (stream.label || '').toLowerCase()
  let score = qualityScore

  if (url.includes('.m3u8')) {
    score += 240
  }

  if (url.startsWith('https://')) {
    score += 120
  }

  if (label.includes('geo-blocked')) {
    score -= 500
  }

  if (label.includes('not 24/7')) {
    score -= 120
  }

  if (label.includes('offline')) {
    score -= 1000
  }

  return score
}

function fetchJson(url: string) {
  return fetch(url, { signal: AbortSignal.timeout(8000) }).then((response) =>
    response.json()
  )
}

function getLogoProxyUrl(src: string | null) {
  if (!src) {
    return null
  }

  return `/api/channel-logo?src=${encodeURIComponent(src)}`
}

function getCoverBackground(channel: IptvChannel) {
  const palette =
    channel.country === 'TR'
      ? ['#4a1616', '#241111', '#0b0b0b']
      : ['#14324d', '#15202b', '#0b0b0b']

  return {
    backgroundImage: `radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 32%), linear-gradient(180deg, ${palette[0]} 0%, ${palette[1]} 48%, ${palette[2]} 100%)`,
  }
}

function ChannelLogo({
  src,
  alt,
  className,
  fallbackClassName,
  fallbackText,
}: {
  src: string | null
  alt: string
  className: string
  fallbackClassName: string
  fallbackText: string
}) {
  const proxiedSrc = getLogoProxyUrl(src)
  const [hasError, setHasError] = useState(!proxiedSrc)

  useEffect(() => {
    setHasError(!proxiedSrc)
  }, [proxiedSrc])

  if (hasError) {
    return (
      <div className={fallbackClassName}>
        <img
          src="/channel-fallback.svg"
          alt=""
          className="h-8 w-8 opacity-85"
        />
        <span>{fallbackText}</span>
      </div>
    )
  }

  return (
    <img
      src={proxiedSrc || ''}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setHasError(true)}
    />
  )
}

function LivePlayer({ channel }: { channel: IptvChannel }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    let playerInstance: { destroy: () => void } | null = null
    let hlsInstance: {
      destroy: () => void
      loadSource: (src: string) => void
      attachMedia: (media: HTMLVideoElement) => void
    } | null = null

    const video = videoRef.current
    if (!video) {
      return
    }

    video.pause()
    video.removeAttribute('src')
    video.load()

    async function attachStream() {
      const currentVideo = videoRef.current
      if (!currentVideo) {
        return
      }

      const PlyrModule = await import('plyr')
      const Plyr = PlyrModule.default
      const streamUrl = channel.streamUrl

      playerInstance = new Plyr(currentVideo, {
        controls: [
          'play-large',
          'play',
          'progress',
          'current-time',
          'mute',
          'volume',
          'settings',
          'pip',
          'fullscreen',
        ],
        settings: ['quality', 'speed'],
        speed: {
          selected: 1,
          options: [0.75, 1, 1.25, 1.5],
        },
        fullscreen: {
          iosNative: true,
        },
        keyboard: {
          focused: true,
          global: true,
        },
        tooltips: {
          controls: true,
          seek: true,
        },
        disableContextMenu: true,
      })

      if (currentVideo.canPlayType('application/vnd.apple.mpegurl')) {
        currentVideo.src = streamUrl
        return
      }

      const HlsModule = await import('hls.js')
      const Hls = HlsModule.default

      if (Hls.isSupported()) {
        hlsInstance = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          startLevel: -1,
          maxBufferLength: 20,
          maxMaxBufferLength: 30,
          capLevelToPlayerSize: true,
        })
        hlsInstance.loadSource(streamUrl)
        hlsInstance.attachMedia(currentVideo)
        return
      }

      currentVideo.src = streamUrl
    }

    attachStream()

    return () => {
      if (playerInstance) {
        playerInstance.destroy()
      }

      if (hlsInstance) {
        hlsInstance.destroy()
      }
    }
  }, [channel])

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-[30px] bg-black"
      onContextMenu={(event) => event.preventDefault()}
    >
      <video
        ref={videoRef}
        className="digimax-player h-full w-full bg-black object-cover"
        playsInline
        disablePictureInPicture
        controlsList="nodownload noplaybackrate noremoteplayback"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(229,9,20,0.16),transparent_26%),linear-gradient(180deg,rgba(0,0,0,0.45),transparent_28%,transparent_70%,rgba(0,0,0,0.7))]" />

      <div className="pointer-events-none absolute left-5 top-5 z-10 flex items-center gap-3 rounded-full border border-white/10 bg-black/45 px-3 py-2 backdrop-blur-md">
        <ChannelLogo
          src={channel.logo}
          alt={`${channel.name} logo`}
          className="h-9 w-9 rounded-xl bg-white object-contain p-1.5"
          fallbackClassName="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[0px]"
          fallbackText={channel.name.slice(0, 1)}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{channel.name}</p>
          <p className="truncate text-xs text-white/45">{channel.countryName}</p>
        </div>
      </div>
    </div>
  )
}

function ChannelRail({
  title,
  channels,
  selectedId,
  onSelect,
}: {
  title: string
  channels: IptvChannel[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  if (!channels.length) {
    return null
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            {title}
          </h2>
          <p className="mt-1 text-sm text-white/45">
            Seçilmiş kanalları birbaşa açın.
          </p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {channels.map((channel) => {
          const isActive = channel.id === selectedId

          return (
            <button
              key={channel.id}
              type="button"
              className={`group relative min-h-[270px] min-w-[180px] overflow-hidden border text-left transition ${
                isActive
                  ? 'border-[#595959]'
                  : 'border-[#222] hover:border-[#3a3a3a]'
              }`}
              style={getCoverBackground(channel)}
              onClick={() => onSelect(channel.id)}
              aria-label={channel.name}
            >
              {getLogoProxyUrl(channel.logo) ? (
                <img
                  src={getLogoProxyUrl(channel.logo) || ''}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-4 bottom-0 top-0 m-auto h-auto w-auto max-h-[82%] opacity-[0.18] blur-2xl object-contain"
                />
              ) : null}

              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_28%,rgba(0,0,0,0.22)_100%)]" />
              <div className="absolute inset-[12px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.14),rgba(255,255,255,0.03)_38%,transparent_70%)]" />

              <div className="relative flex h-full items-center justify-center p-5">
                <div className="flex h-full w-full items-center justify-center rounded-sm border border-white/8 bg-black/10">
                  <ChannelLogo
                    src={channel.logo}
                    alt={`${channel.name} logo`}
                    className="max-h-[156px] w-auto max-w-[138px] object-contain drop-shadow-[0_18px_40px_rgba(0,0,0,0.62)]"
                    fallbackClassName="flex h-[108px] w-[108px] items-center justify-center rounded border border-white/10 bg-white/10 text-xl font-semibold uppercase tracking-[0.22em] text-white"
                    fallbackText={channel.name
                      .split(' ')
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join('')}
                  />
                </div>
              </div>

              <span className="sr-only">{channel.name}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function LivePage({ channels, sourceError }: Props) {
  const [selectedId, setSelectedId] = useState(channels[0]?.id || null)

  const selectedChannel =
    channels.find((channel) => channel.id === selectedId) || channels[0] || null

  const turkeyChannels = useMemo(
    () => channels.filter((channel) => channel.country === 'TR'),
    [channels]
  )
  const azerbaijanChannels = useMemo(
    () => channels.filter((channel) => channel.country === 'AZ'),
    [channels]
  )

  return (
    <>
      <Head>
        <title>Canlı TV</title>
      </Head>

      <div className="min-h-screen bg-[#050505] text-white">
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#050505_0%,#101010_24%,#050505_100%)]" />
        </div>

        <Header />

        <main className="mx-auto flex w-full max-w-[1600px] flex-col px-4 pb-16 pt-28 sm:px-6 lg:px-10">
          {sourceError ? (
            <section className="mb-6 rounded-[24px] border border-yellow-500/20 bg-yellow-500/10 px-5 py-4 text-sm text-yellow-100 shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
              {sourceError}
            </section>
          ) : null}

          {selectedChannel ? (
            <>
              <section className="overflow-hidden border border-[#222] bg-[#111]">
                <div className="grid gap-0 xl:grid-cols-[0.88fr_1.12fr]">
                  <div className="flex flex-col justify-between border-b border-[#222] p-6 sm:p-8 xl:border-b-0 xl:border-r xl:p-10">
                    <div>
                      <div className="flex items-center gap-4">
                        <ChannelLogo
                          src={selectedChannel.logo}
                          alt={`${selectedChannel.name} logo`}
                          className="h-16 w-16 rounded border border-white/10 bg-white object-contain p-2"
                          fallbackClassName="flex h-16 w-16 items-center justify-center rounded border border-white/10 bg-white/10 text-base font-semibold uppercase tracking-[0.22em] text-white"
                          fallbackText={selectedChannel.name
                            .split(' ')
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join('')}
                        />
                        <div className="min-w-0">
                          <h1 className="truncate text-4xl font-semibold tracking-tight text-white sm:text-[44px]">
                            {selectedChannel.name}
                          </h1>
                          <p className="mt-2 text-sm text-white/45">
                            {selectedChannel.countryName}
                          </p>
                        </div>
                      </div>

                      <p className="mt-8 max-w-xl text-[15px] leading-7 text-white/58">
                        Kanalları aşağıdakı sıralardan dəyişib yayımı dərhal
                        izləyə bilərsiniz.
                      </p>
                    </div>

                    <div className="mt-10 grid gap-3 sm:grid-cols-3">
                      <div className="border border-[#222] bg-[#181818] px-4 py-4">
                        <p className="text-[11px] text-white/35">
                          Kateqoriya
                        </p>
                        <p className="mt-2 truncate text-base font-medium text-white">
                          {selectedChannel.categories.slice(0, 2).join(' • ') ||
                            'Canlı yayım'}
                        </p>
                      </div>
                      <div className="border border-[#222] bg-[#181818] px-4 py-4">
                        <p className="text-[11px] text-white/35">
                          Axın tipi
                        </p>
                        <p className="mt-2 truncate text-base font-medium text-white">
                          {selectedChannel.label || selectedChannel.streamTitle}
                        </p>
                      </div>
                      <div className="border border-[#222] bg-[#181818] px-4 py-4">
                        <p className="text-[11px] text-white/35">
                          Keyfiyyət
                        </p>
                        <p className="mt-2 truncate text-base font-medium text-white">
                          {selectedChannel.quality || 'Auto'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 xl:p-5">
                    <div className="aspect-video border border-[#222] bg-black p-2">
                      <LivePlayer channel={selectedChannel} />
                    </div>
                  </div>
                </div>
              </section>

              <ChannelRail
                title="Türkiyə"
                channels={turkeyChannels}
                selectedId={selectedChannel.id}
                onSelect={setSelectedId}
              />
              <ChannelRail
                title="Azərbaycan"
                channels={azerbaijanChannels}
                selectedId={selectedChannel.id}
                onSelect={setSelectedId}
              />
            </>
          ) : (
            <section className="border border-[#222] bg-[#111] px-6 py-8 text-base text-white/70">
              Hazırda kanal tapılmadı. Bir az sonra yenidən yoxlayın.
            </section>
          )}
        </main>
      </div>
    </>
  )
}

export async function getServerSideProps() {
  const sourceErrorDefault =
    'iptv-org mənbəyini yükləmək mümkün olmadı. Bir az sonra yenidən cəhd edin.'

  if (channelsCache && channelsCache.expiresAt > Date.now()) {
    return {
      props: {
        channels: channelsCache.channels,
        sourceError: channelsCache.sourceError,
      },
    }
  }

  try {
    const [channelsRes, streamsRes, logosRes] = await Promise.all([
      fetchJson('https://iptv-org.github.io/api/channels.json'),
      fetchJson('https://iptv-org.github.io/api/streams.json'),
      fetchJson('https://iptv-org.github.io/api/logos.json'),
    ])

    const allowedCountries = new Set(['TR', 'AZ'])
    const channels: ApiChannel[] = Array.isArray(channelsRes) ? channelsRes : []
    const streams: ApiStream[] = Array.isArray(streamsRes) ? streamsRes : []
    const logos: ApiLogo[] = Array.isArray(logosRes) ? logosRes : []

    const selectedChannels = channels.filter(
      (
        channel
      ): channel is ApiChannel & { id: string; name: string; country: 'TR' | 'AZ' } => {
        return (
          typeof channel.country === 'string' &&
          allowedCountries.has(channel.country) &&
          channel.is_nsfw === false &&
          typeof channel.id === 'string' &&
          typeof channel.name === 'string'
        )
      }
    )

    const streamMap = new Map<string, ApiStream>()

    for (const stream of streams) {
      if (!stream?.channel || !stream?.url) {
        continue
      }

      const previous = streamMap.get(stream.channel)

      if (!previous || getStreamScore(stream) > getStreamScore(previous)) {
        streamMap.set(stream.channel, stream)
      }
    }

    const logoMap = new Map<string, string>()

    for (const logo of logos) {
      if (!logo?.channel || !logo?.url || logoMap.has(logo.channel)) {
        continue
      }

      logoMap.set(logo.channel, logo.url)
    }

    const mergedChannels = selectedChannels
      .map((channel) => {
        const stream = streamMap.get(channel.id)

        if (!stream || !stream.url) {
          return null
        }

        return {
          id: channel.id,
          name: channel.name,
          country: channel.country,
          countryName:
            channel.country === 'TR' ? countryLabels.TR : countryLabels.AZ,
          categories: Array.isArray(channel.categories) ? channel.categories : [],
          logo: logoMap.get(channel.id) || channel.logo || null,
          streamUrl: stream.url,
          streamTitle: stream.title || channel.name,
          quality: stream.quality || null,
          website: channel.website || null,
          label: stream.label || null,
        }
      })
      .filter((channel): channel is IptvChannel => channel !== null)
      .sort((left, right) => left.name.localeCompare(right.name))

    channelsCache = {
      expiresAt: Date.now() + CHANNEL_CACHE_TTL,
      channels: mergedChannels,
      sourceError: null,
    }

    return {
      props: {
        channels: mergedChannels,
        sourceError: null,
      },
    }
  } catch (error) {
    channelsCache = {
      expiresAt: Date.now() + 1000 * 30,
      channels: [],
      sourceError: sourceErrorDefault,
    }

    return {
      props: {
        channels: [],
        sourceError: sourceErrorDefault,
      },
    }
  }
}

export default LivePage
