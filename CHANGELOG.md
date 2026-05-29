# Changelog

All notable changes to this project will be documented in this file.

## [0.4.0.0] - 2026-05-29

### Added

- **7 nuevos niveles 10×10 (niveles 31–37)**: El juego ahora tiene 37 niveles. Los niveles "Extremo" (31–37) usan tableros de 10×10 con 9 personajes — la sesión de deducción más larga del juego.
- **Tableros 11×11 configurados (niveles 38+)**: El generador soporta 11×11 (10 personajes) y está listo para producir niveles en cuanto el algoritmo de síntesis lo permita — diferido al próximo ciclo de mejoras.
- **`buildInitialState` + `applyClueToState` (AC-3 incremental)**: Funciones exportadas que implementan propagación de restricciones tipo AC-3 con worklist multi-hop. Base para síntesis incremental futura y para testing unitario del motor lógico.
- **`SPAN_PROB` para tableros 10×11**: Los objetos de 2 casillas (Banco y Alfombra) ahora aparecen en tableros 10×10 (65% de probabilidad) y 11×11 (70%).

### Changed

- **`getDifficultyConfig`**: Niveles 31–37 → 10×10 (9 personajes), niveles 38+ → 11×11 (10 personajes). Los rangos existentes (5×5 a 9×9) no cambian.
- **`getCell` en `synthesizeClues`**: Refactorizado de O(N²) scan a O(1) lookup via `cellById` Map precomputado — mejora la velocidad de síntesis en todos los tamaños.
- **Scripts de generación**: `generate.ts` usa `MAX_ATTEMPTS=1000` para niveles 31+ (vs 500 para niveles anteriores). `validate-forward.ts` detecta automáticamente el número de niveles disponibles.
- **`benchmark-sizes.ts`**: Actualizado con configs para 9×9, 10×10 y 11×11 usando seeds del mismo formato que el script de generación.
- **Total de niveles**: 30 → 37 en `LevelSelect`, `SolutionsScreen` y `WinScreen`.
- **Tests**: 4 nuevos tests en `generator.test.ts` cubriendo `applyClueToState` (happy path, contradicción, placement), validación de 10×10 y Latin square invariant.

## [0.3.0.0] - 2026-05-29

### Added

- **Objetos de 2 casillas (Banco y Alfombra)**: El Banco (`cama`) y la Alfombra (`alfombra`) ahora pueden aparecer en versión horizontal (2×1) o vertical (1×2) en tableros de 6×6 en adelante. La probabilidad de span escala con el tamaño del tablero (0% en 5×5 → 60% en 9×9). El SVG del objeto se renderiza desde la celda primaria y ocupa visualmente las 2 celdas.
- **4 nuevos SVGs wide**: `cama_wide_h`, `cama_wide_v`, `alfombra_wide_h`, `alfombra_wide_v` con animación `animBancoMece` en el banco largo.
- **Guard de celda secundaria**: Clic en la celda secundaria de un span redirige a la celda primaria — sin comportamiento roto para el jugador.

### Changed

- **Modelo de datos Cell**: 2 campos opcionales nuevos: `objectSpanDir?: 'h' | 'v'` (celda primaria) y `objectPartOf?: CellId` (celda secundaria).
- **`isOccupiable`**: Las celdas secundarias de un span son `false` — el solver y el generador las excluyen de posiciones válidas de personajes.
- **`generateBoard`**: Llama a `applySpanUpgrades()` después del bucle de garantía de ocupabilidad. La celda del objeto robado nunca forma parte de un span.
- **`BoardGrid`**: `gridWrapper` envuelve la grilla para permitir que los SVGs wide desborden la celda sin ser cortados por `overflow: hidden`.
- **Tests**: 11 nuevos tests en `src/test/multiCellObjects.test.ts` cubriendo span placement, clue evaluation, stolen-cell guard y fuzz test de unicidad.

## [0.1.5.0] - 2026-05-27

### Changed

- **Español de España**: Textos de UI migrados de español latinoamericano (voseo) a español de España (tuteo). Afecta 8 strings en `GameScreen`, `SolutionDetailScreen` y `HelpOverlay` — "Verificá" → "Verifica", "Intentá" → "Intenta", "Usá" → "Usa", "Tocá" → "Toca", "hacé clic" → "haz clic". Sin cambios de lógica.

## [0.1.4.0] - 2026-05-27

### Added

- **Solutions Inspector (developer tool)**: New screen accessible from the level selector via "Ver soluciones" button. Shows all 30 puzzle solutions with every suspect placed, the stolen-object cell glowing green, and all clues highlighted as satisfied. Lets developers validate puzzle JSON visually in 2 clicks instead of reading raw files. Includes loading/error states, read-only board (pointer events disabled), and navigation between levels.

### Changed

- **`computeEliminatedSets` extracted to `src/logic/boardUtils.ts`**: Shared utility for computing eliminated rows/cols from a placement. GameScreen and SolutionDetailScreen both use it — removes code duplication.
- **`BoardGrid` gains `readOnly` prop**: When true, applies `pointerEvents: none` to the grid, suppressing hover, cursor, and the glowing-cell pulse animation. Used by SolutionDetailScreen.
- **`App.tsx` WinScreen guard**: Fixed implicit fallthrough to `WinScreen` that would crash at runtime (`view.puzzle` undefined) if new view states were added. Now uses explicit `if (view.screen === 'win')` + `return null`.

## [0.1.3.0] - 2026-05-27

### Fixed

- **All 30 levels are now forward-solvable via pure logical deduction**: Previously, 15 of 30 levels could not be uniquely solved by applying clues step-by-step (forward constraint propagation) — they required guessing or backtracking. Root cause: the clue synthesis was guided by "discriminating between two alternatives" rather than "building a step-by-step deduction chain." New approach: synthesis uses an internal forward-solver (`forwardSolveState`) and in each round selects the clue that most reduces candidates for an unplaced character, preferring clues that narrow a character to exactly 1 position (enabling placement and triggering chain deductions). A puzzle is only accepted when the forward solver places all characters at their exact intended positions AND `findAllSolutions` confirms strict uniqueness.
- **`not_next_to_window` clue incorrectly generated**: The `candidateClues` function was generating `not_next_to_window` for any cell with `windows.length === 0`, but `evaluateClue` for this type also checks adjacent cells in the same room. This caused clues that were false for the intended solution to be added. Fix: all candidate clues are now verified with `evaluateClue` against the intended solution before use.
- **Generator fuzz test 30× faster**: The forward-solver-guided synthesis avoids repeated backtracking searches during clue selection. The fuzz test (levels 1–20, finding solutions with `findAllSolutions`) dropped from 415 seconds to 14 seconds.

### Changed

- All 30 puzzle levels regenerated with the improved generator.

## [0.1.2.0] - 2026-05-27

### Fixed

- **Puzzles were unwinnable on all levels**: The game requires that after placing all suspects, exactly one cell remains as the "glowing" accusation target (the stolen object location). Two bugs caused this to never work: (1) boards were N×N with N characters — after placing N characters in unique rows+columns, all rows and all columns are occupied, leaving zero valid free cells; (2) `stolenObjectCellId` was picked at random and didn't land on the required intersection. Fix: boards are now (N+1)×(N+1) (5×5/4 chars, 6×6/5 chars, 7×7/6 chars), and the stolen-object cell is always the intersection of the single free row × free column, with exactly one suspect (the culprit) sharing that room. All 30 levels regenerated.

## [0.1.1.0] - 2026-05-27

### Fixed

- **Generator performance**: 7×7+ boards that previously timed out now generate in under 500ms. Root causes: regex `parseCellId` called millions of times in the backtracking hot path (replaced with a pre-computed coordinate map), no pre-filtering of candidate cells before search (added unary-clue pre-filter), and uniqueness re-proved from scratch every synthesis round (now uses lazy alt-solution tracking that only re-proves when the known alternative is ruled out by a newly added clue).
- **"lejos de" clue text removed**: The ambiguous "lejos de" (far from) phrase appeared in combined clue sentences as a subordinate clause for `not_same_room_as` and `not_next_to_window`. Replaced with "en otra habitación que" and "sin ventanas cercanas" respectively — both are unambiguous and consistent with the clue type.
- **Missing clues for some characters**: Levels where a character ended up with zero clues after synthesis (15 levels affected) now always generate at least one clue per character via a safety-net pass after the main synthesis loop. All 30 levels regenerated with the fixed generator.

### Changed

- All 30 puzzle levels (`public/puzzles/level-1.json` through `level-30.json`) regenerated with the improved generator. Clue distribution now strongly favors unary clues (`in_room`, `on_object`, `in_corner`) which are simpler to read and faster to solve.

## [0.1.0.0] - 2026-05-26

### Added

- Progressive board sizes (3×3 through 7×7) scaling with level number
- Expanded suspect roster with more named characters
- Natural Spanish clue language with combined sentences ("X estaba en la cocina, junto a Y")
- Warm illustrated visual theme
- GitHub Pages deployment
