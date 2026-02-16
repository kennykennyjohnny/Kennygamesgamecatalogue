import React, { useEffect, useRef, useState } from 'react';
import { NourarcheryGame as NourarcheryGameEngine } from './lib/game';
import './NourarcheryGame.css';

export default function NourarcheryGame({ gameId, playerId, opponentId, isPlayerTurn, onMove, onGameOver }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const animationRef = useRef(null);
  
  const [round, setRound] = useState(1);
  const [scores, setScores] = useState([]);
  const [wind, setWind] = useState({ speed: 0, direction: 'right' });
  const [phase, setPhase] = useState('aiming');
  const [message, setMessage] = useState('');
  const [lastScore, setLastScore] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 800;
    canvas.height = 400;

    const game = new NourarcheryGameEngine({
      gameId,
      playerId,
      canvas,
      onMove: (moveData) => {
        onMove?.(moveData);
      },
      onRoundEnd: ({ round, score, scores: newScores }) => {
        setLastScore(score);
        setScores(newScores);
        setMessage(`Round ${round}: ${score} points! Click NEXT ROUND to continue.`);
        setPhase('result');
      },
      onGameOver: ({ scores: finalScores, total }) => {
        setScores(finalScores);
        setPhase('gameover');
        setMessage(`Game Over! Total: ${total} points`);
        onGameOver?.({ scores: finalScores, total });
      }
    });

    gameRef.current = game;
    setWind(game.wind);
    setMessage('Aim with mouse, click and hold to power, release to shoot!');

    // Game loop
    const animate = () => {
      game.update();
      game.draw();
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Mouse controls
    const handleMouseMove = (e) => {
      if (game.phase === 'aiming' && !game.arrowInFlight) {
        game.setAimAngle(e.clientY);
      }
    };

    const handleMouseDown = () => {
      if (game.phase === 'aiming' && isPlayerTurn) {
        game.startPull();
      }
    };

    const handleMouseUp = () => {
      if (game.isPulling && isPlayerTurn) {
        game.release();
        
        onMove?.({
          type: 'shoot',
          power: game.aimPower,
          angle: game.aimAngle,
          wind: game.wind
        });
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);

    // Touch controls
    const handleTouchStart = (e) => {
      e.preventDefault();
      if (game.phase === 'aiming' && isPlayerTurn) {
        const touch = e.touches[0];
        game.setAimAngle(touch.clientY);
        game.startPull();
      }
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      if (game.phase === 'aiming') {
        const touch = e.touches[0];
        game.setAimAngle(touch.clientY);
      }
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      if (game.isPulling && isPlayerTurn) {
        game.release();
        
        onMove?.({
          type: 'shoot',
          power: game.aimPower,
          angle: game.aimAngle,
          wind: game.wind
        });
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameId, playerId, isPlayerTurn]);

  const handleNextRound = () => {
    if (!gameRef.current) return;
    
    gameRef.current.nextRound();
    setRound(gameRef.current.round);
    setWind(gameRef.current.wind);
    setPhase('aiming');
    setMessage(`Round ${gameRef.current.round} - Wind: ${wind.speed > 0 ? '→' : '←'} ${Math.abs(wind.speed).toFixed(1)}`);
    setLastScore(null);
  };

  return (
    <div className="nourarchery-game">
      <div className="nourarchery-header">
        <h2>🎯 NourArchery - Cyber Archery</h2>
        
        <div className="game-info">
          <div className="info-item">
            <span className="label">Round:</span>
            <span className="value">{round}/3</span>
          </div>
          
          <div className="info-item wind-display">
            <span className="label">Wind:</span>
            <span className="value cyber-text">
              {wind.speed > 0 ? '→' : '←'} {Math.abs(wind.speed).toFixed(1)}
            </span>
          </div>
          
          <div className="info-item">
            <span className="label">Scores:</span>
            <span className="value">{scores.join(' - ') || 'None yet'}</span>
          </div>
        </div>
        
        <p className="nourarchery-message cyber-text">{message}</p>
      </div>

      <div className="canvas-container">
        <canvas ref={canvasRef} className="game-canvas" />
      </div>

      {phase === 'result' && round < 3 && (
        <div className="result-panel">
          <div className="score-display">
            <h3>Round {round} Result</h3>
            <div className="score-value">{lastScore} points</div>
          </div>
          <button className="next-round-btn" onClick={handleNextRound}>
            NEXT ROUND →
          </button>
        </div>
      )}

      {phase === 'gameover' && (
        <div className="gameover-panel">
          <h2>🎮 GAME OVER</h2>
          <div className="final-scores">
            {scores.map((score, idx) => (
              <div key={idx} className="round-score">
                Round {idx + 1}: <span>{score}</span>
              </div>
            ))}
          </div>
          <div className="total-score">
            Total: <span>{scores.reduce((a, b) => a + b, 0)}</span> points
          </div>
        </div>
      )}

      {!isPlayerTurn && phase === 'aiming' && (
        <div className="waiting-overlay">
          <p>Waiting for opponent...</p>
        </div>
      )}

      <div className="instructions">
        <p>💡 <strong>How to play:</strong></p>
        <ul>
          <li>Move mouse up/down to aim</li>
          <li>Click and hold to charge power</li>
          <li>Release to shoot!</li>
          <li>Wind affects arrow trajectory</li>
          <li>Bullseye = 10 points!</li>
        </ul>
      </div>
    </div>
  );
}
