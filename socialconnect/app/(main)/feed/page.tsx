'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, RefreshCcw } from 'lucide-react'
import CreatePostForm from '@/components/CreatePostForm'
import PostCard from '@/components/PostCard'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Post } from '@/types'

type FeedProfile = {
  username?: string
  avatar_url?: string | null
}

type FeedPost = Post & {
  isLiked?: boolean
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [profile, setProfile] = useState<FeedProfile | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // Get current user profile once on mount
  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setCurrentUserId(user.id)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single()

      setProfile(profileData)
    }
    loadUser()
  }, [])

  const loadPosts = useCallback(async (pageNum: number) => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/feed?page=${pageNum}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to load feed')
      }

      const data = await res.json()

      if (pageNum === 1) {
        setPosts((data.posts || []) as FeedPost[])
      } else {
        setPosts((prev) => [...prev, ...((data.posts || []) as FeedPost[])])
      }

      setHasMore((data.posts || []).length === 10)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPosts(1)
  }, [loadPosts])

  function handlePostCreated(newPost: Post) {
    // Prepend new post to top of feed instantly
    setPosts((prev) => [newPost, ...prev])
  }

  function handlePostDeleted(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  function loadMore() {
    const nextPage = page + 1
    setPage(nextPage)
    loadPosts(nextPage)
  }

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="section-title">Your Feed</h1>
        <p className="text-sm text-muted-foreground">
          Follow updates from your network and publish quick thoughts.
        </p>
      </section>

      <CreatePostForm
        avatarUrl={profile?.avatar_url}
        username={profile?.username}
        onPostCreated={handlePostCreated}
      />

      {loading && page === 1 ? (
        <div className="space-y-4" aria-live="polite">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="surface-card h-36 animate-pulse p-4"
            />
          ))}
        </div>
      ) : error ? (
        <div className="surface-card flex flex-col items-center gap-3 px-6 py-12 text-center">
          <p className="text-base font-medium text-foreground">Could not load your feed</p>
          <p className="max-w-md text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={() => loadPosts(1)}>
            <RefreshCcw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      ) : posts.length === 0 ? (
        <div className="surface-card px-6 py-14 text-center">
          <p className="text-base font-semibold text-foreground">No posts yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Follow people or share your first update to start building your feed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              isLiked={post.isLiked}
              onDelete={handlePostDeleted}
            />
          ))}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button onClick={loadMore} disabled={loading} variant="outline" size="sm">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load more'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}