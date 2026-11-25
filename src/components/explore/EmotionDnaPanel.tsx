import { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  Compass,
  Dna,
  Flame,
  Radar,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import type { EmotionDnaProfile, Language, UserAccount } from '../../types'

interface EmotionDnaPanelProps {
  account: UserAccount
  language: Language
  onUpdateEmotionDna: (dna: EmotionDnaProfile) => void
  onOpenTriggerDetective: () => void
  onExploreLog: (detail?: string) => void
}

type DnaSubTab = 'profile' | 'patterns' | 'triggers' | 'reports'

const AXES: {
  key: keyof Pick<
    EmotionDnaProfile,
    'lowFocus' | 'overthinking' | 'selfCriticism' | 'peoplePleasing' | 'anxiety'
  >
  label: string
  labelHi: string
  angleDeg: number
  explanation: string
  explanationHi: string
}[] = [
  {
    key: 'lowFocus',
    label: 'Low focus',
    labelHi: 'कम एकाग्रता',
    angleDeg: -90,
    explanation: 'Mental context-switching drains working memory and delays task completion.',
    explanationHi: 'बार-बार ध्यान भटकने से एकाग्रता और कार्य पूर्ण करने की गति कम होती है।',
  },
  {
    key: 'overthinking',
    label: 'Overthinking',
    labelHi: 'अति-चिंतन',
    angleDeg: -18,
    explanation: 'Repeated mental simulation burns calm energy before action even begins.',
    explanationHi: 'किसी बात को बार-बार दोहराने से मानसिक ऊर्जा जल्दी खर्च होती है।',
  },
  {
    key: 'selfCriticism',
    label: 'Self-criticism',
    labelHi: 'आत्म-आलोचना',
    angleDeg: 54,
    explanation: 'Harsh inner standards intensify fatigue during challenging weeks.',
    explanationHi: 'कठोर आत्म-आलोचना चुनौतीपूर्ण दिनों में थकान बढ़ाती है।',
  },
  {
    key: 'peoplePleasing',
    label: 'People-pleasing',
    labelHi: 'सबको खुश रखना',
    angleDeg: 126,
    explanation: 'Saying yes past capacity depletes boundaries and recovery hours.',
    explanationHi: 'अपनी क्षमता से अधिक जिम्मेदारी लेने से विश्राम का समय कम होता है।',
  },
  {
    key: 'anxiety',
    label: 'Anxiety',
    labelHi: 'चिंता / बेचैनी',
    angleDeg: 198,
    explanation: 'Anticipatory alertness keeps the autonomic nervous system slightly elevated.',
    explanationHi: 'भविष्य की चिंता तंत्रिका तंत्र को लगातार सतर्क रखती है।',
  },
]

export function EmotionDnaPanel({
  account,
  language,
  onUpdateEmotionDna,
  onOpenTriggerDetective,
  onExploreLog,
}: EmotionDnaPanelProps) {
  const isHi = language === 'hi'
  const baseDna: EmotionDnaProfile = account.emotionDna || {
    lowFocus: 74,
    overthinking: 78,
    selfCriticism: 52,
    peoplePleasing: 48,
    anxiety: 64,
    energyLevel: 68,
    updatedAt: 'Today',
  }

  const [draft, setDraft] = useState<EmotionDnaProfile>(baseDna)
  const [subTab, setSubTab] = useState<DnaSubTab>('profile')
  const [reportWindow, setReportWindow] = useState<'weekly' | 'monthly'>('weekly')
  const [savedNotice, setSavedNotice] = useState(false)

  useEffect(() => {
    setDraft(baseDna)
    onExploreLog('Viewed Emotion DNA profile')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account.id])

  const cx = 140
  const cy = 128
  const maxR = 78

  const polarPoint = (angleDeg: number, radiusRatio: number) => {
    const rad = (angleDeg * Math.PI) / 180
    return {
      x: cx + Math.cos(rad) * maxR * radiusRatio,
      y: cy + Math.sin(rad) * maxR * radiusRatio,
    }
  }

  const polygonPoints = AXES.map((a) => {
    const val = Math.max(15, Math.min(100, draft[a.key]))
    const pt = polarPoint(a.angleDeg, val / 100)
    return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`
  }).join(' ')

  const sortedAxes = [...AXES].sort((a, b) => draft[b.key] - draft[a.key])
  const topOne = sortedAxes[0]
  const topTwo = sortedAxes[1]

  const primaryComboTitle =
    (topOne.key === 'lowFocus' && topTwo.key === 'overthinking') ||
    (topOne.key === 'overthinking' && topTwo.key === 'lowFocus')
      ? isHi
        ? 'फोकस और एक्शन ड्रेन (Focus & Action Drain)'
        : 'Focus & Action Drain'
      : isHi
        ? `${topOne.labelHi} + ${topTwo.labelHi} संयोजन`
        : `${topOne.label} + ${topTwo.label} Cluster`

  const handleSaveCorrections = () => {
    onUpdateEmotionDna({
      ...draft,
      userCorrected: true,
    })
    onExploreLog('Updated Emotion DNA sliders')
    setSavedNotice(true)
    window.setTimeout(() => setSavedNotice(false), 2200)
  }

  const triggerLogs = account.triggerLogs || []

  return (
    <div className="space-y-5">
      {/* Top Emotion DNA Header Banner */}
      <section className="rounded-[26px] sample-pastel-sky p-6 space-y-4 border border-white/80 dark:border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#344932] dark:text-[#A8C6A4]">
              <Dna className="w-4 h-4" />
              <span>
                {isHi
                  ? 'Emotion DNA · व्यक्तिगत भावनात्मक प्रोफ़ाइल को समझें'
                  : 'Emotion DNA — Understand the individual with an evolving emotional profile'}
              </span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#1B251A] dark:text-[#E5E8CE]">
              {isHi ? 'आपकी Emotion DNA प्रोफ़ाइल तैयार है' : 'Your profile is ready'}
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'profile', label: isHi ? 'पैटर्न और सुधार' : 'Profile & Sliders', icon: Radar },
                { id: 'patterns', label: isHi ? 'तनाव व ऊर्जा' : 'Stress & Energy', icon: Activity },
                { id: 'triggers', label: isHi ? 'ट्रिगर व रिकवरी' : 'Triggers & Strengths', icon: Compass },
                { id: 'reports', label: isHi ? 'साप्ताहिक/मासिक रिपोर्ट' : 'Weekly & Monthly', icon: TrendingUp },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon
              const active = subTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSubTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[13px] text-xs font-semibold cursor-pointer transition-all ${
                    active ? 'clay-btn-primary' : 'clay-btn-secondary'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* TAB 1: 5-Axis Emotional Pattern Profile + Insight Alert + User-Correctable Sliders */}
      {subTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Dark Forest Clay Radar Card matching Sample Screenshot 3 */}
          <section className="lg:col-span-5 rounded-[26px] clay-card-forest p-6 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A8C6A4]">
                {isHi ? 'भावनात्मक पैटर्न प्रोफ़ाइल' : 'Emotional Pattern Profile'}
              </span>
              <span className="text-[11px] font-mono-num text-[#C5D8C1]">
                {draft.userCorrected
                  ? isHi
                    ? 'स्वयं समायोजित'
                    : 'User calibrated'
                  : isHi
                    ? 'स्वैच्छिक सिग्नल'
                    : 'Voluntary insights'}
              </span>
            </div>

            <div className="flex justify-center">
              <svg viewBox="0 0 280 255" className="w-full max-w-[290px]" aria-label="Emotion DNA pentagon chart">
                {/* 4 concentric pentagon grid rings */}
                {[0.25, 0.5, 0.75, 1].map((scale) => {
                  const ringPts = AXES.map((a) => {
                    const p = polarPoint(a.angleDeg, scale)
                    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
                  }).join(' ')
                  return (
                    <polygon
                      key={scale}
                      points={ringPts}
                      fill="none"
                      stroke="rgba(168, 198, 164, 0.22)"
                      strokeWidth="1"
                    />
                  )
                })}

                {/* Axis spokes */}
                {AXES.map((a) => {
                  const end = polarPoint(a.angleDeg, 1)
                  return (
                    <line
                      key={a.key}
                      x1={cx}
                      y1={cy}
                      x2={end.x}
                      y2={end.y}
                      stroke="rgba(168, 198, 164, 0.18)"
                      strokeWidth="1"
                    />
                  )
                })}

                {/* User Polygon Fill */}
                <polygon
                  points={polygonPoints}
                  fill="rgba(168, 198, 164, 0.28)"
                  stroke="#A8C6A4"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                />

                {/* Vertex Dots & Axis Labels */}
                {AXES.map((a) => {
                  const val = Math.max(15, Math.min(100, draft[a.key]))
                  const pt = polarPoint(a.angleDeg, val / 100)
                  const lbl = polarPoint(a.angleDeg, 1.28)
                  return (
                    <g key={a.key}>
                      <circle cx={pt.x} cy={pt.y} r="4.5" fill="#E5E8CE" stroke="#344932" strokeWidth="1.5" />
                      <text
                        x={lbl.x}
                        y={lbl.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#E5E8CE"
                        fontSize="10"
                        fontWeight="600"
                      >
                        {isHi ? a.labelHi : a.label}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>

            {/* Focus & Action Drain Banner matching screenshot callout */}
            <div className="rounded-[18px] bg-black/30 border border-[#A8C6A4]/25 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-bold text-[#F3D27A]">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{primaryComboTitle}</span>
              </div>
              <p className="text-xs text-[#E5E8CE]/90 leading-relaxed">
                {isHi
                  ? `जितना अधिक आपका मन दोहराव में उलझता है, उतना अधिक निर्णय ऊर्जा खर्च होती है। छोटे 10-मिनट के कदम सबसे प्रभावी हैं।`
                  : `The more your mind has to restart between thoughts, the faster mental energy drains. One grounded step lowers friction immediately.`}
              </p>
            </div>
          </section>

          {/* User-Correctable Insights + Pattern Explanations */}
          <section className="lg:col-span-7 rounded-[26px] clay-card p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#344932] dark:text-[#A8C6A4]">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{isHi ? 'स्व-संशोधित अंतर्दृष्टि (User-Correctable Insights)' : 'User-Correctable Insights & Explanations'}</span>
                </div>
                <p className="text-xs opacity-75 mt-0.5">
                  {isHi
                    ? 'यदि कोई पैटर्न आज के अनुभव से अलग लगे तो स्लाइडर समायोजित करें।'
                    : 'Adjust any axis below if your lived experience differs from automated estimates.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveCorrections}
                className="clay-btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-[13px] text-xs font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>
                  {savedNotice
                    ? isHi
                      ? 'सहेजा गया ✓'
                      : 'Saved ✓'
                    : isHi
                      ? 'प्रोफ़ाइल सहेजें'
                      : 'Save Calibration'}
                </span>
              </button>
            </div>

            <div className="space-y-3">
              {AXES.map((axis) => (
                <div key={axis.key} className="rounded-[18px] clay-tile p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>{isHi ? axis.labelHi : axis.label}</span>
                    <span className="font-mono-num text-[#344932] dark:text-[#A8C6A4]">
                      {draft[axis.key]}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={draft[axis.key]}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        [axis.key]: parseInt(e.target.value, 10),
                      }))
                    }
                    aria-label={axis.label}
                    className="w-full accent-[#4E6B4B]"
                  />
                  <p className="text-[11px] text-[#495847] dark:text-[#A8B7A4]">
                    {isHi ? axis.explanationHi : axis.explanation}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: Common Emotional Combinations, Stress Response Patterns, Sensitivity Map, Energy & Mood */}
      {subTab === 'patterns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <section className="rounded-[24px] clay-card p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#344932] dark:text-[#A8C6A4] uppercase">
              <Sparkles className="w-4 h-4" />
              <span>{isHi ? 'सामान्य भावनात्मक संयोजन' : 'Common Emotional Combinations'}</span>
            </div>
            <div className="space-y-2.5">
              <div className="rounded-[16px] clay-tile p-3.5">
                <div className="text-sm font-bold">
                  {isHi ? 'अति-चिंतन + कम एकाग्रता' : 'Overthinking + Low Focus Loop'}
                </div>
                <p className="text-xs opacity-80 mt-1">
                  {isHi
                    ? `संयुक्त स्कोर ${Math.round((draft.overthinking + draft.lowFocus) / 2)}% — एक साथ बहुत सारे कार्य चुनने पर निर्णय थकान।`
                    : `Combined index ${Math.round((draft.overthinking + draft.lowFocus) / 2)}% — multitasking triggers mental restart fatigue.`}
                </p>
              </div>
              <div className="rounded-[16px] clay-tile p-3.5">
                <div className="text-sm font-bold">
                  {isHi ? 'चिंता + सबको खुश रखने की प्रवृत्ति' : 'Anxiety + People-Pleasing Load'}
                </div>
                <p className="text-xs opacity-80 mt-1">
                  {isHi
                    ? `संयुक्त स्कोर ${Math.round((draft.anxiety + draft.peoplePleasing) / 2)}% — सीमाएं तय करने से शाम का तनाव घटता है।`
                    : `Combined index ${Math.round((draft.anxiety + draft.peoplePleasing) / 2)}% — gentle boundary scripts ease evening tension.`}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] clay-card p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#344932] dark:text-[#A8C6A4] uppercase">
              <Flame className="w-4 h-4" />
              <span>{isHi ? 'तनाव प्रतिक्रिया पैटर्न' : 'Stress Response Patterns'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                {
                  name: 'Over-Analysis (Freeze)',
                  pct: Math.round((draft.overthinking + draft.lowFocus) / 2),
                },
                {
                  name: 'Urgent Hyper-Alert (Flight)',
                  pct: draft.anxiety,
                },
                {
                  name: 'Inner Critique (Tighten)',
                  pct: draft.selfCriticism,
                },
                {
                  name: 'Accommodate (Fawn)',
                  pct: draft.peoplePleasing,
                },
              ].map((pat) => (
                <div key={pat.name} className="rounded-[15px] clay-tile p-3 space-y-1.5">
                  <div className="text-xs font-bold">{pat.name}</div>
                  <div className="text-lg font-bold font-mono-num text-[#344932] dark:text-[#A8C6A4]">
                    {pat.pct}%
                  </div>
                  <div className="h-1.5 rounded-full clay-well overflow-hidden">
                    <div className="h-full clay-bar-emerald" style={{ width: `${pat.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[24px] clay-card p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#344932] dark:text-[#A8C6A4] uppercase">
              <Radar className="w-4 h-4" />
              <span>{isHi ? 'भावनात्मक संवेदनशीलता मानचित्र' : 'Emotional Sensitivity Map'}</span>
            </div>
            <div className="space-y-2">
              {[
                { label: isHi ? 'नींद की कमी के प्रति संवेदनशीलता' : 'Sleep Deficit Sensitivity', val: Math.min(95, Math.round(100 - account.factors.sleepHours * 6)) },
                { label: isHi ? 'समय-सीमा व कार्यभार दबाव' : 'Deadline & Cognitive Load Sensitivity', val: draft.overthinking },
                { label: isHi ? 'सामाजिक अपेक्षा दबाव' : 'Social Expectation Sensitivity', val: draft.peoplePleasing },
              ].map((row) => (
                <div key={row.label} className="rounded-[14px] clay-well p-3 space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{row.label}</span>
                    <span className="font-mono-num">{row.val}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/40 dark:bg-black/30 overflow-hidden">
                    <div className="h-full clay-bar-emerald rounded-full" style={{ width: `${row.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[24px] clay-card p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#344932] dark:text-[#A8C6A4] uppercase">
              <BatteryCharging className="w-4 h-4" />
              <span>{isHi ? 'ऊर्जा और मूड का संबंध' : 'Energy & Mood Relationship'}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[16px] clay-tile p-3.5">
                <span className="text-[11px] opacity-75 block">{isHi ? 'वर्तमान ऊर्जा' : 'Energy Level'}</span>
                <span className="text-2xl font-bold font-mono-num">{draft.energyLevel}%</span>
              </div>
              <div className="rounded-[16px] clay-tile p-3.5">
                <span className="text-[11px] opacity-75 block">{isHi ? 'मूड इंडेक्स' : 'Wellness Index'}</span>
                <span className="text-2xl font-bold font-mono-num">{account.wellnessScore}/100</span>
              </div>
            </div>
            <p className="text-xs text-[#495847] dark:text-[#A8B7A4] leading-relaxed">
              {account.factors.sleepHours >= 7
                ? isHi
                  ? `${account.factors.sleepHours.toFixed(1)} घंटे की नींद आपके मूड और फोकस को स्थिर रख रही है।`
                  : `${account.factors.sleepHours.toFixed(1)} hrs of sleep positively correlates with steadier mood stability today.`
                : isHi
                  ? `${account.factors.sleepHours.toFixed(1)} घंटे की कम नींद से अति-चिंतन और फोकस थकान बढ़ी है।`
                  : `Shorter sleep (${account.factors.sleepHours.toFixed(1)} hrs) temporarily lowers energy buffer and increases overthinking.`}
            </p>
          </section>
        </div>
      )}

      {/* TAB 3: Personal Trigger Map, Emotional Recovery Patterns & Strengths */}
      {subTab === 'triggers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <section className="lg:col-span-7 rounded-[24px] clay-card p-5 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-base font-bold">
                  {isHi ? 'व्यक्तिगत ट्रिगर मानचित्र (Personal Trigger Map)' : 'Personal Trigger Map'}
                </h3>
                <p className="text-xs opacity-75">
                  {isHi
                    ? 'मानसिक जांच के Trigger Detective से स्वतः सिंक किया गया।'
                    : 'Live synced with your Trigger Detective entries inside Mental Check.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenTriggerDetective}
                className="clay-btn-primary px-3.5 py-2 rounded-[12px] text-xs font-semibold cursor-pointer"
              >
                {isHi ? '+ नया ट्रिगर जांचें' : '+ Log in Trigger Detective'}
              </button>
            </div>

            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {triggerLogs.length === 0 ? (
                <div className="rounded-[16px] clay-well p-4 text-xs opacity-75">
                  No triggers logged yet. Use Trigger Detective in Mental Check to map stressors.
                </div>
              ) : (
                triggerLogs.map((t) => (
                  <div key={t.id} className="rounded-[16px] clay-tile p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#344932] dark:text-[#A8C6A4]">
                        {t.emotion} · Intensity {t.intensity}/10
                      </span>
                      <span className="text-[11px] font-mono-num opacity-70">{t.date}</span>
                    </div>
                    <div className="text-xs font-semibold">{t.situation}</div>
                    <div className="text-[11px] opacity-80">
                      <strong>Reframe:</strong> {t.reframe}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="lg:col-span-5 space-y-4">
            <div className="rounded-[24px] clay-card p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#344932] dark:text-[#A8C6A4] uppercase">
                <ShieldCheck className="w-4 h-4" />
                <span>{isHi ? 'आपकी भावनात्मक शक्तियाँ' : 'Emotional Strengths'}</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="rounded-[14px] clay-well p-3">
                  <strong>{isHi ? 'नियमित आत्म-जागरूकता:' : 'High Self-Awareness:'}</strong>{' '}
                  {account.streakDays}-day consistency shows active emotional check-in discipline.
                </div>
                <div className="rounded-[14px] clay-well p-3">
                  <strong>{isHi ? 'पुनर्प्राप्ति लचीलापन:' : 'Recovery Responsiveness:'}</strong>{' '}
                  Soundscapes & paced breathing reliably calm baseline reactivity.
                </div>
              </div>
            </div>

            <div className="rounded-[24px] clay-card p-5 space-y-2.5">
              <div className="text-xs font-bold text-[#344932] dark:text-[#A8C6A4] uppercase">
                {isHi ? 'भावनात्मक रिकवरी पैटर्न' : 'Emotional Recovery Patterns'}
              </div>
              <p className="text-xs leading-relaxed opacity-85">
                {isHi
                  ? 'जब आप ट्रिगर के बाद 4-4-4-4 ब्रीदिंग और छोटा कार्य (Low-Mood Support) चुनते हैं, तो आपका स्कोर औसतन 18% तेजी से सामान्य होता है।'
                  : 'Pairing paced breathing with a single small action step rebounds calm balance noticeably faster than rumination alone.'}
              </p>
            </div>
          </section>
        </div>
      )}

      {/* TAB 4: Weekly & Monthly Emotional Reports */}
      {subTab === 'reports' && (
        <section className="rounded-[24px] clay-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold">
                {isHi ? 'साप्ताहिक एवं मासिक भावनात्मक रिपोर्ट' : 'Weekly & Monthly Emotional Reports'}
              </h3>
              <p className="text-xs opacity-75">
                {isHi ? 'लगातार प्रगति और शांत संतुलन सारांश' : 'Aggregate trend across mood, triggers, sleep, and calm recovery'}
              </p>
            </div>
            <div className="flex gap-2">
              {(['weekly', 'monthly'] as const).map((win) => (
                <button
                  key={win}
                  type="button"
                  onClick={() => setReportWindow(win)}
                  className={`px-3.5 py-1.5 rounded-[11px] text-xs font-semibold cursor-pointer capitalize ${
                    reportWindow === win ? 'clay-btn-primary' : 'clay-btn-secondary'
                  }`}
                >
                  {win === 'weekly' ? (isHi ? 'साप्ताहिक' : 'Weekly') : isHi ? 'मासिक' : 'Monthly'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="rounded-[18px] clay-tile p-4">
              <span className="text-[11px] opacity-75 block">
                {reportWindow === 'weekly' ? '7-Day Wellness Avg' : '30-Day Wellness Avg'}
              </span>
              <span className="text-xl font-bold font-mono-num">
                {reportWindow === 'weekly' ? account.wellnessScore : Math.max(60, account.wellnessScore - 2)}/100
              </span>
            </div>
            <div className="rounded-[18px] clay-tile p-4">
              <span className="text-[11px] opacity-75 block">Top Focus Pattern</span>
              <span className="text-sm font-bold">{topOne.label} ({draft[topOne.key]}%)</span>
            </div>
            <div className="rounded-[18px] clay-tile p-4">
              <span className="text-[11px] opacity-75 block">Triggers Reframed</span>
              <span className="text-xl font-bold font-mono-num">{triggerLogs.length}</span>
            </div>
            <div className="rounded-[18px] clay-tile p-4">
              <span className="text-[11px] opacity-75 block">Avg Restorative Sleep</span>
              <span className="text-xl font-bold font-mono-num">{account.factors.sleepHours.toFixed(1)}h</span>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
