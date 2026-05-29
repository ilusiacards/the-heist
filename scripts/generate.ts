#!/usr/bin/env bun
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { generatePuzzle } from '../src/logic/generator'

const TOTAL_LEVELS = 30
const MAX_ATTEMPTS = 500
const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '..', 'public', 'puzzles')

mkdirSync(OUTPUT_DIR, { recursive: true })

let failures = 0

for (let level = 1; level <= TOTAL_LEVELS; level++) {
  let generated = false
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
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
    console.error(`[generate] ERROR: failed to generate level ${level} after ${MAX_ATTEMPTS} attempts`)
    process.exit(1)
  }
}

if (failures > 0) {
  console.warn(`[generate] ${failures} seeds failed and were skipped`)
}

console.log(`[generate] Done — ${TOTAL_LEVELS} puzzles written to ${OUTPUT_DIR}`)
