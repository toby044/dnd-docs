import { usePages } from '@/hooks/usePages'

interface BreadcrumbsProps {
  pageId: string
  onNavigate: (pageId: string) => void
}

export function Breadcrumbs({ pageId, onNavigate }: BreadcrumbsProps) {
  const { getAncestors, pages } = usePages()
  const ancestors = getAncestors(pageId)
  const currentPage = pages.find(p => p.id === pageId)

  if (!currentPage) return null

  const crumbs = [...ancestors, currentPage]

  return (
    <nav className="flex items-center gap-1 text-sm text-stone-500 px-8 py-3 border-b border-stone-800">
      <button
        onClick={() => onNavigate('')}
        className="hover:text-stone-300 transition-colors flex items-center gap-1"
      >
        <span className="i-lucide-home text-xs" />
      </button>
      {crumbs.map((crumb, i) => (
        <span key={crumb.id} className="flex items-center gap-1">
          <span className="i-lucide-chevron-right text-xs opacity-40" />
          {i < crumbs.length - 1 ? (
            <button
              onClick={() => onNavigate(crumb.id)}
              className="hover:text-stone-300 transition-colors truncate max-w-32 flex items-center gap-1"
            >
              <span className="text-xs">{crumb.icon || '📄'}</span>
              {crumb.title || 'Untitled'}
            </button>
          ) : (
            <span className="text-stone-300 truncate max-w-48 flex items-center gap-1">
              <span className="text-xs">{crumb.icon || '📄'}</span>
              {crumb.title || 'Untitled'}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
