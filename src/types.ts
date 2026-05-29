export type CellId = `F${number}C${number}`

export const OCCUPIABLE_OBJECTS = ['silla', 'alfombra', 'cama'] as const
export type OccupiableObject = typeof OCCUPIABLE_OBJECTS[number]

export type ObjectType =
  | OccupiableObject
  | 'mesa' | 'tv' | 'planta' | 'estanteria' | 'caja'

export function isOccupiable(cell: Cell): boolean {
  if (cell.objectPartOf) return false  // secondary span cells are visual-only, not valid placements
  return cell.object === undefined || OCCUPIABLE_OBJECTS.includes(cell.object as OccupiableObject)
}

export type WallSide = 'top' | 'bottom' | 'left' | 'right'

export interface Cell {
  id: CellId
  row: number
  col: number
  roomId: string
  object?: ObjectType
  windows: WallSide[]
  objectSpanDir?: 'h' | 'v'   // primary cell of a 2-cell span: spans right ('h') or down ('v')
  objectPartOf?: CellId        // secondary cell: points to the primary cell's id
}

export interface Room {
  id: string
  name: string
  articleName?: string
  cells: CellId[]
}

export interface Board {
  rows: number
  cols: number
  cells: Cell[][]
  rooms: Room[]
}

export interface Character {
  id: string
  name: string
}

export type EvalMode = 'partial' | 'full'

// Clue types
export type ClueType =
  | 'in_room'
  | 'not_in_room'
  | 'same_room_as'
  | 'not_same_room_as'
  | 'in_corner'
  | 'not_in_corner'
  | 'direction_of'
  | 'not_direction_of'
  | 'next_to'
  | 'not_next_to'
  | 'same_object_as'
  | 'on_object'
  | 'not_on_object'
  | 'only_one_on_object'
  | 'next_to_window'
  | 'not_next_to_window'
  | 'n_cols_direction_of'
  | 'n_rows_direction_of'

export interface ClueRef {
  type: 'character' | 'object_type' | 'room_id'
  value: string
}

export interface BaseClue {
  id: string
  type: ClueType
  subject: string // character id
  params: Record<string, unknown>
}

export interface InRoomClue extends BaseClue {
  type: 'in_room'
  params: { roomId: string }
}

export interface NotInRoomClue extends BaseClue {
  type: 'not_in_room'
  params: { roomId: string }
}

export interface SameRoomAsClue extends BaseClue {
  type: 'same_room_as'
  params: { otherId: string }
}

export interface NotSameRoomAsClue extends BaseClue {
  type: 'not_same_room_as'
  params: { otherId: string }
}

export interface InCornerClue extends BaseClue {
  type: 'in_corner'
  params: Record<string, never>
}

export interface NotInCornerClue extends BaseClue {
  type: 'not_in_corner'
  params: Record<string, never>
}

export type Direction = 'north' | 'south' | 'east' | 'west'

export interface DirectionOfClue extends BaseClue {
  type: 'direction_of'
  params: { otherId: string; direction: Direction }
}

export interface NotDirectionOfClue extends BaseClue {
  type: 'not_direction_of'
  params: { otherId: string; direction: Direction }
}

export interface NextToClue extends BaseClue {
  type: 'next_to'
  params: { otherId: string }
}

export interface NotNextToClue extends BaseClue {
  type: 'not_next_to'
  params: { otherId: string }
}

export interface SameObjectAsClue extends BaseClue {
  type: 'same_object_as'
  params: { otherId: string }
}

export interface OnObjectClue extends BaseClue {
  type: 'on_object'
  params: { objectType: ObjectType }
}

export interface NotOnObjectClue extends BaseClue {
  type: 'not_on_object'
  params: { objectType: ObjectType }
}

export interface OnlyOneOnObjectClue extends BaseClue {
  type: 'only_one_on_object'
  params: { objectType: ObjectType }
}

export interface NextToWindowClue extends BaseClue {
  type: 'next_to_window'
  params: Record<string, never>
}

export interface NotNextToWindowClue extends BaseClue {
  type: 'not_next_to_window'
  params: Record<string, never>
}

export interface NColsDirectionOfClue extends BaseClue {
  type: 'n_cols_direction_of'
  params: { otherId: string; direction: 'east' | 'west'; n: number }
}

export interface NRowsDirectionOfClue extends BaseClue {
  type: 'n_rows_direction_of'
  params: { otherId: string; direction: 'north' | 'south'; n: number }
}

export type Clue =
  | InRoomClue
  | NotInRoomClue
  | SameRoomAsClue
  | NotSameRoomAsClue
  | InCornerClue
  | NotInCornerClue
  | DirectionOfClue
  | NotDirectionOfClue
  | NextToClue
  | NotNextToClue
  | SameObjectAsClue
  | OnObjectClue
  | NotOnObjectClue
  | OnlyOneOnObjectClue
  | NextToWindowClue
  | NotNextToWindowClue
  | NColsDirectionOfClue
  | NRowsDirectionOfClue

export interface Solution {
  placement: Record<string, CellId> // characterId -> cellId
  culpritId: string
  stolenObjectCellId: CellId
}

export interface Puzzle {
  id: string
  level: number
  difficulty: 'easy' | 'medium' | 'hard'
  board: Board
  characters: Character[]
  clues: Clue[]
  solution: Solution
}

export interface Progress {
  version: 1
  maxLevelReached: number
  completedLevels: number[]
}
