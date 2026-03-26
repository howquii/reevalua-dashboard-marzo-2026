import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exportAdsToCsv } from '@/lib/export/csv-exporter'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const format = req.nextUrl.searchParams.get('format') ?? 'csv'
  const supabase = await createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('saved_ads')
    .select('*, ad:ads(*)')
    .eq('collection_id', id)
    .order('saved_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: col } = await supabase
    .from('collections')
    .select('name')
    .eq('id', id)
    .single()

  const filename = `${(col?.name ?? 'collection').replace(/\s+/g, '_')}_ads`

  if (format === 'json') {
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}.json"`,
      },
    })
  }

  const csv = exportAdsToCsv(data as Parameters<typeof exportAdsToCsv>[0])
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
    },
  })
}
