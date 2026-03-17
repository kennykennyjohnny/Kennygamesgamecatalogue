import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, X, Loader2, Swords } from 'lucide-react';
import { GameIcon } from './GameIcon';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../utils/client';

interface Match {
  id: string;
  gameId: 'sandy' | 'lea' | 'liliano' | 'nour';
  gameName: string;
  opponent: string;
  opponentAvatar: string;
  opponentId: string;
  isMyTurn: boolean;
  myScore: number;
  opponentScore: number;
}

interface FriendOption {
  id: string;
  username: string;
  avatar: string;
}

interface HomeScreenProps {
  onPlayMatch?: (match: Match) => void;
}

export function HomeScreen({ onPlayMatch }: HomeScreenProps) {
  const { colors } = useTheme();
  const [activeMatches, setActiveMatches] = useState<Match[]>([]);
  const [globalStats, setGlobalStats] = useState({ wins: 0, losses: 0, currentStreak: 0, bestStreak: 0 });
  const [gameStats, setGameStats] = useState<any[]>([]);
  const [userId, setUserId] = useState('');
  const [selectedGame, setSelectedGame] = useState<{ id: string; name: string } | null>(null);
  const [friends, setFriends] = useState<FriendOption[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [creatingGame, setCreatingGame] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Realtime: auto-refresh active matches when challenges change
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('home-challenges')
      .on('postgres_changes' as any, {
        event: '*',
        schema: 'public',
        table: 'challenges',
      }, () => {
        loadActiveMatches(userId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setUserId(user.id);
    await Promise.all([loadActiveMatches(user.id), loadStats(user.id)]);
  }

  async function loadActiveMatches(currentUserId: string) {
    const { data } = await supabase
      .from('challenges')
      .select('id, game_type, from_user_id, to_user_id, current_turn_user_id, status, game_state')
      .in('status', ['playing', 'accepted'])
      .or(`from_user_id.eq.${currentUserId},to_user_id.eq.${currentUserId}`);

    if (data && data.length > 0) {
      const opponentIds = data.map((c: any) => 
        c.from_user_id === currentUserId ? c.to_user_id : c.from_user_id
      );

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, username')
        .in('id', opponentIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      const matches = data.map((c: any) => {
        const isChallenger = c.from_user_id === currentUserId;
        const opponentId = isChallenger ? c.to_user_id : c.from_user_id;
        const opponentProfile = profileMap.get(opponentId);
        const gs = c.game_state || {};
        
        return {
          id: c.id,
          gameId: c.game_type,
          gameName: getGameName(c.game_type),
          opponent: opponentProfile?.username || 'Joueur',
          opponentAvatar: '🎮',
          opponentId,
          isMyTurn: c.current_turn_user_id === currentUserId,
          myScore: isChallenger ? (gs.challenger_score || 0) : (gs.opponent_score || 0),
          opponentScore: isChallenger ? (gs.opponent_score || 0) : (gs.challenger_score || 0),
        };
      });
      setActiveMatches(matches);
    }
  }

  async function loadStats(currentUserId: string) {
    const { data } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', currentUserId)
      .single();

    if (data) {
      setGlobalStats({
        wins: data.total_wins || 0,
        losses: data.total_losses || 0,
        currentStreak: data.current_streak || 0,
        bestStreak: data.best_streak || 0,
      });

      setGameStats([
        { gameId: 'sandy', name: 'SandyPong', wins: data.sandy_wins || 0, losses: data.sandy_losses || 0 },
        { gameId: 'nour', name: 'NourPigeon', wins: data.nour_wins || 0, losses: data.nour_losses || 0 },
        { gameId: 'liliano', name: 'LilianoThunder', wins: data.liliano_wins || 0, losses: data.liliano_losses || 0 },
        { gameId: 'lea', name: 'LéaNaval', wins: data.lea_wins || 0, losses: data.lea_losses || 0 },
      ]);
    }
  }

  function getGameName(gameType: string): string {
    const names: Record<string, string> = {
      sandy: 'SandyPong',
      lea: 'LéaNaval',
      liliano: 'LilianoThunder',
      nour: 'NourPigeon',
    };
    return names[gameType] || gameType;
  }

  async function openGamePicker(gameId: string, gameName: string) {
    setSelectedGame({ id: gameId, name: gameName });
    setLoadingFriends(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get accepted friendships (both directions)
    const { data: sent } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', user.id)
      .eq('status', 'accepted');

    const { data: received } = await supabase
      .from('friendships')
      .select('user_id')
      .eq('friend_id', user.id)
      .eq('status', 'accepted');

    const friendIds = [
      ...(sent || []).map((f: any) => f.friend_id),
      ...(received || []).map((f: any) => f.user_id),
    ];

    if (friendIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, username')
        .in('id', friendIds);

      setFriends((profiles || []).map((p: any) => ({
        id: p.id,
        username: p.username,
        avatar: '🎮',
      })));
    } else {
      setFriends([]);
    }
    setLoadingFriends(false);
  }

  async function startGameWithFriend(friendId: string) {
    if (!selectedGame || creatingGame) return;
    setCreatingGame(true);

    try {
      const { data: challenge, error } = await supabase
        .from('challenges')
        .insert({
          game_type: selectedGame.id,
          from_user_id: userId,
          to_user_id: friendId,
          current_turn_user_id: userId,
          status: 'playing',
          game_state: {},
        })
        .select('id')
        .single();

      if (error) throw error;

      setSelectedGame(null);
      setCreatingGame(false);

      // Launch the game
      onPlayMatch?.({
        id: challenge.id,
        gameId: selectedGame.id as any,
        gameName: selectedGame.name,
        opponent: '',
        opponentAvatar: '🎮',
        opponentId: friendId,
        isMyTurn: true,
        myScore: 0,
        opponentScore: 0,
      });
    } catch (err) {
      console.error('Error creating challenge:', err);
      setCreatingGame(false);
    }
  }

  return (
    <div className="min-h-screen p-4 pt-16 pb-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* PARTIES EN COURS */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-black text-white mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Parties en cours
          </h2>
          <div className="space-y-2">
            {activeMatches.length === 0 && (
              <div
                className="rounded-xl p-6 text-center border border-white/10"
                style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)' }}
              >
                <p className="text-3xl mb-2">🎮</p>
                <p className="text-sm text-white/50" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Aucune partie en cours — lance un défi !
                </p>
              </div>
            )}
            {activeMatches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: match.isMyTurn ? 3 : 0 }}
                whileTap={match.isMyTurn ? { scale: 0.99 } : {}}
                onClick={() => match.isMyTurn && onPlayMatch?.(match)}
                className={`group ${match.isMyTurn ? 'cursor-pointer' : ''}`}
              >
                <div
                  className="relative rounded-xl p-3 border overflow-hidden"
                  style={{
                    background: match.isMyTurn 
                      ? `${colors.primary}15`
                      : 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(10px)',
                    borderColor: match.isMyTurn 
                      ? `${colors.primary}60`
                      : 'rgba(255, 255, 255, 0.08)',
                    boxShadow: match.isMyTurn ? `0 0 20px ${colors.primary}20` : 'none',
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Game Icon */}
                    <div className="flex-shrink-0 w-12 h-12">
                      <GameIcon type={match.gameId} />
                    </div>

                    {/* Match Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-bold text-white truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {match.gameName}
                        </h3>
                        {match.isMyTurn && (
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0"
                            style={{
                              background: `${colors.primary}50`,
                              color: colors.primary,
                              fontFamily: 'Inter, sans-serif',
                            }}
                          >
                            À toi
                          </motion.div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>
                          vs {match.opponent}
                        </span>
                        <span className="text-white/30">•</span>
                        <span className="font-semibold" style={{ fontFamily: 'Inter, sans-serif', color: colors.primary }}>
                          {match.myScore}
                        </span>
                        <span className="text-white/30">-</span>
                        <span className="font-semibold text-white/50" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {match.opponentScore}
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    {match.isMyTurn ? (
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          background: colors.gradient,
                        }}
                      >
                        <ChevronRight className="text-white" size={16} />
                      </motion.div>
                    ) : (
                      <div className="flex-shrink-0 text-[10px] px-2 py-1 rounded text-white/40"
                           style={{
                             background: 'rgba(255, 255, 255, 0.05)',
                             fontFamily: 'Inter, sans-serif',
                           }}>
                        ⏳
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* LANCER UN JEU */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xl font-black text-white mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Lancer un jeu
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'sandy', name: 'SandyPong', subtitle: 'Beer Pong Rosé' },
              { id: 'lea', name: 'LéaNaval', subtitle: 'Bataille Navale' },
              { id: 'liliano', name: 'LilianoThunder', subtitle: 'Artillerie Punk' },
              { id: 'nour', name: 'NourPigeon', subtitle: 'Tir aux Pigeons' },
            ].map((game, index) => (
              <motion.button
                key={game.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 + index * 0.05 }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openGamePicker(game.id, game.name)}
                className="p-4 rounded-2xl text-center border border-white/10 relative overflow-hidden group"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity blur-xl"
                  style={{
                    background: `radial-gradient(circle at center, ${colors.primary}40 0%, transparent 70%)`,
                  }}
                />
                
                <div className="relative">
                  <div className="w-20 h-20 mx-auto mb-3">
                    <GameIcon type={game.id} />
                  </div>
                  <h4 className="font-bold text-white text-sm mb-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {game.name}
                  </h4>
                  <p className="text-[10px] text-white/50" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {game.subtitle}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* STATS GLOBALES */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-xl font-black text-white mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Statistiques
          </h3>
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="rounded-xl p-3 text-center border border-white/10"
                 style={{
                   background: `${colors.primary}15`,
                   backdropFilter: 'blur(10px)',
                 }}>
              <p className="text-2xl font-black" style={{ fontFamily: 'Outfit, sans-serif', color: colors.primary }}>
                {globalStats.wins}
              </p>
              <p className="text-[10px] text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>
                Victoires
              </p>
            </div>
            <div className="rounded-xl p-3 text-center border border-white/10"
                 style={{
                   background: 'rgba(239, 68, 68, 0.08)',
                   backdropFilter: 'blur(10px)',
                 }}>
              <p className="text-2xl font-black text-red-400" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {globalStats.losses}
              </p>
              <p className="text-[10px] text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>
                Défaites
              </p>
            </div>
            <div className="rounded-xl p-3 text-center border border-white/10"
                 style={{
                   background: 'rgba(251, 191, 36, 0.08)',
                   backdropFilter: 'blur(10px)',
                 }}>
              <p className="text-2xl font-black text-amber-400" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {globalStats.currentStreak}
              </p>
              <p className="text-[10px] text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>
                Série
              </p>
            </div>
            <div className="rounded-xl p-3 text-center border border-white/10"
                 style={{
                   background: 'rgba(139, 92, 246, 0.08)',
                   backdropFilter: 'blur(10px)',
                 }}>
              <p className="text-2xl font-black text-purple-400" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {globalStats.bestStreak}
              </p>
              <p className="text-[10px] text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>
                Record
              </p>
            </div>
          </div>
        </motion.div>

        {/* STATS PAR JEU */}
        {gameStats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Par jeu
            </h3>
          <div className="space-y-2">
            {gameStats.map((stat) => (
              <div
                key={stat.gameId}
                className="rounded-xl p-3 border border-white/10"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex-shrink-0">
                    <GameIcon type={stat.gameId} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {stat.name}
                    </p>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span style={{ fontFamily: 'Inter, sans-serif', color: colors.primary }} className="font-semibold">
                        {stat.wins}V
                      </span>
                      <span className="text-white/30">•</span>
                      <span className="text-red-400 font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {stat.losses}D
                      </span>
                      <span className="text-white/30">•</span>
                      <span className="text-white/50 font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {stat.wins + stat.losses > 0 ? Math.round((stat.wins / (stat.wins + stat.losses)) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        )}
      </div>

      {/* FRIEND PICKER MODAL */}
      <AnimatePresence>
        {selectedGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => !creatingGame && setSelectedGame(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-white/10 overflow-hidden"
              style={{
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Header */}
              <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10">
                    <GameIcon type={selectedGame.id} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {selectedGame.name}
                    </h3>
                    <p className="text-xs text-white/50" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Choisis un ami à défier
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedGame(null)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X size={20} className="text-white/50" />
                </button>
              </div>

              {/* Friend List */}
              <div className="p-3 max-h-[50vh] overflow-y-auto space-y-2">
                {loadingFriends && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-emerald-400" size={24} />
                    <span className="ml-2 text-sm text-white/50" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Chargement...
                    </span>
                  </div>
                )}

                {!loadingFriends && friends.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-4xl mb-3">👥</p>
                    <p className="text-sm text-white/50" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Ajoute des amis pour pouvoir les défier !
                    </p>
                  </div>
                )}

                {!loadingFriends && friends.map((friend) => (
                  <motion.button
                    key={friend.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => startGameWithFriend(friend.id)}
                    disabled={creatingGame}
                    className="w-full p-3 rounded-xl flex items-center gap-3 transition-colors"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: `${colors.primary}20` }}
                    >
                      {friend.avatar}
                    </div>
                    <span className="font-semibold text-white flex-1 text-left" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {friend.username}
                    </span>
                    <div
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                      style={{ background: colors.gradient }}
                    >
                      <Swords size={14} />
                      Défier
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}