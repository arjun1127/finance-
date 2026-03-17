import {
  type CashflowSimulation,
  type CommitmentPriority,
  type FinanceProfile,
  type FixedExpense,
  type IncomeEvent,
  type SimulationMonth,
  type VariableCommitment,
} from "@/lib/finance/models"
import type { SupportedCurrency } from "@/lib/utils/currency"
import { convertCurrency } from "@/lib/utils/currency"
import { compareMonthKeys, getMonthKey, monthRange, type MonthKey } from "@/lib/utils/date"
import { average } from "@/lib/utils/math"

export interface SimulationConfig {
  startMonth?: MonthKey
  months?: number
  openingSavings?: number
}

function toHomeCurrency(amount: number, currency: SupportedCurrency, profile: FinanceProfile) {
  return convertCurrency(amount, currency, profile.settings.homeCurrency)
}

function isIncomeActive(event: IncomeEvent, month: MonthKey): boolean {
  const starts = compareMonthKeys(month, event.startMonth) >= 0
  const beforeEnd = event.endMonth ? compareMonthKeys(month, event.endMonth) <= 0 : true
  return starts && beforeEnd
}

function isCommitmentDue(commitment: VariableCommitment, month: MonthKey): boolean {
  if (commitment.frequency === "monthly") {
    return compareMonthKeys(month, commitment.dueMonth) >= 0
  }

  return commitment.dueMonth === month
}

function isFixedExpenseActive(expense: FixedExpense, month: MonthKey): boolean {
  if (!expense.startMonth) {
    return true
  }

  return compareMonthKeys(month, expense.startMonth) >= 0
}

function getFirstIncomeMonth(profile: FinanceProfile, startMonth: MonthKey): MonthKey | undefined {
  const candidateMonths = profile.incomes
    .filter((income) => income.amount > 0 && compareMonthKeys(income.startMonth, startMonth) >= 0)
    .map((income) => income.startMonth)
    .sort(compareMonthKeys)

  return candidateMonths[0]
}

export function calculateMonthlyIncome(profile: FinanceProfile, month: MonthKey): number {
  return profile.incomes
    .filter((event) => isIncomeActive(event, month))
    .reduce((total, event) => total + toHomeCurrency(event.amount, event.currency, profile), 0)
}

export function calculateMonthlyFixedExpense(profile: FinanceProfile, month: MonthKey): number {
  return profile.fixedExpenses
    .filter((expense) => isFixedExpenseActive(expense, month))
    .reduce(
      (total, expense) => total + toHomeCurrency(expense.amount, expense.currency, profile),
      0
    )
}

export function getDueCommitments(profile: FinanceProfile, month: MonthKey): VariableCommitment[] {
  return profile.commitments.filter((item) => isCommitmentDue(item, month))
}

function commitmentTotal(profile: FinanceProfile, commitments: VariableCommitment[]): number {
  return commitments.reduce(
    (total, item) => total + toHomeCurrency(item.amount, item.currency, profile),
    0
  )
}

function estimateEssentialMonthly(profile: FinanceProfile, startMonth: MonthKey): number {
  const monthlyEssentials = monthRange(startMonth, 3).map((month) => {
    const fixed = calculateMonthlyFixedExpense(profile, month)
    const essentialCommitments = getDueCommitments(profile, month).filter(
      (item) => item.priority === "essential" || item.priority === "important"
    )

    return fixed + commitmentTotal(profile, essentialCommitments)
  })

  return average(monthlyEssentials)
}

function monthlyCommitmentByPriority(
  profile: FinanceProfile,
  commitments: VariableCommitment[],
  priority: CommitmentPriority
): number {
  return commitments
    .filter((item) => item.priority === priority)
    .reduce((total, item) => total + toHomeCurrency(item.amount, item.currency, profile), 0)
}

export function simulateCashflow(profile: FinanceProfile, config: SimulationConfig = {}): CashflowSimulation {
  const startMonth = config.startMonth ?? getMonthKey(new Date())
  const months = config.months ?? 12
  const monthKeys = monthRange(startMonth, months)

  let runningBalance = config.openingSavings ?? profile.currentSavings
  let minimumBalance = runningBalance
  let firstDeficitMonth: MonthKey | undefined

  const timeline: SimulationMonth[] = monthKeys.map((month) => {
    const dueCommitments = getDueCommitments(profile, month)
    const monthlyIncome = calculateMonthlyIncome(profile, month)
    const monthlyFixedExpense = calculateMonthlyFixedExpense(profile, month)
    const commitments = commitmentTotal(profile, dueCommitments)

    const openingBalance = runningBalance
    const closingBalance = openingBalance + monthlyIncome - monthlyFixedExpense - commitments
    const delta = closingBalance - openingBalance
    const deficit = closingBalance < 0

    if (!firstDeficitMonth && deficit) {
      firstDeficitMonth = month
    }

    minimumBalance = Math.min(minimumBalance, closingBalance)
    runningBalance = closingBalance

    return {
      month,
      openingBalance,
      income: monthlyIncome,
      fixedExpense: monthlyFixedExpense,
      commitments,
      closingBalance,
      delta,
      deficit,
      commitmentItems: dueCommitments,
    }
  })

  const firstDeficitIndex = timeline.findIndex((month) => month.deficit)
  const survivalMonths = firstDeficitIndex === -1 ? months : firstDeficitIndex
  const firstIncomeMonth = getFirstIncomeMonth(profile, startMonth)
  const preSalaryTimeline = firstIncomeMonth
    ? timeline.filter((month) => compareMonthKeys(month.month, firstIncomeMonth) < 0)
    : timeline
  const preSalaryDeficitIndex = preSalaryTimeline.findIndex((month) => month.deficit)
  const preSalarySurvivalMonths =
    preSalaryDeficitIndex === -1 ? preSalaryTimeline.length : preSalaryDeficitIndex
  const essentialMonthly = estimateEssentialMonthly(profile, startMonth)
  const requiredSafetyBuffer = essentialMonthly * profile.settings.safetyBufferMonths
  const bufferCoverageMonths =
    essentialMonthly > 0 ? profile.currentSavings / essentialMonthly : Number.POSITIVE_INFINITY

  return {
    startMonth,
    months,
    timeline,
    firstDeficitMonth,
    firstIncomeMonth,
    minimumBalance,
    survivalMonths,
    preSalarySurvivalMonths,
    requiredSafetyBuffer,
    bufferCoverageMonths,
  }
}

export function getCommitmentBreakdown(profile: FinanceProfile, month: MonthKey) {
  const due = getDueCommitments(profile, month)

  return {
    essential: monthlyCommitmentByPriority(profile, due, "essential"),
    important: monthlyCommitmentByPriority(profile, due, "important"),
    discretionary: monthlyCommitmentByPriority(profile, due, "discretionary"),
  }
}
