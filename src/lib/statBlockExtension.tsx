import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

function mod(score: number): string {
  const m = Math.floor((score - 10) / 2)
  return m >= 0 ? `+${m}` : `${m}`
}

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
type Ability = typeof ABILITIES[number]

interface StatBlockAttrs {
  name: string
  meta: string
  ac: string
  hp: string
  speed: string
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
  saves: string
  skills: string
  immunities: string
  conditionImmunities: string
  senses: string
  languages: string
  cr: string
  traits: string
  actions: string
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex gap-1.5 items-baseline leading-snug">
      <span className="font-bold text-amber-300 shrink-0 text-xs">{label}</span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.stopPropagation()}
        onKeyUp={e => e.stopPropagation()}
        onKeyPress={e => e.stopPropagation()}
        className="flex-1 bg-transparent text-amber-50 outline-none text-xs px-1 rounded hover:bg-amber-950/40 focus:bg-amber-950/50 min-w-0"
        style={{}}
      />
    </div>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-bold text-amber-300 uppercase tracking-widest" style={{}}>
        {label}
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.stopPropagation()}
        onKeyUp={e => e.stopPropagation()}
        onKeyPress={e => e.stopPropagation()}
        rows={3}
        placeholder={`Describe ${label.toLowerCase()} here...`}
        className="w-full bg-transparent text-amber-50/80 outline-none text-xs px-1 py-0.5 rounded resize-none hover:bg-amber-950/40 focus:bg-amber-950/50 placeholder-amber-900/60 leading-relaxed"
        style={{}}
      />
    </div>
  )
}

function AbilityScore({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xs font-bold text-amber-300 uppercase tracking-wide" style={{}}>
        {label}
      </span>
      <input
        type="number"
        value={value}
        min={1}
        max={30}
        onChange={e => onChange(parseInt(e.target.value) || 10)}
        onKeyDown={e => e.stopPropagation()}
        onKeyUp={e => e.stopPropagation()}
        onKeyPress={e => e.stopPropagation()}
        className="w-10 text-center bg-transparent text-amber-50 font-bold text-sm outline-none rounded hover:bg-amber-950/40 focus:bg-amber-950/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        style={{}}
      />
      <span className="text-xs text-amber-200/60">({mod(value)})</span>
    </div>
  )
}

function StatBlockView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const attrs = node.attrs as StatBlockAttrs
  const set = (key: keyof StatBlockAttrs) => (value: string | number) =>
    updateAttributes({ [key]: value })

  return (
    <NodeViewWrapper className="my-6" onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}>
      <div
        contentEditable={false}
        className="stat-block-node relative"
      >
        {/* Delete button */}
        <button
          onClick={deleteNode}
          title="Remove stat block"
          className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center text-amber-900/60 hover:text-amber-400 hover:bg-amber-900/40 rounded z-10 transition-colors"
        >
          <span className="i-lucide-x text-xs" />
        </button>

        {/* ── Header ── */}
        <div className="px-4 pt-3 pb-2.5 border-b-4 border-amber-800/70" style={{ background: '#1a0900' }}>
          <input
            value={attrs.name}
            onChange={e => set('name')(e.target.value)}
            onKeyDown={e => e.stopPropagation()}
            onKeyUp={e => e.stopPropagation()}
            onKeyPress={e => e.stopPropagation()}
            placeholder="Monster Name"
            className="w-full bg-transparent text-amber-100 outline-none text-xl font-bold pr-6 placeholder-amber-900/50"
            style={{}}
          />
          <input
            value={attrs.meta}
            onChange={e => set('meta')(e.target.value)}
            onKeyDown={e => e.stopPropagation()}
            onKeyUp={e => e.stopPropagation()}
            onKeyPress={e => e.stopPropagation()}
            placeholder="Medium undead, chaotic evil"
            className="w-full bg-transparent text-amber-200/60 outline-none text-xs italic mt-0.5 placeholder-amber-900/40"
            style={{}}
          />
        </div>

        {/* ── Basic stats ── */}
        <div className="px-4 py-2.5 space-y-1 border-b border-amber-800/40">
          <TextField label="Armor Class" value={attrs.ac} onChange={set('ac')} />
          <TextField label="Hit Points" value={attrs.hp} onChange={set('hp')} />
          <TextField label="Speed" value={attrs.speed} onChange={set('speed')} />
        </div>

        {/* ── Ability scores ── */}
        <div className="px-4 py-3 border-b border-amber-800/40">
          <div className="flex justify-between">
            {ABILITIES.map(stat => (
              <AbilityScore
                key={stat}
                label={stat}
                value={attrs[stat]}
                onChange={set(stat)}
              />
            ))}
          </div>
        </div>

        {/* ── Proficiencies ── */}
        <div className="px-4 py-2.5 space-y-1 border-b border-amber-800/40">
          {attrs.saves && <TextField label="Saving Throws" value={attrs.saves} onChange={set('saves')} />}
          {attrs.skills && <TextField label="Skills" value={attrs.skills} onChange={set('skills')} />}
          {attrs.immunities && <TextField label="Damage Immunities" value={attrs.immunities} onChange={set('immunities')} />}
          {attrs.conditionImmunities && <TextField label="Condition Immunities" value={attrs.conditionImmunities} onChange={set('conditionImmunities')} />}
          <TextField label="Senses" value={attrs.senses} onChange={set('senses')} />
          <TextField label="Languages" value={attrs.languages} onChange={set('languages')} />
          <TextField label="Challenge" value={attrs.cr} onChange={set('cr')} />
        </div>

        {/* ── Traits ── */}
        {attrs.traits !== undefined && (
          <div className="px-4 py-2.5 border-b border-amber-800/40">
            <TextAreaField label="Traits" value={attrs.traits} onChange={set('traits')} />
          </div>
        )}

        {/* ── Actions ── */}
        <div className="px-4 py-2.5">
          <TextAreaField label="Actions" value={attrs.actions} onChange={set('actions')} />
        </div>
      </div>
    </NodeViewWrapper>
  )
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    statBlock: {
      insertStatBlock: () => ReturnType
    }
  }
}

export const StatBlock = Node.create({
  name: 'statBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      name: { default: 'Monster Name' },
      meta: { default: 'Medium undead, chaotic evil' },
      ac: { default: '13 (natural armor)' },
      hp: { default: '45 (6d8 + 18)' },
      speed: { default: '30 ft.' },
      str: { default: 13 },
      dex: { default: 10 },
      con: { default: 16 },
      int: { default: 3 },
      wis: { default: 10 },
      cha: { default: 5 },
      saves: { default: '' },
      skills: { default: '' },
      immunities: { default: '' },
      conditionImmunities: { default: '' },
      senses: { default: 'darkvision 60 ft., passive Perception 8' },
      languages: { default: 'understands Common but cannot speak' },
      cr: { default: '1/4 (50 XP)' },
      traits: { default: '' },
      actions: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="stat-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'stat-block' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(StatBlockView)
  },

  addCommands() {
    return {
      insertStatBlock:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: 'statBlock' }),
    }
  },
})
