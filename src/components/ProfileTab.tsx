import { Card } from './ui/card';
import { Trophy, TrendingUp, Award, Zap, Plus, Minus, X, Divide, Shuffle, Moon, Sun, Medal, Star, Crown } from 'lucide-react';

interface ProfileTabProps {
  user: any;
  stats: any;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const gameData = [
  { id: 'vif', name: 'VIF', icon: Zap, color: '#E76F51' },
  { id: 'plus', name: 'PLUS', icon: Plus, color: '#52B788' },
  { id: 'moins', name: 'MOINS', icon: Minus, color: '#4A90E2' },
  { id: 'multi', name: 'MULTI', icon: X, color: '#9B59B6' },
  { id: 'div', name: 'DIV', icon: Divide, color: '#F39C12' },
  { id: 'mix', name: 'MIX', icon: Shuffle, color: '#E74C3C' },
];

// Badges/récompenses
const getBadges = (rank: number) => {
  const badges = [];
  if (rank === 1) badges.push({ icon: Crown, label: 'Champion', color: '#D4A574' });
  if (rank <= 3) badges.push({ icon: Trophy, label: 'Podium', color: '#B87333' });
  if (rank <= 10) badges.push({ icon: Medal, label: 'Top 10', color: '#52B788' });
  if (rank <= 50) badges.push({ icon: Star, label: 'Top 50', color: '#4A90E2' });
  return badges;
};

// Données fictives de classement
const FAKE_RANKINGS = [
  { game: 'vif', rank: 3 },
  { game: 'plus', rank: 12 },
  { game: 'moins', rank: 8 },
  { game: 'multi', rank: 45 },
  { game: 'div', rank: 7 },
  { game: 'mix', rank: 5 },
];

const GLOBAL_RANK = { rank: 15, total: 1547 };

export function ProfileTab({ user, stats, darkMode, onToggleDarkMode }: ProfileTabProps) {
  const calculateTotalScore = () => {
    if (!stats?.gameScores) return 0;
    return Object.values(stats.gameScores).reduce((sum: number, game: any) => sum + game.bestScore, 0);
  };

  const getMostPlayedGame = () => {
    if (!stats?.gameScores) return null;
    let maxGames = 0;
    let mostPlayed = null;
    Object.entries(stats.gameScores).forEach(([gameId, data]: any) => {
      if (data.totalGames > maxGames) {
        maxGames = data.totalGames;
        mostPlayed = gameData.find(g => g.id === gameId);
      }
    });
    return mostPlayed;
  };

  const getBestScore = () => {
    if (!stats?.gameScores) return { game: null, score: 0 };
    let maxScore = 0;
    let bestGame = null;
    Object.entries(stats.gameScores).forEach(([gameId, data]: any) => {
      if (data.bestScore > maxScore) {
        maxScore = data.bestScore;
        bestGame = gameData.find(g => g.id === gameId);
      }
    });
    return { game: bestGame, score: maxScore };
  };

  const mostPlayed = getMostPlayedGame();
  const bestScore = getBestScore();

  return (
    <div className="h-full overflow-y-auto p-4" style={{ backgroundColor: 'var(--kg-bg)', WebkitOverflowScrolling: 'touch' }}>
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header simple */}
        <div className="text-center py-4">
          <h2 className="text-3xl font-bold mb-1" style={{ color: 'var(--kg-text)' }}>
            {user.name}
          </h2>
        </div>

        {/* Stats principales */}
        <div className="grid grid-cols-2 gap-3">
          <Card 
            className="p-6 text-center transition-all duration-300 hover:scale-105"
            style={{ 
              backgroundColor: 'var(--kg-card)',
              border: '1px solid var(--border)',
            }}
          >
            <Trophy className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--kg-accent)' }} />
            <p className="text-3xl font-bold mb-1" style={{ color: 'var(--kg-primary)' }}>
              {calculateTotalScore()}
            </p>
            <p className="text-xs" style={{ color: 'var(--kg-text-muted)' }}>
              Score total
            </p>
          </Card>

          <Card 
            className="p-6 text-center transition-all duration-300 hover:scale-105"
            style={{ 
              backgroundColor: 'var(--kg-card)',
              border: '1px solid var(--border)',
            }}
          >
            <Star className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--kg-success)' }} />
            <p className="text-3xl font-bold mb-1" style={{ color: 'var(--kg-text)' }}>
              #{GLOBAL_RANK.rank}
            </p>
            <p className="text-xs" style={{ color: 'var(--kg-text-muted)' }}>
              Classement général
            </p>
          </Card>
        </div>

        {/* Jeu le plus joué */}
        {mostPlayed && (
          <Card 
            className="p-4 transition-all duration-300 hover:scale-[1.02]"
            style={{ 
              backgroundColor: 'var(--kg-card)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:rotate-12"
                style={{ backgroundColor: mostPlayed.color }}
              >
                <mostPlayed.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs mb-1" style={{ color: 'var(--kg-text-muted)' }}>
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  Jeu le plus joué
                </p>
                <p className="text-lg font-bold" style={{ color: 'var(--kg-text)' }}>
                  {mostPlayed.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: 'var(--kg-primary)' }}>
                  {stats.gameScores[mostPlayed.id].totalGames}
                </p>
                <p className="text-xs" style={{ color: 'var(--kg-text-muted)' }}>parties</p>
              </div>
            </div>
          </Card>
        )}

        {/* Meilleur score */}
        {bestScore.game && (
          <Card 
            className="p-4 transition-all duration-300 hover:scale-[1.02]"
            style={{ 
              backgroundColor: 'var(--kg-card)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:rotate-12"
                style={{ backgroundColor: bestScore.game.color }}
              >
                <bestScore.game.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs mb-1" style={{ color: 'var(--kg-text-muted)' }}>
                  <Award className="w-3 h-3 inline mr-1" />
                  Meilleure performance
                </p>
                <p className="text-lg font-bold" style={{ color: 'var(--kg-text)' }}>
                  {bestScore.game.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: 'var(--kg-accent)' }}>
                  {bestScore.score}
                </p>
                <p className="text-xs" style={{ color: 'var(--kg-text-muted)' }}>points</p>
              </div>
            </div>
          </Card>
        )}

        {/* Classements par jeu */}
        <Card 
          className="p-4"
          style={{ 
            backgroundColor: 'var(--kg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--kg-text)' }}>
            <Trophy className="w-5 h-5" style={{ color: 'var(--kg-accent)' }} />
            Mes classements
          </h3>
          <div className="space-y-2">
            {FAKE_RANKINGS.map((ranking) => {
              const game = gameData.find(g => g.id === ranking.game);
              if (!game) return null;
              const Icon = game.icon;
              
              return (
                <div
                  key={ranking.game}
                  className="flex items-center justify-between p-2 rounded-lg transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: 'var(--kg-bg)' }}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" style={{ color: game.color }} />
                    <span className="font-medium text-sm" style={{ color: 'var(--kg-text)' }}>
                      {game.name}
                    </span>
                  </div>
                  <span 
                    className="text-lg font-bold"
                    style={{ 
                      color: ranking.rank <= 10 ? 'var(--kg-success)' : 'var(--kg-text-muted)',
                    }}
                  >
                    #{ranking.rank}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Badges / Récompenses */}
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--kg-text)' }}>
            <Medal className="w-5 h-5" style={{ color: 'var(--kg-accent)' }} />
            Mes badges
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {FAKE_RANKINGS.map((ranking) => {
              const game = gameData.find(g => g.id === ranking.game);
              const badges = getBadges(ranking.rank);
              if (!game || badges.length === 0) return null;
              
              return badges.map((badge, idx) => {
                const BadgeIcon = badge.icon;
                return (
                  <Card
                    key={`${ranking.game}-${idx}`}
                    className="p-3 text-center transition-all duration-300 hover:scale-105"
                    style={{ 
                      backgroundColor: 'var(--kg-card)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <BadgeIcon className="w-8 h-8 mx-auto mb-2" style={{ color: badge.color }} />
                    <p className="text-xs font-bold mb-0.5" style={{ color: 'var(--kg-text)' }}>
                      {badge.label}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--kg-text-muted)' }}>
                      {game.name}
                    </p>
                  </Card>
                );
              });
            })}
          </div>
        </div>

        {/* Dark mode toggle */}
        <Card 
          className="p-4"
          style={{ 
            backgroundColor: 'var(--kg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <button
            onClick={onToggleDarkMode}
            className="w-full flex items-center justify-between p-3 rounded-lg transition-all hover:scale-[1.02]"
            style={{ backgroundColor: 'var(--kg-bg)' }}
          >
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="w-5 h-5" style={{ color: 'var(--kg-text)' }} /> : <Sun className="w-5 h-5" style={{ color: 'var(--kg-text)' }} />}
              <span className="font-medium" style={{ color: 'var(--kg-text)' }}>
                {darkMode ? 'Mode sombre' : 'Mode clair'}
              </span>
            </div>
            <div 
              className="w-12 h-6 rounded-full transition-all relative"
              style={{ backgroundColor: darkMode ? 'var(--kg-primary)' : 'var(--kg-text-muted)' }}
            >
              <div 
                className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all"
                style={{ left: darkMode ? '24px' : '2px' }}
              />
            </div>
          </button>
        </Card>
      </div>
    </div>
  );
}
