import { supabase } from './client'

export interface Friend {
  id: string
  username: string
  display_name: string
  avatar_url?: string
  status?: string
}

/**
 * Get user profile
 */
async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, username, display_name, avatar_url, status')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error loading user profile:', error)
    return null
  }
  return data
}

/**
 * Get all friends for current user
 */
export async function getFriends(): Promise<Friend[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('friendships')
    .select('user_id, friend_id')
    .eq('user_id', user.id)
    .eq('status', 'accepted')

  if (error) {
    console.error('Error loading friends:', error)
    throw error
  }

  if (!data || data.length === 0) return []

  // Load friend profiles
  const friendIds = data.map(f => f.friend_id)
  const friends: Friend[] = []

  await Promise.all(
    friendIds.map(async (id) => {
      const profile = await getUserProfile(id)
      if (profile) friends.push(profile as Friend)
    })
  )

  return friends
}

/**
 * Search users by username
 */
export async function searchUsers(query: string): Promise<Friend[]> {
  if (!query || query.length < 2) return []

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, username, display_name, avatar_url')
    .ilike('username', `%${query}%`)
    .limit(20)

  if (error) {
    console.error('Error searching users:', error)
    throw error
  }

  return data as Friend[]
}

/**
 * Send friend request
 */
export async function sendFriendRequest(friendId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('friendships')
    .insert({
      user_id: user.id,
      friend_id: friendId,
      status: 'pending'
    })

  if (error) throw error

  // Create notification
  await supabase.from('notifications').insert({
    user_id: friendId,
    from_user_id: user.id,
    type: 'friend_request',
    title: 'Nouvelle demande d\'ami',
    message: 'Vous avez reçu une demande d\'ami',
    read: false
  })
}

/**
 * Accept friend request
 */
export async function acceptFriendRequest(friendId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Update the friendship
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('user_id', friendId)
    .eq('friend_id', user.id)

  if (error) throw error

  // Create reciprocal friendship
  await supabase.from('friendships').insert({
    user_id: user.id,
    friend_id: friendId,
    status: 'accepted'
  })

  // Notify
  await supabase.from('notifications').insert({
    user_id: friendId,
    from_user_id: user.id,
    type: 'friend_accepted',
    title: 'Demande d\'ami acceptée',
    message: 'Votre demande d\'ami a été acceptée',
    read: false
  })
}

/**
 * Remove friend
 */
export async function removeFriend(friendId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await supabase
    .from('friendships')
    .delete()
    .eq('user_id', user.id)
    .eq('friend_id', friendId)

  await supabase
    .from('friendships')
    .delete()
    .eq('user_id', friendId)
    .eq('friend_id', user.id)
}
