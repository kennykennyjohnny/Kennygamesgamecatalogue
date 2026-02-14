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
  updated_at: string
  from_user?: {
    username: string
    display_name: string
    avatar_url?: string
  }
  to_user?: {
    username: string
    display_name: string
    avatar_url?: string
  }
}

/**
 * Get user profile by ID
 */
async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('username, display_name, avatar_url')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error loading user profile:', error)
    return null
  }
  return data
}

/**
 * Get all challenges for current user
 */
export async function getMyChallenges(): Promise<Challenge[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Load challenges without joins
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error loading challenges:', error)
    throw error
  }

  if (!data || data.length === 0) return []

  // Load user profiles separately
  const userIds = new Set<string>()
  data.forEach(c => {
    userIds.add(c.from_user_id)
    userIds.add(c.to_user_id)
  })

  const profiles = new Map<string, any>()
  await Promise.all(
    Array.from(userIds).map(async (id) => {
      const profile = await getUserProfile(id)
      if (profile) profiles.set(id, profile)
    })
  )

  // Attach profiles to challenges
  return data.map(challenge => ({
    ...challenge,
    from_user: profiles.get(challenge.from_user_id),
    to_user: profiles.get(challenge.to_user_id)
  }))
}

/**
 * Get challenges where it's my turn
 */
export async function getMyTurnChallenges(): Promise<Challenge[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Load challenges without joins
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('current_turn_user_id', user.id)
    .in('status', ['playing', 'accepted'])
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error loading my turn challenges:', error)
    throw error
  }

  if (!data || data.length === 0) return []

  // Load user profiles
  const userIds = new Set<string>()
  data.forEach(c => {
    userIds.add(c.from_user_id)
    userIds.add(c.to_user_id)
  })

  const profiles = new Map<string, any>()
  await Promise.all(
    Array.from(userIds).map(async (id) => {
      const profile = await getUserProfile(id)
      if (profile) profiles.set(id, profile)
    })
  )

  return data.map(challenge => ({
    ...challenge,
    from_user: profiles.get(challenge.from_user_id),
    to_user: profiles.get(challenge.to_user_id)
  }))
}

/**
 * Create a new challenge
 */
export async function createChallenge(
  toUserId: string,
  gameType: GameType,
  initialGameState: any = {}
): Promise<Challenge> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('challenges')
    .insert({
      from_user_id: user.id,
      to_user_id: toUserId,
      game_type: gameType,
      status: 'sent',
      current_turn_user_id: null,
      game_state: initialGameState
    })
    .select()
    .single()

  if (error) throw error

  // Create notification
  await supabase.from('notifications').insert({
    user_id: toUserId,
    from_user_id: user.id,
    type: 'challenge_received',
    title: 'Nouveau défi !',
    message: `Vous avez reçu un défi pour ${gameType}`,
    related_id: data.id,
    read: false
  })

  return data as Challenge
}

/**
 * Accept a challenge
 */
export async function acceptChallenge(challengeId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get challenge
  const { data: challenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .single()

  if (!challenge) throw new Error('Challenge not found')

  // Update challenge
  const { error } = await supabase
    .from('challenges')
    .update({
      status: 'playing',
      current_turn_user_id: challenge.from_user_id // First turn goes to challenger
    })
    .eq('id', challengeId)

  if (error) throw error

  // Notify opponent
  await supabase.from('notifications').insert({
    user_id: challenge.from_user_id,
    from_user_id: user.id,
    type: 'challenge_accepted',
    title: 'Défi accepté !',
    message: `Votre défi a été accepté`,
    related_id: challengeId,
    read: false
  })
}

/**
 * Decline a challenge
 */
export async function declineChallenge(challengeId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: challenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .single()

  if (!challenge) throw new Error('Challenge not found')

  const { error } = await supabase
    .from('challenges')
    .update({ status: 'declined' })
    .eq('id', challengeId)

  if (error) throw error

  // Notify opponent
  await supabase.from('notifications').insert({
    user_id: challenge.from_user_id,
    from_user_id: user.id,
    type: 'challenge_declined',
    title: 'Défi refusé',
    message: `Votre défi a été refusé`,
    related_id: challengeId,
    read: false
  })
}

/**
 * Update game state and switch turn
 */
export async function updateChallengeState(
  challengeId: string,
  newGameState: any,
  winnerId?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: challenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .single()

  if (!challenge) throw new Error('Challenge not found')

  // Determine next turn
  const nextTurnUserId = challenge.current_turn_user_id === challenge.from_user_id
    ? challenge.to_user_id
    : challenge.from_user_id

  const updateData: any = {
    game_state: newGameState,
    current_turn_user_id: winnerId ? null : nextTurnUserId,
    updated_at: new Date().toISOString()
  }

  if (winnerId) {
    updateData.status = 'finished'
    updateData.winner_id = winnerId
  }

  const { error } = await supabase
    .from('challenges')
    .update(updateData)
    .eq('id', challengeId)

  if (error) throw error

  // Notify opponent
  const opponentId = user.id === challenge.from_user_id ? challenge.to_user_id : challenge.from_user_id
  
  await supabase.from('notifications').insert({
    user_id: opponentId,
    from_user_id: user.id,
    type: winnerId ? 'game_finished' : 'your_turn',
    title: winnerId ? 'Partie terminée' : 'À ton tour !',
    message: winnerId ? 'La partie est terminée' : 'C\'est à ton tour de jouer',
    related_id: challengeId,
    read: false
  })
}

/**
 * Subscribe to challenge updates
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
        const challenge = payload.new as Challenge
        
        // Load user profiles
        const fromUser = await getUserProfile(challenge.from_user_id)
        const toUser = await getUserProfile(challenge.to_user_id)
        
        callback({
          ...challenge,
          from_user: fromUser || undefined,
          to_user: toUser || undefined
        })
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Get a single challenge by ID
 */
export async function getChallenge(challengeId: string): Promise<Challenge | null> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .single()

  if (error) {
    console.error('Error loading challenge:', error)
    return null
  }

  // Load user profiles
  const fromUser = await getUserProfile(data.from_user_id)
  const toUser = await getUserProfile(data.to_user_id)

  return {
    ...data,
    from_user: fromUser || undefined,
    to_user: toUser || undefined
  }
}
