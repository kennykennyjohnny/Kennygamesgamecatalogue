import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Trophy } from 'lucide-react';

interface LeaderboardProps {
  gameId: string;
  currentUserId?: string;
  maxEntries?: number;
}

interface LeaderboardEntry {
  rank: number;
  userName: string;
  bestScore: number;
  lastPlayed: string;
}

export function Leaderboard({ gameId, currentUserId, maxEntries = 10 }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [gameId]);

  const loadLeaderboard = async () => {
    try {
      const { api } = await import('../utils/api');
      const result = await api.getLeaderboard(gameId);
      if (result.success) {
        setLeaderboard(result.leaderboard.slice(0, maxEntries));
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5" style={{ color: 'var(--kg-accent)' }} />
        <h3 className="font-bold text-lg" style={{ color: 'var(--kg-text)' }}>
          Top {maxEntries}
        </h3>
      </div>

      {leaderboard.length === 0 ? (
        <p className="text-gray-500 text-center py-4">Aucun score enregistré</p>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center justify-between p-3 rounded transition-colors ${
                entry.rank === 1 ? 'bg-yellow-50 border border-yellow-200' :
                entry.rank === 2 ? 'bg-gray-50 border border-gray-200' :
                entry.rank === 3 ? 'bg-orange-50 border border-orange-200' :
                'bg-white border border-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`font-bold text-lg w-8 text-center ${
                    entry.rank === 1 ? 'text-yellow-600' :
                    entry.rank === 2 ? 'text-gray-600' :
                    entry.rank === 3 ? 'text-orange-600' :
                    'text-gray-400'
                  }`}
                >
                  {entry.rank}
                </span>
                <span className="font-medium" style={{ color: 'var(--kg-text)' }}>
                  {entry.userName}
                </span>
              </div>
              <span className="font-bold" style={{ color: 'var(--kg-primary)' }}>
                {entry.bestScore}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
