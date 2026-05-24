"use client"

import { CalendarPlusIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"

export function AddReminderButton({
  label,
  addedLabel,
}: {
  label: string
  addedLabel: string
}) {
  const [added, setAdded] = useState(false)

  return (
    <Button
      type="button"
      variant={added ? "secondary" : "outline"}
      size="sm"
      aria-live="polite"
      onClick={() => setAdded(true)}
    >
      <CalendarPlusIcon data-icon="inline-start" />
      {added ? addedLabel : label}
    </Button>
  )
}
