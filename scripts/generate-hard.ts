#!/usr/bin/env bun
// Generates levels 23-30 (hard: 8x8 to 10x10)
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { generatePuzzle } from '../src/logic/generator'

const START_LEVEL = 23
const END_LEVEL = 30
const MAX_ATTEMPTS = 200
const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '..', 'public', 'puzzles')

mkdirSync(OUTPUT_DIR, { recursive: true })

for (let level = START_LEVEL; level <= END_LEVEL; level++) {
  const t0 = Date.now()
  let generated = false
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const seed = level * 1000 + attempt
    const puzzle = generatePuzzle(seed, level)
    if (!puzzle) continue
    const patchedPuzzle = { ...puzzle, level }
    const filePath = join(OUTPUT_DIR, `level-${level}.json`)
    writeFileSync(filePath, JSON.stringify(patchedPuzzle, null, 2))
    const ms = Date.now() - t0
    console.log(`[generate] Level ${level} (hard, seed=${seed}, attempt=${attempt}) → ${filePath} [${ms}ms]`)
    generated = true
    break
  }
  if (!generated) {
    console.error(`[generate] ERROR: failed to generate level ${level} after ${MAX_ATTEMPTS} attempts`)
    process.exit(1)
  }
}

console.log(`[generate] Done — levels ${START_LEVEL}-${END_LEVEL} written`)
