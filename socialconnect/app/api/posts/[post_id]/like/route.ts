import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/posts/:post_id/like — like a post
export async function POST(
  request: Request,
  { params }: { params: Promise<{ post_id: string }> }
) {
  try {
    const { post_id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Insert like — will fail silently if already liked (UNIQUE constraint)
    const { error } = await supabase
      .from('likes')
      .insert({ post_id, user_id: user.id })

    // Code 23505 = unique violation (already liked)
    if (error && error.code !== '23505') {
      throw error
    }

    return NextResponse.json({ message: 'Post liked' })
  } catch (err: any) {
    console.error('Failed to like post error:', err)
    return NextResponse.json({ error: err.message || 'Failed to like post', details: err }, { status: 500 })
  }
}

// DELETE /api/posts/:post_id/like — unlike a post
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ post_id: string }> }
) {
  try {
    const { post_id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', post_id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ message: 'Post unliked' })
  } catch (err: any) {
    console.error('Failed to unlike post error:', err)
    return NextResponse.json({ error: err.message || 'Failed to unlike post', details: err }, { status: 500 })
  }
}