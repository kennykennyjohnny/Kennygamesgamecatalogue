import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LogOut, Palette } from 'lucide-react';
import { useTheme, Theme, allThemes } from '../contexts/ThemeContext';
import { supabase } from '../utils/client';

interface ProfilePanelProps {
  user: { id: string; name: string; email: string };
  onLogout: () => void;
}

interface UserData {
  profile_emoji: string;
  created_at: string;
}

interface PlayerStats {
  total_games: number;
  total_wins: number;
  total_losses: number;
}

const availableEmojis = ['🎮', '🎯', '🏆', '⚡', '🍾', '🎪', '🎲', '👑', '💎', '🔥', '⭐', '🌟', '💫', '🎨', '🎭', '🎬', '🎤', '🎧', '🎸', '🎹', '🎺'];

export function ProfilePanel({ user, onLogout }: ProfilePanelProps) {
  const { theme, setTheme, colors } = useTheme();
  const [userData, setUserData] = useState<UserData>({ profile_emoji: '🎮', created_at: new Date().toISOString() });
  const [stats, setStats] = useState<PlayerStats>({ total_games: 0, total_wins: 0, total_losses: 0 });
  const [selectedEmoji, setSelectedEmoji] = useState<string>('🎮');

  // Load user data and stats
  useEffect(() => {
    loadUserData();
    loadStats();
  }, [user.id]);

  const loadUserData = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('profile_emoji, created_at')
      .eq('id', user.id)
      .single();

    if (data && !error) {
      setUserData(data);
      setSelectedEmoji(data.profile_emoji || '🎮');
    }
  };

  const loadStats = async () => {
    const { data, error } = await supabase
      .from('player_stats')
      .select('total_games, total_wins, total_losses')
      .eq('user_id', user.id)
      .single();

    if (data && !error) {
      setStats(data);
    }
  };

  const handleEmojiSelect = async (emoji: string) => {
    setSelectedEmoji(emoji);
    
    // Save to database
    await supabase
      .from('users')
      .update({ profile_emoji: emoji })
      .eq('id', user.id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const themeOptions: { id: Theme; name: string; gradient: string }[] = [
    { id: 'emerald', name: 'Emerald', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
    { id: 'blue', name: 'Blue', gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' },
    { id: 'purple', name: 'Purple', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' },
    { id: 'pink', name: 'Pink', gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)' },
  ];

  return (
    <div className="min-h-screen p-4 pt-16 pb-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-6 rounded-2xl border border-white/10"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Large Profile Emoji */}
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="text-8xl mb-4"
          >
            {selectedEmoji}
          </motion.div>

          {/* User Info */}
          <h3 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {user.name}
          </h3>
          <p className="text-white/60 text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            {user.email}
          </p>
          <p className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
            Member since {formatDate(userData.created_at)}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="p-4 rounded-xl border border-white/10 text-center"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <p className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {stats.total_games}
            </p>
            <p className="text-xs text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>
              Total Games
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03 }}
            className="p-4 rounded-xl border border-white/10 text-center"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <p className="text-3xl font-black mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: colors.primary }}>
              {stats.total_wins}
            </p>
            <p className="text-xs text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>
              Wins
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03 }}
            className="p-4 rounded-xl border border-white/10 text-center"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <p className="text-3xl font-black text-[#ef4444] mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {stats.total_losses}
            </p>
            <p className="text-xs text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>
              Losses
            </p>
          </motion.div>
        </div>

        {/* Emoji Picker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl border border-white/10"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl"
              style={{
                background: `${colors.primary}30`,
              }}
            >
              {selectedEmoji}
            </div>
            <div>
              <p className="font-bold text-white text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                Profile Emoji
              </p>
              <p className="text-xs text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>
                Choose your avatar
              </p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {availableEmojis.map((emoji) => (
              <motion.button
                key={emoji}
                whileHover={{ scale: 1.15, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleEmojiSelect(emoji)}
                className="aspect-square rounded-xl flex items-center justify-center text-3xl cursor-pointer border-2 transition-all"
                style={{
                  background: selectedEmoji === emoji ? `${colors.primary}30` : 'rgba(255, 255, 255, 0.05)',
                  borderColor: selectedEmoji === emoji ? colors.primary : 'transparent',
                }}
              >
                {emoji}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Theme Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
                Color Theme
              </p>
              <p className="text-xs text-white/60" style={{ fontFamily: 'Inter, sans-serif' }}>
                {themeOptions.find(t => t.id === theme)?.name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {themeOptions.map((t) => (
              <motion.button
                key={t.id}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTheme(t.id)}
                className="relative aspect-square rounded-xl overflow-hidden border-3 transition-all"
                style={{
                  background: t.gradient,
                  borderWidth: '3px',
                  borderColor: theme === t.id ? 'white' : 'rgba(255, 255, 255, 0.2)',
                  boxShadow: theme === t.id ? `0 0 20px ${t.gradient.match(/#[a-f0-9]{6}/i)?.[0]}50` : 'none',
                }}
              >
                {theme === t.id && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="text-white text-2xl font-bold drop-shadow-lg">✓</div>
                  </motion.div>
                )}
                <div className="absolute bottom-1 left-0 right-0 text-center">
                  <p className="text-white text-[10px] font-bold drop-shadow-md" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {t.name}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Logout Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogout}
          className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 mt-6"
          style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <LogOut size={20} />
          Logout
        </motion.button>
      </div>
    </div>
  );
}
