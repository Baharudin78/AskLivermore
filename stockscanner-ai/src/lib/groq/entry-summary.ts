import Groq from "groq-sdk"

interface SummaryInput {
  ticker:        string
  pattern:       string
  tradeType:     "swing" | "day"
  setupQuality:  number
  entryLevel:    number
  stopLoss:      number
  target1:       number
  riskReward:    number
  rsiValue:      number | null
  volumeRatio:   number | null
  marketRegime:  string
}

let groqClient: Groq | null = null

function getGroq(): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return groqClient
}

export async function generateTradeSummary(input: SummaryInput): Promise<string> {
  const {
    ticker, pattern, tradeType, setupQuality,
    entryLevel, stopLoss, target1, riskReward,
    rsiValue, volumeRatio, marketRegime,
  } = input

  const prompt = `You are a professional stock trader. Write a 2-3 sentence trade thesis for this ${tradeType} trade. Be concise, specific, and actionable.

Ticker: ${ticker}
Pattern: ${pattern.replace(/-/g, " ")}
Setup Quality: ${setupQuality}/10
Entry: $${entryLevel} | Stop: $${stopLoss} | Target: $${target1}
Risk/Reward: ${riskReward}:1
RSI: ${rsiValue ?? "N/A"} | Volume ratio: ${volumeRatio ? volumeRatio.toFixed(1) + "x" : "N/A"}
Market regime: ${marketRegime}

Output only the 2-3 sentence summary. No headers, no bullet points.`

  try {
    const completion = await getGroq().chat.completions.create({
      model: "llama3-8b-8192",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 120,
      temperature: 0.4,
    })
    return completion.choices[0]?.message?.content?.trim() ?? fallbackSummary(input)
  } catch {
    return fallbackSummary(input)
  }
}

function fallbackSummary(input: SummaryInput): string {
  const { ticker, pattern, entryLevel, stopLoss, target1, riskReward, tradeType } = input
  const patternLabel = pattern.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  return (
    `${ticker} is forming a ${patternLabel} pattern with a ${tradeType} entry near $${entryLevel}. ` +
    `Stop loss is set at $${stopLoss} with a first target of $${target1}, offering a ${riskReward}:1 risk/reward ratio. ` +
    `Wait for price to confirm above the entry zone before committing capital.`
  )
}
