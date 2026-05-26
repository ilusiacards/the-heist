import { useState } from 'react'
import type { Puzzle } from './types'
import { LevelSelect } from './screens/LevelSelect'
import { GameScreen } from './screens/GameScreen'
import { WinScreen } from './screens/WinScreen'

type AppView =
  | { screen: 'level-select' }
  | { screen: 'game'; level: number }
  | { screen: 'win'; puzzle: Puzzle; culpritId: string }

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

  if (view.screen === 'level-select') {
    return <LevelSelect onSelectLevel={handleSelectLevel} />
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

  return (
    <WinScreen
      puzzle={view.puzzle}
      culpritId={view.culpritId}
      onNext={() => handleNext(view.puzzle.level)}
      onLevelSelect={handleLevelSelect}
    />
  )
}
