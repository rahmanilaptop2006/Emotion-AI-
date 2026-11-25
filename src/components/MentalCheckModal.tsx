import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bot,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Compass,
  Frown,
  Globe,
  Headphones,
  HeartHandshake,
  HelpCircle,
  Info,
  Keyboard,
  Laugh,
  Lock,
  Meh,
  Mic,
  Moon,
  Phone,
  Play,
  Search,
  ShieldAlert,
  Smile,
  Sparkles,
  Watch,
  Wind,
  X,
} from 'lucide-react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import {
  SCREENING_INSTRUMENTS,
  buildCalmPlanRecommendations,
  computeCompositeWellnessScore,
  deriveRelaxationProfile,
  getSuggestedSoundTherapy,
  scoreGAD7,
  scorePHQ9,
  scorePSS10,
  scoreWHO5,
} from '../services/assessments'
import type {
  AssessmentResultSnapshot,
  AssessmentToolId,
  DailyCheckInMood,
  FunctionalImpactLevel,
  GuidedActivityId,
  Language,
  RelaxationProfile,
  SleepQuality,
  StressorContext,
  TriggerDetectiveEntry,
  UserAccount,
} from '../types'
import type { GuidedTherapyMode } from './GuidedTherapyModal'
import { TypingTestRunner } from './TypingTestModal'
import { VoiceBiomarkerRunner } from './VoiceBiomarkerModal'

export type CheckModalStartStep =
  | 'consent'
  | 'checkin'
  | 'typing'
  | 'voice'
  | 'trigger_detective'
  | 'assessment'
  | 'results'
  | 'profile'
  | 'plan'

interface MentalCheckModalProps {
  account: UserAccount
  language: Language
  initialStep?: CheckModalStartStep
  onClose: () => void
  onToggleLanguage: () => void
  onSavePrivacyConsent: (accepted: boolean) => void
  onSaveFullAssessment: (
    snapshot: AssessmentResultSnapshot,
    wellnessScore: number,
    profile: RelaxationProfile
  ) => void
  onSaveRelaxationProfile: (profile: RelaxationProfile) => void
  onSaveTypingMetrics: (wpm: number, varianceMs: number) => void
  onSaveVoiceLevel: (level: 'Low' | 'Mild' | 'Moderate' | 'Elevated') => void
  onSaveTriggerEntry: (entry: Omit<TriggerDetectiveEntry, 'id' | 'timestamp' | 'date'>) => void
  onOpenBreathing: () => void
  onOpenGuidedTherapy: (mode: GuidedTherapyMode) => void
  onOpenSoundTherapy?: () => void
  onOpenChat: () => void
  onOpenSafety: () => void
}

type FlowStage =
  | 'consent'
  | 'checkin'
  | 'typing'
  | 'voice'
  | 'trigger_detective'
  | 'select_tools'
  | 'questions'
  | 'results'
  | 'profile'
  | 'plan'

const MOOD_OPTIONS: {
  value: DailyCheckInMood
  label: string
  labelHi: string
  icon: typeof Smile
}[] = [
  { value: 'Very Low', label: 'Very Low', labelHi: 'बहुत कम', icon: Frown },
  { value: 'Low', label: 'Low', labelHi: 'कम', icon: Frown },
  { value: 'Okay', label: 'Okay', labelHi: 'ठीक', icon: Meh },
  { value: 'Good', label: 'Good', labelHi: 'अच्छा', icon: Smile },
  { value: 'Great', label: 'Great', labelHi: 'बहुत अच्छा', icon: Laugh },
]

const SLEEP_OPTIONS: { value: SleepQuality; label: string; labelHi: string }[] = [
  { value: 'Poor', label: 'Poor', labelHi: 'खराब' },
  { value: 'Okay', label: 'Okay', labelHi: 'ठीक' },
  { value: 'Good', label: 'Good', labelHi: 'अच्छी' },
  { value: 'Excellent', label: 'Excellent', labelHi: 'उत्कृष्ट' },
]

const CONTEXT_OPTIONS: { value: StressorContext; label: string; labelHi: string }[] = [
  { value: 'Study', label: 'Study', labelHi: 'पढ़ाई' },
  { value: 'Work', label: 'Work', labelHi: 'काम' },
  { value: 'Health', label: 'Health', labelHi: 'स्वास्थ्य' },
  { value: 'Other', label: 'Other', labelHi: 'अन्य' },
]

const IMPACT_OPTIONS: { value: FunctionalImpactLevel; label: string; labelHi: string }[] = [
  { value: 'Not difficult', label: 'Not difficult at all', labelHi: 'बिल्कुल कठिन नहीं' },
  { value: 'Somewhat difficult', label: 'Some difficulty in daily activities', labelHi: 'दैनिक कार्यों में थोड़ी कठिनाई' },
  { value: 'Very difficult', label: 'Very difficult to manage tasks', labelHi: 'कार्यों को संभालना बहुत कठिन' },
  { value: 'Extremely difficult', label: 'Extremely difficult daily functioning', labelHi: 'दैनिक कार्य अत्यंत कठिन' },
]

const ACTIVITY_DETAILS: Record<
  GuidedActivityId,
  {
    title: string
    titleHi: string
    duration: string
    subtitle: string
    subtitleHi: string
    icon: typeof Wind
  }
> = {
  breathing: {
    title: 'Gentle Paced Breathing',
    titleHi: 'सौम्य लयबद्ध ब्रीदिंग',
    duration: '2–5 min',
    subtitle: 'Visual 4-4-4-4 inhale-hold-exhale vagal reset',
    subtitleHi: 'तनाव कम करने के लिए विज़ुअल श्वास मार्गदर्शिका',
    icon: Wind,
  },
  pmr: {
    title: 'Progressive Muscle Relaxation',
    titleHi: 'प्रगतिशील मांसपेशी विश्राम',
    duration: '5–10 min',
    subtitle: 'Guided tension-and-release across 5 muscle groups',
    subtitleHi: '5 मांसपेशी समूहों में तनाव-मुक्ति अभ्यास',
    icon: Sparkles,
  },
  imagery: {
    title: 'Guided Imagery',
    titleHi: 'निर्देशित शांत कल्पना',
    duration: '5–10 min',
    subtitle: 'Serene nature scenes paired with calming Web Audio',
    subtitleHi: 'प्रकृति ध्वनि के साथ शांत मानसिक दृश्य',
    icon: Headphones,
  },
  mindfulness: {
    title: 'Mindfulness Practice',
    titleHi: 'माइंडफुलनेस अभ्यास',
    duration: '5 min',
    subtitle: 'Present-moment breath anchor & thought unhooking',
    subtitleHi: 'वर्तमान क्षण और सांस पर शांत एकाग्रता',
    icon: Compass,
  },
}

export function MentalCheckModal({
  account,
  language,
  initialStep,
  onClose,
  onToggleLanguage,
  onSavePrivacyConsent,
  onSaveFullAssessment,
  onSaveRelaxationProfile,
  onSaveTypingMetrics,
  onSaveVoiceLevel,
  onSaveTriggerEntry,
  onOpenBreathing,
  onOpenGuidedTherapy,
  onOpenSoundTherapy,
  onOpenChat,
  onOpenSafety,
}: MentalCheckModalProps) {
  const isHi = language === 'hi'
  const wearables = account.wearables || []
  const primaryActiveWearable = wearables.find((w) => w.connected && w.regularTrackingEnabled && w.latestReading)

  const resolveInitialStage = (): FlowStage => {
    if (initialStep === 'typing') return 'typing'
    if (initialStep === 'voice') return 'voice'
    if (initialStep === 'trigger_detective') return 'trigger_detective'
    if (initialStep === 'assessment') return 'select_tools'
    if (initialStep === 'results' && account.latestAssessment) return 'results'
    if (initialStep === 'profile') return 'profile'
    if (initialStep === 'plan' && account.latestAssessment) return 'plan'
    if (initialStep === 'checkin') return 'checkin'
    return account.privacyConsentAccepted ? 'checkin' : 'consent'
  }

  const [stage, setStage] = useState<FlowStage>(resolveInitialStage)
  const [previousStage, setPreviousStage] = useState<FlowStage>('checkin')
  const [consentChecked, setConsentChecked] = useState(Boolean(account.privacyConsentAccepted))
  const [showLearnMore, setShowLearnMore] = useState(false)
  const [typingCheckedInSession, setTypingCheckedInSession] = useState(false)
  const [voiceCheckedInSession, setVoiceCheckedInSession] = useState(false)
  const [tdSavedCount, setTdSavedCount] = useState(account.triggerLogs?.length || 0)
  const [tdSituation, setTdSituation] = useState('')
  const [tdEmotion, setTdEmotion] = useState<TriggerDetectiveEntry['emotion']>('Overwhelmed')
  const [tdBodyCue, setTdBodyCue] = useState('Tight shoulders & fast heartbeat')
  const [tdThought, setTdThought] = useState('')
  const [tdReframe, setTdReframe] = useState('')
  const [tdIntensity, setTdIntensity] = useState(6)
  const [tdFlash, setTdFlash] = useState(false)
  const [typingSummary, setTypingSummary] = useState<{ wpm: number; varianceMs: number }>({
    wpm: account.factors.typingWpm,
    varianceMs: account.factors.typingVarianceMs,
  })
  const [voiceSummary, setVoiceSummary] = useState<'Low' | 'Mild' | 'Moderate' | 'Elevated'>(
    account.factors.voiceStress
  )

  // Step 2: Daily check-in state
  const [dailyMood, setDailyMood] = useState<DailyCheckInMood>(
    account.latestAssessment?.dailyMood ?? 'Okay'
  )
  const [stressRating, setStressRating] = useState<number>(
    account.latestAssessment?.stressRating ?? (account.factors.stress === 'High' ? 7 : account.factors.stress === 'Medium' ? 4 : 2)
  )
  const [sleepQuality, setSleepQuality] = useState<SleepQuality>(
    account.latestAssessment?.sleepQuality ?? (account.factors.sleepHours >= 7 ? 'Good' : 'Okay')
  )
  const [sleepHours, setSleepHours] = useState<number>(
    primaryActiveWearable?.latestReading?.sleepHours ?? account.factors.sleepHours
  )
  const [affectedBy, setAffectedBy] = useState<StressorContext[]>(
    account.latestAssessment?.affectedBy ?? ['Study']
  )
  const [syncedWearableVitals] = useState<{
    hrBpm?: number
    hrvMs?: number
    steps?: number
    deviceName?: string
  }>({
    hrBpm: primaryActiveWearable?.latestReading?.restingHrBpm,
    hrvMs: primaryActiveWearable?.latestReading?.hrvMs,
    steps: primaryActiveWearable?.latestReading?.steps,
    deviceName: primaryActiveWearable?.deviceName,
  })

  // Step 3: Validated screening tools
  const [selectedTools, setSelectedTools] = useState<AssessmentToolId[]>(['phq9', 'gad7'])
  const [answers, setAnswers] = useState<Record<AssessmentToolId, number[]>>({
    phq9: Array(9).fill(-1),
    gad7: Array(7).fill(-1),
    who5: Array(5).fill(-1),
    pss10: Array(10).fill(-1),
  })
  const [functionalImpact, setFunctionalImpact] = useState<FunctionalImpactLevel>(
    account.latestAssessment?.functionalImpact ?? 'Somewhat difficult'
  )
  const [questionCursor, setQuestionCursor] = useState(0)
  const advanceTimerRef = useRef<number | null>(null)

  const clearPendingAdvance = () => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      clearPendingAdvance()
    }
  }, [])

  // Step 4/5/6 state
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [snapshot, setSnapshot] = useState<AssessmentResultSnapshot | null>(
    account.latestAssessment ?? null
  )
  const [profile, setProfile] = useState<RelaxationProfile>(
    account.relaxationProfile ?? {
      physicalTension: 'Moderate',
      busyThoughts: 'Moderate',
      breathingComfort: 'Moderate',
      sleepRelaxation: 'Needed',
      preferredAudio: 'Sound Baths',
      preferredAudioCategory: 'sound_baths',
      sessionDuration: '5–10 min',
    }
  )

  // Flattened question queue for selected instruments + functional impact
  const questionQueue = useMemo(() => {
    const list: { toolId: AssessmentToolId; itemIdx: number }[] = []
    selectedTools.forEach((toolId) => {
      const count = SCREENING_INSTRUMENTS[toolId].questionCount
      for (let i = 0; i < count; i += 1) {
        list.push({ toolId, itemIdx: i })
      }
    })
    return list
  }, [selectedTools])

  const totalQuestionSteps = questionQueue.length + 1 // +1 for Functional Impact step

  const toggleContext = (ctx: StressorContext) => {
    setAffectedBy((prev) =>
      prev.includes(ctx) ? (prev.length > 1 ? prev.filter((c) => c !== ctx) : prev) : [...prev, ctx]
    )
  }

  const toggleTool = (id: AssessmentToolId) => {
    setSelectedTools((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  const finalizeResults = (usedTools: AssessmentToolId[]) => {
    const phq = usedTools.includes('phq9')
      ? scorePHQ9(answers.phq9.map((v) => (v < 0 ? 0 : v)))
      : undefined
    const gad = usedTools.includes('gad7')
      ? scoreGAD7(answers.gad7.map((v) => (v < 0 ? 0 : v)))
      : undefined
    const who = usedTools.includes('who5')
      ? scoreWHO5(answers.who5.map((v) => (v < 0 ? 3 : v)))
      : undefined
    const pss = usedTools.includes('pss10')
      ? scorePSS10(answers.pss10.map((v) => (v < 0 ? 1 : v)))
      : undefined

    const derivedProfile = deriveRelaxationProfile({
      dailyMood,
      stressRating,
      sleepQuality,
      phq9Score: phq?.score,
      gad7Score: gad?.score,
      pss10Score: pss?.score,
      existing: profile,
    })

    const safetyEscalated = Boolean(
      phq?.item9Flag ||
        (phq?.score ?? 0) >= 15 ||
        (gad?.score ?? 0) >= 15 ||
        (pss?.score ?? 0) >= 27 ||
        stressRating >= 9
    )

    const recommendedActivities = buildCalmPlanRecommendations(derivedProfile, {
      stressRating,
      phq9Score: phq?.score,
      gad7Score: gad?.score,
      pss10Score: pss?.score,
      sleepQuality,
    })

    const compositeScore = computeCompositeWellnessScore({
      dailyMood,
      stressRating,
      sleepHours,
      phq9Score: phq?.score,
      gad7Score: gad?.score,
      who5Percent: who?.percent,
      pss10Score: pss?.score,
      functionalImpact,
      typingVarianceMs: typingCheckedInSession ? typingSummary.varianceMs : undefined,
      voiceStressLevel: voiceCheckedInSession ? voiceSummary : undefined,
    })

    const nextSnapshot: AssessmentResultSnapshot = {
      id: `asm-${Date.now()}`,
      timestamp: Date.now(),
      date: new Date().toLocaleDateString([], { month: 'short', day: '2-digit' }),
      dailyMood,
      stressRating,
      sleepQuality,
      sleepHours,
      affectedBy,
      phq9Score: phq?.score,
      phq9Range: phq?.range,
      phq9Item9Flag: phq?.item9Flag,
      gad7Score: gad?.score,
      gad7Range: gad?.range,
      who5Percent: who?.percent,
      who5Range: who?.range,
      pss10Score: pss?.score,
      pss10Range: pss?.range,
      functionalImpact,
      safetyEscalated,
      recommendedActivities,
      wearableHrBpm: syncedWearableVitals.hrBpm,
      wearableHrvMs: syncedWearableVitals.hrvMs,
      wearableSteps: syncedWearableVitals.steps,
      typingWpm: typingSummary.wpm,
      typingVarianceMs: typingSummary.varianceMs,
      voiceStressLevel: voiceSummary,
    }

    setProfile(derivedProfile)
    setSnapshot(nextSnapshot)
    onSaveFullAssessment(nextSnapshot, compositeScore, derivedProfile)

    if (!safetyEscalated && compositeScore >= 72) {
      confetti({ particleCount: 40, spread: 55, origin: { y: 0.65 } })
    }
    setStage('results')
  }

  const handleLaunchActivity = (id: GuidedActivityId) => {
    onClose()
    if (id === 'breathing') onOpenBreathing()
    else onOpenGuidedTherapy(id)
  }

  const stepIndex =
    stage === 'consent'
      ? 1
      : stage === 'checkin' || stage === 'typing' || stage === 'voice' || stage === 'trigger_detective'
        ? 2
        : stage === 'select_tools' || stage === 'questions'
          ? 3
          : stage === 'results'
            ? 4
            : stage === 'profile'
              ? 5
              : 6

  const activeRecommendations = snapshot
    ? buildCalmPlanRecommendations(profile, snapshot)
    : (['breathing', 'pmr', 'imagery', 'mindfulness'] as GuidedActivityId[])

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0E150E]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[28px] clay-modal overflow-hidden"
      >
        {/* Header with 6-step Progress Indicator */}
        <div className="px-6 py-4 clay-card-tint flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-[11px] clay-orb-sage text-white flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-base font-bold truncate">
                {stage === 'consent'
                  ? isHi
                    ? '1. स्वागत और गोपनीयता सहमति'
                    : '1. Welcome & Privacy Consent'
                  : stage === 'typing'
                    ? isHi
                      ? 'कीस्ट्रोक ताल परीक्षण (Typing Test)'
                      : 'Typing Test · Keystroke Cadence'
                    : stage === 'voice'
                      ? isHi
                        ? 'वॉइस बायोमार्कर जांच'
                        : 'Voice Biomarker · Vocal Prosody'
                      : stage === 'trigger_detective'
                        ? isHi
                          ? 'ट्रिगर डिटेक्टिव (Trigger Detective)'
                          : 'Trigger Detective · Root-Cause Log'
                        : stage === 'checkin'
                          ? isHi
                            ? '2. दैनिक मानसिक जांच'
                            : '2. Daily Check-In'
                          : stage === 'select_tools' || stage === 'questions'
                            ? isHi
                              ? '3. प्रमाणित मानसिक स्वास्थ्य मूल्यांकन'
                              : '3. Validated Screening'
                            : stage === 'results'
                              ? isHi
                                ? '4. आपके मूल्यांकन परिणाम'
                                : '4. Your Insights'
                              : stage === 'profile'
                                ? isHi
                                  ? '5. रिलैक्सेशन प्रोफ़ाइल'
                                  : '5. Relaxation Profile'
                                : isHi
                                  ? '6. आपका व्यक्तिगत शांत प्लान'
                                  : '6. Recommended Activities & Plan'}
              </h3>
              <div className="text-[11px] font-mono-num opacity-75">
                {stage === 'typing'
                  ? `${typingSummary.wpm} WPM · ${typingSummary.varianceMs} ms`
                  : stage === 'voice'
                    ? isHi
                      ? `वर्तमान स्तर: ${voiceSummary}`
                      : `Current vocal stress: ${voiceSummary}`
                    : stage === 'trigger_detective'
                      ? isHi
                        ? `${tdSavedCount} ट्रिगर मानचित्रित`
                        : `${tdSavedCount} Triggers Mapped to Emotion DNA`
                      : isHi
                        ? `चरण ${stepIndex} / 6`
                        : `Step ${stepIndex} of 6`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleLanguage}
              className="clay-btn-secondary inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[10px] text-[11px] font-semibold cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{isHi ? 'EN' : 'हिं'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="clay-btn-secondary p-2 rounded-[11px] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 6-step thin bar */}
        <div className="grid grid-cols-6 gap-1 px-6 pt-2.5 shrink-0">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-colors ${
                idx <= stepIndex ? 'bg-[#5E825B] dark:bg-[#82B88D]' : 'bg-[#789575]/20'
              }`}
            />
          ))}
        </div>

        {/* Scrollable Step Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* STEP 1: WELCOME & PRIVACY CONSENT */}
          {stage === 'consent' && (
            <div className="space-y-5">
              <div className="clay-card-forest rounded-[22px] p-6 text-[#E5E8CE] space-y-2">
                <div className="text-xs font-semibold text-[#A8C6A4]">
                  {isHi ? 'EMOTION AI · आकलन · समझ · विश्राम' : 'EMOTION AI · Assess · Understand · Relax'}
                </div>
                <h4 className="font-display text-xl font-bold">
                  {isHi ? 'शांत मन, संतुलित जीवन' : 'A Healthier Mind, A Calmer You'}
                </h4>
                <p className="text-xs text-[#C5D8C1] leading-relaxed">
                  {isHi
                    ? 'यह 6-चरणीय मार्गदर्शिका दैनिक जांच और प्रमाणित प्रश्नावली (PHQ-9, GAD-7, WHO-5, PSS-10) के माध्यम से आपके लिए व्यक्तिगत विश्राम योजना तैयार करती है।'
                    : 'This 6-step companion pairs your daily check-in with validated screening instruments (PHQ-9, GAD-7, WHO-5, PSS-10) to build a tailored Calm Plan.'}
                </p>
              </div>

              <div className="clay-tile rounded-[20px] p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-9 h-9 rounded-[12px] clay-orb-sage text-[#142013] flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4" />
                  </span>
                  <div className="space-y-1">
                    <div className="text-sm font-bold">
                      {isHi ? 'आपकी गोपनीयता सर्वोपरि है' : 'Your Privacy Matters'}
                    </div>
                    <p className="text-xs text-[#495847] dark:text-[#A8B7A4] leading-relaxed">
                      {isHi
                        ? 'आपका डेटा सुरक्षित है और केवल आपके मानसिक स्वास्थ्य की सहायता के लिए उपयोग किया जाता है।'
                        : 'Your data is safe and used only to support your mental wellbeing.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowLearnMore((v) => !v)}
                      className="text-xs font-semibold text-[#3B5939] dark:text-[#98B495] hover:underline cursor-pointer"
                    >
                      {showLearnMore
                        ? isHi
                          ? 'विवरण छुपाएं'
                          : 'Hide details'
                        : isHi
                          ? 'और जानें →'
                          : 'Learn More →'}
                    </button>
                  </div>
                </div>

                {showLearnMore && (
                  <div className="clay-well rounded-[14px] p-3.5 text-xs text-[#495847] dark:text-[#C5D1BF] leading-relaxed space-y-1">
                    <p>
                      {isHi
                        ? '• सभी स्क्रीनिंग परिणाम गैर-नैदानिक (non-diagnostic) हैं और केवल आपके प्रमाणित खाते में सहेजे जाते हैं।'
                        : '• Screening scores are non-diagnostic insights stored exclusively under your authenticated account.'}
                    </p>
                    <p>
                      {isHi
                        ? '• संकट संकेत मिलने पर तुरंत हेल्पलाइन (Tele-MANAS 14416) तक पहुंच प्रदान की जाती है।'
                        : '• Safety rules immediately surface 24/7 crisis support (Tele-MANAS 14416) whenever severe distress is detected.'}
                    </p>
                  </div>
                )}

                <label className="flex items-center gap-3 pt-2 cursor-pointer text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="w-4 h-4 accent-[#789575]"
                  />
                  <span>
                    {isHi ? 'मैं गोपनीयता नीति से सहमत हूं' : 'I agree to the privacy policy'}
                  </span>
                </label>
              </div>

              <button
                type="button"
                disabled={!consentChecked}
                onClick={() => {
                  onSavePrivacyConsent(true)
                  setStage('checkin')
                }}
                className="w-full h-11 rounded-[15px] clay-btn-primary text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{isHi ? 'शुरू करें' : 'Get Started'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: DAILY CHECK-IN */}
          {stage === 'checkin' && (
            <div className="space-y-5">
              {/* Mood scale */}
              <div className="space-y-2.5">
                <div className="text-sm font-bold">
                  {isHi ? 'आज आप कैसा महसूस कर रहे हैं?' : 'How are you feeling today?'}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {MOOD_OPTIONS.map((m) => {
                    const Icon = m.icon
                    const active = dailyMood === m.value
                    return (
                      <button
                        key={m.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setDailyMood(m.value)}
                        className={`p-2.5 rounded-[16px] flex flex-col items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                          active
                            ? 'clay-option-selected'
                            : 'clay-tile clay-option-unselected clay-card-interactive'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="truncate max-w-full">{isHi ? m.labelHi : m.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 0-10 Stress Slider */}
              <div className="clay-well rounded-[18px] p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{isHi ? 'इस समय आप कितना तनाव महसूस कर रहे हैं?' : 'How stressed do you feel right now?'}</span>
                  <span className="font-mono-num text-sm">{stressRating}/10</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={stressRating}
                  onChange={(e) => setStressRating(parseInt(e.target.value, 10))}
                  className="w-full accent-[#789575]"
                />
              </div>

              {/* Sleep Quality + Hours */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="inline-flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-[#496346] dark:text-[#98B495]" />
                    <span>{isHi ? 'कल रात आपकी नींद कैसी थी?' : 'How was your sleep last night?'}</span>
                  </span>
                  <span className="font-mono-num">{sleepHours.toFixed(1)} hrs</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {SLEEP_OPTIONS.map((opt) => {
                    const active = sleepQuality === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          setSleepQuality(opt.value)
                          if (opt.value === 'Poor' && sleepHours > 6) setSleepHours(5.5)
                          if (opt.value === 'Excellent' && sleepHours < 7.5) setSleepHours(8)
                        }}
                        className={`py-2 px-2 rounded-[13px] text-xs font-semibold cursor-pointer ${
                          active
                            ? 'clay-option-selected'
                            : 'clay-btn-secondary clay-option-unselected'
                        }`}
                      >
                        {isHi ? opt.labelHi : opt.label}
                      </button>
                    )
                  })}
                </div>
                <input
                  type="range"
                  min={3.5}
                  max={10}
                  step={0.5}
                  value={sleepHours}
                  onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                  aria-label="Hours slept"
                  className="w-full accent-[#4E6B4B]"
                />
              </div>

              {/* Stressor Contexts */}
              <div className="space-y-2">
                <div className="text-xs font-bold">
                  {isHi ? 'आज आपको सबसे ज़्यादा क्या प्रभावित कर रहा है?' : 'What is affecting you most today?'}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {CONTEXT_OPTIONS.map((ctx) => {
                    const selected = affectedBy.includes(ctx.value)
                    return (
                      <button
                        key={ctx.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleContext(ctx.value)}
                        className={`py-2.5 px-2 rounded-[14px] text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                          selected
                            ? 'clay-option-selected'
                            : 'clay-tile clay-option-unselected'
                        }`}
                      >
                        {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        <span>{isHi ? ctx.labelHi : ctx.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Voice Biomarker & Trigger Detective Checks inside Mental Check */}
              <div className="clay-tile rounded-[18px] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold">
                      {isHi
                        ? 'डिजिटल बायोमार्कर जांच (वॉइस)'
                        : 'Digital Biomarker Check (Voice)'}
                    </div>
                    <div className="text-[11px] text-[#495847] dark:text-[#A8B7A4]">
                      {isHi
                        ? 'सटीक संज्ञानात्मक तनाव आकलन के लिए आवाज़ जांच जोड़ें।'
                        : 'Capture live vocal prosody inside your mental check.'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviousStage('checkin')
                      setStage('voice')
                    }}
                    className={`rounded-[15px] p-3 text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                      voiceCheckedInSession
                        ? 'clay-option-selected'
                        : 'clay-well clay-card-interactive'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${
                          voiceCheckedInSession
                            ? 'bg-[#8FE4B8] text-[#113526]'
                            : 'clay-orb-sage text-[#142013]'
                        }`}
                      >
                        <Mic className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <span className="truncate">{isHi ? 'वॉइस बायोमार्कर' : 'Voice Biomarker'}</span>
                          {voiceCheckedInSession && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </div>
                        <div
                          className={`text-[11px] font-mono-num truncate ${
                            voiceCheckedInSession
                              ? 'text-[#DCEFE3]'
                              : 'text-[#495847] dark:text-[#A8B7A4]'
                          }`}
                        >
                          {isHi ? `तनाव: ${voiceSummary}` : `Vocal Stress: ${voiceSummary}`}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-semibold shrink-0 px-2.5 py-1 rounded-[9px] ${
                        voiceCheckedInSession
                          ? 'bg-white/15 text-[#F4F9F1]'
                          : 'clay-btn-secondary'
                      }`}
                    >
                      {voiceCheckedInSession
                        ? isHi
                          ? 'पुनः करें'
                          : 'Retake'
                        : isHi
                          ? 'शुरू करें'
                          : 'Run'}
                    </span>
                  </button>
                </div>

                {/* Trigger Detective Quick Launch Card inside Mental Check */}
                <button
                  type="button"
                  onClick={() => {
                    setPreviousStage('checkin')
                    setStage('trigger_detective')
                  }}
                  className="w-full rounded-[15px] p-3 text-left flex items-center justify-between gap-2.5 clay-well clay-card-interactive cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-[10px] clay-orb-sage text-[#142013] flex items-center justify-center shrink-0">
                      <Search className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>{isHi ? 'ट्रिगर डिटेक्टिव (Trigger Detective)' : 'Trigger Detective'}</span>
                        <span className="text-[10px] font-mono-num opacity-75">
                          ({tdSavedCount} mapped)
                        </span>
                      </div>
                      <div className="text-[11px] text-[#495847] dark:text-[#A8B7A4] truncate">
                        {isHi
                          ? 'तनाव के मुख्य कारण और शांत दृष्टिकोण दर्ज करें (Emotion DNA से सिंक)।'
                          : 'Identify what triggered your mood today & sync with Emotion DNA Trigger Map.'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold shrink-0 px-2.5 py-1 rounded-[9px] clay-btn-secondary">
                    {isHi ? 'खोलें' : 'Investigate'}
                  </span>
                </button>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStage('consent')}
                  className="h-11 px-4 rounded-[15px] clay-btn-secondary text-xs font-semibold cursor-pointer"
                >
                  {isHi ? 'सहमति देखें' : 'Privacy'}
                </button>
                <button
                  type="button"
                  onClick={() => setStage('select_tools')}
                  className="flex-1 h-11 rounded-[15px] clay-btn-primary text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isHi ? 'आगे बढ़ें' : 'Next'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* EMBEDDED TYPING TEST BIOMARKER INSIDE MENTAL CHECK */}
          {stage === 'typing' && (
            <div className="space-y-4">
              <div className="clay-tile rounded-[18px] p-4 flex items-center gap-3">
                <span className="w-9 h-9 rounded-[12px] clay-orb-sage text-[#142013] flex items-center justify-center shrink-0">
                  <Keyboard className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-sm font-bold">
                    {isHi ? 'कीस्ट्रोक ताल परीक्षण' : 'Keystroke Cadence Probe'}
                  </div>
                  <div className="text-xs text-[#495847] dark:text-[#A8B7A4]">
                    {isHi
                      ? 'टाइपिंग गति (WPM) और कुंजी-अंतराल (flight variance) संज्ञानात्मक थकान को दर्शाते हैं।'
                      : 'Measures typing speed (WPM) and inter-key flight variance as a cognitive load biomarker.'}
                  </div>
                </div>
              </div>

              <TypingTestRunner
                language={language}
                onSaveMetrics={(wpm, varianceMs) => {
                  setTypingSummary({ wpm, varianceMs })
                  setTypingCheckedInSession(true)
                  onSaveTypingMetrics(wpm, varianceMs)
                }}
                onDone={() => setStage(previousStage)}
                doneLabel={
                  previousStage === 'select_tools'
                    ? isHi
                      ? 'स्क्रीनिंग पर लौटें'
                      : 'Back to Screening'
                    : isHi
                      ? 'मानसिक जांच पर लौटें'
                      : 'Save & Back to Check-In'
                }
              />
            </div>
          )}

          {/* EMBEDDED VOICE BIOMARKER INSIDE MENTAL CHECK */}
          {stage === 'voice' && (
            <div className="space-y-4">
              <div className="clay-tile rounded-[18px] p-4 flex items-center gap-3">
                <span className="w-9 h-9 rounded-[12px] clay-orb-sage text-[#142013] flex items-center justify-center shrink-0">
                  <Mic className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-sm font-bold">
                    {isHi ? 'वॉइस बायोमार्कर जांच' : 'Acoustic Voice Biomarker'}
                  </div>
                  <div className="text-xs text-[#495847] dark:text-[#A8B7A4]">
                    {isHi
                      ? 'बोलने की गति, पिच और विराम से तनाव स्तर का विश्लेषण करता है।'
                      : 'Analyzes speech cadence, vocal energy variance, and pause latency for stress indicators.'}
                  </div>
                </div>
              </div>

              <VoiceBiomarkerRunner
                language={language}
                onSaveVoiceLevel={(level) => {
                  setVoiceSummary(level)
                  setVoiceCheckedInSession(true)
                  onSaveVoiceLevel(level)
                }}
                onDone={() => setStage(previousStage)}
                doneLabel={
                  previousStage === 'select_tools'
                    ? isHi
                      ? 'स्क्रीनिंग पर लौटें'
                      : 'Back to Screening'
                    : isHi
                      ? 'मानसिक जांच पर लौटें'
                      : 'Save & Back to Check-In'
                }
              />
            </div>
          )}

          {/* EMBEDDED TRIGGER DETECTIVE INSIDE MENTAL CHECK */}
          {stage === 'trigger_detective' && (
            <div className="space-y-4">
              <div className="clay-tile rounded-[18px] p-4 flex items-center gap-3">
                <span className="w-9 h-9 rounded-[12px] clay-orb-sage text-[#142013] flex items-center justify-center shrink-0">
                  <Search className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-sm font-bold">
                    {isHi ? 'ट्रिगर डिटेक्टिव · कारण विश्लेषण' : 'Trigger Detective · Pattern Investigator'}
                  </div>
                  <div className="text-xs text-[#495847] dark:text-[#A8B7A4]">
                    {isHi
                      ? 'यह आपके Emotion DNA ट्रिगर मानचित्र को अपडेट करता है और ग्राउंडिंग गतिविधि को स्वतः चिह्नित करता है।'
                      : 'Maps emotional triggers to Emotion DNA and auto-verifies Sensory Grounding.'}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold mb-1">
                    {isHi ? 'क्या हुआ या किस स्थिति ने तनाव बढ़ाया?' : 'What situation triggered this shift?'}
                  </label>
                  <input
                    type="text"
                    value={tdSituation}
                    onChange={(e) => setTdSituation(e.target.value)}
                    placeholder={isHi ? 'उदा. समय-सीमा का दबाव या अचानक बदलाव...' : 'e.g. Exam deadline pressure or unexpected feedback...'}
                    className="w-full h-10 rounded-[12px] clay-input px-3 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">
                      {isHi ? 'प्रमुख भावना' : 'Primary Emotion Pattern'}
                    </label>
                    <select
                      value={tdEmotion}
                      onChange={(e) => setTdEmotion(e.target.value as TriggerDetectiveEntry['emotion'])}
                      className="w-full h-10 rounded-[12px] clay-input px-3 text-xs font-semibold"
                    >
                      <option value="Overwhelmed">Overwhelmed</option>
                      <option value="Anxiety">Anxiety</option>
                      <option value="Low Focus">Low Focus</option>
                      <option value="Self-Criticism">Self-Criticism</option>
                      <option value="Fatigue">Fatigue</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">
                      {isHi ? 'शारीरिक संकेत' : 'Body Sensation'}
                    </label>
                    <input
                      type="text"
                      value={tdBodyCue}
                      onChange={(e) => setTdBodyCue(e.target.value)}
                      className="w-full h-10 rounded-[12px] clay-input px-3 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    {isHi ? 'स्वचालित विचार (Automatic Thought)' : 'Automatic Thought'}
                  </label>
                  <input
                    type="text"
                    value={tdThought}
                    onChange={(e) => setTdThought(e.target.value)}
                    placeholder={isHi ? 'मन में सबसे पहले क्या विचार आया?' : 'What did your mind immediately tell you?'}
                    className="w-full h-10 rounded-[12px] clay-input px-3 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    {isHi ? 'संतुलित दृष्टिकोण (Calming Reframe)' : 'Balanced Reframe / Grounding Step'}
                  </label>
                  <input
                    type="text"
                    value={tdReframe}
                    onChange={(e) => setTdReframe(e.target.value)}
                    placeholder={isHi ? 'एक शांत, व्यावहारिक अगला कदम...' : 'One calmer, balanced perspective or small action...'}
                    className="w-full h-10 rounded-[12px] clay-input px-3 text-xs"
                  />
                </div>

                <div className="clay-well rounded-[14px] p-3 space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{isHi ? 'तीव्रता' : 'Trigger Intensity'}</span>
                    <span className="font-mono-num">{tdIntensity}/10</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={tdIntensity}
                    onChange={(e) => setTdIntensity(parseInt(e.target.value, 10))}
                    className="w-full accent-[#4E6B4B]"
                  />
                </div>
              </div>

              {(account.triggerLogs || []).length > 0 && (
                <div className="rounded-[15px] clay-tile p-3 space-y-1.5 max-h-[120px] overflow-y-auto">
                  <div className="text-[11px] font-bold opacity-75">
                    {isHi ? 'हाल के ट्रिगर लॉग' : 'Recent Mapped Triggers'}
                  </div>
                  {(account.triggerLogs || []).slice(0, 2).map((item) => (
                    <div key={item.id} className="text-xs flex justify-between gap-2">
                      <span className="truncate font-semibold">{item.situation}</span>
                      <span className="text-[11px] font-mono-num opacity-75 shrink-0">
                        {item.emotion} ({item.intensity}/10)
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStage(previousStage)}
                  className="h-11 px-4 rounded-[15px] clay-btn-secondary text-xs font-semibold cursor-pointer"
                >
                  {isHi ? 'वापस जाएं' : 'Back to Check-In'}
                </button>
                <button
                  type="button"
                  disabled={!tdSituation.trim()}
                  onClick={() => {
                    onSaveTriggerEntry({
                      situation: tdSituation.trim(),
                      emotion: tdEmotion,
                      bodyCue: tdBodyCue.trim() || 'Tension',
                      automaticThought: tdThought.trim() || 'Feeling pressured by immediate demands.',
                      reframe: tdReframe.trim() || 'Take one slow exhale and handle one step at a time.',
                      intensity: tdIntensity,
                    })
                    setTdSavedCount((c) => c + 1)
                    setTdSituation('')
                    setTdThought('')
                    setTdReframe('')
                    setTdFlash(true)
                    window.setTimeout(() => {
                      setTdFlash(false)
                      setStage('checkin')
                    }, 900)
                  }}
                  className="flex-1 h-11 rounded-[15px] clay-btn-primary text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {tdFlash
                      ? isHi
                        ? 'ट्रिगर सहेजा गया ✓'
                        : 'Trigger Mapped to Emotion DNA ✓'
                      : isHi
                        ? 'ट्रिगर सहेजें और Emotion DNA से सिंक करें'
                        : 'Save Trigger & Sync Emotion DNA'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3A: SELECT VALIDATED SCREENINGS */}
          {stage === 'select_tools' && (
            <div className="space-y-4">
              <div className="clay-well rounded-[16px] p-3.5 flex items-start gap-2.5 text-xs text-[#495847] dark:text-[#C5D1BF]">
                <Info className="w-4 h-4 text-[#496346] dark:text-[#98B495] shrink-0 mt-0.5" />
                <span>
                  {isHi
                    ? 'ये आपके मानसिक स्वास्थ्य को समझने के लिए स्क्रीनिंग उपकरण हैं, चिकित्सा निदान नहीं।'
                    : 'These are validated screening tools to understand your mental wellbeing. Not a diagnosis.'}
                </span>
              </div>

              <div className="space-y-2.5">
                {(['phq9', 'gad7', 'who5', 'pss10'] as AssessmentToolId[]).map((toolId) => {
                  const meta = SCREENING_INSTRUMENTS[toolId]
                  const checked = selectedTools.includes(toolId)
                  return (
                    <button
                      key={toolId}
                      type="button"
                      aria-pressed={checked}
                      onClick={() => toggleTool(toolId)}
                      className={`w-full rounded-[18px] p-4 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ${
                        checked
                          ? 'clay-option-selected'
                          : 'clay-tile clay-option-unselected clay-card-interactive'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-10 h-10 rounded-[12px] text-xs font-bold flex items-center justify-center shrink-0 ${
                            checked
                              ? 'bg-[#8FE4B8] text-[#113526]'
                              : 'clay-orb-ivory text-[#1B251A] dark:text-[#E5E8CE]'
                          }`}
                        >
                          {meta.code}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-bold">{isHi ? meta.titleHi : meta.title}</div>
                          <div className={`text-xs ${checked ? 'text-[#DCEFE3]' : 'text-[#495847] dark:text-[#A8B7A4]'}`}>
                            {isHi ? meta.subtitleHi : meta.subtitle}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          checked
                            ? 'bg-[#8FE4B8] text-[#113526]'
                            : 'border border-[#789575]/45'
                        }`}
                      >
                        {checked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Quick Voice Biomarker check accessible in Screening stage too */}
              <div className="clay-tile rounded-[16px] p-3.5 flex flex-wrap items-center justify-between gap-2.5">
                <span className="text-xs font-semibold text-[#495847] dark:text-[#A8B7A4]">
                  {isHi ? 'वैकल्पिक बायोमार्कर जांच:' : 'Optional Biomarker Check:'}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviousStage('select_tools')
                      setStage('voice')
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[11px] text-xs font-semibold cursor-pointer ${
                      voiceCheckedInSession ? 'clay-option-selected' : 'clay-btn-secondary'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>
                      {isHi ? 'वॉइस बायोमार्कर' : 'Voice Biomarker'}
                      {voiceCheckedInSession ? ` (${voiceSummary})` : ''}
                    </span>
                    {voiceCheckedInSession && <Check className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStage('checkin')}
                  className="h-11 px-4 rounded-[15px] clay-btn-secondary text-xs font-semibold cursor-pointer"
                >
                  {isHi ? 'पीछे' : 'Back'}
                </button>
                <button
                  type="button"
                  onClick={() => finalizeResults([])}
                  className="h-11 px-4 rounded-[15px] clay-btn-secondary text-xs font-semibold cursor-pointer"
                >
                  {isHi ? 'बिना स्क्रीनिंग परिणाम देखें' : 'Skip Screening'}
                </button>
                <button
                  type="button"
                  disabled={selectedTools.length === 0}
                  onClick={() => {
                    setQuestionCursor(0)
                    setStage('questions')
                  }}
                  className="flex-1 h-11 px-5 rounded-[15px] clay-btn-primary text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>
                    {isHi
                      ? `मूल्यांकन शुरू करें (${questionQueue.length + 1})`
                      : `Start Assessment (${questionQueue.length + 1})`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3B: QUESTION-BY-QUESTION VALIDATED ASSESSMENT */}
          {stage === 'questions' && (
            <div className="space-y-5">
              {questionCursor < questionQueue.length ? (
                (() => {
                  const current = questionQueue[questionCursor]
                  const meta = SCREENING_INSTRUMENTS[current.toolId]
                  const q = meta.questions[current.itemIdx]
                  const currentVal = answers[current.toolId][current.itemIdx]

                  return (
                    <>
                      <div className="flex items-center justify-between text-xs font-semibold text-[#496346] dark:text-[#98B495]">
                        <span>
                          {meta.code} · {isHi ? meta.titleHi : meta.title}
                        </span>
                        <span className="font-mono-num">
                          {questionCursor + 1} / {totalQuestionSteps}
                        </span>
                      </div>

                      <div className="clay-well rounded-[20px] p-5 space-y-2">
                        <div className="text-[11px] text-[#495847] dark:text-[#A8B7A4]">
                          {isHi ? meta.timeframeHi : meta.timeframe}
                        </div>
                        <p className="font-display text-base font-bold leading-snug">
                          {isHi ? q.hi : q.en}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        {meta.options.map((opt) => {
                          const selected = currentVal === opt.value
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => {
                                clearPendingAdvance()
                                const cursorAtClick = questionCursor
                                setAnswers((prev) => {
                                  const nextArr = [...prev[current.toolId]]
                                  nextArr[current.itemIdx] = opt.value
                                  return { ...prev, [current.toolId]: nextArr }
                                })
                                advanceTimerRef.current = window.setTimeout(() => {
                                  setQuestionCursor((c) => (c === cursorAtClick ? c + 1 : c))
                                  advanceTimerRef.current = null
                                }, 260)
                              }}
                              className={`p-3.5 rounded-[15px] text-left text-sm font-semibold flex items-center justify-between gap-3 transition-all cursor-pointer ${
                                selected
                                  ? 'clay-option-selected'
                                  : 'clay-tile clay-option-unselected clay-card-interactive'
                              }`}
                            >
                              <span className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                    selected
                                      ? 'bg-[#8FE4B8] text-[#113526]'
                                      : 'border border-[#789575]/45'
                                  }`}
                                >
                                  {selected && <Check className="w-3 h-3 stroke-[2.5]" />}
                                </span>
                                <span>{isHi ? opt.labelHi : opt.label}</span>
                              </span>
                              <span
                                className={`text-xs font-mono-num px-2 py-0.5 rounded-[8px] shrink-0 ${
                                  selected
                                    ? 'bg-white/15 text-[#F4F9F1]'
                                    : 'text-[#495847] dark:text-[#A8B7A4]'
                                }`}
                              >
                                {opt.value}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )
                })()
              ) : (
                /* Final item: Functional Impact */
                <>
                  <div className="flex items-center justify-between text-xs font-semibold text-[#496346] dark:text-[#98B495]">
                    <span>{isHi ? 'दैनिक कार्यप्रणाली प्रभाव' : 'Functional Impact'}</span>
                    <span className="font-mono-num">
                      {totalQuestionSteps} / {totalQuestionSteps}
                    </span>
                  </div>
                  <div className="clay-well rounded-[20px] p-5 space-y-2">
                    <p className="font-display text-base font-bold leading-snug">
                      {isHi
                        ? 'इन समस्याओं ने आपके काम, पढ़ाई या रोज़मर्रा के जीवन को कितना प्रभावित किया है?'
                        : 'How difficult have these feelings made it to manage your study, work, or daily activities?'}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {IMPACT_OPTIONS.map((imp) => {
                      const selected = functionalImpact === imp.value
                      return (
                        <button
                          key={imp.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setFunctionalImpact(imp.value)}
                          className={`p-3.5 rounded-[15px] text-left text-sm font-semibold flex items-center justify-between gap-3 cursor-pointer ${
                            selected
                              ? 'clay-option-selected'
                              : 'clay-tile clay-option-unselected clay-card-interactive'
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                selected
                                  ? 'bg-[#8FE4B8] text-[#113526]'
                                  : 'border border-[#789575]/45'
                              }`}
                            >
                              {selected && <Check className="w-3 h-3 stroke-[2.5]" />}
                            </span>
                            <span>{isHi ? imp.labelHi : imp.label}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    clearPendingAdvance()
                    if (questionCursor === 0) setStage('select_tools')
                    else setQuestionCursor((c) => c - 1)
                  }}
                  className="h-10 px-4 rounded-[14px] clay-btn-secondary inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{isHi ? 'पिछला' : 'Previous'}</span>
                </button>

                {questionCursor >= questionQueue.length ? (
                  <button
                    type="button"
                    onClick={() => {
                      clearPendingAdvance()
                      finalizeResults(selectedTools)
                    }}
                    className="h-11 px-5 rounded-[15px] clay-btn-primary text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>{isHi ? 'परिणाम देखें' : 'View Your Insights'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      clearPendingAdvance()
                      setQuestionCursor((c) => c + 1)
                    }}
                    className="h-10 px-4 rounded-[14px] clay-btn-secondary text-xs font-semibold cursor-pointer"
                  >
                    {answers[questionQueue[questionCursor].toolId][questionQueue[questionCursor].itemIdx] >= 0
                      ? isHi
                        ? 'अगला →'
                        : 'Next →'
                      : isHi
                        ? 'छोड़ें →'
                        : 'Skip item →'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: ASSESSMENT RESULTS & INSIGHTS */}
          {stage === 'results' && snapshot && (
            <div className="space-y-4">
              {snapshot.safetyEscalated && (
                <div className="rounded-[20px] clay-tile border border-[#B42318]/40 p-4 space-y-3">
                  <div className="flex items-start gap-2.5 text-[#9E2216] dark:text-[#F48D84]">
                    <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold">
                        {isHi ? 'सुरक्षा प्राथमिकता · तत्काल सहायता उपलब्ध है' : 'Safety First · Immediate Support Available'}
                      </div>
                      <p className="text-xs leading-relaxed mt-0.5">
                        {isHi
                          ? 'आप अकेले नहीं हैं। आपके उत्तरों के आधार पर हम विशेषज्ञ या विश्वस्त व्यक्ति से बात करने की सलाह देते हैं।'
                          : 'You are not alone. Based on your responses, reaching out to a counsellor or trusted person right now is strongly encouraged.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href="tel:14416"
                      className="clay-btn-danger inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] text-xs font-semibold"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{isHi ? 'हेल्पलाइन 14416' : 'Call Helpline'}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        onOpenChat()
                      }}
                      className="clay-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] text-xs font-semibold cursor-pointer"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>{isHi ? 'चैट सहायता' : 'Chat Support'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        onOpenSafety()
                      }}
                      className="clay-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] text-xs font-semibold cursor-pointer"
                    >
                      <HeartHandshake className="w-3.5 h-3.5" />
                      <span>{isHi ? 'आपातकालीन सहायता' : 'Emergency Help'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 2x2 Clinical Insights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="clay-tile rounded-[18px] p-4 space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#495847] dark:text-[#A8B7A4]">
                    <span className="inline-flex items-center gap-1.5 font-semibold">
                      <Brain className="w-3.5 h-3.5" />
                      <span>{isHi ? 'अवसाद लक्षण (PHQ-9)' : 'Depression Symptoms'}</span>
                    </span>
                    {typeof snapshot.phq9Score === 'number' && (
                      <span className="font-mono-num font-bold">{snapshot.phq9Score}/27</span>
                    )}
                  </div>
                  <div className="font-display text-sm font-bold">
                    {snapshot.phq9Range ?? (isHi ? 'आज चयनित नहीं' : 'Not screened today')}
                  </div>
                </div>

                <div className="clay-tile rounded-[18px] p-4 space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#495847] dark:text-[#A8B7A4]">
                    <span className="inline-flex items-center gap-1.5 font-semibold">
                      <Activity className="w-3.5 h-3.5" />
                      <span>{isHi ? 'चिंता लक्षण (GAD-7)' : 'Anxiety Symptoms'}</span>
                    </span>
                    {typeof snapshot.gad7Score === 'number' && (
                      <span className="font-mono-num font-bold">{snapshot.gad7Score}/21</span>
                    )}
                  </div>
                  <div className="font-display text-sm font-bold">
                    {snapshot.gad7Range ?? (isHi ? 'आज चयनित नहीं' : 'Not screened today')}
                  </div>
                </div>

                <div className="clay-tile rounded-[18px] p-4 space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#495847] dark:text-[#A8B7A4]">
                    <span className="inline-flex items-center gap-1.5 font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isHi ? 'तनाव स्तर (PSS-10)' : 'Perceived Stress'}</span>
                    </span>
                    {typeof snapshot.pss10Score === 'number' && (
                      <span className="font-mono-num font-bold">{snapshot.pss10Score}/40</span>
                    )}
                  </div>
                  <div className="font-display text-sm font-bold">
                    {snapshot.pss10Range ??
                      (snapshot.stressRating >= 7
                        ? 'High Daily Load'
                        : snapshot.stressRating >= 4
                          ? 'Moderate Level'
                          : 'Low Level')}
                  </div>
                </div>

                <div className="clay-tile rounded-[18px] p-4 space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#495847] dark:text-[#A8B7A4]">
                    <span className="inline-flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isHi ? 'समग्र कल्याण (WHO-5)' : 'Wellbeing'}</span>
                    </span>
                    {typeof snapshot.who5Percent === 'number' && (
                      <span className="font-mono-num font-bold">{snapshot.who5Percent}%</span>
                    )}
                  </div>
                  <div className="font-display text-sm font-bold">
                    {snapshot.who5Range ?? `Index ${account.wellnessScore}/100`}
                  </div>
                </div>
              </div>

              {(snapshot.wearableHrBpm !== undefined ||
                snapshot.wearableHrvMs !== undefined ||
                snapshot.wearableSteps !== undefined) && (
                <div className="clay-well rounded-[16px] px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Watch className="w-3.5 h-3.5 text-[#496346] dark:text-[#98B495]" />
                    <span>{isHi ? 'वियरेबल सिंक:' : 'Wearable Telemetry:'}</span>
                  </span>
                  <span className="font-mono-num text-[#495847] dark:text-[#C5D1BF]">
                    {[
                      snapshot.wearableHrBpm !== undefined ? `${snapshot.wearableHrBpm} BPM` : null,
                      snapshot.wearableHrvMs !== undefined ? `HRV ${snapshot.wearableHrvMs} ms` : null,
                      snapshot.wearableSteps !== undefined
                        ? `${snapshot.wearableSteps.toLocaleString()} steps`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </div>
              )}

              {snapshot.voiceStressLevel !== undefined && (
                <div className="clay-well rounded-[16px] px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Mic className="w-3.5 h-3.5 text-[#496346] dark:text-[#98B495]" />
                    <span>{isHi ? 'वॉइस बायोमार्कर:' : 'Voice Biomarker:'}</span>
                  </span>
                  <span className="font-mono-num text-[#495847] dark:text-[#C5D1BF]">
                    {isHi ? `तनाव स्तर: ${snapshot.voiceStressLevel}` : `Vocal Stress: ${snapshot.voiceStressLevel}`}
                  </span>
                </div>
              )}

              <div className="clay-well rounded-[16px] px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold">
                  {isHi ? 'दैनिक प्रभाव:' : 'Functional Impact:'}{' '}
                  <span className="font-normal text-[#495847] dark:text-[#C5D1BF]">
                    {snapshot.functionalImpact}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowHowItWorks((v) => !v)}
                  className="inline-flex items-center gap-1 font-semibold text-[#3B5939] dark:text-[#98B495] hover:underline cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{isHi ? 'सिफ़ारिशें कैसे काम करती हैं?' : 'How Recommendations Work?'}</span>
                </button>
              </div>

              {showHowItWorks && (
                <div className="clay-tile rounded-[18px] p-4 text-xs text-[#495847] dark:text-[#C5D1BF] space-y-1.5 leading-relaxed">
                  <div className="font-bold text-[#1B251A] dark:text-[#E5E8CE]">
                    {isHi
                      ? 'प्रमाणित स्कोर + आपकी प्राथमिकताएं + सुरक्षा नियम'
                      : 'Validated Scores + Your Preferences + Safety Rules'}
                  </div>
                  <p>
                    {isHi
                      ? 'हम आपके PHQ-9/GAD-7/WHO-5/PSS-10 स्कोर को आपकी नींद, शारीरिक तनाव और पसंदीदा ऑडियो अवधि के साथ जोड़कर एक स्पष्ट विश्राम योजना बनाते हैं — यह कभी भी चिकित्सा निदान नहीं है।'
                      : 'Your personalized plan combines standardized screening ranges with your current relaxation profile and built-in safety rules to recommend non-diagnostic activities.'}
                  </p>
                </div>
              )}

              <div className="text-[11px] text-[#495847] dark:text-[#A8B7A4] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {isHi
                    ? 'ये केवल स्क्रीनिंग परिणाम हैं, चिकित्सा निदान नहीं।'
                    : 'These are screening results, not a clinical diagnosis.'}
                </span>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStage('select_tools')}
                  className="h-11 px-4 rounded-[15px] clay-btn-secondary text-xs font-semibold cursor-pointer"
                >
                  {isHi ? 'पुनः जांच' : 'Retake'}
                </button>
                <button
                  type="button"
                  onClick={() => setStage('profile')}
                  className="flex-1 h-11 rounded-[15px] clay-btn-primary text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isHi ? 'रिलैक्सेशन प्रोफ़ाइल सेट करें' : 'Configure Relaxation Profile'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: RELAXATION PROFILE */}
          {stage === 'profile' && (
            <div className="space-y-4">
              <p className="text-xs text-[#495847] dark:text-[#A8B7A4]">
                {isHi
                  ? 'आपके उत्तरों के आधार पर तैयार किया गया — आप नीचे किसी भी प्राथमिकता को समायोजित कर सकते हैं:'
                  : 'Derived from your check-in and screening responses. Tap any preference below to tune it:'}
              </p>

              <div className="space-y-2.5">
                <div className="clay-tile rounded-[16px] p-3.5 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold">
                    {isHi ? 'शारीरिक तनाव' : 'Physical Tension'}
                  </span>
                  <div className="flex gap-1.5">
                    {(['Low', 'Moderate', 'High'] as const).map((val) => (
                      <button
                        key={val}
                        type="button"
                        aria-pressed={profile.physicalTension === val}
                        onClick={() => setProfile((p) => ({ ...p, physicalTension: val }))}
                        className={`px-2.5 py-1 rounded-[10px] text-[11px] font-semibold cursor-pointer ${
                          profile.physicalTension === val ? 'clay-option-selected' : 'clay-well clay-option-unselected'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="clay-tile rounded-[16px] p-3.5 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold">
                    {isHi ? 'व्यस्त विचार' : 'Busy Thoughts'}
                  </span>
                  <div className="flex gap-1.5">
                    {(['Low', 'Moderate', 'High'] as const).map((val) => (
                      <button
                        key={val}
                        type="button"
                        aria-pressed={profile.busyThoughts === val}
                        onClick={() => setProfile((p) => ({ ...p, busyThoughts: val }))}
                        className={`px-2.5 py-1 rounded-[10px] text-[11px] font-semibold cursor-pointer ${
                          profile.busyThoughts === val ? 'clay-option-selected' : 'clay-well clay-option-unselected'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="clay-tile rounded-[16px] p-3.5 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold">
                    {isHi ? 'सांस की सहजता' : 'Breathing Comfort'}
                  </span>
                  <div className="flex gap-1.5">
                    {(['Comfortable', 'Moderate', 'Tight'] as const).map((val) => (
                      <button
                        key={val}
                        type="button"
                        aria-pressed={profile.breathingComfort === val}
                        onClick={() => setProfile((p) => ({ ...p, breathingComfort: val }))}
                        className={`px-2.5 py-1 rounded-[10px] text-[11px] font-semibold cursor-pointer ${
                          profile.breathingComfort === val ? 'clay-option-selected' : 'clay-well clay-option-unselected'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="clay-tile rounded-[16px] p-3.5 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold">
                    {isHi ? 'नींद विश्राम' : 'Sleep Relaxation'}
                  </span>
                  <div className="flex gap-1.5">
                    {(['Optional', 'Needed'] as const).map((val) => (
                      <button
                        key={val}
                        type="button"
                        aria-pressed={profile.sleepRelaxation === val}
                        onClick={() => setProfile((p) => ({ ...p, sleepRelaxation: val }))}
                        className={`px-2.5 py-1 rounded-[10px] text-[11px] font-semibold cursor-pointer ${
                          profile.sleepRelaxation === val ? 'clay-option-selected' : 'clay-well clay-option-unselected'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {(() => {
                  const autoSound = getSuggestedSoundTherapy({
                    dailyMood: snapshot?.dailyMood ?? dailyMood,
                    stressRating: snapshot?.stressRating ?? stressRating,
                    sleepQuality: snapshot?.sleepQuality ?? sleepQuality,
                    phq9Score: snapshot?.phq9Score,
                    gad7Score: snapshot?.gad7Score,
                    pss10Score: snapshot?.pss10Score,
                    sleepHours: snapshot?.sleepHours ?? sleepHours,
                  })
                  return (
                    <div className="clay-card-tint rounded-[16px] p-3.5 space-y-1">
                      <div className="flex items-center justify-between gap-2 text-xs font-bold">
                        <span className="inline-flex items-center gap-1.5">
                          <Headphones className="w-3.5 h-3.5 text-[#344932] dark:text-[#A8C6A4]" />
                          <span>
                            {isHi ? 'स्तर के अनुसार स्वचालित ध्वनि सुझाव' : 'Suggested Sound Therapy (Auto-Matched)'}
                          </span>
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-[#1B251A] dark:text-[#E5E8CE]">
                        {isHi ? autoSound.titleHi : autoSound.title}
                      </div>
                      <p className="text-[11px] text-[#495847] dark:text-[#C5D1BF]">
                        {isHi ? autoSound.reasonHi : autoSound.reason}
                      </p>
                    </div>
                  )
                })()}

                <div className="clay-tile rounded-[16px] p-3.5 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{isHi ? 'सत्र अवधि' : 'Session Duration'}</span>
                  </span>
                  <div className="flex gap-1.5">
                    {(['2–5 min', '5–10 min', '10–15 min'] as const).map((val) => (
                      <button
                        key={val}
                        type="button"
                        aria-pressed={profile.sessionDuration === val}
                        onClick={() => setProfile((p) => ({ ...p, sessionDuration: val }))}
                        className={`px-2.5 py-1 rounded-[10px] text-[11px] font-semibold cursor-pointer ${
                          profile.sessionDuration === val ? 'clay-option-selected' : 'clay-well clay-option-unselected'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                {snapshot && (
                  <button
                    type="button"
                    onClick={() => setStage('results')}
                    className="h-11 px-4 rounded-[15px] clay-btn-secondary text-xs font-semibold cursor-pointer"
                  >
                    {isHi ? 'पीछे' : 'Back'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onSaveRelaxationProfile(profile)
                    setStage('plan')
                  }}
                  className="flex-1 h-11 rounded-[15px] clay-btn-primary text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isHi ? 'व्यक्तिगत प्लान देखें' : 'View Personalized Plan'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: PERSONALIZED CALM PLAN & ASSESSMENT SUMMARY */}
          {stage === 'plan' && (
            <div className="space-y-4">
              {/* Assessment Summary Block inside Recommended Activities */}
              <div className="rounded-[22px] clay-card-tint p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-display text-sm font-bold">
                    {isHi ? 'मूल्यांकन सारांश (Assessment Summary)' : 'Assessment Summary'}
                  </div>
                  <span className="text-[11px] font-mono-num font-semibold opacity-75">
                    {profile.preferredAudio} · {profile.sessionDuration}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="rounded-[14px] clay-tile p-2.5">
                    <span className="text-[10px] opacity-70 block">{isHi ? 'मूड' : 'Mood'}</span>
                    <span className="text-xs font-bold">{snapshot?.dailyMood ?? dailyMood}</span>
                  </div>
                  <div className="rounded-[14px] clay-tile p-2.5">
                    <span className="text-[10px] opacity-70 block">{isHi ? 'तनाव' : 'Stress'}</span>
                    <span className="text-xs font-bold font-mono-num">
                      {snapshot?.stressRating ?? stressRating}/10
                    </span>
                  </div>
                  <div className="rounded-[14px] clay-tile p-2.5">
                    <span className="text-[10px] opacity-70 block">{isHi ? 'नींद' : 'Sleep'}</span>
                    <span className="text-xs font-bold font-mono-num">
                      {(snapshot?.sleepHours ?? sleepHours).toFixed(1)} hrs
                    </span>
                  </div>
                  <div className="rounded-[14px] clay-tile p-2.5">
                    <span className="text-[10px] opacity-70 block">{isHi ? 'आवाज़ का तनाव' : 'Voice Stress'}</span>
                    <span className="text-xs font-bold font-mono-num">
                      {voiceSummary}
                    </span>
                  </div>
                </div>

                {(() => {
                  const autoSound = getSuggestedSoundTherapy({
                    dailyMood: snapshot?.dailyMood ?? dailyMood,
                    stressRating: snapshot?.stressRating ?? stressRating,
                    sleepQuality: snapshot?.sleepQuality ?? sleepQuality,
                    phq9Score: snapshot?.phq9Score,
                    gad7Score: snapshot?.gad7Score,
                    pss10Score: snapshot?.pss10Score,
                    sleepHours: snapshot?.sleepHours ?? sleepHours,
                  })
                  return (
                    <div className="rounded-[15px] clay-tile p-3 flex flex-wrap items-center justify-between gap-2.5">
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-[#344932] dark:text-[#A8C6A4]">
                          {isHi ? 'आपके स्तर के अनुसार अनुशंसित ध्वनि:' : 'Auto-Suggested Sound Therapy for Your Levels:'}
                        </div>
                        <div className="text-xs font-bold truncate">
                          {isHi ? autoSound.titleHi : autoSound.title}
                        </div>
                      </div>
                      {onOpenSoundTherapy && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose()
                            onOpenSoundTherapy()
                          }}
                          className="clay-btn-secondary px-3 py-1.5 rounded-[11px] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <Headphones className="w-3.5 h-3.5" />
                          <span>{isHi ? 'सुनें' : 'Open Sound Therapy'}</span>
                        </button>
                      )}
                    </div>
                  )
                })()}

                {snapshot &&
                  (typeof snapshot.phq9Score === 'number' ||
                    typeof snapshot.gad7Score === 'number' ||
                    typeof snapshot.who5Percent === 'number' ||
                    typeof snapshot.pss10Score === 'number') && (
                    <div className="flex flex-wrap gap-2 text-[11px] font-mono-num pt-0.5">
                      {typeof snapshot.phq9Score === 'number' && (
                        <span className="clay-well px-2.5 py-1 rounded-[10px]">
                          PHQ-9: {snapshot.phq9Score}/27 ({snapshot.phq9Range})
                        </span>
                      )}
                      {typeof snapshot.gad7Score === 'number' && (
                        <span className="clay-well px-2.5 py-1 rounded-[10px]">
                          GAD-7: {snapshot.gad7Score}/21 ({snapshot.gad7Range})
                        </span>
                      )}
                      {typeof snapshot.who5Percent === 'number' && (
                        <span className="clay-well px-2.5 py-1 rounded-[10px]">
                          WHO-5: {snapshot.who5Percent}%
                        </span>
                      )}
                      {typeof snapshot.pss10Score === 'number' && (
                        <span className="clay-well px-2.5 py-1 rounded-[10px]">
                          PSS-10: {snapshot.pss10Score}/40
                        </span>
                      )}
                    </div>
                  )}
              </div>

              <div className="space-y-2.5">
                <div className="text-xs font-semibold opacity-80">
                  {isHi ? 'अनुशंसित गतिविधियाँ' : 'Recommended Activities'}
                </div>
                {activeRecommendations.map((actId, idx) => {
                  const item = ACTIVITY_DETAILS[actId]
                  const Icon = item.icon
                  return (
                    <button
                      key={actId}
                      type="button"
                      onClick={() => handleLaunchActivity(actId)}
                      className="w-full clay-tile clay-card-interactive rounded-[18px] p-4 flex items-center justify-between gap-3 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-10 h-10 rounded-[13px] flex items-center justify-center shrink-0 ${
                            idx === 0 ? 'clay-orb-sage text-[#142013]' : 'clay-orb-ivory text-[#1B251A] dark:text-[#E5E8CE]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-bold flex items-center gap-2">
                            <span className="truncate">{isHi ? item.titleHi : item.title}</span>
                            <span className="text-[11px] font-mono-num font-normal text-[#495847] dark:text-[#A8B7A4]">
                              {item.duration}
                            </span>
                          </div>
                          <div className="text-xs text-[#495847] dark:text-[#A8B7A4] truncate">
                            {isHi ? item.subtitleHi : item.subtitle}
                          </div>
                        </div>
                      </div>
                      <span className="w-9 h-9 rounded-full clay-btn-primary flex items-center justify-center shrink-0">
                        <Play className="w-4 h-4 ml-0.5" />
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStage('profile')}
                  className="h-11 px-4 rounded-[15px] clay-btn-secondary text-xs font-semibold cursor-pointer"
                >
                  {isHi ? 'प्रोफ़ाइल संपादित करें' : 'Edit Profile'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onOpenSafety()
                  }}
                  className="h-11 px-4 rounded-[15px] clay-btn-danger text-xs font-semibold cursor-pointer"
                >
                  {isHi ? 'सहायता प्राप्त करें' : 'Get Support'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-11 px-5 rounded-[15px] clay-btn-primary text-sm font-semibold cursor-pointer"
                >
                  {isHi ? 'बाद में फिर जांचें' : 'Recheck Later'}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
