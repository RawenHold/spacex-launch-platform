import { extractYouTubeId } from "@/lib/youtube"
import type { NormalizedVideoCandidate } from "@/lib/server/youtube/types"

export interface VideoConflictInput {
  launchYoutubeUrl?: string | null
  approvedVideoIds: string[]
  candidate: NormalizedVideoCandidate
}

export interface VideoConflict {
  field: string
  existingValue: string
  importedValue: string
  summary: string
}

export function detectVideoConflicts(input: VideoConflictInput): VideoConflict[] {
  const conflicts: VideoConflict[] = []
  const candidateId = input.candidate.providerVideoId
  const launchVideoId = extractYouTubeId(input.launchYoutubeUrl ?? undefined)

  if (launchVideoId && candidateId && launchVideoId !== candidateId) {
    conflicts.push({
      field: "youtubeVideoId",
      existingValue: launchVideoId,
      importedValue: candidateId,
      summary: "Launch YouTube URL points to a different video id than the discovered candidate.",
    })
  }

  for (const approvedVideoId of input.approvedVideoIds) {
    if (candidateId && approvedVideoId !== candidateId) {
      conflicts.push({
        field: "approvedVideoId",
        existingValue: approvedVideoId,
        importedValue: candidateId,
        summary: "An approved/published video already exists for this launch.",
      })
    }
  }

  if (process.env.YOUTUBE_SPACEX_CHANNEL_ID && input.candidate.channelId) {
    if (input.candidate.channelId !== process.env.YOUTUBE_SPACEX_CHANNEL_ID) {
      conflicts.push({
        field: "youtubeChannelId",
        existingValue: process.env.YOUTUBE_SPACEX_CHANNEL_ID,
        importedValue: input.candidate.channelId,
        summary: "Candidate does not come from the configured official SpaceX channel.",
      })
    }
  }

  return conflicts
}
