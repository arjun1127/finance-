import type {
  FinanceProfile,
  FixedExpense,
  IncomeEvent,
  PlannerSettings,
  VariableCommitment,
} from "@/lib/finance/models"
import { DEFAULT_PLANNER_SETTINGS as defaultSettings, EMPTY_PROFILE as emptyProfile } from "@/lib/finance/models"

export const FINANCE_STORAGE_KEY = "finance-planner:v3"

function createEmptyProfile(): FinanceProfile {
  return {
    ...emptyProfile,
    settings: { ...defaultSettings },
    fixedExpenses: [],
    commitments: [],
    incomes: [],
  }
}

export const initialFinanceProfile: FinanceProfile = createEmptyProfile()

export type FinanceAction =
  | { type: "reset_profile" }
  | { type: "set_profile"; payload: FinanceProfile }
  | { type: "set_savings"; payload: number }
  | { type: "set_settings"; payload: Partial<PlannerSettings> }
  | { type: "upsert_fixed_expense"; payload: FixedExpense }
  | { type: "remove_fixed_expense"; payload: string }
  | { type: "upsert_commitment"; payload: VariableCommitment }
  | { type: "remove_commitment"; payload: string }
  | { type: "upsert_income"; payload: IncomeEvent }
  | { type: "remove_income"; payload: string }

function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  const exists = items.some((existing) => existing.id === item.id)
  if (!exists) {
    return [...items, item]
  }

  return items.map((existing) => (existing.id === item.id ? item : existing))
}

export function financeReducer(state: FinanceProfile, action: FinanceAction): FinanceProfile {
  switch (action.type) {
    case "reset_profile":
      return createEmptyProfile()
    case "set_profile":
      return action.payload
    case "set_savings":
      return { ...state, currentSavings: action.payload }
    case "set_settings":
      return { ...state, settings: { ...state.settings, ...action.payload } }
    case "upsert_fixed_expense":
      return { ...state, fixedExpenses: upsertById(state.fixedExpenses, action.payload) }
    case "remove_fixed_expense":
      return {
        ...state,
        fixedExpenses: state.fixedExpenses.filter((item) => item.id !== action.payload),
      }
    case "upsert_commitment":
      return { ...state, commitments: upsertById(state.commitments, action.payload) }
    case "remove_commitment":
      return {
        ...state,
        commitments: state.commitments.filter((item) => item.id !== action.payload),
      }
    case "upsert_income":
      return { ...state, incomes: upsertById(state.incomes, action.payload) }
    case "remove_income":
      return {
        ...state,
        incomes: state.incomes.filter((item) => item.id !== action.payload),
      }
    default:
      return state
  }
}
