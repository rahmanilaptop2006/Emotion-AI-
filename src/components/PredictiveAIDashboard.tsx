import { BrainCircuit, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Language, UserAccount } from '../types'

interface PredictiveAIDashboardProps {
  account: UserAccount
  language: Language
  onOpenPatch: () => void
  onOpenBreathing: () => void
}

export function PredictiveAIDashboard({
  account,
  language,
  onOpenPatch,
  onOpenBreathing,
}: PredictiveAIDashboardProps) {
  const isHi = language === 'hi'
  const { wellnessScore, factors, patch } = account

  const predictedNext48h = Math.min(98, Math.max(40, wellnessScore + (factors.sleepHours >= 7 ? 5 : -4)))
  const burnoutRisk =
    factors.stress === 'High'
      ? isHi
        ? 'मध्यम-उच्च (सतर्क)'
        : 'Elevated Watch'
      : factors.stress === 'Medium'
        ? isHi
          ? 'संतुलित (हल्का भार)'
          : 'Moderate Equilibrium'
        : isHi
          ? 'न्यूनतम (स्थिर)'
          : 'Low Strain'

  const series = [
    wellnessScore - 4,
    wellnessScore - 2,
    wellnessScore,
    Math.round((wellnessScore + predictedNext48h) / 2),
    predictedNext48h,
  ]

  const width = 320
  const height = 84
  const minVal = 40
  const maxVal = 100
  const points = series
    .map((val, idx) => {
      const x = (idx / (series.length - 1)) * (width - 16) + 8
      const y = height - ((val - minVal) / (maxVal - minVal)) * (height - 20) - 10
      return `${x},${y}`
    })
    .join(' ')

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="rounded-[26px] clay-card p-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#496346] dark:text-[#98B495]">
            <BrainCircuit className="w-4 h-4" />
            <span>{isHi ? 'प्रेडिक्टिव एआई वेलनेस मॉडल' : 'Predictive AI Resilience Forecast'}</span>
          </div>

          <h3 className="font-display text-xl font-bold text-[#1B251A] dark:text-[#E5E8CE] tracking-tight">
            {isHi
              ? `अगले 48 घंटों का पूर्वानुमान: ${predictedNext48h}/100`
              : `48-Hour Stability Forecast: ${predictedNext48h}/100`}
          </h3>

          <p className="text-sm text-[#495847] dark:text-[#A8B7A4] leading-relaxed">
            {isHi
              ? `वर्तमान नींद (${factors.sleepHours}h) और टाइपिंग ताल के आधार पर स्वायत्त तनाव स्तर '${burnoutRisk}' श्रेणी में है।`
              : `Based on sleep recovery (${factors.sleepHours}h) and keystroke rhythm (${factors.typingWpm} WPM), autonomic load sits in "${burnoutRisk}".`}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onOpenBreathing}
              className="clay-btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[14px] text-xs font-semibold cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isHi ? '2-मिनट बॉक्स ब्रीदिंग' : '2-Min Nervous System Reset'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenPatch}
              className="clay-btn-secondary inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[14px] text-xs font-semibold cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#496346] dark:text-[#98B495]" />
              <span>
                {isHi
                  ? `पैच दर: ${patch.infusionRateMcgHr} mcg/hr`
                  : `Patch Infusion: ${patch.infusionRateMcgHr} mcg/hr`}
              </span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-[20px] clay-well p-4">
          <div className="flex items-center justify-between text-xs font-medium text-[#495847] dark:text-[#A8B7A4] mb-2">
            <span className="inline-flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#496346] dark:text-[#98B495]" />
              <span>{isHi ? 'वेलनेस ट्रेंड (48h)' : 'Trajectory Curve (Now → +48h)'}</span>
            </span>
            <span className="font-bold font-mono-num text-[#1B251A] dark:text-[#E5E8CE]">
              {wellnessScore} → {predictedNext48h}
            </span>
          </div>

          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible" aria-label="48-hour forecast curve">
            <polyline
              fill="none"
              stroke="#789575"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
            {series.map((val, idx) => {
              const x = (idx / (series.length - 1)) * (width - 16) + 8
              const y = height - ((val - minVal) / (maxVal - minVal)) * (height - 20) - 10
              return (
                <circle
                  key={idx}
                  cx={x}
                  cy={y}
                  r={idx === series.length - 1 ? 5.5 : 4}
                  fill={idx === series.length - 1 ? '#1B251A' : '#789575'}
                  stroke="#E5E8CE"
                  strokeWidth="2"
                />
              )
            })}
          </svg>

          <div className="flex justify-between text-[11px] text-[#495847] dark:text-[#A8B7A4] mt-1 font-mono-num">
            <span>-24h</span>
            <span>Now</span>
            <span>+24h</span>
            <span>+48h Forecast</span>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
