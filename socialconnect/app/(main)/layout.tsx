import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch profile for navbar
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        username={profile?.username}
        avatarUrl={profile?.avatar_url}
        userId={user.id}
      />
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  )
}