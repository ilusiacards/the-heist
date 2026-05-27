import { useState, useEffect, useCallback } from 'react'
import type { Cell, CellId, Puzzle } from '../types'
import { isOccupiable } from '../types'
import { BoardGrid } from '../components/BoardGrid'
import { PlacementDialog } from '../components/PlacementDialog'
import { CluePanel } from '../components/CluePanel'
import { CharacterTray } from '../components/CharacterTray'
import { HelpOverlay } from '../components/HelpOverlay'
import { computeEliminatedSets } from '../logic/boardUtils'
import styles from './GameScreen.module.css'

interface Props {
  level: number
  onWin: (puzzle: Puzzle, culpritId: string) => void
  onBack: () => void
}

type GameState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'playing'; puzzle: Puzzle }

// T6: Level loader fetches pre-built JSON
async function loadPuzzle(level: number): Promise<Puzzle> {
  const res = await fetch(`${import.meta.env.BASE_URL}puzzles/level-${level}.json`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data: unknown = await res.json()
  return data as Puzzle
}

// Counts occupiable cells that are not occupied, not in an eliminated row, and not in an
// eliminated col. The solver places characters in unique rows+cols, so the correct full
// placement always leaves exactly 1 such cell — the accusation target.
function countValidFreeCells(
  puzzle: Puzzle,
  placement: Partial<Record<string, CellId>>,
  eliminatedRows: Set<number>,
  eliminatedCols: Set<number>
): { count: number; cellId: CellId | null } {
  const occupiedCells = new Set(Object.values(placement).filter(Boolean) as CellId[])
  let count = 0
  let cellId: CellId | null = null
  for (const row of puzzle.board.cells) {
    for (const cell of row) {
      if (
        isOccupiable(cell) &&
        !occupiedCells.has(cell.id) &&
        !eliminatedRows.has(cell.row) &&
        !eliminatedCols.has(cell.col)
      ) {
        count++
        cellId = cell.id
      }
    }
  }
  return { count, cellId }
}

export function GameScreen({ level, onWin, onBack }: Props) {
  const [gameState, setGameState] = useState<GameState>({ status: 'loading' })
  const [placement, setPlacement] = useState<Partial<Record<string, CellId>>>({})
  const [dialogCell, setDialogCell] = useState<Cell | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [wrongAccusation, setWrongAccusation] = useState(false)

  useEffect(() => {
    setGameState({ status: 'loading' })
    setPlacement({})
    setWrongAccusation(false)
    loadPuzzle(level)
      .then(puzzle => setGameState({ status: 'playing', puzzle }))
      .catch(err => {
        const msg = err instanceof SyntaxError
          ? 'El archivo del puzzle está corrupto. Intentá recargar la página.'
          : `No se pudo cargar el nivel ${level}. Verificá tu conexión.`
        setGameState({ status: 'error', message: msg })
      })
  }, [level])

  const puzzle = gameState.status === 'playing' ? gameState.puzzle : null

  // Compute eliminated rows/cols
  const { eliminatedRows, eliminatedCols } = puzzle
    ? computeEliminatedSets(puzzle.board, puzzle.characters, placement)
    : { eliminatedRows: new Set<number>(), eliminatedCols: new Set<number>() }

  // Check if all N characters are placed → find glowing cell (T3)
  const allPlaced = puzzle
    ? puzzle.characters.every(c => !!placement[c.id])
    : false

  let glowingCellId: CellId | null = null
  if (allPlaced && puzzle) {
    const { count, cellId } = countValidFreeCells(puzzle, placement, eliminatedRows, eliminatedCols)
    if (count === 1) {
      glowingCellId = cellId
    }
    if (import.meta.env.DEV && count !== 1) {
      console.error(`[GameScreen] Expected 1 valid free cell, got ${count}`)
    }
  }

  const handleCellClick = useCallback((cell: Cell) => {
    if (!puzzle) return
    if (!isOccupiable(cell)) return

    // If this is the glowing cell, make the accusation
    if (cell.id === glowingCellId) {
      const roomId = cell.roomId
      // Find which character is in this room in the solution
      const culpritId = puzzle.solution.culpritId
      const culpritCellId = puzzle.solution.placement[culpritId]
      const culpritCell = puzzle.board.cells.flat().find(c => c.id === culpritCellId)
      if (culpritCell?.roomId === roomId) {
        // Correct accusation! 500ms pause then navigate to win
        setTimeout(() => onWin(puzzle, culpritId), 500)
      } else {
        setWrongAccusation(true)
        setTimeout(() => setWrongAccusation(false), 3000)
      }
      return
    }

    // If cell is eliminated (row or col taken) and no character is here, no-op
    const isElim = eliminatedRows.has(cell.row) || eliminatedCols.has(cell.col)
    if (isElim && !Object.values(placement).includes(cell.id)) return

    setDialogCell(cell)
  }, [puzzle, glowingCellId, eliminatedRows, eliminatedCols, placement, onWin])

  function handlePlace(charId: string) {
    if (!dialogCell) return
    // Remove char from previous cell if any
    setPlacement(prev => {
      const next = { ...prev }
      // Remove the char being placed from wherever it was
      for (const id in next) {
        if (next[id] === dialogCell.id) delete next[id]
      }
      next[charId] = dialogCell.id
      return next
    })
  }

  function handleRemove(charId: string) {
    setPlacement(prev => {
      const next = { ...prev }
      delete next[charId]
      return next
    })
  }

  if (gameState.status === 'loading') {
    return (
      <div className={styles.screen}>
        <div className={styles.loading}>
          <div className={styles.spinner} aria-label="Cargando..." />
          <p>Cargando nivel {level}…</p>
        </div>
      </div>
    )
  }

  if (gameState.status === 'error') {
    return (
      <div className={styles.screen}>
        <div className={styles.errorBox}>
          <p className={styles.errorMsg}>{gameState.message}</p>
          <button className={styles.backBtn} onClick={() => loadPuzzle(level).then(p => { setGameState({ status: 'playing', puzzle: p }); setPlacement({}) }).catch(() => {})}>
            Reintentar
          </button>
          <button className={styles.backBtn} onClick={onBack}>Volver</button>
        </div>
      </div>
    )
  }

  // status === 'playing' at this point; puzzle is non-null
  if (!puzzle) return null

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Volver a niveles">← Niveles</button>
        <span className={styles.levelLabel}>Nivel {level}</span>
        <button className={styles.helpBtn} onClick={() => setShowHelp(true)} aria-label="Ayuda">?</button>
      </header>

      {wrongAccusation && (
        <div className={styles.wrongBanner} role="alert">
          ¡Incorrecto! Seguí deduciendo… la solución es única.
        </div>
      )}

      {allPlaced && glowingCellId && !wrongAccusation && (
        <div className={styles.accusePrompt} role="status">
          Una celda brilla en verde — hacé clic para acusar
        </div>
      )}

      <main className={styles.main}>
        <div className={styles.boardArea}>
          <CharacterTray characters={puzzle.characters} placement={placement} />
          <div className={styles.boardWrapper}>
            <BoardGrid
              board={puzzle.board}
              characters={puzzle.characters}
              clues={puzzle.clues}
              placement={placement}
              eliminatedRows={eliminatedRows}
              eliminatedCols={eliminatedCols}
              glowingCellId={glowingCellId}
              onCellClick={handleCellClick}
            />
          </div>
        </div>
        <div className={styles.sidebar}>
          <CluePanel
            clues={puzzle.clues}
            board={puzzle.board}
            characters={puzzle.characters}
            placement={placement}
          />
        </div>
      </main>

      {dialogCell && (
        <PlacementDialog
          cell={dialogCell}
          characters={puzzle.characters}
          placement={placement}
          onPlace={handlePlace}
          onRemove={handleRemove}
          onClose={() => setDialogCell(null)}
        />
      )}

      {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}
    </div>
  )
}
