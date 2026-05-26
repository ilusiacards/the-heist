#!/usr/bin/env bun
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { generatePuzzle } from '../src/logic/generator'

const DIFFICULTIES: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard']
const PER_DIFFICULTY = 10
const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '..', 'public', 'puzzles')

mkdirSync(OUTPUT_DIR, { recursive: true })

let outputLevel = 0
let failures = 0

for (const difficulty of DIFFICULTIES) {
  let generated = 0
  let attempt = 0
  const diffIdx = DIFFICULTIES.indexOf(difficulty)
  while (generated < PER_DIFFICULTY) {
    attempt++
    if (attempt > PER_DIFFICULTY * 10) break
    // Use attempt-based seed so failed seeds don't affect output level numbering
    const seed = diffIdx * 10000 + attempt
    const puzzle = generatePuzzle(seed, difficulty)
    if (!puzzle) {
      failures++
      continue
    }
    outputLevel++
    const patchedPuzzle = { ...puzzle, level: outputLevel }
    const filePath = join(OUTPUT_DIR, `level-${outputLevel}.json`)
    writeFileSync(filePath, JSON.stringify(patchedPuzzle, null, 2))
    console.log(`[generate] Level ${outputLevel} (${difficulty}) → ${filePath}`)
    generated++
  }
  if (generated < PER_DIFFICULTY) {
    console.error(`[generate] ERROR: only generated ${generated}/${PER_DIFFICULTY} ${difficulty} puzzles`)
    process.exit(1)
  }
}

if (failures > 0) {
  console.warn(`[generate] ${failures} seeds failed and were skipped`)
}

console.log(`[generate] Done — ${outputLevel} puzzles written to ${OUTPUT_DIR}`)
