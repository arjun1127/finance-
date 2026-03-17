"use client"

import { AppShell } from "@/components/layout/app-shell"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/finance-ui/card"
import { Section } from "@/components/finance-ui/section"
import { Button } from "@/components/ui/button"
import { SectionNote } from "@/components/forms/section-note"
import { IncomeForm } from "@/app/income/components/income-form"
import { useFinanceProfile } from "@/hooks/useFinanceProfile"
import { formatCurrency } from "@/lib/utils/currency"

export default function IncomePage() {
  const { profile, dispatch } = useFinanceProfile()

  return (
    <AppShell
      title="Income Timeline Engine"
      subtitle="Define when income starts, pauses, or changes to simulate salary gaps."
    >
      <Section
        title="Add income event"
        description="Critical for scenarios like no salary until a future month."
        tone="dark"
      >
        <IncomeForm
          defaultCurrency={profile.settings.homeCurrency}
          onSubmit={(income) => dispatch({ type: "upsert_income", payload: income })}
        />
        <SectionNote>
          If salary starts in January 2027, set start month to 2027-01 and keep prior months with zero income.
        </SectionNote>
      </Section>

      <Card>
        <CardHeader>
          <CardTitle>Income timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {profile.incomes.length === 0 ? (
            <p className="text-sm text-[color:var(--text-secondary)]">No income events added.</p>
          ) : (
            profile.incomes
              .slice()
              .sort((a, b) => a.startMonth.localeCompare(b.startMonth))
              .map((income) => (
                <div
                  key={income.id}
                  className="finance-muted-surface flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-[color:var(--text-primary)]">{income.label}</p>
                    <p className="text-meta">
                      Starts: {income.startMonth}
                      {income.endMonth ? ` • Ends: ${income.endMonth}` : " • Ongoing"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[color:var(--text-primary)]">
                      {formatCurrency(income.amount, income.currency)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dispatch({ type: "remove_income", payload: income.id })}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))
          )}
        </CardContent>
      </Card>
    </AppShell>
  )
}
