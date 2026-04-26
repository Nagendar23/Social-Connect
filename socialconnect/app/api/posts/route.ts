import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createPostSchema = z.object({
  content: z.string().min(1).max(280),
  image_url: z.string().url().optional().nullable(),
})

// GET /api/posts — list all posts with author info
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 10
    const offset = (page - 1) * limit

    const supabase = await createClient()

    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles(id, username, first_name, last_name, avatar_url)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({ posts, page, limit })
  } catch (err: any) {
    console.error('Failed to fetch posts error:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch posts', details: err }, { status: 500 })
  }
}

// POST /api/posts — create a new post
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get current logged-in user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createPostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        author_id: user.id,
        content: parsed.data.content,
        image_url: parsed.data.image_url || null,
      })
      .select(`
        *,
        author:profiles(id, username, first_name, last_name, avatar_url)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ post }, { status: 201 })
  } catch (err: any) {
    console.error('Create post error:', err)
    return NextResponse.json({ error: err.message || 'Failed to create post', details: err }, { status: 500 })
  }
}