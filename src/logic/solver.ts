import type { Board, Clue, Character, CellId, Solution } from '../types'
import { isOccupiable } from '../types'
import { evaluateClue } from './evaluateClue'

type Placement = Partial<Record<string, CellId>>

function getOccupiableCells(board: Board): CellId[] {
  const cells: CellId[] = []
  for (const row of board.cells) {
    for (const cell of row) {
      if (isOccupiable(cell)) cells.push(cell.id)
    }
  }
  return cells
}

// MRV: character with fewest valid candidates gets placed first
function pickNextCharacter(
  characters: Character[],
  placement: Placement,
  candidates: Record<string, Set<CellId>>
): string | null {
  let best: string | null = null
  let bestCount = Infinity
  for (const char of characters) {
    if (placement[char.id] !== undefined) continue
    const count = candidates[char.id]?.size ?? 0
    if (count < bestCount) {
      bestCount = count
      best = char.id
    }
  }
  return best
}

function propagate(
  placement: Placement,
  charId: string,
  cellId: CellId,
  candidates: Record<string, Set<CellId>>,
  characters: Character[]
): Record<string, Set<CellId>> {
  const next: Record<string, Set<CellId>> = {}
  const cell = parseCellId(cellId)
  for (const char of characters) {
    if (char.id === charId || placement[char.id] !== undefined) continue
    next[char.id] = new Set<CellId>()
    for (const cid of candidates[char.id] ?? []) {
      const c = parseCellId(cid)
      // Row+col exclusion
      if (c.row === cell.row || c.col === cell.col) continue
      next[char.id].add(cid)
    }
  }
  return next
}

function parseCellId(id: CellId): { row: number; col: number } {
  const m = id.match(/^F(\d+)C(\d+)$/)
  if (!m) throw new Error(`Invalid CellId: ${id}`)
  return { row: parseInt(m[1]!), col: parseInt(m[2]!) }
}

function solve(
  board: Board,
  characters: Character[],
  clues: Clue[],
  placement: Placement,
  candidates: Record<string, Set<CellId>>,
  results: Array<Record<string, CellId>>,
  limit: number,
  depth: number
): void {
  if (results.length >= limit) return

  const charId = pickNextCharacter(characters, placement, candidates)
  if (charId === null) {
    // All placed — verify all clues pass
    const full = placement as Record<string, CellId>
    for (const clue of clues) {
      const result = evaluateClue(clue, full, board, 'partial')
      if (result === false) return
    }
    results.push({ ...full })
    return
  }

  // Watchdog: excessive backtracking
  if (depth > characters.length * 3) {
    console.warn(`[solver] backtrack depth ${depth} exceeds watchdog threshold`)
  }

  const myCandidates = candidates[charId] ?? new Set<CellId>()
  for (const cellId of myCandidates) {
    const newPlacement = { ...placement, [charId]: cellId }

    // Quick clue check with partial placement
    let feasible = true
    for (const clue of clues) {
      const result = evaluateClue(clue, newPlacement, board, 'partial')
      if (result === false) {
        feasible = false
        break
      }
    }
    if (!feasible) continue

    const nextCandidates = propagate(newPlacement, charId, cellId, candidates, characters)
    // Check if any remaining character has 0 candidates
    let dead = false
    for (const char of characters) {
      if (newPlacement[char.id] !== undefined) continue
      if ((nextCandidates[char.id]?.size ?? 0) === 0) {
        dead = true
        break
      }
    }
    if (dead) continue

    solve(board, characters, clues, newPlacement, nextCandidates, results, limit, depth + 1)
    if (results.length >= limit) return
  }
}

export function findAllSolutions(
  board: Board,
  characters: Character[],
  clues: Clue[],
  limit = 2
): Array<Record<string, CellId>> {
  const occupiable = getOccupiableCells(board)

  const candidates: Record<string, Set<CellId>> = {}
  for (const char of characters) {
    candidates[char.id] = new Set(occupiable)
  }

  const results: Array<Record<string, CellId>> = []
  solve(board, characters, clues, {}, candidates, results, limit, 0)
  return results
}

export function validateUniqueness(
  board: Board,
  characters: Character[],
  clues: Clue[]
): boolean {
  const solutions = findAllSolutions(board, characters, clues, 2)
  return solutions.length === 1
}

export function solvePuzzle(
  _board: Board,
  characters: Character[],
  clues: Clue[],
  _placement: Partial<Record<string, CellId>>
): Record<string, CellId> | null {
  const solutions = findAllSolutions(_board, characters, clues, 1)
  return solutions[0] ?? null
}

// Build a solution record from a known correct placement
export function buildSolution(
  placement: Record<string, CellId>,
  _board: Board,
  reservedCellId: CellId,
  culpritId: string
): Solution {
  return {
    placement,
    culpritId,
    stolenObjectCellId: reservedCellId,
  }
}
