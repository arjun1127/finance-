"use client"

import { useState, useRef, useEffect } from "react"
import { gsap } from "gsap"

import { AppShell } from "@/components/layout/app-shell"
import { CashflowTable } from "@/components/charts/cashflow-table"
import { CashflowChart } from "@/components/charts/cashflow-chart"
import { Section } from "@/components/finance-ui/section"
import { FormRow } from "@/components/finance-ui/form-row"
import { Input } from "@/components/ui/input"
import { useFinanceProfile } from "@/hooks/useFinanceProfile"
import { useSimulation } from "@/hooks/useSimulation"
import { SimulationSummary } from "@/app/simulation/components/simulation-summary"
import { INR_PER_JPY, JPY_PER_INR } from "@/lib/utils/currency"
import { getMonthKey } from "@/lib/utils/date"

export default function SimulationPage() {
  const { profile } = useFinanceProfile()
  const [startMonth, setStartMonth] = useState(getMonthKey(new Date()))
  const [months, setMonths] = useState(18)
  const containerRef = useRef<HTMLDivElement>(null)

  const simulation = useSimulation(profile, {
    startMonth,
    months,
  })

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Inputs section animation
      gsap.from(".sim-controls", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        delay: 0.1,
      })
      
      // Chart animation
      gsap.from(".sim-chart", {
        scale: 0.95,
        opacity: 0,
        duration: 0.8,
        ease: "back.out(1.2)",
        delay: 0.3,
      })

      // Table animation
      gsap.from(".sim-table", {
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
        delay: 0.5,
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef}>
      <AppShell
        title="AI Cashflow Simulation Engine"
        subtitle="Month-by-month survival simulation across fixed and event-based commitments."
      >
        <div className="sim-controls">
          <Section
            title="Simulation controls"
            description="Run short-term optimization or long-term survival projections."
            tone="dark"
          >
            <div className="grid gap-4 rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] p-5 shadow-sm md:grid-cols-2">
              <FormRow label="Start month">
                <Input
                  type="month"
                  value={startMonth}
                  className="bg-white/5 font-medium transition-all focus:ring-2 focus:ring-[color:var(--primary)]"
                  onChange={(event) => setStartMonth(event.target.value as `${number}-${number}${number}`)}
                />
              </FormRow>

              <FormRow label="Horizon (months)">
                <Input
                  type="number"
                  min={1}
                  max={72}
                  value={months}
                  className="bg-white/5 font-medium transition-all focus:ring-2 focus:ring-[color:var(--primary)]"
                  onChange={(event) => setMonths(Number(event.target.value) || 12)}
                />
              </FormRow>
            </div>
          </Section>
        </div>

        <SimulationSummary simulation={simulation} profile={profile} />

        <div className="sim-chart mt-4">
          <Section
            title="Cashflow projection chart"
            description={`Visualizing Balance, Income, and Expenses over the ${months}-month horizon.`}
          >
            <CashflowChart
              timeline={simulation.timeline}
              inputCurrency={profile.settings.homeCurrency}
              outputCurrency="JPY"
            />
          </Section>
        </div>

        <div className="sim-table mt-4">
          <Section
            title="Cashflow table"
            description={`Display currency: JPY • FX assumption: 1 JPY ≈ ₹${INR_PER_JPY} (1 INR ≈ ¥${JPY_PER_INR.toFixed(2)})`}
            tone="dark"
          >
            <CashflowTable
              timeline={simulation.timeline}
              inputCurrency={profile.settings.homeCurrency}
              outputCurrency="JPY"
            />
          </Section>
        </div>
      </AppShell>
    </div>
  )
}
