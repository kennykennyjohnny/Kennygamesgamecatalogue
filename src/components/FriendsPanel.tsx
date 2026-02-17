import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, UserPlus, MessageCircle, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '../utils/client';

interface Friend {
  id: string;
  name: string;
  avatar: string;
  status: string;
  game?: string;
  lastSeen?: string;
}

interface FriendRequest {
  id: string;
  name: string;
  avatar: string;
  requestId: string;
}

interface SearchResult {
  id: string;
  username: string;
  profile_emoji: string | null;
  relationStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
}

export function FriendsPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'online' | 'all' | 'pending' | 'sent'>('online');
  const [onlineFriends, setOnlineFriends] = useState<Friend[]>([]);
  const [offlineFriends, setOfflineFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [userId, setUserId] = useState<string>('');

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadUserAndFriends();
  }, []);

  // Realtime subscription for incoming friend requests
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('friendships-realtime')
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'friendships' },
        (payload: any) => {
          const row = payload.new as any;
          // Reload when a friendship involves us
          if (
            row?.user_id === userId ||
            row?.friend_id === userId ||
            (payload.old as any)?.user_id === userId ||
            (payload.old as any)?.friend_id === userId
          ) {
            loadFriends(userId);
            loadPendingRequests(userId);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Debounced user search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (value.trim().length < 2) {
        setSearchResults([]);
        setSearchLoading(false);
        return;
      }

      setSearchLoading(true);
      debounceRef.current = setTimeout(() => {
        searchUsers(value.trim());
      }, 500);
    },
    [userId],
  );

  async function searchUsers(query: string) {
    if (!userId) {
      setSearchLoading(false);
      return;
    }

    try {
      // Search users by username in user_profiles
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('id, username')
        .ilike('username', `%${query}%`)
        .neq('id', userId)
        .limit(10);

      if (error) throw error;
      if (!users || users.length === 0) {
        setSearchResults([]);
        setSearchLoading(false);
        return;
      }

      // Check existing friendships for these users
      const userIds = users.map((u: any) => u.id);

      const { data: sentRequests } = await supabase
        .from('friendships')
        .select('friend_id, status')
        .eq('user_id', userId)
        .in('friend_id', userIds);

      const { data: receivedRequests } = await supabase
        .from('friendships')
        .select('user_id, status')
        .eq('friend_id', userId)
        .in('user_id', userIds);

      const sentMap = new Map<string, string>();
      (sentRequests || []).forEach((r: any) => sentMap.set(r.friend_id, r.status));
      const receivedMap = new Map<string, string>();
      (receivedRequests || []).forEach((r: any) => receivedMap.set(r.user_id, r.status));

      const results: SearchResult[] = users.map((u: any) => {
        let relationStatus: SearchResult['relationStatus'] = 'none';
        if (sentMap.get(u.id) === 'accepted' || receivedMap.get(u.id) === 'accepted') {
          relationStatus = 'accepted';
        } else if (sentMap.get(u.id) === 'pending') {
          relationStatus = 'pending_sent';
        } else if (receivedMap.get(u.id) === 'pending') {
          relationStatus = 'pending_received';
        }
        return {
          id: u.id,
          username: u.username,
          profile_emoji: u.profile_emoji || null,
          relationStatus,
        };
      });

      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  async function sendFriendRequest(friendId: string) {
    setSendingTo(friendId);
    setFeedbackMsg(null);

    try {
      const { error } = await supabase
        .from('friendships')
        .insert({ user_id: userId, friend_id: friendId, status: 'pending' });

      if (error) throw error;

      // Update the search result in-place
      setSearchResults((prev) =>
        prev.map((r) => (r.id === friendId ? { ...r, relationStatus: 'pending_sent' as const } : r)),
      );
      setFeedbackMsg({ text: 'Demande envoyée !', type: 'success' });
    } catch (err: any) {
      const msg = err?.message?.includes('duplicate')
        ? 'Demande déjà envoyée'
        : 'Erreur lors de l\'envoi';
      setFeedbackMsg({ text: msg, type: 'error' });
    } finally {
      setSendingTo(null);
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  }

  async function loadUserAndFriends() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setUserId(user.id);
    await loadFriends(user.id);
    await loadPendingRequests(user.id);
    await loadSentRequests(user.id);
  }

  async function loadFriends(currentUserId: string) {
    // Get accepted friendships (both directions)
    const { data: sentData } = await supabase
      .from('friendships')
      .select('id, friend_id')
      .eq('user_id', currentUserId)
      .eq('status', 'accepted');

    const { data: receivedData } = await supabase
      .from('friendships')
      .select('id, user_id')
      .eq('friend_id', currentUserId)
      .eq('status', 'accepted');

    const friendIds = [
      ...(sentData || []).map((f: any) => f.friend_id),
      ...(receivedData || []).map((f: any) => f.user_id),
    ];

    if (friendIds.length === 0) {
      setOnlineFriends([]);
      setOfflineFriends([]);
      return;
    }

    // Get friend profiles from user_profiles
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, username')
      .in('id', friendIds);

    if (profiles) {
      const friends: Friend[] = profiles.map((p: any) => ({
        id: p.id,
        name: p.username,
        avatar: '🎮',
        status: 'En ligne',
      }));

      setOnlineFriends(friends);
      setOfflineFriends([]);
    }
  }

  async function loadPendingRequests(currentUserId: string) {
    // Get pending requests where I'm the recipient
    const { data: requests } = await supabase
      .from('friendships')
      .select('id, user_id')
      .eq('friend_id', currentUserId)
      .eq('status', 'pending');

    if (!requests || requests.length === 0) {
      setPendingRequests([]);
      return;
    }

    const senderIds = requests.map((r: any) => r.user_id);
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, username')
      .in('id', senderIds);

    if (profiles) {
      setPendingRequests(requests.map((r: any) => {
        const profile = profiles.find((p: any) => p.id === r.user_id);
        return {
          id: profile?.id || r.user_id,
          name: profile?.username || 'Inconnu',
          avatar: '🎮',
          requestId: r.id,
        };
      }));
    }
  }

  async function loadSentRequests(currentUserId: string) {
    const { data: requests } = await supabase
      .from('friendships')
      .select('id, friend_id')
      .eq('user_id', currentUserId)
      .eq('status', 'pending');

    if (!requests || requests.length === 0) {
      setSentRequests([]);
      return;
    }

    const recipientIds = requests.map((r: any) => r.friend_id);
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, username')
      .in('id', recipientIds);

    if (profiles) {
      setSentRequests(requests.map((r: any) => {
        const profile = profiles.find((p: any) => p.id === r.friend_id);
        return {
          id: profile?.id || r.friend_id,
          name: profile?.username || 'Inconnu',
          avatar: '🎮',
          requestId: r.id,
        };
      }));
    }
  }

  async function cancelRequest(requestId: string) {
    await supabase
      .from('friendships')
      .delete()
      .eq('id', requestId);

    loadUserAndFriends();
  }

  async function acceptRequest(requestId: string) {
    await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    loadUserAndFriends();
  }

  async function rejectRequest(requestId: string) {
    await supabase
      .from('friendships')
      .delete()
      .eq('id', requestId);

    loadUserAndFriends();
  }

  function isOnline(lastSeen: string) {
    if (!lastSeen) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastSeen) > fiveMinutesAgo;
  }

  function getLastSeenText(lastSeen: string) {
    if (!lastSeen) return 'Hors ligne';
    const hours = Math.floor((Date.now() - new Date(lastSeen).getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'Il y a quelques minutes';
    return `Il y a ${hours}h`;
  }

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
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-white placeholder-white/40 outline-none border border-white/10"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                fontFamily: 'Inter, sans-serif',
              }}
            />
          </div>

          {/* Search Results */}
          <AnimatePresence>
            {searchQuery.trim().length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 rounded-xl overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <p className="text-xs text-white/40 uppercase font-bold px-3 pt-3 pb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Résultats de recherche
                </p>

                {searchLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="animate-spin text-emerald-400" size={20} />
                    <span className="ml-2 text-sm text-white/50" style={{ fontFamily: 'Inter, sans-serif' }}>Recherche...</span>
                  </div>
                )}

                {!searchLoading && searchResults.length === 0 && (
                  <p className="text-sm text-white/40 text-center py-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Aucun utilisateur trouvé
                  </p>
                )}

                {!searchLoading && searchResults.map((result) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="px-3 py-2 flex items-center gap-3 hover:bg-white/5 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                      style={{ background: 'rgba(139, 92, 246, 0.2)' }}
                    >
                      {result.profile_emoji || '🎮'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {result.username}
                      </p>
                    </div>
                    {result.relationStatus === 'accepted' && (
                      <span className="text-xs text-emerald-400 font-semibold px-2 py-1 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.15)', fontFamily: 'Inter, sans-serif' }}>
                        Déjà ami
                      </span>
                    )}
                    {result.relationStatus === 'pending_sent' && (
                      <span className="text-xs text-amber-400 font-semibold px-2 py-1 rounded-lg" style={{ background: 'rgba(245, 158, 11, 0.15)', fontFamily: 'Inter, sans-serif' }}>
                        Demande envoyée
                      </span>
                    )}
                    {result.relationStatus === 'pending_received' && (
                      <span className="text-xs text-purple-400 font-semibold px-2 py-1 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.15)', fontFamily: 'Inter, sans-serif' }}>
                        Demande reçue
                      </span>
                    )}
                    {result.relationStatus === 'none' && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => sendFriendRequest(result.id)}
                        disabled={sendingTo === result.id}
                        className="p-2 rounded-lg text-white"
                        style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                      >
                        {sendingTo === result.id ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <UserPlus size={16} />
                        )}
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feedback toast */}
          <AnimatePresence>
            {feedbackMsg && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mb-4 px-4 py-2 rounded-xl text-sm font-semibold text-center"
                style={{
                  background: feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  border: `1px solid ${feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                  color: feedbackMsg.type === 'success' ? '#6ee7b7' : '#fca5a5',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {feedbackMsg.text}
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex gap-2">
            {[
              { id: 'online', label: 'En ligne', count: onlineFriends.length },
              { id: 'all', label: 'Tous', count: onlineFriends.length + offlineFriends.length },
              { id: 'pending', label: 'Reçues', count: pendingRequests.length },
              { id: 'sent', label: 'Envoyées', count: sentRequests.length },
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
                      onClick={() => acceptRequest(request.requestId)}
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
                      onClick={() => rejectRequest(request.requestId)}
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

          {activeTab === 'sent' && (
            <div className="space-y-2">
              <p className="text-xs text-white/40 uppercase font-bold mb-3 px-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Demandes envoyées — {sentRequests.length}
              </p>
              {sentRequests.length === 0 && (
                <p className="text-sm text-white/40 text-center py-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Aucune demande envoyée
                </p>
              )}
              {sentRequests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 rounded-xl"
                  style={{
                    background: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                      style={{ background: 'rgba(251, 191, 36, 0.2)' }}
                    >
                      {request.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {request.name}
                      </p>
                      <p className="text-xs text-amber-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        En attente de réponse...
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => cancelRequest(request.requestId)}
                      className="px-3 py-2 rounded-lg font-semibold text-white text-sm flex items-center gap-1"
                      style={{
                        background: 'rgba(239, 68, 68, 0.3)',
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      <X size={14} />
                      Annuler
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}