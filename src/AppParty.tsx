import { useState, useEffect } from 'react'
import { supabase } from './utils/client'
import { Login } from './components/Login'
import { ProfileSetup } from './components/ProfileSetup'
import { GameSelection } from './components/GameSelection'
import { SandyGame } from './components/games/SandyGame'
import { Card } from './components/ui/card'
import { GoatLogo } from './components/GoatLogo'
import { LogOut, Home, Users, User } from 'lucide-react'
import { GAMES_META, GameType } from './utils/gameTypes'

type Screen = 'login' | 'profile-setup' | 'home' | 'game-selection' | 'playing'
type TabId = 'friends' | 'home' | 'profile'

const TAGLINES = [
  "Excuse me, do you have 30 seconds to become a legend?",
  "Your high score is cute.",
  "Sorry, the Goat seat is taken. For now.",
  "Second place is just the first loser.",
  "You think you're good? The leaderboard disagrees.",
  "Talk less. Play more."
]

export default function AppParty() {
  const [screen, setScreen] = useState<Screen>('login')
  const [currentTab, setCurrentTab] = useState<TabId>('home')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null)
  const [currentTagline, setCurrentTagline] = useState(0)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    checkUserState()
    
    const storedDarkMode = localStorage.getItem('kg_darkMode') === 'true'
    setDarkMode(storedDarkMode)
    if (storedDarkMode) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTagline((prev) => (prev + 1) % TAGLINES.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  async function checkUserState() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setScreen('login')
        setLoading(false)
        return
      }

      setUser(user)

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

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setScreen('login')
  }

  function toggleDarkMode() {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('kg_darkMode', String(newDarkMode))
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--kg-bg)' }}>
        <div className="text-xl">Chargement...</div>
      </div>
    )
  }

  if (screen === 'login') {
    return <Login onSuccess={() => checkUserState()} />
  }

  if (screen === 'profile-setup') {
    return <ProfileSetup onComplete={() => setScreen('home')} />
  }

  if (screen === 'game-selection') {
    return (
      <GameSelection
        onGameSelected={(gameType) => {
          setSelectedGame(gameType)
          setScreen('playing')
        }}
        onBack={() => {
          setScreen('home')
          setCurrentTab('home')
        }}
      />
    )
  }

  if (screen === 'playing' && selectedGame === 'sandy') {
    return <SandyGame user={user} token="" onBackToMenu={() => {
      setSelectedGame(null)
      setScreen('home')
    }} />
  }

  // HOME SCREEN - Style original KennyGames
  const games = [
    { 
      id: 'sandy' as GameType, 
      name: 'SANDYGAMES', 
      emoji: '🍷',
      desc: 'Beer Pong Rosé', 
      color: '#ffc0cb', 
      gradient: 'linear-gradient(135deg, #ffc0cb 0%, #ff1493 100%)' 
    },
    { 
      id: 'liliano' as GameType, 
      name: 'LILIANOGAMES', 
      emoji: '⚡',
      desc: 'Tank Guitares', 
      color: '#ff00ff', 
      gradient: 'linear-gradient(135deg, #ff00ff 0%, #00ffff 100%)' 
    },
    { 
      id: 'lea' as GameType, 
      name: 'LÉAGAMES', 
      emoji: '🚢',
      desc: 'Bataille Navale', 
      color: '#1e90ff', 
      gradient: 'linear-gradient(135deg, #1e90ff 0%, #00bfff 100%)' 
    },
    { 
      id: 'nour' as GameType, 
      name: 'NOURGAMES', 
      emoji: '🏹',
      desc: 'Archery', 
      color: '#d4a574', 
      gradient: 'linear-gradient(135deg, #d4a574 0%, #8b4513 100%)' 
    },
  ]

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--kg-bg)' }}>
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {currentTab === 'friends' && (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--kg-text-muted)' }} />
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--kg-text)' }}>Amis</h2>
              <p style={{ color: 'var(--kg-text-muted)' }}>Bientôt disponible !</p>
            </div>
          </div>
        )}
        
        {currentTab === 'profile' && (
          <div className="h-full overflow-y-auto p-4">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--kg-text)' }}>Profil</h2>
              <Card className="p-6">
                <p className="mb-4" style={{ color: 'var(--kg-text)' }}>
                  {user?.email}
                </p>
                <button
                  onClick={toggleDarkMode}
                  className="w-full px-4 py-2 rounded-lg mb-2"
                  style={{ backgroundColor: 'var(--kg-primary)', color: 'white' }}
                >
                  {darkMode ? '☀️ Mode clair' : '🌙 Mode sombre'}
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ backgroundColor: '#E76F51', color: 'white' }}
                >
                  Se déconnecter
                </button>
              </Card>
            </div>
          </div>
        )}
        
        {currentTab === 'home' && (
          <div className="h-full overflow-y-auto p-4 md:p-6 pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="max-w-md lg:max-w-2xl mx-auto">
              {/* Header avec logo */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <GoatLogo className="w-12 h-12 md:w-14 md:h-14" color="var(--kg-primary)" />
                  <div className="flex-1">
                    <h1 className="text-4xl md:text-5xl font-black" style={{ color: 'var(--kg-text)' }}>
                      KENNYGAMES
                    </h1>
                    <p 
                      key={currentTagline}
                      className="text-[11px] md:text-xs font-medium animate-fadeIn" 
                      style={{ 
                        color: 'var(--kg-text-muted)',
                        animation: 'fadeIn 0.5s ease-in-out'
                      }}
                    >
                      {TAGLINES[currentTagline]}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg transition-all hover:scale-110"
                  style={{ color: 'var(--kg-text-muted)' }}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>

              {/* Games Grid */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {games.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => setScreen('game-selection')}
                    className="relative group"
                  >
                    <Card 
                      className="p-6 md:p-8 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl active:scale-95"
                      style={{
                        background: game.gradient,
                        border: 'none',
                      }}
                    >
                      <div className="text-center">
                        <div className="text-5xl md:text-6xl mb-3 transform transition-transform group-hover:scale-110">
                          {game.emoji}
                        </div>
                        <h2 className="text-lg md:text-xl font-black mb-1 text-white drop-shadow-lg">
                          {game.name}
                        </h2>
                        <p className="text-xs md:text-sm text-white/90 font-medium">
                          {game.desc}
                        </p>
                      </div>
                    </Card>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div 
        className="fixed bottom-0 left-0 right-0 border-t safe-bottom"
        style={{ 
          backgroundColor: 'var(--kg-card)',
          borderColor: 'var(--kg-border)'
        }}
      >
        <div className="flex justify-around items-center px-4 py-3">
          <button
            onClick={() => setCurrentTab('friends')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
              currentTab === 'friends' ? 'scale-110' : ''
            }`}
            style={{ 
              color: currentTab === 'friends' ? 'var(--kg-primary)' : 'var(--kg-text-muted)'
            }}
          >
            <Users className="w-6 h-6" />
            <span className="text-xs font-semibold">Amis</span>
          </button>
          
          <button
            onClick={() => setCurrentTab('home')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
              currentTab === 'home' ? 'scale-110' : ''
            }`}
            style={{ 
              color: currentTab === 'home' ? 'var(--kg-primary)' : 'var(--kg-text-muted)'
            }}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-semibold">Accueil</span>
          </button>
          
          <button
            onClick={() => setCurrentTab('profile')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
              currentTab === 'profile' ? 'scale-110' : ''
            }`}
            style={{ 
              color: currentTab === 'profile' ? 'var(--kg-primary)' : 'var(--kg-text-muted)'
            }}
          >
            <User className="w-6 h-6" />
            <span className="text-xs font-semibold">Profil</span>
          </button>
        </div>
      </div>
    </div>
  )
}
