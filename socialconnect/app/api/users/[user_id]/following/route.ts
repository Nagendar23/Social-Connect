import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/users/:user_id/following
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
        following:profiles!following_id(
          id, username, first_name, last_name, avatar_url
        )
      `)
      .eq('follower_id', user_id)

    if (error) throw error

    const following = data?.map((d) => d.following) || []

    return NextResponse.json({ following })
  } catch (err: any) {
    console.error('Failed to fetch following error:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch following', details: err }, { status: 500 })
  }
}