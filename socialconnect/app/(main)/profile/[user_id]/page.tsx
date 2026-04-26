'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
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

  const isOwnProfile = currentUserId === user_id

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      // Get current logged-in user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)

      // Fetch profile
      const profileRes = await fetch(`/api/users/${user_id}`)
      const profileData = await profileRes.json()
      setProfile(profileData.profile)

      // Fetch this user's posts
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

      // Check if current user follows this profile
      if (user && user.id !== user_id) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', user_id)
          .single()

        setIsFollowing(!!followData)
      }

      setLoading(false)
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
        <div className="bg-white border border-slate-200 rounded-xl p-6 h-48 animate-pulse" />
      </div>
    )
  }

  if (!profile) {
    return (
      <p className="text-center text-slate-500 mt-10">User not found.</p>
    )
  }

  return (
    <div className="space-y-4">
      {/* Profile Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatar_url || ''} />
            <AvatarFallback className="text-2xl">
              {profile.first_name?.[0]}{profile.last_name?.[0]}
            </AvatarFallback>
          </Avatar>

          {/* Action Button */}
          {isOwnProfile ? (
            <Button
              variant="outline"
              onClick={() => setShowEditModal(true)}
              className="rounded-full"
            >
              Edit Profile
            </Button>
          ) : (
            <Button
              variant={isFollowing ? 'outline' : 'default'}
              onClick={handleFollowToggle}
              disabled={followLoading}
              className="rounded-full"
            >
              {followLoading
                ? '...'
                : isFollowing
                ? 'Unfollow'
                : 'Follow'}
            </Button>
          )}
        </div>

        {/* Name & Username */}
        <div>
          <h1 className="text-xl font-bold">
            {profile.first_name} {profile.last_name}
          </h1>
          <p className="text-slate-500">@{profile.username}</p>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-slate-700 text-sm leading-relaxed">{profile.bio}</p>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap gap-4 text-sm text-slate-500">
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
              className="flex items-center gap-1 text-blue-500 hover:underline"
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

        {/* Stats */}
        <div className="flex gap-6 pt-2 border-t border-slate-100">
          <div className="text-center">
            <p className="font-bold text-lg">{profile.posts_count}</p>
            <p className="text-xs text-slate-500">Posts</p>
          </div>
          <Link
            href={`/profile/${user_id}/followers`}
            className="text-center hover:opacity-70"
          >
            <p className="font-bold text-lg">{profile.followers_count}</p>
            <p className="text-xs text-slate-500">Followers</p>
          </Link>
          <Link
            href={`/profile/${user_id}/following`}
            className="text-center hover:opacity-70"
          >
            <p className="font-bold text-lg">{profile.following_count}</p>
            <p className="text-xs text-slate-500">Following</p>
          </Link>
        </div>
      </div>

      {/* User's Posts */}
      <div className="space-y-4">
        <h2 className="font-semibold text-slate-700">Posts</h2>
        {posts.length === 0 ? (
          <p className="text-center text-slate-500 py-10 text-sm">
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

      {/* Edit Profile Modal */}
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