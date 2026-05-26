import type { Character, CellId } from '../types'
import { getCharacterColor } from '../logic/colors'
import styles from './CharacterTray.module.css'

interface Props {
  characters: Character[]
  placement: Partial<Record<string, CellId>>
}

// T10: CharacterTray is read-only — placement happens via BoardGrid cells
export function CharacterTray({ characters, placement }: Props) {
  return (
    <div className={styles.tray} role="list" aria-label="Personajes">
      {characters.map(char => {
        const isPlaced = !!placement[char.id]
        return (
          <div
            key={char.id}
            className={`${styles.item} ${isPlaced ? styles.placed! : ''}`}
            role="listitem"
            aria-label={`${char.name}${isPlaced ? ' — colocado' : ' — sin colocar'}`}
          >
            <span
              className={styles.token}
              style={{ background: getCharacterColor(char.id, characters) }}
            >
              {char.name.charAt(0)}
            </span>
            <span className={styles.name}>{char.name}</span>
            {isPlaced && <span className={styles.badge} aria-hidden="true">✓</span>}
          </div>
        )
      })}
    </div>
  )
}
