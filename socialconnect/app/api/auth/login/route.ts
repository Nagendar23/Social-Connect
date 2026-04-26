import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validation'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) return null

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function resolveEmailFromUsername(username: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  // Prefer admin client when available so lookup is not blocked by RLS.
  const admin = createAdminClient()

  if (admin) {
    const { data: adminProfile } = await admin
      .from('profiles')
      .select('id, email')
      .ilike('username', username)
      .limit(1)
      .maybeSingle()

    if (adminProfile?.email) {
      return adminProfile.email as string
    }

    if (adminProfile?.id) {
      const { data: userData } = await admin.auth.admin.getUserById(adminProfile.id)
      const email = userData.user?.email || null

      if (email) {
        // Best effort backfill so future lookups work without admin fallback.
        await admin
          .from('profiles')
          .update({ email })
          .eq('id', adminProfile.id)
        return email
      }
    }
  }

  // Fallback to regular client lookup (works when table/policy allows it).
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email')
    .ilike('username', username)
    .limit(1)
    .maybeSingle()

  if (profile?.email) {
    return profile.email as string
  }

  if (!admin) {
    return null
  }

  if (profile?.id) {
    const { data: userData } = await admin.auth.admin.getUserById(profile.id)
    const email = userData.user?.email || null

    if (email) {
      // Best effort backfill so future lookups work without admin fallback.
      await admin
        .from('profiles')
        .update({ email })
        .eq('id', profile.id)
      return email
    }
  }

  // As a final fallback, scan users by metadata username.
  let page = 1
  const perPage = 200
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) break

    const users = data.users || []
    const found = users.find(
      (u) => (u.user_metadata?.username || '').toLowerCase() === username.toLowerCase()
    )

    if (found?.email) {
      // Best effort backfill by username when id was unavailable from public lookup.
      await admin
        .from('profiles')
        .update({ email: found.email })
        .ilike('username', username)
      return found.email
    }

    if (users.length < perPage) break
    page += 1
  }

  return null
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid request payload' },
        { status: 400 }
      )
    }

    const { login, password } = parsed.data
    const supabase = await createClient()

    let email = login.trim()

    // Supabase password sign-in accepts email, so resolve username -> email first.
    if (!email.includes('@')) {
      const resolvedEmail = await resolveEmailFromUsername(email, supabase)

      if (!resolvedEmail) {
        // In development, return actionable detail for username login setup.
        if (process.env.NODE_ENV !== 'production') {
          return NextResponse.json(
            {
              error: 'Invalid credentials',
              hint: 'Username could not be resolved to an email. Ensure profiles.email is populated or set SUPABASE_SERVICE_ROLE_KEY for server-side lookup.',
            },
            { status: 401 }
          )
        }

        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      }

      email = resolvedEmail
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Best effort profile email sync for future username logins.
    await supabase
      .from('profiles')
      .update({ email: data.user.email })
      .eq('id', data.user.id)

    // Fetch profile to return with response
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    return NextResponse.json({
      message: 'Login successful',
      user: profile,
      session: data.session,
    })
  } catch (err: unknown) {
    console.error('Internal server error error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}