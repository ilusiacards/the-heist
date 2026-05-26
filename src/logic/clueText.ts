import type { Board, Character, Clue, SameRoomAsClue } from '../types'

function charName(id: string, characters: Character[]): string {
  return characters.find(c => c.id === id)?.name ?? id
}

function roomName(id: string, board: Board): string {
  return board.rooms.find(r => r.id === id)?.name ?? id
}

const DIRECTION_ES: Record<string, string> = {
  north: 'al norte',
  south: 'al sur',
  east: 'al este',
  west: 'al oeste',
}

const OBJECT_ES: Record<string, string> = {
  silla: 'la silla',
  alfombra: 'la alfombra',
  cama: 'la cama',
  mesa: 'la mesa',
  tv: 'el televisor',
  planta: 'la planta',
  estanteria: 'la estantería',
  caja: 'la caja',
}

// Priority order for selecting the "main" clause of a combined sentence
const MAIN_PRIORITY: Clue['type'][] = [
  'in_room', 'on_object', 'direction_of', 'n_cols_direction_of', 'n_rows_direction_of',
  'in_corner', 'next_to', 'same_room_as', 'next_to_window',
  'not_in_room', 'not_in_corner', 'not_on_object', 'not_same_room_as',
  'not_direction_of', 'not_next_to', 'not_next_to_window', 'same_object_as', 'only_one_on_object',
]

function joinNames(names: string[]): string {
  if (names.length === 1) return names[0]!
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
}

// Returns the predicate part starting with "estaba …" — no subject, no period
function mainClauseText(clue: Clue, characters: Character[], board: Board): string {
  switch (clue.type) {
    case 'in_room':
      return `estaba en ${roomName(clue.params.roomId, board)}`
    case 'not_in_room':
      return `no estaba en ${roomName(clue.params.roomId, board)}`
    case 'same_room_as':
      return `estaba en la misma habitación que ${charName(clue.params.otherId, characters)}`
    case 'not_same_room_as':
      return `no estaba en la misma habitación que ${charName(clue.params.otherId, characters)}`
    case 'in_corner':
      return `estaba en una esquina`
    case 'not_in_corner':
      return `no estaba en una esquina`
    case 'direction_of':
      return `estaba ${DIRECTION_ES[clue.params.direction] ?? clue.params.direction} de ${charName(clue.params.otherId, characters)}`
    case 'not_direction_of':
      return `no estaba ${DIRECTION_ES[clue.params.direction] ?? clue.params.direction} de ${charName(clue.params.otherId, characters)}`
    case 'next_to':
      return `estaba al lado de ${charName(clue.params.otherId, characters)}`
    case 'not_next_to':
      return `no estaba al lado de ${charName(clue.params.otherId, characters)}`
    case 'on_object':
      return `estaba sobre ${OBJECT_ES[clue.params.objectType as string] ?? clue.params.objectType}`
    case 'not_on_object':
      return `no estaba sobre ${OBJECT_ES[clue.params.objectType as string] ?? clue.params.objectType}`
    case 'only_one_on_object':
      return `era el único sobre ${OBJECT_ES[clue.params.objectType as string] ?? clue.params.objectType}`
    case 'next_to_window':
      return `estaba junto a una ventana`
    case 'not_next_to_window':
      return `no estaba junto a ninguna ventana`
    case 'n_cols_direction_of':
      return `estaba exactamente ${clue.params.n} columna${clue.params.n !== 1 ? 's' : ''} ${DIRECTION_ES[clue.params.direction] ?? clue.params.direction} de ${charName(clue.params.otherId, characters)}`
    case 'n_rows_direction_of':
      return `estaba exactamente ${clue.params.n} fila${clue.params.n !== 1 ? 's' : ''} ${DIRECTION_ES[clue.params.direction] ?? clue.params.direction} de ${charName(clue.params.otherId, characters)}`
    case 'same_object_as':
      return `estaba en el mismo tipo de objeto que ${charName(clue.params.otherId, characters)}`
    default:
      return `tenía una pista`
  }
}

// Returns a comma-ready subordinate fragment — no subject, no leading comma, no period
function subordinateClauseText(clue: Clue, characters: Character[], board: Board): string {
  switch (clue.type) {
    case 'in_room':
      return `en ${roomName(clue.params.roomId, board)}`
    case 'not_in_room':
      return `fuera de ${roomName(clue.params.roomId, board)}`
    case 'same_room_as':
      return `junto a ${charName(clue.params.otherId, characters)}`
    case 'not_same_room_as':
      return `lejos de ${charName(clue.params.otherId, characters)}`
    case 'in_corner':
      return `en una esquina`
    case 'not_in_corner':
      return `no en una esquina`
    case 'direction_of':
      return `${DIRECTION_ES[clue.params.direction] ?? clue.params.direction} de ${charName(clue.params.otherId, characters)}`
    case 'not_direction_of':
      return `no ${DIRECTION_ES[clue.params.direction] ?? clue.params.direction} de ${charName(clue.params.otherId, characters)}`
    case 'next_to':
      return `al lado de ${charName(clue.params.otherId, characters)}`
    case 'not_next_to':
      return `no al lado de ${charName(clue.params.otherId, characters)}`
    case 'on_object':
      return `sobre ${OBJECT_ES[clue.params.objectType as string] ?? clue.params.objectType}`
    case 'not_on_object':
      return `no sobre ${OBJECT_ES[clue.params.objectType as string] ?? clue.params.objectType}`
    case 'only_one_on_object':
      return `único sobre ${OBJECT_ES[clue.params.objectType as string] ?? clue.params.objectType}`
    case 'next_to_window':
      return `junto a una ventana`
    case 'not_next_to_window':
      return `lejos de las ventanas`
    case 'n_cols_direction_of':
      return `${clue.params.n} col${clue.params.n !== 1 ? 's' : ''} ${DIRECTION_ES[clue.params.direction] ?? clue.params.direction} de ${charName(clue.params.otherId, characters)}`
    case 'n_rows_direction_of':
      return `${clue.params.n} fila${clue.params.n !== 1 ? 's' : ''} ${DIRECTION_ES[clue.params.direction] ?? clue.params.direction} de ${charName(clue.params.otherId, characters)}`
    case 'same_object_as':
      return `en el mismo objeto que ${charName(clue.params.otherId, characters)}`
    default:
      return `con otra pista`
  }
}

const isSameRoom = (c: Clue): c is SameRoomAsClue => c.type === 'same_room_as'

export function characterClueText(
  characterId: string,
  clues: Clue[],
  characters: Character[],
  board: Board
): string {
  const myClues = clues.filter(c => c.subject === characterId)
  if (myClues.length === 0) return ''

  const sub = charName(characterId, characters)

  if (myClues.length === 1) {
    return `${sub} ${mainClauseText(myClues[0]!, characters, board)}.`
  }

  // Select main clause by priority
  let mainClue = myClues[0]!
  for (const type of MAIN_PRIORITY) {
    const found = myClues.find(c => c.type === type)
    if (found) { mainClue = found; break }
  }

  const remaining = myClues.filter(c => c !== mainClue)
  const sameRoomClues = remaining.filter(isSameRoom)
  const otherClues = remaining.filter(c => c.type !== 'same_room_as')

  const parts: string[] = []

  if (isSameRoom(mainClue) && sameRoomClues.length > 0) {
    // Multiple same_room_as with no positional main: merge all into "junto a X y Y"
    const allNames = [mainClue, ...sameRoomClues].map(c => charName(c.params.otherId, characters))
    parts.push(`${sub} estaba junto a ${joinNames(allNames)}`)
  } else {
    parts.push(`${sub} ${mainClauseText(mainClue, characters, board)}`)
    if (sameRoomClues.length > 0) {
      const names = sameRoomClues.map(c => charName(c.params.otherId, characters))
      parts.push(`junto a ${joinNames(names)}`)
    }
  }

  for (const clue of otherClues) {
    parts.push(subordinateClauseText(clue, characters, board))
  }

  return parts.join(', ') + '.'
}

// Legacy single-clue renderer (kept for reference; CluePanel now uses characterClueText)
export function clueText(clue: Clue, characters: Character[], board: Board): string {
  const sub = charName(clue.subject, characters)
  return `${sub} ${mainClauseText(clue, characters, board)}.`
}
