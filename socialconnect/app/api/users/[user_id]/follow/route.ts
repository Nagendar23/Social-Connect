import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/users/:user_id/follow — follow a user
export async function POST(
  request: Request,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { user_id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Can't follow yourself
    if (user.id === user_id) {
      return NextResponse.json(
        { error: 'You cannot follow yourself' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: user.id, following_id: user_id })

    // Ignore duplicate follow (unique constraint violation)
    if (error && error.code !== '23505') throw error

    return NextResponse.json({ message: 'User followed' })
  } catch (err: any) {
    console.error('Failed to follow user error:', err)
    return NextResponse.json({ error: err.message || 'Failed to follow user', details: err }, { status: 500 })
  }
}

// DELETE /api/users/:user_id/follow — unfollow a user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { user_id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', user_id)

    if (error) throw error

    return NextResponse.json({ message: 'User unfollowed' })
  } catch (err: any) {
    console.error('Failed to unfollow user error:', err)
    return NextResponse.json({ error: err.message || 'Failed to unfollow user', details: err }, { status: 500 })
  }
}