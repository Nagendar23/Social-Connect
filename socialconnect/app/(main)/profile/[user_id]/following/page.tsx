'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function FollowingPage() {
  const { user_id } = useParams()
  const [following, setFollowing] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/users/${user_id}/following`)
      const data = await res.json()
      setFollowing(data.following || [])
      setLoading(false)
    }
    load()
  }, [user_id])

  return (
    <div className="bg-white border border-slate-200 rounded-xl">
      <div className="p-4 border-b border-slate-100">
        <h1 className="font-semibold">Following</h1>
      </div>

      {loading ? (
        <div className="p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      ) : following.length === 0 ? (
        <p className="text-center text-slate-500 py-10 text-sm">
          Not following anyone yet.
        </p>
      ) : (
        <div className="divide-y divide-slate-100">
          {following.map((user: any) => (
            <Link
              key={user.id}
              href={`/profile/${user.id}`}
              className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar_url || ''} />
                <AvatarFallback>{user.first_name?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-slate-500">@{user.username}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}