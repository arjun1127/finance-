"use client"

import { useState } from "react"

import { FormRow } from "@/components/finance-ui/form-row"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { IncomeEvent } from "@/lib/finance/models"
import type { SupportedCurrency } from "@/lib/utils/currency"

interface IncomeFormProps {
  defaultCurrency: SupportedCurrency
  onSubmit: (income: IncomeEvent) => void
}

export function IncomeForm({ defaultCurrency, onSubmit }: IncomeFormProps) {
  const [label, setLabel] = useState("")
  const [amount, setAmount] = useState("")
  const [startMonth, setStartMonth] = useState("")
  const [endMonth, setEndMonth] = useState("")
  const [dayOfMonth, setDayOfMonth] = useState("1")
  const [currency, setCurrency] = useState<SupportedCurrency>(defaultCurrency)

  return (
    <form
      className="grid gap-3 md:grid-cols-3"
      onSubmit={(event) => {
        event.preventDefault()

        const numericAmount = Number(amount)
        const numericDay = Number(dayOfMonth)
        if (!label.trim() || !startMonth || !Number.isFinite(numericAmount) || numericAmount <= 0) {
          return
        }

        onSubmit({
          id: crypto.randomUUID(),
          label: label.trim(),
          amount: numericAmount,
          currency,
          startMonth: startMonth as `${number}-${number}${number}`,
          endMonth: endMonth ? (endMonth as `${number}-${number}${number}`) : undefined,
          dayOfMonth: Number.isFinite(numericDay) ? Math.min(Math.max(numericDay, 1), 31) : 1,
        })

        setLabel("")
        setAmount("")
      }}
    >
      <FormRow label="Income source" className="md:col-span-2">
        <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Salary" />
      </FormRow>

      <FormRow label="Amount">
        <Input type="number" min={0} value={amount} onChange={(event) => setAmount(event.target.value)} />
      </FormRow>

      <FormRow label="Start month">
        <Input type="month" value={startMonth} onChange={(event) => setStartMonth(event.target.value)} />
      </FormRow>

      <FormRow label="End month (optional)">
        <Input type="month" value={endMonth} onChange={(event) => setEndMonth(event.target.value)} />
      </FormRow>

      <FormRow label="Salary day">
        <Input type="number" min={1} max={31} value={dayOfMonth} onChange={(event) => setDayOfMonth(event.target.value)} />
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
          Add income event
        </Button>
      </div>
    </form>
  )
}
