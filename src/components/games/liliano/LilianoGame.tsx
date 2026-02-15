import React, { useEffect, useRef, useState } from 'react';
import { LilianoGame } from './lib/game';
import './LilianoGame.css';

export default function LilianoGameComponent({ gameId, playerId, opponentId, isPlayerTurn, onMove, onGameOver }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const animationRef = useRef(null);
  
  const [angle, setAngle] = useState(45);
  const [power, setPower] = useState(50);
  const [player1HP, setPlayer1HP] = useState(100);
  const [player2HP, setPlayer2HP] = useState(100);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 800;
    canvas.height = 500;

    const game = new LilianoGame({
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

    const animate = () => {
      game.update();
      game.draw();
      
      const player = game.currentPlayer === 'player1' ? game.player1 : game.player2;
      setAngle(player.angle);
      setPower(player.power);
      setPlayer1HP(game.player1.hp);
      setPlayer2HP(game.player2.hp);
      
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleKeyDown = (e) => {
      if (!isPlayerTurn) return;
      
      switch(e.key) {
        case 'ArrowLeft':
          game.adjustAngle(-game.angleStep);
          break;
        case 'ArrowRight':
          game.adjustAngle(game.angleStep);
          break;
        case 'ArrowUp':
          game.adjustPower(game.powerStep);
          break;
        case 'ArrowDown':
          game.adjustPower(-game.powerStep);
          break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          game.fire();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameId, playerId, isPlayerTurn]);

  const handleFire = () => {
    if (gameRef.current && isPlayerTurn) {
      gameRef.current.fire();
    }
  };

  const handleAngleChange = (e) => {
    if (gameRef.current && isPlayerTurn) {
      const player = gameRef.current.currentPlayer === 'player1' ? gameRef.current.player1 : gameRef.current.player2;
      player.angle = parseInt(e.target.value);
    }
  };

  const handlePowerChange = (e) => {
    if (gameRef.current && isPlayerTurn) {
      const player = gameRef.current.currentPlayer === 'player1' ? gameRef.current.player1 : gameRef.current.player2;
      player.power = parseInt(e.target.value);
    }
  };

  return (
    <div className="liliano-game">
      <div className="liliano-header">
        <h2>⚡ LilianoThunder - Guitar Tanks</h2>
      </div>

      <canvas ref={canvasRef} />

      {isPlayerTurn && (
        <div className="controls">
          <div className="control-group">
            <label>Angle: {angle}°</label>
            <input 
              type="range" 
              min="0" 
              max="180" 
              value={angle}
              onChange={handleAngleChange}
            />
          </div>
          
          <div className="control-group">
            <label>Power: {power}%</label>
            <input 
              type="range" 
              min="10" 
              max="100" 
              value={power}
              onChange={handlePowerChange}
            />
          </div>
          
          <button className="fire-btn" onClick={handleFire}>
            🔥 FIRE!
          </button>
        </div>
      )}

      <div className="instructions">
        <p>💡 <strong>Controls:</strong> Arrow keys to adjust angle/power, SPACE or FIRE button to shoot!</p>
      </div>
    </div>
  );
}
