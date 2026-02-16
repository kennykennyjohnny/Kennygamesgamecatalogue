import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User } from 'lucide-react';
import { supabase } from '../utils/client';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        // Try user_profiles first (existing accounts), then users table
        let userData: any = null;
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('id, username')
          .eq('id', data.user!.id)
          .single();

        if (profileData) {
          userData = { id: profileData.id, username: profileData.username, email };
        } else {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, username, email')
            .eq('id', data.user!.id)
            .single();
          userData = usersData;
        }

        if (userData) {
          onAuthSuccess({
            id: userData.id,
            name: userData.username,
            email: userData.email || email,
          });
        } else {
          // User authenticated but no profile - create one
          const username = email.split('@')[0];
          await supabase.from('user_profiles').insert({
            id: data.user!.id,
            username,
          });
          onAuthSuccess({ id: data.user!.id, name: username, email });
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;
        if (!data.user) throw new Error('Erreur lors de la création du compte');

        const username = name || email.split('@')[0];
        // Insert into user_profiles (main table)
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            username,
          });

        if (insertError) throw insertError;

        onAuthSuccess({
          id: data.user.id,
          name: username,
          email: email,
        });
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
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-teal-950 to-green-950">
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.3), transparent 50%), radial-gradient(circle at 80% 80%, rgba(5, 150, 105, 0.3), transparent 50%)'
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-emerald-400"
          style={{
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
            boxShadow: '0 8px 32px 0 rgba(16, 185, 129, 0.37)'
          }}
        >
          {/* LOGO */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="text-center mb-8"
          >
            <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              KENNYGAMES
            </h1>
            <p className="text-white/60 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Mini-jeux multijoueurs épiques</p>
          </motion.div>

          {/* TOGGLE LOGIN/SIGNUP */}
          <div className="flex gap-2 mb-6 p-1 rounded-2xl" style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                isLogin ? 'text-white shadow-lg' : 'text-white/50'
              }`}
              style={{
                background: isLogin ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Connexion
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                !isLogin ? 'text-white shadow-lg' : 'text-white/50'
              }`}
              style={{
                background: !isLogin ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Inscription
            </button>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" size={20} />
                  <input
                    type="text"
                    placeholder="Nom d'utilisateur"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl text-white placeholder-white/40 outline-none transition-all focus:ring-2 focus:ring-emerald-500/30"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                </div>
              </motion.div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" size={20} />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 rounded-xl text-white placeholder-white/40 outline-none transition-all focus:ring-2 focus:ring-emerald-500/30"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" size={20} />
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 rounded-xl text-white placeholder-white/40 outline-none transition-all focus:ring-2 focus:ring-emerald-500/30"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
            </div>

            {error && (
              <div className="text-center py-2 px-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
                <p className="text-red-400 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>{error}</p>
              </div>
            )}

            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-white/60 text-sm hover:text-white transition-colors"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-xl font-bold text-white text-lg shadow-xl disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto"
                />
              ) : (
                isLogin ? 'Se connecter' : "S'inscrire"
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}