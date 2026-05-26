// T13: Per-character color utility
const CHARACTER_COLORS = [
  '#e63946', // red
  '#2a9d8f', // teal
  '#e9c46a', // yellow
  '#f4a261', // orange
  '#264653', // dark blue
  '#8338ec', // purple
  '#06d6a0', // green
  '#ef476f', // pink
]

export function getCharacterColor(characterId: string, characters: Array<{ id: string }>): string {
  const idx = characters.findIndex(c => c.id === characterId)
  if (idx === -1) return '#888'
  return CHARACTER_COLORS[idx % CHARACTER_COLORS.length]!
}
