import type {
  Board,
  Cell,
  CellId,
  Character,
  Clue,
  Puzzle,
  Room,
} from '../types'
import { isOccupiable, OCCUPIABLE_OBJECTS } from '../types'
import { createPRNG, seededChoice, seededInt, seededShuffle } from './prng'
import { evaluateClue } from './evaluateClue'
import { findAllSolutions } from './solver'

const CHARACTER_NAMES = [
  'Ana', 'Bruno', 'Celia', 'Diego', 'Elena',
  'Felipe', 'Gara', 'Hana', 'Iván', 'Julia',
  'Karel', 'Lola', 'Marco', 'Nadia',
]

const ROOM_NAMES = [
  'Dormitorio', 'Cocina', 'Sala', 'Baño', 'Biblioteca',
  'Estudio', 'Comedor', 'Pasillo', 'Taller', 'Bodega',
]

const OBJECT_TYPES: Array<Cell['object']> = [
  'silla', 'alfombra', 'cama', 'mesa', 'tv', 'planta', 'estanteria', 'caja',
  undefined, undefined, undefined, // bias toward empty cells
]

type BoardConfig = {
  rows: number
  cols: number
  numChars: number
  numRooms: number
}

function getDifficultyConfig(level: number, rng: () => number): BoardConfig {
  if (level <= 10) {
    return { rows: 5, cols: 5, numChars: 4, numRooms: seededInt(3, 4, rng) }
  }
  if (level <= 15) {
    return { rows: 6, cols: 6, numChars: 6, numRooms: seededInt(4, 5, rng) }
  }
  // levels 16–30: 7×7 board, 7 chars (hard levels differ in seed/layout, not size)
  return { rows: 7, cols: 7, numChars: 7, numRooms: seededInt(4, 5, rng) }
}

function makeCellId(row: number, col: number): CellId {
  return `F${row}C${col}` as CellId
}

function generateBoard(config: BoardConfig, rng: () => number): Board {
  const { rows, cols, numRooms } = config

  // Assign rooms via flood-fill seeded regions
  const roomGrid: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(-1))

  // Place room seeds randomly
  const seeds: Array<{ row: number; col: number; roomId: number }> = []
  const positions = seededShuffle(
    Array.from({ length: rows * cols }, (_, i) => ({ row: Math.floor(i / cols), col: i % cols })),
    rng
  )
  for (let r = 0; r < numRooms; r++) {
    const pos = positions[r]!
    seeds.push({ row: pos.row, col: pos.col, roomId: r })
    roomGrid[pos.row]![pos.col] = r
  }

  // Flood-fill from seeds using BFS
  const queue: Array<{ row: number; col: number; roomId: number }> = [...seeds]
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]

  while (queue.length > 0) {
    const item = queue.shift()!
    for (const [dr, dc] of dirs) {
      const nr = item.row + dr!
      const nc = item.col + dc!
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
      if (roomGrid[nr]![nc] !== -1) continue
      roomGrid[nr]![nc] = item.roomId
      queue.push({ row: nr, col: nc, roomId: item.roomId })
    }
  }

  // Validate: every room has >= 2 cells
  const roomCounts = new Array(numRooms).fill(0)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      roomCounts[roomGrid[r]![c]!]++
    }
  }
  for (let i = 0; i < numRooms; i++) {
    if (roomCounts[i]! < 2) {
      throw new Error(`Room ${i} has < 2 cells`)
    }
  }

  // Build rooms
  const rooms: Room[] = Array.from({ length: numRooms }, (_, i) => ({
    id: `room-${i}`,
    name: ROOM_NAMES[i] ?? `Habitación ${i + 1}`,
    cells: [],
  }))

  // Assign objects and windows
  const cells: Cell[][] = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => {
      const roomIdx = roomGrid[row]![col]!
      const roomId = `room-${roomIdx}`

      const obj = rng() < 0.4 ? seededChoice(OBJECT_TYPES, rng) : undefined

      // Border cells get windows with 20% chance
      const isBorder = row === 0 || row === rows - 1 || col === 0 || col === cols - 1
      const windows: Cell['windows'] = []
      if (isBorder && rng() < 0.2) {
        if (row === 0) windows.push('top')
        if (row === rows - 1) windows.push('bottom')
        if (col === 0) windows.push('left')
        if (col === cols - 1) windows.push('right')
      }

      const cell: Cell = {
        id: makeCellId(row, col),
        row,
        col,
        roomId,
        windows,
      }
      if (obj !== undefined) cell.object = obj
      return cell
    })
  )

  // Ensure every row and column has at least one occupiable cell
  // This is critical for large boards where character placement requires unique rows+cols
  for (let r = 0; r < rows; r++) {
    if (!cells[r]!.some(c => isOccupiable(c))) {
      const col = Math.floor(rng() * cols)
      const occupiableObjs = OCCUPIABLE_OBJECTS
      cells[r]![col]!.object = occupiableObjs[Math.floor(rng() * occupiableObjs.length)]
    }
  }
  for (let c = 0; c < cols; c++) {
    if (!cells.some(row => isOccupiable(row[c]!))) {
      const row = Math.floor(rng() * rows)
      const occupiableObjs = OCCUPIABLE_OBJECTS
      cells[row]![c]!.object = occupiableObjs[Math.floor(rng() * occupiableObjs.length)]
    }
  }

  // Populate room.cells
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = cells[row]![col]!
      const room = rooms.find(r => r.id === cell.roomId)
      room?.cells.push(cell.id)
    }
  }

  return { rows, cols, cells, rooms }
}

function getOccupiableCells(board: Board): CellId[] {
  const result: CellId[] = []
  for (const row of board.cells) {
    for (const cell of row) {
      if (isOccupiable(cell)) result.push(cell.id)
    }
  }
  return result
}

function synthesizeClues(
  board: Board,
  characters: Character[],
  solution: Record<string, CellId>,
  _culpritId: string,
  rng: () => number
): Clue[] {
  const clues: Clue[] = []
  let clueIdCounter = 0

  function makeId() {
    return `clue-${clueIdCounter++}`
  }

  function getCell(cellId: CellId): Cell {
    for (const row of board.cells) {
      for (const cell of row) {
        if (cell.id === cellId) return cell
      }
    }
    throw new Error(`Cell not found: ${cellId}`)
  }

  function candidateClues(charId: string): Clue[] {
    const cellId = solution[charId]!
    const cell = getCell(cellId)
    const candidates: Clue[] = []

    // in_room
    candidates.push({ id: makeId(), type: 'in_room', subject: charId, params: { roomId: cell.roomId } })

    // in_corner / not_in_corner
    const isCornerCell = (cell.row === 0 || cell.row === board.rows - 1) &&
      (cell.col === 0 || cell.col === board.cols - 1)
    if (isCornerCell) {
      candidates.push({ id: makeId(), type: 'in_corner', subject: charId, params: {} })
    } else {
      candidates.push({ id: makeId(), type: 'not_in_corner', subject: charId, params: {} })
    }

    // on_object / not_on_object
    if (cell.object && OCCUPIABLE_OBJECTS.includes(cell.object as typeof OCCUPIABLE_OBJECTS[number])) {
      candidates.push({ id: makeId(), type: 'on_object', subject: charId, params: { objectType: cell.object } })
    }

    // next_to_window
    if (cell.windows.length > 0) {
      candidates.push({ id: makeId(), type: 'next_to_window', subject: charId, params: {} })
    } else {
      candidates.push({ id: makeId(), type: 'not_next_to_window', subject: charId, params: {} })
    }

    // Relational clues with other chars
    for (const other of characters) {
      if (other.id === charId) continue
      const otherCellId = solution[other.id]!
      const otherCell = getCell(otherCellId)

      // same_room_as / not_same_room_as
      if (cell.roomId === otherCell.roomId) {
        candidates.push({ id: makeId(), type: 'same_room_as', subject: charId, params: { otherId: other.id } })
      } else {
        candidates.push({ id: makeId(), type: 'not_same_room_as', subject: charId, params: { otherId: other.id } })
      }

      // direction_of
      const rowDiff = cell.row - otherCell.row
      const colDiff = cell.col - otherCell.col
      if (rowDiff !== 0 && colDiff === 0) {
        const dir = rowDiff < 0 ? 'north' : 'south'
        candidates.push({ id: makeId(), type: 'direction_of', subject: charId, params: { otherId: other.id, direction: dir } })
      } else if (colDiff !== 0 && rowDiff === 0) {
        const dir = colDiff > 0 ? 'east' : 'west'
        candidates.push({ id: makeId(), type: 'direction_of', subject: charId, params: { otherId: other.id, direction: dir } })
      }

      // next_to
      if (Math.abs(rowDiff) + Math.abs(colDiff) === 1) {
        candidates.push({ id: makeId(), type: 'next_to', subject: charId, params: { otherId: other.id } })
      }

      // n_cols_direction_of (exact column offset)
      if (rowDiff === 0 && Math.abs(colDiff) <= 3 && colDiff !== 0) {
        const dir = colDiff > 0 ? 'east' : 'west'
        candidates.push({
          id: makeId(), type: 'n_cols_direction_of', subject: charId,
          params: { otherId: other.id, direction: dir, n: Math.abs(colDiff) }
        })
      }
    }

    return candidates
  }

  // Compute restrictiveness: how many chars are eliminated by this clue
  function restrictiveness(clue: Clue): number {
    let count = 0
    for (const cell of board.cells.flat()) {
      const placement: Record<string, CellId> = { [clue.subject]: cell.id }
      const result = evaluateClue(clue, placement, board, 'full')
      if (result === false) count++
    }
    return count
  }

  const currentPlacement = { ...solution }

  for (let round = 0; round < 20; round++) {
    const solutions = findAllSolutions(board, characters, clues, 2)
    if (solutions.length === 1) break

    if (solutions.length === 0) break

    const altSolution = solutions.find(s => {
      return characters.some(c => s[c.id] !== solution[c.id])
    })

    if (!altSolution) break

    // Find a clue that is true for canonical and false for alt
    let bestClue: Clue | null = null
    let bestScore = -1

    for (const char of seededShuffle(characters, rng)) {
      const candidates = candidateClues(char.id)
      for (const candidate of seededShuffle(candidates, rng)) {
        const canonicalResult = evaluateClue(candidate, currentPlacement, board, 'full')
        const altResult = evaluateClue(candidate, altSolution, board, 'full')
        if (canonicalResult === true && altResult === false) {
          const score = restrictiveness(candidate)
          if (score > bestScore) {
            bestScore = score
            bestClue = candidate
          }
        }
      }
    }

    if (bestClue) {
      clues.push(bestClue)
    } else {
      const shuffledChars = seededShuffle(characters, rng)
      for (const char of shuffledChars) {
        const candidates = candidateClues(char.id)
        const scored = candidates.map(c => ({ clue: c, score: restrictiveness(c) }))
        scored.sort((a, b) => b.score - a.score)
        if (scored.length > 0) {
          clues.push(scored[0]!.clue)
          break
        }
      }
    }
  }

  return clues
}

export function generatePuzzle(
  seed: number,
  level: number
): Puzzle | null {
  const rng = createPRNG(seed)
  const difficulty: 'easy' | 'medium' | 'hard' =
    level <= 10 ? 'easy' : level <= 20 ? 'medium' : 'hard'

  for (let boardAttempt = 0; boardAttempt < 3; boardAttempt++) {
    const config = getDifficultyConfig(level, rng)

    let board: Board | null = null
    for (let boardRetry = 0; boardRetry < 5; boardRetry++) {
      try {
        board = generateBoard(config, rng)
        break
      } catch {
        // Room constraint failure, retry
      }
    }
    if (!board) continue

    // Step 2: Pick reserved cell (stolen object location)
    const occupiable = getOccupiableCells(board)
    if (occupiable.length < config.numChars + 1) continue

    // Step 3: Pick culprit and reserve their room
    const shuffledOccupiable = seededShuffle(occupiable, rng)
    const reservedCellId = shuffledOccupiable[0]!
    const reservedCell = board.cells.flat().find(c => c.id === reservedCellId)!
    const reservedRoomId = reservedCell.roomId

    // Step 4: Place characters
    const charNames = seededShuffle(CHARACTER_NAMES, rng).slice(0, config.numChars)
    const characters: Character[] = charNames.map((name, i) => ({ id: `char-${i}`, name }))
    const culprit = characters[0]!

    for (let placeAttempt = 0; placeAttempt < 5; placeAttempt++) {
      const reservedRoomCells = occupiable.filter(cid => {
        const c = board!.cells.flat().find(cell => cell.id === cid)
        return c?.roomId === reservedRoomId && cid !== reservedCellId
      })
      if (reservedRoomCells.length === 0) break

      const culpritCellId = seededChoice(reservedRoomCells, rng)

      const outsideCells = seededShuffle(
        occupiable.filter(cid => {
          const c = board!.cells.flat().find(cell => cell.id === cid)
          return c?.roomId !== reservedRoomId && cid !== culpritCellId
        }),
        rng
      )

      if (outsideCells.length < config.numChars - 1) continue

      const solution: Record<string, CellId> = { [culprit.id]: culpritCellId }
      const usedRows = new Set([parseInt(culpritCellId.match(/F(\d+)/)![1]!)])
      const usedCols = new Set([parseInt(culpritCellId.match(/C(\d+)/)![1]!)])

      let valid = true
      for (let ci = 1; ci < characters.length; ci++) {
        const char = characters[ci]!
        let placed = false
        for (const cid of outsideCells) {
          const row = parseInt(cid.match(/F(\d+)/)![1]!)
          const col = parseInt(cid.match(/C(\d+)/)![1]!)
          if (usedRows.has(row) || usedCols.has(col)) continue
          solution[char.id] = cid
          usedRows.add(row)
          usedCols.add(col)
          placed = true
          break
        }
        if (!placed) { valid = false; break }
      }
      if (!valid) continue

      const clues = synthesizeClues(board, characters, solution, culprit.id, rng)

      const solutions = findAllSolutions(board, characters, clues, 2)
      if (solutions.length !== 1) continue

      return {
        id: `level-${level}`,
        level,
        difficulty,
        board,
        characters,
        clues,
        solution: {
          placement: solution,
          culpritId: culprit.id,
          stolenObjectCellId: reservedCellId,
        },
      }
    }
  }

  return null
}
