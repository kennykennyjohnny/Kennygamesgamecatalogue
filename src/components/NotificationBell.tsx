import { useState, useEffect } from 'react'
import { getNotifications, markAsRead, markAllAsRead, subscribeToNotifications, type Notification } from '../utils/notificationsApi'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
    
    // Subscribe to realtime notifications
    subscribeToNotifications((newNotif) => {
      setNotifications(prev => [newNotif, ...prev])
      setUnreadCount(prev => prev + 1)
      
      // Show browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification(newNotif.title, {
          body: newNotif.message,
          icon: '/pwa/icon-192.png'
        })
      }
    })
  }, [])

  async function loadNotifications() {
    try {
      const data = await getNotifications()
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.read).length)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleNotificationClick(notif: Notification) {
    try {
      if (!notif.read) {
        await markAsRead(notif.id)
        setUnreadCount(prev => Math.max(0, prev - 1))
        setNotifications(prev => 
          prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
        )
      }
      
      if (notif.link) {
        window.location.href = notif.link
      }
      
      setIsOpen(false)
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  function getNotificationIcon(type: Notification['type']) {
    switch (type) {
      case 'challenge_received': return '⚔️'
      case 'challenge_accepted': return '✅'
      case 'your_turn': return '🎮'
      case 'challenge_won': return '🏆'
      case 'challenge_lost': return '😢'
      case 'friend_request': return '👋'
      default: return '📢'
    }
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'À l\'instant'
    if (minutes < 60) return `Il y a ${minutes}m`
    if (hours < 24) return `Il y a ${hours}h`
    return `Il y a ${days}j`
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-lg">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm text-[#8B7355] hover:underline"
                >
                  Tout marquer lu
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  Chargement...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p className="text-4xl mb-2">🔕</p>
                  <p>Aucune notification</p>
                </div>
              ) : (
                <div>
                  {notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition text-left ${
                        !notif.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-sm">
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatTime(notif.created_at)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
