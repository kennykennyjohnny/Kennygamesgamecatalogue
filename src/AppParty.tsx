import { useState, useEffect } from 'react'
import { supabase } from './utils/client'
import Login from './components/Login'
import ProfileSetup from './components/ProfileSetup'
import PartyHome from './components/PartyHome'
import GameSelection from './components/GameSelection'
import { getChallenge, type Challenge } from './utils/challengesApi'
import { SandyGame } from './components/games/sandy/SandyGame'

type Screen = 'login' | 'profile-setup' | 'home' | 'game-selection' | 'playing'

export default function AppParty() {
  const [screen, setScreen] = useState<Screen>('login')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null)

  useEffect(() => {
    checkUserState()
  }, [])

  async function checkUserState() {
    try {
      // Check if logged in
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setScreen('login')
        setLoading(false)
        return
      }

      setUser(user)

      // Check if has profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, username')
        .eq('id', user.id)
        .single()

      if (!profile) {
        setScreen('profile-setup')
      } else {
        setScreen('home')
      }

      setLoading(false)
    } catch (error) {
      console.error('Error checking user state:', error)
      setScreen('login')
      setLoading(false)
    }
  }

  async function handlePlayChallenge(challengeId: string) {
    try {
      const challenge = await getChallenge(challengeId)
      setCurrentChallenge(challenge)
      setScreen('playing')
    } catch (error) {
      console.error('Error loading challenge:', error)
      alert('Erreur lors du chargement du défi')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
        <div className="text-2xl font-bold">Chargement...</div>
      </div>
    )
  }

  // LOGIN
  if (screen === 'login') {
    return <Login onSuccess={() => checkUserState()} />
  }

  // PROFILE SETUP
  if (screen === 'profile-setup' && user) {
    return (
      <ProfileSetup 
        userId={user.id} 
        onComplete={() => setScreen('home')} 
      />
    )
  }

  // HOME
  if (screen === 'home') {
    return (
      <PartyHome
        onCreateGame={() => setScreen('game-selection')}
        onPlayChallenge={handlePlayChallenge}
      />
    )
  }

  // GAME SELECTION (with friends list)
  if (screen === 'game-selection') {
    return (
      <GameSelection
        onBack={() => setScreen('home')}
      />
    )
  }

  // PLAYING A CHALLENGE
  if (screen === 'playing' && currentChallenge && user) {
    if (currentChallenge.game_type === 'sandy') {
      return (
        <div className="min-h-screen bg-[#F5F1E8]">
          <div className="bg-white shadow-md p-4">
            <button
              onClick={() => setScreen('home')}
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

    // Other games not implemented
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl mb-4">🚧 Ce jeu arrive bientôt !</p>
          <button
            onClick={() => setScreen('home')}
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
