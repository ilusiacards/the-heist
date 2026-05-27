import { describe, it, expect } from 'vitest'
import { generatePuzzle } from '../logic/generator'
import { findAllSolutions } from '../logic/solver'

// Mirror the script's seed strategy: try seeds until one works
function generateLevel(level: number) {
  for (let attempt = 1; attempt <= 100; attempt++) {
    const puzzle = generatePuzzle(level * 1000 + attempt, level)
    if (puzzle) return puzzle
  }
  return null
}

describe('generator — generatePuzzle', () => {
  it('returns a puzzle for an easy level', () => {
    const puzzle = generateLevel(1)
    expect(puzzle).not.toBeNull()
  })

  it('seeded PRNG: same seed+level always produces identical puzzle', () => {
    const p1 = generatePuzzle(11002, 11)
    const p2 = generatePuzzle(11002, 11)
    expect(JSON.stringify(p1)).toBe(JSON.stringify(p2))
  })

  it('generated puzzle has exactly 1 solution', () => {
    const puzzle = generateLevel(3)
    expect(puzzle).not.toBeNull()
    if (!puzzle) return
    const solutions = findAllSolutions(puzzle.board, puzzle.characters, puzzle.clues, 2)
    expect(solutions).toHaveLength(1)
  })

  it('culprit is in the reserved room', () => {
    const puzzle = generateLevel(2)
    expect(puzzle).not.toBeNull()
    if (!puzzle) return
    const culpritCellId = puzzle.solution.placement[puzzle.solution.culpritId]
    const culpritCell = puzzle.board.cells.flat().find(c => c.id === culpritCellId)
    const stolenCell = puzzle.board.cells.flat().find(c => c.id === puzzle.solution.stolenObjectCellId)
    expect(culpritCell?.roomId).toBe(stolenCell?.roomId)
  })

  it('board invariant: occupiable cells >= numChars + 1', () => {
    const puzzle = generateLevel(1)
    expect(puzzle).not.toBeNull()
    if (!puzzle) return
    let occupiable = 0
    for (const row of puzzle.board.cells) {
      for (const cell of row) {
        const hasOccupiableObj = !cell.object || ['silla', 'alfombra', 'cama'].includes(cell.object)
        if (hasOccupiableObj) occupiable++
      }
    }
    expect(occupiable).toBeGreaterThanOrEqual(puzzle.characters.length + 1)
  })

  it('stolenObjectCellId is at the intersection of the one free row and free col', () => {
    // After placing all N chars (each in unique row+col on an (N+1)x(N+1) board),
    // exactly 1 row and 1 col remain unoccupied. The stolen-object cell must be that
    // intersection — otherwise countValidFreeCells() returns 0 and the game is unwinnable.
    for (const level of [1, 5, 11, 16, 20]) {
      const puzzle = generateLevel(level)
      expect(puzzle).not.toBeNull()
      if (!puzzle) continue
      const usedRows = new Set<number>()
      const usedCols = new Set<number>()
      for (const cellId of Object.values(puzzle.solution.placement)) {
        const cell = puzzle.board.cells.flat().find(c => c.id === cellId)!
        usedRows.add(cell.row)
        usedCols.add(cell.col)
      }
      const stolenCell = puzzle.board.cells.flat().find(c => c.id === puzzle.solution.stolenObjectCellId)!
      expect(usedRows.has(stolenCell.row)).toBe(false)
      expect(usedCols.has(stolenCell.col)).toBe(false)
    }
  })

  it('fuzz: levels 1-20 each produce a puzzle with exactly 1 solution', () => {
    for (let level = 1; level <= 20; level++) {
      const puzzle = generateLevel(level)
      expect(puzzle).not.toBeNull()
      if (!puzzle) continue
      const solutions = findAllSolutions(puzzle.board, puzzle.characters, puzzle.clues, 2)
      expect(solutions).toHaveLength(1)
    }
  }, 120000)
})
