import { useEffect, useRef, useCallback, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import Mention from '@tiptap/extension-mention'
import Image from '@tiptap/extension-image'
import { usePages } from '@/hooks/usePages'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { EditorToolbar } from '@/components/EditorToolbar'
import { pageReferenceSuggestion } from '@/lib/pageReferenceSuggestion'
import { StatBlock } from '@/lib/statBlockExtension'

interface EditorProps {
  pageId: string
  onNavigate: (pageId: string) => void
}

const AUTOSAVE_INTERVAL_MS = 30_000

type SaveState = 'saved' | 'unsaved' | 'saving'

export function Editor({ pageId, onNavigate }: EditorProps) {
  const { pages, updatePage } = usePages()
  const { user } = useAuth()
  const page = pages.find(p => p.id === pageId)
  const pendingContentRef = useRef<Record<string, unknown> | null>(null)
  const updatePageRef = useRef(updatePage)
  useEffect(() => { updatePageRef.current = updatePage }, [updatePage])

  const [saveState, setSaveState] = useState<SaveState>('saved')

  // Always-fresh save function via ref so effects don't go stale
  const saveRef = useRef<() => void>(() => {})
  saveRef.current = () => {
    if (!pendingContentRef.current) return
    setSaveState('saving')
    updatePageRef.current(pageId, { content: pendingContentRef.current })
    pendingContentRef.current = null
    setTimeout(() => setSaveState('saved'), 800)
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Highlight,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: 'Start writing... use @ to reference pages',
      }),
      Mention.extend({ name: 'pageMention' }).configure({
        HTMLAttributes: { class: 'page-mention' },
        suggestion: pageReferenceSuggestion,
        renderLabel({ node }) {
          return node.attrs.label ?? node.attrs.id
        },
      }),
      Image.configure({
        HTMLAttributes: { class: 'editor-image' },
      }),
      StatBlock,
    ],
    content: page?.content && Object.keys(page.content).length > 0
      ? page.content
      : '<p></p>',
    onUpdate: ({ editor: ed }) => {
      pendingContentRef.current = ed.getJSON() as Record<string, unknown>
      setSaveState('unsaved')
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-stone max-w-none focus:outline-none min-h-[calc(100vh-160px)]',
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved || !event.dataTransfer?.files?.length) return false
        const file = event.dataTransfer.files[0]
        if (!file || !file.type.startsWith('image/')) return false

        event.preventDefault()
        const dropPos = view.posAtCoords({ left: event.clientX, top: event.clientY })
        uploadImage(file, user?.id).then(src => {
          if (!src) return
          const { schema } = view.state
          const node = schema.nodes.image?.create({ src })
          if (node && dropPos) {
            view.dispatch(view.state.tr.insert(dropPos.pos, node))
          }
        })
        return true
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items
        if (!items) return false
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            event.preventDefault()
            const file = item.getAsFile()
            if (!file) return false
            uploadImage(file, user?.id).then(src => {
              if (!src) return
              const { schema } = view.state
              const node = schema.nodes.image?.create({ src })
              if (node) {
                view.dispatch(view.state.tr.replaceSelectionWith(node))
              }
            })
            return true
          }
        }
        return false
      },
    },
  })

  // Navigate on @mention click
  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom
    const handleClick = (e: MouseEvent) => {
      const mention = (e.target as Element).closest('[data-type="pageMention"]')
      if (!mention) return
      const targetId = mention.getAttribute('data-id')
      if (!targetId) return
      saveRef.current()
      onNavigate(targetId)
    }
    dom.addEventListener('click', handleClick)
    return () => dom.removeEventListener('click', handleClick)
  }, [editor, onNavigate])

  // Autosave + flush on unmount/tab close
  useEffect(() => {
    const interval = setInterval(() => saveRef.current(), AUTOSAVE_INTERVAL_MS)
    const beforeUnload = () => saveRef.current()
    window.addEventListener('beforeunload', beforeUnload)
    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', beforeUnload)
      saveRef.current()
    }
  }, [pageId])

  // Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        saveRef.current()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Sync editor content when page changes
  useEffect(() => {
    if (!editor || !page) return
    const currentContent = JSON.stringify(editor.getJSON())
    const newContent = JSON.stringify(page.content)
    if (currentContent !== newContent && Object.keys(page.content).length > 0) {
      editor.commands.setContent(page.content)
    }
  }, [pageId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageUpload = useCallback(() => {
    if (!editor) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const src = await uploadImage(file, user?.id)
      if (src) {
        editor.chain().focus().setImage({ src }).run()
      }
    }
    input.click()
  }, [editor, user?.id])

  const handleInsertStatBlock = useCallback(() => {
    if (!editor) return
    editor.chain().focus().insertStatBlock().run()
  }, [editor])

  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center text-stone-500">
        <div className="text-center">
          <span className="i-lucide-file-text text-4xl mb-4 block opacity-30" />
          <p>Select a page from the sidebar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-8 py-6">
        {editor && (
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <EditorToolbar
                editor={editor}
                onImageUpload={handleImageUpload}
                onInsertStatBlock={handleInsertStatBlock}
              />
            </div>
            <SaveButton state={saveState} onSave={() => saveRef.current()} />
          </div>
        )}
        <EditorContent editor={editor} className="mt-4" />
      </div>
    </div>
  )
}

function SaveButton({ state, onSave }: { state: SaveState; onSave: () => void }) {
  return (
    <button
      onClick={onSave}
      disabled={state === 'saved' || state === 'saving'}
      title="Save (⌘S)"
      className={`shrink-0 mt-0.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        state === 'unsaved'
          ? 'bg-amber-600 text-stone-900 hover:bg-amber-500 cursor-pointer'
          : state === 'saving'
          ? 'bg-stone-700 text-stone-400 cursor-not-allowed'
          : 'bg-transparent text-stone-600 cursor-default'
      }`}
    >
      {state === 'saving' && <span className="i-lucide-loader-2 animate-spin text-xs" />}
      {state === 'saved' && <span className="i-lucide-check text-xs" />}
      {state === 'unsaved' && <span className="i-lucide-save text-xs" />}
      {state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : 'Save'}
    </button>
  )
}

async function uploadImage(file: File, userId: string | undefined): Promise<string | null> {
  if (!userId) return null
  const ext = file.name.split('.').pop() ?? 'png'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('page-images').upload(path, file)
  if (error) return null
  const { data } = supabase.storage.from('page-images').getPublicUrl(path)
  return data.publicUrl
}
