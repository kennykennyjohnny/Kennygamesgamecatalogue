import { useState } from 'react';
import { Card } from './ui/card';
import { ArrowLeft, Hash } from 'lucide-react';
import { partyApi } from '../utils/partyApi';
import { Button } from './ui/button';

interface JoinGameProps {
  userId: string;
  userName: string;
  onGameJoined: (gameId: string, shortCode: string) => void;
  onBack: () => void;
}

export function JoinGame({ userId, userName, onGameJoined, onBack }: JoinGameProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (code.length !== 6) {
      setError('Le code doit contenir 6 caractères');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if game exists
      const gameResult = await partyApi.getGameByCode(code.toUpperCase());
      
      if (!gameResult.success || !gameResult.game) {
        setError('Partie introuvable');
        setLoading(false);
        return;
      }

      // Check if already in game
      const alreadyIn = gameResult.players?.some(p => p.user_id === userId);
      if (alreadyIn) {
        onGameJoined(gameResult.game.id, code.toUpperCase());
        return;
      }

      // Check if game is full
      if (gameResult.players && gameResult.players.length >= gameResult.game.max_players) {
        setError('Cette partie est complète');
        setLoading(false);
        return;
      }

      // Join game
      const joinResult = await partyApi.joinGame(gameResult.game.id, userId, userName);
      
      if (joinResult.success) {
        onGameJoined(gameResult.game.id, code.toUpperCase());
      } else {
        setError('Impossible de rejoindre la partie');
        setLoading(false);
      }
    } catch (err) {
      setError('Une erreur est survenue');
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 flex items-center justify-center" style={{ backgroundColor: 'var(--kg-bg)' }}>
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-black/5 transition-colors"
            style={{ color: 'var(--kg-text)' }}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-black" style={{ color: 'var(--kg-text)' }}>
              Rejoindre une partie
            </h1>
            <p className="text-sm" style={{ color: 'var(--kg-text-muted)' }}>
              Entre le code à 6 caractères
            </p>
          </div>
        </div>

        <Card className="p-6" style={{ backgroundColor: 'var(--kg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Hash className="w-5 h-5" style={{ color: 'var(--kg-primary)' }} />
            <label className="text-sm font-bold" style={{ color: 'var(--kg-text)' }}>
              Code de la partie
            </label>
          </div>

          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase().slice(0, 6));
              setError('');
            }}
            placeholder="ABC123"
            maxLength={6}
            className="w-full px-4 py-4 text-3xl font-mono font-bold text-center rounded-xl mb-4 uppercase tracking-wider"
            style={{
              backgroundColor: 'var(--kg-bg)',
              color: 'var(--kg-text)',
              border: `2px solid ${error ? 'var(--kg-error)' : 'var(--border)'}`,
            }}
            disabled={loading}
          />

          {error && (
            <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(231, 111, 81, 0.1)' }}>
              <p className="text-sm font-medium text-center" style={{ color: 'var(--kg-error)' }}>
                {error}
              </p>
            </div>
          )}

          <Button
            onClick={handleJoin}
            disabled={code.length !== 6 || loading}
            className="w-full py-4 text-lg font-bold rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--kg-primary)',
              color: 'white',
            }}
          >
            {loading ? 'Connexion...' : 'Rejoindre'}
          </Button>
        </Card>

        <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: 'var(--kg-card)', border: '1px solid var(--border)' }}>
          <p className="text-xs text-center" style={{ color: 'var(--kg-text-muted)' }}>
            💡 <strong>Astuce:</strong> Tu peux aussi rejoindre en cliquant sur un lien partagé !
          </p>
        </div>
      </div>
    </div>
  );
}
