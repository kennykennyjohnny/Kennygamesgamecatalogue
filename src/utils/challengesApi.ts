import { supabase } from './client'
import { GameType } from './gameTypes'

export interface Challenge {
  id: string
  from_user_id: string
  to_user_id: string
  game_type: GameType
  status: 'sent' | 'accepted' | 'declined' | 'playing' | 'finished' | 'cancelled'
  current_turn_user_id: string | null
  winner_id: string | null
  game_state: any
  created_at: string
  started_at: string | null
  finished_at: string | null
  
  // Joined data
  from_user?: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  to_user?: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

/**
 * Create a challenge (défi) to a friend
 */
export async function createChallenge(toUserId: string, gameType: GameType) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .rpc('create_challenge', {
      p_from_user_id: user.id,
      p_to_user_id: toUserId,
      p_game_type: gameType
    })

  if (error) throw error
  return data as string // Returns challenge ID
}

/**
 * Get all challenges for current user
 */
export async function getMyChallenges() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('challenges')
    .select(`
      *,
      from_user:user_profiles!challenges_from_user_id_fkey (
        username,
        display_name,
        avatar_url
      ),
      to_user:user_profiles!challenges_to_user_id_fkey (
        username,
        display_name,
        avatar_url
      )
    `)
    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Challenge[]
}

/**
 * Get challenges filtered by status
 */
export async function getChallengesByStatus(status: Challenge['status'] | Challenge['status'][]) {
  const challenges = await getMyChallenges()
  const statuses = Array.isArray(status) ? status : [status]
  return challenges.filter(c => statuses.includes(c.status))
}

/**
 * Get challenges where it's my turn
 */
export async function getMyTurnChallenges() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('challenges')
    .select(`
      *,
      from_user:user_profiles!challenges_from_user_id_fkey (
        username,
        display_name,
        avatar_url
      ),
      to_user:user_profiles!challenges_to_user_id_fkey (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('current_turn_user_id', user.id)
    .in('status', ['playing', 'accepted'])
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Challenge[]
}

/**
 * Get a single challenge by ID
 */
export async function getChallenge(challengeId: string) {
  const { data, error } = await supabase
    .from('challenges')
    .select(`
      *,
      from_user:user_profiles!challenges_from_user_id_fkey (
        username,
        display_name,
        avatar_url
      ),
      to_user:user_profiles!challenges_to_user_id_fkey (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('id', challengeId)
    .single()

  if (error) throw error
  return data as Challenge
}

/**
 * Accept a challenge
 */
export async function acceptChallenge(challengeId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Update challenge status
  const { data, error } = await supabase
    .from('challenges')
    .update({
      status: 'playing',
      started_at: new Date().toISOString()
    })
    .eq('id', challengeId)
    .eq('to_user_id', user.id) // Only recipient can accept
    .select()
    .single()

  if (error) throw error

  // Get challenge info for notification
  const challenge = await getChallenge(challengeId)

  // Send notification to challenger
  await supabase
    .from('notifications')
    .insert({
      user_id: challenge.from_user_id,
      type: 'challenge_accepted',
      title: 'Défi accepté !',
      message: `${challenge.to_user?.username} a accepté ton défi !`,
      link: `/challenge/${challengeId}`,
      challenge_id: challengeId,
      from_user_id: user.id
    })

  return data
}

/**
 * Decline a challenge
 */
export async function declineChallenge(challengeId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('challenges')
    .update({ status: 'declined' })
    .eq('id', challengeId)
    .eq('to_user_id', user.id)

  if (error) throw error
}

/**
 * Update game state (when a player makes a move)
 */
export async function updateChallengeState(
  challengeId: string,
  gameState: any,
  nextTurnUserId: string | null,
  winnerId?: string
) {
  const updateData: any = {
    game_state: gameState,
    current_turn_user_id: nextTurnUserId
  }

  // If game is finished
  if (winnerId) {
    updateData.status = 'finished'
    updateData.winner_id = winnerId
    updateData.finished_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('challenges')
    .update(updateData)
    .eq('id', challengeId)
    .select()
    .single()

  if (error) throw error

  // Send notification if it's next player's turn
  if (nextTurnUserId && !winnerId) {
    const challenge = await getChallenge(challengeId)
    const { data: { user } } = await supabase.auth.getUser()
    
    await supabase
      .from('notifications')
      .insert({
        user_id: nextTurnUserId,
        type: 'your_turn',
        title: 'C\'est ton tour !',
        message: `${user?.id === challenge.from_user_id ? challenge.from_user?.username : challenge.to_user?.username} a joué`,
        link: `/challenge/${challengeId}`,
        challenge_id: challengeId,
        from_user_id: user?.id
      })
  }

  // Send victory notification
  if (winnerId) {
    const challenge = await getChallenge(challengeId)
    const loserId = winnerId === challenge.from_user_id ? challenge.to_user_id : challenge.from_user_id
    const winnerName = winnerId === challenge.from_user_id ? challenge.from_user?.username : challenge.to_user?.username
    const loserName = loserId === challenge.from_user_id ? challenge.from_user?.username : challenge.to_user?.username

    // Notification to winner
    await supabase
      .from('notifications')
      .insert({
        user_id: winnerId,
        type: 'challenge_won',
        title: 'Victoire ! 🎉',
        message: `Tu as battu ${loserName} !`,
        link: `/challenge/${challengeId}`,
        challenge_id: challengeId
      })

    // Notification to loser
    await supabase
      .from('notifications')
      .insert({
        user_id: loserId,
        type: 'challenge_lost',
        title: 'Défaite...',
        message: `${winnerName} t'a battu`,
        link: `/challenge/${challengeId}`,
        challenge_id: challengeId,
        from_user_id: winnerId
      })
  }

  return data
}

/**
 * Subscribe to challenge updates (realtime)
 */
export function subscribeToChallengeUpdates(
  challengeId: string,
  callback: (challenge: Challenge) => void
) {
  const channel = supabase
    .channel(`challenge:${challengeId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'challenges',
        filter: `id=eq.${challengeId}`
      },
      async (payload) => {
        // Fetch full challenge with joined data
        const challenge = await getChallenge(challengeId)
        callback(challenge)
      }
    )
    .subscribe()

  return channel
}

/**
 * Cancel a challenge (creator only, before accepted)
 */
export async function cancelChallenge(challengeId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('challenges')
    .update({ status: 'cancelled' })
    .eq('id', challengeId)
    .eq('from_user_id', user.id)
    .eq('status', 'sent')

  if (error) throw error
}
