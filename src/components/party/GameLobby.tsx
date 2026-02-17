import { useState, useEffect } from 'react';
import { partyApi } from '@/utils/partyApi';
import { GamePlayer, PartyGame } from '@/utils/gameTypes';
import { ArrowLeft, Copy, Check, Users } from 'lucide-react';
import { Card } from '../ui/card';
import { getGameUrl } from '@/utils/shortCode';
import { Button } from '../ui/button';
import { Avatar } from '../Avatar';

interface GameLobbyProps {
  game: PartyGame;
  currentUserId: string;
  currentUserName: string;
  onStart: () => void;
  onBack: () => void;
}

export function GameLobby({ game, currentUserId, currentUserName, onStart, onBack }: GameLobbyProps) {
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [myStatus, setMyStatus] = useState<'waiting' | 'ready'>('waiting');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const isCreator = game.creator_id === currentUserId;
  const gameUrl = getGameUrl(game.short_code);
  const allReady = players.length >= 2 && players.every(p => p.status === 'ready');
  const canStart = isCreator && allReady && game.status === 'waiting';

  useEffect(() => {
    loadPlayers();

    // Subscribe to realtime updates
    const channel = partyApi.subscribeToGame(game.id, () => {
      loadPlayers();
    });

    return () => {
      channel.unsubscribe();
    };
  }, [game.id]);

  const loadPlayers = async () => {
    const result = await partyApi.getGameByCode(game.short_code);
    if (result.success && result.players) {
      setPlayers(result.players);
      const me = result.players.find(p => p.user_id === currentUserId);
      if (me) {
        setMyStatus(me.status as 'waiting' | 'ready');
      }
    }
  };

  const handleToggleReady = async () => {
    const newStatus = myStatus === 'ready' ? 'waiting' : 'ready';
    setLoading(true);
    await partyApi.updatePlayerStatus(game.id, currentUserId, newStatus);
    setMyStatus(newStatus);
    setLoading(false);
  };

  const handleStart = async () => {
    setLoading(true);
    await partyApi.startGame(game.id);
    onStart();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(gameUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const gameMeta = {
    sandy: { name: 'SANDYPONG', emoji: '🏖️', subtitle: 'Beer Pong Plage' },
    liliano: { name: 'LILIANOTHUNDER', emoji: '⚡', subtitle: 'Tanks Tonnerre' },
    lea: { name: 'LÉANAVAL', emoji: '⚓', subtitle: 'Bataille Navale' },
    nour: { name: 'NOURARCHERY', emoji: '🏹', subtitle: 'Tir à l\'arc' },
  }[game.game_type];

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: 'var(--kg-bg)' }}>
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
              {gameMeta?.emoji} {gameMeta?.name}
            </h1>
            <p className="text-sm" style={{ color: 'var(--kg-text-muted)' }}>
              {gameMeta?.subtitle}
            </p>
          </div>
        </div>

        {/* Game Info */}
        <Card className="p-4 mb-4" style={{ backgroundColor: 'var(--kg-card)', border: '1px solid var(--border)' }}>
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--kg-text-muted)' }}>
            Code de partie
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-black/5 dark:bg-white/5 rounded-lg px-4 py-3 font-mono text-2xl font-bold text-center">
              {game.short_code}
            </div>
            <button
              onClick={handleCopy}
              className="p-3 rounded-lg transition-all hover:scale-110 active:scale-95"
              style={{ backgroundColor: 'var(--kg-primary)', color: 'white' }}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs mt-2 text-center" style={{ color: 'var(--kg-text-muted)' }}>
            Partage ce code ou le lien pour inviter des joueurs
          </p>
        </Card>

        {/* Players List */}
        <Card className="p-4 mb-4" style={{ backgroundColor: 'var(--kg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5" style={{ color: 'var(--kg-primary)' }} />
            <h3 className="text-lg font-bold" style={{ color: 'var(--kg-text)' }}>
              Joueurs ({players.length}/{game.max_players})
            </h3>
          </div>
          <div className="space-y-2">
            {players.map((player) => {
              const isMe = player.user_id === currentUserId;
              const isReady = player.status === 'ready';
              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 rounded-lg transition-all"
                  style={{
                    backgroundColor: isMe ? 'var(--kg-primary)' : 'var(--kg-bg)',
                    color: isMe ? 'white' : 'var(--kg-text)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    {player.avatar_seed ? (
                      <Avatar seed={player.avatar_seed} size="md" />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                        style={{
                          backgroundColor: isMe ? 'rgba(255, 255, 255, 0.2)' : 'var(--kg-primary)',
                          color: isMe ? 'white' : 'white',
                        }}
                      >
                        {player.user_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold">{player.user_name}</p>
                      {player.user_id === game.creator_id && (
                        <p className="text-xs opacity-75">Créateur</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {isReady ? (
                      <span className="text-sm font-bold">✓ Prêt</span>
                    ) : (
                      <span className="text-sm opacity-60">En attente...</span>
                    )}
                  </div>
                </div>
              );
            })}
            {/* Empty slots */}
            {Array.from({ length: game.max_players - players.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center p-3 rounded-lg border-2 border-dashed"
                style={{ borderColor: 'var(--border)', opacity: 0.5 }}
              >
                <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                  <Users className="w-5 h-5" style={{ color: 'var(--kg-text-muted)' }} />
                </div>
                <p className="ml-3 text-sm" style={{ color: 'var(--kg-text-muted)' }}>
                  En attente d'un joueur...
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          {!isCreator && (
            <Button
              onClick={handleToggleReady}
              disabled={loading}
              className="w-full py-4 text-lg font-bold rounded-xl transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: myStatus === 'ready' ? 'var(--kg-success)' : 'var(--kg-primary)',
                color: 'white',
              }}
            >
              {myStatus === 'ready' ? '✓ Prêt' : 'Je suis prêt !'}
            </Button>
          )}

          {isCreator && (
            <Button
              onClick={handleStart}
              disabled={!canStart || loading}
              className="w-full py-4 text-lg font-bold rounded-xl transition-all disabled:opacity-50"
              style={{
                backgroundColor: canStart ? 'var(--kg-success)' : 'var(--kg-primary)',
                color: 'white',
              }}
            >
              {allReady ? '🚀 Démarrer la partie' : 'En attente des joueurs...'}
            </Button>
          )}

          <button
            onClick={handleCopy}
            className="w-full py-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: 'var(--kg-bg)',
              border: '2px solid var(--kg-primary)',
              color: 'var(--kg-primary)',
            }}
          >
            {copied ? '✓ Lien copié !' : '🔗 Copier le lien'}
          </button>
        </div>
      </div>
    </div>
  );
}
