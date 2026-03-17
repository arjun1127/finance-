"use client"

import { useEffect, useState } from "react"

import { generateAdvisorReport } from "@/lib/ai/advisor"
import type { AdvisorReport } from "@/lib/ai/advisor"
import type { FinanceProfile } from "@/lib/finance/models"
import type { MonthKey } from "@/lib/utils/date"

interface AdvisorConfig {
  startMonth: MonthKey
  months: number
}

interface AdvisorApiResponse {
  summary: string
  actions: string[]
  model: string
  source?: "gemini" | "fallback"
}

interface RemoteAdviceState extends AdvisorApiResponse {
  requestId: string
}

export function useAdvisor(profile: FinanceProfile, config: AdvisorConfig): AdvisorReport {
  const localReport = generateAdvisorReport(profile, config)

  const requestId = JSON.stringify({
    startMonth: config.startMonth,
    months: config.months,
    currentSavings: profile.currentSavings,
    fixedExpenses: profile.fixedExpenses,
    commitments: profile.commitments,
    incomes: profile.incomes,
    settings: profile.settings,
  })

  const hasProfileData =
    profile.currentSavings > 0 ||
    profile.fixedExpenses.length > 0 ||
    profile.commitments.length > 0 ||
    profile.incomes.length > 0

  const [remoteAdvice, setRemoteAdvice] = useState<RemoteAdviceState | null>(null)

  useEffect(() => {
    if (!hasProfileData || !localReport.shouldTriggerAi) {
      return
    }

    let cancelled = false

    async function fetchAdvice() {
      try {
        const response = await fetch("/api/advisor", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            profile,
            config: {
              startMonth: config.startMonth,
              months: config.months,
            },
          }),
        })

        if (!response.ok) {
          return
        }

        const data = (await response.json()) as AdvisorApiResponse

        if (!cancelled && typeof data.summary === "string" && Array.isArray(data.actions)) {
          setRemoteAdvice({
            ...data,
            requestId,
          })
        }
      } catch {
        // Keep local deterministic advisor as fallback.
      }
    }

    void fetchAdvice()

    return () => {
      cancelled = true
    }
  }, [config.months, config.startMonth, hasProfileData, localReport.shouldTriggerAi, profile, requestId])

  if (!hasProfileData || !remoteAdvice || remoteAdvice.requestId !== requestId) {
    return localReport
  }

  return {
    ...localReport,
    aiSummary: remoteAdvice.summary,
    aiActions: remoteAdvice.actions,
    aiModel: remoteAdvice.model,
  }
}
