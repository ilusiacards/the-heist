import { describe, it, expect } from 'vitest'
import type { Board, Cell, CellId, ObjectType } from '../types'
import { evaluateClue } from '../logic/evaluateClue'
import { generatePuzzle } from '../logic/generator'
import { findAllSolutions } from '../logic/solver'
import { makeCell } from './fixtures'

// Helper: build a minimal 6×6 board with given cell overrides
function make6x6Board(overrides: Partial<Record<string, Partial<Cell>>> = {}): Board {
  const cells: Cell[][] = Array.from({ length: 6 }, (_, r) =>
    Array.from({ length: 6 }, (_, c) => {
      const id = `F${r}C${c}` as CellId
      return makeCell(r, c, r < 3 ? 'room-0' : 'room-1', overrides[id] ?? {})
    })
  )
  return {
    rows: 6, cols: 6, cells,
    rooms: [
      { id: 'room-0', name: 'Sala A', cells: cells.slice(0, 3).flat().map(c => c.id) },
      { id: 'room-1', name: 'Sala B', cells: cells.slice(3).flat().map(c => c.id) },
    ],
  }
}

// Import the internal function by testing through generateBoard indirectly via generatePuzzle
// For direct testing we set up boards manually.

describe('multi-cell objects — data model', () => {
  it('Cell accepts objectSpanDir and objectPartOf fields', () => {
    const primary = makeCell(0, 0, 'A', { object: 'cama', objectSpanDir: 'h' })
    const secondary = makeCell(0, 1, 'A', { object: 'cama', objectPartOf: 'F0C0' as CellId })
    expect(primary.objectSpanDir).toBe('h')
    expect(secondary.objectPartOf).toBe('F0C0')
    expect(secondary.object).toBe('cama')
  })

  it('secondary cell has same object type as primary', () => {
    const secondary = makeCell(1, 0, 'A', { object: 'alfombra', objectPartOf: 'F0C0' as CellId })
    expect(secondary.object).toBe('alfombra')
  })
})

describe('multi-cell objects — clue evaluation', () => {
  it('on_object clue is true when character is on secondary cell of alfombra span', () => {
    const board = make6x6Board({
      F1C0: { object: 'alfombra', objectSpanDir: 'h' },
      F1C1: { object: 'alfombra', objectPartOf: 'F1C0' as CellId },
    })
    const clue = {
      id: 'c1',
      type: 'on_object' as const,
      subject: 'char-0',
      params: { objectType: 'alfombra' as ObjectType },
    }
    const placement = { 'char-0': 'F1C1' as CellId }
    expect(evaluateClue(clue, placement, board, 'full')).toBe(true)
  })

  it('on_object clue is true when character is on primary cell of alfombra span', () => {
    const board = make6x6Board({
      F1C0: { object: 'alfombra', objectSpanDir: 'h' },
      F1C1: { object: 'alfombra', objectPartOf: 'F1C0' as CellId },
    })
    const clue = {
      id: 'c1',
      type: 'on_object' as const,
      subject: 'char-0',
      params: { objectType: 'alfombra' as ObjectType },
    }
    const placement = { 'char-0': 'F1C0' as CellId }
    expect(evaluateClue(clue, placement, board, 'full')).toBe(true)
  })

  it('not_on_object clue is true when character is on a non-alfombra cell', () => {
    const board = make6x6Board({
      F1C0: { object: 'alfombra', objectSpanDir: 'h' },
      F1C1: { object: 'alfombra', objectPartOf: 'F1C0' as CellId },
    })
    const clue = {
      id: 'c1',
      type: 'not_on_object' as const,
      subject: 'char-0',
      params: { objectType: 'alfombra' as ObjectType },
    }
    const placement = { 'char-0': 'F0C0' as CellId }
    expect(evaluateClue(clue, placement, board, 'full')).toBe(true)
  })

  it('same_object_as is true when both chars are on cells of the same span', () => {
    const board = make6x6Board({
      F1C0: { object: 'alfombra', objectSpanDir: 'h' },
      F1C1: { object: 'alfombra', objectPartOf: 'F1C0' as CellId },
    })
    const clue = {
      id: 'c1',
      type: 'same_object_as' as const,
      subject: 'char-0',
      params: { otherId: 'char-1' },
    }
    const placement = { 'char-0': 'F1C0' as CellId, 'char-1': 'F1C1' as CellId }
    expect(evaluateClue(clue, placement, board, 'full')).toBe(true)
  })
})

describe('multi-cell objects — generatePuzzle', () => {
  it('no span objects appear on 5×5 boards (prob = 0)', () => {
    // 5×5 = level 1. Try 3 seeds; none should have spans.
    for (const seed of [1001, 1002, 1003]) {
      const puzzle = generatePuzzle(seed, 1)
      if (!puzzle) continue
      const allCells = puzzle.board.cells.flat()
      const hasSpan = allCells.some(c => c.objectSpanDir || c.objectPartOf)
      expect(hasSpan).toBe(false)
    }
  })

  it('stolenCell is never part of a span (objectPartOf or objectSpanDir)', () => {
    // Test across a representative spread of levels
    const levelSeeds = [
      [1, 1001], [11, 11001], [21, 21001], [21, 21002], [26, 26001],
    ] as const
    for (const [level, seed] of levelSeeds) {
      const puzzle = generatePuzzle(seed, level)
      if (!puzzle) continue
      const stolenCell = puzzle.board.cells.flat().find(
        c => c.id === puzzle.solution.stolenObjectCellId
      )
      expect(stolenCell?.objectPartOf).toBeUndefined()
      expect(stolenCell?.objectSpanDir).toBeUndefined()
    }
  }, 30000)

  it('span: secondary cell has same object as primary and objectPartOf points correctly', () => {
    // Find a puzzle with spans (8×8, level 21+) — try up to 15 seeds
    let foundSpan = false
    for (let seed = 21001; seed <= 21015; seed++) {
      const puzzle = generatePuzzle(seed, 21)
      if (!puzzle) continue
      const allCells = puzzle.board.cells.flat()
      const primary = allCells.find(c => c.objectSpanDir)
      if (!primary) continue
      foundSpan = true
      const secondary = allCells.find(c => c.objectPartOf === primary.id)
      expect(secondary).toBeDefined()
      expect(secondary?.object).toBe(primary.object)
      expect(secondary?.roomId).toBe(primary.roomId)
      if (primary.objectSpanDir === 'h') {
        expect(secondary?.col).toBe(primary.col + 1)
        expect(secondary?.row).toBe(primary.row)
      } else {
        expect(secondary?.row).toBe(primary.row + 1)
        expect(secondary?.col).toBe(primary.col)
      }
      break
    }
    if (!foundSpan) {
      console.log('Note: no span found in 15 seeds for level 21 — probabilistic test skipped')
    }
  }, 30000)

  it('span does not cross room boundaries', () => {
    for (let seed = 21001; seed <= 21008; seed++) {
      const puzzle = generatePuzzle(seed, 21)
      if (!puzzle) continue
      const allCells = puzzle.board.cells.flat()
      for (const cell of allCells) {
        if (!cell.objectSpanDir) continue
        const secondary = allCells.find(c => c.objectPartOf === cell.id)
        if (!secondary) continue
        expect(secondary.roomId).toBe(cell.roomId)
      }
    }
  }, 30000)

  it('generated puzzle has unique solution even with spans (level 21 fuzz)', () => {
    // Use seeds known to produce valid level-21 puzzles
    let successes = 0
    for (const seed of [21012, 21029, 21035]) {
      const puzzle = generatePuzzle(seed, 21)
      if (!puzzle) continue
      const solutions = findAllSolutions(puzzle.board, puzzle.characters, puzzle.clues, 2)
      expect(solutions).toHaveLength(1)
      successes++
    }
    expect(successes).toBeGreaterThan(0)
  }, 30000)
})
