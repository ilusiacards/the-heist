import { describe, it, expect } from 'vitest'
import { characterClueText } from '../logic/clueText'
import type { Board, Character, Clue } from '../types'

const characters: Character[] = [
  { id: 'c1', name: 'Ana' },
  { id: 'c2', name: 'Bruno' },
]

// Board with articleName on rooms
const boardWithArticles: Board = {
  rows: 3, cols: 3,
  cells: [],
  rooms: [
    { id: 'r-cocina', name: 'Cocina', articleName: 'la cocina', cells: [] },
    { id: 'r-salon', name: 'Sala', articleName: 'la sala', cells: [] },
    { id: 'r-bano', name: 'Baño', articleName: 'el baño', cells: [] },
  ],
}

// Board without articleName (simulates pre-generated puzzles)
const boardWithoutArticles: Board = {
  rows: 3, cols: 3,
  cells: [],
  rooms: [
    { id: 'r-cocina', name: 'Cocina', cells: [] },
    { id: 'r-bano', name: 'Baño', cells: [] },
  ],
}

function makeClue(type: Clue['type'], params: Record<string, unknown>, subject = 'c1'): Clue {
  return { id: 'clue-1', type, subject, params } as Clue
}

describe('characterClueText — room articles', () => {
  it('uses articleName when present', () => {
    const clues = [makeClue('in_room', { roomId: 'r-cocina' })]
    expect(characterClueText('c1', clues, characters, boardWithArticles))
      .toBe('Ana estaba en la cocina.')
  })

  it('derives article from name map when articleName is missing', () => {
    const clues = [makeClue('in_room', { roomId: 'r-cocina' })]
    expect(characterClueText('c1', clues, characters, boardWithoutArticles))
      .toBe('Ana estaba en la cocina.')
  })

  it('uses articleName for not_in_room', () => {
    const clues = [makeClue('not_in_room', { roomId: 'r-bano' })]
    expect(characterClueText('c1', clues, characters, boardWithArticles))
      .toBe('Ana no estaba en el baño.')
  })
})

describe('characterClueText — object labels via objectMeta', () => {
  it('uses new clueLabel for cama (banco)', () => {
    const clues = [makeClue('on_object', { objectType: 'cama' })]
    expect(characterClueText('c1', clues, characters, boardWithArticles))
      .toBe('Ana estaba sobre el banco.')
  })

  it('uses new clueLabel for mesa (extintor)', () => {
    const clues = [makeClue('on_object', { objectType: 'mesa' })]
    expect(characterClueText('c1', clues, characters, boardWithArticles))
      .toBe('Ana estaba sobre el extintor.')
  })

  it('uses new clueLabel for estanteria (estatua)', () => {
    const clues = [makeClue('on_object', { objectType: 'estanteria' })]
    expect(characterClueText('c1', clues, characters, boardWithArticles))
      .toBe('Ana estaba sobre la estatua.')
  })

  it('uses new clueLabel for caja (papelera)', () => {
    const clues = [makeClue('on_object', { objectType: 'caja' })]
    expect(characterClueText('c1', clues, characters, boardWithArticles))
      .toBe('Ana estaba sobre la papelera.')
  })

  it('keeps silla label unchanged', () => {
    const clues = [makeClue('on_object', { objectType: 'silla' })]
    expect(characterClueText('c1', clues, characters, boardWithArticles))
      .toBe('Ana estaba sobre la silla.')
  })
})

describe('characterClueText — ventana renamed to cuadro', () => {
  it('next_to_window says cuadro', () => {
    const clues = [makeClue('next_to_window', {})]
    expect(characterClueText('c1', clues, characters, boardWithArticles))
      .toBe('Ana estaba junto a un cuadro.')
  })

  it('not_next_to_window says sin cuadros cercanos', () => {
    const clues = [makeClue('not_next_to_window', {})]
    expect(characterClueText('c1', clues, characters, boardWithArticles))
      .toBe('Ana no estaba junto a ningún cuadro.')
  })
})
