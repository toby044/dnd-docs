import { useEffect } from 'react'

interface DeleteConfirmProps {
  title: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirm({ title, onConfirm, onCancel }: DeleteConfirmProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onCancel}>
      <div
        className="bg-stone-800 border border-stone-600 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-stone-100 mb-2">Delete Page</h3>
        <p className="text-stone-400 text-sm mb-6">
          Are you sure you want to delete <strong className="text-stone-200">"{title || 'Untitled'}"</strong>?
          This will also delete all child pages. This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-ghost text-sm">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-danger text-sm">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
