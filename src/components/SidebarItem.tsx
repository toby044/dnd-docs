import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { EmojiPicker } from '@/components/EmojiPicker'

interface SidebarItemProps {
  id: string
  depth: number
  isActive: boolean
  hasChildren: boolean
  expanded: boolean
  title: string
  icon: string
  isDropTarget: boolean
  isSection: boolean
  onToggle: () => void
  onClick: () => void
  onAddChild: (e: React.MouseEvent) => void
  onRename: (newTitle: string) => void
  onDelete: () => void
  onIconChange: (icon: string) => void
  isRenaming: boolean
  onStartRename: () => void
  onCancelRename: () => void
}

export function SidebarItem({
  id,
  depth,
  isActive,
  hasChildren,
  expanded,
  title,
  icon,
  isDropTarget,
  isSection,
  onToggle,
  onClick,
  onAddChild,
  onRename,
  onDelete,
  onIconChange,
  isRenaming,
  onStartRename,
  onCancelRename,
}: SidebarItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const [menuOpen, setMenuOpen] = useState(false)
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number } | null>(null)
  const [renameValue, setRenameValue] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${depth * 16 + 8}px`,
    opacity: isDragging ? 0.4 : 1,
  }

  // Focus input when entering rename mode
  useEffect(() => {
    if (isRenaming) {
      setRenameValue(title)
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
    }
  }, [isRenaming, title])

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const handleRenameSubmit = useCallback(() => {
    const trimmed = renameValue.trim()
    onRename(trimmed || 'Untitled')
    onCancelRename()
  }, [renameValue, onRename, onCancelRename])

  const handleRenameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleRenameSubmit()
    } else if (e.key === 'Escape') {
      onCancelRename()
    }
  }, [handleRenameSubmit, onCancelRename])

  // Sections get a distinct visual style: bold, uppercase, slightly different color
  if (isSection) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`group relative flex items-center gap-1 py-2 pr-2 rounded-md text-xs cursor-pointer transition-colors ${
          isDropTarget
            ? 'bg-indigo-600/30 ring-1 ring-indigo-500/50'
            : 'text-stone-500 hover:bg-stone-800/50 hover:text-stone-400'
        } ${depth === 0 ? 'mt-3 first:mt-0' : ''}`}
        onClick={isRenaming ? undefined : onClick}
        {...(isRenaming ? {} : { ...attributes, ...listeners })}
      >
        {/* Expand/collapse toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle() }}
          className={`w-5 h-5 flex items-center justify-center shrink-0 rounded hover:bg-stone-700 transition-transform ${
            expanded ? '' : '-rotate-90'
          }`}
        >
          <span className="i-lucide-chevron-down text-xs" />
        </button>

        {/* Section icon */}
        <span className="text-xs shrink-0">{icon || '📁'}</span>

        {/* Title or rename input */}
        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleRenameKeyDown}
            onClick={e => e.stopPropagation()}
            className="flex-1 min-w-0 bg-stone-800 border border-indigo-500 rounded px-1.5 py-0.5 text-sm text-stone-100 focus:outline-none"
          />
        ) : (
          <span className="flex-1 truncate font-semibold uppercase tracking-wider">{title || 'Untitled Section'}</span>
        )}

        {/* Action buttons */}
        {!isRenaming && (
          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onAddChild}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-stone-700"
              title="Add page to section"
            >
              <span className="i-lucide-plus text-xs" />
            </button>

            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-stone-700"
                title="More options"
              >
                <span className="i-lucide-ellipsis text-xs" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-stone-800 border border-stone-600 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpen(false)
                      onStartRename()
                    }}
                    className="w-full text-left px-3 py-1.5 text-sm text-stone-300 hover:bg-stone-700 flex items-center gap-2"
                  >
                    <span className="i-lucide-pencil text-xs" />
                    Rename
                  </button>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const rect = menuRef.current?.getBoundingClientRect()
                        if (rect) {
                          setPickerPos({ top: rect.bottom + 4, left: Math.max(4, rect.right - 224) })
                        }
                        setMenuOpen(false)
                        setEmojiPickerOpen(true)
                      }}
                      className="w-full text-left px-3 py-1.5 text-sm text-stone-300 hover:bg-stone-700 flex items-center gap-2"
                    >
                      <span className="text-xs">{icon || '📁'}</span>
                      Change icon
                    </button>
                  </div>
                  <div className="h-px bg-stone-700 my-1" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpen(false)
                      onDelete()
                    }}
                    className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-stone-700 flex items-center gap-2"
                  >
                    <span className="i-lucide-trash-2 text-xs" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Emoji picker via portal to escape overflow-y:auto clipping */}
        {emojiPickerOpen && pickerPos && createPortal(
          <div style={{ position: 'fixed', top: pickerPos.top, left: pickerPos.left, zIndex: 9999 }}>
            <EmojiPicker
              currentIcon={icon}
              onSelect={(emoji) => {
                onIconChange(emoji)
                setEmojiPickerOpen(false)
                setPickerPos(null)
              }}
              onClose={() => {
                setEmojiPickerOpen(false)
                setPickerPos(null)
              }}
            />
          </div>,
          document.body
        )}
      </div>
    )
  }

  // Regular page item
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-1 py-1.5 pr-2 rounded-md text-sm cursor-pointer transition-colors ${
        isDropTarget
          ? 'bg-indigo-600/30 ring-1 ring-indigo-500/50'
          : isActive
            ? 'bg-indigo-600/20 text-indigo-300'
            : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'
      }`}
      onClick={isRenaming ? undefined : onClick}
      {...(isRenaming ? {} : { ...attributes, ...listeners })}
    >
      {/* Expand/collapse toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle() }}
        className={`w-5 h-5 flex items-center justify-center shrink-0 rounded hover:bg-stone-700 transition-transform ${
          hasChildren ? '' : 'invisible'
        } ${expanded ? '' : '-rotate-90'}`}
      >
        <span className="i-lucide-chevron-down text-xs" />
      </button>

      {/* Page icon */}
      <span className="text-sm shrink-0">{icon || '📄'}</span>

      {/* Title or rename input */}
      {isRenaming ? (
        <input
          ref={inputRef}
          type="text"
          value={renameValue}
          onChange={e => setRenameValue(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={handleRenameKeyDown}
          onClick={e => e.stopPropagation()}
          className="flex-1 min-w-0 bg-stone-800 border border-indigo-500 rounded px-1.5 py-0.5 text-sm text-stone-100 focus:outline-none"
        />
      ) : (
        <span className="flex-1 truncate">{title || 'Untitled'}</span>
      )}

      {/* Action buttons */}
      {!isRenaming && (
        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onAddChild}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-stone-700"
            title="Add child page"
          >
            <span className="i-lucide-plus text-xs" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-stone-700"
              title="More options"
            >
              <span className="i-lucide-ellipsis text-xs" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-stone-800 border border-stone-600 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    onStartRename()
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm text-stone-300 hover:bg-stone-700 flex items-center gap-2"
                >
                  <span className="i-lucide-pencil text-xs" />
                  Rename
                </button>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const rect = menuRef.current?.getBoundingClientRect()
                      if (rect) {
                        setPickerPos({ top: rect.bottom + 4, left: Math.max(4, rect.right - 224) })
                      }
                      setMenuOpen(false)
                      setEmojiPickerOpen(true)
                    }}
                    className="w-full text-left px-3 py-1.5 text-sm text-stone-300 hover:bg-stone-700 flex items-center gap-2"
                  >
                    <span className="text-xs">{icon || '📄'}</span>
                    Change icon
                  </button>
                </div>
                <div className="h-px bg-stone-700 my-1" />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    onDelete()
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-stone-700 flex items-center gap-2"
                >
                  <span className="i-lucide-trash-2 text-xs" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emoji picker via portal to escape overflow-y:auto clipping */}
      {emojiPickerOpen && pickerPos && createPortal(
        <div style={{ position: 'fixed', top: pickerPos.top, left: pickerPos.left, zIndex: 9999 }}>
          <EmojiPicker
            currentIcon={icon}
            onSelect={(emoji) => {
              onIconChange(emoji)
              setEmojiPickerOpen(false)
              setPickerPos(null)
            }}
            onClose={() => {
              setEmojiPickerOpen(false)
              setPickerPos(null)
            }}
          />
        </div>,
        document.body
      )}
    </div>
  )
}
