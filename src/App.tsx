import { useState } from 'react'
import type { Puzzle } from './types'
import { LevelSelect } from './screens/LevelSelect'
import { GameScreen } from './screens/GameScreen'
import { WinScreen } from './screens/WinScreen'
import { SolutionsScreen } from './screens/SolutionsScreen'
import { SolutionDetailScreen } from './screens/SolutionDetailScreen'

type AppView =
  | { screen: 'level-select' }
  | { screen: 'game'; level: number }
  | { screen: 'win'; puzzle: Puzzle; culpritId: string }
  | { screen: 'solutions-list' }
  | { screen: 'solutions-detail'; level: number }

export function App() {
  const [view, setView] = useState<AppView>({ screen: 'level-select' })

  function handleSelectLevel(level: number) {
    setView({ screen: 'game', level })
  }

  function handleWin(puzzle: Puzzle, culpritId: string) {
    setView({ screen: 'win', puzzle, culpritId })
  }

  function handleNext(currentLevel: number) {
    setView({ screen: 'game', level: currentLevel + 1 })
  }

  function handleLevelSelect() {
    setView({ screen: 'level-select' })
  }

  function handleViewSolutions() {
    setView({ screen: 'solutions-list' })
  }

  function handleSelectSolution(level: number) {
    setView({ screen: 'solutions-detail', level })
  }

  if (view.screen === 'level-select') {
    return (
      <LevelSelect
        onSelectLevel={handleSelectLevel}
        onViewSolutions={handleViewSolutions}
      />
    )
  }

  if (view.screen === 'game') {
    return (
      <GameScreen
        level={view.level}
        onWin={handleWin}
        onBack={handleLevelSelect}
      />
    )
  }

  if (view.screen === 'win') {
    return (
      <WinScreen
        puzzle={view.puzzle}
        culpritId={view.culpritId}
        onNext={() => handleNext(view.puzzle.level)}
        onLevelSelect={handleLevelSelect}
      />
    )
  }

  if (view.screen === 'solutions-list') {
    return (
      <SolutionsScreen
        onSelectLevel={handleSelectSolution}
        onBack={handleLevelSelect}
      />
    )
  }

  if (view.screen === 'solutions-detail') {
    return (
      <SolutionDetailScreen
        level={view.level}
        onBack={handleViewSolutions}
      />
    )
  }

  return null
}
