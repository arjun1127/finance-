import type { AdvisorReport } from "@/lib/ai/advisor"
import type { FinanceProfile } from "@/lib/finance/models"

export interface GeminiAdvisorAdvice {
  summary: string
  actions: string[]
  model: string
}

interface GeminiTextPart {
  text?: string
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiTextPart[]
  }
}

interface GeminiResponse {
  candidates?: GeminiCandidate[]
}

const FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]

function extractJsonContent(raw: string): string {
  const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  return fencedMatch ? fencedMatch[1].trim() : raw.trim()
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

function parseAdvice(raw: string): Omit<GeminiAdvisorAdvice, "model"> | null {
  const jsonText = extractJsonContent(raw)

  try {
    const parsed = JSON.parse(jsonText) as unknown
    if (!parsed || typeof parsed !== "object") {
      return null
    }

    const summary = (parsed as { summary?: unknown }).summary
    const actions = (parsed as { actions?: unknown }).actions

    if (typeof summary !== "string" || !isStringArray(actions)) {
      return null
    }

    return {
      summary: summary.trim(),
      actions: actions.map((action) => action.trim()).filter(Boolean).slice(0, 5),
    }
  } catch {
    return null
  }
}

function buildPrompt(profile: FinanceProfile, report: AdvisorReport): string {
  const payload = {
    currency: profile.settings.homeCurrency,
    currentSavings: profile.currentSavings,
    fixedExpenseCount: profile.fixedExpenses.length,
    commitmentCount: profile.commitments.length,
    incomeCount: profile.incomes.length,
    report: {
      summary: report.summary,
      findings: report.findings,
      suggestions: report.suggestions,
      timelineNarrative: report.timelineNarrative,
    },
  }

  return [
    "You are a strict personal finance survival advisor.",
    "Respond only in JSON with this exact shape:",
    '{"summary":"string","actions":["string","string","string"]}',
    "Rules:",
    "- Focus on survival cashflow, deficit prevention, and realistic next month actions.",
    "- Keep summary under 30 words.",
    "- Each action must be one sentence, concrete, and practical.",
    "- Do not include markdown, code fences, or extra keys.",
    `Context JSON: ${JSON.stringify(payload)}`,
  ].join("\n")
}

export async function generateGeminiAdvice(
  profile: FinanceProfile,
  report: AdvisorReport
): Promise<GeminiAdvisorAdvice> {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY")
  }

  const configuredModels = process.env.GEMINI_MODELS
    ?.split(",")
    .map((model) => model.trim())
    .filter(Boolean)

  const models = configuredModels && configuredModels.length > 0 ? configuredModels : FALLBACK_MODELS

  for (const model of models) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: buildPrompt(profile, report) }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      }
    )

    if (!response.ok) {
      continue
    }

    const data = (await response.json()) as GeminiResponse
    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("\n")
        .trim() ?? ""

    if (!text) {
      continue
    }

    const parsed = parseAdvice(text)
    if (parsed) {
      return {
        ...parsed,
        model,
      }
    }
  }

  throw new Error("Gemini did not return a valid advisor payload")
}
