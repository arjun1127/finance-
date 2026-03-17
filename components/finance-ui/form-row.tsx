import { cn } from "@/lib/utils"

interface FormRowProps {
  label: string
  hint?: string
  children: React.ReactNode
  className?: string
}

export function FormRow({ label, hint, children, className }: FormRowProps) {
  return (
    <label className={cn("grid gap-1.5", className)}>
      <span className="text-sm text-[color:var(--text-secondary)]">{label}</span>
      {children}
      {hint ? <span className="text-meta">{hint}</span> : null}
    </label>
  )
}
