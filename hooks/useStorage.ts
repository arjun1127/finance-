"use client"

import { useCallback, useSyncExternalStore, useState, useEffect, type Dispatch, type SetStateAction } from "react"
import { writeLocal } from "@/lib/storage/local"

interface StorageHookResult<T> {
  value: T
  setValue: Dispatch<SetStateAction<T>>
  ready: boolean
}

const listenersByKey = new Map<string, Set<() => void>>()
const snapshotsByKey = new Map<
  string,
  {
    raw: string | null
    value: unknown
    initialValue: unknown
  }
>()

function emitStorageChange(key: string) {
  listenersByKey.get(key)?.forEach((listener) => listener())
}

function getCachedSnapshot<T>(key: string, initialValue: T): T {
  if (typeof window === "undefined") {
    return initialValue
  }

  const raw = window.localStorage.getItem(key)
  const cached = snapshotsByKey.get(key)

  if (raw === null) {
    if (cached && cached.raw === null && cached.initialValue === initialValue) {
      return cached.value as T
    }

    snapshotsByKey.set(key, {
      raw: null,
      value: initialValue,
      initialValue,
    })
    return initialValue
  }

  if (cached && cached.raw === raw) {
    return cached.value as T
  }

  let parsed: T = initialValue
  try {
    parsed = JSON.parse(raw) as T
  } catch {
    parsed = initialValue
  }

  snapshotsByKey.set(key, {
    raw,
    value: parsed,
    initialValue,
  })

  return parsed
}

export function useStorageState<T>(key: string, initialValue: T): StorageHookResult<T> {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      let listeners = listenersByKey.get(key)
      if (!listeners) {
        listeners = new Set()
        listenersByKey.set(key, listeners)
      }

      listeners.add(onStoreChange)

      const onStorage = (event: StorageEvent) => {
        if (event.key === key) {
          onStoreChange()
        }
      }

      window.addEventListener("storage", onStorage)

      return () => {
        listeners?.delete(onStoreChange)
        if (listeners && listeners.size === 0) {
          listenersByKey.delete(key)
        }
        window.removeEventListener("storage", onStorage)
      }
    },
    [key]
  )

  const getSnapshot = useCallback(() => getCachedSnapshot(key, initialValue), [key, initialValue])
  const getServerSnapshot = useCallback(() => initialValue, [initialValue])

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (nextValue) => {
      const previous = getCachedSnapshot(key, initialValue)
      const resolved =
        typeof nextValue === "function"
          ? (nextValue as (value: T) => T)(previous)
          : nextValue

      writeLocal(key, resolved)
      emitStorageChange(key)
    },
    [initialValue, key]
  )

  return { value, setValue, ready: isMounted }
}
