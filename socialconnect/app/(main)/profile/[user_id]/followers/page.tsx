'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User } from '@/types'

type FollowerPreview = Pick<
  User,
  'id' | 'first_name' | 'last_name' | 'username' | 'avatar_url'
>

export default function FollowersPage() {
  const { user_id } = useParams()
  const [followers, setFollowers] = useState<FollowerPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setError('')
      try {
        const res = await fetch(`/api/users/${user_id}/followers`)
        if (!res.ok) {
          throw new Error('Unable to load followers right now.')
        }

        const data = await res.json()
        setFollowers((data.followers || []) as FollowerPreview[])
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to load followers right now.'
        )
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user_id])

  return (
    <div className="surface-card overflow-hidden">
      <div className="border-b border-border/70 px-5 py-4">
        <h1 className="font-heading text-lg font-semibold tracking-tight text-foreground">
          Followers
        </h1>
      </div>

      {loading ? (
        <div className="space-y-3 p-4" aria-live="polite">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-muted/70" />
          ))}
        </div>
      ) : error ? (
        <p className="px-6 py-12 text-center text-sm text-muted-foreground">{error}</p>
      ) : followers.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No followers yet.</p>
      ) : (
        <div className="divide-y divide-border/60">
          {followers.map((user) => (
            <Link
              key={user.id}
              href={`/profile/${user.id}`}
              className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar_url || ''} />
                <AvatarFallback>{user.first_name?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}