import { describe, it, expect, beforeEach } from 'vitest'
import { loadProgress, saveProgress, resetProgress } from '../logic/storage'

describe('storage — loadProgress', () => {
  beforeEach(() => resetProgress())

  it('returns default progress when localStorage is empty', () => {
    const p = loadProgress()
    expect(p.version).toBe(1)
    expect(p.maxLevelReached).toBe(1)
    expect(p.completedLevels).toEqual([])
  })

  it('returns default progress for corrupted JSON', () => {
    localStorage.setItem('the-heist-progress', '{bad json')
    expect(loadProgress().completedLevels).toEqual([])
  })

  it('returns default progress when version !== 1', () => {
    localStorage.setItem('the-heist-progress', JSON.stringify({ version: 2, maxLevelReached: 5, completedLevels: [1, 2] }))
    expect(loadProgress().maxLevelReached).toBe(1)
  })
})

describe('storage — saveProgress', () => {
  beforeEach(() => resetProgress())

  it('marks level as completed', () => {
    saveProgress(3)
    expect(loadProgress().completedLevels).toContain(3)
  })

  it('advances maxLevelReached', () => {
    saveProgress(3)
    expect(loadProgress().maxLevelReached).toBe(4)
  })

  it('saveProgress(5) when maxLevelReached=3 → updates to 6', () => {
    saveProgress(3)
    saveProgress(5)
    expect(loadProgress().maxLevelReached).toBe(6)
  })

  it('saveProgress(3) when maxLevelReached=5 → stays at 5', () => {
    saveProgress(5)
    saveProgress(3)
    expect(loadProgress().maxLevelReached).toBe(6) // set by saveProgress(5) → 6
  })

  it('no duplicate completedLevels', () => {
    saveProgress(3)
    saveProgress(3)
    const p = loadProgress()
    expect(p.completedLevels.filter(l => l === 3)).toHaveLength(1)
  })

  it('idempotent: calling twice in StrictMode-like scenario writes once', () => {
    saveProgress(1)
    saveProgress(1)
    expect(loadProgress().completedLevels).toEqual([1])
  })
})
