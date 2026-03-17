"use client"

import { useMemo } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { SimulationMonth } from "@/lib/finance/models"
import { convertCurrency, formatCurrency, type SupportedCurrency } from "@/lib/utils/currency"
import { monthLabel } from "@/lib/utils/date"

interface CashflowChartProps {
  timeline: SimulationMonth[]
  inputCurrency: SupportedCurrency
  outputCurrency?: SupportedCurrency
}

interface TooltipEntry {
  color?: string
  name?: string
  value?: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
  outputCurrency: SupportedCurrency
}

const CustomTooltip = ({ active, payload, label, outputCurrency }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-white/25 bg-black/95 p-4 shadow-xl backdrop-blur-md">
        <p className="mb-2 font-medium text-white/90">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={`${entry.name}-${index}`} className="flex items-center gap-3 text-sm">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-white/70">{entry.name}:</span>
              <span className="font-medium text-white/90">
                {formatCurrency(typeof entry.value === "number" ? entry.value : 0, outputCurrency)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

export function CashflowChart({
  timeline,
  inputCurrency,
  outputCurrency = "JPY",
}: CashflowChartProps) {
  const chartData = useMemo(() => {
    return timeline.map((month) => ({
      name: monthLabel(month.month),
      Net: convertCurrency(month.delta, inputCurrency, outputCurrency),
      Balance: convertCurrency(month.closingBalance, inputCurrency, outputCurrency),
      Income: convertCurrency(month.income, inputCurrency, outputCurrency),
      Expenses: convertCurrency(month.fixedExpense + month.commitments, inputCurrency, outputCurrency),
    }))
  }, [timeline, inputCurrency, outputCurrency])

  return (
    <div className="cashflow-chart flex h-[400px] w-full flex-col overflow-hidden rounded-xl border border-white/20 bg-black p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ffffff" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#b9bac1" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#b9bac1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6f7076" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#6f7076" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="name"
            tick={{ fill: "rgba(255, 255, 255, 0.68)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            tick={{ fill: "rgba(255, 255, 255, 0.68)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              new Intl.NumberFormat("en-US", {
                notation: "compact",
                compactDisplay: "short",
              }).format(value)
            }
            dx={-10}
          />
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgba(255, 255, 255, 0.12)"
          />
          <Tooltip content={<CustomTooltip outputCurrency={outputCurrency} />} />
          <Area
            type="monotone"
            dataKey="Balance"
            stroke="#ffffff"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorBalance)"
          />
          <Area
            type="monotone"
            dataKey="Income"
            stroke="#c9cad1"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorIncome)"
          />
          <Area
            type="monotone"
            dataKey="Expenses"
            stroke="#7b7c82"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorExpenses)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
