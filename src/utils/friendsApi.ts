import { supabase } from './client'

export interface Friend {
  friend_id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  status: 'online' | 'offline' | 'in_game'
  last_seen: string
  friendship_status: 'pending' | 'accepted' | 'blocked'
}

export interface FriendRequest {
  id: string
  user_id: string
  friend_id: string
  status: string
  created_at: string
  username?: string
  display_name?: string
  avatar_url?: string
}

/**
 * Get current user's friends list
 */
export async function getFriends() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .rpc('get_friends', { p_user_id: user.id })

  if (error) throw error
  return data as Friend[]
}

/**
 * Search users by username
 */
export async function searchUsers(query: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, username, display_name, avatar_url, status')
    .ilike('username', `%${query}%`)
    .limit(10)

  if (error) throw error
  return data
}

/**
 * Send friend request
 */
export async function sendFriendRequest(friendId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if already friends or request exists
  const { data: existing } = await supabase
    .from('friendships')
    .select('*')
    .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
    .single()

  if (existing) {
    if (existing.status === 'accepted') {
      throw new Error('Déjà amis')
    }
    if (existing.status === 'pending') {
      throw new Error('Demande déjà envoyée')
    }
  }

  // Create friendship request
  const { data, error } = await supabase
    .from('friendships')
    .insert({
      user_id: user.id,
      friend_id: friendId,
      status: 'pending'
    })
    .select()
    .single()

  if (error) throw error

  // Get user info for notification
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  // Send notification
  await supabase
    .from('notifications')
    .insert({
      user_id: friendId,
      type: 'friend_request',
      title: 'Nouvelle demande d\'ami',
      message: `${profile?.username || 'Quelqu\'un'} veut être ton ami !`,
      from_user_id: user.id
    })

  return data
}

/**
 * Accept friend request
 */
export async function acceptFriendRequest(friendshipId: string) {
  const { data, error } = await supabase
    .from('friendships')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', friendshipId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Decline or remove friend
 */
export async function removeFriend(friendshipId: string) {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)

  if (error) throw error
}

/**
 * Get pending friend requests (received)
 */
export async function getPendingRequests() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id,
      user_id,
      friend_id,
      status,
      created_at,
      user_profiles!friendships_user_id_fkey (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('friend_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error

  return data.map(req => ({
    id: req.id,
    user_id: req.user_id,
    friend_id: req.friend_id,
    status: req.status,
    created_at: req.created_at,
    username: req.user_profiles?.username,
    display_name: req.user_profiles?.display_name,
    avatar_url: req.user_profiles?.avatar_url
  })) as FriendRequest[]
}

/**
 * Add friend by username (direct add without request)
 */
export async function addFriendByUsername(username: string) {
  // Search for user
  const { data: users, error: searchError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('username', username)
    .single()

  if (searchError || !users) {
    throw new Error('Utilisateur introuvable')
  }

  // Send friend request
  return sendFriendRequest(users.id)
}

/**
 * Generate WhatsApp share link
 */
export function generateWhatsAppLink(username: string) {
  const baseUrl = window.location.origin
  const message = `Rejoins-moi sur KennyGames ! Mon pseudo : ${username} 🎮\n${baseUrl}/add/${username}`
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}
