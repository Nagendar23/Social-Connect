import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/users/:user_id
export async function GET(
  request: Request,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { user_id } = await params
    const supabase = await createClient()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single()

    if (error || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ profile })
  } catch (err: any) {
    console.error('Failed to fetch user error:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch user', details: err }, { status: 500 })
  }
}