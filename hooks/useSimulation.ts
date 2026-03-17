"use client"

import { simulateCashflow, type SimulationConfig } from "@/lib/finance/engine"
import type { FinanceProfile } from "@/lib/finance/models"

export function useSimulation(profile: FinanceProfile, config: SimulationConfig) {
  return simulateCashflow(profile, config)
}
