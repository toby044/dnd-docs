import type { Editor } from '@tiptap/react'

interface EditorToolbarProps {
  editor: Editor
  onImageUpload: () => void
}

export function EditorToolbar({ editor, onImageUpload }: EditorToolbarProps) {
  const items = [
    {
      icon: 'i-lucide-bold',
      title: 'Bold',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive('bold'),
    },
    {
      icon: 'i-lucide-italic',
      title: 'Italic',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive('italic'),
    },
    {
      icon: 'i-lucide-strikethrough',
      title: 'Strikethrough',
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: () => editor.isActive('strike'),
    },
    {
      icon: 'i-lucide-highlighter',
      title: 'Highlight',
      action: () => editor.chain().focus().toggleHighlight().run(),
      isActive: () => editor.isActive('highlight'),
    },
    { type: 'divider' as const },
    {
      icon: 'i-lucide-heading-1',
      title: 'Heading 1',
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: () => editor.isActive('heading', { level: 1 }),
    },
    {
      icon: 'i-lucide-heading-2',
      title: 'Heading 2',
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editor.isActive('heading', { level: 2 }),
    },
    {
      icon: 'i-lucide-heading-3',
      title: 'Heading 3',
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: () => editor.isActive('heading', { level: 3 }),
    },
    { type: 'divider' as const },
    {
      icon: 'i-lucide-list',
      title: 'Bullet List',
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: () => editor.isActive('bulletList'),
    },
    {
      icon: 'i-lucide-list-ordered',
      title: 'Ordered List',
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: () => editor.isActive('orderedList'),
    },
    {
      icon: 'i-lucide-list-checks',
      title: 'Task List',
      action: () => editor.chain().focus().toggleTaskList().run(),
      isActive: () => editor.isActive('taskList'),
    },
    { type: 'divider' as const },
    {
      icon: 'i-lucide-quote',
      title: 'Blockquote',
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: () => editor.isActive('blockquote'),
    },
    {
      icon: 'i-lucide-code-2',
      title: 'Code Block',
      action: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: () => editor.isActive('codeBlock'),
    },
    {
      icon: 'i-lucide-minus',
      title: 'Horizontal Rule',
      action: () => editor.chain().focus().setHorizontalRule().run(),
      isActive: () => false,
    },
    { type: 'divider' as const },
    {
      icon: 'i-lucide-image',
      title: 'Image',
      action: () => onImageUpload(),
      isActive: () => false,
    },
  ]

  return (
    <div className="flex items-center gap-0.5 p-1.5 bg-stone-800/50 rounded-lg border border-stone-700 flex-wrap">
      {items.map((item, i) => {
        if ('type' in item && item.type === 'divider') {
          return <div key={i} className="w-px h-6 bg-stone-700 mx-1" />
        }
        const btn = item as { icon: string; title: string; action: () => void; isActive: () => boolean }
        return (
          <button
            key={btn.title}
            onClick={btn.action}
            title={btn.title}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
              btn.isActive()
                ? 'bg-indigo-600/30 text-indigo-300'
                : 'text-stone-400 hover:bg-stone-700 hover:text-stone-200'
            }`}
          >
            <span className={btn.icon} />
          </button>
        )
      })}
    </div>
  )
}
