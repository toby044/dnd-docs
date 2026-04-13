import { useEffect, useRef, useCallback } from 'react'
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

interface EditorProps {
  pageId: string
  onNavigate: (pageId: string) => void
}

const AUTOSAVE_INTERVAL_MS = 30_000

export function Editor({ pageId, onNavigate }: EditorProps) {
  const { pages, updatePage } = usePages()
  const { user } = useAuth()
  const page = pages.find(p => p.id === pageId)
  const pendingContentRef = useRef<Record<string, unknown> | null>(null)
  // Always hold the latest updatePage without adding it as an interval dep
  const updatePageRef = useRef(updatePage)
  useEffect(() => { updatePageRef.current = updatePage }, [updatePage])

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
    ],
    content: page?.content && Object.keys(page.content).length > 0
      ? page.content
      : '<p></p>',
    onUpdate: ({ editor: ed }) => {
      pendingContentRef.current = ed.getJSON() as Record<string, unknown>
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

  // Navigate on @mention click — flush current page first
  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom
    const handleClick = (e: MouseEvent) => {
      const mention = (e.target as Element).closest('[data-type="pageMention"]')
      if (!mention) return
      const targetId = mention.getAttribute('data-id')
      if (!targetId) return
      if (pendingContentRef.current) {
        updatePageRef.current(pageId, { content: pendingContentRef.current })
        pendingContentRef.current = null
      }
      onNavigate(targetId)
    }
    dom.addEventListener('click', handleClick)
    return () => dom.removeEventListener('click', handleClick)
  }, [editor, pageId, onNavigate])

  // 30s autosave — flush pending content periodically, on page-switch, and on tab close
  useEffect(() => {
    const flush = () => {
      if (pendingContentRef.current) {
        updatePageRef.current(pageId, { content: pendingContentRef.current })
        pendingContentRef.current = null
      }
    }

    const interval = setInterval(flush, AUTOSAVE_INTERVAL_MS)
    window.addEventListener('beforeunload', flush)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', flush)
      flush() // save on page navigation (Editor unmounts due to key={pageId})
    }
  }, [pageId])

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
        {editor && <EditorToolbar editor={editor} onImageUpload={handleImageUpload} />}
        <EditorContent editor={editor} className="mt-4" />
      </div>
    </div>
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
