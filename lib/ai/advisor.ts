import { optimizeCurrentMonth, type OptimizationSuggestion } from "@/lib/finance/optimizer"
import { evaluateSimulationRisks, type AdvisorFinding } from "@/lib/finance/rules"
import { simulateCashflow } from "@/lib/finance/engine"
import type { FinanceProfile } from "@/lib/finance/models"
import { monthDiff, monthLabel, type MonthKey } from "@/lib/utils/date"
import { formatCurrency } from "@/lib/utils/currency"

export interface AdvisorReport {
  summary: string
  findings: AdvisorFinding[]
  suggestions: OptimizationSuggestion[]
  timelineNarrative: string[]
  aiSummary?: string
  aiActions?: string[]
  aiModel?: string
  shouldTriggerAi: boolean
  aiTriggerReason?: string
}

interface AdvisorConfig {
  startMonth?: MonthKey
  months?: number
}

export function generateAdvisorReport(profile: FinanceProfile, config: AdvisorConfig = {}): AdvisorReport {
  const simulation = simulateCashflow(profile, config)
  const findings = evaluateSimulationRisks(profile, simulation)
  const suggestions = optimizeCurrentMonth(profile, config.startMonth)

  const monthsUntilIncome = simulation.firstIncomeMonth
    ? Math.max(0, monthDiff(simulation.startMonth, simulation.firstIncomeMonth))
    : 0

  const summary =
    simulation.firstIncomeMonth && monthsUntilIncome > 0 && simulation.preSalarySurvivalMonths < monthsUntilIncome
      ? `Savings may run out before salary starts in ${monthLabel(simulation.firstIncomeMonth)}.`
      : simulation.firstDeficitMonth
        ? `Deficit starts in ${monthLabel(simulation.firstDeficitMonth)}. Prioritize expense timing and immediate buffer protection.`
        : "No deficit month detected in this horizon. Focus on strengthening your safety buffer."

  const timelineNarrative = simulation.timeline.slice(0, 6).map((month) => {
    const delta = month.delta >= 0 ? `+${formatCurrency(month.delta, profile.settings.homeCurrency)}` : formatCurrency(month.delta, profile.settings.homeCurrency)
    return `${monthLabel(month.month)}: closing ${formatCurrency(month.closingBalance, profile.settings.homeCurrency)} (${delta})`
  })

  const criticalFinding = findings.find((finding) => finding.level === "critical")
  const warningFinding = findings.find((finding) => finding.level === "warning")
  const shouldTriggerAi = Boolean(criticalFinding || warningFinding || suggestions.length > 0)
  const aiTriggerReason =
    criticalFinding?.title ??
    warningFinding?.title ??
    (suggestions.length > 0 ? "Optimization opportunity detected" : undefined)

  return {
    summary,
    findings,
    suggestions,
    timelineNarrative,
    shouldTriggerAi,
    aiTriggerReason,
  }
}
