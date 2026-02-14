import { useState, useEffect, useRef } from 'react';
import { partyApi } from '@/utils/partyApi';
import { PartyGame, GamePlayer, GameState } from '@/utils/gameTypes';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../../ui/card';

interface SandyGameProps {
  game: PartyGame;
  currentUserId: string;
  currentUserName: string;
  onBackToMenu: () => void;
}

interface Cup {
  id: number;
  x: number;
  y: number;
  hit: boolean;
}

interface SandyGameState {
  cupsPlayer1: number[];  // IDs des verres encore debout
  cupsPlayer2: number[];
  currentPlayer: string;
  throwsLeft: number;  // 2 lancers par tour
  ballsBack: boolean;  // Si les 2 bouchons rentrent
  turnNumber: number;
}

export function SandyGame({ game, currentUserId, currentUserName, onBackToMenu }: SandyGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [gameState, setGameState] = useState<SandyGameState | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [swipeStart, setSwipeStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [throwing, setThrowing] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  // Cup positions (pyramide 4-3-2-1)
  const cupFormation = [
    // Row 1 (4 cups)
    { id: 1, x: 150, y: 100 },
    { id: 2, x: 190, y: 100 },
    { id: 3, x: 230, y: 100 },
    { id: 4, x: 270, y: 100 },
    // Row 2 (3 cups)
    { id: 5, x: 170, y: 145 },
    { id: 6, x: 210, y: 145 },
    { id: 7, x: 250, y: 145 },
    // Row 3 (2 cups)
    { id: 8, x: 190, y: 190 },
    { id: 9, x: 230, y: 190 },
    // Row 4 (1 cup)
    { id: 10, x: 210, y: 235 },
  ];

  useEffect(() => {
    loadGame();

    // Subscribe to realtime updates
    const channel = partyApi.subscribeToGame(game.id, () => {
      loadGame();
    });

    return () => {
      channel.unsubscribe();
    };
  }, [game.id]);

  useEffect(() => {
    if (gameState) {
      setIsMyTurn(gameState.currentPlayer === currentUserId);
      drawGame();
    }
  }, [gameState, currentUserId]);

  const loadGame = async () => {
    // Load players
    const playersResult = await partyApi.getGameByCode(game.short_code);
    if (playersResult.success && playersResult.players) {
      setPlayers(playersResult.players);
    }

    // Load game state
    const stateResult = await partyApi.getGameState(game.id);
    if (stateResult.success && stateResult.state) {
      const state = stateResult.state.state as SandyGameState;
      
      // Initialize state if empty
      if (!state.cupsPlayer1) {
        const initialState: SandyGameState = {
          cupsPlayer1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          cupsPlayer2: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          currentPlayer: playersResult.players?.[0]?.user_id || currentUserId,
          throwsLeft: 2,
          ballsBack: false,
          turnNumber: 1,
        };
        await partyApi.updateGameState(game.id, initialState);
        setGameState(initialState);
      } else {
        setGameState(state);
        
        // Check for winner
        if (state.cupsPlayer1.length === 0) {
          setWinner(playersResult.players?.[1]?.user_name || 'Joueur 2');
        } else if (state.cupsPlayer2.length === 0) {
          setWinner(playersResult.players?.[0]?.user_name || 'Joueur 1');
        }
      }
    }
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#F5DEB3'; // Beige sable
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw table
    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Determine which cups to draw based on current player
    const isPlayer1 = players[0]?.user_id === currentUserId;
    const myCups = isPlayer1 ? gameState.cupsPlayer1 : gameState.cupsPlayer2;
    const opponentCups = isPlayer1 ? gameState.cupsPlayer2 : gameState.cupsPlayer1;

    // Draw opponent cups (top, facing me)
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height * 0.25);
    opponentCups.forEach(cupId => {
      const cup = cupFormation.find(c => c.id === cupId);
      if (!cup) return;
      
      // Rosé cup
      ctx.fillStyle = '#ffc0cb';
      ctx.strokeStyle = '#ff1493';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.arc(cup.x - 210, cup.y - 145, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();

    // Draw my cups (bottom)
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height * 0.75);
    ctx.scale(1, -1); // Flip for perspective
    myCups.forEach(cupId => {
      const cup = cupFormation.find(c => c.id === cupId);
      if (!cup) return;
      
      ctx.fillStyle = '#ffc0cb';
      ctx.strokeStyle = '#ff1493';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.arc(cup.x - 210, cup.y - 145, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();

    // Draw throw zone if my turn
    if (isMyTurn && !throwing) {
      ctx.fillStyle = 'rgba(255, 20, 147, 0.1)';
      ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
      ctx.fillStyle = '#ff1493';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Swipe vers le haut pour lancer! 🍷', canvas.width / 2, canvas.height - 40);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMyTurn || throwing) return;
    
    const touch = e.touches[0];
    setSwipeStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    });
  };

  const handleTouchEnd = async (e: React.TouchEvent) => {
    if (!swipeStart || !isMyTurn || throwing || !gameState) return;
    
    const touch = e.changedTouches[0];
    const deltaY = swipeStart.y - touch.clientY;
    const deltaX = Math.abs(swipeStart.x - touch.clientX);
    const deltaTime = Date.now() - swipeStart.time;
    
    // Detect upward swipe
    if (deltaY > 50 && deltaX < 50 && deltaTime < 500) {
      setThrowing(true);
      setSwipeStart(null);
      
      // Simulate throw (30% hit chance for MVP)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const hit = Math.random() < 0.3;
      
      if (hit) {
        // Remove a random opponent cup
        const isPlayer1 = players[0]?.user_id === currentUserId;
        const opponentCups = isPlayer1 ? gameState.cupsPlayer2 : gameState.cupsPlayer1;
        
        if (opponentCups.length > 0) {
          const randomIndex = Math.floor(Math.random() * opponentCups.length);
          const newOpponentCups = opponentCups.filter((_, i) => i !== randomIndex);
          
          const newState = {
            ...gameState,
            ...(isPlayer1 
              ? { cupsPlayer2: newOpponentCups }
              : { cupsPlayer1: newOpponentCups }
            ),
            throwsLeft: gameState.throwsLeft - 1,
          };
          
          // Check if turn should change
          if (newState.throwsLeft === 0) {
            const nextPlayer = players.find(p => p.user_id !== currentUserId);
            if (nextPlayer) {
              newState.currentPlayer = nextPlayer.user_id;
              newState.throwsLeft = 2;
              newState.turnNumber += 1;
            }
          }
          
          await partyApi.updateGameState(game.id, newState, newState.currentPlayer);
          setGameState(newState);
        }
      } else {
        // Miss
        const newState = {
          ...gameState,
          throwsLeft: gameState.throwsLeft - 1,
        };
        
        if (newState.throwsLeft === 0) {
          const nextPlayer = players.find(p => p.user_id !== currentUserId);
          if (nextPlayer) {
            newState.currentPlayer = nextPlayer.user_id;
            newState.throwsLeft = 2;
            newState.turnNumber += 1;
          }
        }
        
        await partyApi.updateGameState(game.id, newState, newState.currentPlayer);
        setGameState(newState);
      }
      
      setThrowing(false);
    }
    
    setSwipeStart(null);
  };

  if (winner) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--kg-bg)' }}>
        <Card className="max-w-md w-full p-8 text-center" style={{ backgroundColor: 'var(--kg-card)' }}>
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-4xl font-black mb-2" style={{ color: 'var(--kg-primary)' }}>
            {winner} gagne !
          </h1>
          <p className="text-lg mb-6" style={{ color: 'var(--kg-text-muted)' }}>
            Bravo ! 🍷
          </p>
          <button
            onClick={onBackToMenu}
            className="w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
            style={{ backgroundColor: 'var(--kg-primary)' }}
          >
            Retour au menu
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--kg-bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4" style={{ borderBottom: '2px solid var(--border)' }}>
        <button
          onClick={onBackToMenu}
          className="p-2 rounded-lg hover:bg-black/5 transition-colors"
          style={{ color: 'var(--kg-text)' }}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center flex-1">
          <h1 className="text-xl font-black" style={{ color: 'var(--kg-text)' }}>
            🍷 SANDYGAMES
          </h1>
          <p className="text-sm" style={{ color: 'var(--kg-text-muted)' }}>
            Tour {gameState?.turnNumber || 1}
          </p>
        </div>
        <div className="w-10" />
      </div>

      {/* Game Canvas */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          className="border-2 rounded-xl shadow-lg touch-none"
          style={{ borderColor: 'var(--kg-primary)', maxWidth: '100%' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />
      </div>

      {/* Status Bar */}
      <div className="p-4" style={{ backgroundColor: 'var(--kg-card)', borderTop: '2px solid var(--border)' }}>
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-2 gap-4 mb-4">
            {players.map((player, idx) => {
              const isMe = player.user_id === currentUserId;
              const isPlayer1 = idx === 0;
              const cupsLeft = gameState 
                ? (isPlayer1 ? gameState.cupsPlayer1.length : gameState.cupsPlayer2.length)
                : 10;
              
              return (
                <div
                  key={player.id}
                  className="p-3 rounded-lg"
                  style={{
                    backgroundColor: isMe ? 'var(--kg-primary)' : 'var(--kg-bg)',
                    color: isMe ? 'white' : 'var(--kg-text)',
                  }}
                >
                  <p className="font-bold truncate">{player.user_name}</p>
                  <p className="text-2xl font-black">{cupsLeft} verres</p>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            {isMyTurn ? (
              <>
                <p className="text-lg font-bold" style={{ color: 'var(--kg-success)' }}>
                  🎯 C'est ton tour !
                </p>
                <p className="text-sm" style={{ color: 'var(--kg-text-muted)' }}>
                  Lancers restants : {gameState?.throwsLeft || 2}
                </p>
              </>
            ) : (
              <p className="text-lg font-bold" style={{ color: 'var(--kg-text-muted)' }}>
                En attente de {players.find(p => p.user_id === gameState?.currentPlayer)?.user_name}...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
