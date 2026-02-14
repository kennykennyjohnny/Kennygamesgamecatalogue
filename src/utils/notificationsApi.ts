import { supabase } from './client'

export interface Notification {
  id: string
  user_id: string
  from_user_id: string | null
  type: string
  title: string
  message: string
  related_id: string | null
  read: boolean
  created_at: string
  from_user?: {
    username: string
    display_name: string
    avatar_url?: string
  }
}

/**
 * Get user profile
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
 * Get notifications for current user
 */
export async function getMyNotifications(limit = 50): Promise<Notification[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error loading notifications:', error)
    throw error
  }

  if (!data || data.length === 0) return []

  // Load from_user profiles
  const userIds = data
    .filter(n => n.from_user_id)
    .map(n => n.from_user_id as string)

  const profiles = new Map<string, any>()
  await Promise.all(
    userIds.map(async (id) => {
      const profile = await getUserProfile(id)
      if (profile) profiles.set(id, profile)
    })
  )

  return data.map(notif => ({
    ...notif,
    from_user: notif.from_user_id ? profiles.get(notif.from_user_id) : undefined
  }))
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  if (error) {
    console.error('Error counting notifications:', error)
    return 0
  }

  return count || 0
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)

  if (error) throw error
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  if (error) throw error
}

/**
 * Subscribe to new notifications
 */
export function subscribeToNotifications(callback: (notification: Notification) => void) {
  const channel = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      },
      async (payload) => {
        const notif = payload.new as Notification
        
        // Load from_user profile
        const fromUser = notif.from_user_id 
          ? await getUserProfile(notif.from_user_id)
          : null
        
        callback({
          ...notif,
          from_user: fromUser || undefined
        })
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
