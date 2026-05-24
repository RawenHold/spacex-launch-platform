export const dynamic = "force-static"

export function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#05070b"/><path d="M32 9c7 8 10 17 10 29 0 10-4 17-10 17s-10-7-10-17c0-12 3-21 10-29z" fill="#f8fafc"/><path d="M32 18c3 5 5 11 5 19 0 7-2 11-5 11s-5-4-5-11c0-8 2-14 5-19z" fill="#05070b"/><path d="M22 42 12 55l13-5M42 42l10 13-13-5" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M32 50v9" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/></svg>`

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
