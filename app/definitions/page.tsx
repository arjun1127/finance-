"use client"

import { useMemo, useState } from "react"

import { AppShell } from "@/components/layout/app-shell"
import { Section } from "@/components/finance-ui/section"
import { Input } from "@/components/ui/input"
import { FINANCIAL_TERM_DEFINITIONS } from "@/lib/finance/definitions"

export default function DefinitionsPage() {
  const [query, setQuery] = useState("")

  const items = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) {
      return FINANCIAL_TERM_DEFINITIONS
    }

    return FINANCIAL_TERM_DEFINITIONS.filter((item) =>
      [item.term, item.definition, item.formula, item.context]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    )
  }, [query])

  return (
    <AppShell
      title="Definitions"
      subtitle="Financial glossary used by this app to interpret simulation, risk, and advisory outputs."
    >
      <Section
        title="Term Glossary"
        description="Search any financial term shown in dashboards, simulation table, or advisor outputs."
        tone="dark"
      >
        <div className="space-y-4">
          <Input
            placeholder="Search terms like deficit, buffer coverage, survival runway..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <div className="space-y-3">
            {items.length === 0 ? (
              <p className="text-sm text-[color:var(--text-secondary)]">No matching definition found.</p>
            ) : (
              items.map((item) => (
                <article
                  key={item.id}
                  className="finance-muted-surface rounded-lg px-4 py-3"
                >
                  <h3 className="text-[18px] text-[color:var(--text-primary)]">{item.term}</h3>
                  <p className="mt-1 text-sm text-[color:var(--text-secondary)]">{item.definition}</p>
                  {item.formula ? <p className="mt-1 text-meta">Formula: {item.formula}</p> : null}
                  <p className="mt-1 text-meta">Context: {item.context}</p>
                </article>
              ))
            )}
          </div>
        </div>
      </Section>
    </AppShell>
  )
}
