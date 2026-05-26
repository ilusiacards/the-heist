import { describe, it, expect } from 'vitest'
import { evaluateClue } from '../logic/evaluateClue'
import type { Clue } from '../types'
import { make3x3Board, cellId } from './fixtures'

const board = make3x3Board()

describe('evaluateClue — in_room', () => {
  it('true when subject is in room', () => {
    const clue: Clue = { id: '1', type: 'in_room', subject: 'c1', params: { roomId: 'A' } }
    expect(evaluateClue(clue, { c1: cellId(0, 0) }, board, 'full')).toBe(true)
  })
  it('false when subject is in different room', () => {
    const clue: Clue = { id: '1', type: 'in_room', subject: 'c1', params: { roomId: 'A' } }
    expect(evaluateClue(clue, { c1: cellId(1, 0) }, board, 'full')).toBe(false)
  })
  it('unknown when subject not placed (partial mode)', () => {
    const clue: Clue = { id: '1', type: 'in_room', subject: 'c1', params: { roomId: 'A' } }
    expect(evaluateClue(clue, {}, board, 'partial')).toBe('unknown')
  })
})

describe('evaluateClue — in_corner', () => {
  it('true for corner cell (0,0)', () => {
    const clue: Clue = { id: '1', type: 'in_corner', subject: 'c1', params: {} }
    expect(evaluateClue(clue, { c1: cellId(0, 0) }, board, 'full')).toBe(true)
  })
  it('true for corner cell (2,2)', () => {
    const clue: Clue = { id: '1', type: 'in_corner', subject: 'c1', params: {} }
    expect(evaluateClue(clue, { c1: cellId(2, 2) }, board, 'full')).toBe(true)
  })
  it('false for non-corner cell (1,1)', () => {
    const clue: Clue = { id: '1', type: 'in_corner', subject: 'c1', params: {} }
    expect(evaluateClue(clue, { c1: cellId(1, 1) }, board, 'full')).toBe(false)
  })
  it('false for edge (not corner) cell (0,1)', () => {
    const clue: Clue = { id: '1', type: 'in_corner', subject: 'c1', params: {} }
    expect(evaluateClue(clue, { c1: cellId(0, 1) }, board, 'full')).toBe(false)
  })
})

describe('evaluateClue — direction_of', () => {
  it('true when subject is directly north of other', () => {
    const clue: Clue = { id: '1', type: 'direction_of', subject: 'c1', params: { otherId: 'c2', direction: 'north' } }
    // c1 at (0,1), c2 at (1,1) → c1 is north of c2
    expect(evaluateClue(clue, { c1: cellId(0, 1), c2: cellId(1, 1) }, board, 'full')).toBe(true)
  })
  it('false for diagonal (not cardinal)', () => {
    const clue: Clue = { id: '1', type: 'direction_of', subject: 'c1', params: { otherId: 'c2', direction: 'north' } }
    // c1 at (0,0), c2 at (1,1) → diagonal, not north
    expect(evaluateClue(clue, { c1: cellId(0, 0), c2: cellId(1, 1) }, board, 'full')).toBe(false)
  })
  it('false when subject is in same cell as reference (self-compare)', () => {
    const clue: Clue = { id: '1', type: 'direction_of', subject: 'c1', params: { otherId: 'c2', direction: 'north' } }
    expect(evaluateClue(clue, { c1: cellId(1, 1), c2: cellId(1, 1) }, board, 'full')).toBe(false)
  })
  it('unknown when other not placed (partial mode)', () => {
    const clue: Clue = { id: '1', type: 'direction_of', subject: 'c1', params: { otherId: 'c2', direction: 'north' } }
    expect(evaluateClue(clue, { c1: cellId(0, 1) }, board, 'partial')).toBe('unknown')
  })
})

describe('evaluateClue — same_room_as', () => {
  it('true when both in same room', () => {
    const clue: Clue = { id: '1', type: 'same_room_as', subject: 'c1', params: { otherId: 'c2' } }
    expect(evaluateClue(clue, { c1: cellId(0, 0), c2: cellId(0, 2) }, board, 'full')).toBe(true)
  })
  it('false when in different rooms', () => {
    const clue: Clue = { id: '1', type: 'same_room_as', subject: 'c1', params: { otherId: 'c2' } }
    expect(evaluateClue(clue, { c1: cellId(0, 0), c2: cellId(1, 0) }, board, 'full')).toBe(false)
  })
  it('unknown when other not placed (partial mode)', () => {
    const clue: Clue = { id: '1', type: 'same_room_as', subject: 'c1', params: { otherId: 'c2' } }
    expect(evaluateClue(clue, { c1: cellId(0, 0) }, board, 'partial')).toBe('unknown')
  })
})

describe('evaluateClue — next_to', () => {
  it('true for orthogonally adjacent cells', () => {
    const clue: Clue = { id: '1', type: 'next_to', subject: 'c1', params: { otherId: 'c2' } }
    expect(evaluateClue(clue, { c1: cellId(0, 0), c2: cellId(0, 1) }, board, 'full')).toBe(true)
  })
  it('false for diagonal adjacency', () => {
    const clue: Clue = { id: '1', type: 'next_to', subject: 'c1', params: { otherId: 'c2' } }
    expect(evaluateClue(clue, { c1: cellId(0, 0), c2: cellId(1, 1) }, board, 'full')).toBe(false)
  })
})

describe('evaluateClue — next_to_window', () => {
  it('true for border cell with window', () => {
    const boardWithWindow = {
      ...board,
      cells: board.cells.map((row, r) =>
        row.map((cell, c) =>
          r === 0 && c === 0 ? { ...cell, windows: ['top' as const] } : cell
        )
      ),
    }
    const clue: Clue = { id: '1', type: 'next_to_window', subject: 'c1', params: {} }
    expect(evaluateClue(clue, { c1: cellId(0, 0) }, boardWithWindow, 'full')).toBe(true)
  })
  it('false for interior cell with no windows nearby', () => {
    const clue: Clue = { id: '1', type: 'next_to_window', subject: 'c1', params: {} }
    expect(evaluateClue(clue, { c1: cellId(1, 1) }, board, 'full')).toBe(false)
  })
})

describe('evaluateClue — only_one_on_object', () => {
  const boardWithChairs = {
    ...board,
    cells: board.cells.map((row, r) =>
      row.map((cell, c) =>
        (r === 0 && c === 0) || (r === 1 && c === 0) ? { ...cell, object: 'silla' as const } : cell
      )
    ),
  }

  it('unknown in partial mode when not all chars placed', () => {
    const clue: Clue = { id: '1', type: 'only_one_on_object', subject: 'c1', params: { objectType: 'silla' } }
    expect(evaluateClue(clue, { c1: cellId(0, 0) }, boardWithChairs, 'partial')).toBe('unknown')
  })
  it('false when two chars are on the same object type', () => {
    const clue: Clue = { id: '1', type: 'only_one_on_object', subject: 'c1', params: { objectType: 'silla' } }
    expect(evaluateClue(clue, { c1: cellId(0, 0), c2: cellId(1, 0), c3: cellId(0, 2) }, boardWithChairs, 'full')).toBe(false)
  })
  it('true when only subject is on the object type', () => {
    const clue: Clue = { id: '1', type: 'only_one_on_object', subject: 'c1', params: { objectType: 'silla' } }
    expect(evaluateClue(clue, { c1: cellId(0, 0), c2: cellId(0, 1), c3: cellId(0, 2) }, boardWithChairs, 'full')).toBe(true)
  })
})

describe('evaluateClue — n_cols_direction_of', () => {
  it('true when subject is exactly N cols east of other', () => {
    const clue: Clue = { id: '1', type: 'n_cols_direction_of', subject: 'c1', params: { otherId: 'c2', direction: 'east', n: 2 } }
    expect(evaluateClue(clue, { c1: cellId(1, 2), c2: cellId(1, 0) }, board, 'full')).toBe(true)
  })
  it('false when wrong column offset', () => {
    const clue: Clue = { id: '1', type: 'n_cols_direction_of', subject: 'c1', params: { otherId: 'c2', direction: 'east', n: 2 } }
    expect(evaluateClue(clue, { c1: cellId(1, 1), c2: cellId(1, 0) }, board, 'full')).toBe(false)
  })
  it('unknown when other not placed (partial mode)', () => {
    const clue: Clue = { id: '1', type: 'n_cols_direction_of', subject: 'c1', params: { otherId: 'c2', direction: 'east', n: 2 } }
    expect(evaluateClue(clue, { c1: cellId(1, 2) }, board, 'partial')).toBe('unknown')
  })
})

describe('evaluateClue — on_object / not_on_object', () => {
  const boardWithTV = {
    ...board,
    cells: board.cells.map((row, r) =>
      row.map((cell, c) => r === 1 && c === 1 ? { ...cell, object: 'tv' as const } : cell)
    ),
  }
  it('on_object: true when sitting on correct object', () => {
    const clue: Clue = { id: '1', type: 'on_object', subject: 'c1', params: { objectType: 'tv' } }
    expect(evaluateClue(clue, { c1: cellId(1, 1) }, boardWithTV, 'full')).toBe(true)
  })
  it('not_on_object: true when not on that object', () => {
    const clue: Clue = { id: '1', type: 'not_on_object', subject: 'c1', params: { objectType: 'tv' } }
    expect(evaluateClue(clue, { c1: cellId(0, 0) }, boardWithTV, 'full')).toBe(true)
  })
})
