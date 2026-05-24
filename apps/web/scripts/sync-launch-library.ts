import "dotenv/config"

import { normalizeLaunchLibraryLaunch } from "../lib/server/sync/normalizers"
import { runLaunchLibrarySync } from "../lib/server/sync/sync-service"
import type { LaunchLibraryLaunch, SyncMode } from "../lib/server/sync/types"

const fixtureLaunch: LaunchLibraryLaunch = {
  id: "dry-run-fixture-spacex",
  url: "https://ll.thespacedevs.com/2.3.0/launches/dry-run-fixture-spacex/",
  slug: "dry-run-spacex-falcon-9",
  name: "Falcon 9 | Dry Run Payload",
  net: "2026-07-10T02:14:00Z",
  status: { name: "To Be Confirmed", abbrev: "TBC" },
  launch_service_provider: { name: "SpaceX", abbrev: "SpX" },
  rocket: {
    configuration: {
      full_name: "Falcon 9 Block 5",
      family: "Falcon",
      variant: "Block 5",
      manufacturer: { name: "SpaceX" },
    },
  },
  mission: {
    name: "Dry Run Payload",
    description: "Local dry-run fixture. Not official data.",
    orbit: { name: "Low Earth Orbit", abbrev: "LEO" },
    type: "Communications",
  },
  pad: {
    name: "SLC-40",
    location: { name: "Cape Canaveral Space Force Station, FL, USA" },
  },
  infoURLs: [{ url: "https://www.spacex.com/launches/", source: "SpaceX" }],
  vidURLs: [{ url: "https://www.youtube.com/@SpaceX", source: "SpaceX" }],
}

function argValue(name: string) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  const live = process.argv.includes("--live")
  const mode = (argValue("--mode") ?? "upcoming") as SyncMode

  if (dryRun && !live) {
    const normalized = normalizeLaunchLibraryLaunch(fixtureLaunch)
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          fixture: true,
          writes: false,
          normalized,
        },
        null,
        2
      )
    )
    return
  }

  const summary = await runLaunchLibrarySync({
    mode,
    dryRun,
    limit: Number(argValue("--limit") ?? 10),
  })
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
