"use client"

import { useEffect } from "react"
import { gsap } from "gsap"

import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"

interface AppShellProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  useEffect(() => {
    const context = gsap.context(() => {
      gsap.from(".shell-header", {
        opacity: 0,
        y: -14,
        duration: 0.42,
        ease: "power2.out",
      })

      gsap.from(".page", {
        opacity: 0,
        y: 16,
        duration: 0.5,
        ease: "power2.out",
        delay: 0.08,
      })

      gsap.from(".card", {
        opacity: 0,
        y: 20,
        stagger: 0.06,
        duration: 0.55,
        ease: "power2.out",
        delay: 0.14,
      })

      gsap.from(".finance-sidebar", {
        x: -20,
        opacity: 0,
        duration: 0.4,
        ease: "power3.out",
      })
    })

    return () => context.revert()
  }, [])

  return (
    <div className="finance-shell min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-[1920px] grid-cols-1 gap-3 p-3 lg:grid-cols-[248px_minmax(0,1fr)]">
        <Sidebar />

        <div className="shell-content min-w-0">
          <Header
            title={title}
            subtitle={subtitle}
            actions={actions}
            className="shell-header finance-nav-floating sticky top-3 z-30 rounded-xl px-4 py-4 md:px-5"
          />
          <main className="page finance-main-canvas mt-3 rounded-2xl p-4 md:p-6">
            <div className="flex flex-col gap-4">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
