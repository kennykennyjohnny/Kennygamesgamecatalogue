import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User } from 'lucide-react';
import { supabase } from '../utils/client';
import { useTheme } from '../contexts/ThemeContext';

interface AuthScreenProps {
  onAuthSuccess: (user: { id: string; name: string; email: string }) => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { colors } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // LOGIN
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        if (data.user) {
          // Get user profile
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, username, email')
            .eq('id', data.user.id)
            .single();

          if (userError) throw userError;

          onAuthSuccess({
            id: userData.id,
            name: userData.username,
            email: userData.email,
          });
        }
      } else {
        // SIGNUP
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;

        if (data.user) {
          // Create user profile
          const { error: insertError } = await supabase
            .from('users')
            .insert([
              {
                id: data.user.id,
                username: name || email.split('@')[0],
                email: email,
              },
            ]);

          if (insertError) throw insertError;

          onAuthSuccess({
            id: data.user.id,
            name: name || email.split('@')[0],
            email: email,
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6">
      {/* ANIMATED GRADIENT BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at 20% 50%, ${colors.primary}40, transparent 50%), radial-gradient(circle at 80% 80%, ${colors.primaryDark}40, transparent 50%)`,
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: colors.primary,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* GLASSMORPHISM CARD */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div
          className="relative rounded-3xl p-8 shadow-2xl border border-white/20"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            boxShadow: `0 8px 32px 0 ${colors.primary}60`,
          }}
        >
          {/* LOGO */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="text-center mb-8"
          >
            <h1
              className="text-5xl font-black text-white mb-2"
              style={{ fontFamily: 'Outfit, sans-serif', color: colors.primary, textShadow: `0 0 30px ${colors.primary}60` }}
            >
              KENNYGAMES
            </h1>
            <p className="text-white/60 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              Mini-jeux multijoueurs épiques
            </p>
          </motion.div>

          {/* TABS */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className="flex-1 py-3 rounded-xl font-semibold transition-all"
              style={{
                background: isLogin ? colors.gradient : 'rgba(255, 255, 255, 0.05)',
                color: isLogin ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Connexion
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className="flex-1 py-3 rounded-xl font-semibold transition-all"
              style={{
                background: !isLogin ? colors.gradient : 'rgba(255, 255, 255, 0.05)',
                color: !isLogin ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Inscription
            </button>
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                <input
                  type="text"
                  placeholder="Nom d'utilisateur"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder-white/40 outline-none border border-white/10 transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    fontFamily: 'Inter, sans-serif',
                  }}
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder-white/40 outline-none border border-white/10 transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  fontFamily: 'Inter, sans-serif',
                }}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder-white/40 outline-none border border-white/10 transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  fontFamily: 'Inter, sans-serif',
                }}
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all"
              style={{
                background: colors.gradient,
                fontFamily: 'Outfit, sans-serif',
                boxShadow: `0 10px 30px ${colors.primary}40`,
              }}
            >
              {loading ? 'Chargement...' : isLogin ? 'Se connecter' : "S'inscrire"}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
