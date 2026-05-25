import { PlayCircleIcon, RadioIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { extractYouTubeId, getYouTubeEmbedUrl } from "@/lib/youtube"
import type { VideoRecord } from "@/types/space"

export function YouTubeEmbed({
  video,
  labels,
}: {
  video?: VideoRecord
  labels: Record<VideoRecord["state"], string> & { placeholder: string }
}) {
  const videoId = video?.isPlaceholder
    ? undefined
    : extractYouTubeId(video?.providerVideoId ?? video?.videoId ?? video?.url)

  if (!video || !videoId) {
    return (
      <Card className="min-h-[320px] justify-center border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RadioIcon className="size-5 text-signal-blue" aria-hidden="true" />
            {labels.unavailable}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">{labels.placeholder}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 p-4">
        <div className="flex items-center gap-2">
          <PlayCircleIcon className="size-5 text-signal-blue" aria-hidden="true" />
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {video.sourceLabel.en}
          </span>
        </div>
        <Badge variant={video.state === "live" ? "danger" : "info"}>{labels[video.state]}</Badge>
      </div>
      <div className="aspect-video w-full bg-black">
        <iframe
          className="size-full"
          src={getYouTubeEmbedUrl(videoId)}
          title={video.title.en}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </Card>
  )
}
