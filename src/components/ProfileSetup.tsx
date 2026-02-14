import { useState } from 'react'
import { supabase } from '../utils/client'

interface ProfileSetupProps {
  userId: string
  onComplete: () => void
}

export function ProfileSetup({ onComplete }: { onComplete: () => void }) {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          username: username.toLowerCase(),
          display_name: displayName || username,
          status: 'online'
        })

      if (profileError) throw profileError
      onComplete()
    } catch (err: any) {
      console.error('Error creating profile:', err)
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }
    e.preventDefault()
    
    if (!username.trim()) {
      setError('Le pseudo est requis')
      return
    }

    // Username validation (alphanumeric + underscore only)
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setError('Pseudo : 3-20 caractères, lettres, chiffres et _ uniquement')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Check if username is taken
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('username', username.toLowerCase())
        .single()

      if (existing) {
        setError('Ce pseudo est déjà pris')
        setLoading(false)
        return
      }

      // Create profile
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          username: username.toLowerCase(),
          display_name: displayName.trim() || username,
          status: 'online'
        })

      if (insertError) throw insertError

      onComplete()
    } catch (err: any) {
      console.error('Error creating profile:', err)
      setError(err.message || 'Erreur lors de la création du profil')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#2C1810] mb-2">
            Bienvenue ! 🎮
          </h1>
          <p className="text-gray-600">
            Choisis ton pseudo pour commencer
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-[#2C1810] mb-2">
              Pseudo *
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="kenny"
              maxLength={20}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355] focus:border-transparent"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              3-20 caractères, lettres, chiffres et _ uniquement
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#2C1810] mb-2">
              Nom affiché (optionnel)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Kenny Games"
              maxLength={50}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355] focus:border-transparent"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Si vide, ton pseudo sera utilisé
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full bg-[#8B7355] text-white py-4 rounded-lg font-bold text-lg hover:bg-[#6d5940] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Création...' : 'C\'est parti ! 🚀'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Ton pseudo sera visible par tes amis
          </p>
        </div>
      </div>
    </div>
  )
}
