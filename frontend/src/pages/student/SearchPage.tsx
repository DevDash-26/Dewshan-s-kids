import { useMemo, useState } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import { useContentItems } from '../../hooks/useContentItems'
import { CATEGORY_LABELS } from '../../lib/categoryMeta'
import { ContentCard } from '../../components/content/ContentCard'
import { PageHeader } from '../../components/ui/PageHeader'
import { Input, Select } from '../../components/ui/Primitives'
import { EmptyState, ServiceUnavailable, Spinner } from '../../components/ui/Feedback'
import type { ContentCategory } from '../../types/models'

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '')
}

export function SearchPage() {
  const { items, loading, cmsUnavailable } = useContentItems()
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState<ContentCategory | 'ALL'>('ALL')

  const filtered = useMemo(() => {
    const lowerKeyword = keyword.trim().toLowerCase()
    return items.filter((item) => {
      if (category !== 'ALL' && item.category !== category) return false
      if (!lowerKeyword) return true
      const haystack = `${item.title} ${stripHtml(item.description)} ${item.location ?? ''}`.toLowerCase()
      return haystack.includes(lowerKeyword)
    })
  }, [items, keyword, category])

  if (loading) return <Spinner label="Loading campus content…" />
  if (cmsUnavailable) return <ServiceUnavailable service="Campus content" />

  return (
    <div>
      <PageHeader title="Search & Discover" description="One place to search everything happening across campus." />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search announcements, events, societies, FAQs…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <Select className="sm:w-64" value={category} onChange={(e) => setCategory(e.target.value as ContentCategory | 'ALL')}>
          <option value="ALL">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No results" description="Try a different keyword or category." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
