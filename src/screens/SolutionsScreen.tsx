import styles from './SolutionsScreen.module.css'

const TOTAL_LEVELS = 30
const DIFFICULTY_LABELS = ['Fácil', 'Fácil', 'Fácil', 'Fácil', 'Fácil', 'Fácil', 'Fácil', 'Fácil', 'Fácil', 'Fácil',
  'Medio', 'Medio', 'Medio', 'Medio', 'Medio', 'Medio', 'Medio', 'Medio', 'Medio', 'Medio',
  'Difícil', 'Difícil', 'Difícil', 'Difícil', 'Difícil', 'Difícil', 'Difícil', 'Difícil', 'Difícil', 'Difícil']

interface Props {
  onSelectLevel: (level: number) => void
  onBack: () => void
}

export function SolutionsScreen({ onSelectLevel, onBack }: Props) {
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Volver a niveles">← Volver</button>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Soluciones</h1>
          <p className={styles.subtitle}>Inspector de soluciones (dev)</p>
        </div>
      </header>

      <div className={styles.grid}>
        {Array.from({ length: TOTAL_LEVELS }, (_, i) => {
          const level = i + 1
          const difficulty = DIFFICULTY_LABELS[i] ?? 'Fácil'
          return (
            <button
              key={level}
              className={styles.levelBtn}
              onClick={() => onSelectLevel(level)}
              aria-label={`Ver solución del nivel ${level}`}
            >
              <span className={styles.levelNum}>{level}</span>
              <span className={styles.difficulty}>{difficulty}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
