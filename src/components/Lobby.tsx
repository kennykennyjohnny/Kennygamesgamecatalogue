import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../utils/client'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, Share2, Copy, Check, Users, Clock } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LobbyProps {
  gameType: string
  gameName: string
  challengeId: string
  playerId: string
  onStartGame: () => void
  onBack: () => void
}

interface PlayerInfo {
  id: string
  username: string
  display_name: string
  avatar_url?: string
  ready: boolean
}

interface GameConfig {
  name: string
  subtitle: string
  gradient: [string, string]
  particles: string[]
}

// ---------------------------------------------------------------------------
// Game configs (themed per game)
// ---------------------------------------------------------------------------

const GAME_CONFIGS: Record<string, GameConfig> = {
  sandy: {
    name: 'Rosé Pong',
    subtitle: 'Beer Pong Élégant',
    gradient: ['#ff6b9d', '#c06c84'],
    particles: ['🌸', '✨', '💫'],
  },
  liliano: {
    name: 'Thunder',
    subtitle: 'Tank Électrique',
    gradient: ['#a8edea', '#fed6e3'],
    particles: ['⚡', '🎸', '⭐'],
  },
  lea: {
    name: 'Naval',
    subtitle: 'Bataille Tactique',
    gradient: ['#667eea', '#764ba2'],
    particles: ['🌊', '⚓', '🎯'],
  },
  nour: {
    name: 'Archery',
    subtitle: 'Tir de Précision',
    gradient: ['#f093fb', '#f5576c'],
    particles: ['🎯', '🏹', '💎'],
  },
}

const DEFAULT_CONFIG: GameConfig = {
  name: 'Game',
  subtitle: 'Partie multijoueur',
  gradient: ['#667eea', '#764ba2'],
  particles: ['🎮', '✨', '🎯'],
}

// ---------------------------------------------------------------------------
// Floating particle component
// ---------------------------------------------------------------------------

function FloatingParticle({ emoji, delay, config }: { emoji: string; delay: number; config: GameConfig }) {
  const x = Math.random() * 100
  return (
    <motion.span
      initial={{ y: '110vh', x: `${x}vw`, opacity: 0 }}
      animate={{ y: '-10vh', opacity: [0, 1, 1, 0] }}
      transition={{ duration: 6 + Math.random() * 4, delay, repeat: Infinity, ease: 'linear' }}
      style={{ position: 'absolute', fontSize: '1.5rem', pointerEvents: 'none', zIndex: 0 }}
    >
      {emoji}
    </motion.span>
  )
}

// ---------------------------------------------------------------------------
// Background orbs
// ---------------------------------------------------------------------------

function BackgroundOrb({ color, size, x, y, duration }: { color: string; size: number; x: string; y: string; duration: number }) {
  return (
    <motion.div
      animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}40, transparent 70%)`,
        left: x,
        top: y,
        filter: 'blur(40px)',
        pointerEvents: 'none',
      }}
    />
  )
}

// ---------------------------------------------------------------------------
// Player slot component
// ---------------------------------------------------------------------------

function PlayerSlot({ player, index, config }: { player?: PlayerInfo; index: number; config: GameConfig }) {
  if (!player) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          padding: 16,
          borderRadius: 16,
          border: '2px dashed rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.03)',
          minHeight: 120,
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '2px dashed rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: 'rgba(255,255,255,0.3)',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          ?
        </div>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
          En attente...
        </span>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 16,
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)',
        minHeight: 120,
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${config.gradient[0]}, ${config.gradient[1]})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          fontWeight: 700,
          color: '#fff',
          fontFamily: 'Poppins, sans-serif',
          boxShadow: `0 4px 15px ${config.gradient[0]}40`,
          overflow: 'hidden',
        }}
      >
        {player.avatar_url ? (
          <img
            src={player.avatar_url}
            alt={player.display_name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          player.display_name?.charAt(0).toUpperCase() || '?'
        )}
      </div>

      {/* Name */}
      <span
        style={{
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'Inter, sans-serif',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}
      >
        {player.display_name || player.username}
      </span>

      {/* Ready badge */}
      {player.ready && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#4ade80',
            background: 'rgba(74, 222, 128, 0.12)',
            border: '1px solid rgba(74, 222, 128, 0.25)',
            borderRadius: 20,
            padding: '2px 10px',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Prêt
        </motion.span>
      )}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Main Lobby component
// ---------------------------------------------------------------------------

export function Lobby({ gameType, gameName, challengeId, playerId, onStartGame, onBack }: LobbyProps) {
  const config = GAME_CONFIGS[gameType] || DEFAULT_CONFIG
  const [players, setPlayers] = useState<PlayerInfo[]>([])
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ---- Load challenge data & player profiles ----
  const loadChallenge = useCallback(async () => {
    try {
      const { data: challenge, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .single()

      if (error || !challenge) {
        console.error('Error loading challenge:', error)
        setLoading(false)
        return
      }

      const userIds = new Set<string>()
      if (challenge.from_user_id) userIds.add(challenge.from_user_id)
      if (challenge.to_user_id) userIds.add(challenge.to_user_id)

      const loadedPlayers: PlayerInfo[] = []

      await Promise.all(
        Array.from(userIds).map(async (uid) => {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('id, username, display_name, avatar_url')
            .eq('id', uid)
            .single()

          if (profile) {
            loadedPlayers.push({
              id: profile.id,
              username: profile.username || '',
              display_name: profile.display_name || profile.username || 'Joueur',
              avatar_url: profile.avatar_url,
              ready: challenge.status === 'accepted' || challenge.status === 'playing',
            })
          }
        })
      )

      setPlayers(loadedPlayers)
      setLoading(false)
    } catch (err) {
      console.error('Error in loadChallenge:', err)
      setLoading(false)
    }
  }, [challengeId])

  // ---- Supabase Realtime subscription ----
  useEffect(() => {
    loadChallenge()

    const channel = supabase
      .channel(`lobby:${challengeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'challenges',
          filter: `id=eq.${challengeId}`,
        },
        () => {
          loadChallenge()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [challengeId, loadChallenge])

  // ---- Derived state ----
  const readyPlayers = players.filter((p) => p.ready)
  const canStart = readyPlayers.length >= 2
  const isCountingDown = countdown !== null

  // ---- Copy invite link ----
  const handleCopyLink = useCallback(async () => {
    const link = `${window.location.origin}?challenge=${challengeId}`
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea')
      ta.value = link
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [challengeId])

  // ---- Share (native share API) ----
  const handleShare = useCallback(async () => {
    const link = `${window.location.origin}?challenge=${challengeId}`
    if (navigator.share) {
      try {
        await navigator.share({ title: `Rejoins ma partie ${config.name} !`, url: link })
      } catch { /* user cancelled */ }
    } else {
      handleCopyLink()
    }
  }, [challengeId, config.name, handleCopyLink])

  // ---- Start game with countdown ----
  const handleStart = useCallback(() => {
    if (!canStart || isCountingDown) return
    setCountdown(3)

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current)
          onStartGame()
          return null
        }
        return prev - 1
      })
    }, 1000)
  }, [canStart, isCountingDown, onStartGame])

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [])

  // Build player slots (up to 4)
  const slots: (PlayerInfo | undefined)[] = [...players]
  while (slots.length < 4) slots.push(undefined)

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* ---- Animated background orbs ---- */}
      <BackgroundOrb color={config.gradient[0]} size={300} x="10%" y="20%" duration={8} />
      <BackgroundOrb color={config.gradient[1]} size={250} x="70%" y="60%" duration={10} />
      <BackgroundOrb color={config.gradient[0]} size={200} x="50%" y="10%" duration={12} />

      {/* ---- Floating particles ---- */}
      {config.particles.map((emoji, i) => (
        <FloatingParticle key={i} emoji={emoji} delay={i * 2} config={config} />
      ))}

      {/* ---- Countdown overlay ---- */}
      <AnimatePresence>
        {isCountingDown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <motion.span
              key={countdown}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.5, type: 'spring' }}
              style={{
                fontSize: 120,
                fontWeight: 800,
                fontFamily: 'Poppins, sans-serif',
                background: `linear-gradient(135deg, ${config.gradient[0]}, ${config.gradient[1]})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
              }}
            >
              {countdown}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Header ---- */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 10,
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Retour"
        >
          <ArrowLeft size={20} />
        </motion.button>

        <h1
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#fff',
            fontFamily: 'Poppins, sans-serif',
            margin: 0,
          }}
        >
          Salle d'attente
        </h1>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleShare}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 10,
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Partager"
        >
          <Share2 size={20} />
        </motion.button>
      </div>

      {/* ---- Content (scrollable) ---- */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 20px 100px',
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {/* ---- Game banner card ---- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: `linear-gradient(135deg, ${config.gradient[0]}22, ${config.gradient[1]}22)`,
            backdropFilter: 'blur(16px)',
            border: `1px solid ${config.gradient[0]}33`,
            borderRadius: 20,
            padding: '24px 20px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Floating emoji particles inside banner */}
          {config.particles.map((emoji, i) => (
            <motion.span
              key={`banner-${i}`}
              animate={{
                y: [0, -12, 0],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 3,
                delay: i * 0.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                position: 'absolute',
                fontSize: 24,
                top: 10 + i * 20,
                right: 16 + i * 12,
                opacity: 0.6,
                pointerEvents: 'none',
              }}
            >
              {emoji}
            </motion.span>
          ))}

          <h2
            style={{
              fontSize: 28,
              fontWeight: 800,
              margin: 0,
              fontFamily: 'Poppins, sans-serif',
              background: `linear-gradient(135deg, ${config.gradient[0]}, ${config.gradient[1]})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {config.name}
          </h2>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 14,
              color: 'rgba(255,255,255,0.5)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {config.subtitle}
          </p>
        </motion.div>

        {/* ---- Players section ---- */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <Users size={18} color="rgba(255,255,255,0.5)" />
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.7)',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Joueurs ({players.length}/4)
            </span>
          </div>

          {loading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 40,
                color: 'rgba(255,255,255,0.4)',
                gap: 8,
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Clock size={18} />
              </motion.div>
              <span style={{ fontSize: 14, fontFamily: 'Inter, sans-serif' }}>Chargement...</span>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              {slots.map((player, i) => (
                <PlayerSlot key={player?.id || `empty-${i}`} player={player} index={i} config={config} />
              ))}
            </div>
          )}
        </div>

        {/* ---- Invite section ---- */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: 16,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.7)',
              fontFamily: 'Poppins, sans-serif',
              display: 'block',
              marginBottom: 12,
            }}
          >
            Inviter des amis
          </span>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCopyLink}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 16px',
              borderRadius: 12,
              border: `1px solid ${copied ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.12)'}`,
              background: copied ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.06)',
              color: copied ? '#4ade80' : 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.2s ease',
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Lien copié !' : 'Copier le lien d\'invitation'}
          </motion.button>
        </motion.div>
      </div>

      {/* ---- Bottom CTA ---- */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 20px',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          background: 'linear-gradient(transparent, rgba(15,15,35,0.95) 30%)',
          zIndex: 20,
        }}
      >
        <motion.button
          whileTap={canStart ? { scale: 0.97 } : undefined}
          onClick={canStart ? handleStart : undefined}
          disabled={!canStart || isCountingDown}
          style={{
            width: '100%',
            padding: '16px 24px',
            borderRadius: 16,
            border: 'none',
            fontSize: 16,
            fontWeight: 700,
            fontFamily: 'Poppins, sans-serif',
            cursor: canStart ? 'pointer' : 'not-allowed',
            color: '#fff',
            background: canStart
              ? `linear-gradient(135deg, ${config.gradient[0]}, ${config.gradient[1]})`
              : 'rgba(255,255,255,0.08)',
            opacity: canStart ? 1 : 0.6,
            boxShadow: canStart ? `0 8px 30px ${config.gradient[0]}40` : 'none',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {isCountingDown ? (
            'Lancement...'
          ) : canStart ? (
            "C'est parti ! 🚀"
          ) : (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Clock size={18} />
              </motion.div>
              En attente des joueurs...
            </>
          )}
        </motion.button>
      </div>
    </div>
  )
}
