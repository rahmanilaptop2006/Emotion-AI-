import { useState } from 'react'
import { Activity, ChevronDown, ChevronUp, Keyboard, Mic, Wind } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Language, UserAccount } from '../types'

interface StressDetectionCardProps {
  account: UserAccount
  language: Language
  onOpenTypingTest: () => void
  onOpenVoiceCheck: () => void
  onOpenBreathing?: () => void
}

export function StressDetectionCard({
  account,
  language,
  onOpenTypingTest,
  onOpenVoiceCheck,
  onOpenBreathing,
}: StressDetectionCardProps) {
  const { factors } = account
  const isHi = language === 'hi'
  const [showHow, setShowHow] = useState(false)

  const stressDetected =
    factors.stress === 'High' ||
    factors.typingVarianceMs > 55 ||
    factors.voiceStress === 'Elevated' ||
    factors.voiceStress === 'Moderate'

  // Smooth hourly mood/load curve points matching Sample Card 3 (8 AM -> 5 PM)
  const curveBase = stressDetected ? [52, 74, 58, 36, 48, 28, 32] : [62, 68, 72, 70, 76, 80, 82]
  const width = 340
  const height = 96
  const coords = curveBase.map((val, i) => ({
    x: (i / (curveBase.length - 1)) * (width - 24) + 12,
    y: height - (val / 100) * (height - 20) - 10,
  }))

  const smoothPath = coords.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`
    const prev = arr[i - 1]
    const cx = (prev.x + pt.x) / 2
    return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`
  }, '')

  const focusPoint = coords[3]

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-[28px] clay-card-tint p-6 space-y-5"
    >
      {/* Sample Card 3: Real-time Mood Detection Header + Wave Curve + CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#344932] dark:text-[#A8C6A4]">
            <Activity className="w-4 h-4" />
            <span>
              {isHi
                ? 'Mood-to-Action Engine · रियल-टाइम मूड पहचान'
                : 'Mood-to-Action Engine — Convert emotional states into practical actions'}
            </span>
          </div>

          <div className="rounded-[20px] bg-white/65 dark:bg-[#142014]/80 p-4 border border-white/75 dark:border-white/10">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
              <path
                d={smoothPath}
                fill="none"
                stroke="#4E6B4B"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <circle
                cx={focusPoint.x}
                cy={focusPoint.y}
                r="6"
                fill="#FFFFFF"
                stroke="#344932"
                strokeWidth="3"
              />
            </svg>
            <div className="flex items-center justify-between text-[10px] font-mono-num opacity-70 pt-1">
              <span>8 AM</span>
              <span>12 PM</span>
              <span>5 PM</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col justify-between gap-3 text-center lg:text-left">
          <div>
            <h3 className="font-display text-xl font-bold">
              {stressDetected
                ? isHi
                  ? 'तनाव के संकेत मिले'
                  : 'Stress Detected'
                : isHi
                  ? 'मनःस्थिति संतुलित है'
                  : 'Calm & Balanced'}
            </h3>
            <p className="text-xs opacity-80 mt-1">
              {stressDetected
                ? isHi
                  ? 'क्या आप 2-मिनट का ब्रीदिंग अभ्यास करना चाहेंगे?'
                  : 'Would you like a 2-min breathing exercise?'
                : isHi
                  ? 'आपके टाइपिंग व वॉइस संकेत सामान्य सीमा में हैं।'
                  : 'Your keystroke cadence and vocal tone look steady today.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 justify-center lg:justify-start">
            {onOpenBreathing && (
              <button
                type="button"
                onClick={onOpenBreathing}
                className="clay-btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold cursor-pointer"
              >
                <Wind className="w-3.5 h-3.5" />
                <span>{isHi ? 'ब्रीदिंग शुरू करें' : 'Start Exercise'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenTypingTest}
              className="clay-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-semibold cursor-pointer"
            >
              <Keyboard className="w-3.5 h-3.5 text-[#344932] dark:text-[#A8C6A4]" />
              <span>{isHi ? 'टाइपिंग जांच' : 'Typing Test'}</span>
            </button>
            <button
              type="button"
              onClick={onOpenVoiceCheck}
              className="clay-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-semibold cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 text-[#344932] dark:text-[#A8C6A4]" />
              <span>{isHi ? 'वॉइस बायोमार्कर' : 'Voice Biomarker'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Biomarker Metrics Row + Transparent Condition Explanation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-[18px] clay-tile p-3.5">
          <div className="text-[11px] opacity-75">{isHi ? 'टाइपिंग गति' : 'Typing Speed'}</div>
          <div className="mt-1 text-lg font-bold font-mono-num">{factors.typingWpm} WPM</div>
          <div className="text-[11px] font-mono-num opacity-70">{factors.typingVarianceMs} ms var</div>
        </div>
        <div className="rounded-[18px] clay-tile p-3.5">
          <div className="text-[11px] opacity-75">{isHi ? 'आवाज़ बायोमार्कर' : 'Voice Stress'}</div>
          <div className="mt-1 text-lg font-bold">{factors.voiceStress}</div>
          <div className="text-[11px] opacity-70">{isHi ? 'पिच व विराम' : 'Pitch & pause'}</div>
        </div>
        <div className="rounded-[18px] clay-tile p-3.5">
          <div className="text-[11px] opacity-75">{isHi ? 'नींद की अवधि' : 'Sleep'}</div>
          <div className="mt-1 text-lg font-bold font-mono-num">{factors.sleepHours.toFixed(1)} hrs</div>
          <div className="text-[11px] font-mono-num opacity-70">{factors.sleepLatencyMin}m onset</div>
        </div>
        <div className="rounded-[18px] clay-tile p-3.5">
          <div className="text-[11px] opacity-75">{isHi ? 'तनाव स्थिति' : 'Strain Level'}</div>
          <div className="mt-1 text-lg font-bold">{factors.stress}</div>
          <div className="text-[11px] opacity-70">{isHi ? 'संयुक्त आकलन' : 'Combined index'}</div>
        </div>
      </div>

      <div className="rounded-[16px] clay-well px-4 py-2.5">
        <button
          type="button"
          onClick={() => setShowHow((v) => !v)}
          className="w-full flex items-center justify-between text-xs font-semibold text-[#344932] dark:text-[#A8C6A4] cursor-pointer"
        >
          <span>
            {isHi
              ? 'बायोमार्कर और टाइपिंग आपकी स्थिति का विश्लेषण कैसे करते हैं?'
              : 'How Typing & Voice Biomarkers Analyze Your Condition'}
          </span>
          {showHow ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showHow && (
          <div className="mt-2.5 pt-2.5 border-t border-[#789575]/20 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs opacity-85">
            <div>
              <div className="font-bold">{isHi ? '1. कीस्ट्रोक लय (Typing)' : '1. Keystroke Cadence'}</div>
              <p className="text-[11px] mt-0.5 leading-relaxed">
                {isHi
                  ? 'कुंजियों के बीच समय विचलन (ms) और सुधार दर से मानसिक थकान और एकाग्रता मापी जाती है।'
                  : 'Measures inter-key timing variance (ms SD) and correction rate to spot fatigue or strain.'}
              </p>
            </div>
            <div>
              <div className="font-bold">{isHi ? '2. आवाज़ संकेत (Voice)' : '2. Acoustic Voice Prosody'}</div>
              <p className="text-[11px] mt-0.5 leading-relaxed">
                {isHi
                  ? 'माइक से बोलने की गति (WPM), पिच कंपन और विराम अवधि का विश्लेषण कर तनाव स्तर निकाला जाता है।'
                  : 'Analyzes speaking pace, pause latency (ms), and energy stability from your microphone sample.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.section>
  )
}
