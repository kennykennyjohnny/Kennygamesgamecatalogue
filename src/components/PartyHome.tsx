import { useState, useEffect } from 'react'
import { supabase } from '../utils/client'
import { getMyChallenges, getMyTurnChallenges, type Challenge } from '../utils/challengesApi'
import { GAMES_META } from '../utils/gameTypes'
import NotificationBell from './NotificationBell'

interface PartyHomeProps {
  onCreateGame: () => void
  onPlayChallenge: (challengeId: string) => void
}

export default function PartyHome({ onCreateGame, onPlayChallenge }: PartyHomeProps) {
  const [myTurnChallenges, setMyTurnChallenges] = useState<Challenge[]>([])
  const [allChallenges, setAllChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    loadChallenges()
    getCurrentUser()
  }, [])

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setCurrentUserId(user.id)
  }

  async function loadChallenges() {
    try {
      const [myTurn, all] = await Promise.all([
        getMyTurnChallenges(),
        getMyChallenges()
      ])
      
      setMyTurnChallenges(myTurn)
      setAllChallenges(all.filter(c => c.status !== 'finished' && c.status !== 'cancelled' && c.status !== 'declined'))
    } catch (error) {
      console.error('Error loading challenges:', error)
    } finally {
      setLoading(false)
    }
  }

  function getOpponent(challenge: Challenge) {
    if (!currentUserId) return null
    return challenge.from_user_id === currentUserId ? challenge.to_user : challenge.from_user
  }

  function getChallengeStatus(challenge: Challenge) {
    if (!currentUserId) return ''
    
    if (challenge.status === 'sent') {
      return challenge.from_user_id === currentUserId ? 'En attente...' : 'Nouveau défi !'
    }
    
    if (challenge.current_turn_user_id === currentUserId) {
      return 'À toi de jouer ! 🎮'
    }
    
    return 'En attente de l\'adversaire...'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
        <div className="text-xl">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      {/* Header with Notification Bell */}
      <div className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto p-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#2C1810]">KENNYGAMES PARTY</h1>
          <NotificationBell />
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* My Turn Section */}
        {myTurnChallenges.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-[#2C1810]">🎮 À toi de jouer !</h2>
            <div className="space-y-3">
              {myTurnChallenges.map((challenge) => {
                const opponent = getOpponent(challenge)
                const gameMeta = GAMES_META[challenge.game_type]
                
                return (
                  <button
                    key={challenge.id}
                    onClick={() => onPlayChallenge(challenge.id)}
                    className="w-full bg-[#9CB380] text-white rounded-lg p-4 hover:bg-[#7a9060] transition shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{gameMeta.emoji}</div>
                        <div className="text-left">
                          <div className="font-bold text-lg">{gameMeta.name}</div>
                          <div className="text-sm opacity-90">
                            Contre {opponent?.username}
                          </div>
                        </div>
                      </div>
                      <div className="text-2xl">▶️</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* New Challenge Button */}
        <button
          onClick={onCreateGame}
          className="w-full bg-[#8B7355] text-white rounded-lg p-6 hover:bg-[#6d5940] transition shadow-lg mb-8"
        >
          <div className="text-center">
            <div className="text-4xl mb-2">⚔️</div>
            <div className="text-2xl font-bold">NOUVEAU DÉFI</div>
            <div className="text-sm opacity-90 mt-1">Défie un ami sur ton jeu préféré</div>
          </div>
        </button>

        {/* All Challenges */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-[#2C1810]">📋 Mes défis</h2>
          
          {allChallenges.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              <p className="text-xl mb-2">Aucun défi en cours</p>
              <p>Clique sur "Nouveau défi" pour commencer !</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allChallenges.map((challenge) => {
                const opponent = getOpponent(challenge)
                const gameMeta = GAMES_META[challenge.game_type]
                const status = getChallengeStatus(challenge)
                const isMyTurn = challenge.current_turn_user_id === currentUserId
                
                return (
                  <button
                    key={challenge.id}
                    onClick={() => onPlayChallenge(challenge.id)}
                    className={`w-full rounded-lg p-4 transition shadow-md text-left ${
                      isMyTurn 
                        ? 'bg-[#9CB380] text-white hover:bg-[#7a9060]' 
                        : 'bg-white hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{gameMeta.emoji}</div>
                        <div>
                          <div className={`font-bold ${isMyTurn ? 'text-white' : 'text-[#2C1810]'}`}>
                            {gameMeta.name}
                          </div>
                          <div className={`text-sm ${isMyTurn ? 'text-white opacity-90' : 'text-gray-600'}`}>
                            VS {opponent?.username}
                          </div>
                          <div className={`text-xs mt-1 ${isMyTurn ? 'text-white font-bold' : 'text-gray-500'}`}>
                            {status}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
