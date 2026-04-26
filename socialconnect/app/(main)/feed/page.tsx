'use client'

import { useState, useEffect, useCallback } from 'react'
import CreatePostForm from '@/components/CreatePostForm'
import PostCard from '@/components/PostCard'
import { createClient } from '@/lib/supabase/client'
import { Post } from '@/types'

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
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
    setLoading(true)
    try {
      const res = await fetch(`/api/feed?page=${pageNum}`)
      const data = await res.json()

      if (pageNum === 1) {
        setPosts(data.posts || [])
      } else {
        setPosts((prev) => [...prev, ...(data.posts || [])])
      }

      // If fewer posts returned than limit, no more pages
      setHasMore((data.posts || []).length === 10)
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
    <div className="space-y-4">
      {/* Create Post */}
      <CreatePostForm
        avatarUrl={profile?.avatar_url}
        username={profile?.username}
        onPostCreated={handlePostCreated}
      />

      {/* Posts Feed */}
      {loading && page === 1 ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-xl p-4 h-32 animate-pulse"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg font-medium">No posts yet</p>
          <p className="text-sm mt-1">Follow some people or create your first post!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post: any) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              isLiked={post.isLiked}
              onDelete={handlePostDeleted}
            />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full py-3 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load more'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}