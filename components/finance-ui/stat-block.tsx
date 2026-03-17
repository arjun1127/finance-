"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/finance-ui/card"

type Tone = "default" | "success" | "danger"

interface StatBlockProps {
  label: string
  value?: string
  numericValue?: number
  formatter?: (value: number) => string
  tone?: Tone
  meta?: string
  surface?: "light" | "dark" | "auto"
}

export function StatBlock({
  label,
  value,
  numericValue,
  formatter,
  tone = "default",
  meta,
  surface = "auto",
}: StatBlockProps) {
  const [displayValue, setDisplayValue] = useState(value ?? "")
  const resolvedSurface =
    surface === "auto"
      ? label
          .split("")
          .reduce((hash, char) => hash + char.charCodeAt(0), 0) % 2 === 0
        ? "dark"
        : "light"
      : surface
  const titleToneClass =
    tone === "default"
      ? "text-[color:var(--text-primary)]"
      : tone === "success"
        ? "text-[color:var(--success)]"
        : "text-[color:var(--danger)]"

  useEffect(() => {
    if (typeof numericValue !== "number") {
      setDisplayValue(value ?? "")
      return
    }

    let disposed = false
    let animation: { pause?: () => void; cancel?: () => void } | undefined

    void import("animejs")
      .then(({ animate }) => {
        const counter = { amount: 0 }

        animation = animate(counter, {
          amount: numericValue,
          duration: 900,
          ease: "outExpo",
          onUpdate: () => {
            if (disposed) {
              return
            }

            const next = formatter
              ? formatter(counter.amount)
              : Math.round(counter.amount).toLocaleString()
            setDisplayValue(next)
          },
        })
      })
      .catch(() => {
        if (disposed) {
          return
        }

        const next = formatter
          ? formatter(numericValue)
          : Math.round(numericValue).toLocaleString()
        setDisplayValue(next)
      })

    return () => {
      disposed = true
      animation?.pause?.()
      animation?.cancel?.()
    }
  }, [formatter, numericValue, value])

  return (
    <Card tone={resolvedSurface}>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className={cn("balance text-[22px]", titleToneClass)}>{displayValue}</CardTitle>
      </CardHeader>
      {meta ? (
        <CardContent className="pt-0">
          <p className="text-meta">{meta}</p>
        </CardContent>
      ) : null}
    </Card>
  )
}
