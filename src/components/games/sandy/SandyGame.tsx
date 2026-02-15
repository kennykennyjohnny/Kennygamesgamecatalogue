import React, { useEffect, useRef, useState } from 'react';
import { SandyGame } from './lib/game';
import './SandyGame.css';

export default function SandyGameComponent({ gameId, playerId, opponentId, isPlayerTurn, onMove, onGameOver }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const animationRef = useRef(null);
  
  const [message, setMessage] = useState('');
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 800;
    canvas.height = 500;

    const game = new SandyGame({
      gameId,
      playerId,
      canvas,
      onMove: (moveData) => {
        onMove?.(moveData);
      },
      onGameOver: (winner) => {
        onGameOver?.(winner);
      }
    });

    gameRef.current = game;
    setMessage('Swipe to aim and shoot!');

    const animate = () => {
      game.update();
      game.draw();
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleMouseDown = (e) => {
      if (!isPlayerTurn) return;
      const rect = canvas.getBoundingClientRect();
      game.startAim(e.clientX - rect.left, e.clientY - rect.top);
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      game.updateAim(e.clientX - rect.left, e.clientY - rect.top);
    };

    const handleMouseUp = () => {
      if (isPlayerTurn) game.shoot();
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [gameId, playerId, isPlayerTurn]);

  return (
    <div className="sandy-game">
      <h2>🍷 SandyPong</h2>
      <canvas ref={canvasRef} />
    </div>
  );
}
