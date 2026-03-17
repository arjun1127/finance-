"use client"

import { useState } from "react"

import { FormRow } from "@/components/finance-ui/form-row"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { FixedExpense, FixedExpenseCategory } from "@/lib/finance/models"
import type { SupportedCurrency } from "@/lib/utils/currency"
import { getMonthKey } from "@/lib/utils/date"

const CATEGORY_OPTIONS: { value: FixedExpenseCategory; label: string }[] = [
  { value: "rent", label: "Rent" },
  { value: "loan_emi", label: "Loan EMI" },
  { value: "travel", label: "Travel" },
  { value: "insurance", label: "Insurance" },
  { value: "subscriptions", label: "Subscriptions" },
  { value: "utilities", label: "Utilities" },
  { value: "other", label: "Other" },
]

interface FixedExpenseFormProps {
  defaultCurrency: SupportedCurrency
  onSubmit: (expense: FixedExpense) => void
}

export function FixedExpenseForm({ defaultCurrency, onSubmit }: FixedExpenseFormProps) {
  const currentMonth = getMonthKey(new Date())
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState<FixedExpenseCategory>("other")
  const [currency, setCurrency] = useState<SupportedCurrency>(defaultCurrency)
  const [startMonth, setStartMonth] = useState(currentMonth)

  return (
    <form
      className="grid gap-3 md:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault()

        const numericAmount = Number(amount)
        if (!name.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
          return
        }

        onSubmit({
          id: crypto.randomUUID(),
          name: name.trim(),
          category,
          amount: numericAmount,
          currency,
          startMonth,
        })

        setName("")
        setAmount("")
        setCategory("other")
        setCurrency(defaultCurrency)
        setStartMonth(currentMonth)
      }}
    >
      <FormRow label="Expense name" className="md:col-span-2">
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Rent" />
      </FormRow>

      <FormRow label="Amount">
        <Input
          type="number"
          min={0}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="10000"
        />
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

      <FormRow label="Category" className="md:col-span-2">
        <select
          className="finance-input"
          value={category}
          onChange={(event) => setCategory(event.target.value as FixedExpenseCategory)}
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormRow>

      <FormRow label="Start month" className="md:col-span-2">
        <Input
          type="month"
          value={startMonth}
          onChange={(event) => setStartMonth(event.target.value as `${number}-${number}${number}`)}
        />
      </FormRow>

      <div className="flex items-end">
        <Button type="submit" className="w-full md:w-auto">
          Add fixed expense
        </Button>
      </div>
    </form>
  )
}
