import type { Board, Character, Clue, CellId } from '../types'
import { evaluateClue } from '../logic/evaluateClue'
import { clueText } from '../logic/clueText'
import { getCharacterColor } from '../logic/colors'
import styles from './CluePanel.module.css'

interface Props {
  clues: Clue[]
  board: Board
  characters: Character[]
  placement: Partial<Record<string, CellId>>
}

export function CluePanel({ clues, board, characters, placement }: Props) {
  function statusClass(clue: Clue): string {
    const result = evaluateClue(clue, placement, board, 'partial')
    if (result === true) return styles.satisfied!
    if (result === false) return styles.violated!
    return styles.unknown!
  }

  function statusIcon(clue: Clue): string {
    const result = evaluateClue(clue, placement, board, 'partial')
    if (result === true) return '✓'
    if (result === false) return '✗'
    return '?'
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Pistas</h2>
      <ul className={styles.list}>
        {clues.map(clue => {
          const subjectColor = getCharacterColor(clue.subject, characters)
          const text = clueText(clue, characters, board)
          return (
            <li key={clue.id} className={`${styles.clue} ${statusClass(clue)}`}>
              <span
                className={styles.dot}
                style={{ background: subjectColor }}
                aria-hidden="true"
              />
              <span className={styles.text}>{text}</span>
              <span className={styles.statusIcon} aria-hidden="true">{statusIcon(clue)}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
