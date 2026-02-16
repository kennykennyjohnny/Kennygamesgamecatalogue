import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
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

interface HomeScreenProps {
  onPlayMatch?: (match: Match) => void;
}

export function HomeScreen({ onPlayMatch }: HomeScreenProps) {
  const { colors } = useTheme();
  const [activeMatches, setActiveMatches] = useState<Match[]>([]);
  const [globalStats, setGlobalStats] = useState({ wins: 0, losses: 0, currentStreak: 0, bestStreak: 0 });
  const [gameStats, setGameStats] = useState<any[]>([]);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setUserId(user.id);
    await loadActiveMatches(user.id);
    await loadStats(user.id);
  }

  async function loadActiveMatches(currentUserId: string) {
    const { data } = await supabase
      .from('challenges')
      .select('id, game_type, challenger_id, opponent_id, challenger_score, opponent_score, current_turn, status')
      .eq('status', 'active')
      .or(`challenger_id.eq.${currentUserId},opponent_id.eq.${currentUserId}`);

    if (data && data.length > 0) {
      // Get all opponent IDs
      const opponentIds = data.map((c: any) => 
        c.challenger_id === currentUserId ? c.opponent_id : c.challenger_id
      );

      // Fetch opponent profiles from user_profiles
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, username')
        .in('id', opponentIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      const matches = data.map((c: any) => {
        const isChallenger = c.challenger_id === currentUserId;
        const opponentId = isChallenger ? c.opponent_id : c.challenger_id;
        const opponentProfile = profileMap.get(opponentId);
        
        return {
          id: c.id,
          gameId: c.game_type,
          gameName: getGameName(c.game_type),
          opponent: opponentProfile?.username || 'Joueur',
          opponentAvatar: '🎮',
          opponentId,
          isMyTurn: c.current_turn === currentUserId,
          myScore: isChallenger ? c.challenger_score : c.opponent_score,
          opponentScore: isChallenger ? c.opponent_score : c.challenger_score,
        };
      });
      setActiveMatches(matches);
    }
  }

  async function loadStats(currentUserId: string) {
    const { data } = await supabase
      .from('player_stats')
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
        { gameId: 'nour', name: 'NourArchery', wins: data.nour_wins || 0, losses: data.nour_losses || 0 },
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
      nour: 'NourArchery',
    };
    return names[gameType] || gameType;
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
              { id: 'sandy', name: 'SandyPong', subtitle: 'Beer Pong' },
              { id: 'lea', name: 'LéaNaval', subtitle: 'Bataille' },
              { id: 'liliano', name: 'LilianoThunder', subtitle: 'Tank' },
              { id: 'nour', name: 'NourArchery', subtitle: 'Archery' },
            ].map((game, index) => (
              <motion.button
                key={game.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 + index * 0.05 }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
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
                        {Math.round((stat.wins / (stat.wins + stat.losses)) * 100)}%
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
    </div>
  );
}