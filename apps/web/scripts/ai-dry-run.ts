import "dotenv/config"

import { dryRunAIDraftFixture } from "../lib/server/ai/service"
import type { AIDraftType } from "../types/admin"

const tasks: AIDraftType[] = [
  "launch_summary",
  "article",
  "news_summary",
  "faq",
  "seo",
  "timeline_suggestion",
  "source_comparison",
]

function argValue(name: string) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

const task = (argValue("--task") ?? "launch_summary") as AIDraftType

if (!tasks.includes(task)) {
  throw new Error(`Unknown AI dry-run task: ${task}`)
}

console.log(JSON.stringify(dryRunAIDraftFixture(task), null, 2))
