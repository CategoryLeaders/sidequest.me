'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import PhotoUpload from './PhotoUpload'
import { type SiteTag, DEFAULT_SITE_TAGS } from '@/lib/tags'

type Props = {
  profileUserId: string
}

/**
 * Shows the photo upload form only if the current viewer is the profile owner.
 * Fetches the owner's site_tags so the upload form can show them as toggles.
 * [SQ.S-W-2603-0055]
 */
export default function PhotowallOwnerUpload({ profileUserId }: Props) {
  const [isOwner, setIsOwner] = useState(false)
  const [checked, setChecked] = useState(false)
  const [siteTags, setSiteTags] = useState<SiteTag[]>([])

  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const owner = user?.id === profileUserId
      setIsOwner(owner)

      if (owner) {
        // Fetch the profile to get site_tags
        const { data: profile } = await supabase
          .from('profiles')
          .select('site_tags')
          .eq('id', profileUserId)
          .single()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tags = (profile as any)?.site_tags as SiteTag[] | null
        setSiteTags(tags?.filter((t) => t?.label?.trim()) ?? DEFAULT_SITE_TAGS)
      }

      setChecked(true)
    }
    check()
  }, [profileUserId])

  if (!checked || !isOwner) return null

  return (
    <PhotoUpload
      siteTags={siteTags}
      onUploaded={() => {
        // Reload page to show new photos
        window.location.reload()
      }}
    />
  )
}
