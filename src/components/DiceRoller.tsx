import { useState, useEffect, useRef, useCallback } from 'react'

type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100'

interface RollResult {
  dice: string
  rolls: number[]
  total: number
  id: number
}

const DICE: DieType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100']

export function DiceRoller({ onClose }: { onClose: () => void }) {
  const [dieType, setDieType] = useState<DieType>('d20')
  const [count, setCount] = useState(1)
  const [results, setResults] = useState<RollResult[]>([])
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [initialized, setInitialized] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const dragStart = useRef({ mouseX: 0, mouseY: 0, panelX: 0, panelY: 0 })

  // Position near the bottom-left (above where the button lives)
  useEffect(() => {
    const el = panelRef.current
    if (!el || initialized) return
    const rect = el.getBoundingClientRect()
    setPos({ x: 16, y: window.innerHeight - rect.height - 80 })
    setInitialized(true)
  })

  // Drag handlers
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, panelX: pos.x, panelY: pos.y }
  }, [pos])

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragging.current) return
      setPos({
        x: dragStart.current.panelX + (e.clientX - dragStart.current.mouseX),
        y: dragStart.current.panelY + (e.clientY - dragStart.current.mouseY),
      })
    }
    const up = () => { dragging.current = false }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
  }, [])

  // ESC to close
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [onClose])

  const roll = useCallback(() => {
    const sides = dieType === 'd100' ? 100 : parseInt(dieType.slice(1))
    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1)
    const total = rolls.reduce((a, b) => a + b, 0)
    setResults(prev => [
      { dice: `${count}${dieType}`, rolls, total, id: Date.now() },
      ...prev.slice(0, 8),
    ])
  }, [count, dieType])

  const latest = results[0]
  const isNat20 = latest && dieType === 'd20' && count === 1 && latest.total === 20
  const isNat1 = latest && dieType === 'd20' && count === 1 && latest.total === 1

  return (
    <div
      ref={panelRef}
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 200 }}
      className="w-64 bg-stone-900 border border-amber-800/60 rounded-xl shadow-2xl overflow-hidden select-none"
    >
      {/* Header / drag handle */}
      <div
        onMouseDown={handleDragStart}
        className="flex items-center justify-between px-3 py-2.5 bg-stone-800 border-b border-stone-700 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🎲</span>
          <span className="text-sm font-semibold text-amber-300">
            Dice Roller
          </span>
        </div>
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={onClose}
          className="w-5 h-5 flex items-center justify-center text-stone-500 hover:text-stone-300 transition-colors"
        >
          <span className="i-lucide-x text-xs" />
        </button>
      </div>

      <div className="p-3 space-y-3">
        {/* Die type selector */}
        <div className="grid grid-cols-4 gap-1">
          {DICE.map(d => (
            <button
              key={d}
              onClick={() => setDieType(d)}
              className={`py-1.5 text-xs rounded-md font-bold transition-colors ${
                dieType === d
                  ? 'bg-amber-600 text-stone-900'
                  : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Count + roll button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCount(c => Math.max(1, c - 1))}
            className="w-8 h-8 flex items-center justify-center bg-stone-800 rounded-lg text-stone-300 hover:bg-stone-700 transition-colors shrink-0"
          >
            <span className="i-lucide-minus text-xs" />
          </button>
          <button
            onClick={roll}
            className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-stone-900 font-bold rounded-lg transition-colors text-sm"
          >
            Roll {count}{dieType}
          </button>
          <button
            onClick={() => setCount(c => Math.min(20, c + 1))}
            className="w-8 h-8 flex items-center justify-center bg-stone-800 rounded-lg text-stone-300 hover:bg-stone-700 transition-colors shrink-0"
          >
            <span className="i-lucide-plus text-xs" />
          </button>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="border-t border-stone-700">
          {/* Latest result */}
          <div className={`px-3 py-3 ${isNat20 ? 'bg-amber-900/20' : isNat1 ? 'bg-red-900/20' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-400">{latest.dice}</span>
              <span className={`text-3xl font-bold tabular-nums ${
                isNat20 ? 'text-amber-300' : isNat1 ? 'text-red-400' : 'text-stone-100'
              }`}>
                {latest.total}
              </span>
            </div>
            {latest.rolls.length > 1 && (
              <div className="text-xs text-stone-500 mt-1 text-right">
                [{latest.rolls.join(' + ')}]
              </div>
            )}
            {isNat20 && <div className="text-xs text-amber-400 text-right mt-0.5 font-bold">Natural 20!</div>}
            {isNat1 && <div className="text-xs text-red-400 text-right mt-0.5 font-bold">Natural 1...</div>}
          </div>

          {/* History */}
          {results.length > 1 && (
            <div className="border-t border-stone-700/50 max-h-28 overflow-y-auto">
              {results.slice(1).map(r => (
                <div key={r.id} className="flex items-center justify-between px-3 py-1.5 border-b border-stone-800/50 last:border-0">
                  <span className="text-xs text-stone-600">{r.dice}</span>
                  <span className="text-sm font-semibold text-stone-500">{r.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
