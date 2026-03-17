import { cn } from "@/lib/utils"

type TimelineTone = "default" | "success" | "danger"

export interface TimelineItem {
  id: string
  title: string
  meta?: string
  value?: string
  tone?: TimelineTone
}

interface TimelineProps {
  items: TimelineItem[]
}

const toneClass: Record<TimelineTone, string> = {
  default: "text-[color:var(--text-secondary)]",
  success: "text-[color:var(--success)]",
  danger: "text-[color:var(--danger)]",
}

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={item.id}
          className={cn(
            "relative rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-3 py-2.5"
          )}
        >
          {index < items.length - 1 ? (
            <span className="absolute top-[calc(100%+2px)] left-4 h-3 w-px bg-[color:var(--border-subtle)]" />
          ) : null}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm text-[color:var(--text-primary)]">{item.title}</p>
              {item.meta ? <p className="text-meta">{item.meta}</p> : null}
            </div>
            {item.value ? (
              <span className={cn("text-sm font-medium", toneClass[item.tone ?? "default"])}>{item.value}</span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}
