import { useState, useEffect, useRef } from 'react';
import { Home, RotateCcw, Zap, Trophy } from 'lucide-react';

interface VifGameProps {
  user: any;
  token: string;
  onBackToMenu: () => void;
}

interface Target {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  spawnTime: number;
}

interface PointsPopup {
  id: number;
  x: number;
  y: number;
  points: number;
}

const COLORS = ['#007AFF', '#FF3B30', '#34C759', '#FF9500', '#AF52DE', '#5AC8FA', '#FF2D55', '#FFCC00'];

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
  const [targets, setTargets] = useState<Target[]>([]);
  const [combo, setCombo] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [pointsPopups, setPointsPopups] = useState<PointsPopup[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
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
    setTargets([]);
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

    spawnTarget();
    spawnRef.current = setInterval(spawnTarget, 1000);
  };

  const spawnTarget = () => {
    if (!gameAreaRef.current) return;
    const area = gameAreaRef.current.getBoundingClientRect();
    const size = 50 + Math.random() * 40;
    const padding = 20;
    
    const newTarget: Target = {
      id: nextId.current++,
      x: Math.random() * (area.width - size - padding * 2) + padding,
      y: Math.random() * (area.height - size - padding * 2) + padding,
      size,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      spawnTime: Date.now(),
    };
    
    setTargets((prev) => [...prev, newTarget]);

    setTimeout(() => {
      setTargets((prev) => prev.filter((t) => t.id !== newTarget.id));
      setCombo(0);
    }, 2200);
  };

  const handleTargetClick = (target: Target, e: React.MouseEvent) => {
    e.stopPropagation();
    const elapsed = Date.now() - target.spawnTime;
    const speedBonus = elapsed < 500 ? 20 : elapsed < 1000 ? 15 : 10;
    const sizeBonus = target.size < 60 ? 5 : 0;
    const comboMult = combo >= 3 ? 3 : combo >= 1 ? 2 : 1;
    const finalPoints = (speedBonus + sizeBonus) * comboMult;
    
    setScore((prev) => prev + finalPoints);
    setCombo((prev) => prev + 1);
    
    const popupId = Date.now() + Math.random();
    setPointsPopups((prev) => [...prev, {
      id: popupId,
      x: e.clientX - (gameAreaRef.current?.getBoundingClientRect().left || 0),
      y: e.clientY - (gameAreaRef.current?.getBoundingClientRect().top || 0),
      points: finalPoints,
    }]);
    setTimeout(() => {
      setPointsPopups((prev) => prev.filter((p) => p.id !== popupId));
    }, 800);
    
    setTargets((prev) => prev.filter((t) => t.id !== target.id));
  };

  const endGame = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
    setGameState('finished');
    setTargets([]);

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

  const timerPct = (timeLeft / 30) * 100;
  const font = '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';

  // ── COUNTDOWN ──
  if (gameState === 'countdown') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(180deg, #1c1c1e 0%, #2c2c2e 100%)',
        fontFamily: font,
      }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#8e8e93', marginBottom: 16, letterSpacing: 1 }}>
          VIF ⚡
        </div>
        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          background: 'linear-gradient(135deg, #FF9500, #FFCC00)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(255,149,0,0.4)',
          animation: 'vifPulse 1s ease-in-out infinite',
        }}>
          <span style={{ fontSize: 56, fontWeight: 900, color: '#fff' }}>{countdown}</span>
        </div>
        <div style={{ color: '#636366', fontSize: 14, marginTop: 20 }}>Tape les cibles !</div>
        <style>{`@keyframes vifPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }`}</style>
      </div>
    );
  }

  // ── PLAYING ──
  if (gameState === 'playing') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(180deg, #1c1c1e 0%, #2c2c2e 100%)',
        fontFamily: font,
      }}>
        {/* Top bar */}
        <div style={{ padding: '16px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 28, fontWeight: 800,
              background: 'linear-gradient(135deg, #FF9500, #FFCC00)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>{score}</span>
            {combo >= 3 && (
              <span style={{
                fontSize: 13, fontWeight: 700, color: '#FF2D55',
                background: 'rgba(255,45,85,0.15)', padding: '2px 8px', borderRadius: 10,
              }}>🔥 x{combo}</span>
            )}
          </div>
          <span style={{
            fontSize: 22, fontWeight: 700,
            color: timeLeft <= 5 ? '#FF3B30' : timeLeft <= 10 ? '#FF9500' : '#fff',
          }}>{timeLeft}s</span>
        </div>

        {/* Timer bar */}
        <div style={{ padding: '0 20px', marginBottom: 4 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2, transition: 'width 1s linear',
              width: `${timerPct}%`,
              background: timerPct <= 17 ? '#FF3B30' : timerPct <= 33 ? '#FF9500' : 'linear-gradient(90deg, #FF9500, #FFCC00)',
            }} />
          </div>
        </div>

        {/* Game area */}
        <div
          ref={gameAreaRef}
          style={{
            flex: 1, position: 'relative', overflow: 'hidden', cursor: 'crosshair',
            minHeight: 500, margin: '0 8px 8px', borderRadius: 16,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Grid pattern */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.03, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />

          {targets.map((target) => (
            <button
              key={target.id}
              onClick={(e) => handleTargetClick(target, e)}
              style={{
                position: 'absolute', left: target.x, top: target.y,
                width: target.size, height: target.size,
                borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: `radial-gradient(circle at 35% 35%, ${target.color}dd, ${target.color})`,
                boxShadow: `0 4px 20px ${target.color}66, inset 0 2px 6px rgba(255,255,255,0.3)`,
                transition: 'transform 0.1s',
                animation: 'targetAppear 0.2s ease-out',
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = 'scale(1.1)'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
            >
              {/* Inner ring */}
              <div style={{
                position: 'absolute', inset: '20%',
                borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)',
              }} />
              {/* Center dot */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                width: 6, height: 6, borderRadius: '50%',
                background: '#fff', transform: 'translate(-50%,-50%)',
              }} />
            </button>
          ))}

          {pointsPopups.map((popup) => (
            <div
              key={popup.id}
              style={{
                position: 'absolute', left: popup.x - 15, top: popup.y - 30,
                pointerEvents: 'none', fontSize: 20, fontWeight: 800,
                color: combo >= 3 ? '#FF2D55' : '#34C759',
                textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                animation: 'popupFloat 0.8s ease-out forwards',
              }}
            >
              +{popup.points}
            </div>
          ))}
        </div>

        <style>{`
          @keyframes targetAppear { from { transform: scale(0); opacity:0; } to { transform: scale(1); opacity:1; } }
          @keyframes popupFloat { 0% { transform:translateY(0);opacity:1; } 100% { transform:translateY(-40px);opacity:0; } }
        `}</style>
      </div>
    );
  }

  // ── FINISHED ──
  return (
    <div style={{
      minHeight: '100vh', padding: 20, overflowY: 'auto',
      background: 'linear-gradient(180deg, #1c1c1e 0%, #2c2c2e 100%)',
      fontFamily: font,
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto', paddingTop: 24 }}>
        {/* Score card */}
        <div style={{
          textAlign: 'center', marginBottom: 24, padding: '32px 20px', borderRadius: 24,
          background: 'linear-gradient(135deg, rgba(255,149,0,0.12), rgba(255,204,0,0.12))',
          border: '1px solid rgba(255,149,0,0.2)',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #FF9500, #FFCC00)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(255,149,0,0.3)',
          }}>
            <Zap style={{ width: 32, height: 32, color: '#fff' }} />
          </div>
          <div style={{
            fontSize: 56, fontWeight: 900, lineHeight: 1,
            background: 'linear-gradient(135deg, #FF9500, #FFCC00)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>{score}</div>
          <div style={{ color: '#8e8e93', fontSize: 14, marginTop: 4 }}>points</div>
          
          {score > bestScore && score > 0 && (
            <div style={{
              marginTop: 12, padding: '6px 16px', borderRadius: 12, display: 'inline-block',
              background: 'rgba(52,199,89,0.15)', color: '#34C759', fontSize: 14, fontWeight: 600,
            }}>🎉 Nouveau record !</div>
          )}
          {myRank && myRank <= 10 && (
            <div style={{ marginTop: 8, color: '#FFCC00', fontSize: 14, fontWeight: 600 }}>
              🏆 #{myRank} au classement
            </div>
          )}
        </div>

        {/* Top 10 */}
        <div style={{
          background: 'rgba(255,255,255,0.06)', borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)', padding: 16, marginBottom: 16,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
            color: '#e5e5ea', fontSize: 16, fontWeight: 700,
          }}>
            <Trophy style={{ width: 18, height: 18, color: '#FFCC00' }} />
            Top 10 VIF
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {FAKE_VIF_TOP_10.map((entry) => {
              const isMyScore = myRank === entry.rank;
              return (
                <div
                  key={entry.rank}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: 10, fontSize: 14,
                    background: isMyScore ? 'linear-gradient(135deg, #FF9500, #FFCC00)' : entry.rank <= 3 ? 'rgba(255,255,255,0.04)' : 'transparent',
                    color: isMyScore ? '#fff' : '#e5e5ea',
                    fontWeight: isMyScore ? 700 : 400,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 24, fontWeight: 700, fontSize: 13 }}>
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                    </span>
                    <span>{isMyScore ? user.name : entry.name}</span>
                  </div>
                  <span style={{ fontWeight: 700 }}>{isMyScore ? score : entry.score}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={startCountdown}
            style={{
              flex: 1, padding: '14px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #FF9500, #FFCC00)',
              color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: font,
              boxShadow: '0 4px 16px rgba(255,149,0,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <RotateCcw style={{ width: 18, height: 18 }} /> Rejouer
          </button>
          <button
            onClick={onBackToMenu}
            style={{
              flex: 1, padding: '14px 0', borderRadius: 14, cursor: 'pointer',
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#e5e5ea', fontSize: 16, fontWeight: 600, fontFamily: font,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Home style={{ width: 18, height: 18 }} /> Menu
          </button>
        </div>
      </div>
    </div>
  );
}
