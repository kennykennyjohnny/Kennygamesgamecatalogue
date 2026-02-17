import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import './NourarcheryGame.css';

/* ─── constants ──────────────────────────────────────────────── */
const TOTAL_ROUNDS = 3;
const ARROWS_PER_ROUND = 3;
const TOTAL_ARROWS = TOTAL_ROUNDS * ARROWS_PER_ROUND;
const TARGET_SIZE = 260;
const RING_RADII = [1.0, 0.78, 0.56, 0.36, 0.18];
const RING_SCORES = [2, 4, 6, 8, 10];
const MATRIX_CHARS = '🍃🌿🍂🌱🌲🪵☘️🌳🍁🌾🦌🏹🎯🎋🪶✦✧◆◇●○■□▲△';

interface StuckArrow { x: number; y: number; score: number }
interface ScorePopup { id: number; score: number; x: number; y: number }

function randomWind() {
  const speed = +(Math.random() * 8 - 4).toFixed(1);
  return speed;
}

function getScore(dx: number, dy: number): number {
  const dist = Math.sqrt(dx * dx + dy * dy);
  const r = TARGET_SIZE / 2;
  for (let i = RING_RADII.length - 1; i >= 0; i--) {
    if (dist <= r * RING_RADII[i]) return RING_SCORES[i];
  }
  return 0;
}

/* ─── Matrix rain column ─── */
function MatrixColumn({ index, total }: { index: number; total: number }) {
  const chars = useMemo(() => {
    const len = 8 + Math.floor(Math.random() * 14);
    return Array.from({ length: len }, () =>
      MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
    ).join('\n');
  }, []);

  const duration = 3 + Math.random() * 5;
  const delay = Math.random() * 4;
  const left = `${(index / total) * 100}%`;
  const opacity = 0.15 + Math.random() * 0.25;
  const fontSize = 10 + Math.floor(Math.random() * 4);

  return (
    <div
      className="na-matrix-col"
      style={{
        left,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
        opacity,
        fontSize,
      }}
    >
      {chars}
    </div>
  );
}

/* ─── component ──────────────────────────────────────────────── */
export default function NourarcheryGame({ gameId, playerId, opponentId, isPlayerTurn, onMove, onGameOver }: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'aiming' | 'flying' | 'scored' | 'done'>('aiming');
  const [round, setRound] = useState(1);
  const [arrowInRound, setArrowInRound] = useState(1);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore] = useState(0);
  const [wind, setWind] = useState(() => randomWind());
  const [crosshairPos, setCrosshairPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [stuckArrows, setStuckArrows] = useState<StuckArrow[]>([]);
  const [arrowFlying, setArrowFlying] = useState(false);
  const [arrowTarget, setArrowTarget] = useState({ x: 0, y: 0 });
  const [hitFlash, setHitFlash] = useState(false);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [roundArrowScores, setRoundArrowScores] = useState<number[]>([]);
  const [allScores, setAllScores] = useState<number[]>([]);
  const totalArrowsFired = useRef(0);
  const popupId = useRef(0);

  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWind(randomWind());
  }, [round]);

  const getRelativePos = useCallback((clientX: number, clientY: number) => {
    const el = targetRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return {
      x: clientX - rect.left - rect.width / 2,
      y: clientY - rect.top - rect.height / 2,
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (phase !== 'aiming' || !isPlayerTurn) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    const pos = getRelativePos(e.clientX, e.clientY);
    setCrosshairPos(pos);
  }, [phase, isPlayerTurn, getRelativePos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const pos = getRelativePos(e.clientX, e.clientY);
    setCrosshairPos(pos);
  }, [isDragging, getRelativePos]);

  const shoot = useCallback(() => {
    if (phase !== 'aiming') return;
    setIsDragging(false);

    // Apply wind offset
    const windOffset = wind * 3;
    const finalX = crosshairPos.x + windOffset + (Math.random() - 0.5) * 10;
    const finalY = crosshairPos.y + (Math.random() - 0.5) * 10;

    setArrowTarget({ x: finalX, y: finalY });
    setArrowFlying(true);
    setPhase('flying');

    // Arrow flight duration
    setTimeout(() => {
      setArrowFlying(false);
      const score = getScore(finalX, finalY);

      setStuckArrows(prev => [...prev, { x: finalX, y: finalY, score }]);
      setPlayerScore(prev => prev + score);
      setRoundArrowScores(prev => [...prev, score]);
      setAllScores(prev => [...prev, score]);
      setHitFlash(true);
      setTimeout(() => setHitFlash(false), 300);

      const pid = ++popupId.current;
      setScorePopups(prev => [...prev, { id: pid, score, x: finalX, y: finalY }]);
      setTimeout(() => setScorePopups(prev => prev.filter(p => p.id !== pid)), 1500);

      totalArrowsFired.current += 1;
      const currentArrowInRound = arrowInRound;
      const currentRound = round;

      onMove?.({
        round: currentRound,
        arrowNumber: currentArrowInRound,
        score,
        position: { x: finalX, y: finalY },
      });

      setTimeout(() => {
        if (currentArrowInRound >= ARROWS_PER_ROUND) {
          // End of round
          if (currentRound >= TOTAL_ROUNDS) {
            setPhase('done');
            const finalScore = allScores.reduce((a, b) => a + b, 0) + score;
            onGameOver?.({
              winner_id: finalScore >= opponentScore ? playerId : opponentId,
              scores: { player: finalScore, opponent: opponentScore },
            });
          } else {
            setRound(r => r + 1);
            setArrowInRound(1);
            setStuckArrows([]);
            setRoundArrowScores([]);
            setPhase('aiming');
            setCrosshairPos({ x: 0, y: 0 });
          }
        } else {
          setArrowInRound(a => a + 1);
          setPhase('aiming');
          setCrosshairPos({ x: 0, y: 0 });
        }
      }, 1000);

      setPhase('scored');
    }, 600);
  }, [phase, crosshairPos, wind, arrowInRound, round, allScores, opponentScore, playerId, opponentId, onMove, onGameOver, isPlayerTurn]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    shoot();
  }, [isDragging, shoot]);

  const matrixCols = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => <MatrixColumn key={i} index={i} total={30} />),
  []);

  const showWaiting = !isPlayerTurn && phase !== 'done';
  const showDone = phase === 'done';
  const totalFired = totalArrowsFired.current;
  const overallArrow = (round - 1) * ARROWS_PER_ROUND + arrowInRound;

  return (
    <div className="na-container" ref={containerRef}>
      {/* Matrix rain background */}
      <div className="na-matrix-rain">{matrixCols}</div>

      {/* Floating particles */}
      <div className="na-particles">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="na-particle" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 6}s`,
            animationDuration: `${4 + Math.random() * 4}s`,
          }} />
        ))}
      </div>

      {/* Circuit pattern overlay */}
      <div className="na-circuit-overlay" />

      {/* ─── Top HUD ─── */}
      <div className="na-hud-top">
        <div className="na-panel na-round-panel">
          <span className="na-label">ROUND</span>
          <span className="na-value">{round}/{TOTAL_ROUNDS}</span>
        </div>
        <div className="na-panel na-arrow-panel">
          <span className="na-label">ARROW</span>
          <span className="na-value">{arrowInRound}/{ARROWS_PER_ROUND}</span>
        </div>
      </div>

      {/* ─── Wind indicator ─── */}
      <div className="na-panel na-wind-panel">
        <span className="na-label">WIND</span>
        <div className="na-wind-readout">
          <span className="na-wind-arrow">{wind > 0 ? '▶' : wind < 0 ? '◀' : '●'}</span>
          <span className="na-wind-val">{Math.abs(wind).toFixed(1)} m/s</span>
        </div>
      </div>

      {/* ─── Target area ─── */}
      <div
        className="na-target-area"
        ref={targetRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Target rings */}
        <div className={`na-target ${hitFlash ? 'na-hit-flash' : ''}`}>
          {RING_RADII.map((frac, i) => (
            <div
              key={i}
              className="na-ring"
              style={{
                width: TARGET_SIZE * frac,
                height: TARGET_SIZE * frac,
                borderColor: i === RING_RADII.length - 1
                  ? '#FF3B30'
                  : `rgba(143, 188, 143, ${0.3 + i * 0.15})`,
                boxShadow: i === RING_RADII.length - 1
                  ? '0 0 12px #FF3B30, inset 0 0 8px rgba(255,59,48,0.3)'
                  : `0 0 ${6 + i * 3}px rgba(143,188,143,${0.15 + i * 0.08})`,
              }}
            >
              <span className="na-ring-score">{RING_SCORES[i]}</span>
            </div>
          ))}
          {/* Target crosshair lines */}
          <div className="na-target-cross-h" />
          <div className="na-target-cross-v" />
        </div>

        {/* Stuck arrows */}
        {stuckArrows.map((a, i) => (
          <motion.div
            key={`stuck-${i}`}
            className="na-stuck-arrow"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              left: `calc(50% + ${a.x}px)`,
              top: `calc(50% + ${a.y}px)`,
            }}
          >
            <div className="na-arrow-head" />
          </motion.div>
        ))}

        {/* Arrow in flight */}
        <AnimatePresence>
          {arrowFlying && (
            <motion.div
              className="na-flying-arrow"
              initial={{ bottom: -60, left: '50%', opacity: 1, scale: 0.3 }}
              animate={{
                bottom: `calc(50% + ${-arrowTarget.y}px - 6px)`,
                left: `calc(50% + ${arrowTarget.x}px)`,
                opacity: 1,
                scale: 1,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeIn' }}
            >
              <div className="na-arrow-glow-trail" />
              <div className="na-arrow-head" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Crosshair */}
        {phase === 'aiming' && isPlayerTurn && (
          <motion.div
            className="na-crosshair"
            style={{
              left: `calc(50% + ${crosshairPos.x}px)`,
              top: `calc(50% + ${crosshairPos.y}px)`,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <div className="na-crosshair-ring" />
            <div className="na-crosshair-dot" />
            <div className="na-crosshair-line na-ch-top" />
            <div className="na-crosshair-line na-ch-right" />
            <div className="na-crosshair-line na-ch-bottom" />
            <div className="na-crosshair-line na-ch-left" />
          </motion.div>
        )}

        {/* Score popups */}
        <AnimatePresence>
          {scorePopups.map(p => (
            <motion.div
              key={p.id}
              className="na-score-popup"
              initial={{ opacity: 1, y: 0, x: p.x, scale: 0.5 }}
              animate={{ opacity: 0, y: -60, scale: 1.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              style={{
                left: `calc(50% + ${p.x}px)`,
                top: `calc(50% + ${p.y}px)`,
              }}
            >
              +{p.score}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ─── Bottom HUD ─── */}
      <div className="na-hud-bottom">
        <div className="na-panel na-score-panel">
          <span className="na-label">YOUR_SCORE</span>
          <span className="na-score-value">{playerScore}</span>
        </div>
        <div className="na-panel na-score-panel">
          <span className="na-label">OPP_SCORE</span>
          <span className="na-score-value na-opp">{opponentScore}</span>
        </div>
      </div>

      {/* Arrow scores for current round */}
      {roundArrowScores.length > 0 && (
        <div className="na-panel na-shots-panel">
          <span className="na-label">MANCHE_{round}_SHOTS&gt;</span>
          {roundArrowScores.map((s, i) => (
            <span key={i} className="na-shot-score">{s}</span>
          ))}
        </div>
      )}

      {/* Instruction nudge */}
      <AnimatePresence>
        {phase === 'aiming' && isPlayerTurn && !isDragging && (
          <motion.div
            className="na-nudge"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            '🏹 Glisse pour viser, relâche pour tirer'
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waiting overlay */}
      <AnimatePresence>
        {showWaiting && (
          <motion.div
            className="na-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="na-overlay-text">
              <span className="na-blink">&gt;_</span> AWAITING_OPPONENT_INPUT...
            </div>
            <div className="na-overlay-sub">Target system locked. Standby.</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game over overlay */}
      <AnimatePresence>
        {showDone && (
          <motion.div
            className="na-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="na-gameover-box"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <div className="na-gameover-title">
                '🏹 Résultat Final'
              </div>
              <div className="na-gameover-scores">
                <div className="na-go-row">
                  <span className="na-label">PLAYER_SCORE:</span>
                  <span className="na-score-value">{playerScore}</span>
                </div>
                <div className="na-go-row">
                  <span className="na-label">OPPONENT_SCORE:</span>
                  <span className="na-score-value na-opp">{opponentScore}</span>
                </div>
              </div>
              <div className="na-gameover-result">
                {playerScore > opponentScore
                  ? '🏆 VICTOIRE !'
                  : playerScore < opponentScore
                  ? '💥 DÉFAITE !'
                  : '🤝 ÉGALITÉ !'}
              </div>
              <div className="na-all-shots">
                {allScores.map((s, i) => (
                  <span key={i} className="na-shot-score">{s}</span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
