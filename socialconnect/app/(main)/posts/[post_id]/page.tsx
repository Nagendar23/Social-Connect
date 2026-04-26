'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Loader2, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import PostCard from '@/components/PostCard'
import { createClient } from '@/lib/supabase/client'
import { Comment, Post } from '@/types'

type CommentAuthor = {
  username?: string
  avatar_url?: string | null
  first_name?: string
  last_name?: string
}

type PostComment = Comment & {
  author?: CommentAuthor
}

export default function PostDetailPage() {
  const { post_id } = useParams()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<PostComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [commentError, setCommentError] = useState('')
  const [pageError, setPageError] = useState('')

  useEffect(() => {
    async function load() {
      setPageError('')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)

      try {
        const [postRes, commentsRes] = await Promise.all([
          fetch(`/api/posts/${post_id}`),
          fetch(`/api/posts/${post_id}/comments`),
        ])

        if (!postRes.ok || !commentsRes.ok) {
          throw new Error('Unable to load this post right now.')
        }

        const postData = await postRes.json()
        const commentsData = await commentsRes.json()

        setPost((postData.post || null) as Post | null)
        setComments((commentsData.comments || []) as PostComment[])
      } catch (err) {
        setPageError(
          err instanceof Error ? err.message : 'Unable to load this post right now.'
        )
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [post_id])

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return

    setCommentError('')
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
        setCommentError(data.error || 'Failed to add comment.')
      }
    } catch {
      setCommentError('Failed to add comment.')
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
      <div className="space-y-4" aria-live="polite">
        <div className="surface-card h-40 animate-pulse p-4" />
      </div>
    )
  }

  if (pageError) {
    return (
      <div className="surface-card px-6 py-14 text-center">
        <p className="text-base font-semibold text-foreground">Could not open this post</p>
        <p className="mt-1 text-sm text-muted-foreground">{pageError}</p>
      </div>
    )
  }

  if (!post) {
    return <p className="mt-10 text-center text-muted-foreground">Post not found.</p>
  }

  return (
    <div className="space-y-5">
      <PostCard
        post={post}
        currentUserId={currentUserId}
        isLiked={false}
      />

      <div className="surface-card p-5 sm:p-6">
        <form onSubmit={handleAddComment} className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Add a comment</h2>
            <p className="text-xs text-muted-foreground">Keep it constructive and concise.</p>
          </div>

          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={2}
            maxLength={500}
            className="min-h-24 resize-none"
          />

          {commentError && (
            <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {commentError}
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={submitting || !newComment.trim()}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                'Comment'
              )}
            </Button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-foreground/90">
          Comments ({comments.length})
        </h2>

        {comments.length === 0 ? (
          <p className="surface-card py-8 text-center text-sm text-muted-foreground">
            No comments yet. Be the first!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="surface-card-subtle flex gap-3 p-4"
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
                    <span className="text-sm font-semibold text-foreground">
                      {comment.author?.first_name} {comment.author?.last_name}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      @{comment.author?.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                    {comment.author_id === currentUserId && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-destructive"
                        aria-label="Delete comment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-foreground/90">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}