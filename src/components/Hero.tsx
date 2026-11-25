import type { ReactNode } from 'react'
import { Watch } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Language } from '../types'

interface HeroProps {
  language: Language
  onStartCheck: () => void
  onOpenEmotion: () => void
  onOpenWearables: () => void
  topBar?: ReactNode
}

export function Hero({
  language,
  onStartCheck,
  onOpenEmotion,
  onOpenWearables,
  topBar,
}: HeroProps) {
  return (
    <section
      id="top"
      className="relative w-full h-screen min-h-[680px] overflow-hidden flex flex-col"
    >
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src={`${import.meta.env.BASE_URL}hero.mp4`}
        autoPlay
        muted
        loop
        playsInline
      />

      {/* Subtle atmospheric overlays */}
      <div className="absolute inset-0 bg-[#162015]/10" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(229, 232, 206, 0.22) 0%, transparent 24%, transparent 58%, rgba(20, 29, 19, 0.38) 100%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, rgba(22, 32, 21, 0.08) 0%, transparent 18%, transparent 82%, rgba(22, 32, 21, 0.08) 100%)',
        }}
      />

      {/* Fixed-in-place 3-row Glassmorphism Bar (only inside Hero, does not flow across dashboards) */}
      {topBar}

      {/* Centered Vision thought + vertically stacked tactile claymorphic CTA buttons */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-5 sm:px-6 pb-8 gap-5">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          aria-label={language === 'hi' ? 'EMOTION AI विज़न' : 'EMOTION AI Vision'}
          className="glass-morphism-bar max-w-lg sm:max-w-xl rounded-[22px] px-5 py-3.5 text-xs sm:text-sm font-medium leading-relaxed text-[#1B251A] dark:text-[#E5E8CE] text-balance shadow-lg"
        >
          Our vision is to build an AI-driven mental health ecosystem that understands the mind like
          a doctor, supports like a therapist, heals like Ayurveda, and protects like a friend.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
          className="flex flex-col items-center justify-center gap-3 w-full max-w-[230px]"
        >
          <button
            type="button"
            onClick={onStartCheck}
            className="w-full clay-btn-primary px-6 py-3 rounded-[16px] text-sm font-semibold cursor-pointer whitespace-nowrap"
          >
            {language === 'hi' ? 'मानसिक जांच शुरू करें' : 'Start Mental Check'}
          </button>
          <button
            type="button"
            onClick={onOpenEmotion}
            className="w-full clay-btn-secondary px-6 py-3 rounded-[16px] text-sm font-semibold cursor-pointer whitespace-nowrap"
          >
            {language === 'hi' ? 'इमोशन (Emotion)' : 'Emotion'}
          </button>
          <button
            type="button"
            onClick={onOpenWearables}
            className="w-full clay-btn-secondary px-6 py-3 rounded-[16px] text-sm font-semibold cursor-pointer whitespace-nowrap inline-flex items-center justify-center gap-2"
          >
            <Watch className="w-4 h-4 shrink-0 text-[#344932] dark:text-[#A8C6A4]" />
            <span>{language === 'hi' ? 'वियरेबल्स जोड़ें' : 'Wearables'}</span>
          </button>
        </motion.div>
      </div>
    </section>
  )
}
