import { Search } from "lucide-react"

import { AdminAIActionPanel } from "@/components/admin/admin-ai-action-panel"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { requireAdminRole } from "@/lib/admin/auth"
import { stringifySafeJson } from "@/lib/admin/audit-safety"
import { getAdminRepository } from "@/lib/admin/repository"
import type { AdminAuditAction, AdminEntityType } from "@/types/admin"

const actions: AdminAuditAction[] = [
  "create",
  "update",
  "delete",
  "submit_for_review",
  "approve",
  "reject",
  "publish",
  "archive",
  "override",
  "sign_in",
  "rate_limit",
  "ai_generate_requested",
  "ai_generate_succeeded",
  "ai_generate_failed",
  "ai_draft_approved",
  "ai_draft_rejected",
  "ai_draft_merged",
  "ai_draft_archived",
]

const entityTypes: AdminEntityType[] = [
  "admin_user",
  "launch",
  "timeline_event",
  "source_record",
  "source_conflict",
  "video_record",
  "external_sync_run",
  "external_import_record",
  "article",
  "news_item",
  "faq_item",
  "ai_draft",
  "settings",
]

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>
}) {
  await requireAdminRole(["admin"])
  const query = (await searchParams) ?? {}
  const repository = getAdminRepository()
  const [logs, actors] = await Promise.all([
    repository.listAuditLogs({
      action: actions.includes(query.action as AdminAuditAction)
        ? (query.action as AdminAuditAction)
        : undefined,
      entityType: entityTypes.includes(query.entityType as AdminEntityType)
        ? (query.entityType as AdminEntityType)
        : undefined,
      actorId: query.actorId || undefined,
      from: query.from || undefined,
      to: query.to || undefined,
    }),
    repository.listAuditActors(),
  ])

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8">
      <AdminPageHeader
        eyebrow="Security"
        title="Audit log"
        description="Admin-only view of create, update, approval, publish, sign-in, override, and rate-limit events. Sensitive JSON fields are masked before rendering."
      />

      <section className="mission-panel rounded-lg p-5">
        <form className="grid gap-4 lg:grid-cols-5">
          <select name="action" defaultValue={query.action ?? ""} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
            <option value="">All actions</option>
            {actions.map((action) => (
              <option key={action} value={action}>{action.replaceAll("_", " ")}</option>
            ))}
          </select>
          <select name="entityType" defaultValue={query.entityType ?? ""} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
            <option value="">All entities</option>
            {entityTypes.map((entityType) => (
              <option key={entityType} value={entityType}>{entityType.replaceAll("_", " ")}</option>
            ))}
          </select>
          <select name="actorId" defaultValue={query.actorId ?? ""} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
            <option value="">All actors</option>
            {actors.map((actor) => (
              <option key={actor.id} value={actor.id}>{actor.email ?? actor.name}</option>
            ))}
          </select>
          <input name="from" type="date" defaultValue={query.from ?? ""} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="to" type="date" defaultValue={query.to ?? ""} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <button type="submit" className={buttonVariants({ variant: "default", size: "sm", className: "lg:col-span-5" })}>
            <Search data-icon aria-hidden="true" />
            Apply filters
          </button>
        </form>
      </section>

      <AdminAIActionPanel
        relatedEntityType="source"
        relatedEntityId={logs[0]?.entityId ?? "audit-review"}
        returnTo="/admin/audit"
        actions={[
          {
            task: "source_comparison",
            label: "Generate audit review note",
            instruction: "Summarize source-related audit signals and recommend manual checks. Do not resolve values.",
          },
        ]}
      />

      <section className="mission-panel rounded-lg p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="mission-eyebrow">Entries</p>
            <h2 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
              Latest {logs.length}
            </h2>
          </div>
          <Badge variant="outline">masked JSON</Badge>
        </div>

        <div className="space-y-4">
          {logs.map((entry) => (
            <article key={entry.id} className="rounded-lg border border-border/70 bg-card/60 p-4">
              <div className="grid gap-4 xl:grid-cols-[220px_1fr_220px]">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toISOString()}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {entry.actorEmail ?? entry.actorName ?? "system"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.actorRole ?? "system"}
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={entry.action === "rate_limit" ? "danger" : "info"}>
                      {entry.action.replaceAll("_", " ")}
                    </Badge>
                    <Badge variant="outline">{entry.entityType.replaceAll("_", " ")}</Badge>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">{entry.entityId}</p>
                  {entry.reason ? (
                    <p className="text-sm leading-6 text-muted-foreground">{entry.reason}</p>
                  ) : null}
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>{entry.ipAddress ?? "no ip"}</p>
                  <p className="mt-1 line-clamp-2">{entry.userAgent ?? "no user agent"}</p>
                </div>
              </div>
              <details className="mt-4 rounded-lg border border-border/70 bg-background/50 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-foreground">
                  JSON details
                </summary>
                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                  <pre className="overflow-auto rounded-lg bg-black/40 p-3 text-xs text-muted-foreground">
                    {stringifySafeJson(entry.beforeJson ?? null)}
                  </pre>
                  <pre className="overflow-auto rounded-lg bg-black/40 p-3 text-xs text-muted-foreground">
                    {stringifySafeJson(entry.afterJson ?? null)}
                  </pre>
                  <pre className="overflow-auto rounded-lg bg-black/40 p-3 text-xs text-muted-foreground">
                    {stringifySafeJson(entry.metadataJson ?? null)}
                  </pre>
                </div>
              </details>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
