import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/feed
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 10
    const offset = (page - 1) * limit

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get list of users this person follows
    const { data: followData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)

    const followingIds = followData?.map((f) => f.following_id) || []

    // If following nobody — return all public posts (chronological)
    // If following someone — return their posts + own posts
    let query = supabase
      .from('posts')
      .select(`
        *,
        author:profiles(id, username, first_name, last_name, avatar_url)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (followingIds.length > 0) {
      // Show posts from followed users + own posts
      query = query.in('author_id', [...followingIds, user.id])
    }

    const { data: posts, error } = await query
    if (error) throw error

    // Check which posts the current user has liked
    const postIds = posts?.map((p) => p.id) || []
    const { data: likedPosts } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds)

    const likedPostIds = new Set(likedPosts?.map((l) => l.post_id))

    // Attach isLiked flag to each post
    const postsWithLikeStatus = posts?.map((post) => ({
      ...post,
      isLiked: likedPostIds.has(post.id),
    }))

    return NextResponse.json({ posts: postsWithLikeStatus, page, limit })
  } catch (err: any) {
    console.error('Failed to fetch feed error:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch feed', details: err }, { status: 500 })
  }
}