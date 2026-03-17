import type { FixedExpense, FixedExpenseCategory } from "@/lib/finance/models"
import type { SupportedCurrency } from "@/lib/utils/currency"
import japanCosts from "@/data/japan-costs.json"

interface JapanEstimateInput {
  city: "tokyo" | "osaka" | "kyoto" | "fukuoka"
  currency?: SupportedCurrency
  lifestyleMultiplier?: number
}

const CATEGORY_MAP: Record<string, FixedExpenseCategory> = {
  rent: "rent",
  utilities: "utilities",
  travel: "travel",
  insurance: "insurance",
  subscriptions: "subscriptions",
  food: "other",
  misc: "other",
}

export function estimateJapanFixedExpenses(input: JapanEstimateInput): FixedExpense[] {
  const base = japanCosts[input.city]
  const multiplier = input.lifestyleMultiplier ?? 1
  // Explicitly ignore input.currency because japanCosts.json is explicitly in JPY.
  const currency: SupportedCurrency = "JPY"

  return Object.entries(base).map(([key, amount]) => ({
    id: `japan-${input.city}-${key}`,
    name: `Japan ${key}`,
    category: CATEGORY_MAP[key] ?? "other",
    amount: Math.round(amount * multiplier),
    currency,
    notes: "Estimated from city baseline; adjust with your actual quotes.",
  }))
}
