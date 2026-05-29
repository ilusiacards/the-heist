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

## TODO-6: 11×11 síntesis más rápida — nuevos clue types + relajar forward-solvability

**Estado actual (v0.4.1.0):**
- Level 38 existe y es válido (seed 39606, 16 clues, forward-solvable ✓)
- Tasa de éxito: ~0.06% (1 en 1600 intentos), ~16 min offline por nivel
- Levels 39-45 (11×11) pendientes de generar; tardarían ~50 min/nivel con MAX_ATTEMPTS=5000
- Bloqueante para generación rápida: solo 6 tipos de clue unarios disponibles (el invariante
  Latin square elimina todos los clues relacionales que necesitan misma fila o columna)

**Causa raíz confirmada:**
El invariante Latin square (cada personaje en fila Y columna únicas) hace imposibles:
`direction_of`, `next_to`, `n_cols_direction_of`, `n_rows_direction_of` (todos necesitan
colDiff=0 o rowDiff=0). Solo quedan 6 clues unarios: in_room, on_object, in_corner,
not_in_corner, next_to_window, not_next_to_window.
Con habitaciones de ~14 celdas en 11×11, in_room deja ~15% de candidatos — muy poco restrictivo.

**Líneas de ataque para la próxima sesión:**

### Opción A: Nuevos tipos de clue compatibles con Latin square (ALTA prioridad)
Clues que NO requieren misma fila/columna entre chars:
- **`in_row(X, N)`** — "X está en la fila N del tablero". Unario puro, elimina 10/11 filas.
  Con 11 filas y ~7 ocupiables por fila, deja ~7/80 = 9% de candidatos. Más restrictivo que in_room.
  Implementación: en `evaluateClue.ts` case `in_row`, en `candidateClues` emitir si rowDiff=0 (nunca)...
  Espera — in_row sería unario (no relacional), así que sí funciona.
  Nombre sugerido: `in_row` / `in_col` (referencia la posición del tablero, no de otro personaje)
- **`same_row_as(X, stolenObject)`** — X comparte fila con la celda robada. Es unario en esencia
  (la celda robada es fija por el puzzle). Deja exactamente las celdas ocupiables de esa fila.
  Muy restrictivo + tiene sentido narrativo ("el ladrón estaba en la misma fila que el objeto robado")
- **`same_room_as(X, stolenObject_room)`** — ya existe como in_room pero referenciando
  explícitamente la habitación del culpable. Útil para desambiguar.

### Opción B: Relajar forward-solvability (BAJA complejidad, ALTA ganancia)
Cambio: aceptar puzzles donde N-1 chars son forward-placed y el Nth es automático por row/col.
Estado actual: `forwardSolveState` YA hace esto vía `propagateRowCol()` — si 9/10 chars
están placed, el 10º queda en la única celda (free_row, free_col) por eliminación.
El check actual `forwardMatchesSolution = characters.every(c => finalPlaced[c.id] === solution[c.id])`
requiere que forwardSolveState los place TODOS. Si 9/10 se colocan por deducción y el 10º
por eliminación, forwardSolveState igual los coloca todos → forwardMatchesSolution = TRUE.
**CONCLUSIÓN: ya está implementado implícitamente.** El bottleneck es llegar a 9/10 placed.

### Opción C: Síntesis de tablero más favorable (MEDIA complejidad)
Para 11×11 con 9 habitaciones (seededInt(8,9)), las habitaciones tienen ~14 celdas avg.
Si reducimos a 11-12 habitaciones (más salas pequeñas), in_room dejaría ~7 celdas por sala
en vez de ~14 → in_room twice as restrictive → success rate mejora ~4×.
Cambio: `getDifficultyConfig` para level 38+: `numRooms: seededInt(10, 11, rng)`

### Opción D: Board generation bias (ALTA complejidad, ALTA ganancia)
Generar boards que maximizan la "distinguibilidad" de celdas:
- Maximizar variedad de objetos (más silla, cama, alfombra por habitación)
- Distribuir objetos de esquina y ventana para que más personajes sean únicos por combinación
- Pre-filtrar placements donde ≥3 personajes no tienen celda única con clues actuales

**Archivos clave a conocer antes de la próxima sesión:**
- `src/logic/generator.ts` líneas 533-640: `synthesizeClues`, la función a modificar
- `src/logic/evaluateClue.ts`: donde agregar nuevos tipos de clue
- `src/types.ts`: donde declarar ClueType nuevos
- Seed de referencia: `generatePuzzle(39606, 38)` = un 11×11 válido confirmado (16 clues)
- Tasa baseline post-v0.4.1: 0.06% para 11×11, 0.5% para 10×10, 1% para 9×9

**Orden de implementación recomendado:**
1. Opción C (más habitaciones para 11×11) — 2 líneas, ganancia ~4×
2. Opción A con `in_row`/`in_col` — ~50 líneas, ganancia estimada ~5-10×
3. Benchmark de los cambios con `/bench 11x11`
4. Si la tasa supera 1%: generar los 7 niveles restantes (39-45)

**Depends on:** v0.4.1.0 shipped (level 38 existe, síntesis mejorada con OPT-3 relajado)

---

## TODO-5: MRV watchdog + arc-consistency for solver (v2)

**What:** Add a watchdog to the backtracking solver: if backtrack depth exceeds `N * 3`, log a warning. Optionally, implement arc-consistency propagation after each `propagate()` call to prune relational clue candidates.

**Why:** The current MRV heuristic computes candidates based on row/col conflicts only. After `propagate`, relational clues (`same_room_as`, `direction_of`) create stale candidate sets — MRV may pick a character with a falsely-inflated candidate count, leading to more backtracking than necessary.

**Context:** Flagged by eng review (/autoplan Phase 3). For 6×6 boards with 6 characters, max backtrack depth is bounded; the risk is low but real on constrained boards. Watchdog is 2 lines; full arc-consistency is a more significant refactor.

**Depends on:** `solver.ts` stable (T7 tests pass)
