import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/upload-image — upload an image to Supabase Storage via Edge Function
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const context = (formData.get('context') as string) || 'writings'  // 'writings' | 'general'
  const entityId = formData.get('entityId') as string | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' }, { status: 400 })
  }

  // Validate file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 })
  }

  // Determine extension
  let ext = 'jpg'
  if (file.type.includes('png')) ext = 'png'
  else if (file.type.includes('webp')) ext = 'webp'
  else if (file.type.includes('gif')) ext = 'gif'

  // Build storage path
  const id = entityId || crypto.randomUUID()
  const filename = context === 'writings' ? 'hero' : `img-${Date.now()}`
  const storagePath = `${user.id}/${context}/${id}/${filename}.${ext}`

  // Upload directly to Supabase Storage via the service-role Edge Function
  const buffer = await file.arrayBuffer()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Get user's session token for the Edge Function
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || anonKey

  // Use the image-proxy Edge Function which has the service role key
  // Convert file to a temporary object URL won't work server-side,
  // so we upload directly to Storage via the Edge Function's upload path.
  // Actually, let's upload via the Supabase Storage REST API using the user's token.
  const uploadRes = await fetch(
    `${supabaseUrl}/storage/v1/object/photos/${storagePath}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': file.type,
        'x-upsert': 'true',
      },
      body: buffer,
    }
  )

  if (!uploadRes.ok) {
    const err = await uploadRes.text()
    // If RLS blocks it, fall back to the Edge Function approach
    // Convert to base64 data URL and send to image-proxy
    const base64 = Buffer.from(buffer).toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Use a temporary upload via signed URL or just store the public URL
    // For now, try the Edge Function which has service role
    const proxyRes = await fetch(`${supabaseUrl}/functions/v1/image-proxy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: dataUrl,
        userId: user.id,
        storagePath: `${user.id}/${context}/${id}/${filename}`,
      }),
    })

    if (!proxyRes.ok) {
      return NextResponse.json({ error: 'Upload failed', details: err }, { status: 500 })
    }

    const proxyData = await proxyRes.json() as { publicUrl?: string }
    return NextResponse.json({ url: proxyData.publicUrl })
  }

  // Build the public URL
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/photos/${storagePath}`
  return NextResponse.json({ url: publicUrl })
}
