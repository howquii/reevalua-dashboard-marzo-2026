import { chromium } from 'playwright'
import type { Ad, MediaType } from '@/types/ad'

interface ScraperParams {
  query: string
  country?: string
  mediaType?: 'all' | 'image' | 'video'
  maxAds?: number
  onAdFound: (ad: Partial<Ad>) => Promise<void>
}

interface GraphQLAdData {
  ad_archive_id?: string
  page_id?: string
  page_name?: string
  bylines?: string
  ad_creative_bodies?: string[]
  ad_creative_link_titles?: string[]
  ad_creative_link_captions?: string[]
  ad_creative_link_descriptions?: string[]
  snapshot?: {
    images?: Array<{ original_image_url?: string }>
    videos?: Array<{ video_hd_url?: string; video_sd_url?: string }>
    cards?: Array<{ body?: string; title?: string; link_url?: string }>
    link_url?: string
    cta_type?: string
  }
  start_date?: number
  end_date?: number | null
  is_active?: boolean
  impressions_with_index?: {
    impressions_lower_bound?: number
    impressions_upper_bound?: number
  }
  spend?: {
    lower_bound?: number
    upper_bound?: number
  }
  currency?: string
  publisher_platforms?: string[]
  languages?: string[]
  cta_type?: string
}

export async function scrapeAdLibrary(params: ScraperParams): Promise<{ totalFound: number }> {
  const {
    query,
    country = 'ALL',
    maxAds = 200,
    onAdFound,
  } = params

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  })

  const page = await context.newPage()
  let totalFound = 0
  const seen = new Set<string>()

  // Intercept Meta's internal GraphQL responses
  page.on('response', async (response) => {
    const url = response.url()
    if (!url.includes('facebook.com/api/graphql') && !url.includes('facebook.com/ajax/')) return

    try {
      const text = await response.text()
      if (!text.includes('ad_archive_id')) return

      // Parse potentially multi-JSON (JSONL) response
      const lines = text.split('\n').filter(l => l.trim())
      for (const line of lines) {
        try {
          const json = JSON.parse(line)
          const ads = extractAdsFromGraphQL(json)
          for (const ad of ads) {
            if (!ad.id || seen.has(ad.id)) continue
            seen.add(ad.id)
            await onAdFound(ad)
            totalFound++
            if (totalFound >= maxAds) return
          }
        } catch {
          // Not valid JSON line — skip
        }
      }
    } catch {
      // Response read error — skip
    }
  })

  const url = buildLibraryUrl(query, country)
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(3000)

  // Scroll to trigger more results
  let scrollCount = 0
  while (totalFound < maxAds && scrollCount < 20) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(2000)
    scrollCount++
  }

  await browser.close()
  return { totalFound }
}

function buildLibraryUrl(query: string, country: string): string {
  const params = new URLSearchParams({
    active_status: 'all',
    ad_type: 'all',
    country: country === 'ALL' ? 'ALL' : country,
    q: query,
    search_type: 'keyword_unordered',
  })
  return `https://www.facebook.com/ads/library/?${params.toString()}`
}

function extractAdsFromGraphQL(json: Record<string, unknown>): Partial<Ad>[] {
  const ads: Partial<Ad>[] = []
  extractRecursive(json, ads)
  return ads
}

function extractRecursive(obj: unknown, results: Partial<Ad>[]): void {
  if (!obj || typeof obj !== 'object') return

  if (Array.isArray(obj)) {
    for (const item of obj) extractRecursive(item, results)
    return
  }

  const record = obj as Record<string, unknown>

  // Check if this node looks like an ad
  if (record.ad_archive_id && typeof record.ad_archive_id === 'string') {
    const ad = parseGraphQLAd(record as unknown as GraphQLAdData)
    if (ad) results.push(ad)
    return
  }

  for (const value of Object.values(record)) {
    extractRecursive(value, results)
  }
}

function parseGraphQLAd(raw: GraphQLAdData): Partial<Ad> | null {
  if (!raw.ad_archive_id) return null

  const startDate = raw.start_date ? new Date(raw.start_date * 1000).toISOString() : null
  const endDate   = raw.end_date   ? new Date(raw.end_date   * 1000).toISOString() : null
  const daysActive = startDate
    ? Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000)
    : 0

  const hasVideos = (raw.snapshot?.videos?.length ?? 0) > 0
  const hasCards  = (raw.snapshot?.cards?.length ?? 0) > 1
  const mediaType: MediaType = hasVideos ? 'video' : hasCards ? 'carousel' : 'image'

  const imageUrl = raw.snapshot?.images?.[0]?.original_image_url ?? null
  const videoUrl = raw.snapshot?.videos?.[0]?.video_hd_url
    ?? raw.snapshot?.videos?.[0]?.video_sd_url ?? null

  // Use real spend data from GraphQL when available
  const spendMin = raw.spend?.lower_bound ?? null
  const spendMax = raw.spend?.upper_bound ?? null
  const spendMid = spendMin !== null && spendMax !== null ? (spendMin + spendMax) / 2 : null

  const linkUrl = raw.snapshot?.link_url ?? raw.snapshot?.cards?.[0]?.link_url ?? null
  const ctaType = raw.cta_type ?? raw.snapshot?.cta_type ?? null

  return {
    id: raw.ad_archive_id,
    advertiser_name: raw.page_name ?? 'Unknown',
    advertiser_page_id: raw.page_id ?? null,
    platform: 'meta',
    status: (raw.is_active ?? !endDate) ? 'ACTIVE' : 'INACTIVE',
    media_type: mediaType,
    primary_text: raw.ad_creative_bodies?.[0] ?? null,
    headline: raw.ad_creative_link_titles?.[0] ?? raw.snapshot?.cards?.[0]?.title ?? null,
    description: raw.ad_creative_link_descriptions?.[0] ?? null,
    cta_type: ctaType,
    link_url: linkUrl,
    image_url: imageUrl,
    video_url: videoUrl,
    start_date: startDate,
    end_date: endDate,
    days_active: daysActive,
    bylines: raw.bylines ?? null,
    languages: raw.languages ?? [],
    publisher_platforms: raw.publisher_platforms ?? [],
    // Real spend from GraphQL (richer than API)
    estimated_spend_min: spendMin,
    estimated_spend_max: spendMax,
    estimated_spend_mid: spendMid,
    spend_confidence: spendMid !== null ? 'high' : null,
    pixels: [],
    tech_stack: [],
    raw_data: raw as unknown as Record<string, unknown>,
  }
}
