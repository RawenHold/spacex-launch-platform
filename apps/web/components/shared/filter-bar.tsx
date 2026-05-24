"use client"

import { Button } from "@/components/ui/button"

export interface FilterOption {
  value: string
  label: string
}

export interface FilterGroup {
  id: string
  label: string
  options: FilterOption[]
}

export function FilterBar({
  groups,
  values,
  onChange,
  onReset,
  resetLabel,
}: {
  groups: FilterGroup[]
  values: Record<string, string>
  onChange: (id: string, value: string) => void
  onReset: () => void
  resetLabel: string
}) {
  return (
    <div className="mission-panel rounded-xl p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <div className="grid gap-3 md:grid-cols-4">
          {groups.map((group) => (
            <label key={group.id} className="flex flex-col gap-2">
              <span className="mission-eyebrow">{group.label}</span>
              <select
                value={values[group.id] ?? "all"}
                onChange={(event) => onChange(group.id, event.target.value)}
                className="h-11 rounded-lg border border-input bg-background/70 px-3 text-sm text-foreground outline-none transition focus:ring-[3px] focus:ring-ring/40"
              >
                {group.options.map((option) => (
                  <option key={option.value} value={option.value} className="bg-background">
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <Button type="button" variant="outline" onClick={onReset}>
          {resetLabel}
        </Button>
      </div>
    </div>
  )
}
