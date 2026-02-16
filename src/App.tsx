import { useState, useEffect } from 'react'
import { supabase } from './utils/client'
import { AuthScreen } from './components/AuthScreen'
import { MainApp } from './components/MainApp'
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUserSession()
  }, [])

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
      } else {
        // Fallback to users table
        const { data: userData } = await supabase
          .from('users')
          .select('id, username, email')
          .eq('id', authUser.id)
          .single()

        if (userData) {
          setUser({
            id: userData.id,
            name: userData.username,
            email: userData.email,
          })
        }
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
