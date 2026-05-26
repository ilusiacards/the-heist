import { useEffect, useRef } from 'react'
import type { Cell, Character, CellId } from '../types'
import { getCharacterColor } from '../logic/colors'
import styles from './PlacementDialog.module.css'

interface Props {
  cell: Cell
  characters: Character[]
  placement: Partial<Record<string, CellId>>
  onPlace: (charId: string) => void
  onRemove: (charId: string) => void
  onClose: () => void
}

export function PlacementDialog({ cell, characters, placement, onPlace, onRemove, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // Focus trap
  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    const focusable = el.querySelectorAll<HTMLElement>('button, [tabindex]:not([tabindex="-1"])')
    focusable[0]?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last?.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first?.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const placedCharInThisCell = characters.find(c => placement[c.id] === cell.id)
  const unplacedChars = characters.filter(c => !placement[c.id])

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="Colocar personaje">
      <div
        className={styles.dialog}
        ref={dialogRef}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.header}>
          <span className={styles.cellLabel}>Fila {cell.row + 1}, Col {cell.col + 1}</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        {placedCharInThisCell ? (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>En esta celda</div>
            <div className={styles.charRow}>
              <span
                className={styles.charDot}
                style={{ background: getCharacterColor(placedCharInThisCell.id, characters) }}
              >
                {placedCharInThisCell.name.charAt(0)}
              </span>
              <span className={styles.charName}>{placedCharInThisCell.name}</span>
              <button
                className={styles.removeBtn}
                onClick={() => { onRemove(placedCharInThisCell.id); onClose() }}
              >
                Quitar
              </button>
            </div>
          </div>
        ) : null}

        {unplacedChars.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              {placedCharInThisCell ? 'Mover a...' : 'Colocar aquí'}
            </div>
            {unplacedChars.map(char => (
              <button
                key={char.id}
                className={styles.charBtn}
                onClick={() => { onPlace(char.id); onClose() }}
              >
                <span
                  className={styles.charDot}
                  style={{ background: getCharacterColor(char.id, characters) }}
                >
                  {char.name.charAt(0)}
                </span>
                <span className={styles.charName}>{char.name}</span>
              </button>
            ))}
          </div>
        )}

        {unplacedChars.length === 0 && !placedCharInThisCell && (
          <p className={styles.empty}>Todos los personajes están colocados.</p>
        )}
      </div>
    </div>
  )
}
