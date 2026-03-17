export type MonthKey = `${number}-${number}${number}`

function normalizeMonth(month: number) {
  return `${month}`.padStart(2, "0")
}

export function getMonthKey(date: Date): MonthKey {
  const year = date.getFullYear()
  const month = normalizeMonth(date.getMonth() + 1)
  return `${year}-${month}` as MonthKey
}

export function parseMonthKey(monthKey: string): Date {
  const [yearRaw, monthRaw] = monthKey.split("-")
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  return new Date(year, month - 1, 1)
}

export function addMonths(monthKey: MonthKey, delta: number): MonthKey {
  const date = parseMonthKey(monthKey)
  date.setMonth(date.getMonth() + delta)
  return getMonthKey(date)
}

export function monthRange(startMonth: MonthKey, months: number): MonthKey[] {
  return Array.from({ length: months }, (_, index) => addMonths(startMonth, index))
}

export function compareMonthKeys(a: MonthKey, b: MonthKey): number {
  const first = parseMonthKey(a).getTime()
  const second = parseMonthKey(b).getTime()
  if (first === second) {
    return 0
  }

  return first > second ? 1 : -1
}

export function monthDiff(start: MonthKey, end: MonthKey): number {
  const startDate = parseMonthKey(start)
  const endDate = parseMonthKey(end)
  return (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth())
}

export function monthLabel(monthKey: MonthKey, locale = "en-IN") {
  const date = parseMonthKey(monthKey)
  return date.toLocaleDateString(locale, { month: "short", year: "numeric" })
}
