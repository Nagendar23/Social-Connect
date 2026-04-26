'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Post } from '@/types'

type Props = {
  avatarUrl?: string | null
  username?: string
  onPostCreated: (post: Post) => void
}

export default function CreatePostForm({ avatarUrl, username, onPostCreated }: Props) {
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_CHARS = 280
  const remaining = MAX_CHARS - content.length

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Only JPEG and PNG images are allowed')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB')
      return
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  function removeImage() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    setError('')

    try {
      let image_url = null

      // Upload image first if one is selected
      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        const uploadData = await uploadRes.json()

        if (!uploadRes.ok) {
          setError(uploadData.error)
          return
        }
        image_url = uploadData.url
      }

      // Create the post
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), image_url }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        return
      }

      // Reset form
      setContent('')
      removeImage()
      onPostCreated(data.post)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <Avatar className="h-11 w-11 shrink-0">
          <AvatarImage src={avatarUrl || ''} />
          <AvatarFallback>{username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground/90">Share an update</p>
            <Textarea
              placeholder="What are you building or thinking about today?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={MAX_CHARS}
              rows={4}
              className="min-h-28 resize-none border-border/80 bg-background shadow-none"
            />
          </div>

          {imagePreview && (
            <div className="relative inline-block overflow-hidden rounded-xl border border-border/80 bg-muted/30 p-1">
              <Image
                src={imagePreview}
                alt="Preview"
                width={240}
                height={170}
                className="max-h-48 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                aria-label="Remove image"
                className="absolute right-2 top-2 rounded-full bg-foreground/80 p-1 text-background transition-colors hover:bg-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5"
              >
                <ImagePlus className="h-4 w-4" />
                Attach image
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium ${
                  remaining < 20 ? 'text-destructive' : 'text-muted-foreground'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                {remaining}
              </span>
              <Button
                type="submit"
                size="sm"
                disabled={loading || !content.trim()}
                className="min-w-24"
              >
                {loading ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}