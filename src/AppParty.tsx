import { useState, useEffect } from 'react';
import { AuthForm } from './components/AuthForm';
import { PartyHome } from './components/PartyHome';
import { GameSelection } from './components/GameSelection';
import { JoinGame } from './components/JoinGame';
import { GameLobby } from './components/party/GameLobby';
import { SandyGame } from './components/games/sandy/SandyGame';
import { GoatLogo } from './components/GoatLogo';
import { LogOut, Home as HomeIcon } from 'lucide-react';
import { partyApi } from './utils/partyApi';
import { PartyGame, GameType } from './utils/gameTypes';

type Screen = 'party-home' | 'create-game' | 'join-game' | 'lobby' | 'playing';

export default function AppParty() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('party-home');
  const [currentGame, setCurrentGame] = useState<PartyGame | null>(null);
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [darkMode, setDarkMode] = useState(false);

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
    }
  }, []);

  const handleAuthSuccess = (authUser: any, authToken: string) => {
    setUser(authUser);
    setToken(authToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('kg_token');
    localStorage.removeItem('kg_user');
    setUser(null);
    setToken(null);
    setCurrentScreen('party-home');
    setCurrentGame(null);
  };

  const handleGameCreated = async (gameId: string, type: GameType) => {
    // Load full game data
    const result = await partyApi.getGameByCode('');
    // For now, we'll use a simpler approach
    setGameType(type);
    setCurrentScreen('lobby');
    
    // Load game properly
    const games = await fetch(`https://zwzfoullsgqrnwfwdtyk.supabase.co/rest/v1/party_games?id=eq.${gameId}`, {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3emZvdWxsc2dxcm53ZndkdHlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDEyMDEsImV4cCI6MjA4MzQ3NzIwMX0.JlzLKVi1x4_4WQ3NWjrguPy_82rglDwJR_bwkwUp-Cc',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3emZvdWxsc2dxcm53ZndkdHlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDEyMDEsImV4cCI6MjA4MzQ3NzIwMX0.JlzLKVi1x4_4WQ3NWjrguPy_82rglDwJR_bwkwUp-Cc'
      }
    });
    const gameData = await games.json();
    if (gameData && gameData[0]) {
      setCurrentGame(gameData[0]);
    }
  };

  const handleGameJoined = async (gameId: string, shortCode: string) => {
    const result = await partyApi.getGameByCode(shortCode);
    if (result.success && result.game) {
      setCurrentGame(result.game);
      setGameType(result.game.game_type);
      setCurrentScreen('lobby');
    }
  };

  const handleStartPlaying = () => {
    setCurrentScreen('playing');
  };

  const handleBackToMenu = () => {
    setCurrentScreen('party-home');
    setCurrentGame(null);
    setGameType(null);
  };

  if (!user || !token) {
    return <AuthForm onSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--kg-bg)' }}>
      {/* Header (only on party-home) */}
      {currentScreen === 'party-home' && (
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '2px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <GoatLogo className="w-10 h-10" color="var(--kg-primary)" />
            <div>
              <h1 className="text-2xl font-black" style={{ color: 'var(--kg-text)' }}>
                KENNYGAMES
              </h1>
              <p className="text-xs font-medium" style={{ color: 'var(--kg-text-muted)' }}>
                PARTY
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
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {currentScreen === 'party-home' && (
          <PartyHome
            onCreateGame={() => setCurrentScreen('create-game')}
            onJoinGame={() => setCurrentScreen('join-game')}
          />
        )}

        {currentScreen === 'create-game' && (
          <GameSelection
            userId={user.id}
            userName={user.name}
            onGameCreated={handleGameCreated}
            onBack={() => setCurrentScreen('party-home')}
          />
        )}

        {currentScreen === 'join-game' && (
          <JoinGame
            userId={user.id}
            userName={user.name}
            onGameJoined={handleGameJoined}
            onBack={() => setCurrentScreen('party-home')}
          />
        )}

        {currentScreen === 'lobby' && currentGame && (
          <GameLobby
            game={currentGame}
            currentUserId={user.id}
            currentUserName={user.name}
            onStart={handleStartPlaying}
            onBack={handleBackToMenu}
          />
        )}

        {currentScreen === 'playing' && currentGame && gameType === 'sandy' && (
          <SandyGame
            game={currentGame}
            currentUserId={user.id}
            currentUserName={user.name}
            onBackToMenu={handleBackToMenu}
          />
        )}

        {currentScreen === 'playing' && gameType !== 'sandy' && (
          <div className="h-full flex items-center justify-center p-4" style={{ backgroundColor: 'var(--kg-bg)' }}>
            <div className="text-center">
              <p className="text-4xl mb-4">🚧</p>
              <p className="text-xl font-bold mb-2" style={{ color: 'var(--kg-text)' }}>
                Ce jeu arrive bientôt !
              </p>
              <button
                onClick={handleBackToMenu}
                className="mt-4 px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
                style={{ backgroundColor: 'var(--kg-primary)', color: 'white' }}
              >
                Retour
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
