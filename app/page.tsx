"use client"

import { useMemo, useState } from "react"
import { AlertTriangleIcon, ShieldAlertIcon, ShieldCheckIcon } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { CashflowTable } from "@/components/charts/cashflow-table"
import { Section } from "@/components/finance-ui/section"
import { FormRow } from "@/components/finance-ui/form-row"
import { StatBlock } from "@/components/finance-ui/stat-block"
import { Timeline } from "@/components/finance-ui/timeline"
import { ChatInterface } from "@/components/finance-ui/chat-interface"
import { Input } from "@/components/ui/input"
import { useFinanceProfile } from "@/hooks/useFinanceProfile"
import { useSimulation } from "@/hooks/useSimulation"
import { useAdvisor } from "@/hooks/useAdvisor"
import { formatCurrency, INR_PER_JPY, JPY_PER_INR } from "@/lib/utils/currency"
import { getMonthKey } from "@/lib/utils/date"

export default function HomePage() {
  const { profile, ready } = useFinanceProfile()
  const [startMonth, setStartMonth] = useState(getMonthKey(new Date()))
  const [months, setMonths] = useState(12)

  const simulation = useSimulation(profile, {
    startMonth,
    months,
  })

  const advisor = useAdvisor(profile, {
    startMonth,
    months,
  })

  const isAtRisk = Boolean(simulation.firstDeficitMonth)

  const timelineItems = useMemo(
    () =>
      advisor.timelineNarrative.map((line, index) => ({
        id: `${line}-${index}`,
        title: line,
        tone: line.includes("(-") ? ("danger" as const) : ("success" as const),
      })),
    [advisor.timelineNarrative]
  )

  return (
    <AppShell
      title="AI Personal Financial Planner"
      subtitle="Cashflow survival simulator with monthly timeline and AI advisor guidance"
    >
      {!ready ? <p className="text-meta">Loading your finance profile...</p> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatBlock
          label="Current Savings"
          numericValue={profile.currentSavings}
          formatter={(value) => formatCurrency(value, profile.settings.homeCurrency)}
          surface="dark"
        />
        <StatBlock
          label="First Deficit Month"
          value={simulation.firstDeficitMonth ?? "No Deficit"}
          surface="light"
        />
        <StatBlock
          label="Survival Runway"
          numericValue={simulation.survivalMonths}
          formatter={(value) => `${Math.round(value)} months`}
          surface="dark"
        />
        <StatBlock
          label="Pre-Salary Survival"
          numericValue={simulation.preSalarySurvivalMonths}
          formatter={(value) => `${Math.round(value)} months`}
          meta={simulation.firstIncomeMonth ? `Income starts: ${simulation.firstIncomeMonth}` : "No salary event yet"}
          surface="light"
        />
        <StatBlock
          label="Buffer Coverage"
          value={Number.isFinite(simulation.bufferCoverageMonths) ? undefined : "Unlimited"}
          numericValue={Number.isFinite(simulation.bufferCoverageMonths) ? simulation.bufferCoverageMonths : undefined}
          formatter={(value) => `${value.toFixed(1)} months`}
          surface="dark"
        />
        <StatBlock
          label="Safety Buffer Target"
          numericValue={simulation.requiredSafetyBuffer}
          formatter={(value) => formatCurrency(value, profile.settings.homeCurrency)}
          meta={`Target based on ${profile.settings.safetyBufferMonths} months`}
          surface="light"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Section
          title="Simulation Controls"
          description="Run short-term optimization and long-term survival planning from one timeline."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <FormRow label="Start month">
              <Input
                type="month"
                value={startMonth}
                onChange={(event) => setStartMonth(event.target.value as `${number}-${number}${number}`)}
              />
            </FormRow>
            <FormRow label="Horizon (months)">
              <Input
                type="number"
                min={1}
                max={60}
                value={months}
                onChange={(event) => setMonths(Number(event.target.value) || 12)}
              />
            </FormRow>
          </div>
        </Section>

        <Section title="Risk Snapshot" description="Current balance risk from simulated scenario." tone="dark">
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2 text-[color:var(--text-primary)]">
              {isAtRisk ? (
                <ShieldAlertIcon className="mt-0.5 size-4 text-[color:var(--danger)]" />
              ) : (
                <ShieldCheckIcon className="mt-0.5 size-4 text-[color:var(--success)]" />
              )}
              <p>{advisor.aiSummary ?? advisor.summary}</p>
            </div>
            {advisor.aiModel ? (
              <p className="text-meta">AI model: {advisor.aiModel}</p>
            ) : null}
            {advisor.shouldTriggerAi && advisor.aiTriggerReason ? (
              <p className="text-meta">AI advisory trigger: {advisor.aiTriggerReason}</p>
            ) : null}
            {advisor.findings.slice(0, 2).map((finding) => (
              <p
                key={finding.title}
                className="finance-muted-surface rounded-md px-3 py-2 text-meta"
              >
                <strong className="text-[color:var(--text-primary)]">{finding.title}:</strong> {finding.detail}
              </p>
            ))}
          </div>
        </Section>
      </section>

      <Section
        title="Cashflow Timeline"
        description={`Display currency: JPY • FX assumption: 1 JPY ≈ ₹${INR_PER_JPY} (1 INR ≈ ¥${JPY_PER_INR.toFixed(2)})`}
        tone="dark"
      >
        <CashflowTable
          timeline={simulation.timeline}
          inputCurrency={profile.settings.homeCurrency}
          outputCurrency="JPY"
        />
      </Section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ChatInterface profile={profile} />

        <Section title="Timeline Narrative" description="Readable month-by-month projection summary." tone="dark">
          <div className="mb-2 flex items-center gap-2 text-meta">
            <AlertTriangleIcon className="size-3.5 text-[color:var(--danger)]" />
            <span>Watch negative deltas and deficit transitions closely.</span>
          </div>
          <Timeline items={timelineItems} />
        </Section>
      </section>
    </AppShell>
  )
}
