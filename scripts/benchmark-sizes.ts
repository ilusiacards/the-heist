/**
 * Benchmark large board generation times.
 * Run with: bun scripts/benchmark-sizes.ts
 * Used to validate 8x8/9x9/10x10 fit within the 40s threshold.
 */
import { generatePuzzle } from '../src/logic/generator'

// Note: levels 21+ all map to 8×8 in current getDifficultyConfig.
// 9×9 and 10×10 exceeded the 40s threshold; extend getDifficultyConfig first before testing.
const CONFIGS = [
  { label: '7×7 (levels 1-20)',  level: 20 },
  { label: '8×8 (levels 21+)',   level: 21 },
] as const

console.log('Benchmark: time to find 3 valid puzzles per size\n')

for (const config of CONFIGS) {
  const found: number[] = []
  const t0 = Date.now()

  for (let seed = 0; seed < 500 && found.length < 3; seed++) {
    const result = generatePuzzle(seed, config.level)
    if (result !== null) found.push(Date.now() - t0)
    if (Date.now() - t0 > 60_000) break
  }

  const total = Date.now() - t0
  if (found.length === 0) {
    console.log(`${config.label}: 0 successes in ${total}ms — FAIL ✗`)
  } else {
    const avg = Math.round(found.reduce((a, b) => a + b, 0) / found.length)
    const status = avg < 40_000 ? 'PASS ✓' : 'FAIL ✗ (>40s avg)'
    console.log(`${config.label}: avg=${avg}ms  successes=${found.length}  ${status}`)
  }
}
