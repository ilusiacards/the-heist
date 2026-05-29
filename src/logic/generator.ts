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

const ROOM_ARTICLES: Record<string, string> = {
  'Dormitorio': 'el dormitorio',
  'Cocina':     'la cocina',
  'Sala':       'la sala',
  'Baño':       'el baño',
  'Biblioteca': 'la biblioteca',
  'Estudio':    'el estudio',
  'Comedor':    'el comedor',
  'Pasillo':    'el pasillo',
  'Taller':     'el taller',
  'Bodega':     'la bodega',
}

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
  if (level <= 20) {
    return { rows: 7, cols: 7, numChars: 6, numRooms: seededInt(4, 5, rng) }
  }
  if (level <= 25) {
    // 8×8: benchmark confirmed viable after OPT-1/2/3
    return { rows: 8, cols: 8, numChars: 7, numRooms: seededInt(5, 6, rng) }
  }
  if (level <= 30) {
    return { rows: 9, cols: 9, numChars: 8, numRooms: seededInt(6, 7, rng) }
  }
  if (level <= 37) {
    return { rows: 10, cols: 10, numChars: 9, numRooms: seededInt(7, 8, rng) }
  }
  // 11×11: extreme difficulty, levels 38+
  return { rows: 11, cols: 11, numChars: 10, numRooms: seededInt(8, 9, rng) }
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
  const rooms: Room[] = Array.from({ length: numRooms }, (_, i) => {
    const name = ROOM_NAMES[i] ?? `Habitación ${i + 1}`
    return {
      id: `room-${i}`,
      name,
      articleName: ROOM_ARTICLES[name] ?? name.toLowerCase(),
      cells: [],
    }
  })

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

  // Upgrade some cama/alfombra objects to 2-cell spans
  applySpanUpgrades(cells, rows, cols, rng)

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

const SPAN_PROB: Record<number, number> = { 5: 0, 6: 0.20, 7: 0.35, 8: 0.50, 9: 0.60, 10: 0.65, 11: 0.70 }

function applySpanUpgrades(cells: Cell[][], rows: number, cols: number, rng: () => number): void {
  const prob = SPAN_PROB[rows] ?? 0
  if (prob === 0) return
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = cells[r]![c]!
      if (cell.object !== 'cama' && cell.object !== 'alfombra') continue
      if (cell.objectPartOf) continue // already a secondary cell
      if (rng() > prob) continue
      const dirs: Array<[number, number, 'h' | 'v']> = []
      if (c + 1 < cols) dirs.push([r, c + 1, 'h'])
      if (r + 1 < rows) dirs.push([r + 1, c, 'v'])
      if (dirs.length === 2 && rng() < 0.5) dirs.reverse()
      for (const [nr, nc, dir] of dirs) {
        const neighbor = cells[nr]![nc]!
        if (neighbor.object !== undefined) continue
        if (neighbor.roomId !== cell.roomId) continue
        cell.objectSpanDir = dir
        neighbor.object = cell.object
        neighbor.objectPartOf = cell.id
        break
      }
    }
  }
}

// Unary clue types constrain only the subject character and enable solver pre-filtering.
// Preferring them in synthesis reduces the solver's search space significantly.
const UNARY_CLUE_TYPES = new Set<Clue['type']>([
  'in_room', 'on_object', 'in_corner', 'not_in_corner', 'next_to_window', 'not_next_to_window',
])

// Incremental constraint propagation state for clue synthesis.
// Avoids re-running forwardSolveState from scratch each synthesis round.
export type SynthesisState = {
  candidates: Map<string, Set<CellId>>
  placed: Record<string, CellId>
  usedRows: Set<number>
  usedCols: Set<number>
  contradiction: boolean
}

export function buildInitialState(board: Board, characters: Character[]): SynthesisState {
  const occupiable = board.cells.flat().filter(c => isOccupiable(c)).map(c => c.id as CellId)
  const candidates = new Map<string, Set<CellId>>()
  for (const char of characters) {
    candidates.set(char.id, new Set(occupiable))
  }
  return { candidates, placed: {}, usedRows: new Set(), usedCols: new Set(), contradiction: false }
}

// Apply a new clue to the synthesis state using an AC-3 worklist algorithm.
// Exported for testing; not used in the synthesis loop (which uses forwardSolveState for accuracy).
export function applyClueToState(
  state: SynthesisState,
  clue: Clue,
  board: Board,
  characters: Character[],
  prevClues: Clue[],
  cellById: Map<string, Cell>
): SynthesisState {
  // Reduce the subject's candidates based on the new clue.
  // Use state.placed so relational clues (e.g. direction_of(B, A)) can filter correctly
  // when the referenced character A is already placed.
  if (!state.placed[clue.subject]) {
    const subjectCands = state.candidates.get(clue.subject)!
    for (const cellId of [...subjectCands]) {
      if (evaluateClue(clue, { ...state.placed, [clue.subject]: cellId }, board, 'partial') === false) {
        subjectCands.delete(cellId)
      }
    }
    if (subjectCands.size === 0) return { ...state, contradiction: true }
  }

  const worklist = new Set<string>([clue.subject])

  while (worklist.size > 0) {
    const charId = worklist.values().next().value as string
    worklist.delete(charId)

    if (state.placed[charId]) continue

    const cands = state.candidates.get(charId)!
    const prevSize = cands.size

    // Row/col exclusion based on currently placed characters
    for (const cellId of [...cands]) {
      const cell = cellById.get(cellId as string)!
      if (state.usedRows.has(cell.row) || state.usedCols.has(cell.col)) {
        cands.delete(cellId)
      }
    }

    // Re-evaluate all previously accumulated clues where charId is the subject
    for (const prevClue of prevClues) {
      if (prevClue.subject !== charId) continue
      for (const cellId of [...cands]) {
        const result = evaluateClue(prevClue, { ...state.placed, [charId]: cellId }, board, 'partial')
        if (result === false) cands.delete(cellId)
      }
    }

    if (cands.size === 0) return { ...state, contradiction: true }

    // Fix the character when exactly 1 candidate remains
    if (cands.size === 1) {
      const cellId = [...cands][0]! as CellId
      state.placed[charId] = cellId
      const cell = cellById.get(cellId as string)!
      state.usedRows.add(cell.row)
      state.usedCols.add(cell.col)

      // Propagate row/col exclusion to all other unplaced characters
      for (const other of characters) {
        if (other.id === charId || state.placed[other.id]) continue
        const otherCands = state.candidates.get(other.id)!
        const otherBefore = otherCands.size
        for (const cid of [...otherCands]) {
          const c = cellById.get(cid as string)!
          if (c.row === cell.row || c.col === cell.col) otherCands.delete(cid)
        }
        if (otherCands.size === 0) return { ...state, contradiction: true }
        if (otherCands.size < otherBefore) worklist.add(other.id)
      }
    }

    // Reverse arc propagation: if this character's domain shrank (or was placed),
    // queue all unplaced characters whose relational clues reference charId as otherId.
    // This handles cases like direction_of(X, Y) where Y's narrowed domain further constrains X.
    const afterSize = state.placed[charId] !== undefined ? 1 : cands.size
    if (afterSize < prevSize || state.placed[charId] !== undefined) {
      for (const prevClue of prevClues) {
        const params = prevClue.params as Record<string, unknown>
        if (params.otherId === charId && !state.placed[prevClue.subject]) {
          worklist.add(prevClue.subject)
        }
      }
    }
  }

  return state
}

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

  // Pre-compute once for O(1) cell lookup throughout synthesis
  const cellById = new Map<string, Cell>(board.cells.flat().map(c => [c.id as string, c]))

  function makeId() {
    return `clue-${clueIdCounter++}`
  }

  function getCell(cellId: CellId): Cell {
    return cellById.get(cellId as string)!
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

      // NOTE: n_rows_direction_of would require colDiff === 0, which is impossible given
      // the Latin square invariant (each character has a unique column). Not emitted.
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

  // Forward-solve-guided synthesis: each round uses forwardSolveState to get tight,
  // fully-propagated candidates. This ensures pickBestClue operates on accurate state,
  // which is critical for synthesis quality (success rate) on large boards.
  //
  // For large boards (numChars ≥ 9): use more rounds and disable OPT-3.
  // The Latin square structure means the last character is always auto-placed once N-1
  // are placed via forward deduction — so "nearly solved" placements are still winnable.
  // For 11×11 (numChars=10): each attempt is cheap (~0.3s) so skip OPT-3 entirely.
  const isLargeBoard = characters.length >= 9
  const is11x11 = characters.length >= 10
  const maxRounds = is11x11 ? 100 : isLargeBoard ? 70 : 50
  // OPT-3 threshold: disabled for 11×11 (always continue to max rounds).
  const opt3Threshold = is11x11 ? 0 : Math.max(1, characters.length - (isLargeBoard ? 5 : 3))

  // Anticipatory relational clues: for large boards, once half the chars are placed,
  // also consider same_room_as/not_same_room_as for UNPLACED other chars (future value).
  // These have zero immediate reduction in partial mode but help once otherId is placed.
  const ANTICIPATORY_TYPES = new Set<Clue['type']>(['same_room_as', 'not_same_room_as'])

  for (let round = 0; round < maxRounds; round++) {
    const { placed, candidates } = forwardSolveState(board, characters, clues)
    const placedCount = Object.keys(placed).length

    if (placedCount === characters.length) break

    // OPT-3: Early failure detection — bail if too few chars placed at round 20.
    if (round === 20 && placedCount < opt3Threshold) break

    let bestClue: Clue | null = null
    let bestRemaining = Infinity
    let bestIsPlacing = false
    let bestIsUnary = false

    // Pass 1: find the best immediately-reducing clue (normal greedy selection).
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

    // Pass 2 (large boards only): if no reducing clue found, add an anticipatory
    // relational clue for an unplaced character. For 11×11, do this from round 5
    // (early seeding of room relationships before characters start being placed).
    // These clues have zero immediate reduction but activate once otherId is placed.
    const anticipatoryMinRound = is11x11 ? 5 : Math.ceil(characters.length / 2)
    if (!bestClue && isLargeBoard && (placedCount >= anticipatoryMinRound || round >= anticipatoryMinRound)) {
      outer: for (const char of seededShuffle([...characters], rng)) {
        if (placed[char.id]) continue
        for (const clue of candidateClues(char.id)) {
          if (!ANTICIPATORY_TYPES.has(clue.type)) continue
          const params = clue.params as { otherId?: string }
          if (!params.otherId || placed[params.otherId]) continue // otherId already placed → was handled in pass 1
          const isDuplicate = clues.some(c =>
            c.subject === clue.subject &&
            c.type === clue.type &&
            JSON.stringify(c.params) === JSON.stringify(clue.params)
          )
          if (isDuplicate) continue
          bestClue = clue
          bestIsPlacing = false
          bestIsUnary = false
          bestRemaining = Infinity
          break outer
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

  // OPT-1: Separate board geometry from character placement.
  // Board generation is O(N²) and expensive; placement is O(N) and cheap.
  // Strategy: generate fewer boards but try many more placements per board.
  // 3 boards × 300 placements = 900 attempts (was 5 boards × 30 = 150).
  const BOARD_ATTEMPTS = 3
  const PLACEMENT_ATTEMPTS_PER_BOARD = 300

  for (let boardAttempt = 0; boardAttempt < BOARD_ATTEMPTS; boardAttempt++) {
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

    // Characters are fixed per board (not re-shuffled each placement).
    const charNames = seededShuffle(CHARACTER_NAMES, rng).slice(0, config.numChars)
    const characters: Character[] = charNames.map((name, i) => ({ id: `char-${i}`, name }))

    // OPT-1b: Pre-compute cell→roomId map to avoid O(N²) scans per placement.
    const cellToRoom = new Map<string, string>()
    for (const row of board.cells) {
      for (const cell of row) {
        cellToRoom.set(cell.id, cell.roomId)
      }
    }

    // OPT-2: Deducibility threshold — minimum unique rooms required.
    // Placements where many sospechosos share a room are hard to synthesize
    // (fewer distinct in_room clues). Require at least (numChars - 2) unique rooms
    // so at most 2 pairs of sospechosos share a room.
    const minUniqueRooms = Math.max(2, config.numChars - 2)

    for (let placeAttempt = 0; placeAttempt < PLACEMENT_ATTEMPTS_PER_BOARD; placeAttempt++) {
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
      // Stolen cell must not be part of any object span (keeps accusation mechanic simple)
      if (stolenCell.objectPartOf || stolenCell.objectSpanDir) continue

      // Place all characters; each must also be on an occupiable cell
      const solution: Record<string, CellId> = {}
      let valid = true
      for (let i = 0; i < config.numChars; i++) {
        const cell = board.cells[charRows[i]!]![charCols[i]!]!
        if (!isOccupiable(cell)) { valid = false; break }
        solution[characters[i]!.id] = cell.id
      }
      if (!valid) continue

      // OPT-2: Deducibility pre-filter — count unique rooms in this placement.
      // Cheap O(N) check before the expensive synthesizeClues call.
      const uniqueRooms = new Set(characters.map(c => cellToRoom.get(solution[c.id]!))).size
      if (uniqueRooms < minUniqueRooms) continue

      // Exactly one character must share a room with the stolen-object cell.
      // That character is the culprit: when the player clicks the glowing cell
      // (stolen object), only one suspect is in that room → unambiguous accusation.
      // OPT-1b: use pre-computed cellToRoom map instead of O(N²) flat().find().
      const stolenRoomId = stolenCell.roomId
      const charsInStolenRoom = characters.filter(c => cellToRoom.get(solution[c.id]!) === stolenRoomId)
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
