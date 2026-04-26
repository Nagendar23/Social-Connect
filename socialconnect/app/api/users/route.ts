import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/users — list all users
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username, first_name, last_name, avatar_url, bio, followers_count')
      .neq('id', user.id) // exclude current user
      .order('followers_count', { ascending: false })

    if (error) throw error

    return NextResponse.json({ profiles })
  } catch (err: any) {
    console.error('Failed to fetch users error:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch users', details: err }, { status: 500 })
  }
}