import { useState, useEffect } from 'react'
import { getFriends, type Friend, searchUsers, sendFriendRequest } from '../utils/friendsApi'
import { createChallenge } from '../utils/challengesApi'
import { GameType, GAMES_META } from '../utils/gameTypes'
import { supabase } from '../utils/client'

interface FriendsListProps {
  selectedGame?: GameType
  onChallengeCreated?: () => void
}

export default function FriendsList({ selectedGame, onChallengeCreated }: FriendsListProps) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [currentUsername, setCurrentUsername] = useState('')

  useEffect(() => {
    loadFriends()
    loadCurrentUser()
  }, [])

  async function loadFriends() {
    try {
      const data = await getFriends()
      setFriends(data)
    } catch (error) {
      console.error('Error loading friends:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('id', user.id)
        .single()
      
      if (data) setCurrentUsername(data.username)
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return
    
    setSearching(true)
    try {
      const results = await searchUsers(searchQuery)
      setSearchResults(results || [])
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setSearching(false)
    }
  }

  async function handleAddFriend(friendId: string) {
    try {
      await sendFriendRequest(friendId)
      alert('Demande envoyée !')
      setSearchResults([])
      setSearchQuery('')
    } catch (error: any) {
      alert(error.message || 'Erreur lors de l\'ajout')
    }
  }

  async function handleChallenge(friendId: string) {
    if (!selectedGame) return
    
    try {
      await createChallenge(friendId, selectedGame)
      alert('Défi envoyé ! 🎮')
      if (onChallengeCreated) onChallengeCreated()
    } catch (error) {
      console.error('Error creating challenge:', error)
      alert('Erreur lors de la création du défi')
    }
  }

  function handleWhatsAppShare() {
    if (!currentUsername) return
    const appUrl = window.location.origin
    const message = `Rejoins-moi sur KennyGames Party ! 🎮 ${appUrl}?invite=${currentUsername}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Friend */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {selectedGame ? `Défier sur ${GAMES_META[selectedGame].name}` : 'Mes Amis'}
        </h2>
        <button
          onClick={handleWhatsAppShare}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
        >
          <span>📱</span>
          <span>Inviter via WhatsApp</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Chercher un utilisateur..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-6 py-2 bg-[#8B7355] text-white rounded-lg hover:bg-[#6d5940] transition disabled:opacity-50"
          >
            {searching ? '...' : 'Chercher'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#8B7355] flex items-center justify-center text-white font-bold">
                    {user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold">{user.username}</div>
                    {user.display_name && (
                      <div className="text-sm text-gray-600">{user.display_name}</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleAddFriend(user.id)}
                  className="px-4 py-1 bg-[#9CB380] text-white rounded-lg hover:bg-[#7a9060] transition text-sm"
                >
                  + Ajouter
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Friends List */}
      {friends.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-xl mb-2">Aucun ami pour le moment</p>
          <p>Cherche des amis ou partage ton pseudo !</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {friends.map((friend) => (
            <div
              key={friend.friend_id}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#8B7355] flex items-center justify-center text-white font-bold text-lg">
                    {friend.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-lg">{friend.username}</div>
                    {friend.display_name && (
                      <div className="text-sm text-gray-600">{friend.display_name}</div>
                    )}
                    <div className="flex items-center gap-1 text-xs mt-1">
                      <span className={`w-2 h-2 rounded-full ${
                        friend.status === 'online' ? 'bg-green-500' :
                        friend.status === 'in_game' ? 'bg-yellow-500' :
                        'bg-gray-400'
                      }`} />
                      <span className="text-gray-500">
                        {friend.status === 'online' ? 'En ligne' :
                         friend.status === 'in_game' ? 'En jeu' :
                         'Hors ligne'}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedGame && (
                  <button
                    onClick={() => handleChallenge(friend.friend_id)}
                    className="px-4 py-2 bg-[#9CB380] text-white rounded-lg hover:bg-[#7a9060] transition font-bold"
                  >
                    Défier {GAMES_META[selectedGame].emoji}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
