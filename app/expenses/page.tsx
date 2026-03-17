"use client"

import { AppShell } from "@/components/layout/app-shell"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/finance-ui/card"
import { Section } from "@/components/finance-ui/section"
import { StatBlock } from "@/components/finance-ui/stat-block"
import { Button } from "@/components/ui/button"
import { SectionNote } from "@/components/forms/section-note"
import { useFinanceProfile } from "@/hooks/useFinanceProfile"
import { FixedExpenseForm } from "@/app/expenses/components/fixed-expense-form"
import { formatCurrency } from "@/lib/utils/currency"
import { compareMonthKeys, getMonthKey } from "@/lib/utils/date"

export default function ExpensesPage() {
  const { profile, dispatch } = useFinanceProfile()
  const currentMonth = getMonthKey(new Date())

  const total = profile.fixedExpenses
    .filter((item) => !item.startMonth || compareMonthKeys(currentMonth, item.startMonth) >= 0)
    .reduce((sum, item) => sum + item.amount, 0)

  return (
    <AppShell
      title="Fixed Expense Engine"
      subtitle="Set recurring monthly costs once and reuse them across every simulation."
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Section
          title="Add fixed expense"
          description="Rent, EMI, travel, insurance, and recurring subscriptions with a start month."
          tone="dark"
        >
          <FixedExpenseForm
            defaultCurrency={profile.settings.homeCurrency}
            onSubmit={(expense) => dispatch({ type: "upsert_fixed_expense", payload: expense })}
          />
        </Section>

        <div className="space-y-3">
          <StatBlock
            label="Active monthly fixed cost"
            value={formatCurrency(total, profile.settings.homeCurrency)}
          />
          <SectionNote>
            Keep fixed cost lean. Lower fixed burn means higher survival runway during salary delays.
          </SectionNote>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saved fixed expenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {profile.fixedExpenses.length === 0 ? (
            <p className="text-sm text-[color:var(--text-secondary)]">No fixed expenses yet.</p>
          ) : (
            profile.fixedExpenses.map((expense) => (
              <div
                key={expense.id}
                className="finance-muted-surface flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-[color:var(--text-primary)]">{expense.name}</p>
                  <p className="text-meta">
                    {expense.category} • starts {expense.startMonth ?? "immediately"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-[color:var(--text-primary)]">
                    {formatCurrency(expense.amount, expense.currency)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dispatch({ type: "remove_fixed_expense", payload: expense.id })}
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
