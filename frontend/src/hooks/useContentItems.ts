import { useEffect, useState } from 'react'
import { fetchContentItems, StrapiError } from '../lib/strapi'
import type { ContentCategory, ContentItem } from '../types/models'

interface UseContentItemsResult {
  items: ContentItem[]
  loading: boolean
  error: string | null
  cmsUnavailable: boolean
}

// Fetches the reusable content engine's items for one or more categories.
// Fails soft: if Strapi is unreachable (e.g. not running locally), the UI
// shows an explicit "content service unavailable" state instead of crashing
// (NFR6 robustness) rather than an empty list that looks like "no content".
export function useContentItems(category?: ContentCategory): UseContentItemsResult {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cmsUnavailable, setCmsUnavailable] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setCmsUnavailable(false)

    fetchContentItems(category ? { category } : undefined)
      .then((result) => {
        if (!cancelled) setItems(result)
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof StrapiError || err instanceof TypeError) {
          setCmsUnavailable(true)
        } else {
          setError('Something went wrong loading content. Please try again.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [category])

  return { items, loading, error, cmsUnavailable }
}
