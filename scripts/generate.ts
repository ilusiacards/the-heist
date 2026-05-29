#!/usr/bin/env bun
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { generatePuzzle } from '../src/logic/generator'

const TOTAL_LEVELS = 37        // levels 31-37 are 10×10; 11×11 deferred (requires algorithm improvements)
const MAX_ATTEMPTS_SMALL = 500  // levels 1-30 (up to 9×9)
const MAX_ATTEMPTS_LARGE = 1000 // levels 31+ (10×10) need more attempts due to lower success rate
const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '..', 'public', 'puzzles')

mkdirSync(OUTPUT_DIR, { recursive: true })

let failures = 0

for (let level = 1; level <= TOTAL_LEVELS; level++) {
  const maxAttempts = level >= 31 ? MAX_ATTEMPTS_LARGE : MAX_ATTEMPTS_SMALL
  let generated = false
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const seed = level * 1000 + attempt
    const puzzle = generatePuzzle(seed, level)
    if (!puzzle) {
      failures++
      continue
    }
    const patchedPuzzle = { ...puzzle, level }
    const filePath = join(OUTPUT_DIR, `level-${level}.json`)
    writeFileSync(filePath, JSON.stringify(patchedPuzzle, null, 2))
    const difficulty = level <= 10 ? 'easy' : level <= 20 ? 'medium' : 'hard'
    console.log(`[generate] Level ${level} (${difficulty}, seed=${seed}) → ${filePath}`)
    generated = true
    break
  }
  if (!generated) {
    console.error(`[generate] ERROR: failed to generate level ${level} after ${maxAttempts} attempts`)
    process.exit(1)
  }
}

if (failures > 0) {
  console.warn(`[generate] ${failures} seeds failed and were skipped`)
}

console.log(`[generate] Done — ${TOTAL_LEVELS} puzzles written to ${OUTPUT_DIR}`)
// Note: levels 38+ (11×11, 10 characters) are deferred. The forward-solvable synthesis
// algorithm needs improvements (better clue types or smarter strategy) to reliably
// generate 10-character puzzles. Track in TODOS.md TODO-5.
