'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import PostCard from '@/components/PostCard'
import { createClient } from '@/lib/supabase/client'
import { Comment } from '@/types'

export default function PostDetailPage() {
  const { post_id } = useParams()
  const [post, setPost] = useState<any>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)

      const [postRes, commentsRes] = await Promise.all([
        fetch(`/api/posts/${post_id}`),
        fetch(`/api/posts/${post_id}/comments`),
      ])

      const postData = await postRes.json()
      const commentsData = await commentsRes.json()

      setPost(postData.post)
      setComments(commentsData.comments || [])
      setLoading(false)
    }
    load()
  }, [post_id])

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/posts/${post_id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setComments((prev) => [...prev, data.comment])
        setNewComment('')
      } else {
        alert(`Failed to add comment: ${data.error}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteComment(commentId: string) {
    const res = await fetch(
      `/api/posts/${post_id}/comments/${commentId}`,
      { method: 'DELETE' }
    )
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 h-40 animate-pulse" />
      </div>
    )
  }

  if (!post) {
    return <p className="text-center text-slate-500 mt-10">Post not found.</p>
  }

  return (
    <div className="space-y-4">
      {/* Post */}
      <PostCard
        post={post}
        currentUserId={currentUserId}
        isLiked={false}
      />

      {/* Comment Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <form onSubmit={handleAddComment} className="space-y-3">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={2}
            maxLength={500}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !newComment.trim()}
              className="rounded-full"
            >
              {submitting ? 'Posting...' : 'Comment'}
            </Button>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        <h2 className="font-semibold text-slate-700">
          Comments ({comments.length})
        </h2>

        {comments.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">
            No comments yet. Be the first!
          </p>
        ) : (
          comments.map((comment: any) => (
            <div
              key={comment.id}
              className="bg-white border border-slate-200 rounded-xl p-3 flex gap-3"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={comment.author?.avatar_url || ''} />
                <AvatarFallback className="text-xs">
                  {comment.author?.first_name?.[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm">
                      {comment.author?.first_name} {comment.author?.last_name}
                    </span>
                    <span className="text-slate-400 text-xs ml-2">
                      @{comment.author?.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                    {comment.author_id === currentUserId && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-slate-700 mt-1">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}