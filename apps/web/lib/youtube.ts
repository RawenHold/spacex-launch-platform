const youtubeIdPattern = /^[a-zA-Z0-9_-]{11}$/

export function extractYouTubeId(input?: string): string | undefined {
  if (!input) {
    return undefined
  }

  if (youtubeIdPattern.test(input)) {
    return input
  }

  try {
    const url = new URL(input)
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace("/", "") || undefined
    }
    if (url.hostname.includes("youtube.com")) {
      return url.searchParams.get("v") ?? undefined
    }
  } catch {
    return undefined
  }

  return undefined
}

export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`
}
