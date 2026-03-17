import { NextResponse } from "next/server"

import { generateAdvisorReport } from "@/lib/ai/advisor"
import { generateGeminiAdvice } from "@/lib/ai/gemini"
import type { FinanceProfile } from "@/lib/finance/models"
import type { MonthKey } from "@/lib/utils/date"

interface AdvisorRequestBody {
  profile?: FinanceProfile
  config?: {
    startMonth?: MonthKey
    months?: number
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AdvisorRequestBody

    if (!body.profile) {
      return NextResponse.json({ error: "Missing profile" }, { status: 400 })
    }

    const report = generateAdvisorReport(body.profile, body.config ?? {})
    try {
      const advice = await generateGeminiAdvice(body.profile, report)
      return NextResponse.json({
        ...advice,
        source: "gemini",
      })
    } catch {
      const fallbackActions = report.suggestions
        .slice(0, 5)
        .map((suggestion) => suggestion.title)

      return NextResponse.json({
        summary: report.summary,
        actions: fallbackActions,
        model: "local-fallback",
        source: "fallback",
      })
    }
  } catch {
    return NextResponse.json(
      {
        error: "Invalid advisor request payload",
      },
      { status: 400 }
    )
  }
}
