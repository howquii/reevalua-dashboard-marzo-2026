import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const SORT_MAP: Record<string, { col: string; asc: boolean }> = {
  score:   { col: 'performance_score', asc: false },
  newest:  { col: 'scraped_at',        asc: false },
  longest: { col: 'days_active',       asc: false },
  spend:   { col: 'estimated_spend_mid', asc: false },
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    query = '',
    country,
    media_type,
    active_only,
    sort_by = 'score',
  } = body

  const supabase = await createServiceClient()

  // 1. Query DB for cached results
  let dbQuery = supabase
    .from('ads')
    .select('*', { count: 'exact' })
    .ilike('advertiser_name', `%${query}%`)
    .range(0, 59)

  if (active_only) dbQuery = dbQuery.eq('status', 'ACTIVE')
  if (media_type && media_type !== 'all') dbQuery = dbQuery.eq('media_type', media_type)

  // Text search across multiple columns
  if (query) {
    dbQuery = supabase
      .from('ads')
      .select('*', { count: 'exact' })
      .or(`advertiser_name.ilike.%${query}%,primary_text.ilike.%${query}%,headline.ilike.%${query}%`)
      .range(0, 59)
    if (active_only) dbQuery = dbQuery.eq('status', 'ACTIVE')
    if (media_type && media_type !== 'all') dbQuery = dbQuery.eq('media_type', media_type)
  }

  const sort = SORT_MAP[sort_by] ?? SORT_MAP.score
  dbQuery = dbQuery.order(sort.col, { ascending: sort.asc, nullsFirst: false })

  const { data: ads, count } = await dbQuery

  // 2. If not enough cached results, trigger a new scrape job
  let jobId: string | null = null
  if ((count ?? 0) < 20 && query.trim()) {
    // Check if there's already a recent job for this query
    const { data: existing } = await supabase
      .from('scrape_jobs')
      .select('id, status')
      .eq('query', query)
      .in('status', ['pending', 'running'])
      .limit(1)

    if (!existing || existing.length === 0) {
      const { data: job } = await supabase
        .from('scrape_jobs')
        .insert({ query, job_type: 'keyword', status: 'pending' })
        .select()
        .single()
      if (job) {
        jobId = job.id
        // Trigger scrape worker via internal API (fire and forget)
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/scrape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: job.id, query, country }),
        }).catch(console.error)
      }
    } else if (existing[0]) {
      jobId = existing[0].id
    }
  }

  return NextResponse.json({
    ads: ads ?? [],
    total: count ?? 0,
    hasMore: (count ?? 0) > 60,
    jobId,
  })
}
