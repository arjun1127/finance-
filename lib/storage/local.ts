function isBrowser() {
  return typeof window !== "undefined"
}

export function readLocal<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback
  }

  const raw = window.localStorage.getItem(key)
  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeLocal<T>(key: string, value: T) {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

export function clearLocal(key: string) {
  if (!isBrowser()) {
    return
  }

  window.localStorage.removeItem(key)
}
