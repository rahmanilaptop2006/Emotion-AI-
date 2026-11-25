import { useEffect, useRef, useState } from 'react'
import {
  Brain,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react'
import type { Language, MindGymSession, UserAccount } from '../../types'

interface MindGymPanelProps {
  account: UserAccount
  language: Language
  onAddSession: (session: Omit<MindGymSession, 'id' | 'date' | 'timestamp'>) => void
}

type GymMode = 'pairs' | 'reaction' | 'pattern' | 'focus'

const PAIR_SYMBOLS = ['🌿', '🍃', '☀️', '🌙', '💧', '🪷']

function createShuffledDeck() {
  return [...PAIR_SYMBOLS, ...PAIR_SYMBOLS]
    .map((symbol, idx) => ({ id: `${symbol}-${idx}-${Math.random()}`, symbol, matched: false }))
    .sort(() => Math.random() - 0.5)
}

export function MindGymPanel({ account, language, onAddSession }: MindGymPanelProps) {
  const isHi = language === 'hi'
  const sessions = account.mindGymSessions || []
  const [mode, setMode] = useState<GymMode>('pairs')
  const [reflection, setReflection] = useState('')

  // 1. Linking Pairs Working Memory Game State
  const [deck, setDeck] = useState(() => createShuffledDeck())
  const [flippedIndices, setFlippedIndices] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [pairsRunning, setPairsRunning] = useState(false)
  const [pairsScore, setPairsScore] = useState<number | null>(null)

  // 2. Reaction Speed Task State
  const [reactPhase, setReactPhase] = useState<'idle' | 'waiting' | 'ready' | 'done'>('idle')
  const [reactMs, setReactMs] = useState<number | null>(null)
  const reactStartRef = useRef<number>(0)
  const reactTimerRef = useRef<number | null>(null)

  // 3. Pattern Recognition & Recall State
  const [patternSeq, setPatternSeq] = useState<number[]>([0, 2, 1, 3])
  const [showPattern, setShowPattern] = useState(false)
  const [userSeq, setUserSeq] = useState<number[]>([])
  const [patternMsg, setPatternMsg] = useState<string>('')

  // 4. Focus Timer & Distraction Tracker State
  const [focusSec, setFocusSec] = useState(25 * 60)
  const [focusRunning, setFocusRunning] = useState(false)
  const [distractions, setDistractions] = useState(0)

  useEffect(() => {
    if (!focusRunning) return
    const id = window.setInterval(() => {
      setFocusSec((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => window.clearInterval(id)
  }, [focusRunning])

  useEffect(() => {
    return () => {
      if (reactTimerRef.current) window.clearTimeout(reactTimerRef.current)
    }
  }, [])

  // Linking Pairs Logic
  const startNewPairsGame = () => {
    setDeck(createShuffledDeck())
    setFlippedIndices([])
    setMoves(0)
    setPairsScore(null)
    setPairsRunning(true)
  }

  const handleCardFlip = (idx: number) => {
    if (!pairsRunning) setPairsRunning(true)
    if (deck[idx].matched || flippedIndices.includes(idx) || flippedIndices.length >= 2) return

    const nextFlipped = [...flippedIndices, idx]
    setFlippedIndices(nextFlipped)

    if (nextFlipped.length === 2) {
      const nextMoves = moves + 1
      setMoves(nextMoves)
      const [a, b] = nextFlipped
      if (deck[a].symbol === deck[b].symbol) {
        const updatedDeck = deck.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c))
        setDeck(updatedDeck)
        setFlippedIndices([])
        if (updatedDeck.every((c) => c.matched)) {
          const earned = Math.max(4600, 6800 - nextMoves * 110)
          setPairsScore(earned)
          setPairsRunning(false)
          onAddSession({
            game: 'Linking Pairs',
            score: earned,
            level: Math.min(20, 12 + Math.floor((earned - 4500) / 400)),
            reflection: reflection.trim() || undefined,
          })
        }
      } else {
        window.setTimeout(() => setFlippedIndices([]), 620)
      }
    }
  }

  // Reaction Speed Logic
  const startReaction = () => {
    if (reactTimerRef.current) window.clearTimeout(reactTimerRef.current)
    setReactMs(null)
    setReactPhase('waiting')
    const delay = 1300 + Math.floor(Math.random() * 1900)
    reactTimerRef.current = window.setTimeout(() => {
      reactStartRef.current = performance.now()
      setReactPhase('ready')
    }, delay)
  }

  const handleReactionTap = () => {
    if (reactPhase === 'waiting') {
      if (reactTimerRef.current) window.clearTimeout(reactTimerRef.current)
      setReactPhase('idle')
      return
    }
    if (reactPhase === 'ready') {
      const elapsed = Math.round(performance.now() - reactStartRef.current)
      setReactMs(elapsed)
      setReactPhase('done')
      const pts = Math.max(3500, 7000 - elapsed * 6)
      onAddSession({
        game: 'Reaction Speed',
        score: pts,
        level: Math.min(20, Math.max(8, 18 - Math.floor(elapsed / 45))),
        reflection: reflection.trim() || undefined,
      })
    }
  }

  // Pattern Recognition Logic
  const startPatternRound = () => {
    const seq = Array.from({ length: 4 }, () => Math.floor(Math.random() * 4))
    setPatternSeq(seq)
    setUserSeq([])
    setPatternMsg('')
    setShowPattern(true)
    window.setTimeout(() => setShowPattern(false), 2200)
  }

  const handlePatternTile = (tileId: number) => {
    if (showPattern) return
    const next = [...userSeq, tileId]
    setUserSeq(next)
    const idx = next.length - 1
    if (patternSeq[idx] !== tileId) {
      setPatternMsg(isHi ? 'क्रम मेल नहीं खाया — फिर से प्रयास करें' : 'Sequence mismatch — try a fresh round!')
      setUserSeq([])
      return
    }
    if (next.length === patternSeq.length) {
      setPatternMsg(isHi ? 'उत्कृष्ट स्मृति! +5,800 अंक' : 'Exact recall! +5,800 pts saved')
      onAddSession({
        game: 'Pattern Recall',
        score: 5800,
        level: 14,
        reflection: reflection.trim() || undefined,
      })
    }
  }

  // Focus Timer Finish Handler
  const handleCompleteFocus = () => {
    setFocusRunning(false)
    const pts = Math.max(4200, 6200 - distractions * 250)
    onAddSession({
      game: 'Focus Timer',
      score: pts,
      level: 13,
      reflection: reflection.trim() || `Completed focus block (${distractions} distractions refocused).`,
    })
    setFocusSec(25 * 60)
    setDistractions(0)
  }

  // Sparkline & Highest Score matching Screenshot 10
  const recentScores = sessions.slice(-6).map((s) => s.score)
  const sparkScores = recentScores.length >= 2 ? recentScores : [4200, 5150, 4850, 5640, 6230]
  const latestScore = sparkScores[sparkScores.length - 1]
  const highestScore = Math.max(...sparkScores, 6230)
  const latestLevel = sessions[sessions.length - 1]?.level || 13

  const w = 260
  const h = 76
  const minS = 3500
  const maxS = 7200
  const coords = sparkScores.map((sc, i) => ({
    x: 12 + (i / (sparkScores.length - 1)) * (w - 24),
    y: h - 12 - ((Math.min(maxS, Math.max(minS, sc)) - minS) / (maxS - minS)) * (h - 24),
  }))
  const linePts = coords.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Card matching Screenshot 10: Linking Pairs Score, Goal & Line Graph */}
        <section className="lg:col-span-5 rounded-[26px] sample-pastel-sky p-6 space-y-4 border border-white/80 dark:border-white/10">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#344932] dark:text-[#A8C6A4]">
                {isHi ? 'संज्ञानात्मक वेलनेस · MindGym' : '10. Cognitive Wellness / MindGym'}
              </div>
              <h2 className="font-display text-xl font-bold text-[#1B251A] dark:text-[#E5E8CE]">
                {isHi ? 'लिंकिंग पेयर्स व फोकस' : 'Linking Pairs'}
              </h2>
            </div>
            <Trophy className="w-5 h-5 text-[#4E6B4B]" />
          </div>

          <div className="rounded-[16px] clay-card-tint px-4 py-2.5 flex items-center justify-between text-xs font-bold">
            <span>Goal:</span>
            <span className="font-mono-num">★ 6000</span>
          </div>

          <div className="rounded-[20px] clay-tile p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>Your score:</span>
              <span className="font-mono-num px-2.5 py-0.5 rounded-[8px] clay-well">
                ★ {pairsScore ?? latestScore}
              </span>
            </div>

            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20 overflow-visible" aria-label="MindGym score progression">
              <polyline
                fill="none"
                stroke="#4E6B4B"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={linePts}
              />
              {coords.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r={i === coords.length - 1 ? 5 : 3.5}
                  fill={i === coords.length - 1 ? '#344932' : '#789575'}
                  stroke="#FFF"
                  strokeWidth="1.5"
                />
              ))}
            </svg>

            <div className="flex items-center justify-between text-xs border-t border-[#789575]/15 pt-2.5">
              <span>Level:</span>
              <span className="font-mono-num font-bold">{latestLevel}/20</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Your highest score:</span>
              <span className="font-mono-num font-bold">★ {highestScore}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setMode('pairs')
              startNewPairsGame()
            }}
            className="clay-btn-primary w-full py-2.5 rounded-[14px] text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Play className="w-4 h-4" />
            <span>{isHi ? 'लिंकिंग पेयर्स शुरू करें' : 'Start Linking Pairs'}</span>
          </button>
        </section>

        {/* Right: Playable MindGym Exercises */}
        <section className="lg:col-span-7 rounded-[26px] clay-card p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'pairs' as const, label: isHi ? 'लिंकिंग पेयर्स' : 'Working Memory', icon: Brain },
              { id: 'reaction' as const, label: isHi ? 'प्रतिक्रिया गति' : 'Reaction Task', icon: Zap },
              { id: 'pattern' as const, label: isHi ? 'पैटर्न पहचान' : 'Pattern Recall', icon: Target },
              { id: 'focus' as const, label: isHi ? 'फोकस टाइमर' : 'Focus Timer', icon: Clock },
            ].map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[13px] text-xs font-semibold cursor-pointer ${
                    mode === item.id ? 'clay-btn-primary' : 'clay-btn-secondary'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>

          {/* 1. Working Memory: Linking Pairs Grid */}
          {mode === 'pairs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>
                  {isHi ? 'समान जोड़े मिलाएं' : 'Match all 6 botanical pairs'} · Moves:{' '}
                  <span className="font-mono-num">{moves}</span>
                </span>
                <button
                  type="button"
                  onClick={startNewPairsGame}
                  className="clay-btn-secondary px-3 py-1 rounded-[10px] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {deck.map((card, i) => {
                  const revealed = card.matched || flippedIndices.includes(i)
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => handleCardFlip(i)}
                      className={`h-16 rounded-[16px] text-2xl font-bold flex items-center justify-center transition-all cursor-pointer ${
                        card.matched
                          ? 'clay-btn-primary'
                          : revealed
                            ? 'clay-card-tint'
                            : 'clay-tile hover:scale-[1.02]'
                      }`}
                    >
                      {revealed ? card.symbol : '·'}
                    </button>
                  )
                })}
              </div>
              {pairsScore && (
                <div className="rounded-[14px] clay-card-tint p-3 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#344932]" />
                  <span>Completed in {moves} moves! Score saved: ★ {pairsScore}</span>
                </div>
              )}
            </div>
          )}

          {/* 2. Reaction Speed Task */}
          {mode === 'reaction' && (
            <div className="space-y-4">
              <div className="text-xs opacity-80">
                {isHi
                  ? 'हरे रंग का संकेत दिखते ही तुरंत टैप करें।'
                  : 'Press Start, wait until the box turns Forest Green, then tap immediately.'}
              </div>
              <button
                type="button"
                onClick={reactPhase === 'idle' || reactPhase === 'done' ? startReaction : handleReactionTap}
                className={`w-full h-40 rounded-[22px] text-sm font-bold flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  reactPhase === 'ready'
                    ? 'clay-btn-primary'
                    : reactPhase === 'waiting'
                      ? 'clay-card-forest text-[#E5E8CE]'
                      : 'clay-tile'
                }`}
              >
                {reactPhase === 'idle' && <span>Tap to Start Reaction Task</span>}
                {reactPhase === 'waiting' && <span>Wait for Forest Green signal...</span>}
                {reactPhase === 'ready' && <span className="text-lg">TAP NOW!</span>}
                {reactPhase === 'done' && (
                  <>
                    <span className="font-mono-num text-2xl">{reactMs} ms</span>
                    <span className="text-xs font-normal">Tap again to retry</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* 3. Pattern Recognition & Recall */}
          {mode === 'pattern' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">
                  {showPattern
                    ? isHi
                      ? 'इस क्रम को याद रखें:'
                      : 'Memorize this sequence:'
                    : isHi
                      ? 'उसी क्रम में टैप करें:'
                      : 'Tap cards in the exact order:'}
                </span>
                <button
                  type="button"
                  onClick={startPatternRound}
                  className="clay-btn-primary px-3.5 py-1.5 rounded-[11px] text-xs font-semibold cursor-pointer"
                >
                  {isHi ? 'नया पैटर्न देखें' : 'Show Pattern'}
                </button>
              </div>
              {showPattern && (
                <div className="rounded-[15px] clay-card-tint p-3 text-center font-mono-num text-base font-bold tracking-widest">
                  {patternSeq.map((n) => n + 1).join(' → ')}
                </div>
              )}
              <div className="grid grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((tileId) => (
                  <button
                    key={tileId}
                    type="button"
                    onClick={() => handlePatternTile(tileId)}
                    className="h-20 rounded-[18px] clay-tile hover:clay-card-tint text-lg font-bold font-mono-num cursor-pointer"
                  >
                    {tileId + 1}
                  </button>
                ))}
              </div>
              {patternMsg && <div className="text-xs font-bold text-[#344932] dark:text-[#A8C6A4]">{patternMsg}</div>}
            </div>
          )}

          {/* 4. Focus Timer & Distraction Management */}
          {mode === 'focus' && (
            <div className="space-y-4">
              <div className="rounded-[20px] clay-well p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold opacity-75">Study &amp; Concentration Session</div>
                  <div className="font-mono-num text-3xl font-bold mt-1">
                    {String(Math.floor(focusSec / 60)).padStart(2, '0')}:
                    {String(focusSec % 60).padStart(2, '0')}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setFocusRunning((r) => !r)}
                    className="clay-btn-primary px-4 py-2 rounded-[12px] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {focusRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{focusRunning ? 'Pause' : 'Start Focus'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDistractions((d) => d + 1)}
                    className="clay-btn-secondary px-3 py-2 rounded-[12px] text-xs font-semibold cursor-pointer"
                  >
                    Refocused ({distractions})
                  </button>
                  <button
                    type="button"
                    onClick={handleCompleteFocus}
                    className="clay-btn-secondary px-3 py-2 rounded-[12px] text-xs font-semibold cursor-pointer"
                  >
                    Log Session
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Learning Reflection */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Sparkles className="w-4 h-4 text-[#4E6B4B] shrink-0" />
            <input
              type="text"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder={
                isHi
                  ? 'अभ्यास के बाद ध्यान या सीखने का अनुभव लिखें...'
                  : 'Learning reflection (e.g. steady attention without rushing)...'
              }
              className="flex-1 min-w-[200px] h-10 rounded-[12px] clay-input px-3 text-xs"
            />
          </div>
        </section>
      </div>

      {/* Personal Practice History */}
      <section className="rounded-[24px] clay-card p-5 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-[#344932] dark:text-[#A8C6A4]">
          {isHi ? 'व्यक्तिगत अभ्यास इतिहास' : 'Personal Practice History'}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sessions
            .slice(-4)
            .reverse()
            .map((s) => (
              <div key={s.id} className="rounded-[16px] clay-tile p-3.5 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{s.game}</span>
                  <span className="font-mono-num text-[#344932] dark:text-[#A8C6A4]">★ {s.score}</span>
                </div>
                <div className="text-[11px] font-mono-num opacity-75">
                  Lv.{s.level} · {s.date}
                </div>
                {s.reflection && <p className="text-[11px] opacity-85 line-clamp-1">{s.reflection}</p>}
              </div>
            ))}
        </div>
      </section>
    </div>
  )
}
