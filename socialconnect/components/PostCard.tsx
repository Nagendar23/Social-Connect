'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { Heart, MessageCircle, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Post } from '@/types'

type Props = {
  post: Post
  currentUserId?: string
  onDelete?: (postId: string) => void
  onLikeToggle?: (postId: string, liked: boolean) => void
  isLiked?: boolean
}

export default function PostCard({
  post,
  currentUserId,
  onDelete,
  onLikeToggle,
  isLiked = false,
}: Props) {
  const [liked, setLiked] = useState(isLiked)
  const [likeCount, setLikeCount] = useState(post.like_count)
  const [loadingLike, setLoadingLike] = useState(false)
  const [actionError, setActionError] = useState('')

  const isOwner = currentUserId === post.author_id
  const author = post.author

  async function handleLike() {
    setActionError('')
    setLoadingLike(true)

    const method = liked ? 'DELETE' : 'POST'

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method })
      if (res.ok) {
        const newLiked = !liked
        setLiked(newLiked)
        setLikeCount((prev) => (newLiked ? prev + 1 : prev - 1))
        onLikeToggle?.(post.id, newLiked)
      } else {
        const data = await res.json()
        setActionError(data.error || 'Unable to update like right now.')
      }
    } catch {
      setActionError('Unable to update like right now.')
    } finally {
      setLoadingLike(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this post?')) return

    const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' })
    if (res.ok) onDelete?.(post.id)
  }

  return (
    <article className="surface-card space-y-4 p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <Link href={`/profile/${post.author_id}`} className="group flex items-center gap-3">
          <Avatar className="h-11 w-11 transition-transform duration-200 group-hover:scale-[1.03]">
            <AvatarImage src={author?.avatar_url || ''} />
            <AvatarFallback>
              {author?.first_name?.[0]}
              {author?.last_name?.[0]}
            </AvatarFallback>
          </Avatar>

          <div>
            <p className="text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
              {author?.first_name} {author?.last_name}
            </p>
            <p className="text-xs text-muted-foreground">@{author?.username}</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </span>

          {isOwner && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              aria-label="Delete post"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <p className="text-sm leading-relaxed text-foreground/90 sm:text-[15px]">{post.content}</p>

      {post.image_url && (
        <div className="relative w-full overflow-hidden rounded-xl border border-border/80 bg-muted/30 p-1">
          <Image
            src={post.image_url}
            alt="Post image"
            width={600}
            height={400}
            className="max-h-96 w-full rounded-lg object-cover"
          />
        </div>
      )}

      {actionError && (
        <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      )}

      <div className="flex items-center gap-2 border-t border-border/70 pt-3">
        <button
          onClick={handleLike}
          disabled={loadingLike}
          aria-label={liked ? 'Unlike post' : 'Like post'}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
            liked
              ? 'bg-destructive/10 text-destructive'
              : 'text-muted-foreground hover:bg-muted/70 hover:text-destructive'
          }`}
        >
          <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
          <span>{likeCount}</span>
        </button>

        <Link
          href={`/posts/${post.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-primary"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{post.comment_count}</span>
        </Link>
      </div>
    </article>
  )
}
