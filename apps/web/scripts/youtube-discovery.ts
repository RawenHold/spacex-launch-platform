import "dotenv/config"

import { normalizeYouTubeUrlCandidate, normalizeYouTubeVideoItem } from "../lib/server/youtube/normalizers"
import { discoverAndStoreYouTubeVideos } from "../lib/server/youtube/service"
import type { VideoDiscoveryLaunchInput, YouTubeVideoItem } from "../lib/server/youtube/types"
import { parseYouTubeUrl } from "../lib/youtube"

const fixtureLaunch: VideoDiscoveryLaunchInput = {
  id: "dry-run-youtube-launch",
  missionName: {
    en: "Falcon 9 Starlink dry-run mission",
    ru: "Falcon 9 Starlink dry-run mission",
  },
  launchDateTimeUtc: "2026-07-10T02:14:00.000Z",
  rocketName: "Falcon 9",
  launchPadName: "SLC-40",
  youtubeUrlOrVideoId: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  externalWebcastUrls: ["https://youtu.be/dQw4w9WgXcQ?t=10"],
}

const fixtureVideo: YouTubeVideoItem = {
  id: "dQw4w9WgXcQ",
  snippet: {
    channelId: process.env.YOUTUBE_SPACEX_CHANNEL_ID || "fixture-spacex-channel",
    channelTitle: "SpaceX",
    title: "SpaceX Falcon 9 Starlink dry-run mission",
    description: "Local fixture only. Not official SpaceX data.",
    liveBroadcastContent: "upcoming",
    thumbnails: {
      high: { url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg" },
    },
  },
  contentDetails: {
    duration: "PT2H0M0S",
  },
  liveStreamingDetails: {
    scheduledStartTime: "2026-07-10T02:00:00.000Z",
  },
  status: {
    embeddable: true,
    privacyStatus: "public",
    uploadStatus: "processed",
  },
}

function argValue(name: string) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function dryRun() {
  const parsingExamples = [
    "dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share",
    "https://youtu.be/dQw4w9WgXcQ?t=42",
    "https://www.youtube.com/live/dQw4w9WgXcQ?si=demo",
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "not-a-youtube-url",
  ].map((input) => ({ input, parsed: parseYouTubeUrl(input) }))

  const urlCandidate = normalizeYouTubeUrlCandidate(
    fixtureLaunch.youtubeUrlOrVideoId ?? "",
    fixtureLaunch,
    "launch_field"
  )
  const metadataCandidate = normalizeYouTubeUrlCandidate(
    fixtureLaunch.externalWebcastUrls?.[0] ?? "",
    fixtureLaunch,
    "launch_library_metadata"
  )
  const apiCandidate = normalizeYouTubeVideoItem(fixtureVideo, fixtureLaunch, "fixture")

  console.log(
    JSON.stringify(
      {
        dryRun: true,
        writes: false,
        apiConfigured: Boolean(process.env.YOUTUBE_API_KEY),
        channelIdConfigured: Boolean(process.env.YOUTUBE_SPACEX_CHANNEL_ID),
        parsingExamples,
        candidates: [urlCandidate, metadataCandidate, apiCandidate].filter(Boolean),
      },
      null,
      2
    )
  )
}

async function main() {
  const live = process.argv.includes("--live")

  if (!live) {
    dryRun()
    return
  }

  if (process.env.ENABLE_YOUTUBE_SYNC !== "true") {
    throw new Error("Set ENABLE_YOUTUBE_SYNC=true before running live YouTube discovery.")
  }

  const launchId = argValue("--launch-id")
  if (!launchId) {
    throw new Error("Pass --launch-id <id> for live discovery.")
  }

  const summary = await discoverAndStoreYouTubeVideos({ launchId, dryRun: false })
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
