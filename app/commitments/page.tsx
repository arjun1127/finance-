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
import { CommitmentForm } from "@/app/commitments/components/commitment-form"
import { useFinanceProfile } from "@/hooks/useFinanceProfile"
import { formatCurrency } from "@/lib/utils/currency"

export default function CommitmentsPage() {
  const { profile, dispatch } = useFinanceProfile()

  return (
    <AppShell
      title="Variable Commitments Engine"
      subtitle="Event-based obligations such as medical, relocation, or purchases."
    >
      <Section
        title="Add commitment"
        description="These are event expenses on specific months, not permanent monthly costs."
        tone="dark"
      >
        <CommitmentForm
          defaultCurrency={profile.settings.homeCurrency}
          onSubmit={(commitment) => dispatch({ type: "upsert_commitment", payload: commitment })}
        />
        <SectionNote>
          Mark discretionary commitments clearly so the optimizer can suggest delays when risk appears.
        </SectionNote>
      </Section>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming commitments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {profile.commitments.length === 0 ? (
            <p className="text-sm text-[color:var(--text-secondary)]">No commitments added yet.</p>
          ) : (
            profile.commitments
              .slice()
              .sort((a, b) => a.dueMonth.localeCompare(b.dueMonth))
              .map((commitment) => (
                <div
                  key={commitment.id}
                  className="finance-muted-surface flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-[color:var(--text-primary)]">{commitment.title}</p>
                    <p className="text-meta">
                      {commitment.dueMonth} • {commitment.frequency} • {commitment.priority}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[color:var(--text-primary)]">
                      {formatCurrency(commitment.amount, commitment.currency)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dispatch({ type: "remove_commitment", payload: commitment.id })}
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
