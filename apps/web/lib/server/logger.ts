import { maskSensitiveJson } from "@/lib/admin/audit-safety"

type LogLevel = "debug" | "info" | "warn" | "error"

interface LogPayload {
  event: string
  level: LogLevel
  timestamp: string
  metadata?: unknown
}

function shouldWrite(level: LogLevel) {
  if (level === "debug") {
    return process.env.NODE_ENV !== "production" || process.env.LOG_LEVEL === "debug"
  }

  return true
}

function write(level: LogLevel, event: string, metadata?: unknown) {
  if (!shouldWrite(level)) return

  const payload: LogPayload = {
    event,
    level,
    timestamp: new Date().toISOString(),
    metadata: metadata === undefined ? undefined : maskSensitiveJson(metadata),
  }
  const message = JSON.stringify(payload)

  if (level === "error") {
    console.error(message)
  } else if (level === "warn") {
    console.warn(message)
  } else {
    console.log(message)
  }
}

export const logger = {
  debug: (event: string, metadata?: unknown) => write("debug", event, metadata),
  info: (event: string, metadata?: unknown) => write("info", event, metadata),
  warn: (event: string, metadata?: unknown) => write("warn", event, metadata),
  error: (event: string, metadata?: unknown) => write("error", event, metadata),
}
