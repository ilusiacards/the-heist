import { loadProgress } from '../logic/storage'
import styles from './LevelSelect.module.css'

const TOTAL_LEVELS = 30
const DIFFICULTY_LABELS = ['Fácil', 'Fácil', 'Fácil', 'Fácil', 'Fácil', 'Fácil', 'Fácil', 'Fácil', 'Fácil', 'Fácil',
  'Medio', 'Medio', 'Medio', 'Medio', 'Medio', 'Medio', 'Medio', 'Medio', 'Medio', 'Medio',
  'Difícil', 'Difícil', 'Difícil', 'Difícil', 'Difícil', 'Difícil', 'Difícil', 'Difícil', 'Difícil', 'Difícil']

interface Props {
  onSelectLevel: (level: number) => void
}

export function LevelSelect({ onSelectLevel }: Props) {
  const progress = loadProgress()

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>The Heist</h1>
        <p className={styles.subtitle}>Puzzle de lógica de ubicación</p>
      </header>

      <div className={styles.grid}>
        {Array.from({ length: TOTAL_LEVELS }, (_, i) => {
          const level = i + 1
          const isCompleted = progress.completedLevels.includes(level)
          const isUnlocked = level <= progress.maxLevelReached
          const isLocked = !isUnlocked
          const difficulty = DIFFICULTY_LABELS[i] ?? 'Fácil'

          return (
            <button
              key={level}
              className={`${styles.levelBtn} ${isCompleted ? styles.completed! : ''} ${isLocked ? styles.locked! : ''}`}
              onClick={() => !isLocked && onSelectLevel(level)}
              disabled={isLocked}
              aria-label={`Nivel ${level}${isCompleted ? ' — completado' : ''}${isLocked ? ' — bloqueado' : ''}`}
            >
              <span className={styles.levelNum}>{level}</span>
              <span className={styles.difficulty}>{difficulty}</span>
              {isCompleted && <span className={styles.check} aria-hidden="true">✓</span>}
              {isLocked && <span className={styles.lock} aria-hidden="true">🔒</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
