import type { SimulationMonth } from "@/lib/finance/models"
import { convertCurrency, formatCurrency, type SupportedCurrency } from "@/lib/utils/currency"
import { monthLabel } from "@/lib/utils/date"
import { cn } from "@/lib/utils"

interface CashflowTableProps {
  timeline: SimulationMonth[]
  inputCurrency: SupportedCurrency
  outputCurrency?: SupportedCurrency
}

export function CashflowTable({
  timeline,
  inputCurrency,
  outputCurrency = "JPY",
}: CashflowTableProps) {
  const toOutputCurrency = (amount: number) => convertCurrency(amount, inputCurrency, outputCurrency)

  return (
    <div className="overflow-x-auto rounded-xl border border-white/20 bg-black">
      <p className="border-b border-white/15 px-4 py-2 text-xs text-white/70">
        Opening balance is carry-over savings from the previous month, not salary income.
      </p>
      <table className="w-full min-w-[680px] text-left text-sm text-white">
        <thead className="border-b border-white/20 bg-white text-xs uppercase tracking-wide text-black">
          <tr>
            <th className="px-4 py-3">Month</th>
            <th className="px-4 py-3">Opening ({outputCurrency})</th>
            <th className="px-4 py-3">Income ({outputCurrency})</th>
            <th className="px-4 py-3">Fixed ({outputCurrency})</th>
            <th className="px-4 py-3">Commitments ({outputCurrency})</th>
            <th className="px-4 py-3">Net ({outputCurrency})</th>
            <th className="px-4 py-3">Closing ({outputCurrency})</th>
          </tr>
        </thead>
        <tbody>
          {timeline.map((row) => (
            <tr
              key={row.month}
              className={cn(
                "border-b border-white/10 transition-colors hover:bg-white/5",
                row.deficit && "bg-white/10"
              )}
            >
              <td className="px-4 py-3 font-medium text-white">{monthLabel(row.month)}</td>
              <td className="px-4 py-3 text-white/75">{formatCurrency(toOutputCurrency(row.openingBalance), outputCurrency)}</td>
              <td className="px-4 py-3 text-white">{formatCurrency(toOutputCurrency(row.income), outputCurrency)}</td>
              <td className="px-4 py-3 text-white/75">{formatCurrency(toOutputCurrency(row.fixedExpense), outputCurrency)}</td>
              <td className="px-4 py-3 text-white/72">{formatCurrency(toOutputCurrency(row.commitments), outputCurrency)}</td>
              <td
                className={cn(
                  "px-4 py-3 font-medium",
                  row.delta >= 0 ? "text-white" : "text-white/70"
                )}
              >
                {formatCurrency(toOutputCurrency(row.delta), outputCurrency)}
              </td>
              <td
                className={cn(
                  "px-4 py-3 font-semibold",
                  row.deficit ? "text-white/70" : "text-white"
                )}
              >
                {formatCurrency(toOutputCurrency(row.closingBalance), outputCurrency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
