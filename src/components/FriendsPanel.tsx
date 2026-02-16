import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, UserPlus, MessageCircle, Clock, Check, X } from 'lucide-react';

const onlineFriends = [
  { id: '1', name: 'Kenny', avatar: '🎮', status: 'En ligne', game: 'SandyPong' },
  { id: '2', name: 'Sandy', avatar: '⚡', status: 'En ligne', game: 'LilianoThunder' },
  { id: '3', name: 'Léa', avatar: '🍾', status: 'En ligne' },
];

const offlineFriends = [
  { id: '4', name: 'Nour', avatar: '🎯', status: 'Hors ligne', lastSeen: 'Il y a 2h' },
  { id: '5', name: 'Alex', avatar: '🏆', status: 'Hors ligne', lastSeen: 'Il y a 5h' },
];

const pendingRequests = [
  { id: '6', name: 'Martin', avatar: '🎲' },
  { id: '7', name: 'Sophie', avatar: '🎪' },
];

export function FriendsPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'online' | 'all' | 'pending'>('online');

  return (
    <div className="min-h-screen p-4 pt-16 pb-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Amis
          </h2>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              type="text"
              placeholder="Rechercher un ami..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-white placeholder-white/40 outline-none border border-white/10"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                fontFamily: 'Inter, sans-serif',
              }}
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'online', label: 'En ligne', count: onlineFriends.length },
              { id: 'all', label: 'Tous', count: onlineFriends.length + offlineFriends.length },
              { id: 'pending', label: 'Demandes', count: pendingRequests.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab.id ? 'text-white' : 'text-white/50'
                }`}
                style={{
                  background: activeTab === tab.id ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className="ml-1 px-2 py-0.5 rounded-full text-xs"
                    style={{
                      background: activeTab === tab.id ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === 'online' && (
            <div className="space-y-2">
              <p className="text-xs text-white/40 uppercase font-bold mb-3 px-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                En ligne — {onlineFriends.length}
              </p>
              {onlineFriends.map((friend) => (
                <motion.div
                  key={friend.id}
                  whileHover={{ x: 5 }}
                  className="p-3 rounded-xl cursor-pointer group"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                        style={{
                          background: 'rgba(139, 92, 246, 0.2)',
                        }}
                      >
                        {friend.avatar}
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {friend.name}
                      </p>
                      {friend.game ? (
                        <p className="text-xs text-purple-400 truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          🎮 {friend.game}
                        </p>
                      ) : (
                        <p className="text-xs text-green-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {friend.status}
                        </p>
                      )}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg"
                      style={{
                        background: 'rgba(139, 92, 246, 0.3)',
                      }}
                    >
                      <MessageCircle className="text-white" size={18} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'all' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-white/40 uppercase font-bold mb-3 px-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  En ligne — {onlineFriends.length}
                </p>
                {onlineFriends.map((friend) => (
                  <motion.div
                    key={friend.id}
                    whileHover={{ x: 5 }}
                    className="p-3 rounded-xl cursor-pointer group"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                          style={{
                            background: 'rgba(139, 92, 246, 0.2)',
                          }}
                        >
                          {friend.avatar}
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {friend.name}
                        </p>
                        {friend.game ? (
                          <p className="text-xs text-purple-400 truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            🎮 {friend.game}
                          </p>
                        ) : (
                          <p className="text-xs text-green-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {friend.status}
                          </p>
                        )}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg"
                        style={{
                          background: 'rgba(139, 92, 246, 0.3)',
                        }}
                      >
                        <MessageCircle className="text-white" size={18} />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-xs text-white/40 uppercase font-bold mb-3 px-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Hors ligne — {offlineFriends.length}
                </p>
                {offlineFriends.map((friend) => (
                  <motion.div
                    key={friend.id}
                    whileHover={{ x: 5 }}
                    className="p-3 rounded-xl cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                          style={{
                            background: 'rgba(100, 100, 100, 0.2)',
                          }}
                        >
                          {friend.avatar}
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-gray-500 rounded-full border-2 border-slate-900" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {friend.name}
                        </p>
                        <p className="text-xs text-white/40 truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {friend.lastSeen}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'pending' && (
            <div className="space-y-2">
              <p className="text-xs text-white/40 uppercase font-bold mb-3 px-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Demandes en attente — {pendingRequests.length}
              </p>
              {pendingRequests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 rounded-xl"
                  style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                      style={{
                        background: 'rgba(139, 92, 246, 0.2)',
                      }}
                    >
                      {request.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {request.name}
                      </p>
                      <p className="text-xs text-white/60" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Demande d'ami
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 py-2 rounded-lg font-semibold text-white flex items-center justify-center gap-2"
                      style={{
                        background: 'rgba(34, 197, 94, 0.3)',
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      <Check size={16} />
                      Accepter
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 py-2 rounded-lg font-semibold text-white flex items-center justify-center gap-2"
                      style={{
                        background: 'rgba(239, 68, 68, 0.3)',
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      <X size={16} />
                      Refuser
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Add Friend Button */}
        <div className="mt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <UserPlus size={20} />
            Ajouter un ami
          </motion.button>
        </div>
      </div>
    </div>
  );
}