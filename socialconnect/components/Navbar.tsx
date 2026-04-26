'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Home, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

type Props = {
  username?: string
  avatarUrl?: string | null
  userId?: string
}

export default function Navbar({ username, avatarUrl, userId }: Props) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/feed" className="text-base font-semibold tracking-tight text-slate-900">
          SocialConnect
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-1">
          <Link href="/feed">
            <Button variant="ghost" size="icon">
              <Home className="h-5 w-5" />
            </Button>
          </Link>



          <Link href={`/profile/${userId}`}>
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage src={avatarUrl || ''} />
              <AvatarFallback className="text-xs">
                {username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-slate-500 hover:text-slate-900"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </nav>
      </div>
    </header>
  )
}