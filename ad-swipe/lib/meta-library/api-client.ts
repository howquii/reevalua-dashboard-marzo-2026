import axios from 'axios'
import type { Ad, MediaType } from '@/types/ad'

const BASE_URL = 'https://graph.facebook.com/v19.0'
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN ?? ''

const FIELDS = [
  'id',
  'ad_archive_id',
  // Creative content
  'ad_creative_bodies',
  'ad_creative_link_captions',
  'ad_creative_link_descriptions',
  'ad_creative_link_titles',
  'ad_creative_link_captions',
  // Delivery
  'ad_delivery_start_time',
  'ad_delivery_stop_time',
  'ad_snapshot_url',
  // Advertiser
  'page_id',
  'page_name',
  'bylines',
  // Distribution
  'publisher_platforms',
  'languages',
  // Spend & impressions (available for political/special ads; empty range for commercial)
  'currency',
  'impressions',
  'spend',
].join(',').replace(/,+/g, ',')

interface RawMetaAd {
  id: string
  ad_archive_id: string
  page_id?: string
  page_name?: string
  bylines?: string
  ad_creative_bodies?: string[]
  ad_creative_link_captions?: string[]
  ad_creative_link_titles?: string[]
  ad_creative_link_descriptions?: string[]
  ad_delivery_start_time?: string
  ad_delivery_stop_time?: string
  ad_snapshot_url?: string
  publisher_platforms?: string[]
  languages?: string[]
  currency?: string
  impressions?: { lower_bound: string; upper_bound: string }
  spend?: { lower_bound: string; upper_bound: string }
}

interface SearchParams {
  search_terms?: string
  search_page_ids?: string[]
  ad_reached_countries?: string[]
  media_type?: string
  ad_active_status?: string
  limit?: number
  after?: string
}

export async function validateToken(): Promise<boolean> {
  if (!ACCESS_TOKEN) return false
  try {
    const res = await axios.get(`${BASE_URL}/me`, {
      params: { access_token: ACCESS_TOKEN },
      timeout: 8000,
    })
    return !res.data?.error
  } catch {
    return false
  }
}

export async function searchAdLibrary(params: SearchParams): Promise<{
  ads: Partial<Ad>[]
  nextCursor: string | null
  tokenInvalid?: boolean
}> {
  if (!ACCESS_TOKEN) {
    console.warn('[Meta API] No META_ACCESS_TOKEN set — skipping to Playwright fallback')
    return { ads: [], nextCursor: null }
  }

  const tokenOk = await validateToken()
  if (!tokenOk) {
    console.warn('[Meta API] Token invalid or expired (error 190) — skipping to Playwright fallback')
    return { ads: [], nextCursor: null, tokenInvalid: true }
  }

  const countries = params.ad_reached_countries?.length
    ? params.ad_reached_countries
    : ['US']

  const queryParams: Record<string, string | number> = {
    access_token: ACCESS_TOKEN,
    fields: FIELDS,
    ad_type: 'ALL',
    ad_reached_countries: JSON.stringify(countries),
    media_type: params.media_type ?? 'ALL',
    ad_active_status: params.ad_active_status ?? 'ALL',
    limit: params.limit ?? 100,
  }

  if (params.search_terms) queryParams.search_terms = params.search_terms
  if (params.search_page_ids?.length) queryParams.search_page_ids = JSON.stringify(params.search_page_ids)
  if (params.after) queryParams.after = params.after

  const response = await axios.get(`${BASE_URL}/ads_archive`, {
    params: queryParams,
    timeout: 30000,
  })

  const raw: RawMetaAd[] = response.data?.data ?? []
  const nextCursor: string | null = response.data?.paging?.cursors?.after ?? null

  const ads: Partial<Ad>[] = raw.map(normalizeRawAd)

  return { ads, nextCursor }
}

function normalizeRawAd(raw: RawMetaAd): Partial<Ad> {
  const mediaType = detectMediaType(raw)
  const startDate = raw.ad_delivery_start_time ?? null
  const endDate   = raw.ad_delivery_stop_time ?? null

  const daysActive = startDate
    ? Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000)
    : 0

  // Parse spend/impressions ranges when available (political/special ads)
  const spendMin = raw.spend?.lower_bound ? parseFloat(raw.spend.lower_bound) : null
  const spendMax = raw.spend?.upper_bound ? parseFloat(raw.spend.upper_bound) : null
  const spendMid = spendMin !== null && spendMax !== null ? (spendMin + spendMax) / 2 : null

  return {
    id: raw.ad_archive_id ?? raw.id,
    advertiser_name: raw.page_name ?? 'Unknown',
    advertiser_page_id: raw.page_id ?? null,
    platform: 'meta',
    status: endDate ? 'INACTIVE' : 'ACTIVE',
    media_type: mediaType,
    primary_text: raw.ad_creative_bodies?.[0] ?? null,
    headline: raw.ad_creative_link_titles?.[0] ?? null,
    description: raw.ad_creative_link_descriptions?.[0] ?? null,
    link_url: raw.ad_snapshot_url ?? null,
    image_url: null,
    video_url: null,
    start_date: startDate,
    end_date: endDate,
    days_active: daysActive,
    bylines: raw.bylines ?? null,
    languages: raw.languages ?? [],
    publisher_platforms: raw.publisher_platforms ?? [],
    // Use real spend data if available (political ads), otherwise null (enriched later)
    estimated_spend_min: spendMin,
    estimated_spend_max: spendMax,
    estimated_spend_mid: spendMid,
    spend_confidence: spendMid !== null ? 'high' : null,
    pixels: [],
    tech_stack: [],
    raw_data: raw as unknown as Record<string, unknown>,
  }
}

function detectMediaType(raw: RawMetaAd): MediaType {
  const bodies = raw.ad_creative_bodies
  if (!bodies || bodies.length === 0) return 'unknown'
  if (bodies.length > 1) return 'carousel'
  return 'image' // default — Playwright scraper will refine this
}
