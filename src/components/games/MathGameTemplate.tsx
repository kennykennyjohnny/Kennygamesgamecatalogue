import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Home, RotateCcw, LucideIcon, Trophy } from 'lucide-react';

interface MathGameTemplateProps {
  user: any;
  token: string;
  onBackToMenu: () => void;
  gameId: string;
  gameName: string;
  gameDesc: string;
  Icon: LucideIcon;
  generateQuestion: (score: number) => { a: number; b: number; op: string; answer: number };
}

const FAKE_GAME_TOP_10 = [
  { rank: 1, name: 'MathPro', score: 42 },
  { rank: 2, name: 'CalcKing', score: 38 },
  { rank: 3, name: 'SpeedyCalc', score: 35 },
  { rank: 4, name: 'NumMaster', score: 32 },
  { rank: 5, name: 'QuickBrain', score: 28 },
  { rank: 6, name: 'FastThink', score: 25 },
  { rank: 7, name: 'MindRunner', score: 22 },
  { rank: 8, name: 'CalcWiz', score: 20 },
  { rank: 9, name: 'NumberNinja', score: 18 },
  { rank: 10, name: 'BrainSpeed', score: 15 },
];

// GamePigeon-style color palette per operation
const OP_THEMES: Record<string, { bg: string; accent: string; light: string }> = {
  '+': { bg: '#007AFF', accent: '#5AC8FA', light: '#E8F4FD' },
  '−': { bg: '#FF9500', accent: '#FFCC00', light: '#FFF8E8' },
  '×': { bg: '#FF3B30', accent: '#FF6961', light: '#FDE8E8' },
  '÷': { bg: '#AF52DE', accent: '#DA70D6', light: '#F3E8FD' },
  'mix': { bg: '#34C759', accent: '#30D158', light: '#E8FDE8' },
};

function getOpTheme(op: string) {
  return OP_THEMES[op] || OP_THEMES['mix'];
}

export function MathGameTemplate({ 
  user, 
  token, 
  onBackToMenu,
  gameId,
  gameName,
  gameDesc,
  Icon,
  generateQuestion: genQ,
}: MathGameTemplateProps) {
  const [gameState, setGameState] = useState<'countdown' | 'playing' | 'finished'>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [currentQuestion, setCurrentQuestion] = useState({ a: 0, b: 0, op: '', answer: 0 });
  const [choices, setChoices] = useState<number[]>([]);
  const [bestScore, setBestScore] = useState(0);
  const [feedback, setFeedback] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [shakeWrong, setShakeWrong] = useState(false);
  const [myRank, setMyRank] = useState<number | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadBestScore();
    startCountdown();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadBestScore = async () => {
    try {
      const { api } = await import('../../utils/api');
      const result = await api.getUserStats(token);
      if (result.success && result.stats.gameScores?.[gameId]) {
        setBestScore(result.stats.gameScores[gameId].bestScore);
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

  const generateChoices = (answer: number, max: number) => {
    const wrongAnswers = new Set<number>();
    while (wrongAnswers.size < 7) {
      let wrong: number;
      const type = Math.random();
      if (type < 0.4) {
        wrong = answer + (Math.floor(Math.random() * 10) - 5);
      } else if (type < 0.7) {
        wrong = answer + (Math.floor(Math.random() * 40) - 20);
      } else {
        wrong = Math.floor(Math.random() * (max * 2)) + 1;
      }
      
      if (wrong !== answer && wrong >= 0 && wrong < 500) {
        wrongAnswers.add(wrong);
      }
    }
    
    const allChoices = [answer, ...Array.from(wrongAnswers)];
    allChoices.sort(() => Math.random() - 0.5);
    return allChoices;
  };

  const generateNewQuestion = () => {
    const q = genQ(score);
    const max = Math.min(20 + Math.floor(score / 5), 100);
    const choices = generateChoices(q.answer, max);
    
    setCurrentQuestion(q);
    setChoices(choices);
    setFeedback(null);
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(30);
    setStreak(0);
    generateNewQuestion();
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleChoice = (choice: number) => {
    if (feedback !== null) return;
    if (choice === currentQuestion.answer) {
      setScore((prev) => prev + 1);
      setStreak((prev) => prev + 1);
      setFeedback(choice);
      setTimeout(() => generateNewQuestion(), 350);
    } else {
      setFeedback(choice);
      setStreak(0);
      setShakeWrong(true);
      setTimeout(() => { setFeedback(null); setShakeWrong(false); }, 500);
    }
  };

  const endGame = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState('finished');

    const rank = FAKE_GAME_TOP_10.findIndex(p => score > p.score);
    setMyRank(rank === -1 ? (score === 0 ? null : 11) : rank + 1);

    try {
      const { api } = await import('../../utils/api');
      const result = await api.submitScore(token, gameId, score);
      if (result.success && result.isBestScore) {
        setBestScore(score);
      }
    } catch (error) {
      console.error('Failed to submit score:', error);
    }
  };

  const theme = getOpTheme(gameId === 'mix' ? 'mix' : currentQuestion.op || '+');
  const timerPct = (timeLeft / 30) * 100;

  // ── COUNTDOWN ──
  if (gameState === 'countdown') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(180deg, #1c1c1e 0%, #2c2c2e 100%)',
      }}>
        <div style={{
          fontSize: 18, fontWeight: 600, color: '#8e8e93',
          marginBottom: 16, letterSpacing: 1, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        }}>{gameName}</div>
        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          background: `linear-gradient(135deg, ${theme.bg}, ${theme.accent})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 8px 32px ${theme.bg}66`,
          animation: 'pulse 1s ease-in-out infinite',
        }}>
          <span style={{ fontSize: 56, fontWeight: 900, color: '#fff', fontFamily: '-apple-system, sans-serif' }}>
            {countdown}
          </span>
        </div>
        <div style={{ color: '#636366', fontSize: 14, marginTop: 20, fontFamily: '-apple-system, sans-serif' }}>
          Prépare-toi...
        </div>
        <style>{`@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }`}</style>
      </div>
    );
  }

  // ── PLAYING ──
  if (gameState === 'playing') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(180deg, #1c1c1e 0%, #2c2c2e 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      }}>
        {/* Top bar */}
        <div style={{ padding: '16px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 28, fontWeight: 800, color: '#fff',
              background: `linear-gradient(135deg, ${theme.bg}, ${theme.accent})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>{score}</span>
            {streak >= 3 && (
              <span style={{
                fontSize: 13, fontWeight: 700, color: '#FFCC00',
                background: 'rgba(255,204,0,0.15)', padding: '2px 8px', borderRadius: 10,
              }}>🔥 x{streak}</span>
            )}
          </div>
          <div style={{
            fontSize: 22, fontWeight: 700,
            color: timeLeft <= 5 ? '#FF3B30' : timeLeft <= 10 ? '#FF9500' : '#fff',
            transition: 'color 0.3s',
          }}>
            {timeLeft}s
          </div>
        </div>

        {/* Timer bar */}
        <div style={{ padding: '0 20px', marginBottom: 12 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2, transition: 'width 1s linear, background-color 0.3s',
              width: `${timerPct}%`,
              background: timerPct <= 17 ? '#FF3B30' : timerPct <= 33 ? '#FF9500' : `linear-gradient(90deg, ${theme.bg}, ${theme.accent})`,
            }} />
          </div>
        </div>

        {/* Question */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '0 16px', gap: 24,
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '24px 32px',
            backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.08)',
            animation: shakeWrong ? 'shake 0.4s ease-in-out' : undefined,
          }}>
            <div style={{
              fontSize: 48, fontWeight: 800, color: '#fff', textAlign: 'center',
              letterSpacing: 4,
            }}>
              {currentQuestion.a}
              <span style={{ color: theme.accent, margin: '0 12px' }}>{currentQuestion.op}</span>
              {currentQuestion.b}
            </div>
          </div>

          {/* Answer grid – iMessage bubble style */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
            width: '100%', maxWidth: 420, padding: '0 4px',
          }}>
            {choices.map((choice) => {
              const isCorrectFeedback = feedback === choice && choice === currentQuestion.answer;
              const isWrongFeedback = feedback === choice && choice !== currentQuestion.answer;
              return (
                <button
                  key={choice}
                  onClick={() => handleChoice(choice)}
                  style={{
                    padding: '14px 8px', borderRadius: 16, fontSize: 18, fontWeight: 700,
                    border: 'none', cursor: 'pointer',
                    fontFamily: '-apple-system, sans-serif',
                    transition: 'all 0.15s ease',
                    transform: isCorrectFeedback ? 'scale(1.08)' : isWrongFeedback ? 'scale(0.92)' : undefined,
                    background: isCorrectFeedback
                      ? '#34C759'
                      : isWrongFeedback
                        ? '#FF3B30'
                        : 'rgba(255,255,255,0.1)',
                    color: (isCorrectFeedback || isWrongFeedback) ? '#fff' : '#e5e5ea',
                    boxShadow: isCorrectFeedback
                      ? '0 4px 16px rgba(52,199,89,0.4)'
                      : isWrongFeedback
                        ? '0 4px 16px rgba(255,59,48,0.4)'
                        : '0 2px 8px rgba(0,0,0,0.2)',
                  }}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        </div>

        <style>{`
          @keyframes shake { 0%,100% { transform:translateX(0); } 25% { transform:translateX(-8px); } 75% { transform:translateX(8px); } }
        `}</style>
      </div>
    );
  }

  // ── FINISHED ──
  return (
    <div style={{
      minHeight: '100vh', padding: 20, overflowY: 'auto',
      background: 'linear-gradient(180deg, #1c1c1e 0%, #2c2c2e 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto', paddingTop: 24 }}>
        {/* Score card */}
        <div style={{
          textAlign: 'center', marginBottom: 24, padding: '32px 20px', borderRadius: 24,
          background: `linear-gradient(135deg, ${theme.bg}22, ${theme.accent}22)`,
          border: `1px solid ${theme.bg}33`,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, margin: '0 auto 12px',
            background: `linear-gradient(135deg, ${theme.bg}, ${theme.accent})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 8px 24px ${theme.bg}44`,
          }}>
            <Icon style={{ width: 32, height: 32, color: '#fff' }} />
          </div>
          <div style={{
            fontSize: 56, fontWeight: 900, lineHeight: 1,
            background: `linear-gradient(135deg, ${theme.bg}, ${theme.accent})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>{score}</div>
          <div style={{ color: '#8e8e93', fontSize: 14, marginTop: 4 }}>bonnes réponses</div>
          
          {score > bestScore && score > 0 && (
            <div style={{
              marginTop: 12, padding: '6px 16px', borderRadius: 12, display: 'inline-block',
              background: 'rgba(52,199,89,0.15)', color: '#34C759', fontSize: 14, fontWeight: 600,
            }}>🎉 Nouveau record !</div>
          )}
          {myRank && myRank <= 10 && (
            <div style={{
              marginTop: 8, color: '#FFCC00', fontSize: 14, fontWeight: 600,
            }}>🏆 #{myRank} au classement</div>
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
            Top 10 {gameName}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {FAKE_GAME_TOP_10.map((entry) => {
              const isMyScore = myRank === entry.rank;
              return (
                <div
                  key={entry.rank}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: 10, fontSize: 14,
                    background: isMyScore ? `linear-gradient(135deg, ${theme.bg}, ${theme.accent})` : entry.rank <= 3 ? 'rgba(255,255,255,0.04)' : 'transparent',
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
              background: `linear-gradient(135deg, ${theme.bg}, ${theme.accent})`,
              color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: '-apple-system, sans-serif',
              boxShadow: `0 4px 16px ${theme.bg}44`,
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
              color: '#e5e5ea', fontSize: 16, fontWeight: 600, fontFamily: '-apple-system, sans-serif',
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