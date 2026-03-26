import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('collections')
    .select('*, saved_ads(count)')
    .eq('user_id', user.user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ collections: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, description, color = '#787774' } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const { data, error } = await supabase
    .from('collections')
    .insert({ name: name.trim(), description, color, user_id: user.user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ collection: data })
}
