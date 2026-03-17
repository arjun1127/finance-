import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/finance-ui/card"

interface SectionProps {
  title: string
  description?: string
  tone?: "light" | "dark"
  children: React.ReactNode
}

export function Section({ title, description, tone = "light", children }: SectionProps) {
  return (
    <Card tone={tone}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
