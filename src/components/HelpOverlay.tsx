import { useEffect, useRef } from 'react'
import styles from './HelpOverlay.module.css'

interface Props {
  onClose: () => void
}

// T14: HelpOverlay component
export function HelpOverlay({ onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('button')?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="Cómo jugar">
      <div className={styles.box} ref={ref} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Cómo jugar</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className={styles.rules}>
          <p className={styles.rule}>
            <span className={styles.icon}>🎯</span>
            Cada personaje ocupa una fila y columna única en el tablero.
          </p>
          <p className={styles.rule}>
            <span className={styles.icon}>💡</span>
            Usá las pistas para deducir la posición exacta de cada uno.
          </p>
          <p className={styles.rule}>
            <span className={styles.icon}>👆</span>
            Tocá una celda para colocar o mover un personaje.
          </p>
          <p className={styles.rule}>
            <span className={styles.icon}>✕</span>
            Las celdas con X están eliminadas por fila o columna ocupada.
          </p>
          <p className={styles.rule}>
            <span className={styles.icon}>🟢</span>
            Cuando todos estén colocados, brillará la celda del objeto robado — hacé clic para acusar al ladrón.
          </p>
          <p className={styles.rule}>
            <span className={styles.icon}>🔒</span>
            Cada puzzle tiene exactamente una solución. No hay que adivinar.
          </p>
        </div>
        <button className={styles.gotItBtn} onClick={onClose}>¡Entendido!</button>
      </div>
    </div>
  )
}
