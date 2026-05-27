import type { Board, Character, CellId } from '../types'

export function computeEliminatedSets(
  board: Board,
  characters: Character[],
  placement: Partial<Record<string, CellId>>
): { eliminatedRows: Set<number>; eliminatedCols: Set<number> } {
  const eliminatedRows = new Set<number>()
  const eliminatedCols = new Set<number>()
  for (const char of characters) {
    const cellId = placement[char.id]
    if (!cellId) continue
    const cell = board.cells.flat().find(c => c.id === cellId)
    if (cell) {
      eliminatedRows.add(cell.row)
      eliminatedCols.add(cell.col)
    }
  }
  return { eliminatedRows, eliminatedCols }
}
