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

  const isOwner = currentUserId === post.author_id
  const author = post.author

  async function handleLike() {
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
        alert(`Failed to like post: ${data.error}`)
      }
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
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Author Info */}
      <div className="flex items-center justify-between">
        <Link
          href={`/profile/${post.author_id}`}
          className="flex items-center gap-3 hover:opacity-80"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={author?.avatar_url || ''} />
            <AvatarFallback>
              {author?.first_name?.[0]}{author?.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">
              {author?.first_name} {author?.last_name}
            </p>
            <p className="text-xs text-slate-500">@{author?.username}</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </span>
          {isOwner && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-red-500"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Post Content */}
      <p className="text-sm text-slate-800 leading-relaxed">{post.content}</p>

      {/* Post Image */}
      {post.image_url && (
        <div className="relative w-full rounded-lg overflow-hidden">
          <Image
            src={post.image_url}
            alt="Post image"
            width={600}
            height={400}
            className="w-full object-cover max-h-96"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 border-t border-slate-100 pt-2">
        <button
          onClick={handleLike}
          disabled={loadingLike}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            liked ? 'text-red-500' : 'text-slate-500 hover:text-red-500'
          }`}
        >
          <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
          <span>{likeCount}</span>
        </button>

        <Link
          href={`/posts/${post.id}`}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-500 transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{post.comment_count}</span>
        </Link>
      </div>
    </div>
  )
}