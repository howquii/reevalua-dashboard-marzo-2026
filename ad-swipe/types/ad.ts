export type Platform = 'meta' | 'tiktok' | 'linkedin'
export type MediaType = 'image' | 'video' | 'carousel' | 'unknown'
export type AdStatus = 'ACTIVE' | 'INACTIVE'
export type SpendConfidence = 'high' | 'medium' | 'low'

export interface Ad {
  id: string
  advertiser_name: string
  advertiser_page_id: string | null
  platform: Platform
  status: AdStatus
  media_type: MediaType
  primary_text: string | null
  headline: string | null
  description: string | null
  cta_type: string | null
  link_url: string | null
  image_url: string | null
  video_url: string | null
  storage_image_path: string | null
  storage_video_path: string | null
  start_date: string | null
  end_date: string | null
  // Meta Ad Library extra fields
  bylines: string | null              // "Paid for by X"
  languages: string[]                 // e.g. ['es', 'en']
  publisher_platforms: string[]       // ['facebook','instagram',...]
  // Enrichment
  estimated_spend_min: number | null
  estimated_spend_max: number | null
  estimated_spend_mid: number | null
  spend_confidence: SpendConfidence | null
  performance_score: number | null
  days_active: number | null
  pixels: string[]
  tech_stack: string[]
  video_transcription: string | null
  enriched_at: string | null
  raw_data: Record<string, unknown> | null
  scraped_at: string
  // Enrichment — classification
  industry: string | null
  country_code: string | null
  creatives_count: number | null
}

export interface Collection {
  id: string
  user_id: string
  name: string
  description: string | null
  color: string
  created_at: string
  saved_ads?: SavedAd[]
  _count?: { saved_ads: number }
}

export interface SavedAd {
  id: string
  ad_id: string
  collection_id: string
  notes: string | null
  tags: string[]
  saved_at: string
  ad?: Ad
}

export interface ScrapeJob {
  id: string
  query: string
  job_type: 'keyword' | 'brand'
  status: 'pending' | 'running' | 'done' | 'failed'
  ads_found: number
  error: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface SpendEstimate {
  min: number
  max: number
  mid: number
  confidence: SpendConfidence
  method: 'impressions' | 'duration_proxy'
}

export interface PageIntelligence {
  pixels: {
    meta_pixel: boolean
    google_analytics: boolean
    google_tag_manager: boolean
    tiktok_pixel: boolean
    linkedin_insight: boolean
    klaviyo: boolean
    hotjar: boolean
  }
  tech_stack: {
    shopify: boolean
    clickfunnels: boolean
    wordpress: boolean
    webflow: boolean
    wix: boolean
    kajabi: boolean
  }
  has_checkout: boolean
}

export interface SearchFilters {
  query: string
  country?: string
  media_type?: 'all' | 'image' | 'video'
  active_only?: boolean
  min_days?: number
  min_score?: number
  has_pixel?: string
  has_tech?: string
  sort_by?: 'score' | 'newest' | 'longest' | 'spend'
  cursor?: string
}
