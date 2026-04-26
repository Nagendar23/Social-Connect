import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(500),
})

// GET /api/posts/:post_id/comments
export async function GET(
  request: Request,
  { params }: { params: Promise<{ post_id: string }> }
) {
  try {
    const { post_id } = await params
    const supabase = await createClient()

    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:profiles(id, username, first_name, last_name, avatar_url)
      `)
      .eq('post_id', post_id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ comments })
  } catch (err: any) {
    console.error('Failed to fetch comments error:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch comments', details: err }, { status: 500 })
  }
}

// POST /api/posts/:post_id/comments
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

    const body = await request.json()
    const parsed = commentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        post_id,
        author_id: user.id,
        content: parsed.data.content,
      })
      .select(`
        *,
        author:profiles(id, username, first_name, last_name, avatar_url)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ comment }, { status: 201 })
  } catch (err: any) {
    console.error('Failed to add comment error:', err)
    return NextResponse.json({ error: err.message || 'Failed to add comment', details: err }, { status: 500 })
  }
}