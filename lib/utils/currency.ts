export type SupportedCurrency = "INR" | "JPY"

export const INR_PER_JPY = 0.6
export const JPY_PER_INR = 1 / INR_PER_JPY

const RATE_TO_INR: Record<SupportedCurrency, number> = {
  INR: 1,
  JPY: INR_PER_JPY,
}

export function convertCurrency(amount: number, from: SupportedCurrency, to: SupportedCurrency): number {
  const inInr = amount * RATE_TO_INR[from]
  return inInr / RATE_TO_INR[to]
}

export function formatCurrency(amount: number, currency: SupportedCurrency = "INR", locale?: string): string {
  const localeByCurrency: Record<SupportedCurrency, string> = {
    INR: "en-IN",
    JPY: "ja-JP",
  }

  return new Intl.NumberFormat(locale ?? localeByCurrency[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0)
}
