import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/users/:user_id/followers
export async function GET(
  request: Request,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { user_id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('follows')
      .select(`
        follower:profiles!follower_id(
          id, username, first_name, last_name, avatar_url
        )
      `)
      .eq('following_id', user_id)

    if (error) throw error

    const followers = data?.map((d) => d.follower) || []

    return NextResponse.json({ followers })
  } catch (err: any) {
    console.error('Failed to fetch followers error:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch followers', details: err }, { status: 500 })
  }
}