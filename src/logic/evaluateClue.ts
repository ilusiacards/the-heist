import type {
  Board,
  Cell,
  CellId,
  Clue,
  Direction,
  EvalMode,
  WallSide,
} from '../types'

type Placement = Partial<Record<string, CellId>>

function getCell(board: Board, cellId: CellId): Cell | undefined {
  for (const row of board.cells) {
    for (const cell of row) {
      if (cell.id === cellId) return cell
    }
  }
  return undefined
}

function getCellAt(board: Board, row: number, col: number): Cell | undefined {
  if (row < 0 || row >= board.rows || col < 0 || col >= board.cols) return undefined
  return board.cells[row]?.[col]
}

function isCorner(cell: Cell, board: Board): boolean {
  const topEdge = cell.row === 0
  const bottomEdge = cell.row === board.rows - 1
  const leftEdge = cell.col === 0
  const rightEdge = cell.col === board.cols - 1
  return (topEdge || bottomEdge) && (leftEdge || rightEdge)
}

function isAdjacentOrthogonal(a: Cell, b: Cell): boolean {
  return (
    (Math.abs(a.row - b.row) === 1 && a.col === b.col) ||
    (Math.abs(a.col - b.col) === 1 && a.row === b.row)
  )
}

function getDirection(from: Cell, to: Cell): Direction | null {
  if (from.col === to.col) {
    if (to.row < from.row) return 'north'
    if (to.row > from.row) return 'south'
  }
  if (from.row === to.row) {
    if (to.col > from.col) return 'east'
    if (to.col < from.col) return 'west'
  }
  return null
}

function hasWindowOnAnyWall(cell: Cell): boolean {
  return cell.windows.length > 0
}

function isBorderCell(cell: Cell, board: Board): boolean {
  return (
    cell.row === 0 ||
    cell.row === board.rows - 1 ||
    cell.col === 0 ||
    cell.col === board.cols - 1
  )
}

function isNextToWindow(cell: Cell, board: Board): boolean {
  // On border with window on outer wall
  if (isBorderCell(cell, board) && hasWindowOnAnyWall(cell)) return true

  // Adjacent to a border cell with window in the same room
  const neighbors: [number, number, WallSide][] = [
    [cell.row - 1, cell.col, 'bottom'],
    [cell.row + 1, cell.col, 'top'],
    [cell.row, cell.col - 1, 'right'],
    [cell.row, cell.col + 1, 'left'],
  ]
  for (const [nr, nc, _side] of neighbors) {
    const neighbor = getCellAt(board, nr, nc)
    if (
      neighbor &&
      neighbor.roomId === cell.roomId &&
      isBorderCell(neighbor, board) &&
      hasWindowOnAnyWall(neighbor)
    ) {
      return true
    }
  }
  return false
}

export function evaluateClue(
  clue: Clue,
  placement: Placement,
  board: Board,
  mode: EvalMode
): boolean | 'unknown' {
  const subjectCellId = placement[clue.subject]

  // In partial mode, unknown subject means unknown result (not false)
  if (!subjectCellId) {
    if (mode === 'partial') return 'unknown'
    return false
  }

  const subjectCell = getCell(board, subjectCellId)
  if (!subjectCell) return false

  switch (clue.type) {
    case 'in_room': {
      return subjectCell.roomId === clue.params.roomId
    }

    case 'not_in_room': {
      return subjectCell.roomId !== clue.params.roomId
    }

    case 'same_room_as': {
      const otherCellId = placement[clue.params.otherId]
      if (!otherCellId) return mode === 'partial' ? 'unknown' : false
      const otherCell = getCell(board, otherCellId)
      if (!otherCell) return false
      return subjectCell.roomId === otherCell.roomId
    }

    case 'not_same_room_as': {
      const otherCellId = placement[clue.params.otherId]
      if (!otherCellId) return mode === 'partial' ? 'unknown' : false
      const otherCell = getCell(board, otherCellId)
      if (!otherCell) return false
      return subjectCell.roomId !== otherCell.roomId
    }

    case 'in_corner': {
      return isCorner(subjectCell, board)
    }

    case 'not_in_corner': {
      return !isCorner(subjectCell, board)
    }

    case 'direction_of': {
      const otherCellId = placement[clue.params.otherId]
      if (!otherCellId) return mode === 'partial' ? 'unknown' : false
      const otherCell = getCell(board, otherCellId)
      if (!otherCell) return false
      // subject is in direction_of other (subject is north/south/east/west of other)
      const dir = getDirection(otherCell, subjectCell)
      return dir === clue.params.direction
    }

    case 'not_direction_of': {
      const otherCellId = placement[clue.params.otherId]
      if (!otherCellId) return mode === 'partial' ? 'unknown' : false
      const otherCell = getCell(board, otherCellId)
      if (!otherCell) return false
      const dir = getDirection(otherCell, subjectCell)
      return dir !== clue.params.direction
    }

    case 'next_to': {
      const otherCellId = placement[clue.params.otherId]
      if (!otherCellId) return mode === 'partial' ? 'unknown' : false
      const otherCell = getCell(board, otherCellId)
      if (!otherCell) return false
      return isAdjacentOrthogonal(subjectCell, otherCell)
    }

    case 'not_next_to': {
      const otherCellId = placement[clue.params.otherId]
      if (!otherCellId) return mode === 'partial' ? 'unknown' : false
      const otherCell = getCell(board, otherCellId)
      if (!otherCell) return false
      return !isAdjacentOrthogonal(subjectCell, otherCell)
    }

    case 'same_object_as': {
      const otherCellId = placement[clue.params.otherId]
      if (!otherCellId) return mode === 'partial' ? 'unknown' : false
      const otherCell = getCell(board, otherCellId)
      if (!otherCell) return false
      return subjectCell.object === otherCell.object
    }

    case 'on_object': {
      return subjectCell.object === clue.params.objectType
    }

    case 'not_on_object': {
      return subjectCell.object !== clue.params.objectType
    }

    case 'only_one_on_object': {
      // Count placed chars on this object type
      const placedOnObject = Object.keys(placement).filter(charId => {
        const cid = placement[charId]
        if (!cid) return false
        const cell = getCell(board, cid)
        return cell?.object === clue.params.objectType
      })
      if (mode === 'partial') {
        // Definitive false: 2+ already placed on the object
        if (placedOnObject.length > 1) return false
        // Can't confirm uniqueness without full placement — unplaced chars might land here
        return 'unknown'
      }
      // full mode: all chars placed
      return placedOnObject.length === 1 && placedOnObject[0] === clue.subject
    }

    case 'next_to_window': {
      return isNextToWindow(subjectCell, board)
    }

    case 'not_next_to_window': {
      return !isNextToWindow(subjectCell, board)
    }

    case 'n_cols_direction_of': {
      const { otherId, direction, n } = clue.params
      // Find cells matching otherId placement or scan all chars with that role
      const otherCellId = placement[otherId]
      if (!otherCellId) return mode === 'partial' ? 'unknown' : false
      const otherCell = getCell(board, otherCellId)
      if (!otherCell) return false
      if (direction === 'east') {
        return subjectCell.row === otherCell.row && subjectCell.col === otherCell.col + n
      } else {
        return subjectCell.row === otherCell.row && subjectCell.col === otherCell.col - n
      }
    }

    case 'n_rows_direction_of': {
      const { otherId, direction, n } = clue.params
      const otherCellId = placement[otherId]
      if (!otherCellId) return mode === 'partial' ? 'unknown' : false
      const otherCell = getCell(board, otherCellId)
      if (!otherCell) return false
      if (direction === 'north') {
        return subjectCell.col === otherCell.col && subjectCell.row === otherCell.row - n
      } else {
        return subjectCell.col === otherCell.col && subjectCell.row === otherCell.row + n
      }
    }

    default:
      return false
  }
}
