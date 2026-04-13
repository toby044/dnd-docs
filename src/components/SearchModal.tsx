import { useState, useEffect, useRef, useCallback } from 'react'
import { usePages } from '@/hooks/usePages'

interface SearchModalProps {
  open: boolean
  onClose: () => void
  onNavigate: (pageId: string) => void
}

export function SearchModal({ open, onClose, onNavigate }: SearchModalProps) {
  const { pages } = usePages()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = query.trim()
    ? pages.filter(p =>
        p.title.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 12)
    : pages.slice(0, 12)

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleSelect = useCallback((pageId: string) => {
    onNavigate(pageId)
    onClose()
  }, [onNavigate, onClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => (i - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = results[selectedIndex]
      if (item) handleSelect(item.id)
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [results, selectedIndex, handleSelect, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center pt-[20vh] z-50" onClick={onClose}>
      <div
        className="bg-stone-800 border border-stone-600 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-700">
          <span className="i-lucide-search text-stone-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages..."
            className="flex-1 bg-transparent text-stone-100 placeholder-stone-500 focus:outline-none text-sm"
          />
          <kbd className="text-xs text-stone-600 bg-stone-700/50 px-1.5 py-0.5 rounded">esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-64 overflow-y-auto py-1">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-stone-500 text-sm">
              No pages found
            </div>
          ) : (
            results.map((page, i) => (
              <button
                key={page.id}
                onClick={() => handleSelect(page.id)}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors ${
                  i === selectedIndex
                    ? 'bg-amber-600/20 text-amber-300'
                    : 'text-stone-300 hover:bg-stone-700/50'
                }`}
              >
                <span className="text-base shrink-0">{page.icon || '📄'}</span>
                <span className="truncate">{page.title || 'Untitled'}</span>
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-stone-700 flex items-center gap-4 text-xs text-stone-600">
          <span><kbd className="bg-stone-700/50 px-1 rounded">↑↓</kbd> navigate</span>
          <span><kbd className="bg-stone-700/50 px-1 rounded">↵</kbd> open</span>
        </div>
      </div>
    </div>
  )
}
