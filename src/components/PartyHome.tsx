import { useState, useEffect } from 'react'
import { GAMES_META, GameType } from '../utils/gameTypes'

interface PartyHomeProps {
  onCreateGame: () => void
  onPlayChallenge: (challengeId: string) => void
}

export default function PartyHome({ onCreateGame }: PartyHomeProps) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Just mark as loaded after a brief moment
    setTimeout(() => setLoading(false), 500)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5E6D3' }}>
        <div className="text-xl">Chargement...</div>
      </div>
    )
  }

  const games = Object.entries(GAMES_META) as [GameType, typeof GAMES_META[GameType]][]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5E6D3' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#2D6A4F' }} className="shadow-md">
        <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold" style={{ color: '#FFFFFF' }}>KENNYGAMES PARTY ��</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* 4 Games Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#1A1A1A' }}>
            🎯 Choisis ton jeu
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {games.map(([gameType, meta]) => (
              <button
                key={gameType}
                onClick={onCreateGame}
                className="bg-white rounded-xl p-6 hover:shadow-xl transition-all transform hover:scale-105"
                style={{ border: '3px solid ' + meta.primaryColor }}
              >
                <div className="text-center">
                  <div className="text-6xl mb-3">{meta.emoji}</div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: meta.primaryColor }}>
                    {meta.name}
                  </h3>
                  <p className="text-sm" style={{ color: '#666' }}>
                    {meta.description}
                  </p>
                  <div className="mt-4 px-3 py-1 rounded-full text-xs font-bold inline-block" 
                       style={{ backgroundColor: meta.primaryColor + '20', color: meta.primaryColor }}>
                    {meta.minPlayers}-{meta.maxPlayers} joueurs
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Placeholder for challenges */}
        <div className="bg-white rounded-lg p-8 text-center" style={{ border: '2px dashed #ccc' }}>
          <div className="text-4xl mb-2">🎲</div>
          <p className="text-lg font-bold mb-1" style={{ color: '#666' }}>Aucun défi en cours</p>
          <p className="text-sm" style={{ color: '#999' }}>Clique sur un jeu pour défier tes amis !</p>
        </div>
      </div>
    </div>
  )
}
