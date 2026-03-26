import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { searchAdLibrary } from '@/lib/meta-library/api-client'
import { scrapeAdLibrary } from '@/lib/meta-library/playwright-scraper'
import { estimateSpend } from '@/lib/enrichment/spend-estimator'
import { scoreAd } from '@/lib/enrichment/performance-scorer'
import type { Ad } from '@/types/ad'

export const maxDuration = 300 // 5 minutes for scraping

export async function POST(req: NextRequest) {
  const { jobId, query, country = 'ALL', industry = null, country_code = null } = await req.json()

  if (!jobId || !query) {
    return NextResponse.json({ error: 'Missing jobId or query' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // Mark job as running
  await supabase
    .from('scrape_jobs')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', jobId)

  let adsFound = 0

  const saveAd = async (adData: Partial<Ad>) => {
      if (!adData.id) return

      // Apply enrichment
      const daysActive = adData.days_active ?? 0
      const spend = estimateSpend({ days_active: daysActive, ad_count: undefined })
      const score = scoreAd({
        days_active: daysActive,
        estimated_spend_mid: spend.mid,
        media_type: adData.media_type ?? 'image',
        has_headline: !!adData.headline,
        has_cta: !!adData.cta_type,
      })

      // Prefer real spend data from scraper over estimator fallback
      const hasRealSpend = adData.estimated_spend_mid != null
      const spendMin  = hasRealSpend ? (adData.estimated_spend_min ?? spend.min) : spend.min
      const spendMax  = hasRealSpend ? (adData.estimated_spend_max ?? spend.max) : spend.max
      const spendMid  = hasRealSpend ? (adData.estimated_spend_mid ?? spend.mid) : spend.mid
      const spendConf = hasRealSpend ? (adData.spend_confidence ?? spend.confidence) : spend.confidence

      // Build record with only columns that exist in the DB schema
      const record = {
        id:                    adData.id,
        advertiser_name:       adData.advertiser_name ?? 'Unknown',
        advertiser_page_id:    adData.advertiser_page_id ?? null,
        platform:              adData.platform ?? 'meta',
        status:                adData.status ?? 'ACTIVE',
        media_type:            adData.media_type ?? 'unknown',
        primary_text:          adData.primary_text ?? null,
        headline:              adData.headline ?? null,
        description:           adData.description ?? null,
        cta_type:              adData.cta_type ?? null,
        link_url:              adData.link_url ?? null,
        image_url:             adData.image_url ?? null,
        video_url:             adData.video_url ?? null,
        storage_image_path:    adData.storage_image_path ?? null,
        storage_video_path:    adData.storage_video_path ?? null,
        start_date:            adData.start_date ?? null,
        end_date:              adData.end_date ?? null,
        days_active:           adData.days_active ?? 0,
        estimated_spend_min:   spendMin,
        estimated_spend_max:   spendMax,
        estimated_spend_mid:   spendMid,
        spend_confidence:      spendConf,
        performance_score:     score,
        pixels:                adData.pixels ?? [],
        tech_stack:            adData.tech_stack ?? [],
        video_transcription:   adData.video_transcription ?? null,
        bylines:               adData.bylines ?? null,
        languages:             adData.languages ?? [],
        publisher_platforms:   adData.publisher_platforms ?? [],
        raw_data:              adData.raw_data ?? null,
        scraped_at:            new Date().toISOString(),
        industry:              (adData as Partial<Ad> & { industry?: string | null }).industry ?? industry ?? null,
        country_code:          (adData as Partial<Ad> & { country_code?: string | null }).country_code ?? country_code ?? (country !== 'ALL' ? country : null),
        creatives_count:       (adData as Partial<Ad> & { creatives_count?: number | null }).creatives_count ?? null,
      }

      const { error } = await supabase.from('ads').upsert(record, { onConflict: 'id' })
      if (!error) {
        adsFound++
        await supabase
          .from('scrape_jobs')
          .update({ ads_found: adsFound })
          .eq('id', jobId)
      }
  }

  try {

    // Phase 1: Official API (fast, legal)
    try {
      const { ads } = await searchAdLibrary({
        search_terms: query,
        ad_reached_countries: country === 'ALL' ? ['US'] : [country],
        limit: 100,
      })
      for (const ad of ads) {
        await saveAd(ad)
      }
    } catch (apiErr) {
      console.warn('[Scraper] Official API failed, falling back to Playwright:', apiErr)
    }

    // Phase 2: Playwright scraper for richer data (only if API token missing or insufficient)
    if (adsFound < 10) {
      await scrapeAdLibrary({
        query,
        country,
        maxAds: 100,
        onAdFound: saveAd,
      })
    }

    await supabase
      .from('scrape_jobs')
      .update({
        status: 'done',
        ads_found: adsFound,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    return NextResponse.json({ success: true, adsFound })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await supabase
      .from('scrape_jobs')
      .update({ status: 'failed', error: msg, completed_at: new Date().toISOString() })
      .eq('id', jobId)

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
