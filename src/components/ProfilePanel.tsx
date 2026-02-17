import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Trophy, Star, Bell, Shield, ChevronRight, LogOut, Palette, Shuffle } from 'lucide-react';
import { createAvatar } from '@dicebear/core';
import { funEmoji } from '@dicebear/collection';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { GameIcon } from './GameIcon';
import { supabase } from '../utils/client';

interface ProfilePanelProps {
  user: { id: string; name: string; email: string };
  onLogout: () => void;
}

export function ProfilePanel({ user, onLogout }: ProfilePanelProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const { theme, setTheme, colors } = useTheme();
  
  const [notifications, setNotifications] = useState(true);
  const [avatarSeed, setAvatarSeed] = useState('felix');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [recentGames, setRecentGames] = useState<{game: string; result: string; score: string; gameId: string}[]>([]);
  const [stats, setStats] = useState([
    { icon: Trophy, label: 'Victoires', value: '0', color: colors.primary },
    { icon: Star, label: 'Défaites', value: '0', color: '#ef4444' },
    { icon: Trophy, label: 'Série', value: '0', color: '#fbbf24' },
  ]);

  useEffect(() => {
    loadProfile();
  }, [user.id]);

  useEffect(() => {
    if (avatarSeed) {
      saveAvatar();
    }
  }, [avatarSeed]);

  useEffect(() => {
    saveTheme();
  }, [theme]);

  async function loadProfile() {
    // Try loading from users table first (has theme/emoji columns)
    const { data } = await supabase
      .from('users')
      .select('profile_emoji, user_theme')
      .eq('id', user.id)
      .single();

    if (data) {
      if (data.profile_emoji) setAvatarSeed(data.profile_emoji);
      if (data.user_theme) setTheme(data.user_theme as Theme);
    }

    // Load stats (may not exist yet, that's OK)
    const { data: statsData } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (statsData) {
      setStats([
        { icon: Trophy, label: 'Victoires', value: String(statsData.total_wins || 0), color: colors.primary },
        { icon: Star, label: 'Défaites', value: String(statsData.total_losses || 0), color: '#ef4444' },
        { icon: Trophy, label: 'Série', value: String(statsData.current_streak || 0), color: '#fbbf24' },
      ]);
    }

    // Load recent completed games
    const { data: recentData } = await supabase
      .from('challenges')
      .select('game_type, from_user_id, game_state, status, winner_id')
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .eq('status', 'finished')
      .order('finished_at', { ascending: false })
      .limit(5);

    if (recentData && recentData.length > 0) {
      const gameNames: Record<string, string> = {
        sandy: 'SandyPong', lea: 'LéaNaval', liliano: 'LilianoThunder', nour: 'NourArchery'
      };
      setRecentGames(recentData.map((g: any) => {
        const won = g.winner_id === user.id;
        const gs = g.game_state || {};
        const isChallenger = g.from_user_id === user.id;
        const myScore = isChallenger ? (gs.challenger_score || 0) : (gs.opponent_score || 0);
        const oppScore = isChallenger ? (gs.opponent_score || 0) : (gs.challenger_score || 0);
        return {
          game: gameNames[g.game_type] || g.game_type,
          result: g.winner_id ? (won ? 'Victoire' : 'Défaite') : 'Égalité',
          score: `${myScore}-${oppScore}`,
          gameId: g.game_type,
        };
      }));
    }
  }

  async function saveAvatar() {
    // Save to users table (upsert in case row doesn't exist)
    await supabase
      .from('users')
      .upsert({ id: user.id, username: user.name, email: user.email, profile_emoji: avatarSeed }, { onConflict: 'id' });
  }

  async function saveTheme() {
    await supabase
      .from('users')
      .upsert({ id: user.id, username: user.name, email: user.email, user_theme: theme }, { onConflict: 'id' });
  }

  const themes: { id: Theme; name: string }[] = [
    { id: 'emerald', name: 'Émeraude' },
    { id: 'blue', name: 'Bleu' },
    { id: 'purple', name: 'Violet' },
    { id: 'pink', name: 'Rose' },
  ];

  const avatarSeeds = ['felix', 'aneka', 'garfield', 'missy', 'leo', 'bear', 'lucky', 'luna', 'charlie', 'max'];

  const getAvatarUrl = (seed: string) => {
    const avatar = createAvatar(funEmoji, { seed });
    return avatar.toDataUri();
  };

  // Toggle component
  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: (value: boolean) => void }) => (
    <motion.button
      onClick={() => onChange(!enabled)}
      className="relative w-12 h-6 rounded-full transition-colors"
      style={{
        background: enabled ? `${colors.primary}50` : 'rgba(255, 255, 255, 0.1)',
        border: enabled ? `2px solid ${colors.primary}` : '2px solid rgba(255, 255, 255, 0.2)',
      }}
    >
      <motion.div
        animate={{ x: enabled ? 24 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-0.5 w-4 h-4 rounded-full"
        style={{
          background: enabled ? colors.primary : 'rgba(255, 255, 255, 0.5)',
        }}
      />
    </motion.button>
  );

  return (
    <div className="min-h-screen p-4 pt-16 pb-6">
      <div className="max-w-4xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'profile' ? 'text-white' : 'text-white/50'
            }`}
            style={{
              background: activeTab === 'profile' ? `${colors.primary}50` : 'rgba(255, 255, 255, 0.05)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Profil
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'settings' ? 'text-white' : 'text-white/50'
            }`}
            style={{
              background: activeTab === 'settings' ? `${colors.primary}50` : 'rgba(255, 255, 255, 0.05)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Paramètres
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {/* Avatar & Name */}
              <div
                className="text-center p-6 rounded-2xl border border-white/10"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div className="relative inline-block">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden cursor-pointer border-4"
                    style={{
                      borderColor: colors.primary,
                    }}
                  >
                    <img src={getAvatarUrl(avatarSeed)} alt="Avatar" className="w-full h-full" />
                  </motion.div>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setAvatarSeed(avatarSeeds[Math.floor(Math.random() * avatarSeeds.length)])}
                    className="absolute bottom-3 right-1/2 translate-x-8 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                    style={{
                      background: colors.gradient,
                    }}
                  >
                    <Shuffle className="text-white" size={14} />
                  </motion.button>
                </div>

                {/* Avatar Picker */}
                <AnimatePresence>
                  {showAvatarPicker && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 overflow-hidden"
                    >
                      <div className="grid grid-cols-5 gap-2 p-3 rounded-xl" style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
                        {avatarSeeds.map((seed) => (
                          <motion.button
                            key={seed}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setAvatarSeed(seed);
                              setShowAvatarPicker(false);
                            }}
                            className="w-full aspect-square rounded-full overflow-hidden border-2"
                            style={{
                              borderColor: avatarSeed === seed ? colors.primary : 'transparent',
                            }}
                          >
                            <img src={getAvatarUrl(seed)} alt={seed} className="w-full h-full" />
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <h3 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {user.name}
                </h3>
                <p className="text-white/60 text-sm mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {user.email}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.03 }}
                    className="p-4 rounded-xl border border-white/10 text-center"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <div className="flex justify-center mb-2">
                      <stat.icon style={{ color: stat.color }} size={24} />
                    </div>
                    <p className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {stat.value}
                    </p>
                    <p className="text-[10px] text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {stat.label}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Recent Games - loaded from DB */}
              {recentGames.length > 0 && (
              <div
                className="p-4 rounded-2xl border border-white/10"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <p className="text-xs text-white/40 uppercase font-bold mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Dernières parties
                </p>
                <div className="space-y-2">
                  {recentGames.map((game, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ x: 3 }}
                      className="p-3 rounded-xl"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex-shrink-0">
                          <GameIcon type={game.gameId} />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-white text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {game.game}
                          </p>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold`}
                              style={{ 
                                fontFamily: 'Inter, sans-serif',
                                color: game.result === 'Victoire' ? colors.primary : '#ef4444'
                              }}
                            >
                              {game.result}
                            </span>
                            <span className="text-[10px] text-white/40" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {game.score}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              )}

              {recentGames.length === 0 && (
                <div className="p-6 rounded-2xl border border-white/10 text-center" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                  <p className="text-white/40 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                    🎮 Aucune partie jouée pour l'instant
                  </p>
                </div>
              )}

            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {/* Notifications */}
              <div
                className="p-4 rounded-2xl border border-white/10"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: `${colors.primary}30`,
                      }}
                    >
                      <Bell style={{ color: colors.primary }} size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Notifications
                      </p>
                      <p className="text-xs text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {notifications ? 'Activées' : 'Désactivées'}
                      </p>
                    </div>
                  </div>
                  <Toggle enabled={notifications} onChange={setNotifications} />
                </div>
              </div>

              {/* Theme Selection */}
              <div
                className="p-4 rounded-2xl border border-white/10"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: `${colors.primary}30`,
                    }}
                  >
                    <Palette style={{ color: colors.primary }} size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Thème
                    </p>
                    <p className="text-xs text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {themes.find(t => t.id === theme)?.name}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  {themes.map((t) => {
                    const themeColors = {
                      emerald: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      blue: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      purple: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                      pink: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                    };
                    
                    return (
                      <motion.button
                        key={t.id}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setTheme(t.id)}
                        className="relative aspect-square rounded-xl overflow-hidden border-2"
                        style={{
                          background: themeColors[t.id],
                          borderColor: theme === t.id ? 'white' : 'transparent',
                        }}
                      >
                        {theme === t.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <div className="text-white text-2xl font-bold">✓</div>
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Privacy & Account */}
              <div
                className="p-4 rounded-2xl border border-white/10"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <motion.button
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-between p-3 rounded-xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Shield className="text-white/60" size={20} />
                    <div className="text-left">
                      <p className="font-semibold text-white text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Confidentialité
                      </p>
                      <p className="text-xs text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Gérer vos données
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="text-white/40" size={20} />
                </motion.button>

                <motion.button
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-between p-3 rounded-xl mt-2"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <User className="text-white/60" size={20} />
                    <div className="text-left">
                      <p className="font-semibold text-white text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Mon compte
                      </p>
                      <p className="text-xs text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Informations personnelles
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="text-white/40" size={20} />
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Logout Button */}
        <div className="mt-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogout}
            className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2"
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <LogOut size={20} />
            Se déconnecter
          </motion.button>
        </div>
      </div>
    </div>
  );
}