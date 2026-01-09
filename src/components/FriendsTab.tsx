import { useState } from 'react';
import { Search, Zap, Plus, Minus, X as MultiIcon, Divide, Shuffle, Check, X as XIcon, Trophy } from 'lucide-react';
import { Card } from './ui/card';
import { Input } from './ui/input';

const gameIcons = [
  { id: 'vif', Icon: Zap, color: '#E76F51' },
  { id: 'plus', Icon: Plus, color: '#52B788' },
  { id: 'moins', Icon: Minus, color: '#4A90E2' },
  { id: 'multi', Icon: MultiIcon, color: '#9B59B6' },
  { id: 'div', Icon: Divide, color: '#F39C12' },
  { id: 'mix', Icon: Shuffle, color: '#E74C3C' },
];

// Données fictives d'amis + le joueur actuel
const CURRENT_USER = { id: 0, name: 'Moi', totalScore: 550, rank: 15, scores: { vif: 480, plus: 32, moins: 30, multi: 28, div: 25, mix: 30 }, status: 'me' };

const FAKE_FRIENDS = [
  { id: 1, name: 'Alice Pro', totalScore: 820, rank: 3, scores: { vif: 750, plus: 42, moins: 38, multi: 35, div: 32, mix: 40 }, status: 'friend' },
  { id: 2, name: 'Bob Speed', totalScore: 650, rank: 8, scores: { vif: 580, plus: 38, moins: 35, multi: 30, div: 28, mix: 35 }, status: 'friend' },
  { id: 3, name: 'Charlie Fast', totalScore: 590, rank: 12, scores: { vif: 520, plus: 35, moins: 32, multi: 28, div: 26, mix: 32 }, status: 'friend' },
  { id: 4, name: 'NewFriend123', totalScore: 480, rank: 22, scores: { vif: 420, plus: 30, moins: 28, multi: 25, div: 22, mix: 28 }, status: 'pending' },
  { id: 5, name: 'Evan Flash', totalScore: 420, rank: 28, scores: { vif: 360, plus: 28, moins: 25, multi: 22, div: 20, mix: 25 }, status: 'friend' },
  { id: 6, name: 'Fiona Swift', totalScore: 380, rank: 35, scores: { vif: 320, plus: 25, moins: 22, multi: 20, div: 18, mix: 22 }, status: 'friend' },
];

export function FriendsTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [friends, setFriends] = useState(FAKE_FRIENDS);
  const [showConfirmDelete, setShowConfirmDelete] = useState<number | null>(null);

  const allUsers = [CURRENT_USER, ...friends].sort((a, b) => b.totalScore - a.totalScore);
  
  const filteredUsers = searchQuery 
    ? allUsers.filter(user => user.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allUsers;

  const handleAcceptFriend = (friendId: number) => {
    setFriends(friends.map(f => 
      f.id === friendId ? { ...f, status: 'friend' } : f
    ));
  };

  const handleRejectRequest = (friendId: number) => {
    setFriends(friends.filter(f => f.id !== friendId));
  };

  const handleDeleteFriend = (friendId: number) => {
    if (showConfirmDelete === friendId) {
      setFriends(friends.filter(f => f.id !== friendId));
      setShowConfirmDelete(null);
    } else {
      setShowConfirmDelete(friendId);
      setTimeout(() => setShowConfirmDelete(null), 3000);
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--kg-bg)' }}>
      {/* Search bar */}
      <div className="p-3 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--kg-card)' }}>
        <div className="relative">
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" 
            style={{ color: 'var(--kg-text-muted)' }}
          />
          <Input
            type="text"
            placeholder="Chercher un ami..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearching(true)}
            onBlur={() => setIsSearching(false)}
            className="pl-10 transition-all duration-300"
            style={{ 
              backgroundColor: 'var(--input-background)',
              color: 'var(--kg-text)',
              border: isSearching ? '2px solid var(--kg-primary)' : '1px solid var(--border)',
            }}
          />
        </div>
      </div>

      {/* Friends list */}
      <div className="flex-1 overflow-y-auto p-2" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="space-y-1.5">
          {filteredUsers.map((user, index) => {
            const isMe = user.status === 'me';
            const isPending = user.status === 'pending';
            
            return (
              <Card
                key={user.id}
                className={`p-2.5 transition-all duration-300 hover:scale-[1.01] ${isPending ? 'ring-2' : ''}`}
                style={{ 
                  backgroundColor: isMe 
                    ? 'var(--kg-primary)' 
                    : isPending 
                      ? 'var(--kg-card)'
                      : 'var(--kg-card)',
                  border: isPending ? '2px solid var(--kg-success)' : '1px solid var(--border)',
                  color: isMe ? 'white' : 'var(--kg-text)',
                }}
              >
                {/* Header: nom + classement + total */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Nom */}
                    <p className="font-bold text-base truncate flex-shrink min-w-0" style={{ color: isMe ? 'white' : 'var(--kg-text)' }}>
                      {user.name}
                      {isPending && <span className="ml-1 text-[10px]" style={{ color: 'var(--kg-success)' }}>●</span>}
                    </p>
                    
                    {/* Classement */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Trophy className="w-5 h-5" style={{ color: isMe ? 'white' : 'var(--kg-accent)' }} />
                      <span className="text-xl font-black" style={{ color: isMe ? 'white' : 'var(--kg-accent)' }}>
                        #{user.rank}
                      </span>
                    </div>
                    
                    {/* Total */}
                    <span className="text-xl font-black flex-shrink-0" style={{ color: isMe ? 'white' : 'var(--kg-primary)' }}>
                      {user.totalScore}
                    </span>
                  </div>

                  {/* Actions */}
                  {!isMe && (
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      {isPending ? (
                        <>
                          <button
                            onClick={() => handleAcceptFriend(user.id)}
                            className="p-1 rounded transition-all hover:scale-110"
                            style={{ backgroundColor: 'var(--kg-success)', color: 'white' }}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRejectRequest(user.id)}
                            className="p-1 rounded transition-all hover:scale-110"
                            style={{ backgroundColor: 'var(--kg-error)', color: 'white' }}
                          >
                            <XIcon className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleDeleteFriend(user.id)}
                          className="p-1 rounded transition-all hover:scale-110"
                          style={{ 
                            backgroundColor: showConfirmDelete === user.id ? 'var(--kg-error)' : 'rgba(231, 111, 81, 0.15)',
                            color: showConfirmDelete === user.id ? 'white' : 'var(--kg-error)',
                          }}
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Scores des jeux - scrollable horizontalement */}
                <div className="overflow-x-auto -mx-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <div className="flex gap-1.5 px-1">
                    {gameIcons.map(({ id, Icon, color }) => (
                      <div
                        key={id}
                        className="flex-shrink-0 flex flex-col items-center justify-center p-1.5 rounded transition-transform hover:scale-105"
                        style={{ 
                          backgroundColor: isMe ? 'rgba(255, 255, 255, 0.2)' : 'var(--kg-bg)',
                          minWidth: '52px',
                        }}
                      >
                        <Icon className="w-4 h-4 mb-0.5" style={{ color: isMe ? 'white' : color }} />
                        <p className="text-base font-bold" style={{ color: isMe ? 'white' : 'var(--kg-text)' }}>
                          {user.scores[id as keyof typeof user.scores]}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p style={{ color: 'var(--kg-text-muted)' }}>
              Aucun ami trouvé
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
