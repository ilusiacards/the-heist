import type { Progress } from '../types'

const STORAGE_KEY = 'the-heist-progress'

const DEFAULT_PROGRESS: Progress = {
  version: 1,
  maxLevelReached: 1,
  completedLevels: [],
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PROGRESS }
    const parsed = JSON.parse(raw) as Partial<Progress>
    if (parsed.version !== 1) return { ...DEFAULT_PROGRESS }
    return {
      version: 1,
      maxLevelReached: typeof parsed.maxLevelReached === 'number' ? parsed.maxLevelReached : 1,
      completedLevels: Array.isArray(parsed.completedLevels) ? parsed.completedLevels : [],
    }
  } catch {
    return { ...DEFAULT_PROGRESS }
  }
}

export function saveProgress(level: number): void {
  try {
    const current = loadProgress()
    const completedLevels = current.completedLevels.includes(level)
      ? current.completedLevels
      : [...current.completedLevels, level]
    const next: Progress = {
      version: 1,
      maxLevelReached: Math.max(current.maxLevelReached, level + 1),
      completedLevels,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // QuotaExceededError or SecurityError — silently ignore
  }
}

export function resetProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
