# Changelog

All notable changes to this project will be documented in this file.

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
