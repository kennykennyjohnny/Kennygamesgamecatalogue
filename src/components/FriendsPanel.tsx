import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Search, UserPlus, Check, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../utils/client';

interface Friend {
  id: string;
  username: string;
  profile_emoji: string;
  isOnline: boolean;
  friendshipId?: string;
}

interface FriendRequest {
  id: string;
  user_id: string;
  username: string;
  profile_emoji: string;
  friendshipId: string;
}

interface SearchResult {
  id: string;
  username: string;
  profile_emoji: string;
  isFriend: boolean;
  hasPendingRequest: boolean;
}

interface FriendsPanelProps {
  userId: string;
}

export function FriendsPanel({ userId }: FriendsPanelProps) {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'online' | 'all' | 'pending'>('online');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch friends
  const fetchFriends = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          friend_id,
          users:friend_id (
            id,
            username,
            profile_emoji
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'accepted');

      if (error) throw error;

      const friendsList: Friend[] = (data || []).map(friendship => ({
        id: friendship.users.id,
        username: friendship.users.username,
        profile_emoji: friendship.users.profile_emoji || '👤',
        isOnline: Math.random() > 0.5, // Fake online status
        friendshipId: friendship.id,
      }));

      setFriends(friendsList);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch pending requests (requests sent TO the current user)
  const fetchPendingRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id,
          users:user_id (
            id,
            username,
            profile_emoji
          )
        `)
        .eq('friend_id', userId)
        .eq('status', 'pending');

      if (error) throw error;

      const requests: FriendRequest[] = (data || []).map(request => ({
        id: request.users.id,
        user_id: request.users.id,
        username: request.users.username,
        profile_emoji: request.users.profile_emoji || '👤',
        friendshipId: request.id,
      }));

      setPendingRequests(requests);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  }, [userId]);

  // Search users with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        // Search for users by username
        const { data: users, error } = await supabase
          .from('users')
          .select('id, username, profile_emoji')
          .ilike('username', `%${searchQuery}%`)
          .neq('id', userId)
          .limit(10);

        if (error) throw error;

        // Get all friendships for the current user
        const { data: friendships, error: friendshipError } = await supabase
          .from('friendships')
          .select('friend_id, status')
          .eq('user_id', userId);

        if (friendshipError) throw friendshipError;

        const friendshipMap = new Map(
          (friendships || []).map(f => [f.friend_id, f.status])
        );

        const results: SearchResult[] = (users || []).map(user => ({
          id: user.id,
          username: user.username,
          profile_emoji: user.profile_emoji || '👤',
          isFriend: friendshipMap.get(user.id) === 'accepted',
          hasPendingRequest: friendshipMap.get(user.id) === 'pending',
        }));

        setSearchResults(results);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, userId]);

  // Send friend request
  const sendFriendRequest = async (friendId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: userId,
          friend_id: friendId,
          status: 'pending',
        });

      if (error) throw error;

      // Update search results
      setSearchResults(prev =>
        prev.map(user =>
          user.id === friendId ? { ...user, hasPendingRequest: true } : user
        )
      );
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  // Accept friend request
  const acceptFriendRequest = async (friendshipId: string, friendId: string) => {
    try {
      // Update the original friendship to accepted
      const { error: updateError } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (updateError) throw updateError;

      // Create the reverse friendship
      const { error: insertError } = await supabase
        .from('friendships')
        .insert({
          user_id: userId,
          friend_id: friendId,
          status: 'accepted',
        });

      if (insertError) throw insertError;

      // Refresh both lists
      await fetchFriends();
      await fetchPendingRequests();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  // Reject friend request
  const rejectFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;

      await fetchPendingRequests();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchPendingRequests();
  }, [fetchFriends, fetchPendingRequests]);

  const onlineFriends = friends.filter(f => f.isOnline);
  const offlineFriends = friends.filter(f => !f.isOnline);

  const primaryColor = theme?.colors?.primary || '#10b981';
  const accentColor = theme?.colors?.accent || '#8b5cf6';

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
          {!searchQuery && (
            <div className="flex gap-2">
              {[
                { id: 'online', label: 'En ligne', count: onlineFriends.length },
                { id: 'all', label: 'Tous', count: friends.length },
                { id: 'pending', label: 'Demandes', count: pendingRequests.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === tab.id ? 'text-white' : 'text-white/50'
                  }`}
                  style={{
                    background: activeTab === tab.id ? `${primaryColor}4D` : 'rgba(255, 255, 255, 0.05)',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className="ml-1 px-2 py-0.5 rounded-full text-xs"
                      style={{
                        background: activeTab === tab.id ? `${primaryColor}80` : 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Search Results */}
          {searchQuery && (
            <div className="space-y-2">
              <p className="text-xs text-white/40 uppercase font-bold mb-3 px-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {isSearching ? 'Recherche...' : `Résultats — ${searchResults.length}`}
              </p>
              {searchResults.length === 0 && !isSearching && (
                <div className="text-center py-8 text-white/40">
                  Aucun utilisateur trouvé
                </div>
              )}
              {searchResults.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                      style={{
                        background: `${accentColor}33`,
                      }}
                    >
                      {user.profile_emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {user.username}
                      </p>
                      {user.isFriend && (
                        <p className="text-xs text-green-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          Déjà ami
                        </p>
                      )}
                      {user.hasPendingRequest && !user.isFriend && (
                        <p className="text-xs text-yellow-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          Demande envoyée
                        </p>
                      )}
                    </div>
                    {!user.isFriend && !user.hasPendingRequest && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => sendFriendRequest(user.id)}
                        className="p-2 rounded-lg"
                        style={{
                          background: `${primaryColor}4D`,
                        }}
                      >
                        <UserPlus className="text-white" size={18} />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Online Friends Tab */}
          {!searchQuery && activeTab === 'online' && (
            <div className="space-y-2">
              <p className="text-xs text-white/40 uppercase font-bold mb-3 px-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                En ligne — {onlineFriends.length}
              </p>
              {loading ? (
                <div className="text-center py-8 text-white/40">Chargement...</div>
              ) : onlineFriends.length === 0 ? (
                <div className="text-center py-8 text-white/40">
                  Aucun ami en ligne
                </div>
              ) : (
                onlineFriends.map((friend) => (
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
                            background: `${accentColor}33`,
                          }}
                        >
                          {friend.profile_emoji}
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {friend.username}
                        </p>
                        <p className="text-xs text-green-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          En ligne
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* All Friends Tab */}
          {!searchQuery && activeTab === 'all' && (
            <div className="space-y-4">
              {onlineFriends.length > 0 && (
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
                              background: `${accentColor}33`,
                            }}
                          >
                            {friend.profile_emoji}
                          </div>
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {friend.username}
                          </p>
                          <p className="text-xs text-green-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            En ligne
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {offlineFriends.length > 0 && (
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
                            {friend.profile_emoji}
                          </div>
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-gray-500 rounded-full border-2 border-slate-900" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {friend.username}
                          </p>
                          <p className="text-xs text-white/40 truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Hors ligne
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {loading && (
                <div className="text-center py-8 text-white/40">Chargement...</div>
              )}

              {!loading && friends.length === 0 && (
                <div className="text-center py-8 text-white/40">
                  Aucun ami pour le moment
                </div>
              )}
            </div>
          )}

          {/* Pending Requests Tab */}
          {!searchQuery && activeTab === 'pending' && (
            <div className="space-y-2">
              <p className="text-xs text-white/40 uppercase font-bold mb-3 px-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Demandes en attente — {pendingRequests.length}
              </p>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8 text-white/40">
                  Aucune demande en attente
                </div>
              ) : (
                pendingRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-xl"
                    style={{
                      background: `${accentColor}1A`,
                      border: `1px solid ${accentColor}4D`,
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                        style={{
                          background: `${accentColor}33`,
                        }}
                      >
                        {request.profile_emoji}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {request.username}
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
                        onClick={() => acceptFriendRequest(request.friendshipId, request.user_id)}
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
                        onClick={() => rejectFriendRequest(request.friendshipId)}
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
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
