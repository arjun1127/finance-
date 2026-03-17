export interface FinancialTermDefinition {
  id: string
  term: string
  definition: string
  formula?: string
  context: string
}

export const FINANCIAL_TERM_DEFINITIONS: FinancialTermDefinition[] = [
  {
    id: "current-savings",
    term: "Current Savings",
    definition: "Cash you already have available at the start of the simulation.",
    formula: "Opening cash in month 1",
    context: "Used as the starting balance, not income.",
  },
  {
    id: "opening-balance",
    term: "Opening Balance",
    definition: "Cash available at the beginning of a month.",
    formula: "Previous month closing balance",
    context: "Represents carry-over funds.",
  },
  {
    id: "income",
    term: "Income",
    definition: "Money received in a month from active income events.",
    formula: "Sum of active income timeline events",
    context: "Salary and other inflows are counted only after their start month.",
  },
  {
    id: "fixed-expense",
    term: "Fixed Expense",
    definition: "Recurring monthly cost such as rent, EMI, insurance, subscriptions, or utilities.",
    formula: "Sum of active recurring costs in that month",
    context: "Each fixed expense can have a start month.",
  },
  {
    id: "variable-commitment",
    term: "Variable Commitment",
    definition: "Event-based cost (one-time or monthly after due month), like medical or relocation payment.",
    formula: "Sum of commitments due in that month",
    context: "Useful for planning non-routine financial obligations.",
  },
  {
    id: "net-cashflow",
    term: "Net Cashflow (Delta)",
    definition: "Monthly change in cash after income and expenses.",
    formula: "Income - Fixed Expense - Commitments",
    context: "Positive means savings grow; negative means savings shrink.",
  },
  {
    id: "closing-balance",
    term: "Closing Balance",
    definition: "Cash left at the end of a month.",
    formula: "Opening Balance + Net Cashflow",
    context: "Becomes next month's opening balance.",
  },
  {
    id: "deficit",
    term: "Deficit Month",
    definition: "A month where closing balance drops below zero.",
    formula: "Closing Balance < 0",
    context: "Indicates you cannot cover all obligations with available cash.",
  },
  {
    id: "first-deficit-month",
    term: "First Deficit Month",
    definition: "The first month in the timeline where cash goes negative.",
    context: "Primary warning signal for survival risk.",
  },
  {
    id: "survival-runway",
    term: "Survival Runway",
    definition: "How many months you remain non-negative before first deficit.",
    formula: "Index of first deficit month, else full horizon",
    context: "Shows how long your current plan survives.",
  },
  {
    id: "first-income-month",
    term: "First Income Month",
    definition: "Earliest month in the simulation when any income event becomes active.",
    context: "Critical when salary starts in the future.",
  },
  {
    id: "pre-salary-survival",
    term: "Pre-Salary Survival",
    definition: "Months your savings can survive before income starts.",
    formula: "Runway measured only in pre-income period",
    context: "Flags risk of running out before salary begins.",
  },
  {
    id: "essential-burn",
    term: "Essential Burn",
    definition: "Estimated monthly baseline spend for essentials.",
    formula: "Average(Fixed Expense + essential/important commitments)",
    context: "Used to calculate safety buffer target.",
  },
  {
    id: "safety-buffer-target",
    term: "Safety Buffer Target",
    definition: "Recommended reserve to survive essential spending for a chosen number of months.",
    formula: "Essential Burn × Safety Buffer Months",
    context: "Acts as emergency fund target.",
  },
  {
    id: "buffer-coverage",
    term: "Buffer Coverage",
    definition: "How many months your current savings can support essential burn.",
    formula: "Current Savings ÷ Essential Burn",
    context: "Higher coverage means stronger resilience.",
  },
  {
    id: "emergency-buffer-gap",
    term: "Emergency Buffer Gap",
    definition: "How far current savings are below the safety buffer target.",
    formula: "Safety Buffer Target - Current Savings",
    context: "Positive gap means your emergency reserve is underfunded.",
  },
  {
    id: "commitment-priority",
    term: "Commitment Priority",
    definition: "Classification of commitments as essential, important, or discretionary.",
    context: "Used by optimizer and advisor to suggest what to delay first.",
  },
  {
    id: "home-currency",
    term: "Home Currency",
    definition: "Base currency used internally for simulation calculations.",
    context: "All inflows/outflows are converted to this currency before simulation.",
  },
  {
    id: "table-output-currency",
    term: "Cashflow Table Output Currency",
    definition: "Display currency used in the table for readability.",
    context: "Current table output is JPY using configured FX assumptions.",
  },
  {
    id: "horizon",
    term: "Simulation Horizon",
    definition: "Number of months projected forward.",
    context: "Longer horizons reveal long-term deficit and buffer risk patterns.",
  },
]
