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
  // Invariant: rows === cols === numChars + 1.
  // The solver places each character in a unique row AND column. After N characters
  // are placed on an (N+1)×(N+1) board, exactly one row and one column remain free.
  // The stolen-object cell is the intersection of that free row × free col, which is
  // the single valid empty cell the player sees glowing at the end of the puzzle.
  if (level <= 10) {
    return { rows: 5, cols: 5, numChars: 4, numRooms: seededInt(3, 4, rng) }
  }
  if (level <= 15) {
    return { rows: 6, cols: 6, numChars: 5, numRooms: seededInt(4, 5, rng) }
  }
  return { rows: 7, cols: 7, numChars: 6, numRooms: seededInt(4, 5, rng) }
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

// Unary clue types constrain only the subject character and enable solver pre-filtering.
// Preferring them in synthesis reduces the solver's search space significantly.
const UNARY_CLUE_TYPES = new Set<Clue['type']>([
  'in_room', 'on_object', 'in_corner', 'not_in_corner', 'next_to_window', 'not_next_to_window',
])

// Run forward constraint propagation (human-style deduction) and return what gets placed.
// Uses 'partial' evaluateClue mode so relational clues only filter when the other
// character is already placed — exactly how a human would reason step by step.
function forwardSolveState(
  board: Board,
  characters: Character[],
  clues: Clue[]
): { placed: Record<string, CellId>; candidates: Map<string, CellId[]> } {
  const allCells = board.cells.flat()
  const occupiable = allCells.filter(c => isOccupiable(c))
  const cellById = new Map(allCells.map(c => [c.id as string, c]))

  const candidates = new Map<string, Set<CellId>>()
  for (const char of characters) {
    candidates.set(char.id, new Set(occupiable.map(c => c.id as CellId)))
  }

  const placed: Record<string, CellId> = {}
  const usedRows = new Set<number>()
  const usedCols = new Set<number>()

  function propagateRowCol() {
    let changed = false
    for (const [charId, cands] of candidates) {
      if (placed[charId]) continue
      for (const cellId of [...cands]) {
        const cell = cellById.get(cellId)!
        if (usedRows.has(cell.row) || usedCols.has(cell.col)) {
          cands.delete(cellId)
          changed = true
        }
      }
    }
    return changed
  }

  let changed = true
  while (changed) {
    changed = false

    for (const clue of clues) {
      const subject = clue.subject
      if (placed[subject]) continue
      const cands = candidates.get(subject)!

      for (const cellId of [...cands]) {
        const testPlacement: Record<string, CellId> = { ...placed, [subject]: cellId }
        const result = evaluateClue(clue, testPlacement, board, 'partial')
        if (result === false) {
          cands.delete(cellId)
          changed = true
        }
      }
    }

    for (const char of characters) {
      if (placed[char.id]) continue
      const cands = candidates.get(char.id)!
      if (cands.size === 1) {
        const cellId = [...cands][0]! as CellId
        placed[char.id] = cellId
        const cell = cellById.get(cellId)!
        usedRows.add(cell.row)
        usedCols.add(cell.col)
        changed = true
      }
    }

    if (propagateRowCol()) changed = true
  }

  return {
    placed,
    candidates: new Map([...candidates].map(([k, v]) => [k, [...v]])),
  }
}

function synthesizeClues(
  board: Board,
  characters: Character[],
  solution: Record<string, CellId>,
  _culpritId: string,
  rng: () => number
): { clues: Clue[]; unique: boolean } {
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

  // All candidate clues for charId — every entry is guaranteed TRUE for the intended solution.
  function candidateClues(charId: string): Clue[] {
    const cellId = solution[charId]!
    const cell = getCell(cellId)
    const raw: Clue[] = []

    raw.push({ id: makeId(), type: 'in_room', subject: charId, params: { roomId: cell.roomId } })

    const isCornerCell = (cell.row === 0 || cell.row === board.rows - 1) &&
      (cell.col === 0 || cell.col === board.cols - 1)
    raw.push({ id: makeId(), type: isCornerCell ? 'in_corner' : 'not_in_corner', subject: charId, params: {} })

    if (cell.object && OCCUPIABLE_OBJECTS.includes(cell.object as typeof OCCUPIABLE_OBJECTS[number])) {
      raw.push({ id: makeId(), type: 'on_object', subject: charId, params: { objectType: cell.object } })
    }

    // next_to_window / not_next_to_window: use evaluateClue so the neighbour-scan
    // logic matches the runtime evaluator exactly (cell.windows alone is insufficient).
    const ntwTest: Clue = { id: makeId(), type: 'next_to_window', subject: charId, params: {} }
    if (evaluateClue(ntwTest, solution, board, 'full') === true) {
      raw.push(ntwTest)
    } else {
      raw.push({ id: makeId(), type: 'not_next_to_window', subject: charId, params: {} })
    }

    for (const other of characters) {
      if (other.id === charId) continue
      const otherCellId = solution[other.id]!
      const otherCell = getCell(otherCellId)

      raw.push({
        id: makeId(),
        type: cell.roomId === otherCell.roomId ? 'same_room_as' : 'not_same_room_as',
        subject: charId,
        params: { otherId: other.id },
      })

      const rowDiff = cell.row - otherCell.row
      const colDiff = cell.col - otherCell.col
      if (rowDiff !== 0 && colDiff === 0) {
        raw.push({ id: makeId(), type: 'direction_of', subject: charId, params: { otherId: other.id, direction: rowDiff < 0 ? 'north' : 'south' } })
      } else if (colDiff !== 0 && rowDiff === 0) {
        raw.push({ id: makeId(), type: 'direction_of', subject: charId, params: { otherId: other.id, direction: colDiff > 0 ? 'east' : 'west' } })
      }

      if (Math.abs(rowDiff) + Math.abs(colDiff) === 1) {
        raw.push({ id: makeId(), type: 'next_to', subject: charId, params: { otherId: other.id } })
      }

      if (rowDiff === 0 && Math.abs(colDiff) <= 3 && colDiff !== 0) {
        raw.push({
          id: makeId(), type: 'n_cols_direction_of', subject: charId,
          params: { otherId: other.id, direction: colDiff > 0 ? 'east' : 'west', n: Math.abs(colDiff) },
        })
      }
    }

    // Guard: only return clues that are actually TRUE for the intended solution.
    return raw.filter(c => evaluateClue(c, solution, board, 'full') === true)
  }

  // Compute restrictiveness: how many cells does this clue eliminate for the subject
  function restrictiveness(clue: Clue): number {
    let count = 0
    for (const cell of board.cells.flat()) {
      const placement: Record<string, CellId> = { [clue.subject]: cell.id }
      const result = evaluateClue(clue, placement, board, 'full')
      if (result === false) count++
    }
    return count
  }

  // Forward-solve-guided synthesis: each round, add the clue that best reduces
  // candidate cells for an unplaced character, preferring clues that narrow a
  // character to exactly 1 cell (enabling placement and triggering chain deductions).
  for (let round = 0; round < 50; round++) {
    const { placed, candidates } = forwardSolveState(board, characters, clues)

    if (Object.keys(placed).length === characters.length) break

    let bestClue: Clue | null = null
    let bestRemaining = Infinity
    let bestIsPlacing = false
    let bestIsUnary = false

    for (const char of seededShuffle([...characters], rng)) {
      if (placed[char.id]) continue
      const currentCands = candidates.get(char.id) ?? []
      if (currentCands.length <= 1) continue

      const charClues = [
        ...candidateClues(char.id).filter(c => UNARY_CLUE_TYPES.has(c.type)),
        ...candidateClues(char.id).filter(c => !UNARY_CLUE_TYPES.has(c.type)),
      ]

      for (const clue of charClues) {
        const isDuplicate = clues.some(c =>
          c.subject === clue.subject &&
          c.type === clue.type &&
          JSON.stringify(c.params) === JSON.stringify(clue.params)
        )
        if (isDuplicate) continue

        const remaining = currentCands.filter(cellId => {
          const testPlacement: Record<string, CellId> = { ...placed, [clue.subject]: cellId }
          return evaluateClue(clue, testPlacement, board, 'partial') !== false
        })

        const remainingCount = remaining.length
        const reduction = currentCands.length - remainingCount
        if (reduction === 0) continue

        const isPlacing = remainingCount === 1
        const isUnary = UNARY_CLUE_TYPES.has(clue.type)

        const better =
          !bestClue ||
          (isPlacing && !bestIsPlacing) ||
          (isPlacing === bestIsPlacing && isUnary && !bestIsUnary) ||
          (isPlacing === bestIsPlacing && isUnary === bestIsUnary && remainingCount < bestRemaining)

        if (better) {
          bestClue = clue
          bestRemaining = remainingCount
          bestIsPlacing = isPlacing
          bestIsUnary = isUnary
        }
      }
    }

    if (bestClue) {
      clues.push(bestClue)
    } else {
      break
    }
  }

  // Accept only if forward propagation finds the EXACT intended solution
  // AND the puzzle is strictly unique (no other solution satisfies the clues).
  const { placed: finalPlaced } = forwardSolveState(board, characters, clues)
  const forwardMatchesSolution = characters.every(c => finalPlaced[c.id] === solution[c.id])
  const unique = forwardMatchesSolution && findAllSolutions(board, characters, clues, 2).length === 1

  // Every character must have at least one visible clue so players always see something.
  for (const char of characters) {
    if (!clues.some(c => c.subject === char.id)) {
      const candidates = candidateClues(char.id)
      if (candidates.length > 0) {
        const scored = candidates.map(c => ({ clue: c, score: restrictiveness(c) }))
        scored.sort((a, b) => b.score - a.score)
        clues.push(scored[0]!.clue)
      }
    }
  }

  return { clues, unique }
}

export function generatePuzzle(
  seed: number,
  level: number
): Puzzle | null {
  const rng = createPRNG(seed)
  const difficulty: 'easy' | 'medium' | 'hard' =
    level <= 10 ? 'easy' : level <= 20 ? 'medium' : 'hard'

  for (let boardAttempt = 0; boardAttempt < 5; boardAttempt++) {
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

    const charNames = seededShuffle(CHARACTER_NAMES, rng).slice(0, config.numChars)
    const characters: Character[] = charNames.map((name, i) => ({ id: `char-${i}`, name }))

    for (let placeAttempt = 0; placeAttempt < 30; placeAttempt++) {
      // Shuffle all rows and cols independently, then split:
      //   rows[0..numChars-1]  → one row per character
      //   rows[numChars]       → the single FREE row  (stolen-object row)
      //   cols[0..numChars-1]  → paired with a random permutation of the char cols
      //   cols[numChars]       → the single FREE col  (stolen-object col)
      //
      // Stolen-object cell = board[freeRow][freeCol]. This is the one cell that
      // remains unoccupied and not in any eliminated row/col, so it's the unique
      // "glowing" cell after all characters are placed.
      const allRows = Array.from({ length: config.rows }, (_, i) => i)
      const allCols = Array.from({ length: config.cols }, (_, i) => i)
      const shuffledRows = seededShuffle(allRows, rng)
      const shuffledCols = seededShuffle(allCols, rng)

      const freeRow = shuffledRows[config.numChars]!
      const freeCol = shuffledCols[config.numChars]!
      const charRows = shuffledRows.slice(0, config.numChars)
      // Permute char cols independently so (charRows[i], charCols[i]) is random
      const charCols = seededShuffle(shuffledCols.slice(0, config.numChars), rng)

      // Stolen-object cell must be occupiable (player clicks it to accuse)
      const stolenCell = board.cells[freeRow]![freeCol]!
      if (!isOccupiable(stolenCell)) continue

      // Place all characters; each must also be on an occupiable cell
      const solution: Record<string, CellId> = {}
      let valid = true
      for (let i = 0; i < config.numChars; i++) {
        const cell = board.cells[charRows[i]!]![charCols[i]!]!
        if (!isOccupiable(cell)) { valid = false; break }
        solution[characters[i]!.id] = cell.id
      }
      if (!valid) continue

      // Exactly one character must share a room with the stolen-object cell.
      // That character is the culprit: when the player clicks the glowing cell
      // (stolen object), only one suspect is in that room → unambiguous accusation.
      const stolenRoomId = stolenCell.roomId
      const charsInStolenRoom = characters.filter(c => {
        const cellId = solution[c.id]!
        return board!.cells.flat().find(x => x.id === cellId)?.roomId === stolenRoomId
      })
      if (charsInStolenRoom.length !== 1) continue

      const culprit = charsInStolenRoom[0]!

      const { clues, unique } = synthesizeClues(board, characters, solution, culprit.id, rng)
      if (!unique) continue

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
          stolenObjectCellId: stolenCell.id,
        },
      }
    }
  }

  return null
}
