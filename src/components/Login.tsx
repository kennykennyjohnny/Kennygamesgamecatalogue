import { useState } from 'react'
import { supabase } from '../utils/client'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card } from './ui/card'

interface LoginProps {
  onSuccess: () => void
}

export default function Login({ onSuccess }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        // LOGIN
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
        onSuccess()
      } else {
        // SIGNUP
        if (!name) {
          setError('Le pseudo est requis')
          setLoading(false)
          return
        }

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })
        if (signUpError) throw signUpError

        // Create profile with username
        if (authData.user) {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: authData.user.id,
              username: name.toLowerCase(),
              display_name: name,
              status: 'online'
            })

          if (profileError) {
            console.error('Profile creation error:', profileError)
            throw profileError
          }

          // Auto-login after successful signup
          onSuccess()
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err)
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#2D6A4F' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold mb-2" style={{ color: '#FFFFFF' }}>
            KENNYGAMES
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Défie tes amis sur des mini-jeux !
          </p>
        </div>

        <Card className="p-6 md:p-8" style={{ backgroundColor: '#FFFFFF', border: 'none' }}>
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#1A1A1A' }}>
            {isLogin ? 'Connexion' : 'Créer un compte'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#1A1A1A' }}>
                  Pseudo
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ton pseudo"
                  required={!isLogin}
                  className="w-full"
                  style={{ 
                    backgroundColor: 'rgba(45, 106, 79, 0.05)', 
                    color: '#1A1A1A',
                    border: '1px solid rgba(45, 106, 79, 0.15)',
                  }}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#1A1A1A' }}>
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton@email.com"
                required
                className="w-full"
                style={{ 
                  backgroundColor: 'rgba(45, 106, 79, 0.05)', 
                  color: '#1A1A1A',
                  border: '1px solid rgba(45, 106, 79, 0.15)',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#1A1A1A' }}>
                Mot de passe
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full"
                style={{ 
                  backgroundColor: 'rgba(45, 106, 79, 0.05)', 
                  color: '#1A1A1A',
                  border: '1px solid rgba(45, 106, 79, 0.15)',
                }}
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              style={{ 
                backgroundColor: '#2D6A4F',
                color: '#FFFFFF',
              }}
            >
              {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'Créer mon compte')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
              }}
              className="text-sm hover:underline"
              style={{ color: '#2D6A4F' }}
            >
              {isLogin ? 'Pas de compte ? Créer un compte' : 'Déjà un compte ? Se connecter'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
