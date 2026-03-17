"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/finance-ui/card"
import { estimateJapanFixedExpenses } from "@/lib/finance/japan-estimator"
import type { FinanceAction } from "@/store/finance-store"
import type { FinanceProfile } from "@/lib/finance/models"

interface JapanEstimatorCardProps {
  profile: FinanceProfile
  dispatch: (action: FinanceAction) => void
}

export function JapanEstimatorCard({ profile, dispatch }: JapanEstimatorCardProps) {
  const [multiplier, setMultiplier] = useState(1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Japan Mode Estimator</CardTitle>
        <CardDescription>Generate baseline fixed expenses for your selected city in Japan.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <label className="grid gap-2">
          <span className="text-sm text-[color:var(--text-secondary)]">
            Lifestyle multiplier ({multiplier.toFixed(1)}x)
          </span>
          <input
            type="range"
            min={0.8}
            max={1.4}
            step={0.05}
            value={multiplier}
            onChange={(event) => setMultiplier(Number(event.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[color:var(--bg-muted)] accent-black"
          />
          <span className="text-meta">0.8x conservative • 1.4x premium</span>
        </label>

        <Button
          onClick={() => {
            const estimated = estimateJapanFixedExpenses({
              city: profile.settings.city,
              currency: profile.settings.homeCurrency,
              lifestyleMultiplier: multiplier,
            })

            estimated.forEach((expense) => {
              dispatch({ type: "upsert_fixed_expense", payload: expense })
            })

            dispatch({
              type: "set_settings",
              payload: { countryMode: "japan", includeJapanEstimate: true },
            })
          }}
        >
          Inject Japan estimates
        </Button>
      </CardContent>
    </Card>
  )
}
