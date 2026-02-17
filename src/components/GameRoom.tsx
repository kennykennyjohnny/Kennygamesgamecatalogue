import { useState, useEffect } from 'react';
import { supabase } from '../utils/client';
import { ArrowLeft, Loader2 } from 'lucide-react';

// Import all 4 games
import LeanavGame from './games/leanav/LeanavGame';
import NourarcheryGame from './games/nourarchery/NourarcheryGame';
import SandyGame from './games/sandy/SandyGame';
import LilianoGame from './games/liliano/LilianoGame';

interface GameRoomProps {
  game: {
    id: string;
    game_type: string;
    short_code: string;
    current_player_id: string;
    status: string;
  };
  currentUserId: string;
  currentUserName: string;
  onBack: () => void;
}

export function GameRoom({ game, currentUserId, currentUserName, onBack }: GameRoomProps) {
  const [players, setPlayers] = useState<any[]>([]);
  const [gameState, setGameState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMyTurn, setIsMyTurn] = useState(game.current_player_id === currentUserId);

  useEffect(() => {
    loadGameData();

    // Subscribe to realtime updates on challenges table
    const channel = supabase
      .channel(`challenge-${game.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'challenges',
        filter: `id=eq.${game.id}`,
      }, (payload: any) => {
        const updated = payload.new;
        setGameState(updated.game_state || {});
        setIsMyTurn(updated.current_turn_user_id === currentUserId);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [game.id]);

  const loadGameData = async () => {
    setLoading(true);

    // Load challenge data
    const { data: challenge } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', game.id)
      .single();

    if (challenge) {
      setGameState(challenge.game_state || { initialized: true });
      setIsMyTurn(challenge.current_turn_user_id === currentUserId);

      // Build players array from challenge
      const playerIds = [challenge.from_user_id, challenge.to_user_id];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, username')
        .in('id', playerIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      setPlayers([
        {
          user_id: challenge.from_user_id,
          user_name: profileMap.get(challenge.from_user_id)?.username || 'Joueur 1',
          player_order: 1,
          status: 'ready',
        },
        {
          user_id: challenge.to_user_id,
          user_name: profileMap.get(challenge.to_user_id)?.username || 'Joueur 2',
          player_order: 2,
          status: 'ready',
        },
      ]);
    }

    setLoading(false);
  };

  const handleGameMove = async (moveData: any) => {
    // Get current challenge to update game_state
    const { data: current } = await supabase
      .from('challenges')
      .select('game_state, from_user_id, to_user_id')
      .eq('id', game.id)
      .single();

    if (!current) return;

    // Deep merge: preserve per-player state while adding new move data
    const prevState = current.game_state || {};
    const newState = {
      ...prevState,
      moves: [...(prevState.moves || []), { playerId: currentUserId, ts: Date.now(), ...moveData }],
      lastMove: { playerId: currentUserId, ...moveData },
    };

    // Copy player-specific state if provided
    if (moveData._playerState) {
      newState[`player_${currentUserId}`] = moveData._playerState;
      delete newState.lastMove._playerState;
    }

    // Determine next turn (some moves keep the same turn)
    const keepTurn = moveData._keepTurn === true;
    const nextTurn = keepTurn
      ? currentUserId
      : (current.from_user_id === currentUserId ? current.to_user_id : current.from_user_id);

    // Clean internal flags
    if (newState.lastMove._keepTurn !== undefined) delete newState.lastMove._keepTurn;

    await supabase
      .from('challenges')
      .update({
        game_state: newState,
        current_turn_user_id: nextTurn,
      })
      .eq('id', game.id);

    setGameState(newState);
    setIsMyTurn(keepTurn);
  };

  const handleGameEnd = async (finalState: any) => {
    await supabase
      .from('challenges')
      .update({
        status: 'finished',
        game_state: finalState,
        winner_id: finalState.winner_id || null,
        finished_at: new Date().toISOString(),
      })
      .eq('id', game.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  const currentPlayer = players.find(p => p.user_id === currentUserId);

  const renderGame = () => {
    const opponent = players.find(p => p.user_id !== currentUserId);
    const commonProps = {
      gameId: game.id,
      playerId: currentUserId,
      opponentId: opponent?.user_id || '',
      isPlayerTurn: isMyTurn,
      gameState: gameState,
      onMove: handleGameMove,
      onGameOver: handleGameEnd,
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
            <p className="text-xl mb-4 text-white">Jeu non reconnu: {game.game_type}</p>
            <button onClick={onBack} className="px-6 py-3 rounded-lg bg-emerald-600 text-white">
              Retour
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quitter</span>
          </button>
          
          <div className="text-center">
            <p className="text-sm text-white/60">Partie {game.short_code}</p>
            <p className="font-bold text-emerald-400">
              {isMyTurn ? '🎯 Ton tour !' : '⏳ En attente...'}
            </p>
          </div>

          <div className="w-24" />
        </div>
      </div>

      {/* Game Component */}
      <div className="max-w-6xl mx-auto">
        {renderGame()}
      </div>
    </div>
  );
}
