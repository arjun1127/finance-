import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import type { CashflowSimulation, FinanceProfile } from "@/lib/finance/models"
import { formatCurrency } from "@/lib/utils/currency"
import { StatBlock } from "@/components/finance-ui/stat-block"

interface SimulationSummaryProps {
  simulation: CashflowSimulation
  profile: FinanceProfile
}

export function SimulationSummary({ simulation, profile }: SimulationSummaryProps) {
  const summaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".stat-card", {
        opacity: 0,
        y: 20,
        scale: 0.95,
        duration: 0.5,
        stagger: 0.08,
        ease: "back.out(1.5)",
        delay: 0.2, // Delay to sync with page load
      })
    }, summaryRef)

    return () => ctx.revert()
  }, [simulation])

  return (
    <div ref={summaryRef} className="grid gap-4 md:grid-cols-2 xl:grid-cols-6 mt-4">
      <div className="stat-card">
        <StatBlock
          label="Survival months"
          numericValue={simulation.survivalMonths}
          formatter={(value) => `${Math.round(value)}`}
        />
      </div>
      <div className="stat-card">
        <StatBlock
          label="Pre-salary survival"
          numericValue={simulation.preSalarySurvivalMonths}
          formatter={(value) => `${Math.round(value)}`}
          meta={simulation.firstIncomeMonth ? `Income starts: ${simulation.firstIncomeMonth}` : "No salary event yet"}
        />
      </div>
      <div className="stat-card">
        <StatBlock
          label="First deficit"
          value={simulation.firstDeficitMonth ?? "None"}
          tone={simulation.firstDeficitMonth ? "danger" : "success"}
        />
      </div>
      <div className="stat-card">
        <StatBlock
          label="Buffer coverage"
          value={Number.isFinite(simulation.bufferCoverageMonths) ? undefined : "Unlimited"}
          numericValue={Number.isFinite(simulation.bufferCoverageMonths) ? simulation.bufferCoverageMonths : undefined}
          formatter={(value) => `${value.toFixed(1)} months`}
          tone={
            Number.isFinite(simulation.bufferCoverageMonths) &&
            simulation.bufferCoverageMonths < profile.settings.safetyBufferMonths
              ? "danger"
              : "success"
          }
        />
      </div>
      <div className="stat-card">
        <StatBlock
          label="Minimum balance"
          numericValue={simulation.minimumBalance}
          formatter={(value) => formatCurrency(value, profile.settings.homeCurrency)}
        />
      </div>
      <div className="stat-card">
        <StatBlock
          label="Safety buffer target"
          numericValue={simulation.requiredSafetyBuffer}
          formatter={(value) => formatCurrency(value, profile.settings.homeCurrency)}
        />
      </div>
    </div>
  )
}
