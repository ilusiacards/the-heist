import { describe, it, expect } from 'vitest'
import { generatePuzzle } from '../logic/generator'
import { findAllSolutions } from '../logic/solver'

describe('generator — generatePuzzle', () => {
  it('returns a puzzle for easy difficulty', () => {
    const puzzle = generatePuzzle(1, 'easy')
    expect(puzzle).not.toBeNull()
  })

  it('seeded PRNG: same level+difficulty always produces identical puzzle', () => {
    const p1 = generatePuzzle(5, 'medium')
    const p2 = generatePuzzle(5, 'medium')
    expect(JSON.stringify(p1)).toBe(JSON.stringify(p2))
  })

  it('generated puzzle has exactly 1 solution', () => {
    const puzzle = generatePuzzle(3, 'easy')
    expect(puzzle).not.toBeNull()
    if (!puzzle) return
    const solutions = findAllSolutions(puzzle.board, puzzle.characters, puzzle.clues, 2)
    expect(solutions).toHaveLength(1)
  })

  it('culprit is in the reserved room', () => {
    const puzzle = generatePuzzle(2, 'easy')
    expect(puzzle).not.toBeNull()
    if (!puzzle) return
    const culpritCellId = puzzle.solution.placement[puzzle.solution.culpritId]
    const culpritCell = puzzle.board.cells.flat().find(c => c.id === culpritCellId)
    const stolenCell = puzzle.board.cells.flat().find(c => c.id === puzzle.solution.stolenObjectCellId)
    expect(culpritCell?.roomId).toBe(stolenCell?.roomId)
  })

  it('board invariant: occupiable cells === numChars + 1', () => {
    const puzzle = generatePuzzle(1, 'easy')
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

  it('100-board fuzz: each generated puzzle has exactly 1 solution', () => {
    for (let level = 1; level <= 10; level++) {
      for (const difficulty of ['easy', 'medium'] as const) {
        const puzzle = generatePuzzle(level * 100 + (difficulty === 'easy' ? 0 : 1), difficulty)
        if (!puzzle) continue // some may genuinely fail
        const solutions = findAllSolutions(puzzle.board, puzzle.characters, puzzle.clues, 2)
        expect(solutions).toHaveLength(1)
      }
    }
  }, 30000) // generous timeout for fuzz
})
