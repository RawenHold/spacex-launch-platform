const youtubeIdPattern = /^[a-zA-Z0-9_-]{11}$/

export interface YouTubeParseResult {
  providerVideoId?: string
  canonicalUrl?: string
  isValid: boolean
  error?: string
}

function cleanVideoId(value: string | undefined | null) {
  if (!value) return undefined
  const candidate = value.trim().split(/[?&#/]/)[0]
  return youtubeIdPattern.test(candidate) ? candidate : undefined
}

export function parseYouTubeUrl(input?: string): YouTubeParseResult {
  if (!input) {
    return { isValid: false, error: "Enter a YouTube URL or 11-character video id." }
  }

  const trimmed = input.trim()
  const directId = cleanVideoId(trimmed)

  if (directId) {
    return {
      providerVideoId: directId,
      canonicalUrl: `https://www.youtube.com/watch?v=${directId}`,
      isValid: true,
    }
  }

  try {
    const url = new URL(trimmed)
    const hostname = url.hostname.replace(/^www\./, "").toLowerCase()
    let videoId: string | undefined

    if (hostname === "youtu.be") {
      videoId = cleanVideoId(url.pathname.replace(/^\/+/, ""))
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com" || hostname === "music.youtube.com") {
      videoId =
        cleanVideoId(url.searchParams.get("v")) ??
        cleanVideoId(url.pathname.match(/^\/(?:live|embed|shorts)\/([^/?#]+)/)?.[1])
    }

    if (!videoId) {
      return { isValid: false, error: "Could not find a valid YouTube video id in that URL." }
    }

    return {
      providerVideoId: videoId,
      canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
      isValid: true,
    }
  } catch {
    return { isValid: false, error: "Use a valid YouTube URL or 11-character video id." }
  }
}

export function extractYouTubeId(input?: string): string | undefined {
  return parseYouTubeUrl(input).providerVideoId
}

export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`
}
