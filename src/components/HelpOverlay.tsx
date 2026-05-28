import { useEffect, useRef } from 'react'
import { ObjectIcon } from './ObjectIcon'
import styles from './HelpOverlay.module.css'

interface Props {
  onClose: () => void
}

const OBJECT_LABELS: Record<string, string> = {
  silla: 'Silla',
  alfombra: 'Alfombra',
  cama: 'Cama',
  mesa: 'Mesa',
  tv: 'TV',
  planta: 'Planta',
  estanteria: 'Estantería',
  caja: 'Caja',
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
            Usa las pistas para deducir la posición exacta de cada uno.
          </p>
          <p className={styles.rule}>
            <span className={styles.icon}>👆</span>
            Toca una celda para colocar o mover un personaje.
          </p>
          <p className={styles.rule}>
            <span className={styles.icon}>✕</span>
            Las celdas con X están eliminadas por fila o columna ocupada.
          </p>
          <p className={styles.rule}>
            <span className={styles.icon}>🟢</span>
            Cuando todos estén colocados, brillará la celda del objeto robado — haz clic para acusar al ladrón.
          </p>
          <p className={styles.rule}>
            <span className={styles.icon}>🔒</span>
            Cada puzzle tiene exactamente una solución. No hay que adivinar.
          </p>
        </div>
        <div className={styles.legend}>
          <div className={styles.legendSection}>
            <span className={`${styles.legendPill} ${styles.legendPillGreen}`}>✓ Ocupable</span>
            <div className={styles.legendIcons}>
              {(['silla', 'alfombra', 'cama'] as const).map(obj => (
                <div key={obj} className={styles.legendItem}>
                  <div className={styles.legendIconWrap}>
                    <span className={styles.legendIconInner}><ObjectIcon obj={obj} /></span>
                  </div>
                  <span className={styles.legendLabel}>{OBJECT_LABELS[obj]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.legendSection}>
            <span className={`${styles.legendPill} ${styles.legendPillRed}`}>✕ No ocupable</span>
            <div className={styles.legendIcons}>
              {(['mesa', 'tv', 'planta', 'estanteria', 'caja'] as const).map(obj => (
                <div key={obj} className={styles.legendItem}>
                  <div className={`${styles.legendIconWrap} ${styles.legendIconWrapBlocked}`}>
                    <span className={styles.legendIconInner}><ObjectIcon obj={obj} /></span>
                    <span className={styles.legendXMark} aria-hidden="true">✕</span>
                  </div>
                  <span className={styles.legendLabel}>{OBJECT_LABELS[obj]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <button className={styles.gotItBtn} onClick={onClose}>¡Entendido!</button>
      </div>
    </div>
  )
}
