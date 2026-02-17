import { useState, useEffect } from 'react'
import { supabase } from './utils/client'
import { AuthScreen } from './components/AuthScreen'
import { MainApp } from './components/MainApp'
import { ThemeProvider } from './contexts/ThemeContext'

// Request browser notification permission
async function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}

// Send a browser notification
function sendNotification(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification(title, {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
  });
}

function App() {
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUserSession()
  }, [])

  // Subscribe to realtime game notifications when user is logged in
  useEffect(() => {
    if (!user) return;

    requestNotificationPermission();

    // Listen for challenges where it becomes my turn
    const channel = supabase
      .channel('game-notifications')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'challenges',
      }, (payload: any) => {
        const challenge = payload.new;
        if (challenge.current_turn_user_id === user.id && challenge.status === 'playing') {
          const gameNames: Record<string, string> = {
            sandy: 'SandyPong 🥂', lea: 'LéaNaval 🍷', liliano: 'LilianoThunder ⚡', nour: 'NourPigeon 🪶'
          };
          const gameName = gameNames[challenge.game_type] || challenge.game_type;
          sendNotification(
            '🎮 C\'est à ton tour !',
            `Ta partie de ${gameName} t'attend. Montre-leur qui est le GOAT !`
          );
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'friendships',
      }, (payload: any) => {
        if (payload.new.friend_id === user.id && payload.new.status === 'pending') {
          sendNotification(
            '👥 Nouvelle demande d\'ami !',
            'Quelqu\'un veut devenir ton ami sur KennyGames !'
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function checkUserSession() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        setLoading(false)
        return
      }

      // Get user profile - try user_profiles first (existing accounts)
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('id, username')
        .eq('id', authUser.id)
        .single()

      if (profileData) {
        setUser({
          id: profileData.id,
          name: profileData.username,
          email: authUser.email || '',
        })
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error checking session:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={setUser} />
  }

  return <MainApp user={user} onLogout={() => setUser(null)} />
}

// Wrapper avec ThemeProvider
export default function AppWithTheme() {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  )
}
