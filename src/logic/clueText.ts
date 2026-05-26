import type { Board, Character, Clue } from '../types'

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

export function clueText(clue: Clue, characters: Character[], board: Board): string {
  const sub = charName(clue.subject, characters)

  switch (clue.type) {
    case 'in_room':
      return `${sub} está en ${roomName(clue.params.roomId, board)}.`

    case 'not_in_room':
      return `${sub} NO está en ${roomName(clue.params.roomId, board)}.`

    case 'same_room_as':
      return `${sub} está en la misma habitación que ${charName(clue.params.otherId, characters)}.`

    case 'not_same_room_as':
      return `${sub} NO está en la misma habitación que ${charName(clue.params.otherId, characters)}.`

    case 'in_corner':
      return `${sub} está en una esquina.`

    case 'not_in_corner':
      return `${sub} NO está en una esquina.`

    case 'direction_of':
      return `${sub} está ${DIRECTION_ES[clue.params.direction] ?? clue.params.direction} de ${charName(clue.params.otherId, characters)}.`

    case 'not_direction_of':
      return `${sub} NO está ${DIRECTION_ES[clue.params.direction] ?? clue.params.direction} de ${charName(clue.params.otherId, characters)}.`

    case 'next_to':
      return `${sub} está al lado de ${charName(clue.params.otherId, characters)}.`

    case 'not_next_to':
      return `${sub} NO está al lado de ${charName(clue.params.otherId, characters)}.`

    case 'same_object_as':
      return `${sub} está en el mismo tipo de objeto que ${charName(clue.params.otherId, characters)}.`

    case 'on_object':
      return `${sub} está sobre ${OBJECT_ES[clue.params.objectType as string] ?? clue.params.objectType}.`

    case 'not_on_object':
      return `${sub} NO está sobre ${OBJECT_ES[clue.params.objectType as string] ?? clue.params.objectType}.`

    case 'only_one_on_object':
      return `${sub} es el único en ${OBJECT_ES[clue.params.objectType as string] ?? clue.params.objectType}.`

    case 'next_to_window':
      return `${sub} está junto a una ventana.`

    case 'not_next_to_window':
      return `${sub} NO está junto a ninguna ventana.`

    case 'n_cols_direction_of':
      return `${sub} está exactamente ${clue.params.n} columna${clue.params.n !== 1 ? 's' : ''} ${DIRECTION_ES[clue.params.direction] ?? clue.params.direction} de ${charName(clue.params.otherId, characters)}.`

    case 'n_rows_direction_of':
      return `${sub} está exactamente ${clue.params.n} fila${clue.params.n !== 1 ? 's' : ''} ${DIRECTION_ES[clue.params.direction] ?? clue.params.direction} de ${charName(clue.params.otherId, characters)}.`

    default:
      return `Pista sobre ${sub}.`
  }
}
