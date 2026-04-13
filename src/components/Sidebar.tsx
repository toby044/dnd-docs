import { useState, useCallback, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { usePages } from '@/hooks/usePages'
import { useAuth } from '@/hooks/useAuth'
import { SidebarItem } from '@/components/SidebarItem'
import { DeleteConfirm } from '@/components/DeleteConfirm'
import { TrashPanel } from '@/components/TrashPanel'
import type { PageTreeNode } from '@/types/database'

interface SidebarProps {
  activePageId: string | null
  onNavigate: (pageId: string) => void
  onOpenSearch: () => void
}

export function Sidebar({ activePageId, onNavigate, onOpenSearch }: SidebarProps) {
  const { tree, loading, createPage, createSection, movePage, pages, updatePage, softDeletePage, trashedPages } = usePages()
  const { signOut } = useAuth()
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [showTrash, setShowTrash] = useState(false)
  const [showNewMenu, setShowNewMenu] = useState(false)

  const deleteTargetPage = deleteTarget ? pages.find(p => p.id === deleteTarget) : null

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey

      // Cmd+N: new page
      if (isMod && e.key === 'n') {
        e.preventDefault()
        createPage(null).then(page => {
          if (page) onNavigate(page.id)
        })
      }

      // Cmd+K: search
      if (isMod && e.key === 'k') {
        e.preventDefault()
        onOpenSearch()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [createPage, onNavigate, onOpenSearch])

  const handleCreateRootPage = useCallback(async () => {
    const page = await createPage(null)
    if (page) onNavigate(page.id)
  }, [createPage, onNavigate])

  const handleCreateSection = useCallback(async () => {
    const section = await createSection()
    if (section) {
      setRenamingId(section.id)
    }
    setShowNewMenu(false)
  }, [createSection])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDraggedId(String(event.active.id))
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      setDropTargetId(null)
      return
    }

    const overId = String(over.id)
    const activeId = String(active.id)

    // Don't allow dropping on own descendants
    function isDescendant(parentId: string, childId: string): boolean {
      const children = pages.filter(p => p.parent_id === parentId)
      for (const child of children) {
        if (child.id === childId) return true
        if (isDescendant(child.id, childId)) return true
      }
      return false
    }

    if (isDescendant(activeId, overId)) {
      setDropTargetId(null)
      return
    }

    setDropTargetId(overId)
  }, [pages])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setDraggedId(null)
    setDropTargetId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)
    const overPage = pages.find(p => p.id === overId)
    if (!overPage) return

    const overRect = (over as { rect?: { current?: { translated?: DOMRect | null } } }).rect?.current?.translated
    const activeRect = (active as { rect?: { current?: { translated?: DOMRect | null } } }).rect?.current?.translated

    if (overRect && activeRect) {
      const pointerY = activeRect.top + activeRect.height / 2
      const overCenter = overRect.top + overRect.height / 2
      const threshold = overRect.height * 0.25

      if (Math.abs(pointerY - overCenter) < threshold) {
        const childCount = pages.filter(p => p.parent_id === overId).length
        await movePage(activeId, overId, childCount)
        return
      }
    }

    await movePage(activeId, overPage.parent_id, overPage.sort_order)
  }, [movePage, pages])

  const handleRename = useCallback((id: string, newTitle: string) => {
    updatePage(id, { title: newTitle })
  }, [updatePage])

  const handleIconChange = useCallback((id: string, icon: string) => {
    updatePage(id, { icon })
  }, [updatePage])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    await softDeletePage(deleteTarget)
    if (activePageId === deleteTarget) onNavigate('')
    setDeleteTarget(null)
  }, [deleteTarget, softDeletePage, activePageId, onNavigate])

  const draggedNode = draggedId ? pages.find(p => p.id === draggedId) : null
  const flatIds = flattenTree(tree)

  return (
    <>
      <aside className="w-64 h-screen bg-stone-900 border-r border-stone-700 flex flex-col shrink-0">
        {/* Header */}
        <div className="p-3 border-b border-stone-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="i-lucide-book-open text-indigo-400 text-lg" />
            <h1 className="text-lg font-semibold text-stone-100">DNDocs</h1>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowNewMenu(!showNewMenu)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition-colors"
              title="New page or section"
            >
              <span className="i-lucide-plus text-sm" />
            </button>
            {showNewMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-stone-800 border border-stone-600 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                <button
                  onClick={() => { setShowNewMenu(false); handleCreateRootPage() }}
                  className="w-full text-left px-3 py-1.5 text-sm text-stone-300 hover:bg-stone-700 flex items-center gap-2"
                >
                  <span className="i-lucide-file-plus text-xs" />
                  New Page
                  <kbd className="ml-auto text-xs bg-stone-700 px-1 py-0.5 rounded border border-stone-600 text-stone-500">⌘N</kbd>
                </button>
                <button
                  onClick={handleCreateSection}
                  className="w-full text-left px-3 py-1.5 text-sm text-stone-300 hover:bg-stone-700 flex items-center gap-2"
                >
                  <span className="i-lucide-folder-plus text-xs" />
                  New Section
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="mx-2 mt-2 space-y-0.5">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-stone-500 hover:bg-stone-800 hover:text-stone-300 transition-colors"
          >
            <span className="i-lucide-search text-xs" />
            <span className="flex-1 text-left">Search</span>
            <kbd className="text-xs bg-stone-800 px-1.5 py-0.5 rounded border border-stone-700">⌘K</kbd>
          </button>
        </div>

        {/* Tree */}
        <nav className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <SidebarSkeleton />
          ) : (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={flatIds} strategy={verticalListSortingStrategy}>
                  {tree.map(node => (
                    <TreeNode
                      key={node.id}
                      node={node}
                      depth={0}
                      activePageId={activePageId}
                      onNavigate={onNavigate}
                      renamingId={renamingId}
                      onStartRename={setRenamingId}
                      onCancelRename={() => setRenamingId(null)}
                      onRename={handleRename}
                      onDelete={setDeleteTarget}
                      onIconChange={handleIconChange}
                      dropTargetId={dropTargetId}
                    />
                  ))}
                </SortableContext>
                <DragOverlay>
                  {draggedNode ? (
                    <div className="px-3 py-1.5 bg-stone-800 border border-stone-600 rounded-md text-sm text-stone-200 shadow-lg flex items-center gap-2">
                      <span className="text-sm">{draggedNode.icon || '📄'}</span>
                      {draggedNode.title || 'Untitled'}
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>

              {tree.length === 0 && (
                <p className="text-stone-500 text-sm text-center mt-8 px-4">
                  No pages yet. Create one to get started.
                </p>
              )}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-stone-700 flex items-center justify-between">
          <button
            onClick={() => setShowTrash(true)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-stone-500 hover:bg-stone-800 hover:text-stone-300 transition-colors"
          >
            <span className="i-lucide-trash-2 text-xs" />
            Trash
            {trashedPages.length > 0 && (
              <span className="bg-stone-700 text-stone-400 px-1.5 py-0.5 rounded-full text-xs leading-none">
                {trashedPages.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowSignOutConfirm(true)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-stone-500 hover:bg-stone-800 hover:text-stone-300 transition-colors"
          >
            <span className="i-lucide-log-out text-xs" />
            Sign Out
          </button>
        </div>
      </aside>

      {deleteTargetPage && (
        <DeleteConfirm
          title={deleteTargetPage.title}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <TrashPanel open={showTrash} onClose={() => setShowTrash(false)} />

      {showSignOutConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowSignOutConfirm(false)}>
          <div
            className="bg-stone-800 border border-stone-600 rounded-xl p-6 max-w-xs w-full mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-stone-100 mb-2">Sign Out</h3>
            <p className="text-stone-400 text-sm mb-6">Are you sure you want to sign out?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowSignOutConfirm(false)} className="btn-ghost text-sm">Cancel</button>
              <button onClick={() => { setShowSignOutConfirm(false); signOut() }} className="btn-primary text-sm">Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function TreeNode({
  node,
  depth,
  activePageId,
  onNavigate,
  renamingId,
  onStartRename,
  onCancelRename,
  onRename,
  onDelete,
  onIconChange,
  dropTargetId,
}: {
  node: PageTreeNode
  depth: number
  activePageId: string | null
  onNavigate: (id: string) => void
  renamingId: string | null
  onStartRename: (id: string) => void
  onCancelRename: () => void
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void
  onIconChange: (id: string, icon: string) => void
  dropTargetId: string | null
}) {
  const { createPage } = usePages()
  const [expanded, setExpanded] = useState(true)

  const handleAddChild = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    const page = await createPage(node.id)
    if (page) {
      setExpanded(true)
      onNavigate(page.id)
    }
  }, [createPage, node.id, onNavigate])

  // Auto-expand when something is dragged over this node
  useEffect(() => {
    if (dropTargetId === node.id && node.children.length > 0) {
      setExpanded(true)
    }
  }, [dropTargetId, node.id, node.children.length])

  const isActive = activePageId === node.id
  const hasChildren = node.children.length > 0
  const isDropTarget = dropTargetId === node.id
  const isSection = node.is_section

  return (
    <div>
      <SidebarItem
        id={node.id}
        depth={depth}
        isActive={isActive}
        hasChildren={hasChildren}
        expanded={expanded}
        title={node.title}
        icon={node.icon}
        isDropTarget={isDropTarget}
        isSection={isSection}
        onToggle={() => setExpanded(!expanded)}
        onClick={() => {
          if (isSection) {
            setExpanded(!expanded)
          }
          onNavigate(node.id)
        }}
        onAddChild={handleAddChild}
        onRename={(newTitle) => onRename(node.id, newTitle)}
        onDelete={() => onDelete(node.id)}
        onIconChange={(icon) => onIconChange(node.id, icon)}
        isRenaming={renamingId === node.id}
        onStartRename={() => onStartRename(node.id)}
        onCancelRename={onCancelRename}
      />
      {expanded && hasChildren && (
        <div>
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              activePageId={activePageId}
              onNavigate={onNavigate}
              renamingId={renamingId}
              onStartRename={onStartRename}
              onCancelRename={onCancelRename}
              onRename={onRename}
              onDelete={onDelete}
              onIconChange={onIconChange}
              dropTargetId={dropTargetId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SidebarSkeleton() {
  const items = [
    { width: 'w-2/3', depth: 0 },
    { width: 'w-1/2', depth: 1 },
    { width: 'w-3/5', depth: 1 },
    { width: 'w-3/4', depth: 0 },
    { width: 'w-2/5', depth: 0 },
    { width: 'w-1/2', depth: 1 },
  ]
  return (
    <div className="animate-pulse space-y-0.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-md" style={{ paddingLeft: `${0.5 + item.depth * 1}rem` }}>
          <div className="w-3.5 h-3.5 rounded bg-stone-700 shrink-0" />
          <div className={`h-3 rounded bg-stone-700 ${item.width}`} />
        </div>
      ))}
    </div>
  )
}

function flattenTree(nodes: PageTreeNode[]): string[] {
  const result: string[] = []
  for (const node of nodes) {
    result.push(node.id)
    result.push(...flattenTree(node.children))
  }
  return result
}
