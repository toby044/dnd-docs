import { useState } from 'react'
import { usePages } from '@/hooks/usePages'

interface TrashPanelProps {
  open: boolean
  onClose: () => void
}

export function TrashPanel({ open, onClose }: TrashPanelProps) {
  const { trashedPages, restorePage, permanentDeletePage, emptyTrash } = usePages()
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false)

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-stone-800 border border-stone-600 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-700">
          <div className="flex items-center gap-2">
            <span className="i-lucide-trash-2 text-stone-400" />
            <h3 className="text-sm font-semibold text-stone-200">Trash</h3>
            <span className="text-xs text-stone-500">({trashedPages.length})</span>
          </div>
          <div className="flex items-center gap-2">
            {trashedPages.length > 0 && (
              <button
                onClick={() => setConfirmEmptyTrash(true)}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Empty trash
              </button>
            )}
            <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded hover:bg-stone-700 text-stone-400">
              <span className="i-lucide-x text-sm" />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="max-h-72 overflow-y-auto">
          {trashedPages.length === 0 ? (
            <div className="px-4 py-8 text-center text-stone-500 text-sm">
              Trash is empty
            </div>
          ) : (
            trashedPages.map(page => (
              <div
                key={page.id}
                className="flex items-center justify-between px-4 py-2 hover:bg-stone-700/30 group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm shrink-0">{page.icon || '📄'}</span>
                  <span className="text-sm text-stone-300 truncate">{page.title || 'Untitled'}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => restorePage(page.id)}
                    className="px-2 py-1 text-xs text-indigo-400 hover:bg-indigo-600/20 rounded transition-colors"
                    title="Restore"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => permanentDeletePage(page.id)}
                    className="px-2 py-1 text-xs text-red-400 hover:bg-red-600/20 rounded transition-colors"
                    title="Delete permanently"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Confirm empty trash */}
        {confirmEmptyTrash && (
          <div className="px-4 py-3 border-t border-stone-700 bg-red-900/10">
            <p className="text-sm text-stone-300 mb-3">Permanently delete all {trashedPages.length} items? This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmEmptyTrash(false)} className="btn-ghost text-xs">Cancel</button>
              <button
                onClick={() => { emptyTrash(); setConfirmEmptyTrash(false) }}
                className="btn-danger text-xs"
              >
                Empty Trash
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
