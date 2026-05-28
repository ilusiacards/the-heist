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
              <span className={styles.objectIcon} aria-hidden="true"><ObjectIcon obj={cell.object} /></span>
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

function ObjectIcon({ obj }: { obj: string }) {
  const icons: Record<string, JSX.Element> = {
    silla: (
      <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%" className={styles.animSilla}>
        <line x1="7" y1="3" x2="7" y2="11" stroke="#78350f" strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="17" y1="3" x2="17" y2="11" stroke="#78350f" strokeWidth="2.2" strokeLinecap="round"/>
        <rect x="5" y="3" width="14" height="5" rx="2" fill="#d97706" stroke="#92400e" strokeWidth="1.1"/>
        <rect x="4" y="11" width="16" height="4" rx="2" fill="#d97706" stroke="#92400e" strokeWidth="1.1"/>
        <line x1="6.5" y1="15" x2="6.5" y2="22" stroke="#78350f" strokeWidth="2" strokeLinecap="round"/>
        <line x1="17.5" y1="15" x2="17.5" y2="22" stroke="#78350f" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    alfombra: (
      <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
        <line x1="6" y1="4" x2="6" y2="7" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="10" y1="4" x2="10" y2="7" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="14" y1="4" x2="14" y2="7" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="18" y1="4" x2="18" y2="7" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round"/>
        <rect x="2" y="7" width="20" height="11" rx="1" fill="#d97706" stroke="#92400e" strokeWidth="1.2"/>
        <rect x="4" y="9" width="16" height="7" rx=".5" stroke="#fde68a" strokeWidth="1.5" fill="none"/>
        <ellipse cx="12" cy="12.5" rx="4" ry="2.5" fill="#b45309" stroke="#fde68a" strokeWidth="1.2" className={styles.animMedallion}/>
        <line x1="6" y1="18" x2="6" y2="21" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="10" y1="18" x2="10" y2="21" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="14" y1="18" x2="14" y2="21" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="18" y1="18" x2="18" y2="21" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
    cama: (
      <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%" className={styles.animCama}>
        <rect x="2" y="2" width="20" height="7" rx="4" fill="#78350f" stroke="#3d1a00" strokeWidth="1"/>
        <rect x="2" y="8" width="20" height="14" rx="1" fill="#fef3c7" stroke="#d97706" strokeWidth="1.2"/>
        <rect x="3.5" y="9" width="7.5" height="5.5" rx="2.5" fill="white" stroke="#d97706" strokeWidth="1"/>
        <rect x="13" y="9" width="7.5" height="5.5" rx="2.5" fill="white" stroke="#d97706" strokeWidth="1"/>
        <rect x="2" y="16" width="20" height="6" rx="1" fill="#d97706" stroke="#b45309" strokeWidth="1"/>
      </svg>
    ),
    mesa: (
      <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%" className={styles.animMesa}>
        <rect x="1" y="7" width="22" height="3.5" rx="1" fill="#78350f" stroke="#3d1a00" strokeWidth="1"/>
        <rect x="3" y="10.5" width="3" height="12" rx="1" fill="#92400e"/>
        <rect x="18" y="10.5" width="3" height="12" rx="1" fill="#92400e"/>
        <rect x="3" y="17.5" width="18" height="2" rx=".5" fill="#a16207"/>
      </svg>
    ),
    tv: (
      <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
        <rect x="2" y="3" width="20" height="15" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="1"/>
        <rect x="4" y="5" width="16" height="11" rx="1" fill="#0f172a" className={styles.animTvScreen}/>
        <path d="M5 6 L9 6 L5 10 Z" fill="white" fillOpacity=".12"/>
        <rect x="10" y="18" width="4" height="2.5" rx=".5" fill="#78350f"/>
        <line x1="7.5" y1="20.5" x2="16.5" y2="20.5" stroke="#78350f" strokeWidth="1.6" strokeLinecap="round"/>
        <circle cx="12" cy="19.2" r=".8" fill="#fde68a" className={styles.animTvLed}/>
      </svg>
    ),
    planta: (
      <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%" className={styles.animPlanta}>
        <path d="M8 20 L7 23 L17 23 L16 20" fill="#c2410c" stroke="#7c2d12" strokeWidth="1" strokeLinejoin="round"/>
        <rect x="7" y="17.5" width="10" height="3" rx=".5" fill="#dc2626" stroke="#7c2d12" strokeWidth=".8"/>
        <line x1="12" y1="17.5" x2="12" y2="12" stroke="#65a30d" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="12" cy="8" r="6" fill="#16a34a" stroke="#15803d" strokeWidth="1.2"/>
        <path d="M9 8 Q12 4 15 8" stroke="#4ade80" strokeWidth="1" fill="none"/>
        <path d="M9 10 Q12 7 15 10" stroke="#4ade80" strokeWidth=".8" fill="none"/>
      </svg>
    ),
    estanteria: (
      <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
        <rect x="2" y="2" width="20" height="20" rx="1" fill="#78350f" stroke="#3d1a00" strokeWidth="1"/>
        <rect x="2" y="8.5" width="20" height="1.5" fill="#3d1a00"/>
        <rect x="2" y="15.5" width="20" height="1.5" fill="#3d1a00"/>
        <rect x="3" y="3" width="3" height="5.5" rx=".3" fill="#ef4444"/>
        <rect x="6.5" y="3" width="2" height="5.5" rx=".3" fill="#3b82f6"/>
        <rect x="9" y="3" width="3.5" height="5.5" rx=".3" fill="#f59e0b" className={styles.animBookPeek}/>
        <rect x="13" y="3" width="2.5" height="5.5" rx=".3" fill="#10b981"/>
        <rect x="16" y="3" width="2" height="5.5" rx=".3" fill="#8b5cf6"/>
        <rect x="18.5" y="3" width="2.5" height="5.5" rx=".3" fill="#f97316"/>
        <rect x="3" y="10" width="4" height="5.5" rx=".3" fill="#14b8a6"/>
        <rect x="7.5" y="10" width="2.5" height="5.5" rx=".3" fill="#ec4899"/>
        <rect x="10.5" y="10" width="3" height="5.5" rx=".3" fill="#84cc16"/>
        <rect x="14" y="10" width="2" height="5.5" rx=".3" fill="#a78bfa"/>
        <rect x="16.5" y="10" width="3" height="5.5" rx=".3" fill="#22d3ee"/>
        <rect x="3" y="17" width="4" height="4" rx=".3" fill="#6366f1"/>
        <rect x="8" y="17" width="3" height="4" rx=".3" fill="#f43f5e"/>
        <rect x="12" y="17" width="4" height="4" rx=".3" fill="#eab308"/>
        <rect x="17" y="17" width="3.5" height="4" rx=".3" fill="#fb923c"/>
      </svg>
    ),
    caja: (
      <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
        <rect x="2" y="11" width="20" height="11" rx="1" fill="#d97706" stroke="#92400e" strokeWidth="1.2"/>
        <path d="M2 11 L12 7 L22 11 L12 15 Z" fill="#f59e0b" stroke="#92400e" strokeWidth="1.2" className={styles.animCajaLid}/>
        <line x1="12" y1="15" x2="12" y2="22" stroke="#b45309" strokeWidth="1.3"/>
        <line x1="12" y1="7" x2="12" y2="15" stroke="#b45309" strokeWidth="1.3" className={styles.animCajaLid}/>
        <line x1="2" y1="11" x2="22" y2="11" stroke="#b45309" strokeWidth="1.3"/>
        <line x1="2" y1="16.5" x2="22" y2="16.5" stroke="#b45309" strokeWidth=".9"/>
      </svg>
    ),
  }
  return icons[obj] ?? <svg viewBox="0 0 24 24"><text x="12" y="16" textAnchor="middle" fontSize="10">?</text></svg>
}
