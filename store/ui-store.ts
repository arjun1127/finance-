import { getMonthKey, type MonthKey } from "@/lib/utils/date"

export interface UiState {
  simulationStartMonth: MonthKey
  simulationMonths: number
  compactTable: boolean
}

export const UI_STORAGE_KEY = "finance-planner:ui:v1"

export const initialUiState: UiState = {
  simulationStartMonth: getMonthKey(new Date()),
  simulationMonths: 12,
  compactTable: false,
}

export type UiAction =
  | { type: "set_start_month"; payload: MonthKey }
  | { type: "set_months"; payload: number }
  | { type: "toggle_compact" }

export function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case "set_start_month":
      return { ...state, simulationStartMonth: action.payload }
    case "set_months":
      return { ...state, simulationMonths: action.payload }
    case "toggle_compact":
      return { ...state, compactTable: !state.compactTable }
    default:
      return state
  }
}
