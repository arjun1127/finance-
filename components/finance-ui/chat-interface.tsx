"use client"

import { useChat } from "@ai-sdk/react"
import { BotIcon, Loader2Icon, SendIcon, UserIcon, WrenchIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { FinanceProfile } from "@/lib/finance/models"
import { Section } from "./section"

interface ChatInterfaceProps {
  profile: FinanceProfile
}

export function ChatInterface({ profile }: ChatInterfaceProps) {
  const { messages, sendMessage, status, error, clearError } = useChat()
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isLoading = status === "submitted" || status === "streaming"

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, status])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = input.trim()

    if (!text || isLoading) {
      return
    }

    clearError()
    setInput("")

    await sendMessage(
      { text },
      {
        body: {
          profile,
        },
      }
    )
  }

  return (
    <Section
      title="Financial Advisor Chat"
      description="Ask about strategies, simulate purchases, or estimate costs."
      tone="dark"
    >
      <div className="finance-card-dark flex h-[500px] flex-col overflow-hidden rounded-xl border border-white/20 bg-black text-white">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-white/70">
              <BotIcon className="mb-4 size-10 opacity-50" />
              <p className="text-white">Hi! I&apos;m your AI personal finance advisor.</p>
              <p className="mt-2">
                Try asking:
                <br />
                <i className="text-white">&quot;Am I safe financially?&quot;</i>
                <br />
                or
                <br />
                <i className="text-white">&quot;What if I buy an iPhone next month?&quot;</i>
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const textContent = message.parts.reduce((all, part) => {
                if (part.type === "text") {
                  return all + part.text
                }
                return all
              }, "")

              const toolParts = message.parts.filter(
                (part) => part.type.startsWith("tool-") || part.type === "dynamic-tool"
              )

              if (!textContent.trim() && toolParts.length === 0) {
                return null
              }

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role !== "user" ? (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/25 bg-black text-white">
                      <BotIcon className="size-4" />
                    </div>
                  ) : null}

                  <div className={`flex max-w-[85%] flex-col gap-1 ${message.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`rounded-xl px-4 py-2 text-sm ${
                        message.role === "user"
                          ? "border border-white/45 bg-black text-white"
                          : "border border-white/25 bg-black text-white"
                      }`}
                    >
                      {textContent.trim() ? <div className="whitespace-pre-wrap">{textContent}</div> : null}

                      {toolParts.map((part, index) => {
                        const toolName =
                          part.type === "dynamic-tool" ? "tool" : part.type.replace("tool-", "")
                        const partState = "state" in part ? part.state : undefined
                        const partError =
                          "errorText" in part && typeof part.errorText === "string"
                            ? part.errorText
                            : undefined
                        const key = `${message.id}-${toolName}-${index}`

                        if (partState === "output-available") {
                          return (
                            <div
                              key={key}
                              className="mt-2 flex items-center gap-1 border-t border-white/20 pt-2 text-xs text-white/85"
                            >
                              <WrenchIcon className="size-3.5" />
                              <span className="font-semibold">{toolName}</span> completed.
                            </div>
                          )
                        }

                        if (partState === "output-error") {
                          return (
                            <div
                              key={key}
                              className="mt-2 flex items-center gap-1 border-t border-white/20 pt-2 text-xs text-white/75"
                            >
                              <WrenchIcon className="size-3.5" />
                              <span className="font-semibold">{toolName}</span> failed
                              {partError ? `: ${partError}` : "."}
                            </div>
                          )
                        }

                        return (
                          <div
                            key={key}
                            className="mt-2 flex items-center gap-2 border-t border-white/20 pt-2 text-xs text-white/75"
                          >
                            <Loader2Icon className="size-3 animate-spin" />
                            Calling <span className="font-semibold">{toolName}</span>...
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {message.role === "user" ? (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/45 bg-black text-white">
                      <UserIcon className="size-4" />
                    </div>
                  ) : null}
                </div>
              )
            })
          )}

          {error ? (
            <p className="rounded-md border border-white/35 bg-white/10 px-3 py-2 text-xs text-white">
              Chat error: {error.message}
            </p>
          ) : null}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 border-t border-white/20 bg-black/85 p-3">
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask your advisor a question..."
            className="finance-input flex-1 text-white placeholder:text-white/55"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()} size="icon" className="shrink-0">
            {isLoading ? <Loader2Icon className="size-4 animate-spin" /> : <SendIcon className="size-4" />}
          </Button>
        </form>
      </div>
    </Section>
  )
}
