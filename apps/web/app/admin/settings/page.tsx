import { KeyRound, Languages, Settings2, ShieldCheck, ToggleLeft } from "lucide-react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { getAdminRepository } from "@/lib/admin/repository"

function ConfigBadge({ configured }: { configured: boolean }) {
  return (
    <Badge variant={configured ? "success" : "outline"}>
      {configured ? "configured" : "not configured"}
    </Badge>
  )
}

export default async function AdminSettingsPage() {
  const repository = getAdminRepository()
  const settings = await repository.getSettings()

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8">
      <AdminPageHeader
        eyebrow="System"
        title="Settings"
        description="Configuration placeholders for locales, data sync, API key status indicators, AI behavior, and approval rules. Secret values are never rendered."
        actions={
          <button type="button" disabled className={buttonVariants({ variant: "default", size: "sm" })}>
            <Settings2 data-icon aria-hidden="true" />
            Save settings
          </button>
        }
      />

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="mission-panel rounded-lg p-5">
          <div className="flex items-center gap-3">
            <Languages data-icon className="size-4 text-signal-blue" aria-hidden="true" />
            <div>
              <p className="mission-eyebrow">Locales</p>
              <h3 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
                Language settings
              </h3>
            </div>
          </div>
          <dl className="mt-5 grid gap-4 text-sm">
            <div className="rounded-lg border border-border/70 bg-card/60 p-4">
              <dt className="text-muted-foreground">Site name</dt>
              <dd className="mt-2 font-semibold text-foreground">{settings.siteName}</dd>
            </div>
            <div className="rounded-lg border border-border/70 bg-card/60 p-4">
              <dt className="text-muted-foreground">Enabled locales</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {settings.enabledLocales.map((locale) => (
                  <Badge key={locale} variant="info">
                    {locale}
                  </Badge>
                ))}
              </dd>
            </div>
            <div className="rounded-lg border border-border/70 bg-card/60 p-4">
              <dt className="text-muted-foreground">Default locale</dt>
              <dd className="mt-2">
                <Badge variant="success">{settings.defaultLocale}</Badge>
              </dd>
            </div>
          </dl>
        </div>

        <div className="mission-panel rounded-lg p-5">
          <div className="flex items-center gap-3">
            <KeyRound data-icon className="size-4 text-signal-amber" aria-hidden="true" />
            <div>
              <p className="mission-eyebrow">Secrets</p>
              <h3 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
                API key status only
              </h3>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-card/60 p-4">
              <span className="text-sm text-muted-foreground">Launch Library API</span>
              <ConfigBadge configured={settings.launchLibraryApiConfigured} />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-card/60 p-4">
              <span className="text-sm text-muted-foreground">YouTube Data API</span>
              <ConfigBadge configured={settings.youtubeDataApiConfigured} />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-card/60 p-4">
              <span className="text-sm text-muted-foreground">OpenAI API</span>
              <ConfigBadge configured={settings.openAiConfigured} />
            </div>
          </div>
        </div>

        <div className="mission-panel rounded-lg p-5">
          <div className="flex items-center gap-3">
            <ToggleLeft data-icon className="size-4 text-signal-blue" aria-hidden="true" />
            <div>
              <p className="mission-eyebrow">Data sync</p>
              <h3 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
                Placeholder toggles
              </h3>
            </div>
          </div>
          <div className="mt-5 space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              Automated data sync is disabled until source adapters, conflict storage,
              audit logs, and scheduler controls are implemented.
            </p>
            <Badge variant={settings.dataSyncEnabled ? "success" : "outline"}>
              {settings.dataSyncEnabled ? "sync enabled" : "sync disabled"}
            </Badge>
          </div>
        </div>

        <div className="mission-panel rounded-lg p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck data-icon className="size-4 text-signal-green" aria-hidden="true" />
            <div>
              <p className="mission-eyebrow">Approval rules</p>
              <h3 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
                Human gate
              </h3>
            </div>
          </div>
          <div className="mt-5 space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              AI drafts require human review before merge, approval, or publication.
            </p>
            <p>Editors cannot publish in MVP configuration.</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant={settings.requireApprovalForAiDrafts ? "success" : "danger"}>
                AI approval required
              </Badge>
              <Badge variant={settings.editorCanPublish ? "warning" : "success"}>
                editors cannot publish
              </Badge>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
