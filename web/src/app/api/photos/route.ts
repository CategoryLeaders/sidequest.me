import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/photos — upload photo(s) and create a photowall post.
 *
 * Expects multipart/form-data with:
 *   - files: one or more image files
 *   - caption (optional): text caption
 *   - tags (optional): comma-separated tags
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const caption = formData.get('caption') as string | null
    const tagsRaw = formData.get('tags') as string | null
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : []

    // Collect all file entries
    const files: File[] = []
    for (const [key, value] of formData.entries()) {
      if (key === 'files' && value instanceof File) {
        files.push(value)
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(', ')}` },
          { status: 400 }
        )
      }
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large. Max 10MB per file.' }, { status: 400 })
      }
    }

    // Upload each file to Supabase Storage
    const imageUrls: string[] = []
    for (const file of files) {
      const ext = file.name.split('.').pop() || 'jpg'
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
      }

      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName)

      imageUrls.push(urlData.publicUrl)
    }

    // Insert photo record
    // Cast needed — postgrest-js 2.99 + TS 5.9 infers .insert() data as never
    const { data: photo, error: insertError } = await (supabase
      .from('photos') as ReturnType<typeof supabase.from>)
      .insert({
        user_id: user.id,
        caption: caption || null,
        image_urls: imageUrls,
        tags,
      } as Record<string, unknown>)
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: `Database error: ${insertError.message}` }, { status: 500 })
    }

    return NextResponse.json({ photo }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/photos — list photos for a user.
 * Query params: user_id (required), limit (optional, default 50), offset (optional)
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const userId = searchParams.get('user_id')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')
  const tag = searchParams.get('tag') // optional tag filter

  if (!userId) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('photos')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (tag) {
    // Filter to photos whose tags array contains this value
    query = query.contains('tags', [tag])
  }

  const { data: photos, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ photos, total: count })
}

/**
 * PATCH /api/photos — update caption and/or tags for a DB photo.
 * Body: { id: string, caption?: string | null, tags?: string[] }
 * Requires auth; user must own the photo. [SQ.S-W-2603-0054]
 */
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { id?: string; caption?: string | null; tags?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { id: photoId, caption, tags } = body

  if (!photoId) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  // Verify ownership before updating
  const { data: photo, error: fetchError } = await (supabase
    .from('photos') as ReturnType<typeof supabase.from>)
    .select('id, user_id')
    .eq('id', photoId)
    .single() as { data: { id: string; user_id: string } | null; error: unknown }

  if (fetchError || !photo) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
  }

  if (photo.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (caption !== undefined) updates.caption = caption || null
  if (tags !== undefined) updates.tags = tags

  const { data: updated, error: updateError } = await (supabase
    .from('photos') as ReturnType<typeof supabase.from>)
    .update(updates)
    .eq('id', photoId)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ photo: updated })
}

/**
 * DELETE /api/photos — delete a photo by ID.
 * Query params: id (required) — the photo UUID
 * Requires auth; user must own the photo.
 * Deletes the DB record and all associated files from Supabase Storage. [SQ.S-W-2603-0053]
 */
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const photoId = searchParams.get('id')

  if (!photoId) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  // Fetch the photo to verify ownership and get storage paths
  const { data: photo, error: fetchError } = await (supabase
    .from('photos') as ReturnType<typeof supabase.from>)
    .select('id, user_id, image_urls')
    .eq('id', photoId)
    .single() as { data: { id: string; user_id: string; image_urls: string[] } | null; error: unknown }

  if (fetchError || !photo) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
  }

  if (photo.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Extract storage paths from the public URLs (everything after /object/public/photos/)
  const storagePaths: string[] = photo.image_urls
    .map((url: string) => {
      const match = url.match(/\/object\/public\/photos\/(.+)$/)
      return match ? match[1] : null
    })
    .filter((p): p is string => p !== null)

  // Delete files from storage (best effort — don't fail if storage delete errors)
  if (storagePaths.length > 0) {
    await supabase.storage.from('photos').remove(storagePaths)
  }

  // Delete the DB record (RLS enforces ownership)
  const { error: deleteError } = await supabase
    .from('photos')
    .delete()
    .eq('id', photoId)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
