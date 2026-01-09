import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Home, RotateCcw, Zap, Trophy } from 'lucide-react';

interface VifGameProps {
  user: any;
  token: string;
  onBackToMenu: () => void;
}

interface Circle {
  id: number;
  x: number;
  y: number;
  progress: number;
}

interface PointsPopup {
  id: number;
  x: number;
  y: number;
  points: number;
}

// Données fictives pour le top 10 VIF
const FAKE_VIF_TOP_10 = [
  { rank: 1, name: 'ReflexPro', score: 850 },
  { rank: 2, name: 'SpeedKing', score: 720 },
  { rank: 3, name: 'QuickShot', score: 680 },
  { rank: 4, name: 'FastClick', score: 540 },
  { rank: 5, name: 'NinjaSpeed', score: 490 },
  { rank: 6, name: 'ClickMaster', score: 420 },
  { rank: 7, name: 'FlashHand', score: 380 },
  { rank: 8, name: 'PrecisionPro', score: 340 },
  { rank: 9, name: 'ReflexKing', score: 300 },
  { rank: 10, name: 'SpeedyFinger', score: 260 },
];

export function VifGame({ user, token, onBackToMenu }: VifGameProps) {
  const [gameState, setGameState] = useState<'countdown' | 'playing' | 'finished'>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [combo, setCombo] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [pointsPopups, setPointsPopups] = useState<PointsPopup[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const nextCircleId = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const spawnRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadBestScore();
    startCountdown();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (spawnRef.current) clearInterval(spawnRef.current);
    };
  }, []);

  const loadBestScore = async () => {
    try {
      const { api } = await import('../../utils/api');
      const result = await api.getUserStats(token);
      if (result.success && result.stats.gameScores?.vif) {
        setBestScore(result.stats.gameScores.vif.bestScore);
      }
    } catch (error) {
      console.error('Failed to load best score:', error);
    }
  };

  const startCountdown = () => {
    setCountdown(3);
    setGameState('countdown');
    
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          startGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(30);
    setCircles([]);
    setCombo(0);
    setPointsPopups([]);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    spawnCircle();
    spawnRef.current = setInterval(spawnCircle, 1200);
  };

  const spawnCircle = () => {
    if (!gameAreaRef.current) return;
    
    const area = gameAreaRef.current.getBoundingClientRect();
    const size = 100;
    const padding = 20;
    
    const newCircle: Circle = {
      id: nextCircleId.current++,
      x: Math.random() * (area.width - size - padding * 2) + padding,
      y: Math.random() * (area.height - size - padding * 2) + padding,
      progress: 100,
    };
    
    setCircles((prev) => [...prev, newCircle]);

    setTimeout(() => {
      setCircles((prev) => prev.filter((c) => c.id !== newCircle.id));
      setCombo(0);
    }, 2500);
  };

  const handleCircleClick = (circle: Circle, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clickX = e.clientX;
    const clickY = e.clientY;
    
    const distance = Math.sqrt(
      Math.pow(clickX - centerX, 2) + Math.pow(clickY - centerY, 2)
    );
    const maxDistance = rect.width / 2;
    const accuracy = 1 - (distance / maxDistance);
    
    let points = 10;
    if (accuracy > 0.8) {
      points = 20;
      setCombo((prev) => prev + 1);
    } else if (accuracy > 0.5) {
      points = 15;
      setCombo((prev) => prev + 1);
    } else {
      setCombo(0);
    }
    
    const comboMultiplier = combo >= 2 ? 3 : 1;
    const finalPoints = points * comboMultiplier;
    
    setScore((prev) => prev + finalPoints);
    
    const popupId = Date.now();
    setPointsPopups((prev) => [...prev, { id: popupId, x: clickX, y: clickY, points: finalPoints }]);
    setTimeout(() => {
      setPointsPopups((prev) => prev.filter((p) => p.id !== popupId));
    }, 1000);
    
    setCircles((prev) => prev.filter((c) => c.id !== circle.id));
  };

  const endGame = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
    
    setGameState('finished');
    setCircles([]);

    // Calculer le rang fictif
    const rank = FAKE_VIF_TOP_10.findIndex(p => score > p.score);
    setMyRank(rank === -1 ? (score === 0 ? null : 11) : rank + 1);

    try {
      const { api } = await import('../../utils/api');
      const result = await api.submitScore(token, 'vif', score);
      if (result.success && result.isBestScore) {
        setBestScore(score);
      }
    } catch (error) {
      console.error('Failed to submit score:', error);
    }
  };

  if (gameState === 'countdown') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--kg-bg)' }}>
        <div className="text-9xl font-black animate-pulse" style={{ color: 'var(--kg-primary)' }}>
          {countdown}
        </div>
      </div>
    );
  }

  if (gameState === 'playing') {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--kg-bg)' }}>
        <div className="flex justify-between items-center p-4">
          <div className="flex gap-4 items-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--kg-text)' }}>{score}</p>
            {combo >= 3 && (
              <span className="text-lg font-bold animate-pulse" style={{ color: 'var(--kg-accent)' }}>
                ×3 🔥
              </span>
            )}
          </div>
          <p className="text-2xl font-bold" style={{ color: timeLeft < 10 ? 'var(--kg-error)' : 'var(--kg-text)' }}>
            {timeLeft}s
          </p>
        </div>

        <div
          ref={gameAreaRef}
          className="flex-1 relative overflow-hidden cursor-crosshair"
          style={{ minHeight: '500px' }}
        >
          {circles.map((circle) => (
            <button
              key={circle.id}
              onClick={(e) => handleCircleClick(circle, e)}
              className="absolute rounded-full cursor-pointer transition-transform hover:scale-105 active:scale-95"
              style={{
                left: circle.x,
                top: circle.y,
                width: '100px',
                height: '100px',
                backgroundColor: 'var(--kg-accent)',
                border: '4px solid white',
                boxShadow: '0 4px 20px rgba(184, 115, 51, 0.4)',
              }}
            >
              <div
                className="absolute inset-0 rounded-full border-4 transition-all"
                style={{
                  borderColor: 'white',
                  transform: `scale(${circle.progress / 100})`,
                  opacity: 0.6,
                }}
              />
            </button>
          ))}

          {pointsPopups.map((popup) => (
            <div
              key={popup.id}
              className="absolute pointer-events-none animate-ping font-bold text-2xl"
              style={{
                left: popup.x - 20,
                top: popup.y - 40,
                color: combo >= 3 ? 'var(--kg-accent)' : 'var(--kg-success)',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              +{popup.points}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 overflow-y-auto" style={{ backgroundColor: 'var(--kg-bg)' }}>
      <div className="max-w-2xl mx-auto py-6">
        {/* Header avec score */}
        <div className="text-center mb-6">
          <div className="inline-block p-6 rounded-2xl mb-4" style={{ backgroundColor: 'var(--kg-card)' }}>
            <Zap className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--kg-primary)' }} />
            <div className="text-6xl font-bold mb-2" style={{ color: 'var(--kg-primary)' }}>{score}</div>
            <p className="text-sm" style={{ color: 'var(--kg-text-muted)' }}>points</p>
          </div>
          
          {score > bestScore && score > 0 && (
            <div className="text-lg font-bold mb-2" style={{ color: 'var(--kg-success)' }}>
              🎉 Nouveau record personnel !
            </div>
          )}
          
          {myRank && myRank <= 10 && (
            <div className="text-base font-bold" style={{ color: 'var(--kg-accent)' }}>
              🏆 #{myRank} au classement !
            </div>
          )}
        </div>

        {/* Top 10 VIF */}
        <Card className="p-4 mb-4" style={{ backgroundColor: 'var(--kg-card)', border: '1px solid var(--border)' }}>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--kg-text)' }}>
            <Trophy className="w-5 h-5" style={{ color: 'var(--kg-accent)' }} />
            Top 10 VIF
          </h3>
          <div className="space-y-1">
            {FAKE_VIF_TOP_10.map((entry) => {
              const isMyScore = myRank === entry.rank;
              return (
                <div
                  key={entry.rank}
                  className="flex items-center justify-between p-2 rounded text-sm"
                  style={{
                    backgroundColor: isMyScore ? 'var(--kg-primary)' : entry.rank <= 3 ? 'var(--kg-bg)' : 'transparent',
                    color: isMyScore ? 'white' : 'var(--kg-text)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 font-bold">
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                    </span>
                    <span>{isMyScore ? user.name : entry.name}</span>
                  </div>
                  <span className="font-bold">{isMyScore ? score : entry.score}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            onClick={startCountdown} 
            className="flex-1 text-white font-bold" 
            style={{ backgroundColor: 'var(--kg-accent)' }}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Rejouer
          </Button>
          <Button 
            onClick={onBackToMenu} 
            variant="ghost" 
            className="flex-1" 
            style={{ color: 'var(--kg-text)', border: '1px solid var(--border)' }}
          >
            <Home className="w-4 h-4 mr-2" />
            Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
