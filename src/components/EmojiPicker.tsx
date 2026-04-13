import { useRef, useEffect } from 'react'

const EMOJI_GROUPS = [
  {
    label: 'D&D',
    emojis: ['⚔️', '🛡️', '🗡️', '🏹', '🪄', '🧙', '🧝', '🧟', '🐉', '🏰', '💀', '👹', '🧌', '🦇', '🕷️', '🐺', '🦅', '🐍', '💎', '🗺️', '📜', '🏆', '👑', '🔮'],
  },
  {
    label: 'Objects',
    emojis: ['📖', '📝', '📋', '📁', '📂', '🗂️', '📌', '🔖', '🏷️', '💡', '🔑', '🗝️', '🧪', '⚗️', '🧲', '🪙', '💰', '⚙️', '🔧', '🛠️', '🧭', '🪤', '🎲', '🃏'],
  },
  {
    label: 'Nature',
    emojis: ['🌲', '🌊', '🔥', '❄️', '⚡', '🌙', '☀️', '⭐', '🌋', '🏔️', '🌿', '🍄', '🌸', '💧', '🌪️', '🌈', '☁️', '🌑'],
  },
  {
    label: 'People',
    emojis: ['👤', '👥', '🤴', '👸', '🧙‍♂️', '🧝‍♀️', '🧛', '🧜', '🧚', '💂', '🦸', '🦹', '🤖', '👻', '🎭'],
  },
]

interface EmojiPickerProps {
  currentIcon: string
  onSelect: (emoji: string) => void
  onClose: () => void
}

export function EmojiPicker({ currentIcon, onSelect, onClose }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="w-56 bg-stone-800 border border-stone-600 rounded-lg shadow-xl overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* Current + remove */}
      {currentIcon && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-stone-700">
          <span className="text-sm text-stone-400">Current: <span className="text-base">{currentIcon}</span></span>
          <button
            onClick={() => onSelect('')}
            className="text-xs text-stone-500 hover:text-red-400 transition-colors"
          >
            Remove
          </button>
        </div>
      )}

      {/* Emoji grid */}
      <div className="max-h-48 overflow-y-auto p-2">
        {EMOJI_GROUPS.map(group => (
          <div key={group.label} className="mb-2">
            <div className="text-xs text-stone-500 font-medium px-1 mb-1">{group.label}</div>
            <div className="grid grid-cols-8 gap-0.5">
              {group.emojis.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => onSelect(emoji)}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-stone-700 text-sm"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
