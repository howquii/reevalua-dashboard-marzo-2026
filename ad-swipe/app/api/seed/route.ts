import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { scrapeAdLibrary } from '@/lib/meta-library/playwright-scraper'
import { searchAdLibrary } from '@/lib/meta-library/api-client'
import { estimateSpend } from '@/lib/enrichment/spend-estimator'
import { scoreAd } from '@/lib/enrichment/performance-scorer'
import type { Ad } from '@/types/ad'

export const maxDuration = 300

const SEED_BRANDS = [
  { query: 'Airbnb',        industry: 'travel',    country: 'PE' },
  { query: 'Nike',          industry: 'fitness',   country: 'US' },
  { query: 'Shein',         industry: 'ecommerce', country: 'MX' },
  { query: 'Duolingo',      industry: 'education', country: 'CO' },
  { query: 'Nubank',        industry: 'fintech',   country: 'MX' },
  { query: 'Canva',         industry: 'saas',      country: 'US' },
  { query: 'Booking.com',   industry: 'travel',    country: 'AR' },
  { query: 'Rappi',         industry: 'fintech',   country: 'CO' },
  { query: 'Platzi',        industry: 'education', country: 'MX' },
  { query: 'MercadoLibre',  industry: 'ecommerce', country: 'AR' },
]

export async function POST() {
  const supabase = await createServiceClient()
  let totalSeeded = 0
  const errors: string[] = []

  for (const brand of SEED_BRANDS) {
    const saved: Partial<Ad>[] = []

    const saveAd = async (adData: Partial<Ad>) => {
      if (!adData.id) return
      const daysActive = adData.days_active ?? 0
      const spend = estimateSpend({ days_active: daysActive, industry: brand.industry })
      const score = scoreAd({
        days_active: daysActive,
        estimated_spend_mid: adData.estimated_spend_mid ?? spend.mid,
        media_type: adData.media_type ?? 'image',
        has_headline: !!adData.headline,
        has_cta: !!adData.cta_type,
      })
      if (score < 40) return // Only seed ads with decent scores

      saved.push({
        ...adData,
        estimated_spend_min:  adData.estimated_spend_min  ?? spend.min,
        estimated_spend_max:  adData.estimated_spend_max  ?? spend.max,
        estimated_spend_mid:  adData.estimated_spend_mid  ?? spend.mid,
        spend_confidence:     adData.spend_confidence     ?? spend.confidence,
        performance_score:    score,
        industry:             brand.industry,
        country_code:         brand.country,
        scraped_at:           new Date().toISOString(),
      })
    }

    try {
      // Try official API first (faster)
      const { ads: apiAds } = await searchAdLibrary({
        search_terms: brand.query,
        ad_reached_countries: [brand.country],
        limit: 50,
      })
      for (const ad of apiAds) await saveAd(ad)

      // Playwright fallback if API gave nothing
      if (saved.length < 5) {
        await scrapeAdLibrary({
          query: brand.query,
          country: brand.country,
          maxAds: 50,
          onAdFound: saveAd,
        })
      }

      // Batch upsert all ads for this brand
      if (saved.length > 0) {
        const records = saved.map(ad => ({
          id:                   ad.id,
          advertiser_name:      ad.advertiser_name ?? 'Unknown',
          advertiser_page_id:   ad.advertiser_page_id ?? null,
          platform:             ad.platform ?? 'meta',
          status:               ad.status ?? 'ACTIVE',
          media_type:           ad.media_type ?? 'unknown',
          primary_text:         ad.primary_text ?? null,
          headline:             ad.headline ?? null,
          description:          ad.description ?? null,
          cta_type:             ad.cta_type ?? null,
          link_url:             ad.link_url ?? null,
          image_url:            ad.image_url ?? null,
          video_url:            ad.video_url ?? null,
          start_date:           ad.start_date ?? null,
          end_date:             ad.end_date ?? null,
          days_active:          ad.days_active ?? 0,
          estimated_spend_min:  ad.estimated_spend_min ?? null,
          estimated_spend_max:  ad.estimated_spend_max ?? null,
          estimated_spend_mid:  ad.estimated_spend_mid ?? null,
          spend_confidence:     ad.spend_confidence ?? null,
          performance_score:    ad.performance_score ?? null,
          bylines:              ad.bylines ?? null,
          languages:            ad.languages ?? [],
          publisher_platforms:  ad.publisher_platforms ?? [],
          pixels:               ad.pixels ?? [],
          tech_stack:           ad.tech_stack ?? [],
          raw_data:             ad.raw_data ?? null,
          scraped_at:           ad.scraped_at ?? new Date().toISOString(),
          industry:             brand.industry,
          country_code:         brand.country,
          creatives_count:      ad.creatives_count ?? null,
        }))

        const { error } = await supabase.from('ads').upsert(records, { onConflict: 'id' })
        if (error) {
          errors.push(`${brand.query}: ${error.message}`)
        } else {
          totalSeeded += records.length
        }
      }
    } catch (err) {
      errors.push(`${brand.query}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return NextResponse.json({ seeded: totalSeeded, errors })
}
