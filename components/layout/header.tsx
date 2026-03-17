"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const mobileNavItems = [
  { href: "/", label: "Dashboard" },
  { href: "/expenses", label: "Expenses" },
  { href: "/commitments", label: "Commitments" },
  { href: "/income", label: "Income" },
  { href: "/simulation", label: "Simulation" },
  { href: "/definitions", label: "Definitions" },
  { href: "/settings", label: "Settings" },
]

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export function Header({ title, subtitle, actions, className }: HeaderProps) {
  const pathname = usePathname()

  return (
    <header className={cn("border border-[color:var(--border-soft)] px-4 py-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-[28px] text-[color:var(--text-black)]">{title}</h1>
          {subtitle ? <p className="max-w-3xl text-sm text-[color:var(--text-muted)]">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {mobileNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-md border border-white/80 bg-black px-2.5 py-1.5 text-xs text-white transition-all duration-140 ease-out hover:bg-white hover:text-black",
              pathname === item.href && "bg-white text-black"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
