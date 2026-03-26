import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const country   = searchParams.get('country') ?? null
  const industry  = searchParams.get('industry') ?? null
  const mediaType = searchParams.get('media_type') ?? null
  const minScore  = parseInt(searchParams.get('min_score') ?? '0', 10)
  const sortBy    = searchParams.get('sort') ?? 'score'
  const page      = parseInt(searchParams.get('page') ?? '0', 10)
  const limit     = 60

  const supabase = await createServiceClient()

  let query = supabase
    .from('ads')
    .select('*')
    .gte('performance_score', minScore || 0)

  if (country && country !== 'ALL') {
    query = query.eq('country_code', country)
  }
  if (industry && industry !== 'all') {
    query = query.eq('industry', industry)
  }
  if (mediaType && mediaType !== 'all') {
    query = query.eq('media_type', mediaType)
  }

  const orderCol =
    sortBy === 'spend'   ? 'estimated_spend_mid' :
    sortBy === 'newest'  ? 'scraped_at' :
    sortBy === 'longest' ? 'days_active' :
    'performance_score'

  query = query
    .order(orderCol, { ascending: false, nullsFirst: false })
    .range(page * limit, page * limit + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('[top-ads] DB error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ads: data ?? [], total: count ?? (data?.length ?? 0) })
}
