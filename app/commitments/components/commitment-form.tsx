"use client"

import { useState } from "react"

import { FormRow } from "@/components/finance-ui/form-row"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CommitmentFrequency, CommitmentPriority, VariableCommitment } from "@/lib/finance/models"
import type { SupportedCurrency } from "@/lib/utils/currency"

interface CommitmentFormProps {
  defaultCurrency: SupportedCurrency
  onSubmit: (commitment: VariableCommitment) => void
}

export function CommitmentForm({ defaultCurrency, onSubmit }: CommitmentFormProps) {
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [dueMonth, setDueMonth] = useState("")
  const [frequency, setFrequency] = useState<CommitmentFrequency>("once")
  const [priority, setPriority] = useState<CommitmentPriority>("important")
  const [currency, setCurrency] = useState<SupportedCurrency>(defaultCurrency)

  return (
    <form
      className="grid gap-3 md:grid-cols-3"
      onSubmit={(event) => {
        event.preventDefault()

        const numericAmount = Number(amount)
        if (!title.trim() || !dueMonth || !Number.isFinite(numericAmount) || numericAmount <= 0) {
          return
        }

        onSubmit({
          id: crypto.randomUUID(),
          title: title.trim(),
          amount: numericAmount,
          currency,
          dueMonth: dueMonth as `${number}-${number}${number}`,
          frequency,
          priority,
        })

        setTitle("")
        setAmount("")
      }}
    >
      <FormRow label="Commitment" className="md:col-span-2">
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Braces payment" />
      </FormRow>

      <FormRow label="Due month">
        <Input type="month" value={dueMonth} onChange={(event) => setDueMonth(event.target.value)} />
      </FormRow>

      <FormRow label="Amount">
        <Input type="number" min={0} value={amount} onChange={(event) => setAmount(event.target.value)} />
      </FormRow>

      <FormRow label="Frequency">
        <select
          className="finance-input"
          value={frequency}
          onChange={(event) => setFrequency(event.target.value as CommitmentFrequency)}
        >
          <option value="once">One-time</option>
          <option value="monthly">Monthly after due month</option>
        </select>
      </FormRow>

      <FormRow label="Priority">
        <select
          className="finance-input"
          value={priority}
          onChange={(event) => setPriority(event.target.value as CommitmentPriority)}
        >
          <option value="essential">Essential</option>
          <option value="important">Important</option>
          <option value="discretionary">Discretionary</option>
        </select>
      </FormRow>

      <FormRow label="Currency">
        <select
          className="finance-input"
          value={currency}
          onChange={(event) => setCurrency(event.target.value as SupportedCurrency)}
        >
          <option value="INR">INR</option>
          <option value="JPY">JPY</option>
        </select>
      </FormRow>

      <div className="flex items-end">
        <Button type="submit" className="w-full md:w-auto">
          Add commitment
        </Button>
      </div>
    </form>
  )
}
