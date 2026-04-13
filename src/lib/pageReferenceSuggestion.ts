import { type SuggestionOptions } from '@tiptap/suggestion'

// Shared store for mention data
let _pages: Array<{ id: string; title: string }> = []

export function setAvailablePages(pages: Array<{ id: string; title: string }>) {
  _pages = pages
}

interface SuggestionItem {
  id: string
  label: string
  icon: string
}

function createSuggestion(
  char: string,
  getItems: (query: string) => SuggestionItem[],
  emptyText: string,
): Omit<SuggestionOptions, 'editor'> {
  return {
    char,
    items: ({ query }) => getItems(query),
    render: () => {
      let popup: HTMLDivElement | null = null
      let selectedIndex = 0
      let items: SuggestionItem[] = []
      let commandFn: ((item: SuggestionItem) => void) | null = null

      function updateSelection() {
        if (!popup) return
        const buttons = popup.querySelectorAll('[data-suggestion-item]')
        buttons.forEach((btn, i) => {
          if (i === selectedIndex) {
            btn.classList.add('bg-indigo-600/30', 'text-indigo-300')
            btn.classList.remove('text-stone-300')
          } else {
            btn.classList.remove('bg-indigo-600/30', 'text-indigo-300')
            btn.classList.add('text-stone-300')
          }
        })
      }

      function renderItems() {
        if (!popup) return
        popup.innerHTML = ''

        if (items.length === 0) {
          const empty = document.createElement('div')
          empty.className = 'px-3 py-2 text-sm text-stone-500'
          empty.textContent = emptyText
          popup.appendChild(empty)
          return
        }

        items.forEach((item, index) => {
          const btn = document.createElement('button')
          btn.className = 'w-full text-left px-3 py-1.5 text-sm hover:bg-stone-700 flex items-center gap-2 transition-colors text-stone-300'
          btn.setAttribute('data-suggestion-item', '')
          btn.innerHTML = `<span class="text-sm">${item.icon}</span>${item.label}`
          btn.addEventListener('mouseenter', () => {
            selectedIndex = index
            updateSelection()
          })
          btn.addEventListener('mousedown', (e) => {
            e.preventDefault()
            commandFn?.(item)
          })
          popup!.appendChild(btn)
        })

        updateSelection()
      }

      return {
        onStart: (props: { clientRect?: (() => DOMRect | null) | null; command: (item: SuggestionItem) => void; items: SuggestionItem[] }) => {
          items = props.items
          commandFn = props.command

          popup = document.createElement('div')
          popup.className = 'bg-stone-800 border border-stone-600 rounded-lg shadow-xl z-50 py-1 overflow-hidden max-h-48 overflow-y-auto min-w-48'
          popup.style.position = 'fixed'

          renderItems()
          document.body.appendChild(popup)

          const rect = props.clientRect?.()
          if (rect && popup) {
            popup.style.left = `${rect.left}px`
            popup.style.top = `${rect.bottom + 4}px`
          }
        },
        onUpdate: (props: { clientRect?: (() => DOMRect | null) | null; command: (item: SuggestionItem) => void; items: SuggestionItem[] }) => {
          items = props.items
          commandFn = props.command
          selectedIndex = 0
          renderItems()

          const rect = props.clientRect?.()
          if (rect && popup) {
            popup.style.left = `${rect.left}px`
            popup.style.top = `${rect.bottom + 4}px`
          }
        },
        onKeyDown: (props: { event: KeyboardEvent }) => {
          if (props.event.key === 'ArrowDown') {
            selectedIndex = (selectedIndex + 1) % items.length
            updateSelection()
            return true
          }
          if (props.event.key === 'ArrowUp') {
            selectedIndex = (selectedIndex - 1 + items.length) % items.length
            updateSelection()
            return true
          }
          if (props.event.key === 'Enter') {
            const item = items[selectedIndex]
            if (item) commandFn?.(item)
            return true
          }
          if (props.event.key === 'Escape') {
            popup?.remove()
            popup = null
            return true
          }
          return false
        },
        onExit: () => {
          popup?.remove()
          popup = null
        },
      } as ReturnType<NonNullable<SuggestionOptions['render']>>
    },
  }
}

export const pageReferenceSuggestion = createSuggestion(
  '@',
  (query) =>
    _pages
      .filter(p => p.title.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 8)
      .map(p => ({ id: p.id, label: p.title || 'Untitled', icon: '📄' })),
  'No pages found',
)
