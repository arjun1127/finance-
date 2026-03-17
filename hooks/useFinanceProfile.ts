"use client"

import { useCallback } from "react"
import type { FinanceAction } from "@/store/finance-store"
import { financeReducer, FINANCE_STORAGE_KEY, initialFinanceProfile } from "@/store/finance-store"
import { useStorageState } from "@/hooks/useStorage"

export function useFinanceProfile() {
  const {
    value: profile,
    setValue: setProfile,
    ready,
  } = useStorageState(FINANCE_STORAGE_KEY, initialFinanceProfile)

  const dispatch = useCallback(
    (action: FinanceAction) => {
      setProfile((current) => financeReducer(current, action))
    },
    [setProfile]
  )

  return {
    profile,
    dispatch,
    ready,
  }
}
