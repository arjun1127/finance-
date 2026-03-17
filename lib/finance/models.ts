import type { SupportedCurrency } from "@/lib/utils/currency"
import { getMonthKey, type MonthKey } from "@/lib/utils/date"

export type FixedExpenseCategory =
  | "rent"
  | "loan_emi"
  | "travel"
  | "insurance"
  | "subscriptions"
  | "utilities"
  | "other"

export interface FixedExpense {
  id: string
  name: string
  category: FixedExpenseCategory
  amount: number
  currency: SupportedCurrency
  startMonth?: MonthKey
  dayOfMonth?: number
  notes?: string
}

export type CommitmentFrequency = "once" | "monthly"
export type CommitmentPriority = "essential" | "important" | "discretionary"

export interface VariableCommitment {
  id: string
  title: string
  amount: number
  currency: SupportedCurrency
  dueMonth: MonthKey
  frequency: CommitmentFrequency
  priority: CommitmentPriority
  notes?: string
}

export interface IncomeEvent {
  id: string
  label: string
  amount: number
  currency: SupportedCurrency
  dayOfMonth: number
  startMonth: MonthKey
  endMonth?: MonthKey
}

export interface PlannerSettings {
  homeCurrency: SupportedCurrency
  countryMode: "india" | "japan"
  city: "tokyo" | "osaka" | "kyoto" | "fukuoka"
  includeJapanEstimate: boolean
  safetyBufferMonths: number
}

export interface FinanceProfile {
  currentSavings: number
  fixedExpenses: FixedExpense[]
  commitments: VariableCommitment[]
  incomes: IncomeEvent[]
  settings: PlannerSettings
}

export interface SimulationMonth {
  month: MonthKey
  openingBalance: number
  income: number
  fixedExpense: number
  commitments: number
  closingBalance: number
  delta: number
  deficit: boolean
  commitmentItems: VariableCommitment[]
}

export interface CashflowSimulation {
  startMonth: MonthKey
  months: number
  timeline: SimulationMonth[]
  firstDeficitMonth?: MonthKey
  firstIncomeMonth?: MonthKey
  minimumBalance: number
  survivalMonths: number
  preSalarySurvivalMonths: number
  requiredSafetyBuffer: number
  bufferCoverageMonths: number
}

export const DEFAULT_PLANNER_SETTINGS: PlannerSettings = {
  homeCurrency: "INR",
  countryMode: "india",
  city: "tokyo",
  includeJapanEstimate: false,
  safetyBufferMonths: 6,
}

export const EMPTY_PROFILE: FinanceProfile = {
  currentSavings: 0,
  fixedExpenses: [],
  commitments: [],
  incomes: [],
  settings: DEFAULT_PLANNER_SETTINGS,
}

export const CURRENT_MONTH = getMonthKey(new Date())
