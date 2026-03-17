import { createGoogleGenerativeAI } from "@ai-sdk/google"
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  stepCountIs,
  streamText,
  tool as aiTool,
  type UIMessage,
} from "ai"
import { z } from "zod"

import { generateAdvisorReport } from "@/lib/ai/advisor"
import { simulateCashflow } from "@/lib/finance/engine"
import type { FinanceProfile } from "@/lib/finance/models"
import { compareMonthKeys, getMonthKey, monthLabel, type MonthKey } from "@/lib/utils/date"
import { convertCurrency, formatCurrency, type SupportedCurrency } from "@/lib/utils/currency"
import japanCostRanges from "@/data/japan-cost-ranges.json"

export const maxDuration = 30

const DEFAULT_CHAT_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
const GEMINI_SOFT_LIMIT = Number(process.env.GEMINI_SOFT_LIMIT ?? 18)
const MEMORY_BY_SESSION = new Map<string, SessionMemory>()
const JAPAN_CITIES = ["tokyo", "osaka", "kyoto", "fukuoka"] as const
const MONTH_NAME_TO_NUMBER: Record<string, string> = {
  january: "01",
  february: "02",
  march: "03",
  april: "04",
  may: "05",
  june: "06",
  july: "07",
  august: "08",
  september: "09",
  october: "10",
  november: "11",
  december: "12",
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
}
const INTENT_KEYWORDS = {
  loan: ["loan", "emi", "interest", "tenure", "down payment", "mortgage"],
  scenario: ["what if", "can i afford", "if i buy", "buy", "purchase", "upgrade", "spend"],
  planning: ["plan", "save monthly", "how much save", "budget plan", "goal", "roadmap"],
  research: [
    "cost",
    "price",
    "estimate",
    "japan",
    "tokyo",
    "osaka",
    "kyoto",
    "fukuoka",
    "braces",
    "rent",
    "medical",
    "lifestyle",
  ],
}

type AgentMode = "question" | "scenario" | "planning" | "research" | "loan"
type ToolName = "simulation_tool" | "cost_estimation_tool" | "loan_tool" | "financial_risk_tool" | "memory_tool"
type JapanCity = (typeof JAPAN_CITIES)[number]

interface SessionMemory {
  goals: Array<{ goalType: string; details: string; createdAt: string }>
  preferences: Record<string, string>
  riskTolerance?: string
  updatedAt: string
}

let geminiQuotaBlockedUntil = 0
let geminiRequestCount = 0

interface ChatRequestBody {
  id?: string
  messages?: UIMessage[]
  profile?: FinanceProfile
}

function createFallbackResponse(text: string) {
  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: ({ writer }) => {
        const id = crypto.randomUUID()
        writer.write({ type: "text-start", id })
        writer.write({ type: "text-delta", id, delta: text })
        writer.write({ type: "text-end", id })
      },
    }),
  })
}

function buildFallbackMessage(profile: FinanceProfile) {
  const report = generateAdvisorReport(profile)
  return `Live chat is unavailable right now. Quick fallback: ${report.summary}`
}

function getApiKey() {
  return process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || ""
}

function getPreferredModel() {
  const configuredModels = process.env.GEMINI_MODELS
    ?.split(",")
    .map((model) => model.trim())
    .filter(Boolean)

  return (configuredModels && configuredModels.length > 0 ? configuredModels : DEFAULT_CHAT_MODELS)[0]
}

function getLatestUserQuery(messages: UIMessage[]) {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")
  if (!lastUserMessage) {
    return ""
  }

  return lastUserMessage.parts.reduce((all, part) => {
    if (part.type === "text") {
      return `${all} ${part.text}`.trim()
    }

    return all
  }, "")
}

function detectIntent(query: string) {
  const normalized = query.toLowerCase()
  const has = (words: string[]) => words.some((word) => normalized.includes(word))

  if (has(INTENT_KEYWORDS.loan)) {
    return {
      mode: "loan" as AgentMode,
      primaryTool: "loan_tool" as ToolName,
      activeTools: ["loan_tool", "financial_risk_tool", "simulation_tool"] as ToolName[],
      followupToolSequence: ["financial_risk_tool"] as ToolName[],
      reasoning: "Loan/EMI language detected.",
    }
  }

  if (has(INTENT_KEYWORDS.research)) {
    return {
      mode: "research" as AgentMode,
      primaryTool: "cost_estimation_tool" as ToolName,
      activeTools: ["cost_estimation_tool", "simulation_tool", "financial_risk_tool"] as ToolName[],
      followupToolSequence: ["simulation_tool", "financial_risk_tool"] as ToolName[],
      reasoning: "Cost/research language detected.",
    }
  }

  if (has(INTENT_KEYWORDS.scenario)) {
    return {
      mode: "scenario" as AgentMode,
      primaryTool: "simulation_tool" as ToolName,
      activeTools: ["simulation_tool", "financial_risk_tool", "cost_estimation_tool"] as ToolName[],
      followupToolSequence: ["financial_risk_tool"] as ToolName[],
      reasoning: "Hypothetical spending language detected.",
    }
  }

  if (has(INTENT_KEYWORDS.planning)) {
    return {
      mode: "planning" as AgentMode,
      primaryTool: "financial_risk_tool" as ToolName,
      activeTools: ["financial_risk_tool", "simulation_tool", "memory_tool"] as ToolName[],
      followupToolSequence: ["simulation_tool", "memory_tool"] as ToolName[],
      reasoning: "Planning/savings language detected.",
    }
  }

  return {
    mode: "question" as AgentMode,
    primaryTool: "financial_risk_tool" as ToolName,
    activeTools: ["financial_risk_tool", "simulation_tool", "cost_estimation_tool", "loan_tool"] as ToolName[],
    followupToolSequence: [] as ToolName[],
    reasoning: "General finance question.",
  }
}

function resolveCityFromQuery(query: string, fallbackCity: JapanCity): JapanCity {
  const normalized = query.toLowerCase()
  if (normalized.includes("tokyo")) return "tokyo"
  if (normalized.includes("osaka")) return "osaka"
  if (normalized.includes("kyoto")) return "kyoto"
  if (normalized.includes("fukuoka")) return "fukuoka"
  return fallbackCity
}

function coerceJapanCity(city: string | undefined, query: string, profile: FinanceProfile): JapanCity {
  const profileCity = JAPAN_CITIES.includes(profile.settings.city) ? profile.settings.city : "tokyo"
  const normalizedCity = (city ?? "").trim().toLowerCase()

  if (JAPAN_CITIES.includes(normalizedCity as JapanCity)) {
    return normalizedCity as JapanCity
  }

  return resolveCityFromQuery(query, profileCity)
}

function getSessionMemory(sessionId: string): SessionMemory {
  return (
    MEMORY_BY_SESSION.get(sessionId) ?? {
      goals: [],
      preferences: {},
      updatedAt: new Date().toISOString(),
    }
  )
}

function setSessionMemory(sessionId: string, memory: SessionMemory) {
  MEMORY_BY_SESSION.set(sessionId, {
    ...memory,
    updatedAt: new Date().toISOString(),
  })
}

function getRiskContext(profile: FinanceProfile) {
  const simulation = simulateCashflow(profile, { months: 24 })
  const report = generateAdvisorReport(profile, { months: 24 })

  return {
    currentSavings: profile.currentSavings,
    commitments: profile.commitments.map((item) => ({
      title: item.title,
      amount: item.amount,
      currency: item.currency,
      dueMonth: item.dueMonth,
      frequency: item.frequency,
      priority: item.priority,
    })),
    incomeTimeline: profile.incomes.map((income) => ({
      label: income.label,
      amount: income.amount,
      currency: income.currency,
      startMonth: income.startMonth,
      endMonth: income.endMonth ?? null,
      dayOfMonth: income.dayOfMonth,
    })),
    simulationSnapshot: {
      firstDeficitMonth: simulation.firstDeficitMonth ?? null,
      firstIncomeMonth: simulation.firstIncomeMonth ?? null,
      survivalMonths: simulation.survivalMonths,
      preSalarySurvivalMonths: simulation.preSalarySurvivalMonths,
      bufferCoverageMonths: simulation.bufferCoverageMonths,
      requiredSafetyBuffer: simulation.requiredSafetyBuffer,
      timelinePreview: simulation.timeline.slice(0, 6).map((month) => ({
        month: month.month,
        openingBalance: month.openingBalance,
        income: month.income,
        fixedExpense: month.fixedExpense,
        commitments: month.commitments,
        delta: month.delta,
        closingBalance: month.closingBalance,
        deficit: month.deficit,
      })),
    },
    riskMetrics: {
      summary: report.summary,
      findings: report.findings.slice(0, 6),
      suggestions: report.suggestions.slice(0, 6),
    },
  }
}

function convertToHomeCurrency(amount: number, fromCurrency: SupportedCurrency, profile: FinanceProfile) {
  return convertCurrency(amount, fromCurrency, profile.settings.homeCurrency)
}

function getAverageMonthlyIncomeInHomeCurrency(profile: FinanceProfile) {
  if (profile.incomes.length === 0) {
    return 0
  }

  const total = profile.incomes.reduce((sum, income) => {
    return sum + convertToHomeCurrency(income.amount, income.currency, profile)
  }, 0)

  return total / profile.incomes.length
}

function getStaticCostEstimate(params: { query: string; city: JapanCity }) {
  const normalized = params.query.toLowerCase()
  const ranges = japanCostRanges[params.city] ?? japanCostRanges.tokyo
  const defaultRange = ranges.overallMonthly

  const category =
    normalized.includes("braces") || normalized.includes("orthodont") || normalized.includes("aligner")
      ? "bracesProcedure"
      : normalized.includes("rent") || normalized.includes("apartment") || normalized.includes("housing")
        ? "rentMonthly"
        : normalized.includes("food") || normalized.includes("grocery") || normalized.includes("meal")
          ? "foodMonthly"
          : normalized.includes("medical") || normalized.includes("doctor") || normalized.includes("clinic")
            ? "medicalVisit"
            : normalized.includes("lifestyle") || normalized.includes("living cost")
              ? "lifestyleMonthly"
              : "overallMonthly"

  const selected = ranges[category as keyof typeof ranges] ?? defaultRange

  return {
    city: params.city,
    category,
    low: selected.low,
    high: selected.high,
    currency: selected.currency,
    reasoning: `Static Japan dataset (${params.city}) matched category '${category}'.`,
  }
}

async function searchWebEvidence(query: string, country: string, city: string) {
  const serpApiKey = process.env.SERPER_API_KEY?.trim()
  const braveApiKey = process.env.BRAVE_SEARCH_API_KEY?.trim()
  const composedQuery = `${query} ${city} ${country} average cost`

  try {
    if (serpApiKey) {
      const response = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": serpApiKey,
        },
        body: JSON.stringify({ q: composedQuery, num: 3 }),
      })

      if (!response.ok) {
        return []
      }

      const data = (await response.json()) as { organic?: Array<{ title?: string; link?: string; snippet?: string }> }
      return (data.organic ?? []).slice(0, 3).map((item) => ({
        title: item.title ?? "Untitled",
        url: item.link ?? "",
        snippet: item.snippet ?? "",
      }))
    }

    if (braveApiKey) {
      const response = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(composedQuery)}&count=3`,
        {
          headers: {
            Accept: "application/json",
            "X-Subscription-Token": braveApiKey,
          },
        }
      )

      if (!response.ok) {
        return []
      }

      const data = (await response.json()) as {
        web?: { results?: Array<{ title?: string; url?: string; description?: string }> }
      }

      return (data.web?.results ?? []).slice(0, 3).map((item) => ({
        title: item.title ?? "Untitled",
        url: item.url ?? "",
        snippet: item.description ?? "",
      }))
    }

    return []
  } catch {
    return []
  }
}

async function getGeminiEstimatedRange(params: {
  modelId: string
  query: string
  country: string
  city: string
  staticEstimate: { low: number; high: number; currency: string; reasoning: string }
  webEvidence: Array<{ title: string; url: string; snippet: string }>
  gemini: ReturnType<typeof createGoogleGenerativeAI>
}) {
  try {
    const response = await generateText({
      model: params.gemini(params.modelId),
      prompt: [
        "You are a financial cost estimation assistant.",
        "Use the static dataset and web snippets.",
        "Return ONLY strict JSON:",
        '{"low":number,"high":number,"currency":"string","reasoning":"string","confidence":"low|medium|high"}',
        `Query: ${params.query}`,
        `Country: ${params.country}`,
        `City: ${params.city}`,
        `Static estimate: ${JSON.stringify(params.staticEstimate)}`,
        `Web evidence: ${JSON.stringify(params.webEvidence)}`,
      ].join("\n"),
    })

    const text = response.text.replace(/```json/g, "").replace(/```/g, "").trim()
    const parsed = JSON.parse(text) as {
      low?: number
      high?: number
      currency?: string
      reasoning?: string
      confidence?: string
    }

    if (typeof parsed.low === "number" && typeof parsed.high === "number" && typeof parsed.currency === "string") {
      return {
        low: parsed.low,
        high: parsed.high,
        currency: parsed.currency,
        reasoning: parsed.reasoning ?? "Estimated with static data + web evidence.",
        confidence: parsed.confidence ?? "medium",
      }
    }
  } catch {
    // Ignore and use fallback.
  }

  return {
    low: params.staticEstimate.low,
    high: params.staticEstimate.high,
    currency: params.staticEstimate.currency,
    reasoning: `${params.staticEstimate.reasoning} Gemini fallback to static range.`,
    confidence: "medium",
  }
}

function isQuotaError(error: unknown) {
  const text = error instanceof Error ? error.message : String(error ?? "")
  return /quota|resource_exhausted|status.?429|429/i.test(text)
}

function extractMonthKeyFromQuery(query: string): MonthKey | undefined {
  const normalized = query.toLowerCase()

  const numeric = normalized.match(/\b(20\d{2})[-/ ](0?[1-9]|1[0-2])\b/)
  if (numeric) {
    const year = numeric[1]
    const month = String(numeric[2]).padStart(2, "0")
    return `${year}-${month}` as MonthKey
  }

  for (const [name, number] of Object.entries(MONTH_NAME_TO_NUMBER)) {
    const byMonthThenYear = new RegExp(`\\b${name}\\b\\s*(?:in|of|on)?\\s*(20\\d{2})\\b`)
    const matchMonthThenYear = normalized.match(byMonthThenYear)
    if (matchMonthThenYear) {
      return `${matchMonthThenYear[1]}-${number}` as MonthKey
    }

    const byYearThenMonth = new RegExp(`\\b(20\\d{2})\\b\\s*(?:in|of|on)?\\s*\\b${name}\\b`)
    const matchYearThenMonth = normalized.match(byYearThenMonth)
    if (matchYearThenMonth) {
      return `${matchYearThenMonth[1]}-${number}` as MonthKey
    }
  }

  const yearOnly = normalized.match(/\b(20\d{2})\b/)
  if (yearOnly) {
    return `${yearOnly[1]}-01` as MonthKey
  }

  return undefined
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function buildLocalAgentResponse({
  query,
  profile,
  route,
  reason,
}: {
  query: string
  profile: FinanceProfile
  route: ReturnType<typeof detectIntent>
  reason: string
}) {
  const targetMonth = extractMonthKeyFromQuery(query)
  const baseSimulation = simulateCashflow(profile, { startMonth: targetMonth, months: 24 })
  const baseReport = generateAdvisorReport(profile, { startMonth: targetMonth, months: 24 })

  if (route.mode === "research" || route.mode === "scenario") {
    const city = coerceJapanCity(undefined, query, profile)
    const estimate = getStaticCostEstimate({ query, city })
    const midpointJpy = Math.round((estimate.low + estimate.high) / 2)
    const assumedDueMonth = targetMonth ?? getMonthKey(new Date())
    const amountInHomeCurrency = Math.round(
      convertToHomeCurrency(midpointJpy, estimate.currency as SupportedCurrency, profile)
    )

    const scenarioProfile: FinanceProfile = {
      ...profile,
      commitments: [
        ...profile.commitments,
        {
          id: `local-sim-${Date.now()}`,
          title: "Estimated scenario expense",
          amount: amountInHomeCurrency,
          currency: profile.settings.homeCurrency,
          dueMonth: assumedDueMonth,
          frequency: "once",
          priority: "discretionary",
        },
      ],
    }
    const scenarioSimulation = simulateCashflow(scenarioProfile, { startMonth: targetMonth, months: 24 })
    const deficitBeforeOrOnSpendMonth =
      scenarioSimulation.firstDeficitMonth &&
      compareMonthKeys(scenarioSimulation.firstDeficitMonth, assumedDueMonth) <= 0

    const doable = !deficitBeforeOrOnSpendMonth
    const verdict = doable
      ? "Likely doable, but keep a safety buffer."
      : "Not safe at this amount/timing unless you adjust plan."

    return [
      `Local advisor mode (Gemini unavailable: ${reason}).`,
      `Intent: ${route.mode}.`,
      `Estimated cost in ${city}: ${formatCurrency(estimate.low, "JPY")} to ${formatCurrency(estimate.high, "JPY")}.`,
      `Scenario used: ${formatCurrency(amountInHomeCurrency, profile.settings.homeCurrency)} one-time in ${monthLabel(assumedDueMonth)}.`,
      `Result: first deficit ${scenarioSimulation.firstDeficitMonth ? monthLabel(scenarioSimulation.firstDeficitMonth) : "No Deficit"}, survival ${Math.round(scenarioSimulation.survivalMonths)} months.`,
      `Verdict: ${verdict}`,
      "Next actions: reduce amount, move purchase to a safer month, or increase savings before purchase.",
    ].join("\n")
  }

  if (route.mode === "loan") {
    const numbers = query.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? []
    if (numbers.length >= 3) {
      const principal = numbers[0]
      const annualInterestRate = numbers[1]
      const tenureMonths = numbers[2]
      const r = annualInterestRate / 12 / 100
      const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1)
      const avgIncome = getAverageMonthlyIncomeInHomeCurrency(profile)
      const ratio = avgIncome > 0 ? emi / avgIncome : 0

      return [
        `Local advisor mode (Gemini unavailable: ${reason}).`,
        `Intent: loan.`,
        `Estimated EMI: ${formatCurrency(emi, profile.settings.homeCurrency)} for ${tenureMonths} months at ${annualInterestRate}% annual.`,
        `EMI to income ratio: ${(ratio * 100).toFixed(1)}% (target <= 30%).`,
        `Baseline risk summary: ${baseReport.summary}`,
        "Next actions: keep EMI under 30% of monthly income, preserve emergency buffer, and avoid stacking new commitments.",
      ].join("\n")
    }

    return [
      `Local advisor mode (Gemini unavailable: ${reason}).`,
      "Intent: loan.",
      "I need loan principal, annual interest rate, and tenure months to compute EMI.",
      "Example: `Loan 800000 at 10.5 for 60 months`.",
      `Baseline risk summary: ${baseReport.summary}`,
    ].join("\n")
  }

  if (route.mode === "planning") {
    const timeline = baseSimulation.timeline.slice(0, 6)
    const avgExpense = average(timeline.map((month) => month.fixedExpense + month.commitments))
    const avgIncome = average(timeline.map((month) => month.income))
    const monthlyGap = avgExpense - avgIncome
    const monthlySaveTarget = Math.max(0, Math.round(monthlyGap + baseSimulation.requiredSafetyBuffer / 12))

    return [
      `Local advisor mode (Gemini unavailable: ${reason}).`,
      "Intent: planning.",
      `Summary: ${baseReport.summary}`,
      `Current runway: ${Math.round(baseSimulation.survivalMonths)} months.`,
      `Suggested monthly save target: ${formatCurrency(monthlySaveTarget, profile.settings.homeCurrency)}.`,
      "Next actions: cut non-essential commitments, automate savings, and review plan monthly.",
    ].join("\n")
  }

  return [
    `Local advisor mode (Gemini unavailable: ${reason}).`,
    `Intent: ${route.mode}.`,
    `Summary: ${baseReport.summary}`,
    `Runway: ${Math.round(baseSimulation.survivalMonths)} months.`,
    `First deficit: ${baseSimulation.firstDeficitMonth ? monthLabel(baseSimulation.firstDeficitMonth) : "No Deficit"}.`,
    `Buffer coverage: ${
      Number.isFinite(baseSimulation.bufferCoverageMonths)
        ? `${baseSimulation.bufferCoverageMonths.toFixed(1)} months`
        : "Unlimited"
    }.`,
    "Next actions: keep fixed burn low, avoid large one-time commitments before income certainty, and maintain emergency reserve.",
  ].join("\n")
}

export async function POST(req: Request) {
  let profile: FinanceProfile | undefined
  let latestUserQuery = ""
  let latestRoute: ReturnType<typeof detectIntent> | undefined

  try {
    const body = (await req.json()) as ChatRequestBody
    profile = body.profile
    const sessionId = body.id ?? req.headers.get("x-chat-id") ?? "default-session"

    if (!profile) {
      return createFallbackResponse("Missing profile context for chat. Please refresh and try again.")
    }

    const profileData = profile
    const uiMessages = Array.isArray(body.messages) ? body.messages : []
    const userQuery = getLatestUserQuery(uiMessages)
    const route = detectIntent(userQuery)
    latestUserQuery = userQuery
    latestRoute = route
    const localReply = (reason: string) =>
      buildLocalAgentResponse({
        query: userQuery || "financial status overview",
        profile: profileData,
        route,
        reason,
      })

    const apiKey = getApiKey()
    if (!apiKey) {
      return createFallbackResponse(localReply("missing API key"))
    }

    if (Date.now() < geminiQuotaBlockedUntil) {
      return createFallbackResponse(localReply("Gemini quota cooldown active"))
    }

    if (geminiRequestCount >= GEMINI_SOFT_LIMIT) {
      return createFallbackResponse(localReply("Gemini soft request limit reached"))
    }

    const gemini = createGoogleGenerativeAI({ apiKey })
    const modelId = getPreferredModel()
    const fallbackMessage = localReply("temporary model error")
    const contextState = getRiskContext(profileData)
    const memory = getSessionMemory(sessionId)

    const systemPrompt = [
      "You are a personal financial planning agent.",
      "Execution flow you must follow:",
      "User Query -> Intent Detection -> Load Financial Context -> Decide Tool Usage -> Gemini Reasoning -> Final Advisor Response",
      "Never assume financial numbers without tool verification.",
      "Always call tools before the final response.",
      "Prioritize user financial survival and deficit prevention.",
      "",
      "Modes:",
      "- question: safety checks and risk summary",
      "- scenario: what-if purchase or event simulation",
      "- planning: monthly savings and action plan",
      "- research: real-world cost estimation and impact analysis",
      "- loan: EMI and affordability",
      "",
      `Detected mode: ${route.mode}`,
      `Primary tool required first: ${route.primaryTool}`,
      `Follow-up tool sequence: ${route.followupToolSequence.join(" -> ") || "none"}`,
      `Active tools for this query: ${route.activeTools.join(", ")}`,
      `Routing reason: ${route.reasoning}`,
      "",
      "Agent Context State (preloaded):",
      JSON.stringify(contextState),
      "",
      "User memory state:",
      JSON.stringify(memory),
      "",
      "Response rules:",
      "- Use concise markdown with short headings.",
      "- Include risk and runway impact when relevant.",
      "- If data is uncertain, call out assumptions clearly.",
      "- End with 2-4 concrete next actions.",
    ].join("\n")

    const tools = {
      simulation_tool: aiTool({
        description:
          "Run cashflow simulation and test hypothetical events such as purchases or one-time commitments.",
        inputSchema: z.object({
          scenarioLabel: z.string().optional(),
          amount: z.number().optional(),
          dueMonth: z.string().optional(),
          frequency: z.enum(["once", "monthly"]).optional(),
          priority: z.enum(["essential", "important", "discretionary"]).optional(),
          startMonth: z.string().optional(),
          horizonMonths: z.number().min(1).max(72).optional(),
        }),
        execute: async ({
          scenarioLabel,
          amount,
          dueMonth,
          frequency,
          priority,
          startMonth,
          horizonMonths,
        }: {
          scenarioLabel?: string
          amount?: number
          dueMonth?: string
          frequency?: "once" | "monthly"
          priority?: "essential" | "important" | "discretionary"
          startMonth?: string
          horizonMonths?: number
        }) => {
          const simProfile: FinanceProfile =
            typeof amount === "number" && amount > 0 && dueMonth
              ? {
                  ...profileData,
                  commitments: [
                    ...profileData.commitments,
                    {
                      id: `sim-${Date.now()}`,
                      title: scenarioLabel ?? "Scenario expense",
                      amount,
                      currency: profileData.settings.homeCurrency,
                      dueMonth: dueMonth as FinanceProfile["commitments"][number]["dueMonth"],
                      frequency: frequency ?? "once",
                      priority: priority ?? "discretionary",
                    },
                  ],
                }
              : profileData

          const simulation = simulateCashflow(simProfile, {
            startMonth: startMonth as MonthKey | undefined,
            months: horizonMonths ?? 24,
          })

          return {
            scenarioApplied: Boolean(typeof amount === "number" && dueMonth),
            firstDeficitMonth: simulation.firstDeficitMonth ?? "No Deficit",
            firstIncomeMonth: simulation.firstIncomeMonth ?? "No Income Event",
            survivalMonths: simulation.survivalMonths,
            preSalarySurvivalMonths: simulation.preSalarySurvivalMonths,
            bufferCoverageMonths: simulation.bufferCoverageMonths,
            requiredSafetyBuffer: simulation.requiredSafetyBuffer,
            timelinePreview: simulation.timeline.slice(0, 6),
          }
        },
      }),
      cost_estimation_tool: aiTool({
        description:
          "Estimate real-world costs (Japan costs, medical procedures, rent range, lifestyle costs) using static dataset + web evidence + Gemini reasoning.",
        inputSchema: z.object({
          query: z.string(),
          country: z.string().optional(),
          city: z.string().optional(),
          useWebSearch: z.boolean().optional(),
        }),
        execute: async ({
          query,
          country,
          city,
          useWebSearch,
        }: {
          query: string
          country?: string
          city?: string
          useWebSearch?: boolean
        }) => {
          try {
            const countryName = country ?? "Japan"
            const resolvedCity = coerceJapanCity(city, query, profileData)
            const staticEstimate = getStaticCostEstimate({ query, city: resolvedCity })
            const webEvidence =
              useWebSearch === false ? [] : await searchWebEvidence(query, countryName, resolvedCity)
            const estimatedRange = await getGeminiEstimatedRange({
              modelId,
              query,
              country: countryName,
              city: resolvedCity,
              staticEstimate,
              webEvidence,
              gemini,
            })

            return {
              query,
              country: countryName,
              city: resolvedCity,
              staticEstimate,
              webEvidence,
              estimatedRange,
            }
          } catch (error) {
            const safeCity = coerceJapanCity(city, query, profileData)
            const fallbackEstimate = getStaticCostEstimate({ query, city: safeCity })

            return {
              query,
              country: country ?? "Japan",
              city: safeCity,
              staticEstimate: fallbackEstimate,
              webEvidence: [],
              estimatedRange: {
                low: fallbackEstimate.low,
                high: fallbackEstimate.high,
                currency: fallbackEstimate.currency,
                reasoning: `${fallbackEstimate.reasoning} Tool fallback was used due to runtime error.`,
                confidence: "low",
              },
              error: error instanceof Error ? error.message : "Unknown cost estimation error",
            }
          }
        },
      }),
      loan_tool: aiTool({
        description: "Calculate EMI, total interest, and loan affordability guidance.",
        inputSchema: z.object({
          principal: z.number(),
          annualInterestRate: z.number(),
          tenureMonths: z.number(),
        }),
        execute: async ({
          principal,
          annualInterestRate,
          tenureMonths,
        }: {
          principal: number
          annualInterestRate: number
          tenureMonths: number
        }) => {
          const r = annualInterestRate / 12 / 100
          const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1)
          const totalPayment = emi * tenureMonths
          const totalInterest = totalPayment - principal
          const avgMonthlyIncome = getAverageMonthlyIncomeInHomeCurrency(profileData)
          const emiToIncomeRatio = avgMonthlyIncome > 0 ? emi / avgMonthlyIncome : null

          return {
            emi: Math.round(emi),
            totalInterest: Math.round(totalInterest),
            totalPayment: Math.round(totalPayment),
            affordability: {
              avgMonthlyIncome: Math.round(avgMonthlyIncome),
              recommendedMaxEmi: Math.round(avgMonthlyIncome * 0.3),
              emiToIncomeRatio,
            },
          }
        },
      }),
      financial_risk_tool: aiTool({
        description: "Detect deficit risk, compute safety buffer, and survival runway using simulation engine.",
        inputSchema: z.object({
          startMonth: z.string().optional(),
          horizonMonths: z.number().min(1).max(72).optional(),
        }),
        execute: async ({
          startMonth,
          horizonMonths,
        }: {
          startMonth?: string
          horizonMonths?: number
        }) => {
          const report = generateAdvisorReport(profileData, {
            startMonth: startMonth as MonthKey | undefined,
            months: horizonMonths ?? 24,
          })
          const simulation = simulateCashflow(profileData, {
            startMonth: startMonth as MonthKey | undefined,
            months: horizonMonths ?? 24,
          })

          return {
            firstDeficitMonth: simulation.firstDeficitMonth ?? "No Deficit",
            survivalMonths: simulation.survivalMonths,
            preSalarySurvivalMonths: simulation.preSalarySurvivalMonths,
            bufferCoverageMonths: simulation.bufferCoverageMonths,
            requiredSafetyBuffer: simulation.requiredSafetyBuffer,
            minimumBalance: simulation.minimumBalance,
            findings: report.findings,
            summary: report.summary,
            suggestions: report.suggestions,
          }
        },
      }),
      memory_tool: aiTool({
        description:
          "Store and retrieve user financial goals, preferences, and risk tolerance for continuity across queries.",
        inputSchema: z.object({
          action: z.enum(["save", "read"]),
          goalType: z.string().optional(),
          details: z.string().optional(),
          preferenceKey: z.string().optional(),
          preferenceValue: z.string().optional(),
          riskTolerance: z.string().optional(),
        }),
        execute: async ({
          action,
          goalType,
          details,
          preferenceKey,
          preferenceValue,
          riskTolerance,
        }: {
          action: "save" | "read"
          goalType?: string
          details?: string
          preferenceKey?: string
          preferenceValue?: string
          riskTolerance?: string
        }) => {
          const current = getSessionMemory(sessionId)

          if (action === "read") {
            return current
          }

          const next: SessionMemory = {
            ...current,
            goals:
              goalType && details
                ? [
                    ...current.goals,
                    {
                      goalType,
                      details,
                      createdAt: new Date().toISOString(),
                    },
                  ]
                : current.goals,
            preferences:
              preferenceKey && preferenceValue
                ? { ...current.preferences, [preferenceKey]: preferenceValue }
                : current.preferences,
            riskTolerance: riskTolerance ?? current.riskTolerance,
            updatedAt: new Date().toISOString(),
          }

          setSessionMemory(sessionId, next)
          return next
        },
      }),
    } as const

    geminiRequestCount += 1

    const result = streamText({
      model: gemini(modelId),
      system: systemPrompt,
      messages: await convertToModelMessages(uiMessages),
      stopWhen: stepCountIs(6),
      tools,
      prepareStep: ({ stepNumber }) => {
        if (stepNumber === 0) {
          return {
            toolChoice: { type: "tool", toolName: route.primaryTool },
            activeTools: route.activeTools,
          }
        }

        const followupTool = route.followupToolSequence[stepNumber - 1]
        if (followupTool) {
          return {
            toolChoice: { type: "tool", toolName: followupTool },
            activeTools: route.activeTools,
          }
        }

        return {
          toolChoice: "auto",
          activeTools: route.activeTools,
        }
      },
    })

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        console.error("Chat stream error:", error)
        if (isQuotaError(error)) {
          geminiQuotaBlockedUntil = Date.now() + 10 * 60 * 1000
          return localReply("Gemini quota exceeded")
        }
        return fallbackMessage
      },
    })
  } catch (error) {
    console.error("Error in chat API:", error)

    if (profile) {
      if (isQuotaError(error)) {
        geminiQuotaBlockedUntil = Date.now() + 10 * 60 * 1000
      }
      if (latestRoute) {
        return createFallbackResponse(
          buildLocalAgentResponse({
            query: latestUserQuery || "financial status overview",
            profile,
            route: latestRoute,
            reason: isQuotaError(error) ? "Gemini quota exceeded" : "chat runtime error",
          })
        )
      }

      return createFallbackResponse(buildFallbackMessage(profile))
    }

    return createFallbackResponse("I could not process that message right now. Please try again.")
  }
}
