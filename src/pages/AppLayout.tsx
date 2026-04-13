import { useState, useCallback } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Editor } from '@/components/Editor'
import { SearchModal } from '@/components/SearchModal'
import { usePages } from '@/hooks/usePages'
import type { Page } from '@/types/database'

export function AppLayout() {
  const [activePageId, setActivePageId] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const { pages } = usePages()

  const handleNavigate = useCallback((pageId: string) => {
    setActivePageId(pageId || null)
  }, [])

  const activePage = activePageId ? pages.find(p => p.id === activePageId) : null

  return (
    <div className="flex h-screen bg-stone-900 text-stone-100 font-sans">
      <Sidebar
        activePageId={activePageId}
        onNavigate={handleNavigate}
        onOpenSearch={() => setSearchOpen(true)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {activePageId && (
          <Breadcrumbs pageId={activePageId} onNavigate={handleNavigate} />
        )}

        {!activePageId && <EmptyState />}
        {activePage?.is_section && (
          <SectionView key={activePageId} section={activePage} pages={pages} onNavigate={handleNavigate} />
        )}
        {activePageId && !activePage?.is_section && (
          <Editor key={activePageId} pageId={activePageId} onNavigate={handleNavigate} />
        )}
      </main>

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  )
}

function SectionView({ section, pages, onNavigate }: { section: Page; pages: Page[]; onNavigate: (id: string) => void }) {
  const children = pages.filter(p => p.parent_id === section.id)

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-3xl">{section.icon || '📁'}</span>
          <h1 className="text-2xl font-bold text-stone-100">{section.title || 'Untitled Section'}</h1>
        </div>
        {children.length === 0 ? (
          <p className="text-stone-500 text-sm">No pages in this section yet.</p>
        ) : (
          <ul className="space-y-1">
            {children.map(page => (
              <li key={page.id}>
                <button
                  onClick={() => onNavigate(page.id)}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-stone-800 text-stone-300 hover:text-stone-100 transition-colors"
                >
                  <span className="text-base">{page.icon || (page.is_section ? '📁' : '📄')}</span>
                  <span className="text-sm">{page.title || 'Untitled'}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-stone-800 rounded-2xl mb-6">
          <span className="i-lucide-scroll-text text-4xl text-stone-600" />
        </div>
        <h2 className="text-xl font-semibold text-stone-400 mb-2">No Page Selected</h2>
        <p className="text-stone-600 text-sm max-w-xs">
          Select a page from the sidebar or create a new one to start documenting your campaign.
        </p>
      </div>
    </div>
  )
}
