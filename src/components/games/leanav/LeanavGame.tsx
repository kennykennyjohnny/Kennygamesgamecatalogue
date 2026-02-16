import React, { useEffect, useRef, useState } from 'react';
import { LeanavGame as LeanavGameEngine } from './lib/game';
import './LeanavGame.css';

export default function LeanavGame({ gameId, playerId, opponentId, isPlayerTurn, onMove, onGameOver }) {
  const gameRef = useRef(null);
  const [game, setGame] = useState(null);
  const [phase, setPhase] = useState('setup'); // setup, playing, gameover
  const [selectedBottle, setSelectedBottle] = useState(null);
  const [isHorizontal, setIsHorizontal] = useState(true);
  const [message, setMessage] = useState('Place your bottles!');
  const [playerGrid, setPlayerGrid] = useState([]);
  const [opponentGrid, setOpponentGrid] = useState([]);
  const [bottlesPlaced, setBottlesPlaced] = useState([]);

  useEffect(() => {
    const gameInstance = new LeanavGameEngine({
      gameId,
      playerId,
      isPlayerTurn,
      onMove: (moveData) => {
        onMove?.(moveData);
      },
      onGameOver: (winner) => {
        setPhase('gameover');
        setMessage(winner === 'player' ? '🎉 Victory! All bottles sunk!' : '😢 Defeat! Your cellar is empty!');
        onGameOver?.(winner);
      },
      onShipsPlaced: () => {
        setPhase('playing');
        setMessage(isPlayerTurn ? 'Your turn! Fire at opponent!' : "Opponent's turn...");
      }
    });

    gameInstance.createBoard(true);
    gameInstance.createBoard(false);
    gameInstance.randomPlaceBottles(); // Opponent bottles

    setGame(gameInstance);
    setPlayerGrid(gameInstance.playerSquares);
    setOpponentGrid(gameInstance.opponentSquares);
  }, [gameId, playerId, isPlayerTurn]);

  const handleBottleSelect = (bottle) => {
    setSelectedBottle(bottle);
    setMessage(`Selected: ${bottle.label}. Click on your grid to place.`);
  };

  const handlePlayerSquareClick = (squareId) => {
    if (phase !== 'setup' || !selectedBottle) return;

    const success = game.placeBottle(selectedBottle, squareId, isHorizontal);

    if (success) {
      setBottlesPlaced([...bottlesPlaced, selectedBottle.name]);
      setPlayerGrid([...game.playerSquares]);
      setMessage(`${selectedBottle.label} placed!`);
      setSelectedBottle(null);

      // Check if all bottles placed
      if (bottlesPlaced.length + 1 === game.bottles.length) {
        setPhase('playing');
        setMessage(isPlayerTurn ? 'All bottles placed! Your turn!' : 'All bottles placed! Waiting for opponent...');
        onMove?.({
          type: 'bottles_placed',
          bottles: game.playerBottles
        });
      }
    } else {
      setMessage('❌ Cannot place here! (occupied or too close to another bottle)');
    }
  };

  const handleOpponentSquareClick = (squareId) => {
    if (phase !== 'playing' || !isPlayerTurn) {
      setMessage("Not your turn!");
      return;
    }

    const result = game.fire(squareId, true);

    if (!result.valid) {
      setMessage(result.message);
      return;
    }

    setOpponentGrid([...game.opponentSquares]);

    if (result.hit) {
      if (result.sunk) {
        setMessage(`🍾 ${result.bottleName.toUpperCase()} SUNK!`);
        if (result.gameOver) {
          setPhase('gameover');
          setMessage('🎉 VICTORY! All bottles destroyed!');
          onGameOver?.('player');
        }
      } else {
        setMessage('💥 HIT!');
      }
    } else {
      setMessage('💨 Miss...');
    }

    // Send move to Supabase
    onMove?.({
      type: 'fire',
      squareId,
      result
    });
  };

  const handleRotate = () => {
    setIsHorizontal(!isHorizontal);
    setMessage(`Rotation: ${!isHorizontal ? 'Horizontal' : 'Vertical'}`);
  };

  const renderSquare = (square, index, isPlayerBoard) => {
    const isClickable = isPlayerBoard 
      ? phase === 'setup' && selectedBottle
      : phase === 'playing' && isPlayerTurn;

    const classes = ['leanav-square'];
    
    if (isPlayerBoard && square.hasBottle) {
      classes.push('has-bottle');
    }
    
    if (square.hit) {
      classes.push('hit');
    }
    
    if (square.miss) {
      classes.push('miss');
    }

    const handleClick = isPlayerBoard 
      ? () => handlePlayerSquareClick(index)
      : () => handleOpponentSquareClick(index);

    return (
      <div
        key={index}
        className={classes.join(' ')}
        onClick={isClickable ? handleClick : undefined}
        style={{ cursor: isClickable ? 'pointer' : 'default' }}
      >
        {square.hit && '💥'}
        {square.miss && '💨'}
        {isPlayerBoard && square.hasBottle && !square.hit && '🍾'}
      </div>
    );
  };

  if (!game) return <div>Loading game...</div>;

  return (
    <div className="leanav-game">
      <div className="leanav-header">
        <h2>🍷 LéaNaval - Bataille de Cave</h2>
        <p className="leanav-message">{message}</p>
      </div>

      {phase === 'setup' && (
        <div className="leanav-setup">
          <h3>Select a bottle to place:</h3>
          <div className="bottle-selector">
            {game.bottles.map(bottle => (
              <button
                key={bottle.name}
                className={`bottle-btn ${selectedBottle?.name === bottle.name ? 'selected' : ''} ${bottlesPlaced.includes(bottle.name) ? 'placed' : ''}`}
                onClick={() => !bottlesPlaced.includes(bottle.name) && handleBottleSelect(bottle)}
                disabled={bottlesPlaced.includes(bottle.name)}
              >
                {bottle.label}
                {bottlesPlaced.includes(bottle.name) && ' ✓'}
              </button>
            ))}
          </div>
          <button className="rotate-btn" onClick={handleRotate}>
            🔄 Rotate ({isHorizontal ? 'Horizontal' : 'Vertical'})
          </button>
        </div>
      )}

      <div className="leanav-boards">
        <div className="board-container">
          <h3>Your Cellar</h3>
          <div className="leanav-grid">
            {playerGrid.map((square, idx) => renderSquare(square, idx, true))}
          </div>
        </div>

        <div className="board-container">
          <h3>Opponent's Cellar</h3>
          <div className="leanav-grid">
            {opponentGrid.map((square, idx) => renderSquare(square, idx, false))}
          </div>
        </div>
      </div>

      {phase === 'gameover' && (
        <div className="leanav-gameover">
          <h2>{message}</h2>
        </div>
      )}
    </div>
  );
}
