# TODOS

## TODO-1: Generator all-retries-exhausted error state

**What:** Define and implement what happens when `generatePuzzle()` exhausts ALL retry attempts (step 4 × 5 iterations + step 1 × 3 board resets = 15 total board attempts) without producing a valid unique-solution puzzle.

**Why:** With pre-generated puzzles (`bun run generate`), this affects the build script. If the script silently writes null to a JSON file, the app crashes at runtime on that level. Generator should throw + exit code 1.

**Pros:** Clear failure contract. Build CI would catch broken puzzle generation immediately.
**Cons:** The failure case may never happen with well-tuned boards — effort spent on an edge case.

**Context:** Generator currently returns null on exhausted retries. The `scripts/generate.ts` build script doesn't handle null. Fix is 5 lines: check return value, throw Error with level info, exit 1. Also: add `console.warn` for each step-4 retry to make hard-board convergence visible in build logs.

**Depends on:** T5 (build-time generate script)

---

## TODO-2: `in_center_of_room` clue type (v2)

**What:** Add `in_center_of_room` to the clue evaluator. A character is in the center of their room if all 4 orthogonal neighbors (top, bottom, left, right) belong to the same room.

**Why:** Adds spatial reasoning variety to hard puzzles. Currently deferred because it requires reading all 4 adjacent cells' roomIds — straightforward but only useful for rooms with 5+ cells.

**Pros:** Distinct clue type that encourages spatial reasoning about room shape. No new params needed (`params: {}`).
**Cons:** Rare in practice — small rooms (2-3 cells) can never have a center. Generator would need to add it to the hard difficulty pool.

**Context:** Currently listed as out-of-scope v1 in the design doc. Start after `evaluateClue.ts` is stable (T7 tests pass). The evaluation is: `cell.row > 0 && cell.row < board.rows-1 && cell.col > 0 && cell.col < board.cols-1 && adjacent cells all have same roomId as cell.roomId`.

**Depends on:** `evaluateClue.ts` stable and tested

---

## TODO-3: Daily puzzle mode + share card (v2 virality)

**What:** One puzzle per day, same puzzle for all players (seeded by date). Share button produces a text card like "I solved The Heist Level 7 (Hard) — no mistakes! 🕵️" that copies to clipboard.

**Why:** The plan ships 30 static levels with no retention hook. A daily challenge with shareable results is the Wordle model — players return every day and share results organically. This transforms the game from a one-time session to a daily ritual.

**Pros:** Massive retention uplift. Viral distribution via share card. Zero backend needed (seeded PRNG by date = same puzzle everywhere). Fits the static deploy model.
**Cons:** Needs a date-seeded level picker on top of the existing seeded PRNG. Share API requires browser clipboard permission.

**Context:** Flagged by CEO review (/autoplan Phase 1). Implementation: `level = daysSinceEpoch % N` where N = total generated levels. Share text generated from `puzzle.difficulty + thief name` without spoiling the solution. The generator (T4 seeded PRNG) already supports this pattern.

**Depends on:** T4 (seeded PRNG), T5 (generate script), v1 shipped

---

## TODO-4: Analytics embed (post-launch calibration)

**What:** Add Plausible Analytics (1-line script embed, no GDPR cookies) to measure: which levels players abandon, which difficulty is most played, what the completion rate is per level.

**Why:** Without analytics, there's no way to know if difficulty 1 is too hard (everyone quits) or difficulty 3 is too easy (nobody bothers). Post-launch calibration requires data.

**Pros:** Plausible is privacy-respecting (GDPR-compliant, no cookie banner needed). 1-line embed. Free tier covers indie game traffic. Data shows which levels to improve.
**Cons:** Requires a Plausible account. Adds one external script.

**Context:** Flagged by CEO review (/autoplan Phase 1). Add to `index.html` after v1 ships: `<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>`. Track: page views on `/level/:id`, custom events on win + wrong-accusation + abandon.

**Depends on:** v1 shipped, custom domain configured

---

## TODO-6: 11×11 tableros (10 personajes) — síntesis mejorada

**What:** Los tableros 11×11 requieren sintetizar pistas que resuelvan 10 personajes por deducción pura. La tasa de éxito actual es < 0.1% (synthesis no converge en la mayoría de intentos).

**Why:** El juego tiene `getDifficultyConfig` configurado para 11×11 en levels 38+, pero los JSON no existen porque la generación no funciona.

**Options:**
1. Agregar tipos de pistas más restrictivos (e.g. "X está en la habitación más grande", "fila/columna específica")
2. Cambiar la estrategia de síntesis: en vez de síntesis greedy, usar backtracking en la selección de pistas
3. Relajar el requisito de forward-solvability para niveles extremos (permitir 1 paso de suposición guiada)

**Context:** El código en `generator.ts` ya soporta 11×11 vía `getDifficultyConfig`. Solo falta que `synthesizeClues` converja. El AC-3 incremental (`buildInitialState`/`applyClueToState`, ya implementado y exportado) es la base para una síntesis más agresiva.

**Depends on:** v0.4.0 shipped (10×10 funciona), investigación adicional del algoritmo

---

## TODO-5: MRV watchdog + arc-consistency for solver (v2)

**What:** Add a watchdog to the backtracking solver: if backtrack depth exceeds `N * 3`, log a warning. Optionally, implement arc-consistency propagation after each `propagate()` call to prune relational clue candidates.

**Why:** The current MRV heuristic computes candidates based on row/col conflicts only. After `propagate`, relational clues (`same_room_as`, `direction_of`) create stale candidate sets — MRV may pick a character with a falsely-inflated candidate count, leading to more backtracking than necessary.

**Context:** Flagged by eng review (/autoplan Phase 3). For 6×6 boards with 6 characters, max backtrack depth is bounded; the risk is low but real on constrained boards. Watchdog is 2 lines; full arc-consistency is a more significant refactor.

**Depends on:** `solver.ts` stable (T7 tests pass)
