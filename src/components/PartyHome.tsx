import { useState, useEffect } from 'react'
import { supabase } from '../utils/client'
import { getMyChallenges, getMyTurnChallenges, type Challenge } from '../utils/challengesApi'
import { GAMES_META, GameType } from '../utils/gameTypes'
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
          <h1 className="text-3xl font-bold" style={{ color: '#FFFFFF' }}>KENNYGAMES PARTY</h1>
          <NotificationBell />
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* My Turn Section */}
        {myTurnChallenges.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#1A1A1A' }}>🎮 À toi de jouer !</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myTurnChallenges.map((challenge) => {
                const opponent = getOpponent(challenge)
                const gameMeta = GAMES_META[challenge.game_type]
                
                return (
                  <button
                    key={challenge.id}
                    onClick={() => onPlayChallenge(challenge.id)}
                    className="bg-white rounded-lg p-6 hover:shadow-xl transition transform hover:scale-105"
                    style={{ border: '3px solid #2D6A4F' }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-5xl">{gameMeta.emoji}</div>
                      <div className="text-left flex-1">
                        <div className="font-bold text-xl" style={{ color: gameMeta.primaryColor }}>
                          {gameMeta.name}
                        </div>
                        <div className="text-sm" style={{ color: '#666' }}>
                          Contre {opponent?.username}
                        </div>
                        <div className="text-xs mt-2 font-bold" style={{ color: '#2D6A4F' }}>
                          ▶ C'est ton tour !
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 4 Games Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#1A1A1A' }}>
            🎯 Défie tes amis
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {games.map(([gameType, meta]) => (
              <button
                key={gameType}
                onClick={onCreateGame}
                className="bg-white rounded-xl p-6 hover:shadow-xl transition-all transform hover:scale-105"
                style={{ border: '2px solid ' + meta.primaryColor }}
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

        {/* All Challenges */}
        {allChallenges.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#1A1A1A' }}>📋 Mes défis en cours</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allChallenges.map((challenge) => {
                const opponent = getOpponent(challenge)
                const gameMeta = GAMES_META[challenge.game_type]
                const status = getChallengeStatus(challenge)
                const isMyTurn = challenge.current_turn_user_id === currentUserId
                
                return (
                  <button
                    key={challenge.id}
                    onClick={() => onPlayChallenge(challenge.id)}
                    className="bg-white rounded-lg p-4 hover:shadow-lg transition text-left"
                    style={{ 
                      border: isMyTurn ? '2px solid #2D6A4F' : '1px solid #ddd'
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{gameMeta.emoji}</div>
                      <div className="flex-1">
                        <div className="font-bold" style={{ color: gameMeta.primaryColor }}>
                          {gameMeta.name}
                        </div>
                        <div className="text-sm" style={{ color: '#666' }}>
                          VS {opponent?.username}
                        </div>
                        <div className="text-xs mt-1" style={{ 
                          color: isMyTurn ? '#2D6A4F' : '#999',
                          fontWeight: isMyTurn ? 'bold' : 'normal'
                        }}>
                          {status}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
