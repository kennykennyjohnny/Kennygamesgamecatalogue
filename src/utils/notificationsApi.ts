import { supabase } from './client'

export interface Notification {
  id: string
  user_id: string
  type: 'challenge_received' | 'challenge_accepted' | 'your_turn' | 'challenge_won' | 'challenge_lost' | 'friend_request'
  title: string
  message: string
  link: string | null
  read: boolean
  created_at: string
  challenge_id: string | null
  from_user_id: string | null
  
  // Joined data
  from_user?: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

/**
 * Get all notifications for current user
 */
export async function getNotifications() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      from_user:user_profiles!notifications_from_user_id_fkey (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data as Notification[]
}

/**
 * Get unread notifications count
 */
export async function getUnreadCount() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  if (error) throw error
  return count || 0
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)

  if (error) throw error
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  if (error) throw error
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)

  if (error) throw error
}

/**
 * Subscribe to new notifications (realtime)
 */
export function subscribeToNotifications(callback: (notification: Notification) => void) {
  const { data: { user } } = supabase.auth.getUser()
  
  user.then((result) => {
    if (!result.user) return

    const channel = supabase
      .channel(`notifications:${result.user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${result.user.id}`
        },
        async (payload) => {
          // Fetch full notification with joined data
          const { data } = await supabase
            .from('notifications')
            .select(`
              *,
              from_user:user_profiles!notifications_from_user_id_fkey (
                username,
                display_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            callback(data as Notification)
          }
        }
      )
      .subscribe()

    return channel
  })
}

/**
 * Send browser push notification (if permission granted)
 */
export async function sendBrowserNotification(title: string, body: string, link?: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/pwa/icon-192.png',
      badge: '/pwa/badge.png',
      tag: 'kennygames',
      requireInteraction: false
    })

    if (link) {
      notification.onclick = () => {
        window.focus()
        window.location.href = link
        notification.close()
      }
    }
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  return false
}
