import { useEffect } from 'react'
import type { Puzzle } from '../types'
import { saveProgress } from '../logic/storage'
import { getCharacterColor } from '../logic/colors'
import styles from './WinScreen.module.css'

interface Props {
  puzzle: Puzzle
  culpritId: string
  onNext: () => void
  onLevelSelect: () => void
}

export function WinScreen({ puzzle, culpritId, onNext, onLevelSelect }: Props) {
  const culprit = puzzle.characters.find(c => c.id === culpritId)!
  const culpritCell = puzzle.board.cells.flat().find(c => c.id === puzzle.solution.placement[culpritId])
  const culpritRoom = puzzle.board.rooms.find(r => r.id === culpritCell?.roomId)

  useEffect(() => {
    saveProgress(puzzle.level)
  }, [puzzle.level])

  const hasNextLevel = puzzle.level < 30

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.badge} aria-hidden="true">🎉</div>
        <h1 className={styles.title}>¡Resuelto!</h1>
        <p className={styles.subtitle}>Nivel {puzzle.level} completado</p>

        <div className={styles.reveal}>
          <div
            className={styles.culpritToken}
            style={{ background: getCharacterColor(culpritId, puzzle.characters) }}
          >
            {culprit.name.charAt(0)}
          </div>
          <div className={styles.revealText}>
            <span className={styles.culpritName}>{culprit.name}</span>
            <span className={styles.roomName}>
              robó el objeto en {culpritRoom?.name ?? 'la habitación desconocida'}
            </span>
          </div>
        </div>

        <div className={styles.actions}>
          {hasNextLevel && (
            <button className={styles.nextBtn} onClick={onNext}>
              Siguiente nivel →
            </button>
          )}
          <button className={styles.selectBtn} onClick={onLevelSelect}>
            Elegir nivel
          </button>
        </div>
      </div>
    </div>
  )
}
