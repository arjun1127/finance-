import type { CashflowSimulation, FinanceProfile } from "@/lib/finance/models"
import { monthDiff } from "@/lib/utils/date"

export type RiskLevel = "info" | "warning" | "critical"

export interface AdvisorFinding {
  level: RiskLevel
  title: string
  detail: string
}

export function evaluateSimulationRisks(profile: FinanceProfile, simulation: CashflowSimulation): AdvisorFinding[] {
  const findings: AdvisorFinding[] = []

  if (simulation.firstDeficitMonth) {
    findings.push({
      level: "critical",
      title: "Deficit detected",
      detail: `Cash balance turns negative in ${simulation.firstDeficitMonth}.`,
    })
  }

  if (simulation.requiredSafetyBuffer > profile.currentSavings) {
    findings.push({
      level: "warning",
      title: "Emergency buffer gap",
      detail: `Savings are below recommended safety buffer by ${Math.ceil(simulation.requiredSafetyBuffer - profile.currentSavings)} ${profile.settings.homeCurrency}.`,
    })
  }

  if (simulation.firstIncomeMonth) {
    const monthsUntilSalary = Math.max(0, monthDiff(simulation.startMonth, simulation.firstIncomeMonth))
    if (monthsUntilSalary > 0 && simulation.preSalarySurvivalMonths < monthsUntilSalary) {
      findings.push({
        level: "critical",
        title: "Pre-salary survival risk",
        detail: `Savings run out before income starts in ${simulation.firstIncomeMonth}.`,
      })
    }
  }

  if (simulation.bufferCoverageMonths < profile.settings.safetyBufferMonths) {
    findings.push({
      level: "warning",
      title: "Buffer coverage is low",
      detail: `Current savings cover only ${simulation.bufferCoverageMonths.toFixed(1)} months of essential burn.`,
    })
  }

  const negativeDeltaMonths = simulation.timeline.filter((month) => month.delta < 0).length
  if (negativeDeltaMonths >= Math.max(2, Math.floor(simulation.months / 3))) {
    findings.push({
      level: "warning",
      title: "Frequent negative months",
      detail: `You have ${negativeDeltaMonths} months with negative net cashflow in this horizon.`,
    })
  }

  if (!simulation.firstDeficitMonth && simulation.minimumBalance > 0) {
    findings.push({
      level: "info",
      title: "Runway is stable",
      detail: "No deficit month detected in this simulation range.",
    })
  }

  return findings
}
