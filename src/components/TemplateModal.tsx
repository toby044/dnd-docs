import { useEffect } from 'react'
import { TEMPLATES, type Template } from '@/lib/templates'

interface TemplateModalProps {
  onSelect: (template: Template | null) => void
  onClose: () => void
}

export function TemplateModal({ onSelect, onClose }: TemplateModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-stone-800 border border-stone-600 rounded-xl shadow-2xl w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-700">
          <h2 className="text-base font-semibold text-stone-100">New page from template</h2>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-300 transition-colors"
          >
            <span className="i-lucide-x text-sm" />
          </button>
        </div>

        <div className="p-4 grid grid-cols-2 gap-2">
          {/* Blank option */}
          <button
            onClick={() => onSelect(null)}
            className="flex items-center gap-3 p-3 rounded-lg border border-stone-700 hover:border-stone-500 hover:bg-stone-700/50 transition-all text-left group"
          >
            <span className="text-xl">📄</span>
            <div>
              <div className="text-sm font-medium text-stone-200 group-hover:text-stone-100">Blank page</div>
              <div className="text-xs text-stone-500">Start from scratch</div>
            </div>
          </button>

          {TEMPLATES.map(template => (
            <button
              key={template.id}
              onClick={() => onSelect(template)}
              className="flex items-center gap-3 p-3 rounded-lg border border-stone-700 hover:border-amber-600/60 hover:bg-stone-700/50 transition-all text-left group"
            >
              <span className="text-xl">{template.icon}</span>
              <div>
                <div className="text-sm font-medium text-stone-200 group-hover:text-stone-100">{template.name}</div>
                <div className="text-xs text-stone-500">{template.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
