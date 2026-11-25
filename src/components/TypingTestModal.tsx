import { useRef, useState } from 'react'
import { Check, Info, Keyboard, RotateCcw, X } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Language } from '../types'

interface TypingTestRunnerProps {
  language: Language
  onSaveMetrics: (wpm: number, varianceMs: number) => void
  onDone: () => void
  doneLabel?: string
}

interface TypingTestModalProps {
  language: Language
  onClose: () => void
  onSaveMetrics: (wpm: number, varianceMs: number) => void
}

const PROMPT_TEXT =
  'Steady breathing and calm focus keep my mind balanced throughout a busy day.'

export function TypingTestRunner({
  language,
  onSaveMetrics,
  onDone,
  doneLabel,
}: TypingTestRunnerProps) {
  const isHi = language === 'hi'
  const [typed, setTyped] = useState('')
  const [completed, setCompleted] = useState(false)
  const [wpm, setWpm] = useState(0)
  const [varianceMs, setVarianceMs] = useState(0)
  const [meanIntervalMs, setMeanIntervalMs] = useState(0)
  const [accuracyPct, setAccuracyPct] = useState(100)
  const [corrections, setCorrections] = useState(0)

  const startTimeRef = useRef<number | null>(null)
  const keyTimesRef = useRef<number[]>([])
  const backspaceCountRef = useRef(0)

  const handleChange = (val: string) => {
    const now = performance.now()
    if (!startTimeRef.current && val.length > 0) {
      startTimeRef.current = now
    }
    if (val.length < typed.length) {
      backspaceCountRef.current += 1
      setCorrections(backspaceCountRef.current)
    }
    keyTimesRef.current.push(now)
    setTyped(val)

    // Compute live character accuracy
    let matchingChars = 0
    for (let i = 0; i < val.length; i++) {
      if (val[i] === PROMPT_TEXT[i]) matchingChars += 1
    }
    const acc = val.length > 0 ? Math.round((matchingChars / val.length) * 100) : 100
    setAccuracyPct(acc)

    if (val.length >= PROMPT_TEXT.length) {
      const elapsedMin = Math.max(0.05, (now - (startTimeRef.current || now)) / 60000)
      const words = Math.max(1, val.trim().split(/\s+/).length)
      const calcWpm = Math.round(words / elapsedMin)

      const intervals: number[] = []
      for (let i = 1; i < keyTimesRef.current.length; i++) {
        const diff = keyTimesRef.current[i] - keyTimesRef.current[i - 1]
        if (diff > 20 && diff < 1200) intervals.push(diff)
      }
      const mean =
        intervals.length > 0
          ? intervals.reduce((a, b) => a + b, 0) / intervals.length
          : 185
      const variance = Math.round(
        Math.sqrt(
          intervals.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) /
            Math.max(1, intervals.length)
        )
      )

      const finalVariance = Math.max(18, variance || 34)
      setMeanIntervalMs(Math.round(mean))
      setWpm(calcWpm)
      setVarianceMs(finalVariance)
      setCompleted(true)
      onSaveMetrics(calcWpm, finalVariance)
    }
  }

  const handleReset = () => {
    setTyped('')
    setCompleted(false)
    setWpm(0)
    setVarianceMs(0)
    setMeanIntervalMs(0)
    setAccuracyPct(100)
    setCorrections(0)
    startTimeRef.current = null
    keyTimesRef.current = []
    backspaceCountRef.current = 0
  }

  const progressPct = Math.min(100, Math.round((typed.length / PROMPT_TEXT.length) * 100))

  const strainTier =
    varianceMs > 65 || corrections >= 6
      ? {
          label: isHi ? 'उच्च तनाव संकेत' : 'Elevated Strain',
          desc: isHi
            ? 'कीस्ट्रोक अंतराल में उच्च उतार-चढ़ाव मानसिक थकान दर्शाता है।'
            : 'Higher timing jitter suggests mental fatigue or sympathetic tension.',
        }
      : varianceMs > 45 || corrections >= 3
        ? {
            label: isHi ? 'मध्यम संज्ञानात्मक भार' : 'Moderate Load',
            desc: isHi
              ? 'हल्का कीस्ट्रोक विचलन; 2 मिनट का ब्रीदिंग विराम सहायक होगा।'
              : 'Mild cadence irregularity; a short breathing pause helps steady focus.',
          }
        : {
            label: isHi ? 'संतुलित और शांत' : 'Balanced & Calm',
            desc: isHi
              ? 'स्थिर कीस्ट्रोक लय और उच्च सटीकता शांत ध्यान दर्शाती है।'
              : 'Consistent inter-key flight times reflect steady cognitive focus.',
          }

  return (
    <div className="space-y-4">
      <div className="rounded-[18px] clay-well p-4 text-sm leading-relaxed font-medium select-none">
        {PROMPT_TEXT.split('').map((ch, idx) => {
          const entered = typed[idx]
          const cls =
            entered === undefined
              ? 'opacity-75'
              : entered === ch
                ? 'text-[#246A49] dark:text-[#8EE0B6] font-semibold'
                : 'text-[#BF2B24] dark:text-[#FF8E88] underline'
          return (
            <span key={idx} className={cls}>
              {ch}
            </span>
          )
        })}
      </div>

      <input
        type="text"
        value={typed}
        onChange={(e) => handleChange(e.target.value)}
        disabled={completed}
        placeholder={
          isHi
            ? 'ऊपर दिया गया वाक्य स्वाभाविक गति से टाइप करें...'
            : 'Type the sentence above at your natural pace...'
        }
        className="w-full h-[46px] rounded-[16px] clay-input border-0 px-4 text-sm"
      />

      <div className="space-y-1">
        <div className="flex justify-between text-[11px] font-mono-num opacity-75">
          <span>
            {isHi ? 'सटीकता' : 'Accuracy'}: {accuracyPct}% · {isHi ? 'सुधार' : 'Corrections'}: {corrections}
          </span>
          <span>{progressPct}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full clay-well overflow-hidden p-0.5">
          <div
            className="h-full rounded-full clay-bar-emerald transition-all duration-150"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {completed && (
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded-[16px] clay-tile p-3">
              <span className="text-[10px] opacity-75 block">{isHi ? 'गति' : 'Speed'}</span>
              <span className="text-lg font-bold font-mono-num">{wpm} WPM</span>
            </div>
            <div className="rounded-[16px] clay-tile p-3">
              <span className="text-[10px] opacity-75 block">{isHi ? 'वेरिएंस (SD)' : 'Variance'}</span>
              <span className="text-lg font-bold font-mono-num">{varianceMs} ms</span>
            </div>
            <div className="rounded-[16px] clay-tile p-3">
              <span className="text-[10px] opacity-75 block">{isHi ? 'औसत अंतराल' : 'Mean Gap'}</span>
              <span className="text-lg font-bold font-mono-num">{meanIntervalMs} ms</span>
            </div>
            <div className="rounded-[16px] clay-tile p-3">
              <span className="text-[10px] opacity-75 block">{isHi ? 'स्थिति' : 'State'}</span>
              <span className="text-xs font-bold block mt-1 text-[#344932] dark:text-[#A8C6A4]">
                {strainTier.label}
              </span>
            </div>
          </div>

          <div className="rounded-[16px] clay-card-tint px-4 py-3 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{strainTier.desc}</span>
            </div>
          </div>
        </div>
      )}

      {/* How Keystroke Analysis Reads Your Condition */}
      <div className="rounded-[16px] clay-well p-3.5 text-xs space-y-1.5">
        <div className="font-bold inline-flex items-center gap-1.5 text-[#344932] dark:text-[#A8C6A4]">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>
            {isHi
              ? 'कीस्ट्रोक विश्लेषण आपकी स्थिति कैसे पढ़ता है?'
              : 'How Keystroke Analysis Reads Your Condition'}
          </span>
        </div>
        <ul className="space-y-1 text-[11px] opacity-85 list-disc pl-4">
          <li>
            {isHi
              ? 'फ्लाइट वेरिएंस (ms): कुंजियों के बीच समय में उतार-चढ़ाव तनाव और संज्ञानात्मक थकान मापता है।'
              : 'Flight Variance (ms): Measures millisecond timing rhythm shifts linked to mental fatigue or anxiety.'}
          </li>
          <li>
            {isHi
              ? 'टाइपिंग गति व सुधार: बैकस्पेस और गति में बदलाव एकाग्रता और मन की स्थिरता दर्शाते हैं।'
              : 'Pace & Corrections: Sudden bursts or extra backspaces signal elevated cognitive strain.'}
          </li>
        </ul>
      </div>

      <div className="flex items-center justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={handleReset}
          className="clay-btn-secondary inline-flex items-center gap-1.5 px-4 h-[42px] rounded-[14px] text-xs font-semibold cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isHi ? 'पुनः प्रयास' : 'Retry'}</span>
        </button>
        <button
          type="button"
          onClick={onDone}
          className="clay-btn-primary px-5 h-[42px] rounded-[14px] text-xs font-semibold cursor-pointer"
        >
          {doneLabel ?? (isHi ? 'पूर्ण' : 'Done')}
        </button>
      </div>
    </div>
  )
}

export function TypingTestModal({ language, onClose, onSaveMetrics }: TypingTestModalProps) {
  const isHi = language === 'hi'

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0E150E]/55 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-[28px] clay-modal overflow-hidden"
      >
        <div className="px-6 py-4 clay-card-tint flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-[11px] clay-orb-sage text-white flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </span>
            <h3 className="font-display text-base font-bold">
              {isHi ? 'कीस्ट्रोक ताल परीक्षण' : 'Typing & Cognitive Load Analysis'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="clay-btn-secondary p-2 rounded-[11px] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <TypingTestRunner
            language={language}
            onSaveMetrics={onSaveMetrics}
            onDone={onClose}
          />
        </div>
      </motion.div>
    </div>
  )
}
