import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateProfileSchema = z.object({
  bio: z.string().max(160, 'Bio must be under 160 characters').optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  website: z.string().url('Invalid website URL').optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
})

// GET /api/users/me — get own profile
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error

    return NextResponse.json({ profile })
  } catch (err: any) {
    console.error('Failed to fetch profile error:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch profile', details: err }, { status: 500 })
  }
}

// PATCH /api/users/me — update own profile
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ profile })
  } catch (err: any) {
    console.error('Failed to update profile error:', err)
    return NextResponse.json({ error: err.message || 'Failed to update profile', details: err }, { status: 500 })
  }
}