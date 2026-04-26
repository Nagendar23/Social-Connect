'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Globe, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import PostCard from '@/components/PostCard'
import EditProfileModal from '@/components/EditProfileModal'
import { createClient } from '@/lib/supabase/client'
import { User, Post } from '@/types'

export default function ProfilePage() {
  const { user_id } = useParams()

  const [profile, setProfile] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [isFollowing, setIsFollowing] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)
  const [pageError, setPageError] = useState('')

  const isOwnProfile = currentUserId === user_id

  useEffect(() => {
    async function load() {
      setPageError('')
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)

      try {
        const profileRes = await fetch(`/api/users/${user_id}`)
        if (!profileRes.ok) {
          throw new Error('Unable to load this profile right now.')
        }

        const profileData = await profileRes.json()
        setProfile(profileData.profile)

        const { data: postsData } = await supabase
          .from('posts')
          .select(`
            *,
            author:profiles(id, username, first_name, last_name, avatar_url)
          `)
          .eq('author_id', user_id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        setPosts(postsData || [])

        if (user && user.id !== user_id) {
          const { data: followData } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', user_id)
            .single()

          setIsFollowing(!!followData)
        }
      } catch (err) {
        setPageError(
          err instanceof Error ? err.message : 'Unable to load this profile right now.'
        )
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user_id])

  async function handleFollowToggle() {
    setFollowLoading(true)
    const method = isFollowing ? 'DELETE' : 'POST'

    try {
      const res = await fetch(`/api/users/${user_id}/follow`, { method })
      if (res.ok) {
        setIsFollowing(!isFollowing)
        // Update follower count locally
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                followers_count: isFollowing
                  ? prev.followers_count - 1
                  : prev.followers_count + 1,
              }
            : prev
        )
      }
    } finally {
      setFollowLoading(false)
    }
  }

  function handlePostDeleted(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
    setProfile((prev) =>
      prev ? { ...prev, posts_count: prev.posts_count - 1 } : prev
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="surface-card h-48 animate-pulse p-6" />
      </div>
    )
  }

  if (pageError) {
    return (
      <div className="surface-card px-6 py-14 text-center">
        <p className="text-base font-semibold text-foreground">Could not load profile</p>
        <p className="mt-1 text-sm text-muted-foreground">{pageError}</p>
      </div>
    )
  }

  if (!profile) {
    return <p className="mt-10 text-center text-muted-foreground">User not found.</p>
  }

  return (
    <div className="space-y-6">
      <div className="surface-card space-y-5 p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatar_url || ''} />
            <AvatarFallback className="text-2xl">
              {profile.first_name?.[0]}{profile.last_name?.[0]}
            </AvatarFallback>
          </Avatar>

          {isOwnProfile ? (
            <Button
              variant="outline"
              onClick={() => setShowEditModal(true)}
              size="sm"
            >
              Edit Profile
            </Button>
          ) : (
            <Button
              variant={isFollowing ? 'outline' : 'default'}
              onClick={handleFollowToggle}
              disabled={followLoading}
              size="sm"
            >
              {followLoading ? 'Updating...' : isFollowing ? 'Unfollow' : 'Follow'}
            </Button>
          )}
        </div>

        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            {profile.first_name} {profile.last_name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">@{profile.username}</p>
        </div>

        {profile.bio && (
          <p className="max-w-2xl text-sm leading-relaxed text-foreground/85">{profile.bio}</p>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {profile.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {profile.location}
            </span>
          )}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <Globe className="h-4 w-4" />
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Joined {format(new Date(profile.created_at), 'MMMM yyyy')}
          </span>
        </div>

        <div className="grid gap-3 border-t border-border/70 pt-4 sm:grid-cols-3">
          <div className="rounded-xl bg-muted/45 px-4 py-3 text-center">
            <p className="text-lg font-semibold tracking-tight text-foreground">{profile.posts_count}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Posts</p>
          </div>
          <Link
            href={`/profile/${user_id}/followers`}
            className="rounded-xl bg-muted/45 px-4 py-3 text-center transition-colors hover:bg-muted/70"
          >
            <p className="text-lg font-semibold tracking-tight text-foreground">{profile.followers_count}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Followers</p>
          </Link>
          <Link
            href={`/profile/${user_id}/following`}
            className="rounded-xl bg-muted/45 px-4 py-3 text-center transition-colors hover:bg-muted/70"
          >
            <p className="text-lg font-semibold tracking-tight text-foreground">{profile.following_count}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Following</p>
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold tracking-tight text-foreground/90">Posts</h2>
        {posts.length === 0 ? (
          <p className="surface-card py-12 text-center text-sm text-muted-foreground">
            {isOwnProfile ? "You haven't posted anything yet." : 'No posts yet.'}
          </p>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onDelete={handlePostDeleted}
            />
          ))
        )}
      </div>

      {showEditModal && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onUpdated={(updated) => setProfile(updated)}
        />
      )}
    </div>
  )
}