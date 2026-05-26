// T4: Seeded PRNG (mulberry32 — fast, good distribution, reproducible)
export function createPRNG(seed: number): () => number {
  let s = seed >>> 0
  return function () {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

export function seededChoice<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]!
}

export function seededInt(min: number, max: number, rng: () => number): number {
  return min + Math.floor(rng() * (max - min + 1))
}
