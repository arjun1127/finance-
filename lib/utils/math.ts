export function sum(values: number[]): number {
  return values.reduce((acc, value) => acc + value, 0)
}

export function average(values: number[]): number {
  if (values.length === 0) {
    return 0
  }

  return sum(values) / values.length
}

export function round(amount: number, digits = 0): number {
  const factor = 10 ** digits
  return Math.round(amount * factor) / factor
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
