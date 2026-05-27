import type { Board, Cell, CellId, Character, Clue } from '../types'
import { isOccupiable } from '../types'
import { evaluateClue } from '../logic/evaluateClue'
import { getCharacterColor } from '../logic/colors'
import styles from './BoardGrid.module.css'

interface Props {
  board: Board
  characters: Character[]
  clues: Clue[]
  placement: Partial<Record<string, CellId>>
  eliminatedRows: Set<number>
  eliminatedCols: Set<number>
  glowingCellId: CellId | null
  onCellClick: (cell: Cell) => void
  readOnly?: boolean
}

function getPlacedChar(cellId: CellId, placement: Partial<Record<string, CellId>>, characters: Character[]) {
  for (const char of characters) {
    if (placement[char.id] === cellId) return char
  }
  return null
}

const ROOM_TINTS = ['#fff7ed', '#fdf4ff', '#f0fdf4', '#eff6ff', '#fefce8']

function roomBorderStyle(cell: Cell, board: Board): React.CSSProperties {
  const style: React.CSSProperties = {}
  const getNeighbor = (r: number, c: number) =>
    r >= 0 && r < board.rows && c >= 0 && c < board.cols
      ? board.cells[r]?.[c]
      : null

  const top = getNeighbor(cell.row - 1, cell.col)
  const bottom = getNeighbor(cell.row + 1, cell.col)
  const left = getNeighbor(cell.row, cell.col - 1)
  const right = getNeighbor(cell.row, cell.col + 1)

  const roomIdx = board.rooms.findIndex(r => r.id === cell.roomId)
  style.background = ROOM_TINTS[roomIdx % ROOM_TINTS.length]

  const roomEdge = (isDiff: boolean) => isDiff ? '2px solid #92400e' : '1px solid #e2cfa3'

  style.borderTop = roomEdge(!top || top.roomId !== cell.roomId)
  style.borderBottom = roomEdge(!bottom || bottom.roomId !== cell.roomId)
  style.borderLeft = roomEdge(!left || left.roomId !== cell.roomId)
  style.borderRight = roomEdge(!right || right.roomId !== cell.roomId)

  return style
}

export function BoardGrid({
  board, characters, clues, placement,
  eliminatedRows, eliminatedCols, glowingCellId, onCellClick, readOnly
}: Props) {

  function cellClasses(cell: Cell): string {
    const parts = [styles.cell]
    const isEliminated = eliminatedRows.has(cell.row) || eliminatedCols.has(cell.col)
    if (isEliminated) parts.push(styles.eliminated!)
    if (!isOccupiable(cell)) parts.push(styles.nonOccupiable!)
    if (cell.id === glowingCellId) parts.push(styles.glowing!)
    return parts.filter(Boolean).join(' ')
  }

  function clueStatus(cell: Cell): 'valid' | 'invalid' | 'unknown' {
    if (!placement[characters[0]?.id ?? '']) return 'unknown'
    // Quick check: are any clues violated for this cell
    let anyFalse = false
    for (const clue of clues) {
      if (placement[clue.subject] !== cell.id) continue
      const result = evaluateClue(clue, placement, board, 'partial')
      if (result === false) anyFalse = true
    }
    return anyFalse ? 'invalid' : 'unknown'
  }

  return (
    <div
      className={styles.grid}
      style={{
        gridTemplateColumns: `repeat(${board.cols}, 1fr)`,
        gridTemplateRows: `repeat(${board.rows}, 1fr)`,
        pointerEvents: readOnly ? 'none' : undefined,
      }}
      role="grid"
      aria-label="Tablero del puzzle"
      aria-readonly={readOnly}
    >
      {board.cells.flat().map(cell => {
        const placedChar = getPlacedChar(cell.id, placement, characters)
        const isElim = eliminatedRows.has(cell.row) || eliminatedCols.has(cell.col)
        const borderStyle = roomBorderStyle(cell, board)
        const status = clueStatus(cell)

        return (
          <button
            key={cell.id}
            className={cellClasses(cell)}
            style={borderStyle}
            onClick={() => onCellClick(cell)}
            aria-label={`Celda fila ${cell.row + 1} columna ${cell.col + 1}${placedChar ? `, ${placedChar.name}` : ''}${isElim ? ', eliminada' : ''}`}
            role="gridcell"
            aria-selected={!!placedChar}
            disabled={isElim && !placedChar}
          >
            {/* Room name label for top-left cell of each room */}
            {cell.id === board.rooms.find(r => r.id === cell.roomId)?.cells[0] && (
              <span className={styles.roomLabel}>{board.rooms.find(r => r.id === cell.roomId)?.name}</span>
            )}

            {/* Window markers */}
            {cell.windows.map(side => (
              <span key={side} className={`${styles.window} ${styles[`window_${side}`]}`} aria-hidden="true" />
            ))}

            {/* Object icon */}
            {cell.object && (
              <span className={styles.objectIcon} aria-hidden="true">{objectEmoji(cell.object)}</span>
            )}

            {/* Character token */}
            {placedChar && (
              <span
                className={`${styles.charToken} ${status === 'invalid' ? styles.charInvalid! : ''}`}
                style={{ background: getCharacterColor(placedChar.id, characters) }}
                aria-hidden="true"
              >
                {placedChar.name.charAt(0)}
              </span>
            )}

            {/* X marker for eliminated cells without a character */}
            {isElim && !placedChar && (
              <span className={styles.xMark} aria-hidden="true">✕</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function objectEmoji(obj: string): string {
  const map: Record<string, string> = {
    silla: '🪑', alfombra: '🟫', cama: '🛏', mesa: '🪵',
    tv: '📺', planta: '🪴', estanteria: '📚', caja: '📦',
  }
  return map[obj] ?? '?'
}
