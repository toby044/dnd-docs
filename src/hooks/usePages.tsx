import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { setAvailablePages } from '@/lib/pageReferenceSuggestion'
import type { Page, PageTreeNode } from '@/types/database'

interface PagesContextValue {
  /** All non-deleted pages */
  pages: Page[]
  /** Tree of non-deleted pages */
  tree: PageTreeNode[]
  /** Soft-deleted pages */
  trashedPages: Page[]
  loading: boolean
  createPage: (parentId?: string | null) => Promise<Page | null>
  createSection: (title?: string) => Promise<Page | null>
  updatePage: (id: string, updates: { title?: string; icon?: string; content?: Record<string, unknown>; is_section?: boolean }) => Promise<void>
  softDeletePage: (id: string) => Promise<void>
  restorePage: (id: string) => Promise<void>
  permanentDeletePage: (id: string) => Promise<void>
  emptyTrash: () => Promise<void>
  movePage: (id: string, newParentId: string | null, newSortOrder: number) => Promise<void>
  getAncestors: (pageId: string) => Page[]
}

const PagesContext = createContext<PagesContextValue | null>(null)

function buildTree(pages: Page[], parentId: string | null = null): PageTreeNode[] {
  return pages
    .filter(p => p.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(p => ({
      ...p,
      children: buildTree(pages, p.id),
    }))
}

export function PagesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [allPages, setAllPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)

useEffect(() => {
    let mounted = true
    if (!user?.id) {
      setAllPages([])
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('pages')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!mounted) return
        if (!error && data) setAllPages(data)
        setLoading(false)
      })
    return () => { mounted = false }
  }, [user?.id])

  // Realtime subscription — update local state from payload instead of re-fetching
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('pages-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pages', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const incoming = payload.new as Page
          setAllPages(prev => prev.some(p => p.id === incoming.id) ? prev : [...prev, incoming])
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pages', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const incoming = payload.new as Page
          setAllPages(prev => prev.map(p => p.id === incoming.id ? incoming : p))
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'pages', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const removed = payload.old as Pick<Page, 'id'>
          setAllPages(prev => prev.filter(p => p.id !== removed.id))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  // Split into active and trashed
  const pages = useMemo(() => allPages.filter(p => !p.deleted_at), [allPages])
  const trashedPages = useMemo(() => allPages.filter(p => p.deleted_at), [allPages])

  const tree = useMemo(() => buildTree(pages), [pages])

  // Keep page reference suggestion list in sync
  useEffect(() => {
    setAvailablePages(pages.map(p => ({ id: p.id, title: p.title })))
  }, [pages])

  const createPage = useCallback(async (parentId: string | null = null): Promise<Page | null> => {
    if (!user) return null
    const { data, error } = await supabase
      .from('pages')
      .insert({ user_id: user.id, parent_id: parentId, title: 'Untitled' })
      .select()
      .single()

    if (error || !data) return null
    setAllPages(prev => [...prev, data])
    return data
  }, [user])

  const createSection = useCallback(async (title: string = 'New Section'): Promise<Page | null> => {
    if (!user) return null
    const { data, error } = await supabase
      .from('pages')
      .insert({ user_id: user.id, parent_id: null, title, is_section: true, icon: '📁' })
      .select()
      .single()

    if (error || !data) return null
    setAllPages(prev => [...prev, data])
    return data
  }, [user])

  const updatePage = useCallback(async (id: string, updates: { title?: string; icon?: string; content?: Record<string, unknown>; is_section?: boolean }) => {
    setAllPages(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    await supabase.from('pages').update(updates).eq('id', id)
  }, [])

  const softDeletePage = useCallback(async (id: string) => {
    const now = new Date().toISOString()
    // Collect page + all descendants
    const idsToTrash = new Set<string>()
    function collectIds(pageId: string) {
      idsToTrash.add(pageId)
      allPages.filter(p => p.parent_id === pageId && !p.deleted_at).forEach(p => collectIds(p.id))
    }
    collectIds(id)

    // Optimistic
    setAllPages(prev => prev.map(p => idsToTrash.has(p.id) ? { ...p, deleted_at: now } : p))
    // Persist
    for (const trashId of idsToTrash) {
      await supabase.from('pages').update({ deleted_at: now }).eq('id', trashId)
    }
  }, [allPages])

  const restorePage = useCallback(async (id: string) => {
    const page = allPages.find(p => p.id === id)
    if (!page) return

    // Also restore descendants
    const idsToRestore = new Set<string>()
    function collectIds(pageId: string) {
      idsToRestore.add(pageId)
      allPages.filter(p => p.parent_id === pageId && p.deleted_at).forEach(p => collectIds(p.id))
    }
    collectIds(id)

    // If the parent is also trashed, move to root
    const parentTrashed = page.parent_id ? allPages.find(p => p.id === page.parent_id)?.deleted_at : false
    const newParentId = parentTrashed ? null : page.parent_id

    setAllPages(prev => prev.map(p => {
      if (p.id === id) return { ...p, deleted_at: null, parent_id: newParentId }
      if (idsToRestore.has(p.id)) return { ...p, deleted_at: null }
      return p
    }))

    await supabase.from('pages').update({ deleted_at: null, parent_id: newParentId }).eq('id', id)
    for (const restoreId of idsToRestore) {
      if (restoreId !== id) {
        await supabase.from('pages').update({ deleted_at: null }).eq('id', restoreId)
      }
    }
  }, [allPages])

  const permanentDeletePage = useCallback(async (id: string) => {
    setAllPages(prev => prev.filter(p => p.id !== id))
    await supabase.from('pages').delete().eq('id', id)
  }, [])

  const emptyTrash = useCallback(async () => {
    const trashIds = allPages.filter(p => p.deleted_at).map(p => p.id)
    setAllPages(prev => prev.filter(p => !p.deleted_at))
    for (const trashId of trashIds) {
      await supabase.from('pages').delete().eq('id', trashId)
    }
  }, [allPages])

  const movePage = useCallback(async (id: string, newParentId: string | null, newSortOrder: number) => {
    // Optimistic local update
    setAllPages(prev => {
      const updated = prev.map(p => {
        if (p.id === id) return { ...p, parent_id: newParentId, sort_order: newSortOrder }
        return p
      })
      // Reorder siblings at the destination
      const siblings = updated
        .filter(p => p.parent_id === newParentId && p.id !== id && !p.deleted_at)
        .sort((a, b) => a.sort_order - b.sort_order)
      let order = 0
      for (const sibling of siblings) {
        if (order === newSortOrder) order++
        sibling.sort_order = order
        order++
      }
      return [...updated]
    })

    // Persist
    const siblings = pages
      .filter(p => p.parent_id === newParentId && p.id !== id)
      .sort((a, b) => a.sort_order - b.sort_order)

    let order = 0
    for (const sibling of siblings) {
      if (order === newSortOrder) order++
      if (sibling.sort_order !== order) {
        await supabase.from('pages').update({ sort_order: order }).eq('id', sibling.id)
      }
      order++
    }

    await supabase.from('pages').update({
      parent_id: newParentId,
      sort_order: newSortOrder,
    }).eq('id', id)
  }, [pages])

  const getAncestors = useCallback((pageId: string): Page[] => {
    const ancestors: Page[] = []
    let current = pages.find(p => p.id === pageId)
    while (current?.parent_id) {
      const parent = pages.find(p => p.id === current!.parent_id)
      if (!parent) break
      ancestors.unshift(parent)
      current = parent
    }
    return ancestors
  }, [pages])

  return (
    <PagesContext.Provider value={{
      pages, tree, trashedPages, loading,
      createPage, createSection, updatePage, softDeletePage, restorePage, permanentDeletePage, emptyTrash,
      movePage, getAncestors,
    }}>
      {children}
    </PagesContext.Provider>
  )
}

export function usePages() {
  const ctx = useContext(PagesContext)
  if (!ctx) throw new Error('usePages must be used within PagesProvider')
  return ctx
}
