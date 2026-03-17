"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BadgeIndianRupeeIcon,
  BookOpenTextIcon,
  CalendarRangeIcon,
  CircleDollarSignIcon,
  LayoutDashboardIcon,
  RadarIcon,
  Settings2Icon,
} from "lucide-react"

import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/expenses", label: "Fixed Expenses", icon: BadgeIndianRupeeIcon },
  { href: "/commitments", label: "Commitments", icon: CalendarRangeIcon },
  { href: "/income", label: "Income", icon: CircleDollarSignIcon },
  { href: "/simulation", label: "Simulation", icon: RadarIcon },
  { href: "/definitions", label: "Definitions", icon: BookOpenTextIcon },
  { href: "/settings", label: "Settings", icon: Settings2Icon },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sidebar finance-sidebar sticky top-3 hidden h-[calc(100vh-1.5rem)] rounded-2xl border px-3 py-4 lg:flex lg:flex-col">
      <div className="mb-6 px-2">
        <p className="text-meta uppercase tracking-[0.18em] text-white/45">Finance OS</p>
        <h3 className="mt-2 text-lg text-white">Planner</h3>
      </div>

      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-2.5 rounded-lg border border-transparent px-3 py-2 text-sm text-white/70 transition-all duration-140 ease-out hover:border-white/10 hover:bg-white/[0.03] hover:text-white",
                isActive && "finance-active border-white/20 text-white"
              )}
            >
              <Icon className="size-4 text-white/60 group-hover:text-white/85" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
