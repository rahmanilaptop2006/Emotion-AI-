import { useState, type FormEvent } from 'react'
import {
  Check,
  Clock,
  Flame,
  Headphones,
  LogOut,
  Moon,
  Plus,
  Smile,
  Sparkles,
  Sun,
  Trash2,
  UserCheck,
  Wind,
} from 'lucide-react'
import { motion } from 'framer-motion'
import type { HabitCategory, Language, TabId, ThemeMode, TonicLog, UserAccount } from '../types'

interface ReportTabProps {
  account: UserAccount
  language: Language
  theme: ThemeMode
  onToggleTheme: () => void
  onOpenProfile: () => void
  onSignOut: () => void
  onToggleTonicSlot: (slot: TonicLog['slot']) => void
  onToggleHabit: (habitId: string) => void
  onAddHabit: (title: string, category: HabitCategory, targetMinutes: number) => void
  onDeleteHabit: (habitId: string) => void
  onOpenBreathing: () => void
  onNavigateTab: (tab: TabId) => void
}

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const CATEGORY_META: Record<
  HabitCategory,
  { label: string; labelHi: string; icon: typeof Wind }
> = {
  breathing: { label: 'Breathing', labelHi: 'प्राणायाम', icon: Wind },
  meditation: { label: 'Sound Calm', labelHi: 'ध्वनि विश्राम', icon: Headphones },
  'digital-hygiene': { label: 'Sleep Hygiene', labelHi: 'नींद विश्राम', icon: Moon },
  somatic: { label: 'Grounding', labelHi: 'ग्राउंडिंग', icon: Sparkles },
}

export function ReportTab({
  account,
  language,
  theme,
  onToggleTheme,
  onOpenProfile,
  onSignOut,
  onToggleTonicSlot,
  onToggleHabit,
  onAddHabit,
  onDeleteHabit,
  onOpenBreathing,
  onNavigateTab,
}: ReportTabProps) {
  const isHi = language === 'hi'
  const today = new Date().toISOString().slice(0, 10)

  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState<HabitCategory>('breathing')
  const [newMinutes, setNewMinutes] = useState(5)

  const morningTaken = account.tonicLogs.some(
    (t) => t.date === today && t.slot === 'Morning 10ml' && t.taken
  )
  const eveningTaken = account.tonicLogs.some(
    (t) => t.date === today && t.slot === 'Evening 10ml' && t.taken
  )

  const todayHabitLogs = account.habitLogs.filter((l) => l.date === today && l.completed)
  const completedHabitIds = new Set(todayHabitLogs.map((l) => l.habitId))

  const completedTonicCount = (morningTaken ? 1 : 0) + (eveningTaken ? 1 : 0)
  const completedMindfulnessCount = account.mindfulnessHabits.filter((h) =>
    completedHabitIds.has(h.id)
  ).length

  const totalHabitsToday = 2 + account.mindfulnessHabits.length
  const completedTotalToday = completedTonicCount + completedMindfulnessCount
  const completionPct =
    totalHabitsToday > 0 ? Math.round((completedTotalToday / totalHabitsToday) * 100) : 0

  const handleSlug = `@${account.name.trim().split(/\s+/)[0].toLowerCase()}`
  const latestMood =
    account.latestAssessment?.dailyMood ||
    account.checkIns[account.checkIns.length - 1]?.moodLabel ||
    'Balanced'

  // Build smooth dual-wave curves matching Sample Card 6 ("Progress · Weekly trend")
  const primarySeries = WEEK_DAYS.map((_, idx) => {
    const ci = account.checkIns[idx % Math.max(1, account.checkIns.length)]
    return Math.max(35, Math.min(95, ci?.wellnessScore ?? account.wellnessScore))
  })
  const secondarySeries = WEEK_DAYS.map((_, idx) => {
    const ci = account.checkIns[idx % Math.max(1, account.checkIns.length)]
    const sleepNorm = ((ci?.sleepHours ?? account.factors.sleepHours) / 9) * 100
    return Math.max(30, Math.min(92, Math.round(sleepNorm)))
  })

  const buildSmoothPath = (vals: number[], width: number, height: number) => {
    const pts = vals.map((v, i) => ({
      x: 10 + (i / (vals.length - 1)) * (width - 20),
      y: height - 14 - ((v - 25) / 75) * (height - 28),
    }))
    if (pts.length === 0) return ''
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i]
      const p1 = pts[i + 1]
      const cx = (p0.x + p1.x) / 2
      d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`
    }
    return d
  }

  const handleCreateHabit = (e: FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    onAddHabit(newTitle.trim(), newCategory, newMinutes)
    setNewTitle('')
    setNewMinutes(5)
  }

  return (
    <div className="space-y-6">
      {/* =====================================================================
          1. PROFILE SECTION (Moved from Dashboard to Report)
         ===================================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-[28px] clay-card p-6 sm:p-7"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full clay-btn-primary flex items-center justify-center font-display text-lg font-bold shrink-0">
              {account.avatarInitials}
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#344932] dark:text-[#A8C6A4]">
                {isHi ? 'मरीज़ प्रोफ़ाइल' : 'Patient Profile'}
              </div>
              <h2 className="font-display text-xl font-bold text-[#1B251A] dark:text-[#E5E8CE]">
                {account.name}
              </h2>
              <p className="text-xs text-[#495847] dark:text-[#A8C6A4]">
                {account.role} · {account.institution}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3.5 py-2 rounded-[14px] clay-tile text-xs font-bold font-mono-num text-[#344932] dark:text-[#A8C6A4]">
              Wellness {account.wellnessScore}/100
            </span>
            <button
              type="button"
              onClick={onOpenProfile}
              className="clay-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[14px] text-xs font-semibold cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{isHi ? 'प्रोफ़ाइल संपादित करें' : 'Edit Profile'}</span>
            </button>
            <button
              type="button"
              onClick={onToggleTheme}
              className="clay-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[14px] text-xs font-semibold cursor-pointer"
            >
              {theme === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              <span>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="clay-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[14px] text-xs font-semibold text-[#B42318] dark:text-[#F07D73] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isHi ? 'साइन आउट' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </motion.section>

      {/* =====================================================================
          2. PROGRESS OVERVIEW CARD (Exact Sample Card 6 Layout)
         ===================================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-[28px] sample-pastel-sky p-6 sm:p-7 space-y-5 shadow-[0_18px_40px_-14px_rgba(27,42,26,0.18)] border border-white/80 dark:border-white/10"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#344932] dark:text-[#A8C6A4]">
              {isHi
                ? 'Recovery Journey · व्यक्तिगत प्रगति सीखें और ट्रैक करें'
                : 'Recovery Journey — Learn and track personal progress.'}
            </div>
            <h3 className="font-display text-2xl font-bold text-[#1B251A] dark:text-[#E5E8CE] tracking-tight">
              {isHi ? 'प्रगति रिपोर्ट' : 'Progress'}
            </h3>
            <p className="text-xs text-[#495847] dark:text-[#A8C6A4] mt-0.5">
              {isHi ? 'साप्ताहिक रुझान (Weekly trend)' : 'Weekly trend'} · {handleSlug}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 text-[#344932] dark:text-[#A8C6A4]">
              <span className="w-3 h-1 rounded-full bg-[#4E6B4B]" /> Mood &amp; Calm
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#6E8B6A] dark:text-[#C8D8BC]">
              <span className="w-3 h-1 rounded-full bg-[#87A583]" /> Sleep Balance
            </span>
          </div>
        </div>

        {/* Dual Smooth Wave SVG Chart */}
        <div className="rounded-[22px] bg-white/70 dark:bg-[#142014]/80 border border-white/80 dark:border-white/10 p-4 sm:p-5">
          <svg viewBox="0 0 600 120" className="w-full h-32 overflow-visible" aria-label="Weekly trend wave chart">
            <defs>
              <linearGradient id="reportWaveArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#5E7D5B" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#5E7D5B" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={buildSmoothPath(secondarySeries, 600, 110)}
              fill="none"
              stroke="#89A885"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d={buildSmoothPath(primarySeries, 600, 110)}
              fill="none"
              stroke="#3F5C3D"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
          <div className="flex justify-between text-[11px] font-medium text-[#495847] dark:text-[#A8C6A4] px-2 pt-1">
            {WEEK_DAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
        </div>

        {/* 3 Clean Patient Summary Tiles: Streak | Mood | Sleep */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="rounded-[20px] bg-white/85 dark:bg-[#192819] border border-white/90 dark:border-white/10 p-4 flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-[14px] bg-[#FFF2D9] dark:bg-[#3A2F1C] text-[#D4821E] flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </span>
            <div>
              <div className="text-xs font-medium text-[#495847] dark:text-[#A8C6A4]">
                {isHi ? 'लगातार दिन' : 'Streak'}
              </div>
              <div className="text-base font-bold text-[#1B251A] dark:text-[#E5E8CE]">
                {account.streakDays}-day streak
              </div>
            </div>
          </div>

          <div className="rounded-[20px] bg-white/85 dark:bg-[#192819] border border-white/90 dark:border-white/10 p-4 flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-[14px] bg-[#E5ECD7] dark:bg-[#233623] text-[#344932] dark:text-[#A8C6A4] flex items-center justify-center shrink-0">
              <Smile className="w-5 h-5" />
            </span>
            <div>
              <div className="text-xs font-medium text-[#495847] dark:text-[#A8C6A4]">
                {isHi ? 'मूड और स्कोर' : 'Mood'}
              </div>
              <div className="text-base font-bold text-[#1B251A] dark:text-[#E5E8CE] truncate">
                {latestMood} ({account.wellnessScore}/100)
              </div>
            </div>
          </div>

          <div className="rounded-[20px] bg-white/85 dark:bg-[#192819] border border-white/90 dark:border-white/10 p-4 flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-[14px] bg-[#E0EAD2] dark:bg-[#223322] text-[#4E6B4B] dark:text-[#A8C6A4] flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5" />
            </span>
            <div>
              <div className="text-xs font-medium text-[#495847] dark:text-[#A8C6A4]">
                {isHi ? 'नींद' : 'Sleep'}
              </div>
              <div className="text-base font-bold font-mono-num text-[#1B251A] dark:text-[#E5E8CE]">
                {account.factors.sleepHours.toFixed(1)} hrs
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* =====================================================================
          3. SIMPLE TODAY'S DOSES & DAILY WELLNESS HABITS
         ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Oral Syrup Check-off */}
        <section className="lg:col-span-5 rounded-[26px] clay-card p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-base font-bold text-[#1B251A] dark:text-[#E5E8CE]">
                {isHi ? 'आज की सिरप खुराक' : "Today's Oral Syrup"}
              </h3>
              <p className="text-xs text-[#495847] dark:text-[#A8C6A4]">
                {completedTonicCount}/2 {isHi ? 'पूर्ण' : 'completed today'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('treatment')}
              className="clay-btn-secondary px-3 py-1.5 rounded-[11px] text-xs font-semibold cursor-pointer"
            >
              {isHi ? 'उपचार देखें' : 'Treatment'}
            </button>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => onToggleTonicSlot('Morning 10ml')}
              className={`w-full rounded-[18px] p-4 flex items-center justify-between gap-3 text-left cursor-pointer ${
                morningTaken ? 'clay-btn-primary' : 'clay-tile'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center">
                  {morningTaken ? <Check className="w-4 h-4" /> : <Sun className="w-4 h-4 text-[#344932] dark:text-[#A8C6A4]" />}
                </span>
                <div>
                  <div className="text-sm font-bold">{isHi ? 'सुबह की खुराक' : 'Morning Dose'}</div>
                  <div className={`text-xs ${morningTaken ? 'text-white/80' : 'text-[#495847] dark:text-[#A8C6A4]'}`}>
                    {account.acuteSyrupRx?.morningDoseMl ?? 10} ml
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold">{morningTaken ? 'Taken ✓' : 'Mark'}</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleTonicSlot('Evening 10ml')}
              className={`w-full rounded-[18px] p-4 flex items-center justify-between gap-3 text-left cursor-pointer ${
                eveningTaken ? 'clay-btn-primary' : 'clay-tile'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center">
                  {eveningTaken ? <Check className="w-4 h-4" /> : <Moon className="w-4 h-4 text-[#344932] dark:text-[#A8C6A4]" />}
                </span>
                <div>
                  <div className="text-sm font-bold">{isHi ? 'शाम की खुराक' : 'Evening Dose'}</div>
                  <div className={`text-xs ${eveningTaken ? 'text-white/80' : 'text-[#495847] dark:text-[#A8C6A4]'}`}>
                    {account.acuteSyrupRx?.eveningDoseMl ?? 10} ml
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold">{eveningTaken ? 'Taken ✓' : 'Mark'}</span>
            </button>
          </div>

          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-semibold text-[#344932] dark:text-[#A8C6A4]">
              <span>{isHi ? 'आज की दैनिक प्रगति' : "Today's Completion"}</span>
              <span className="font-mono-num">{completionPct}%</span>
            </div>
            <div className="w-full h-3 rounded-full clay-well p-0.5 overflow-hidden">
              <div
                className="h-full rounded-full clay-bar-emerald transition-all duration-300"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        </section>

        {/* Simple Daily Mindfulness Activities (Auto-Marked via Exploration Analytics) */}
        <section className="lg:col-span-7 rounded-[26px] clay-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-base font-bold text-[#1B251A] dark:text-[#E5E8CE]">
                  {isHi ? 'दैनिक डिजिटल वेलनेस गतिविधियाँ' : 'Daily Digital Wellness Activities'}
                </h3>
                {Object.values(account.explorationTracker?.autoMarkedHabits || {}).some(
                  (m) => m.date === today
                ) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[10px] clay-card-tint text-[10px] font-bold text-[#344932] dark:text-[#A8C6A4]">
                    <Sparkles className="w-3 h-3" />
                    {isHi ? 'एक्सप्लोरेशन से स्वतः चिह्नित' : 'Auto-tracked via Exploration'}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#495847] dark:text-[#A8C6A4]">
                {isHi
                  ? 'इमोशन DNA, ब्रीदिंग, नींद या मेंटल चेक उपयोग करने पर स्वतः पूर्ण चिह्नित होता है · मैन्युअल रूप से बदलने के लिए टैप करें'
                  : 'Automatically marked when you explore Emotion DNA, Breathing, Trigger Detective, or Sleep & Recovery · or tap to toggle'}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenBreathing}
              className="clay-btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[13px] text-xs font-semibold cursor-pointer"
            >
              <Wind className="w-3.5 h-3.5" />
              <span>{isHi ? 'ब्रीदिंग शुरू करें' : 'Breathing Mode'}</span>
            </button>
          </div>

          {(() => {
            const todayExplored = (account.explorationTracker?.exploredModules || [])
              .filter((k) => k.startsWith(`${today}:`))
              .map((k) => k.split(':')[1])
            if (todayExplored.length === 0) return null
            const LABELS: Record<string, string> = {
              sound: isHi ? 'साउंड थेरेपी' : 'Soundscapes',
              breathing: isHi ? 'ब्रीदिंग' : 'Breathing',
              grounding: isHi ? 'ग्राउंडिंग' : 'Grounding',
              sleep: isHi ? 'नींद और रिकवरी' : 'Sleep & Recovery',
              low_mood: isHi ? 'लो-मूड सहायता' : 'Low-Mood Support',
              mindgym: isHi ? 'माइंडजिम' : 'MindGym',
              emotion_dna: isHi ? 'इमोशन DNA' : 'Emotion DNA',
              trigger_detective: isHi ? 'ट्रिगर डिटेक्टिव' : 'Trigger Detective',
              guided: isHi ? 'गाइडेड थेरेपी' : 'Guided Therapy',
              worry_journal: isHi ? 'रात्रि जर्नल' : 'Worry Journal',
            }
            return (
              <div className="rounded-[16px] clay-well px-3.5 py-2.5 flex flex-wrap items-center gap-2 text-[11px] text-[#344932] dark:text-[#A8C6A4]">
                <span className="font-bold">
                  {isHi ? 'आज की विश्लेषित गतिविधियाँ:' : "Today's analyzed exploration:"}
                </span>
                {todayExplored.map((mod) => (
                  <span
                    key={mod}
                    className="px-2 py-0.5 rounded-[8px] bg-white/75 dark:bg-[#1A291A] font-semibold"
                  >
                    {LABELS[mod] || mod}
                  </span>
                ))}
              </div>
            )
          })()}

          <div className="space-y-2.5">
            {account.mindfulnessHabits.map((habit) => {
              const done = completedHabitIds.has(habit.id)
              const cat = CATEGORY_META[habit.category]
              const CatIcon = cat.icon
              const autoMeta = account.explorationTracker?.autoMarkedHabits?.[habit.id]
              const isAutoToday = done && autoMeta?.date === today
              return (
                <div
                  key={habit.id}
                  className={`rounded-[18px] p-3.5 flex items-center justify-between gap-3 ${
                    done ? 'clay-card-tint' : 'clay-tile'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleHabit(habit.id)}
                    className="flex-1 flex items-center gap-3 text-left cursor-pointer min-w-0"
                  >
                    <span
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        done ? 'clay-btn-primary' : 'clay-well text-[#344932] dark:text-[#A8C6A4]'
                      }`}
                    >
                      {done ? <Check className="w-4 h-4" /> : <CatIcon className="w-4 h-4" />}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-sm font-bold truncate ${done ? 'line-through opacity-75' : ''}`}>
                          {isHi ? habit.titleHi : habit.title}
                        </span>
                        {isAutoToday && autoMeta && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] bg-white/80 dark:bg-[#162416] text-[10px] font-bold text-[#344932] dark:text-[#A8C6A4]">
                            <Sparkles className="w-2.5 h-2.5" />
                            {isHi ? autoMeta.sourceHi : `Auto-marked via ${autoMeta.source}`}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#495847] dark:text-[#A8C6A4] flex items-center gap-2">
                        <span>{isHi ? cat.labelHi : cat.label}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1 font-mono-num">
                          <Clock className="w-3 h-3" /> {habit.targetMinutes}m
                        </span>
                      </div>
                    </div>
                  </button>

                  {habit.custom && (
                    <button
                      type="button"
                      onClick={() => onDeleteHabit(habit.id)}
                      aria-label={`Remove ${habit.title}`}
                      className="clay-btn-secondary p-2 rounded-[10px] text-[#B42318] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <form onSubmit={handleCreateHabit} className="rounded-[18px] clay-well p-3.5 flex flex-wrap gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={isHi ? 'नई आदत जोड़ें...' : 'Add a daily activity...'}
              className="flex-1 min-w-[160px] h-10 rounded-[12px] clay-input px-3 text-xs"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as HabitCategory)}
              aria-label="Habit category"
              className="h-10 rounded-[12px] clay-input px-2.5 text-xs"
            >
              <option value="breathing">Breathing</option>
              <option value="meditation">Sound Calm</option>
              <option value="somatic">Grounding</option>
              <option value="digital-hygiene">Sleep Hygiene</option>
            </select>
            <input
              type="number"
              min={1}
              max={60}
              value={newMinutes}
              onChange={(e) => setNewMinutes(Math.max(1, parseInt(e.target.value, 10) || 5))}
              aria-label="Minutes"
              className="w-14 h-10 rounded-[12px] clay-input text-center text-xs font-mono-num font-bold"
            />
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="h-10 px-4 rounded-[12px] clay-btn-primary disabled:opacity-50 inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isHi ? 'जोड़ें' : 'Add'}</span>
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
