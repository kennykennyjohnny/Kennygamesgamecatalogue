import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Home, RotateCcw, LucideIcon, Trophy, Medal } from 'lucide-react';

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

// Données fictives pour le top 10 du jeu
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
    if (choice === currentQuestion.answer) {
      setScore((prev) => prev + 1);
      setFeedback(choice);
      setTimeout(() => generateNewQuestion(), 400);
    } else {
      setFeedback(choice);
      setTimeout(() => setFeedback(null), 600);
    }
  };

  const endGame = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState('finished');

    // Calculer le rang fictif
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
      <div className="min-h-screen flex flex-col p-4" style={{ backgroundColor: 'var(--kg-bg)' }}>
        <div className="flex justify-between items-center mb-6">
          <p className="text-2xl font-bold" style={{ color: 'var(--kg-text)' }}>{score}</p>
          <p className="text-2xl font-bold" style={{ color: timeLeft < 10 ? 'var(--kg-error)' : 'var(--kg-text)' }}>{timeLeft}s</p>
        </div>

        <div className="flex-1 flex items-center justify-center overflow-y-auto">
          <div className="w-full max-w-lg px-2">
            <div className="text-5xl md:text-6xl font-bold text-center mb-6" style={{ color: 'var(--kg-text)' }}>
              {currentQuestion.a} {currentQuestion.op} {currentQuestion.b}
            </div>

            <div className="grid grid-cols-4 gap-2">
              {choices.map((choice) => (
                <button
                  key={choice}
                  onClick={() => handleChoice(choice)}
                  className={`p-3 md:p-4 rounded-lg text-base md:text-lg font-bold transition-all ${
                    feedback === choice
                      ? choice === currentQuestion.answer
                        ? 'scale-105'
                        : 'opacity-50 scale-95'
                      : 'hover:scale-105 active:scale-95'
                  }`}
                  style={{
                    backgroundColor: feedback === choice
                      ? choice === currentQuestion.answer
                        ? 'var(--kg-success)'
                        : 'var(--kg-error)'
                      : 'var(--kg-card)',
                    color: 'var(--kg-text)',
                    border: '2px solid var(--border)',
                  }}
                >
                  {choice}
                </button>
              ))}
            </div>
            
            <p className="text-center mt-4 text-xs" style={{ color: 'var(--kg-text-muted)' }}>
              Cherche bien parmi les 8 choix !
            </p>
          </div>
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
            <Icon className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--kg-primary)' }} />
            <div className="text-6xl font-bold mb-2" style={{ color: 'var(--kg-primary)' }}>{score}</div>
            <p className="text-sm" style={{ color: 'var(--kg-text-muted)' }}>bonnes réponses</p>
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

        {/* Top 10 du jeu */}
        <Card className="p-4 mb-4" style={{ backgroundColor: 'var(--kg-card)', border: '1px solid var(--border)' }}>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--kg-text)' }}>
            <Trophy className="w-5 h-5" style={{ color: 'var(--kg-accent)' }} />
            Top 10 {gameName}
          </h3>
          <div className="space-y-1">
            {FAKE_GAME_TOP_10.map((entry) => {
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