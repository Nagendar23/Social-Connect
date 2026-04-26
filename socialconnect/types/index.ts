export type User = {
  id: string
  email: string
  username: string
  first_name: string
  last_name: string
  bio: string | null
  avatar_url: string | null
  website: string | null
  location: string | null
  posts_count: number
  followers_count: number
  following_count: number
  created_at: string
}

export type Post = {
  id: string
  author_id: string
  content: string
  image_url: string | null
  like_count: number
  comment_count: number
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined from profiles table when fetching feed
  author?: Pick<User, 'username' | 'avatar_url' | 'first_name' | 'last_name'>
}

export type Comment = {
  id: string
  post_id: string
  author_id: string
  content: string
  created_at: string
  author?: Pick<User, 'username' | 'avatar_url'>
}

export type Like = {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export type Follow = {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}
