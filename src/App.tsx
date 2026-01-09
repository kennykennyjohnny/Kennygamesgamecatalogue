import { useState, useEffect } from 'react';
import { AuthForm } from './components/AuthForm';
import { VifGame } from './components/games/VifGame';
import { PlusGame } from './components/games/PlusGame';
import { MoinsGame } from './components/games/MoinsGame';
import { MultiGame } from './components/games/MultiGame';
import { DivGame } from './components/games/DivGame';
import { MixGame } from './components/games/MixGame';
import { FriendsTab } from './components/FriendsTab';
import { ProfileTab } from './components/ProfileTab';
import { Card } from './components/ui/card';
import { GoatLogo } from './components/GoatLogo';
import { LogOut, Zap, Plus, Minus, X, Divide, Shuffle, Crown, Trophy, Users, User, Home } from 'lucide-react';

type GameId = 'menu' | 'vif' | 'plus' | 'moins' | 'multi' | 'div' | 'mix';
type TabId = 'friends' | 'home' | 'profile';

interface UserStats {
  totalGames: number;
  totalScore: number;
  gameScores: {
    [key: string]: {
      bestScore: number;
      totalGames: number;
    };
  };
}

const FAKE_LEADERBOARD = [
  { rank: 1, name: 'SuperKenny', totalScore: 850, highlight: true },
  { rank: 2, name: 'FlashMaster', totalScore: 720 },
  { rank: 3, name: 'CalcWizard', totalScore: 680 },
  { rank: 4, name: 'SpeedRunner', totalScore: 540 },
  { rank: 5, name: 'MathNinja', totalScore: 490 },
];

const FAKE_GAME_LEADERS = {
  vif: { allTime: { name: 'ReflexPro', score: 850 }, today: { name: 'QuickShot', score: 720 } },
  plus: { allTime: { name: 'CalcMaster', score: 45 }, today: { name: 'SpeedAdd', score: 38 } },
  moins: { allTime: { name: 'SubKing', score: 42 }, today: { name: 'FastSub', score: 35 } },
  multi: { allTime: { name: 'MultiPro', score: 40 }, today: { name: 'TimesMaster', score: 33 } },
  div: { allTime: { name: 'DivWizard', score: 38 }, today: { name: 'QuickDiv', score: 30 } },
  mix: { allTime: { name: 'AllRounder', score: 43 }, today: { name: 'MixKing', score: 36 } },
};

const TAGLINES = [
  "Excuse me, do you have 30 seconds to become a legend?",
  "Your high score is cute.",
  "Sorry, the Goat seat is taken. For now.",
  "Second place is just the first loser.",
  "You think you're good? The leaderboard disagrees.",
  "Talk less. Tap more."
];

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentGame, setCurrentGame] = useState<GameId>('menu');
  const [currentTab, setCurrentTab] = useState<TabId>('home');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [goatOfDay, setGoatOfDay] = useState<any>(null);
  const [goatAllTime, setGoatAllTime] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [currentTagline, setCurrentTagline] = useState(0);

  useEffect(() => {
    const storedToken = localStorage.getItem('kg_token');
    const storedUser = localStorage.getItem('kg_user');
    const storedDarkMode = localStorage.getItem('kg_darkMode') === 'true';
    
    setDarkMode(storedDarkMode);
    if (storedDarkMode) {
      document.documentElement.classList.add('dark');
    }
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      loadUserStats(storedToken);
      loadGoats();
    }
  }, []);

  useEffect(() => {
    if (token && currentGame === 'menu') {
      loadUserStats(token);
      loadGoats();
    }
  }, [currentGame, token]);

  // Rotation des taglines toutes les 5 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTagline((prev) => (prev + 1) % TAGLINES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadUserStats = async (userToken: string) => {
    try {
      const { api } = await import('./utils/api');
      const result = await api.getUserStats(userToken);
      if (result.success) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadGoats = async () => {
    try {
      const { api } = await import('./utils/api');
      const result = await api.getKennyOfDay();
      if (result.success && result.kenny) {
        setGoatOfDay(result.kenny);
      } else {
        setGoatOfDay({ userName: 'SuperKenny', totalScore: 850 });
      }
      setGoatAllTime({ userName: 'LegendKenny', totalScore: 2400 });
    } catch (error) {
      console.error('Failed to load GOATs:', error);
      setGoatOfDay({ userName: 'SuperKenny', totalScore: 850 });
      setGoatAllTime({ userName: 'LegendKenny', totalScore: 2400 });
    }
  };

  const handleAuthSuccess = (authUser: any, authToken: string) => {
    setUser(authUser);
    setToken(authToken);
    loadUserStats(authToken);
    loadGoats();
  };

  const handleLogout = () => {
    localStorage.removeItem('kg_token');
    localStorage.removeItem('kg_user');
    setUser(null);
    setToken(null);
    setStats(null);
    setCurrentGame('menu');
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('kg_darkMode', String(newDarkMode));
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleBackToMenu = () => {
    setCurrentGame('menu');
  };

  const calculateTotalScore = () => {
    if (!stats?.gameScores) return 0;
    return Object.values(stats.gameScores).reduce((sum, game) => sum + game.bestScore, 0);
  };

  if (!user || !token) {
    return <AuthForm onSuccess={handleAuthSuccess} />;
  }

  if (currentGame === 'vif') return <VifGame user={user} token={token} onBackToMenu={handleBackToMenu} />;
  if (currentGame === 'plus') return <PlusGame user={user} token={token} onBackToMenu={handleBackToMenu} />;
  if (currentGame === 'moins') return <MoinsGame user={user} token={token} onBackToMenu={handleBackToMenu} />;
  if (currentGame === 'multi') return <MultiGame user={user} token={token} onBackToMenu={handleBackToMenu} />;
  if (currentGame === 'div') return <DivGame user={user} token={token} onBackToMenu={handleBackToMenu} />;
  if (currentGame === 'mix') return <MixGame user={user} token={token} onBackToMenu={handleBackToMenu} />;

  const games = [
    { id: 'vif', name: 'VIF', icon: Zap, desc: 'Réflexes', color: '#E76F51', gradient: 'linear-gradient(135deg, #E76F51 0%, #F4A582 100%)' },
    { id: 'plus', name: 'PLUS', icon: Plus, desc: 'Additions', color: '#52B788', gradient: 'linear-gradient(135deg, #52B788 0%, #74C69D 100%)' },
    { id: 'moins', name: 'MOINS', icon: Minus, desc: 'Soustractions', color: '#4A90E2', gradient: 'linear-gradient(135deg, #4A90E2 0%, #6BA6E8 100%)' },
    { id: 'multi', name: 'MULTI', icon: X, desc: 'Multiplications', color: '#9B59B6', gradient: 'linear-gradient(135deg, #9B59B6 0%, #B177C9 100%)' },
    { id: 'div', name: 'DIV', icon: Divide, desc: 'Divisions', color: '#F39C12', gradient: 'linear-gradient(135deg, #F39C12 0%, #F5B041 100%)' },
    { id: 'mix', name: 'MIX', icon: Shuffle, desc: 'Tout mélangé', color: '#E74C3C', gradient: 'linear-gradient(135deg, #E74C3C 0%, #EC7063 100%)' },
  ];

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--kg-bg)' }}>
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {currentTab === 'friends' && <FriendsTab />}
        
        {currentTab === 'profile' && (
          <ProfileTab 
            user={user} 
            stats={stats} 
            darkMode={darkMode}
            onToggleDarkMode={toggleDarkMode}
          />
        )}
        
        {currentTab === 'home' && (
          <div className="h-full overflow-y-auto p-4 md:p-6 pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="max-w-6xl mx-auto">
              {/* Header avec logo */}
              <div className="flex justify-between items-center mb-4">
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

              {/* GOAT of all time */}
              {goatAllTime && (
                <Card 
                  className="p-5 mb-4 transition-all duration-300 hover:scale-[1.02]" 
                  style={{ 
                    background: 'linear-gradient(135deg, #D4A574 0%, #B87333 100%)',
                    border: 'none',
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-transform hover:rotate-12">
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white/90 mb-1">
                        🐐 GOAT of All Time
                      </p>
                      <p className="text-2xl md:text-3xl font-black text-white truncate">
                        {goatAllTime.userName}
                      </p>
                      <p className="text-lg md:text-xl font-bold text-white/90">
                        {goatAllTime.totalScore} points
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* User Stats + TOP button */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <Card 
                  className="p-4 transition-all duration-300 hover:scale-105 col-span-2" 
                  style={{ 
                    backgroundColor: 'var(--kg-primary)', 
                    border: 'none',
                  }}
                >
                  <p className="text-sm font-bold text-white/90 mb-2">GOAT du jour</p>
                  <p className="text-2xl md:text-3xl font-black truncate text-white">
                    {goatOfDay?.userName || '---'}
                  </p>
                  <p className="text-lg font-bold text-white/90 mt-1">{goatOfDay?.totalScore || 0} pts</p>
                </Card>
                
                <button
                  onClick={() => setShowLeaderboard(!showLeaderboard)}
                  className="p-4 rounded-lg transition-all hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-2"
                  style={{ 
                    backgroundColor: 'var(--kg-primary)', 
                    color: 'white',
                  }}
                >
                  <Trophy className="w-8 h-8" />
                  <p className="text-sm font-bold">TOP</p>
                </button>
              </div>

              {/* Mon score */}
              <Card 
                className="p-4 mb-4 transition-all duration-300 hover:scale-105" 
                style={{ 
                  backgroundColor: 'var(--kg-card)', 
                  border: '2px solid var(--kg-primary)',
                }}
              >
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--kg-text-muted)' }}>Mon score total</p>
                <p className="text-4xl md:text-5xl font-black" style={{ color: 'var(--kg-primary)' }}>{calculateTotalScore()}</p>
              </Card>

              {/* Leaderboard */}
              {showLeaderboard && (
                <Card 
                  className="p-4 mb-4" 
                  style={{ backgroundColor: 'var(--kg-card)', border: '1px solid var(--border)' }}
                >
                  <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--kg-text)' }}>🏆 Classement Global</h3>
                  <div className="space-y-2">
                    {FAKE_LEADERBOARD.map((entry) => (
                      <div
                        key={entry.rank}
                        className="flex items-center justify-between p-2 rounded transition-transform hover:scale-[1.02]"
                        style={{
                          backgroundColor: entry.highlight ? 'var(--kg-primary)' : 'var(--kg-bg)',
                          color: entry.highlight ? 'white' : 'var(--kg-text)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold w-6">#{entry.rank}</span>
                          <span className="font-medium">{entry.name}</span>
                        </div>
                        <span className="font-bold">{entry.totalScore}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Games Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {games.map((game) => {
                  const Icon = game.icon;
                  const myBestScore = stats?.gameScores?.[game.id]?.bestScore || 0;
                  const leaders = FAKE_GAME_LEADERS[game.id as keyof typeof FAKE_GAME_LEADERS];
                  
                  return (
                    <button
                      key={game.id}
                      onClick={() => setCurrentGame(game.id as GameId)}
                      className="relative overflow-hidden rounded-2xl p-4 md:p-6 text-left transition-all hover:scale-105 active:scale-95 shadow-lg"
                      style={{ 
                        background: game.gradient,
                        border: 'none',
                        minHeight: '200px',
                      }}
                    >
                      <div className="relative z-10 flex flex-col h-full">
                        <Icon className="w-12 h-12 md:w-16 md:h-16 text-white mb-2 opacity-90 transition-transform hover:rotate-12" strokeWidth={1.5} />
                        
                        <h3 className="text-2xl md:text-3xl font-black text-white mb-1">
                          {game.name}
                        </h3>
                        
                        <p className="text-xs text-white/80 mb-3">
                          {game.desc} • 30s
                        </p>
                        
                        <div className="mt-auto space-y-1 text-xs">
                          <div className="bg-white/20 backdrop-blur-sm rounded px-2 py-1 transition-all hover:bg-white/30">
                            <p className="text-white/70 text-[10px]">🏆 All time</p>
                            <p className="text-white font-bold">{leaders.allTime.name} • {leaders.allTime.score}</p>
                          </div>
                          <div className="bg-white/20 backdrop-blur-sm rounded px-2 py-1 transition-all hover:bg-white/30">
                            <p className="text-white/70 text-[10px]">⭐ Aujourd'hui</p>
                            <p className="text-white font-bold">{leaders.today.name} • {leaders.today.score}</p>
                          </div>
                          {myBestScore > 0 && (
                            <div className="bg-white/30 backdrop-blur-sm rounded px-2 py-1 transition-all hover:bg-white/40">
                              <p className="text-white/90 text-[10px]">💪 Mon record</p>
                              <p className="text-white font-bold">{myBestScore}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="absolute top-0 right-0 opacity-10 transition-opacity hover:opacity-20">
                        <Icon className="w-32 h-32 md:w-40 md:h-40 text-white" strokeWidth={1} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* iOS Liquid Glass Navigation */}
      <div 
        className="fixed bottom-0 left-0 right-0 pb-safe z-50"
        style={{
          background: darkMode 
            ? 'linear-gradient(to top, rgba(21, 42, 31, 0.95), rgba(21, 42, 31, 0.8))'
            : 'linear-gradient(to top, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.8))',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderTop: `1px solid ${darkMode ? 'rgba(82, 183, 136, 0.2)' : 'rgba(45, 106, 79, 0.15)'}`,
        }}
      >
        <div className="max-w-md mx-auto px-8 py-2">
          <div className="flex items-center justify-around">
            <button
              onClick={() => setCurrentTab('friends')}
              className="flex flex-col items-center gap-1 py-2 px-6 transition-all duration-300 hover:scale-110 active:scale-95"
              style={{
                color: currentTab === 'friends' ? 'var(--kg-primary)' : 'var(--kg-text-muted)',
              }}
            >
              <Users className={`w-6 h-6 transition-all ${currentTab === 'friends' ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium">Amis</span>
              {currentTab === 'friends' && (
                <div 
                  className="w-1 h-1 rounded-full animate-pulse" 
                  style={{ backgroundColor: 'var(--kg-primary)' }}
                />
              )}
            </button>

            <button
              onClick={() => setCurrentTab('home')}
              className="flex flex-col items-center gap-1 py-2 px-6 transition-all duration-300 hover:scale-110 active:scale-95"
              style={{
                color: currentTab === 'home' ? 'var(--kg-primary)' : 'var(--kg-text-muted)',
              }}
            >
              <Home className={`w-6 h-6 transition-all ${currentTab === 'home' ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium">Accueil</span>
              {currentTab === 'home' && (
                <div 
                  className="w-1 h-1 rounded-full animate-pulse" 
                  style={{ backgroundColor: 'var(--kg-primary)' }}
                />
              )}
            </button>

            <button
              onClick={() => setCurrentTab('profile')}
              className="flex flex-col items-center gap-1 py-2 px-6 transition-all duration-300 hover:scale-110 active:scale-95"
              style={{
                color: currentTab === 'profile' ? 'var(--kg-primary)' : 'var(--kg-text-muted)',
              }}
            >
              <User className={`w-6 h-6 transition-all ${currentTab === 'profile' ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium">Profil</span>
              {currentTab === 'profile' && (
                <div 
                  className="w-1 h-1 rounded-full animate-pulse" 
                  style={{ backgroundColor: 'var(--kg-primary)' }}
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}