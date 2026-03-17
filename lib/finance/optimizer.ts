import { getCommitmentBreakdown, getDueCommitments, simulateCashflow } from "@/lib/finance/engine"
import type { FinanceProfile } from "@/lib/finance/models"
import { getMonthKey, type MonthKey } from "@/lib/utils/date"

export type OptimizationAction =
  | "delay_commitment"
  | "cut_discretionary"
  | "reduce_fixed"
  | "increase_income"
  | "build_buffer"

export interface OptimizationSuggestion {
  action: OptimizationAction
  title: string
  detail: string
  estimatedImpact: number
}

export function optimizeCurrentMonth(profile: FinanceProfile, targetMonth?: MonthKey): OptimizationSuggestion[] {
  const month = targetMonth ?? getMonthKey(new Date())
  const simulation = simulateCashflow(profile, { startMonth: month, months: 1 })
  const current = simulation.timeline[0]

  if (!current) {
    return []
  }

  const suggestions: OptimizationSuggestion[] = []
  const dueCommitments = getDueCommitments(profile, month)
  const discretionary = dueCommitments
    .filter((item) => item.priority === "discretionary")
    .sort((a, b) => b.amount - a.amount)

  if (discretionary.length > 0) {
    const item = discretionary[0]
    suggestions.push({
      action: "delay_commitment",
      title: `Delay or split ${item.title}`,
      detail: "Moving one discretionary commitment to next month usually gives immediate breathing room.",
      estimatedImpact: item.amount,
    })
  }

  const discretionaryTotal = getCommitmentBreakdown(profile, month).discretionary
  if (discretionaryTotal > 0) {
    suggestions.push({
      action: "cut_discretionary",
      title: "Cut discretionary spend this month",
      detail: "Prioritize essentials and important commitments until the cashflow turns positive.",
      estimatedImpact: discretionaryTotal,
    })
  }

  if (current.deficit) {
    suggestions.push({
      action: "increase_income",
      title: "Add temporary income for deficit months",
      detail: "Even a short-term side income can extend survival runway and avoid debt spirals.",
      estimatedImpact: Math.abs(current.delta),
    })
  }

  const fixedRatio = current.income > 0 ? current.fixedExpense / current.income : 1
  if (fixedRatio > 0.6) {
    suggestions.push({
      action: "reduce_fixed",
      title: "Renegotiate fixed costs",
      detail: "When fixed costs are over 60% of income, flexibility drops quickly during shocks.",
      estimatedImpact: current.fixedExpense * 0.1,
    })
  }

  if (simulation.requiredSafetyBuffer > profile.currentSavings) {
    suggestions.push({
      action: "build_buffer",
      title: "Build emergency buffer",
      detail: "Your liquid savings are below the recommended safety buffer for this expense level.",
      estimatedImpact: simulation.requiredSafetyBuffer - profile.currentSavings,
    })
  }

  return suggestions.sort((a, b) => b.estimatedImpact - a.estimatedImpact)
}
