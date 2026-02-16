import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Home, User as UserIcon } from 'lucide-react';
import { HomeScreen } from './HomeScreen';
import { PlayScreen } from './PlayScreen';
import { FriendsPanel } from './FriendsPanel';
import { ProfilePanel } from './ProfilePanel';
import { useTheme } from '../contexts/ThemeContext';

interface MainAppProps {
  user: { id: string; name: string; email: string };
  onLogout: () => void;
}

type Tab = 'friends' | 'play' | 'profile';

export function MainApp({ user, onLogout }: MainAppProps) {
  const [activeTab, setActiveTab] = useState<Tab>('play');
  const { colors } = useTheme();

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* ANIMATED BACKGROUND */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: colors.primary,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      {/* SIMPLIFIED TOP NAVBAR */}
      <div className="relative z-50">
        <div
          className="border-b"
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(20px)',
            borderColor: `${colors.primary}30`,
          }}
        >
          <div className="flex items-center justify-center px-6 py-3">
            <motion.h1
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-2xl font-black"
              style={{ 
                fontFamily: 'Outfit, sans-serif',
                color: colors.primary,
                textShadow: `0 0 20px ${colors.primary}40`
              }}
            >
              KENNYGAMES
            </motion.h1>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="relative pb-20">
        <AnimatePresence mode="wait">
          {activeTab === 'friends' && (
            <motion.div
              key="friends"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <FriendsPanel />
            </motion.div>
          )}
          {activeTab === 'play' && (
            <motion.div
              key="play"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <HomeScreen />
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <ProfilePanel user={user} onLogout={onLogout} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BOTTOM NAVIGATION */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div
          className="border-t border-white/10"
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-center justify-around px-6 py-3">
            {/* FRIENDS TAB */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('friends')}
              className="flex flex-col items-center gap-1 min-w-[80px]"
            >
              <motion.div
                animate={{
                  scale: activeTab === 'friends' ? 1.1 : 1,
                }}
                className="p-3 rounded-2xl"
                style={{
                  background: activeTab === 'friends' ? `${colors.primary}30` : 'rgba(255, 255, 255, 0.05)',
                }}
              >
                <Users
                  size={24}
                  style={{ color: activeTab === 'friends' ? colors.primary : 'rgba(255, 255, 255, 0.5)' }}
                />
              </motion.div>
              <span
                className="text-xs font-semibold"
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  color: activeTab === 'friends' ? colors.primary : 'rgba(255, 255, 255, 0.4)'
                }}
              >
                Amis
              </span>
            </motion.button>

            {/* PLAY TAB (CENTER) */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('play')}
              className="flex flex-col items-center gap-1 min-w-[80px] -mt-8"
            >
              <motion.div
                animate={{
                  scale: activeTab === 'play' ? 1.15 : 1,
                  rotate: activeTab === 'play' ? [0, -5, 5, -5, 0] : 0,
                }}
                transition={{
                  rotate: {
                    duration: 0.5,
                    repeat: activeTab === 'play' ? Infinity : 0,
                    repeatDelay: 2,
                  },
                }}
                className="p-4 rounded-3xl shadow-2xl"
                style={{
                  background: activeTab === 'play' ? colors.gradient : 'rgba(255, 255, 255, 0.1)',
                }}
              >
                <Home
                  size={28}
                  className={activeTab === 'play' ? 'text-white' : 'text-white/50'}
                />
              </motion.div>
              <span
                className="text-xs font-semibold"
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  color: activeTab === 'play' ? colors.primary : 'rgba(255, 255, 255, 0.4)'
                }}
              >
                Jouer
              </span>
            </motion.button>

            {/* PROFILE TAB */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('profile')}
              className="flex flex-col items-center gap-1 min-w-[80px]"
            >
              <motion.div
                animate={{
                  scale: activeTab === 'profile' ? 1.1 : 1,
                }}
                className="p-3 rounded-2xl"
                style={{
                  background: activeTab === 'profile' ? `${colors.primary}30` : 'rgba(255, 255, 255, 0.05)',
                }}
              >
                <UserIcon
                  size={24}
                  style={{ color: activeTab === 'profile' ? colors.primary : 'rgba(255, 255, 255, 0.5)' }}
                />
              </motion.div>
              <span
                className="text-xs font-semibold"
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  color: activeTab === 'profile' ? colors.primary : 'rgba(255, 255, 255, 0.4)'
                }}
              >
                Profil
              </span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}