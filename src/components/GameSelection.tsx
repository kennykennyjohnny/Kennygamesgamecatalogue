import { useState } from 'react'
import { GameType, GAMES_META } from '../utils/gameTypes'
import FriendsList from './FriendsList'

interface GameSelectionProps {
  onBack?: () => void
}

export function GameSelection({ onBack }: GameSelectionProps) {
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null)
  const games = Object.entries(GAMES_META) as [GameType, typeof GAMES_META[GameType]][]

  function handleGameClick(gameType: GameType) {
    setSelectedGame(gameType)
  }

  function handleChallengeCreated() {
    if (onBack) onBack()
  }

  if (selectedGame) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setSelectedGame(null)}
            className="mb-6 flex items-center gap-2 text-[#8B7355] hover:text-[#6d5940] transition"
          >
            <span>←</span>
            <span>Retour aux jeux</span>
          </button>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{GAMES_META[selectedGame].emoji}</div>
              <div>
                <h2 className="text-3xl font-bold" style={{ color: GAMES_META[selectedGame].primaryColor }}>
                  {GAMES_META[selectedGame].name}
                </h2>
                <p className="text-gray-600">{GAMES_META[selectedGame].description}</p>
              </div>
            </div>
          </div>

          <FriendsList 
            selectedGame={selectedGame} 
            onChallengeCreated={handleChallengeCreated}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8] p-6">
      <div className="max-w-4xl mx-auto">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-[#8B7355] hover:text-[#6d5940] transition"
          >
            <span>←</span>
            <span>Retour</span>
          </button>
        )}

        <h1 className="text-4xl font-bold text-center mb-8 text-[#2C1810]">
          CHOISIS TON JEU
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {games.map(([gameType, meta]) => (
            <button
              key={gameType}
              onClick={() => handleGameClick(gameType)}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105"
            >
              <div className="text-6xl mb-4 text-center">{meta.emoji}</div>
              <h2 className="text-2xl font-bold text-center mb-2" style={{ color: meta.primaryColor }}>
                {meta.name}
              </h2>
              <p className="text-gray-600 text-center text-sm mb-4">{meta.description}</p>
              <div className="flex justify-center gap-2">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs">
                  {meta.minPlayers}-{meta.maxPlayers} joueurs
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
