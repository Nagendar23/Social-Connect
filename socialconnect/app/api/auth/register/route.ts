import { createClient } from '@/lib/supabase/server'
import { registerSchema } from '@/lib/validation'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, username, password, first_name, last_name } = parsed.data
    const supabase = await createClient()

    // Check if username is already taken
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 400 }
      )
    }

    // Sign up with Supabase Auth
    // The metadata is passed to our trigger → creates the profile row automatically
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, first_name, last_name },
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Attempt to manually create profile in case the Supabase database trigger is missing or failing
    if (data?.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email,
          username,
          first_name,
          last_name,
        }, { onConflict: 'id' })
      
      // We ignore 23505 (unique violation) because if the trigger worked, it's already there
      if (profileError && profileError.code !== '23505') {
        console.error('Failed to auto-create profile:', profileError)
      }
    }

    return NextResponse.json(
      { message: 'Registration successful', user: data.user },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('Internal server error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error', details: err }, { status: 500 })
  }
}