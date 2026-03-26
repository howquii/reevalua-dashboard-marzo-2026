import type { SpendEstimate, SpendConfidence } from '@/types/ad'

// CPM benchmarks from Meta industry data (USD)
const CPM_BENCHMARKS: Record<string, { low: number; mid: number; high: number }> = {
  ecommerce:   { low: 8,  mid: 12.79, high: 20 },
  saas:        { low: 10, mid: 15,    high: 25 },
  finance:     { low: 15, mid: 22,    high: 35 },
  healthcare:  { low: 12, mid: 18,    high: 30 },
  education:   { low: 7,  mid: 11,    high: 18 },
  default:     { low: 6,  mid: 8,     high: 15 },
}

// Ad count → daily spend multiplier
const AD_COUNT_SPEND: Record<string, { min: number; max: number }> = {
  low:    { min: 200,   max: 2000   },  // 1-5 ads
  medium: { min: 2000,  max: 15000  },  // 6-20 ads
  high:   { min: 15000, max: 100000 },  // 20+ ads
}

interface EstimateInput {
  impressions_low?: number
  impressions_high?: number
  days_active: number
  ad_count?: number
  industry?: string
}

export function estimateSpend(input: EstimateInput): SpendEstimate {
  const cpm = CPM_BENCHMARKS[input.industry ?? 'default'] ?? CPM_BENCHMARKS.default

  // Method 1: Use impressions range if available
  if (input.impressions_low && input.impressions_high) {
    const spendLow = (input.impressions_low  * cpm.low)  / 1000
    const spendHigh = (input.impressions_high * cpm.high) / 1000
    const spendMid  = (input.impressions_low + input.impressions_high) / 2 * cpm.mid / 1000

    const confidence: SpendConfidence =
      input.impressions_high > 100000 ? 'high' :
      input.impressions_high > 10000  ? 'medium' : 'low'

    return { min: Math.round(spendLow), max: Math.round(spendHigh), mid: Math.round(spendMid), confidence, method: 'impressions' }
  }

  // Method 2: Proxy via ad count + duration
  const adCountBucket =
    !input.ad_count       ? 'low' :
    input.ad_count <= 5   ? 'low' :
    input.ad_count <= 20  ? 'medium' : 'high'

  const range = AD_COUNT_SPEND[adCountBucket]
  const durationMultiplier = Math.min(input.days_active / 30, 3) // cap at 3x for 90d+ campaigns
  const spendMin = Math.round(range.min * durationMultiplier)
  const spendMax = Math.round(range.max * durationMultiplier)
  const spendMid = Math.round((spendMin + spendMax) / 2)

  return { min: spendMin, max: spendMax, mid: spendMid, confidence: 'low', method: 'duration_proxy' }
}

export function formatSpend(estimate: SpendEstimate): string {
  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`
  return `${fmt(estimate.min)}–${fmt(estimate.max)}/mo`
}
