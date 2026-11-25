import {
  Activity,
  Bot,
  ClipboardCheck,
  Dna,
  Heart,
  Keyboard,
  Moon,
  Phone,
  ShieldAlert,
  Smile,
  Watch,
  Wind,
} from 'lucide-react'
import { motion } from 'framer-motion'
import type { Language, TabId, UserAccount, WearableConnection, WearableReading } from '../types'
import { StressDetectionCard } from './StressDetectionCard'
import { WearableConnectPanel } from './WearableConnectPanel'

interface HomeTabProps {
  account: UserAccount
  language: Language
  onOpenCheck: () => void
  onOpenTypingTest: () => void
  onOpenVoiceCheck: () => void
  onOpenBreathing: () => void
  onOpenChat: () => void
  onOpenSafety: () => void
  onNavigateTab: (tab: TabId) => void
  onSetHasWearable: (hasWearable: boolean) => void
  onUpsertWearable: (connection: WearableConnection) => void
  onRemoveWearable: (wearableId: string) => void
  onApplyWearableReading: (reading: WearableReading, deviceName: string) => void
}

export function HomeTab({
  account,
  language,
  onOpenCheck,
  onOpenTypingTest,
  onOpenVoiceCheck,
  onOpenBreathing,
  onOpenChat,
  onOpenSafety,
  onNavigateTab,
  onSetHasWearable,
  onUpsertWearable,
  onRemoveWearable,
  onApplyWearableReading,
}: HomeTabProps) {
  const isHi = language === 'hi'
  const firstName = account.name.split(' ')[0] || account.name
  const wearables = account.wearables || []
  const syncedWearable = wearables.find((w) => w.connected && w.latestReading)
  const heartBpm = syncedWearable?.latestReading?.restingHrBpm ?? 72
  const loadMs = account.factors.typingVarianceMs
  const stressText =
    account.latestAssessment?.stressRating !== undefined
      ? `${account.latestAssessment.stressRating}/10`
      : account.factors.stress
  const sleepHours = syncedWearable?.latestReading?.sleepHours ?? account.factors.sleepHours

  return (
    <div className="space-y-6">
      {/* Sample Card 2: Good Morning + 2x2 Metrics + Mental Health Tip + Quick Action Tiles */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-[30px] sample-pastel-sky p-6 sm:p-7 space-y-5 border border-white/75 dark:border-white/10"
      >
        {/* Top Greeting Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="w-12 h-12 rounded-full bg-[#FFE699] text-[#7D5200] shadow-md flex items-center justify-center shrink-0">
              <Smile className="w-6 h-6" />
            </span>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#344932] dark:text-[#A8C6A4]">
                {isHi
                  ? 'Emotion DNA — व्यक्ति की विशिष्ट भावनात्मक समझ'
                  : 'Emotion DNA — Understand the individual.'}
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                {isHi ? `सुप्रभात, ${firstName}` : `Good Morning, ${firstName}`}
              </h2>
              <p className="text-xs opacity-75 mt-0.5">
                {isHi
                  ? `वेलनेस स्कोर: ${account.wellnessScore}/100`
                  : `Wellness Score: ${account.wellnessScore}/100`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenCheck}
            className="clay-btn-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold cursor-pointer"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>{isHi ? 'मानसिक जांच शुरू करें' : 'Start Mental Check'}</span>
          </button>
        </div>

        {/* 2x2 Vital Metric Cards matching Sample Card 2 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="rounded-[20px] clay-tile p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold opacity-75">
              <Heart className="w-3.5 h-3.5 text-[#C94B5A]" />
              <span>{isHi ? 'हृदय गति' : 'Heart'}</span>
            </div>
            <div className="mt-2 text-2xl font-bold font-mono-num">{heartBpm}</div>
            <div className="text-[10px] opacity-65 mt-0.5">BPM</div>
          </div>

          <div className="rounded-[20px] clay-tile p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold opacity-75">
              <Keyboard className="w-3.5 h-3.5 text-[#4E6B4B] dark:text-[#A8C6A4]" />
              <span>{isHi ? 'भार' : 'Load'}</span>
            </div>
            <div className="mt-2 text-2xl font-bold font-mono-num">{loadMs}</div>
            <div className="text-[10px] opacity-65 mt-0.5">ms cadence</div>
          </div>

          <div className="rounded-[20px] clay-tile p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold opacity-75">
              <Activity className="w-3.5 h-3.5 text-[#648461] dark:text-[#A8C6A4]" />
              <span>{isHi ? 'तनाव' : 'Stress'}</span>
            </div>
            <div className="mt-2 text-2xl font-bold font-mono-num">{stressText}</div>
            <div className="text-[10px] opacity-65 mt-0.5">{account.factors.stress}</div>
          </div>

          <div className="rounded-[20px] clay-tile p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold opacity-75">
              <Moon className="w-3.5 h-3.5 text-[#344932] dark:text-[#A8C6A4]" />
              <span>{isHi ? 'नींद' : 'Sleep'}</span>
            </div>
            <div className="mt-2 text-2xl font-bold font-mono-num">{sleepHours.toFixed(1)}</div>
            <div className="text-[10px] opacity-65 mt-0.5">hrs</div>
          </div>
        </div>

        {/* Today's Mental Health Tip */}
        <div className="rounded-[20px] bg-white/70 dark:bg-[#192819]/85 px-5 py-3.5 text-center border border-white/80 dark:border-white/10">
          <div className="text-xs font-bold text-[#344932] dark:text-[#A8C6A4]">
            {isHi ? 'आज का मानसिक स्वास्थ्य सुझाव' : "Today's Mental Health Tip"}
          </div>
          <p className="text-xs sm:text-sm opacity-85 mt-1">
            {isHi
              ? 'छोटी-छोटी अच्छी बातों की सराहना करने के लिए कुछ शांत पल निकालें।'
              : 'Take a moment to appreciate the little things and breathe gently.'}
          </p>
        </div>

        {/* 3 Square Quick Action Tiles matching Sample Card 2 bottom */}
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={onOpenBreathing}
            className="rounded-[18px] clay-tile clay-card-interactive p-3.5 flex flex-col items-center gap-2 cursor-pointer"
          >
            <span className="w-10 h-10 rounded-[13px] clay-orb-sage text-white flex items-center justify-center">
              <Wind className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold">{isHi ? 'ब्रीदिंग' : 'Breathe'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenCheck}
            className="rounded-[18px] clay-tile clay-card-interactive p-3.5 flex flex-col items-center gap-2 cursor-pointer"
          >
            <span className="w-10 h-10 rounded-[13px] clay-orb-sage text-white flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold">{isHi ? 'मानसिक जांच' : 'Mental Check'}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('explore')}
            className="rounded-[18px] clay-tile clay-card-interactive p-3.5 flex flex-col items-center gap-2 cursor-pointer"
          >
            <span className="w-10 h-10 rounded-[13px] clay-orb-sage text-white flex items-center justify-center">
              <Dna className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold">{isHi ? 'इमोशन DNA' : 'Emotion DNA'}</span>
          </button>
        </div>
      </motion.section>

      {/* Real-Time Mood Detection & Biomarker Triggers (Sample Card 3) */}
      <StressDetectionCard
        account={account}
        language={language}
        onOpenTypingTest={onOpenTypingTest}
        onOpenVoiceCheck={onOpenVoiceCheck}
        onOpenBreathing={onOpenBreathing}
      />

      {/* Wearables Section Separated from Mental Check — Positioned Downward in Workspace */}
      <section id="wearables-section" className="scroll-mt-8 rounded-[28px] clay-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-[12px] clay-orb-sage text-white flex items-center justify-center shrink-0">
              <Watch className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold">
                {isHi ? 'वियरेबल्स और ब्लूटूथ' : 'Wearables & Bluetooth'}
              </h3>
            </div>
          </div>
        </div>

        <WearableConnectPanel
          wearables={wearables}
          hasWearable={account.hasWearable}
          onSetHasWearable={onSetHasWearable}
          language={language}
          onUpsertWearable={onUpsertWearable}
          onRemoveWearable={onRemoveWearable}
          onApplyToCheckIn={onApplyWearableReading}
        />
      </section>

      {/* Compact Safety Support Bar */}
      <section className="rounded-[24px] clay-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#BF2B24] dark:text-[#FF8E88]">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{isHi ? '24/7 गोपनीय सहायता' : '24/7 Crisis & Grounding Support'}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="tel:14416"
            className="clay-btn-danger h-9 px-3.5 rounded-[12px] text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{isHi ? 'हेल्पलाइन 14416' : 'Call 14416'}</span>
          </a>
          <button
            type="button"
            onClick={onOpenChat}
            className="clay-btn-secondary h-9 px-3.5 rounded-[12px] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>{isHi ? 'चैट बॉट' : 'Chat Bot'}</span>
          </button>
          <button
            type="button"
            onClick={onOpenSafety}
            className="clay-btn-secondary h-9 px-3.5 rounded-[12px] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#BF2B24]" />
            <span>{isHi ? 'आपातकाल' : 'Emergency Help'}</span>
          </button>
        </div>
      </section>
    </div>
  )
}
