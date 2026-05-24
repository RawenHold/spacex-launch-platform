import type { Launch, SourceRecord } from "../types/spacex"

const officialYouTubeSource: SourceRecord = {
  id: "source-spacex-youtube",
  kind: "official_youtube",
  title: "Official SpaceX YouTube channel",
  url: "https://www.youtube.com/@SpaceX",
  publisher: "SpaceX",
  confidence: "official_confirmed",
  isPrimary: true,
}

const launchLibrarySource: SourceRecord = {
  id: "source-launch-library",
  kind: "launch_library",
  title: "The Space Devs Launch Library 2",
  url: "https://ll.thespacedevs.com/",
  publisher: "The Space Devs",
  confidence: "multi_source_confirmed",
  isPrimary: false,
}

export const mockLaunches: Launch[] = [
  {
    id: "launch-demo-starlink",
    slug: "demo-starlink-mission",
    missionName: "Demo Starlink Mission",
    summary: {
      en: "A mock upcoming Falcon 9 mission used to validate launch cards, countdowns, video embeds, and planned timeline states.",
      ru: "Тестовая будущая миссия Falcon 9 для проверки карточек запусков, обратного отсчета, видео и плановой временной шкалы.",
    },
    status: "tbd",
    confidence: "estimated",
    netUtc: "2026-07-01T12:00:00.000Z",
    rocket: {
      id: "rocket-falcon-9",
      name: "Falcon 9",
      family: "falcon_9",
      reusable: true,
      sourceRecords: [launchLibrarySource],
    },
    launchPad: {
      id: "pad-ksc-39a",
      name: "LC-39A",
      location: "Kennedy Space Center, Florida",
      operator: "SpaceX",
      sourceRecords: [launchLibrarySource],
    },
    timeline: [
      {
        id: "event-liftoff",
        kind: "liftoff",
        label: { en: "Liftoff", ru: "Старт" },
        timingKind: "planned",
        missionElapsedTime: "T+00:00:00",
        confidence: "estimated",
        sourceRecordIds: ["source-launch-library"],
      },
      {
        id: "event-max-q",
        kind: "max_q",
        label: { en: "Max Q", ru: "Максимальный аэродинамический напор" },
        timingKind: "estimated",
        missionElapsedTime: "T+00:01:12",
        confidence: "estimated",
        sourceRecordIds: ["source-launch-library"],
      },
      {
        id: "event-stage-separation",
        kind: "stage_separation",
        label: { en: "Stage Separation", ru: "Разделение ступеней" },
        timingKind: "estimated",
        missionElapsedTime: "T+00:02:42",
        confidence: "estimated",
        sourceRecordIds: ["source-launch-library"],
      },
      {
        id: "event-booster-landing",
        kind: "booster_landing",
        label: { en: "Booster Landing", ru: "Посадка ускорителя" },
        timingKind: "estimated",
        missionElapsedTime: "T+00:08:30",
        confidence: "estimated",
        sourceRecordIds: ["source-launch-library"],
      },
      {
        id: "event-payload-deployment",
        kind: "payload_deployment",
        label: { en: "Payload Deployment", ru: "Развертывание полезной нагрузки" },
        timingKind: "estimated",
        missionElapsedTime: "T+00:59:00",
        confidence: "estimated",
        sourceRecordIds: ["source-launch-library"],
      },
    ],
    sourceRecords: [officialYouTubeSource, launchLibrarySource],
    videos: [
      {
        id: "video-spacex-official-channel",
        provider: "youtube",
        youtubeVideoId: "official-channel-placeholder",
        title: "Official channel placeholder",
        state: "upcoming",
        sourceRecordIds: ["source-spacex-youtube"],
      },
    ],
    tags: ["mock", "upcoming"],
  },
]
