export interface Template {
  id: string
  name: string
  description: string
  icon: string
  content: Record<string, unknown>
}

function heading(level: 1 | 2 | 3, text: string) {
  return {
    type: 'heading',
    attrs: { level },
    content: [{ type: 'text', text }],
  }
}

function paragraph(text?: string) {
  return text
    ? { type: 'paragraph', content: [{ type: 'text', text }] }
    : { type: 'paragraph' }
}

function doc(...content: object[]) {
  return { type: 'doc', content }
}

export const TEMPLATES: Template[] = [
  {
    id: 'npc',
    name: 'NPC',
    description: 'Non-player character profile',
    icon: '🧙',
    content: doc(
      heading(2, 'Appearance'),
      paragraph(),
      heading(2, 'Personality'),
      paragraph(),
      heading(2, 'Goals & Motivations'),
      paragraph(),
      heading(2, 'Secrets'),
      paragraph(),
      heading(2, 'Relationships'),
      paragraph(),
      heading(2, 'Notes'),
      paragraph(),
    ),
  },
  {
    id: 'location',
    name: 'Location',
    description: 'Place, dungeon, or region',
    icon: '🗺️',
    content: doc(
      heading(2, 'Description'),
      paragraph(),
      heading(2, 'Atmosphere'),
      paragraph(),
      heading(2, 'Notable Features'),
      paragraph(),
      heading(2, 'Inhabitants'),
      paragraph(),
      heading(2, 'Secrets & Hidden Areas'),
      paragraph(),
      heading(2, 'Plot Hooks'),
      paragraph(),
    ),
  },
  {
    id: 'session-log',
    name: 'Session Log',
    description: 'Record of a play session',
    icon: '📜',
    content: doc(
      heading(2, 'Session Info'),
      paragraph('Session #: '),
      paragraph('Date: '),
      paragraph('Players: '),
      heading(2, 'Recap'),
      paragraph(),
      heading(2, 'Key Events'),
      paragraph(),
      heading(2, 'Loot & Rewards'),
      paragraph(),
      heading(2, 'Cliffhanger / Next Session'),
      paragraph(),
      heading(2, 'DM Notes'),
      paragraph(),
    ),
  },
  {
    id: 'faction',
    name: 'Faction',
    description: 'Guild, order, or organization',
    icon: '⚔️',
    content: doc(
      heading(2, 'Overview'),
      paragraph(),
      heading(2, 'Goals'),
      paragraph(),
      heading(2, 'Key Members'),
      paragraph(),
      heading(2, 'Resources & Assets'),
      paragraph(),
      heading(2, 'Relationships'),
      paragraph(),
      heading(2, 'Notes'),
      paragraph(),
    ),
  },
  {
    id: 'item',
    name: 'Item',
    description: 'Weapon, artifact, or loot',
    icon: '💎',
    content: doc(
      heading(2, 'Type & Rarity'),
      paragraph('Type: '),
      paragraph('Rarity: '),
      heading(2, 'Description'),
      paragraph(),
      heading(2, 'Properties'),
      paragraph(),
      heading(2, 'History & Lore'),
      paragraph(),
      heading(2, 'Current Location'),
      paragraph(),
    ),
  },
  {
    id: 'quest',
    name: 'Quest',
    description: 'Mission or story hook',
    icon: '📋',
    content: doc(
      heading(2, 'Hook'),
      paragraph(),
      heading(2, 'Objective'),
      paragraph(),
      heading(2, 'Reward'),
      paragraph(),
      heading(2, 'Complications'),
      paragraph(),
      heading(2, 'Key NPCs'),
      paragraph(),
      heading(2, 'Resolution'),
      paragraph(),
    ),
  },
]
