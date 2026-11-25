import { useState, type FormEvent } from 'react'
import {
  Battery,
  Check,
  HeartHandshake,
  ListChecks,
  Plus,
  Sparkles,
  Stethoscope,
  Sun,
  Users,
} from 'lucide-react'
import type { Language, LowMoodPlanItem, UserAccount } from '../../types'

interface LowMoodSupportPanelProps {
  account: UserAccount
  language: Language
  onTogglePlanItem: (itemId: string) => void
  onAddPlanItem: (item: Omit<LowMoodPlanItem, 'id' | 'date' | 'completed'>) => void
  onSaveReflection: (text: string) => void
  onNavigateToTreatment: () => void
}

const ACTION_IDEAS: Omit<LowMoodPlanItem, 'id' | 'date' | 'completed'>[] = [
  {
    title: 'Clean something',
    titleHi: 'कुछ छोटा साफ करें',
    energyTag: 'Low',
    category: 'action',
  },
  {
    title: 'Make a to-do list',
    titleHi: 'छोटी टू-डू सूची बनाएं',
    energyTag: 'Low',
    category: 'routine',
  },
  {
    title: 'Go to bed early',
    titleHi: 'आज जल्दी सोने जाएं',
    energyTag: 'Low',
    category: 'routine',
  },
  {
    title: 'Listen to 1 calming soundscape & stretch',
    titleHi: 'एक शांत ध्वनि सुनकर हल्की स्ट्रेचिंग करें',
    energyTag: 'Medium',
    category: 'pleasant',
  },
  {
    title: 'Send a warm check-in text to a friend or family member',
    titleHi: 'किसी मित्र या परिवारजन को संदेश भेजें',
    energyTag: 'Medium',
    category: 'social',
  },
  {
    title: '15-minute brisk outdoor walk',
    titleHi: '15 मिनट बाहर पैदल टहलें',
    energyTag: 'High',
    category: 'action',
  },
]

const MORNING_STEPS = [
  { id: 'ms-1', en: 'Open curtains / get natural daylight (5 min)', hi: 'सुबह की प्राकृतिक रोशनी लें (5 मि)' },
  { id: 'ms-2', en: 'Drink a full glass of water before phone scrolling', hi: 'फोन से पहले एक गिलास पानी पिएं' },
  { id: 'ms-3', en: 'Choose 1 small, gentle win for this morning', hi: 'आज सुबह के लिए 1 सरल कार्य चुनें' },
]

export function LowMoodSupportPanel({
  account,
  language,
  onTogglePlanItem,
  onAddPlanItem,
  onSaveReflection,
  onNavigateToTreatment,
}: LowMoodSupportPanelProps) {
  const isHi = language === 'hi'
  const plan = account.lowMoodPlan || []
  const [energyFilter, setEnergyFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All')
  const [customTask, setCustomTask] = useState('')
  const [customEnergy, setCustomEnergy] = useState<'Low' | 'Medium' | 'High'>('Low')
  const [morningDone, setMorningDone] = useState<string[]>(['ms-1'])
  const [compassionIndex, setCompassionIndex] = useState(0)
  const [reflectionText, setReflectionText] = useState(account.lowMoodReflection || '')
  const [savedFlash, setSavedFlash] = useState(false)

  const compassionPrompts = isHi
    ? [
        'कम ऊर्जा वाले दिन कमजोरी नहीं हैं — शरीर धीमा होकर संतुलन बना रहा है।',
        'आज एक छोटे कदम का पूर्ण होना भी एक वास्तविक उपलब्धि है।',
        'खुद से वैसे ही बात करें जैसे आप अपने किसी प्रिय मित्र से बात करते हैं।',
      ]
    : [
        'Low-energy days are a biological signal to pace gently, not a personal failure.',
        'Finishing one tiny 2-minute action creates real momentum in behavioural activation.',
        'Speak to yourself today with the patience you would offer a close friend.',
      ]

  const filteredIdeas =
    energyFilter === 'All' ? ACTION_IDEAS : ACTION_IDEAS.filter((a) => a.energyTag === energyFilter)

  const filteredPlan =
    energyFilter === 'All' ? plan : plan.filter((p) => p.energyTag === energyFilter)

  const completedCount = plan.filter((p) => p.completed).length
  const pct = plan.length > 0 ? Math.round((completedCount / plan.length) * 100) : 0

  const handleAddCustom = (e: FormEvent) => {
    e.preventDefault()
    if (!customTask.trim()) return
    onAddPlanItem({
      title: customTask.trim(),
      titleHi: customTask.trim(),
      energyTag: customEnergy,
      category: 'action',
    })
    setCustomTask('')
  }

  return (
    <div className="space-y-5">
      {/* Top Sample Card Layout: "Let's get practical — Tap + to add to today's plan" */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <section className="lg:col-span-5 rounded-[26px] sample-pastel-sky p-6 space-y-4 border border-white/80 dark:border-white/10">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#344932] dark:text-[#A8C6A4]">
              {isHi ? 'अवसाद एवं लो-मूड सहायता' : 'Depression & Low-Mood Support'}
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold text-[#1B251A] dark:text-[#E5E8CE]">
              {isHi ? 'व्यावहारिक शुरुआत करें' : "Let's get practical"}
            </h2>
            <p className="text-xs text-[#495847] dark:text-[#A8C6A4] mt-0.5">
              {isHi ? 'आने वाले दिन के लिए छोटे कार्य · जोड़ने के लिए + टैप करें' : "Action ideas for the day ahead · Tap + to add to today's plan"}
            </p>
          </div>

          {/* Energy-Aware Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold mr-1 flex items-center gap-1">
              <Battery className="w-3.5 h-3.5" /> Energy:
            </span>
            {(['All', 'Low', 'Medium', 'High'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setEnergyFilter(lvl)}
                className={`px-2.5 py-1 rounded-[10px] text-[11px] font-semibold cursor-pointer ${
                  energyFilter === lvl ? 'clay-btn-primary' : 'clay-btn-secondary'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Practical Action Ideas with + button matching screenshot */}
          <div className="space-y-2.5">
            {filteredIdeas.map((idea) => {
              const alreadyAdded = plan.some(
                (p) => p.title.toLowerCase() === idea.title.toLowerCase()
              )
              return (
                <div
                  key={idea.title}
                  className="rounded-[18px] clay-tile px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#1B251A] dark:text-[#E5E8CE] truncate">
                      {isHi ? idea.titleHi : idea.title}
                    </div>
                    <div className="text-[11px] text-[#495847] dark:text-[#A8B7A4]">
                      {idea.energyTag} energy · {idea.category}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={alreadyAdded}
                    onClick={() => onAddPlanItem(idea)}
                    aria-label={`Add ${idea.title}`}
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 cursor-pointer ${
                      alreadyAdded ? 'clay-btn-primary opacity-75' : 'clay-btn-primary'
                    }`}
                  >
                    {alreadyAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        {/* Right: Behavioural Activation & Daily Accomplishment Tracker */}
        <section className="lg:col-span-7 rounded-[26px] clay-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#344932] dark:text-[#A8C6A4]">
                <ListChecks className="w-4 h-4" />
                <span>{isHi ? 'व्यवहारिक सक्रियण व दैनिक उपलब्धि ट्रैकर' : 'Behavioural Activation & Accomplishment Tracker'}</span>
              </div>
              <h3 className="font-display text-lg font-bold mt-0.5">
                {isHi ? 'आज के छोटे कदम' : "Today's Small-Step Goals"}
              </h3>
            </div>
            <span className="font-mono-num text-xs font-bold px-3 py-1.5 rounded-[11px] clay-tile">
              {completedCount}/{plan.length} Done ({pct}%)
            </span>
          </div>

          <div className="h-2.5 rounded-full clay-well p-0.5 overflow-hidden">
            <div
              className="h-full rounded-full clay-bar-emerald transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="space-y-2 max-h-[235px] overflow-y-auto pr-1">
            {filteredPlan.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onTogglePlanItem(item.id)}
                className={`w-full rounded-[16px] p-3.5 flex items-center justify-between gap-3 text-left cursor-pointer transition-all ${
                  item.completed ? 'clay-card-tint' : 'clay-tile'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      item.completed ? 'clay-btn-primary' : 'clay-well'
                    }`}
                  >
                    {item.completed && <Check className="w-3.5 h-3.5" />}
                  </span>
                  <div className="min-w-0">
                    <div className={`text-sm font-bold truncate ${item.completed ? 'line-through opacity-75' : ''}`}>
                      {isHi ? item.titleHi : item.title}
                    </div>
                    <div className="text-[11px] opacity-75">
                      {item.energyTag} energy · {item.category}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold shrink-0">
                  {item.completed ? 'Completed ✓' : 'Tap to complete'}
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={handleAddCustom} className="rounded-[16px] clay-well p-3 flex flex-wrap gap-2">
            <input
              type="text"
              value={customTask}
              onChange={(e) => setCustomTask(e.target.value)}
              placeholder={isHi ? 'एक छोटा कदम जोड़ें...' : 'Add a gentle small-step goal...'}
              className="flex-1 min-w-[180px] h-10 rounded-[12px] clay-input px-3 text-xs"
            />
            <select
              value={customEnergy}
              onChange={(e) => setCustomEnergy(e.target.value as 'Low' | 'Medium' | 'High')}
              className="h-10 rounded-[12px] clay-input px-2.5 text-xs font-semibold"
            >
              <option value="Low">Low Energy</option>
              <option value="Medium">Medium Energy</option>
              <option value="High">High Energy</option>
            </select>
            <button
              type="submit"
              disabled={!customTask.trim()}
              className="clay-btn-primary h-10 px-4 rounded-[12px] text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              + {isHi ? 'जोड़ें' : 'Add'}
            </button>
          </form>
        </section>
      </div>

      {/* Bottom 3 Pillars: Morning Routine | Self-Compassion & Social Connection | Progress Reflection & Professional Care */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <section className="rounded-[24px] clay-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#344932] dark:text-[#A8C6A4] uppercase">
            <Sun className="w-4 h-4" />
            <span>{isHi ? 'सुबह की दिनचर्या सहायता' : 'Morning Routine Support'}</span>
          </div>
          <div className="space-y-2">
            {MORNING_STEPS.map((st) => {
              const checked = morningDone.includes(st.id)
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() =>
                    setMorningDone((prev) =>
                      prev.includes(st.id) ? prev.filter((x) => x !== st.id) : [...prev, st.id]
                    )
                  }
                  className={`w-full rounded-[14px] p-3 text-left text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
                    checked ? 'clay-card-tint' : 'clay-tile'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      checked ? 'clay-btn-primary' : 'clay-well'
                    }`}
                  >
                    {checked && <Check className="w-3 h-3" />}
                  </span>
                  <span>{isHi ? st.hi : st.en}</span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-[24px] clay-card p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#344932] dark:text-[#A8C6A4] uppercase">
              <HeartHandshake className="w-4 h-4" />
              <span>{isHi ? 'आत्म-करुणा और सामाजिक जुड़ाव' : 'Self-Compassion & Social'}</span>
            </div>
            <div className="rounded-[16px] clay-card-tint p-3.5 text-xs leading-relaxed">
              "{compassionPrompts[compassionIndex % compassionPrompts.length]}"
            </div>
            <button
              type="button"
              onClick={() => setCompassionIndex((i) => i + 1)}
              className="clay-btn-secondary px-3 py-1.5 rounded-[11px] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isHi ? 'अगला आत्म-करुणा विचार' : 'Next Compassion Prompt'}</span>
            </button>
          </div>

          <div className="rounded-[15px] clay-well p-3 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Users className="w-4 h-4 text-[#4E6B4B] shrink-0" />
              <span className="truncate">
                {account.trustedContacts[0]
                  ? `Circle: ${account.trustedContacts[0].name}`
                  : 'Connect with a trusted person'}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] clay-card p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-[#344932] dark:text-[#A8C6A4] uppercase">
              {isHi ? 'प्रगति चिंतन (Progress Reflection)' : 'Progress Reflection'}
            </div>
            <textarea
              rows={3}
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder={
                isHi
                  ? 'आज कौन सा छोटा कदम थोड़ा आसान लगा?'
                  : 'What felt slightly lighter or manageable today?'
              }
              className="w-full rounded-[14px] clay-input p-3 text-xs resize-none"
            />
            <button
              type="button"
              onClick={() => {
                onSaveReflection(reflectionText)
                setSavedFlash(true)
                window.setTimeout(() => setSavedFlash(false), 2000)
              }}
              className="clay-btn-primary w-full py-2 rounded-[12px] text-xs font-semibold cursor-pointer"
            >
              {savedFlash ? (isHi ? 'सहेजा गया ✓' : 'Reflection Saved ✓') : isHi ? 'चिंतन सहेजें' : 'Save Reflection'}
            </button>
          </div>

          <button
            type="button"
            onClick={onNavigateToTreatment}
            className="clay-btn-secondary w-full py-2 rounded-[12px] text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>{isHi ? 'डॉक्टर व परामर्श सहायता खोलें' : 'Professional Support Navigation'}</span>
          </button>
        </section>
      </div>
    </div>
  )
}
