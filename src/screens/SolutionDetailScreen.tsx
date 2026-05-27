import { useState, useEffect } from 'react'
import type { CellId, Puzzle } from '../types'
import { BoardGrid } from '../components/BoardGrid'
import { CluePanel } from '../components/CluePanel'
import { computeEliminatedSets } from '../logic/boardUtils'
import styles from './SolutionDetailScreen.module.css'

interface Props {
  level: number
  onBack: () => void
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; puzzle: Puzzle }

async function loadPuzzle(level: number): Promise<Puzzle> {
  const res = await fetch(`${import.meta.env.BASE_URL}puzzles/level-${level}.json`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<Puzzle>
}

export function SolutionDetailScreen({ level, onBack }: Props) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    setState({ status: 'loading' })
    loadPuzzle(level)
      .then(puzzle => setState({ status: 'ready', puzzle }))
      .catch(() => setState({
        status: 'error',
        message: `No se pudo cargar el nivel ${level}. Verificá tu conexión.`,
      }))
  }, [level])

  if (state.status === 'loading') {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={onBack}>← Soluciones</button>
          <span className={styles.levelLabel}>Nivel {level}</span>
          <span />
        </header>
        <div className={styles.loading}>
          <div className={styles.spinner} aria-label="Cargando..." />
          <p>Cargando nivel {level}…</p>
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={onBack}>← Soluciones</button>
          <span className={styles.levelLabel}>Nivel {level}</span>
          <span />
        </header>
        <div className={styles.errorBox}>
          <p className={styles.errorMsg}>{state.message}</p>
          <button className={styles.retryBtn} onClick={() => {
            setState({ status: 'loading' })
            loadPuzzle(level)
              .then(puzzle => setState({ status: 'ready', puzzle }))
              .catch(() => setState({ status: 'error', message: `No se pudo cargar el nivel ${level}. Verificá tu conexión.` }))
          }}>
            Reintentar
          </button>
          <button className={styles.backBtn} onClick={onBack}>← Soluciones</button>
        </div>
      </div>
    )
  }

  const { puzzle } = state
  const placement: Partial<Record<string, CellId>> = puzzle.solution.placement
  const glowingCellId: CellId = puzzle.solution.stolenObjectCellId
  const { eliminatedRows, eliminatedCols } = computeEliminatedSets(
    puzzle.board, puzzle.characters, placement
  )

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Volver a soluciones">← Soluciones</button>
        <span className={styles.levelLabel}>Nivel {level}</span>
        <span />
      </header>

      <main className={styles.main}>
        <div className={styles.boardArea}>
          <p className={styles.solutionLabel}>Solución completa</p>
          <div className={styles.boardWrapper}>
            <BoardGrid
              board={puzzle.board}
              characters={puzzle.characters}
              clues={puzzle.clues}
              placement={placement}
              eliminatedRows={eliminatedRows}
              eliminatedCols={eliminatedCols}
              glowingCellId={glowingCellId}
              onCellClick={() => {}}
              readOnly
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
    </div>
  )
}
