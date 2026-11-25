import { useEffect, useState } from 'react'
import { Pause, Play, RotateCcw, X } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Language } from '../types'

interface BreathingModalProps {
  language: Language
  onClose: () => void
}

const PHASES = [
  { label: 'Inhale', labelHi: 'सांस लें', seconds: 4, scale: 1.24 },
  { label: 'Hold', labelHi: 'रोकें', seconds: 4, scale: 1.24 },
  { label: 'Exhale', labelHi: 'सांस छोड़ें', seconds: 4, scale: 0.9 },
  { label: 'Rest', labelHi: 'विश्राम', seconds: 4, scale: 0.9 },
]

export function BreathingModal({ language, onClose }: BreathingModalProps) {
  const isHi = language === 'hi'
  const [running, setRunning] = useState(true)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [phaseSec, setPhaseSec] = useState(4)
  const [totalSeconds, setTotalSeconds] = useState(120)

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => {
      setTotalSeconds((t) => Math.max(0, t - 1))
      setPhaseSec((prev) => {
        if (prev > 1) return prev - 1
        setPhaseIdx((cur) => (cur + 1) % PHASES.length)
        return 4
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [running])

  const phase = PHASES[phaseIdx]
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const ss = String(totalSeconds % 60).padStart(2, '0')

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0E150E]/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-[34px] sample-lavender-halo text-white overflow-hidden shadow-2xl border border-white/25"
      >
        <div className="px-6 pt-5 pb-2 flex items-center justify-between">
          <span className="text-xs font-semibold opacity-80">{isHi ? '2-मिनट सत्र' : '2-Min Session'}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pb-8 pt-2 text-center space-y-6">
          <h3 className="font-display text-2xl font-bold tracking-tight">
            {isHi ? 'ब्रीदिंग मोड' : 'Breathing Mode'}
          </h3>

          {/* Luminous Concentric Glow Halo Ring (Sample Card 4) */}
          <div className="py-6 flex items-center justify-center">
            <motion.div
              animate={{ scale: running ? phase.scale : 1 }}
              transition={{ duration: 1.8, ease: 'easeInOut' }}
              className="w-44 h-44 rounded-full bg-white/20 border-2 border-white/45 shadow-[0_0_50px_rgba(255,255,255,0.4)] flex items-center justify-center"
            >
              <div className="w-32 h-32 rounded-full bg-white/25 border border-white/55 flex flex-col items-center justify-center">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {isHi ? phase.labelHi : phase.label}
                </span>
                <span className="text-lg font-mono-num font-bold mt-0.5">{phaseSec}s</span>
              </div>
            </motion.div>
          </div>

          {/* Bold Digital Countdown Timer */}
          <div className="font-mono-num text-3xl font-bold tracking-wider">
            {mm}:{ss}
          </div>

          {/* Centered Circular Pause/Play & Reset */}
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                setPhaseIdx(0)
                setPhaseSec(4)
                setTotalSeconds(120)
              }}
              aria-label="Reset breathing timer"
              className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setRunning((r) => !r)}
              aria-label={running ? 'Pause breathing' : 'Resume breathing'}
              className="w-14 h-14 rounded-full bg-white text-[#344932] shadow-lg hover:scale-105 transition-transform flex items-center justify-center cursor-pointer"
            >
              {running ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
