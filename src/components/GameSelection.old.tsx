import { useState } from 'react';
import { Card } from './ui/card';
import { GAMES_META, GameType } from '../utils/gameTypes';
import { partyApi } from '../utils/partyApi';
import { ArrowLeft, Play } from 'lucide-react';

interface GameSelectionProps {
  userId: string;
  userName: string;
  onGameCreated: (gameId: string, gameType: GameType) => void;
  onBack: () => void;
}

export function GameSelection({ userId, userName, onGameCreated, onBack }: GameSelectionProps) {
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [creating, setCreating] = useState(false);

  const handleCreateGame = async (gameType: GameType) => {
    setCreating(true);
    
    const result = await partyApi.createGame(gameType, userId, userName, 2);
    
    if (result.success && result.game) {
      onGameCreated(result.game.id, gameType);
    } else {
      alert('Erreur lors de la création de la partie');
      setCreating(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4" style={{ backgroundColor: 'var(--kg-bg)' }}>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-black/5 transition-colors"
            style={{ color: 'var(--kg-text)' }}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-black" style={{ color: 'var(--kg-text)' }}>
              Choisir un jeu
            </h1>
            <p className="text-sm" style={{ color: 'var(--kg-text-muted)' }}>
              Sélectionne ton jeu préféré
            </p>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 gap-4">
          {Object.values(GAMES_META).map((game) => (
            <button
              key={game.id}
              onClick={() => handleCreateGame(game.id)}
              disabled={creating}
              className="relative overflow-hidden rounded-2xl p-6 text-left transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50"
              style={{ 
                background: game.gradient,
                border: 'none',
                minHeight: '150px',
              }}
            >
              <div className="relative z-10 flex items-center gap-4">
                <div className="text-6xl">{game.emoji}</div>
                <div className="flex-1">
                  <h3 className="text-2xl font-black text-white mb-1">
                    {game.name}
                  </h3>
                  <p className="text-sm text-white/80 mb-2">
                    {game.subtitle}
                  </p>
                  <p className="text-xs text-white/70">
                    {game.description}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="bg-white/20 backdrop-blur-sm rounded px-3 py-1">
                      <p className="text-white text-xs font-bold">
                        {game.minPlayers}-{game.maxPlayers} joueurs
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <Play className="w-8 h-8 text-white" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Coming Soon */}
        <Card className="p-4 mt-6" style={{ backgroundColor: 'var(--kg-card)', border: '1px solid var(--border)' }}>
          <p className="text-sm text-center" style={{ color: 'var(--kg-text-muted)' }}>
            🚧 Pour le moment, seul <strong>SANDYGAMES</strong> est jouable.
            <br />
            Les autres jeux arrivent bientôt !
          </p>
        </Card>
      </div>
    </div>
  );
}
