import {
  Card as ShadCard,
  CardContent as ShadCardContent,
  CardDescription as ShadCardDescription,
  CardFooter as ShadCardFooter,
  CardHeader as ShadCardHeader,
  CardTitle as ShadCardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type CardTone = "light" | "dark"

interface FinanceCardProps extends React.ComponentProps<typeof ShadCard> {
  tone?: CardTone
}

export function Card({ className, tone = "light", ...props }: FinanceCardProps) {
  return (
    <ShadCard
      className={cn("card", tone === "dark" ? "finance-card-dark" : "finance-card", className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.ComponentProps<typeof ShadCardHeader>) {
  return <ShadCardHeader className={cn("space-y-1", className)} {...props} />
}

export function CardTitle({ className, ...props }: React.ComponentProps<typeof ShadCardTitle>) {
  return <ShadCardTitle className={cn("text-[18px]", className)} {...props} />
}

export function CardDescription({ className, ...props }: React.ComponentProps<typeof ShadCardDescription>) {
  return (
    <ShadCardDescription
      className={cn("text-sm text-[color:var(--text-muted)]", className)}
      {...props}
    />
  )
}

export function CardContent({ className, ...props }: React.ComponentProps<typeof ShadCardContent>) {
  return <ShadCardContent className={cn("space-y-3", className)} {...props} />
}

export function CardFooter({ className, ...props }: React.ComponentProps<typeof ShadCardFooter>) {
  return <ShadCardFooter className={cn("border-[color:var(--border-subtle)]", className)} {...props} />
}
