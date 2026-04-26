import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updatePostSchema = z.object({
  content: z.string().min(1).max(280).optional(),
  image_url: z.string().url().optional().nullable(),
})

// GET /api/posts/:post_id
export async function GET(
  request: Request,
  { params }: { params: Promise<{ post_id: string }> }
) {
  try {
    const { post_id } = await params
    const supabase = await createClient()

    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles(id, username, first_name, last_name, avatar_url)
      `)
      .eq('id', post_id)
      .eq('is_active', true)
      .single()

    if (error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json({ post })
  } catch (err: any) {
    console.error('Failed to fetch post error:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch post', details: err }, { status: 500 })
  }
}

// PATCH /api/posts/:post_id
export async function PATCH(
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

    // Make sure the post belongs to this user
    const { data: existingPost } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', post_id)
      .single()

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (existingPost.author_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = updatePostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { data: post, error } = await supabase
      .from('posts')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', post_id)
      .select(`
        *,
        author:profiles(id, username, first_name, last_name, avatar_url)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ post })
  } catch (err: any) {
    console.error('Failed to update post error:', err)
    return NextResponse.json({ error: err.message || 'Failed to update post', details: err }, { status: 500 })
  }
}

// DELETE /api/posts/:post_id
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

    const { data: existingPost } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', post_id)
      .single()

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (existingPost.author_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete — just marks is_active = false, keeps data intact
    const { error } = await supabase
      .from('posts')
      .update({ is_active: false })
      .eq('id', post_id)

    if (error) throw error

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (err: any) {
    console.error('Failed to delete post error:', err)
    return NextResponse.json({ error: err.message || 'Failed to delete post', details: err }, { status: 500 })
  }
}