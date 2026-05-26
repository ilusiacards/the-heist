import type { Board, Character, Clue, CellId } from '../types'
import { evaluateClue } from '../logic/evaluateClue'
import { characterClueText } from '../logic/clueText'
import { getCharacterColor } from '../logic/colors'
import styles from './CluePanel.module.css'

interface Props {
  clues: Clue[]
  board: Board
  characters: Character[]
  placement: Partial<Record<string, CellId>>
}

function getCharacterStatusClass(charId: string, clues: Clue[], placement: Partial<Record<string, CellId>>, board: Board): string {
  const charClues = clues.filter(c => c.subject === charId)
  if (charClues.length === 0) return styles.unknown!
  const results = charClues.map(c => evaluateClue(c, placement, board, 'partial'))
  if (results.some(r => r === false)) return styles.violated!
  if (results.every(r => r === true)) return styles.satisfied!
  return styles.unknown!
}

function getCharacterStatusIcon(charId: string, clues: Clue[], placement: Partial<Record<string, CellId>>, board: Board): string {
  const charClues = clues.filter(c => c.subject === charId)
  if (charClues.length === 0) return '?'
  const results = charClues.map(c => evaluateClue(c, placement, board, 'partial'))
  if (results.some(r => r === false)) return '✗'
  if (results.every(r => r === true)) return '✓'
  return '?'
}

export function CluePanel({ clues, board, characters, placement }: Props) {
  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Pistas</h2>
      <ul className={styles.list}>
        {characters.map(char => {
          const statusClass = getCharacterStatusClass(char.id, clues, placement, board)
          const icon = getCharacterStatusIcon(char.id, clues, placement, board)
          const text = characterClueText(char.id, clues, characters, board)
          const color = getCharacterColor(char.id, characters)
          return (
            <li key={char.id} className={`${styles.clue} ${statusClass}`}>
              <span
                className={styles.dot}
                style={{ background: color }}
                aria-hidden="true"
              />
              <span className={styles.text}>{text}</span>
              <span className={styles.statusIcon} aria-hidden="true">{icon}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
