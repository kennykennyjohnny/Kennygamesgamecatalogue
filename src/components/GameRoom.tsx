import { useState, useEffect } from 'react';
import { PartyGame, GamePlayer } from '@/utils/gameTypes';
import { partyApi } from '@/utils/partyApi';
import { ArrowLeft, Loader2 } from 'lucide-react';

// Import all 4 games
import { LeanavGame } from './games/leanav/LeanavGame';
import { NourarcheryGame } from './games/nourarchery/NourarcheryGame';
import { SandyGame } from './games/sandy/SandyGame';
import { LilianoGame } from './games/liliano/LilianoGame';

interface GameRoomProps {
  game: PartyGame;
  currentUserId: string;
  currentUserName: string;
  onBack: () => void;
}

export function GameRoom({ game, currentUserId, currentUserName, onBack }: GameRoomProps) {
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [gameState, setGameState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGameData();

    // Subscribe to realtime updates
    const channel = partyApi.subscribeToGame(game.id, () => {
      loadGameData();
    });

    return () => {
      channel.unsubscribe();
    };
  }, [game.id]);

  const loadGameData = async () => {
    setLoading(true);
    
    // Load players
    const result = await partyApi.getGameByCode(game.short_code);
    if (result.success && result.players) {
      setPlayers(result.players);
    }

    // Load game state
    const stateResult = await partyApi.getGameState(game.id);
    if (stateResult.success && stateResult.state) {
      setGameState(stateResult.state);
    } else {
      // Initialize empty state if none exists
      setGameState({ initialized: true });
    }

    setLoading(false);
  };

  const handleGameMove = async (moveData: any) => {
    // Save move to Supabase
    await partyApi.recordGameMove(game.id, currentUserId, moveData);
    
    // Reload game data to get updated state
    loadGameData();
  };

  const handleGameEnd = async (finalState: any) => {
    await partyApi.endGame(game.id, finalState);
    // Could trigger confetti, show winner, etc.
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--kg-bg)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--kg-primary)' }} />
      </div>
    );
  }

  const currentPlayer = players.find(p => p.user_id === currentUserId);
  const isMyTurn = game.current_player_id === currentUserId;

  // Render the appropriate game based on game_type
  const renderGame = () => {
    const commonProps = {
      players,
      currentPlayer,
      isMyTurn,
      gameState,
      onMove: handleGameMove,
      onGameEnd: handleGameEnd,
    };

    switch (game.game_type) {
      case 'lea':
        return <LeanavGame {...commonProps} />;
      
      case 'nour':
        return <NourarcheryGame {...commonProps} />;
      
      case 'sandy':
        return <SandyGame {...commonProps} />;
      
      case 'liliano':
        return <LilianoGame {...commonProps} />;
      
      default:
        return (
          <div className="text-center p-8">
            <p className="text-xl mb-4">Jeu non reconnu: {game.game_type}</p>
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-lg"
              style={{ backgroundColor: 'var(--kg-primary)', color: 'white' }}
            >
              Retour
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--kg-bg)' }}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: 'var(--kg-text)' }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quitter</span>
          </button>
          
          <div className="text-center">
            <p className="text-sm text-white/60">Partie {game.short_code}</p>
            <p className="font-bold" style={{ color: 'var(--kg-primary)' }}>
              {isMyTurn ? '🎯 Ton tour !' : '⏳ En attente...'}
            </p>
          </div>

          <div className="w-24"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Game Component */}
      <div className="max-w-6xl mx-auto">
        {renderGame()}
      </div>
    </div>
  );
}
