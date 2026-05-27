#!/usr/bin/env bun
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { evaluateClue } from '../src/logic/evaluateClue'
import { isOccupiable } from '../src/types'
import type { Board, Character, Clue, CellId } from '../src/types'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUZZLE_DIR = join(__dirname, '..', 'public', 'puzzles')

function forwardSolve(
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

let allSolved = true
for (let i = 1; i <= 30; i++) {
  const puzzle = JSON.parse(readFileSync(join(PUZZLE_DIR, `level-${i}.json`), 'utf8'))
  const { placed, candidates } = forwardSolve(puzzle.board, puzzle.characters, puzzle.clues)
  const placedCount = Object.keys(placed).length
  const total = puzzle.characters.length
  const solved = placedCount === total

  // Verify solution matches real solution
  let correct = true
  if (solved) {
    for (const char of puzzle.characters as Character[]) {
      if (placed[char.id] !== puzzle.solution.placement[char.id]) {
        correct = false
        break
      }
    }
  }

  if (!solved) allSolved = false

  const label = solved
    ? (correct ? 'SOLVED ✓' : 'WRONG SOLUTION ✗')
    : `PARTIAL ${placedCount}/${total} ✗`

  const diff = solved ? '' : ` — stuck: ${
    puzzle.characters
      .filter((c: Character) => !placed[c.id])
      .map((c: Character) => `${c.name}(${candidates.get(c.id)?.length ?? '?'} opts)`)
      .join(', ')
  }`

  console.log(`Level ${String(i).padStart(2)}: ${label}${diff}`)
}

console.log(allSolved ? '\nAll 30 levels forward-solvable!' : '\nSome levels are NOT forward-solvable.')
process.exit(allSolved ? 0 : 1)
