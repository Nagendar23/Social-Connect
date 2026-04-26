'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, LogOut, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

type Props = {
  username?: string
  avatarUrl?: string | null
  userId?: string
}

export default function Navbar({ username, avatarUrl, userId }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const isFeedActive = pathname.startsWith('/feed')
  const isProfileActive = pathname.startsWith('/profile')

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-lg">
      <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4 sm:px-6">
        <Link href="/feed" className="group flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/12 text-primary transition-colors group-hover:bg-primary/18">
            <Home className="h-4 w-4" />
          </span>
          <span className="font-heading text-base font-semibold tracking-tight text-foreground">
            SocialConnect
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link href="/feed">
            <Button
              variant={isFeedActive ? 'secondary' : 'ghost'}
              size="sm"
              className="gap-1.5"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Feed</span>
            </Button>
          </Link>

          <Link href={`/profile/${userId}`}>
            <Button
              variant={isProfileActive ? 'secondary' : 'ghost'}
              size="sm"
              className="gap-1.5 px-2.5 sm:px-3"
            >
              <UserRound className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </Button>
          </Link>

          <Link href={`/profile/${userId}`} className="hidden sm:block">
            <Avatar className="h-9 w-9 cursor-pointer transition-transform duration-200 hover:scale-[1.03]">
              <AvatarImage src={avatarUrl || ''} />
              <AvatarFallback className="text-xs">
                {username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleLogout}
            aria-label="Log out"
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </nav>
      </div>
    </header>
  )
}