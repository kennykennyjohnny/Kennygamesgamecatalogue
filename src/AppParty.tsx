import { useState, useEffect } from 'react'
import { supabase } from './utils/client'
import PartyHome from './components/PartyHome'
import GameSelection from './components/GameSelection'
import { getChallenge, type Challenge } from './utils/challengesApi'
import { SandyGame } from './components/games/sandy/SandyGame'

type Screen = 'home' | 'game-selection' | 'playing'

export default function AppParty() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentScreen, setCurrentScreen] = useState<Screen>('home')
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // Redirect to login page (you'll need to implement this)
      window.location.href = '/login' // Placeholder
      return
    }
    
    setUser(user)
    setLoading(false)
  }

  async function handlePlayChallenge(challengeId: string) {
    try {
      const challenge = await getChallenge(challengeId)
      setCurrentChallenge(challenge)
      setCurrentScreen('playing')
    } catch (error) {
      console.error('Error loading challenge:', error)
      alert('Erreur lors du chargement du défi')
    }
  }

  function handleBackToHome() {
    setCurrentScreen('home')
    setCurrentChallenge(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
        <div className="text-2xl font-bold">Chargement...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
        <div className="text-2xl font-bold">Connexion requise...</div>
      </div>
    )
  }

  // Home screen
  if (currentScreen === 'home') {
    return (
      <PartyHome
        onCreateGame={() => setCurrentScreen('game-selection')}
        onPlayChallenge={handlePlayChallenge}
      />
    )
  }

  // Game selection screen (with friends list)
  if (currentScreen === 'game-selection') {
    return (
      <GameSelection
        onBack={handleBackToHome}
      />
    )
  }

  // Playing a challenge
  if (currentScreen === 'playing' && currentChallenge) {
    // For now, only SandyGames is implemented
    if (currentChallenge.game_type === 'sandy') {
      return (
        <div className="min-h-screen bg-[#F5F1E8]">
          <div className="bg-white shadow-md p-4">
            <button
              onClick={handleBackToHome}
              className="text-[#8B7355] hover:text-[#6d5940] flex items-center gap-2"
            >
              <span>←</span>
              <span>Retour</span>
            </button>
          </div>
          <SandyGame
            gameId={currentChallenge.id}
            player1Id={currentChallenge.from_user_id}
            player2Id={currentChallenge.to_user_id}
            currentPlayerId={user.id}
          />
        </div>
      )
    }

    // Other games not implemented yet
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl mb-4">🚧 Ce jeu arrive bientôt !</p>
          <button
            onClick={handleBackToHome}
            className="px-6 py-3 bg-[#8B7355] text-white rounded-lg hover:bg-[#6d5940]"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  return null
}
