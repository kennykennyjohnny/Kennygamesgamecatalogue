import { useState, useEffect } from 'react';
import { supabase } from '../utils/client';
import { GameRoom } from './GameRoom';
import { motion } from 'motion/react';

interface GameRoomWrapperProps {
  gameId: string;
  gameType: string;
  playerId: string;
  opponentId: string;
  onBack: () => void;
}

export function GameRoomWrapper({ gameId, gameType, playerId, opponentId, onBack }: GameRoomWrapperProps) {
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<any>(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadGameData();
  }, [gameId]);

  async function loadGameData() {
    const { data: challengeData } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', gameId)
      .single();

    if (challengeData) {
      const partyGame = {
        id: challengeData.id,
        game_type: challengeData.game_type,
        short_code: challengeData.id.substring(0, 6).toUpperCase(),
        current_player_id: challengeData.current_turn_user_id,
        status: challengeData.status,
      };

      setGame(partyGame);
    }

    // Try user_profiles first, then users
    let username = '';
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('id', playerId)
      .single();

    if (profileData) {
      username = profileData.username;
    } else {
      const { data: userData } = await supabase
        .from('users')
        .select('username')
        .eq('id', playerId)
        .single();
      if (userData) username = userData.username;
    }

    setUserName(username);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-white text-center">
          <p className="text-xl mb-4">Partie introuvable</p>
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <GameRoom
      game={game}
      currentUserId={playerId}
      currentUserName={userName}
      onBack={onBack}
    />
  );
}
