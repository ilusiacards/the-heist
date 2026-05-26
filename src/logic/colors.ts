// T13: Per-character color utility
const CHARACTER_COLORS = [
  '#92400e', // amber-900
  '#1e3a5f', // dark blue
  '#166534', // green-800
  '#4c1d95', // violet-900
  '#134e4a', // teal-900
  '#9f1239', // rose-900
  '#7c2d12', // orange-900
  '#1e1b4b', // indigo-950
]

export function getCharacterColor(characterId: string, characters: Array<{ id: string }>): string {
  const idx = characters.findIndex(c => c.id === characterId)
  if (idx === -1) return '#78716c'
  return CHARACTER_COLORS[idx % CHARACTER_COLORS.length]!
}
