import { Bot } from "lucide-react"

import { AdminAISubmitButton } from "@/components/admin/admin-ai-submit-button"
import { Badge } from "@/components/ui/badge"
import { generateAIDraftAction } from "@/lib/admin/actions"
import { getAIRuntimeConfig } from "@/lib/server/ai/service"
import type { AIDraft, AIDraftType } from "@/types/admin"

export interface AdminAIAction {
  task: AIDraftType
  label: string
  instruction: string
}

export function AdminAIActionPanel({
  relatedEntityType,
  relatedEntityId,
  returnTo,
  actions,
}: {
  relatedEntityType: AIDraft["relatedEntityType"]
  relatedEntityId: string
  returnTo: string
  actions: AdminAIAction[]
}) {
  const runtime = getAIRuntimeConfig()

  return (
    <section className="mission-panel rounded-lg p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Bot data-icon className="size-4 text-signal-blue" aria-hidden="true" />
            <p className="mission-eyebrow">AI drafts</p>
          </div>
          <h2 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
            Review-only generation
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            AI can create drafts and source-comparison notes only. It cannot approve, publish, overwrite approved content, or resolve conflicts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={runtime.enabled ? "success" : "warning"}>
            {runtime.enabled ? "enabled" : "disabled"}
          </Badge>
          <Badge variant={runtime.realApiAvailable ? "info" : "outline"}>
            {runtime.realApiAvailable ? runtime.model : "mock mode"}
          </Badge>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => (
          <form key={action.task + action.label} action={generateAIDraftAction} className="rounded-lg border border-border/70 bg-card/50 p-3">
            <input type="hidden" name="task" value={action.task} />
            <input type="hidden" name="relatedEntityType" value={relatedEntityType} />
            <input type="hidden" name="relatedEntityId" value={relatedEntityId} />
            <input type="hidden" name="instruction" value={action.instruction} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <AdminAISubmitButton label={action.label} disabled={!runtime.enabled} />
          </form>
        ))}
      </div>
    </section>
  )
}
