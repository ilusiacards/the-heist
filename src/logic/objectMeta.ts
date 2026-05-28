import type { ObjectType } from '../types'

export const OBJECT_META: Record<ObjectType, { label: string; clueLabel: string; article: string }> = {
  silla:      { label: 'Silla',    clueLabel: 'la silla',    article: 'la' },
  alfombra:   { label: 'Alfombra', clueLabel: 'la alfombra', article: 'la' },
  cama:       { label: 'Banco',    clueLabel: 'el banco',    article: 'el' },
  mesa:       { label: 'Extintor', clueLabel: 'el extintor', article: 'el' },
  tv:         { label: 'Columna',  clueLabel: 'la columna',  article: 'la' },
  planta:     { label: 'Planta',   clueLabel: 'la planta',   article: 'la' },
  estanteria: { label: 'Estatua',  clueLabel: 'la estatua',  article: 'la' },
  caja:       { label: 'Papelera', clueLabel: 'la papelera', article: 'la' },
}

const _META_BY_STR = OBJECT_META as Record<string, { label: string; clueLabel: string; article: string } | undefined>

export function objectClueLabel(id: string): string {
  return _META_BY_STR[id]?.clueLabel ?? id
}

export function objectLabel(id: string): string {
  return _META_BY_STR[id]?.label ?? id
}
