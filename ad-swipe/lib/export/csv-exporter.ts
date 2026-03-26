import Papa from 'papaparse'
import type { SavedAd } from '@/types/ad'

export function exportAdsToCsv(savedAds: SavedAd[]): string {
  const rows = savedAds.map(saved => {
    const ad = saved.ad!
    return {
      // Identity
      ad_id: ad.id,
      advertiser: ad.advertiser_name,
      platform: ad.platform,
      status: ad.status,
      media_type: ad.media_type,
      // Creative
      headline: ad.headline ?? '',
      primary_text: (ad.primary_text ?? '').slice(0, 500),
      cta_type: ad.cta_type ?? '',
      link_url: ad.link_url ?? '',
      image_url: ad.image_url ?? '',
      video_url: ad.video_url ?? '',
      // Timing
      start_date: ad.start_date ?? '',
      end_date: ad.end_date ?? '',
      days_active: ad.days_active ?? '',
      // Enrichment
      estimated_spend_min: ad.estimated_spend_min ?? '',
      estimated_spend_max: ad.estimated_spend_max ?? '',
      estimated_spend_mid: ad.estimated_spend_mid ?? '',
      spend_confidence: ad.spend_confidence ?? '',
      performance_score: ad.performance_score ?? '',
      pixels: Array.isArray(ad.pixels) ? ad.pixels.join(', ') : '',
      tech_stack: Array.isArray(ad.tech_stack) ? ad.tech_stack.join(', ') : '',
      // Saved ad metadata
      notes: saved.notes ?? '',
      tags: Array.isArray(saved.tags) ? saved.tags.join(', ') : '',
      saved_at: saved.saved_at,
    }
  })

  return Papa.unparse(rows)
}
