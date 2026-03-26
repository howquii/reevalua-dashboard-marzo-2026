interface ScorerInput {
  days_active: number
  estimated_spend_mid?: number | null
  ad_count?: number
  media_type: string
  has_headline: boolean
  has_cta: boolean
}

export function scoreAd(input: ScorerInput): number {
  let score = 0

  // Duration (max 30pts) — longevity = ROI signal
  score += Math.min(input.days_active, 30)

  // Estimated spend (max 25pts) — log scale
  if (input.estimated_spend_mid) {
    const spend = input.estimated_spend_mid
    if (spend >= 50000)     score += 25
    else if (spend >= 10000) score += 20
    else if (spend >= 5000)  score += 16
    else if (spend >= 1000)  score += 10
    else if (spend >= 100)   score += 5
  }

  // Ad count for brand (max 20pts)
  if (input.ad_count) {
    if (input.ad_count >= 20)      score += 20
    else if (input.ad_count >= 6)  score += 12
    else if (input.ad_count >= 1)  score += 5
  }

  // Media type (max 15pts)
  if (input.media_type === 'video')    score += 15
  else if (input.media_type === 'carousel') score += 10
  else if (input.media_type === 'image')    score += 8

  // Creative completeness (max 10pts)
  if (input.has_headline) score += 5
  if (input.has_cta)      score += 5

  return Math.min(Math.max(Math.round(score), 0), 100)
}

export function getScoreLabel(score: number): 'cold' | 'warm' | 'hot' | 'fire' {
  if (score >= 86) return 'fire'
  if (score >= 66) return 'hot'
  if (score >= 41) return 'warm'
  return 'cold'
}

export function getScoreColor(score: number): string {
  const label = getScoreLabel(score)
  if (label === 'fire') return 'text-green-700 bg-green-50 ring-green-600/20'
  if (label === 'hot')  return 'text-orange-700 bg-orange-50 ring-orange-600/20'
  if (label === 'warm') return 'text-yellow-700 bg-yellow-50 ring-yellow-600/20'
  return 'text-gray-500 bg-gray-50 ring-gray-500/20'
}
