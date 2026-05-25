"use client"

import { Bot, Loader2 } from "lucide-react"
import { useFormStatus } from "react-dom"

import { buttonVariants } from "@/components/ui/button"

export function AdminAISubmitButton({
  label,
  disabled,
}: {
  label: string
  disabled?: boolean
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={buttonVariants({ variant: "outline", size: "sm" })}
    >
      {pending ? (
        <Loader2 data-icon className="animate-spin" aria-hidden="true" />
      ) : (
        <Bot data-icon aria-hidden="true" />
      )}
      {pending ? "Generating..." : label}
    </button>
  )
}
