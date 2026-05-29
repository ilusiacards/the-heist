/**
 * Benchmark large board generation times.
 * Run with: bun scripts/benchmark-sizes.ts
 * Uses level-formula seeds (level * 1000 + attempt) matching generate.ts.
 */
import { generatePuzzle } from '../src/logic/generator'

const CONFIGS = [
  { label: '7×7  (levels 16-20)', level: 20 },
  { label: '8×8  (levels 21-25)', level: 21 },
  { label: '9×9  (levels 26-30)', level: 26 },
  { label: '10×10 (levels 31-37)', level: 31 },
  { label: '11×11 (levels 38+)',  level: 38 },
] as const

const TARGET_MS = 30_000
const MAX_ATTEMPTS = 500
const TIMEOUT_MS = 120_000

console.log(`Benchmark: time to find 3 valid puzzles per board size (target: avg < ${TARGET_MS / 1000}s)\n`)

for (const config of CONFIGS) {
  const found: number[] = []
  const t0 = Date.now()

  for (let attempt = 1; attempt <= MAX_ATTEMPTS && found.length < 3; attempt++) {
    const seed = config.level * 1000 + attempt
    const result = generatePuzzle(seed, config.level)
    if (result !== null) found.push(Date.now() - t0)
    if (Date.now() - t0 > TIMEOUT_MS) break
  }

  const total = Date.now() - t0
  if (found.length === 0) {
    console.log(`${config.label}: 0 successes in ${Math.round(total/1000)}s — FAIL ✗`)
  } else {
    const avg = Math.round(found.reduce((a, b) => a + b, 0) / found.length)
    const status = avg < TARGET_MS ? 'PASS ✓' : `FAIL ✗ (avg ${Math.round(avg/1000)}s > ${TARGET_MS/1000}s target)`
    console.log(`${config.label}: avg=${avg}ms  successes=${found.length}  ${status}`)
  }
}
