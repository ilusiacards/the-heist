import type { Board, Cell, Character, CellId } from '../types'

export function makeCell(row: number, col: number, roomId: string, overrides: Partial<Cell> = {}): Cell {
  return {
    id: `F${row}C${col}` as CellId,
    row,
    col,
    roomId,
    windows: [],
    ...overrides,
  }
}

// 3×3 board: rooms A (top row), B (middle+bottom left), C (bottom right)
export function make3x3Board(): Board {
  const cells: Cell[][] = [
    [makeCell(0, 0, 'A'), makeCell(0, 1, 'A'), makeCell(0, 2, 'A')],
    [makeCell(1, 0, 'B'), makeCell(1, 1, 'B'), makeCell(1, 2, 'C')],
    [makeCell(2, 0, 'B'), makeCell(2, 1, 'B'), makeCell(2, 2, 'C')],
  ]
  return {
    rows: 3,
    cols: 3,
    cells,
    rooms: [
      { id: 'A', name: 'Sala A', cells: ['F0C0', 'F0C1', 'F0C2'] },
      { id: 'B', name: 'Sala B', cells: ['F1C0', 'F1C1', 'F2C0', 'F2C1'] },
      { id: 'C', name: 'Sala C', cells: ['F1C2', 'F2C2'] },
    ],
  }
}

export function make3Chars(): Character[] {
  return [
    { id: 'c1', name: 'Ana' },
    { id: 'c2', name: 'Bob' },
    { id: 'c3', name: 'Cal' },
  ]
}

export function cellId(row: number, col: number): CellId {
  return `F${row}C${col}` as CellId
}
