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
  opponentId: string;
  opponentAvatar: string;
  isMyTurn: boolean;
  myScore: number;
  opponentScore: number;
}

interface GlobalStats {
  wins: number;
  losses: number;
  currentStreak: number;
  bestStreak: number;
}

interface GameStat {
  gameId: 'sandy' | 'lea' | 'liliano' | 'nour';
  name: string;
  wins: number;
  losses: number;
}

interface Rivalry {
  opponent: string;
  opponentId: string;
  wins: number;
  losses: number;
  avatar: string;
}

const allGames = [
  { id: 'sandy', name: 'SandyPong', subtitle: 'Beer Pong' },
  { id: 'lea', name: 'LéaNaval', subtitle: 'Bataille' },
  { id: 'liliano', name: 'LilianoThunder', subtitle: 'Tank' },
  { id: 'nour', name: 'NourArchery', subtitle: 'Archery' },
];

const gameNameMapping: Record<string, string> = {
  sandy: 'SandyPong',
  lea: 'LéaNaval',
  liliano: 'LilianoThunder',
  nour: 'NourArchery',
};

export function HomeScreen({ userId }: { userId: string }) {
  const { colors } = useTheme();
  const [activeMatches, setActiveMatches] = useState<Match[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    wins: 0,
    losses: 0,
    currentStreak: 0,
    bestStreak: 0,
  });
  const [gameStats, setGameStats] = useState<GameStat[]>([]);
  const [rivalries, setRivalries] = useState<Rivalry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, [userId]);

  async function fetchAllData() {
    setLoading(true);
    try {
      await Promise.all([
        fetchActiveMatches(),
        fetchStats(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchActiveMatches() {
    try {
      const { data: challenges, error } = await supabase
        .from('challenges')
        .select(`
          id,
          from_user_id,
          to_user_id,
          game_type,
          current_turn_user_id,
          game_state,
          status
        `)
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .in('status', ['playing', 'sent'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!challenges || challenges.length === 0) {
        setActiveMatches([]);
        return;
      }

      // Get all opponent IDs
      const opponentIds = challenges.map(c => 
        c.from_user_id === userId ? c.to_user_id : c.from_user_id
      );

      // Fetch opponent profiles
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, username, avatar_url')
        .in('id', opponentIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const matches: Match[] = challenges.map(challenge => {
        const opponentId = challenge.from_user_id === userId ? challenge.to_user_id : challenge.from_user_id;
        const profile = profileMap.get(opponentId);
        const gameState = challenge.game_state || {};
        
        // Calculate scores from game_state
        let myScore = 0;
        let opponentScore = 0;
        
        if (gameState && typeof gameState === 'object') {
          const state = gameState as any;
          if (state.scores) {
            myScore = state.scores[userId] || 0;
            opponentScore = state.scores[opponentId] || 0;
          }
        }

        return {
          id: challenge.id,
          gameId: challenge.game_type as 'sandy' | 'lea' | 'liliano' | 'nour',
          gameName: gameNameMapping[challenge.game_type] || challenge.game_type,
          opponent: profile?.username || 'Inconnu',
          opponentId,
          opponentAvatar: profile?.avatar_url || '👤',
          isMyTurn: challenge.current_turn_user_id === userId,
          myScore,
          opponentScore,
        };
      });

      setActiveMatches(matches);
    } catch (error) {
      console.error('Error fetching active matches:', error);
      setActiveMatches([]);
    }
  }

  async function fetchStats() {
    try {
      // Fetch all finished challenges for this user
      const { data: challenges, error } = await supabase
        .from('challenges')
        .select('id, from_user_id, to_user_id, game_type, winner_id, finished_at')
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .eq('status', 'finished')
        .order('finished_at', { ascending: false });

      if (error) throw error;

      if (!challenges || challenges.length === 0) {
        return;
      }

      // Calculate global stats
      let wins = 0;
      let losses = 0;
      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;
      let lastWasWin = false;

      // Game stats by type
      const gameStatsMap: Record<string, { wins: number; losses: number }> = {
        sandy: { wins: 0, losses: 0 },
        lea: { wins: 0, losses: 0 },
        liliano: { wins: 0, losses: 0 },
        nour: { wins: 0, losses: 0 },
      };

      // Rivalry tracking
      const rivalryMap: Record<string, { wins: number; losses: number }> = {};

      challenges.forEach((challenge, index) => {
        const isWin = challenge.winner_id === userId;
        const opponentId = challenge.from_user_id === userId ? challenge.to_user_id : challenge.from_user_id;

        // Global stats
        if (isWin) {
          wins++;
          if (index === 0 || lastWasWin) {
            tempStreak++;
            currentStreak = tempStreak;
          } else {
            tempStreak = 1;
            if (index === 0) currentStreak = 1;
          }
          lastWasWin = true;
        } else {
          losses++;
          if (index === 0) currentStreak = 0;
          tempStreak = 0;
          lastWasWin = false;
        }

        bestStreak = Math.max(bestStreak, tempStreak);

        // Game-specific stats
        if (gameStatsMap[challenge.game_type]) {
          if (isWin) {
            gameStatsMap[challenge.game_type].wins++;
          } else {
            gameStatsMap[challenge.game_type].losses++;
          }
        }

        // Rivalry stats
        if (!rivalryMap[opponentId]) {
          rivalryMap[opponentId] = { wins: 0, losses: 0 };
        }
        if (isWin) {
          rivalryMap[opponentId].wins++;
        } else {
          rivalryMap[opponentId].losses++;
        }
      });

      setGlobalStats({
        wins,
        losses,
        currentStreak,
        bestStreak,
      });

      // Convert game stats to array
      const gameStatsArray: GameStat[] = Object.entries(gameStatsMap).map(([gameId, stats]) => ({
        gameId: gameId as 'sandy' | 'lea' | 'liliano' | 'nour',
        name: gameNameMapping[gameId] || gameId,
        wins: stats.wins,
        losses: stats.losses,
      })).filter(stat => stat.wins > 0 || stat.losses > 0);

      setGameStats(gameStatsArray);

      // Get top 3 rivalries
      const sortedRivalries = Object.entries(rivalryMap)
        .map(([opponentId, stats]) => ({
          opponentId,
          ...stats,
        }))
        .sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses))
        .slice(0, 3);

      // Fetch opponent profiles for rivalries
      if (sortedRivalries.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, username, avatar_url')
          .in('id', sortedRivalries.map(r => r.opponentId));

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        const rivalriesWithProfiles: Rivalry[] = sortedRivalries.map(rivalry => {
          const profile = profileMap.get(rivalry.opponentId);
          return {
            opponent: profile?.username || 'Inconnu',
            opponentId: rivalry.opponentId,
            wins: rivalry.wins,
            losses: rivalry.losses,
            avatar: profile?.avatar_url || '👤',
          };
        });

        setRivalries(rivalriesWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-4 pt-16 pb-6 flex items-center justify-center">
        <div className="text-white/60 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
          Chargement...
        </div>
      </div>
    );
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
          {activeMatches.length === 0 ? (
            <div 
              className="rounded-xl p-6 border border-white/10 text-center"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <p className="text-white/60 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                Aucune partie en cours
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeMatches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: match.isMyTurn ? 3 : 0 }}
                  whileTap={match.isMyTurn ? { scale: 0.99 } : {}}
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
          )}
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
            {allGames.map((game, index) => (
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
        {(globalStats.wins > 0 || globalStats.losses > 0) && (
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
        )}

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

        {/* RIVALITÉS */}
        {rivalries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Rivalités
            </h3>
            <div className="space-y-2">
              {rivalries.map((rival) => (
                <div
                  key={rival.opponentId}
                  className="rounded-xl p-3 border border-white/10"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                         style={{ background: `${colors.primary}30` }}>
                      {rival.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {rival.opponent}
                      </p>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span style={{ fontFamily: 'Inter, sans-serif', color: colors.primary }} className="font-semibold">
                          {rival.wins}V
                        </span>
                        <span className="text-white/30">-</span>
                        <span className="text-red-400 font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {rival.losses}D
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black" 
                         style={{ 
                           fontFamily: 'Outfit, sans-serif',
                           color: rival.wins > rival.losses ? colors.primary : '#ef4444'
                         }}>
                        {rival.wins > rival.losses ? '+' : ''}{rival.wins - rival.losses}
                      </p>
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
