import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// DELETE /api/posts/:post_id/comments/:comment_id
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ post_id: string; comment_id: string }> }
) {
  try {
    const { comment_id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership before deleting
    const { data: comment } = await supabase
      .from('comments')
      .select('author_id')
      .eq('id', comment_id)
      .single()

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if (comment.author_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', comment_id)

    if (error) throw error

    return NextResponse.json({ message: 'Comment deleted' })
  } catch (err: any) {
    console.error('Failed to delete comment error:', err)
    return NextResponse.json({ error: err.message || 'Failed to delete comment', details: err }, { status: 500 })
  }
}