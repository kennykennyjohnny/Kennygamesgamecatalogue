import { PartyGame } from '../utils/gameTypes';
import { Card } from './ui/card';
import { Plus, Users as UsersIcon } from 'lucide-react';

interface PartyHomeProps {
  onCreateGame: () => void;
  onJoinGame: () => void;
}

export function PartyHome({ onCreateGame, onJoinGame }: PartyHomeProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4" style={{ backgroundColor: 'var(--kg-bg)' }}>
      <div className="max-w-md w-full">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black mb-4" style={{ color: 'var(--kg-text)' }}>
            🎮 KENNYGAMES
          </h1>
          <p className="text-xl font-bold mb-2" style={{ color: 'var(--kg-primary)' }}>
            PARTY
          </p>
          <p className="text-sm" style={{ color: 'var(--kg-text-muted)' }}>
            Mini-jeux multijoueurs tour par tour
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={onCreateGame}
            className="w-full p-8 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, var(--kg-primary) 0%, var(--kg-accent) 100%)',
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Plus className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-2xl font-black text-white mb-1">
                  Créer une partie
                </h3>
                <p className="text-sm text-white/80">
                  Choisis un jeu et invite tes amis
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={onJoinGame}
            className="w-full p-8 rounded-2xl transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: 'var(--kg-card)',
              border: '3px solid var(--kg-primary)',
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--kg-primary)' }}
              >
                <UsersIcon className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-2xl font-black mb-1" style={{ color: 'var(--kg-text)' }}>
                  Rejoindre
                </h3>
                <p className="text-sm" style={{ color: 'var(--kg-text-muted)' }}>
                  Entre un code de partie à 6 chiffres
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Info */}
        <Card className="mt-8 p-4" style={{ backgroundColor: 'var(--kg-card)', border: '1px solid var(--border)' }}>
          <div className="text-center">
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--kg-text)' }}>
              🎯 4 jeux disponibles
            </p>
            <div className="flex items-center justify-center gap-2 text-2xl">
              <span>🍷</span>
              <span>⚡</span>
              <span>🍾</span>
              <span>💻</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
