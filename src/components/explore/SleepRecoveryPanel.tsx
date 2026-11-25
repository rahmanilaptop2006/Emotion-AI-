import { useEffect, useState, type FormEvent } from 'react'
import {
  BedDouble,
  Pause,
  Play,
  Watch,
} from 'lucide-react'
import type { Language, SleepLogEntry, SleepQuality, UserAccount } from '../../types'

interface SleepRecoveryPanelProps {
  account: UserAccount
  language: Language
  onAddSleepLog: (entry: Omit<SleepLogEntry, 'id' | 'date'>) => void
  onExploreSleep: (detail?: string) => void
}

const WIND_DOWN_STEPS = [
  {
    id: 'step-1',
    range: '0:00 – 1:00',
    rangeHi: '0:00 – 1:00',
    title: 'Minute 1 · Slow 4-4-6 Breathing',
    titleHi: 'मिनट 1 · धीमी 4-4-6 श्वास',
    desc: 'Inhale gently through your nose for 4s, hold for 4s, and exhale slowly for 6s.',
    descHi: 'नाक से 4 सेकंड सांस लें, 4 सेकंड रोकें, और 6 सेकंड में धीरे छोड़ें।',
  },
  {
    id: 'step-2',
    range: '1:00 – 2:00',
    rangeHi: '1:00 – 2:00',
    title: 'Minute 2 · Relax Shoulders & Jaw',
    titleHi: 'मिनट 2 · कंधे व जबड़े शिथिल करें',
    desc: 'Drop your shoulders away from your ears, soften your jaw, and release brow tension.',
    descHi: 'कंधों को ढीला छोड़ें, जबड़े व माथे का तनाव पूरी तरह शांत करें।',
  },
  {
    id: 'step-3',
    range: '2:00 – 3:00',
    rangeHi: '2:00 – 3:00',
    title: 'Minute 3 · Eyes Closed & Stillness',
    titleHi: 'मिनट 3 · आँखें बंद व मानसिक विश्राम',
    desc: 'Rest your eyes softly, let tomorrow’s tasks wait, and focus only on slow breathing.',
    descHi: 'आँखें बंद रखें, कल की चिंता छोड़ें और केवल शांत श्वास पर ध्यान दें।',
  },
]

export function SleepRecoveryPanel({
  account,
  language,
  onAddSleepLog,
  onExploreSleep,
}: SleepRecoveryPanelProps) {
  const isHi = language === 'hi'
  const logs = account.sleepLogs || []
  const connectedWearable = (account.wearables || []).find((w) => w.connected && w.latestReading)

  // Wind-down session state ("Want to sleep better? Let's work on it. [BEGIN]")
  const [windDownActive, setWindDownActive] = useState(false)
  const [windDownSec, setWindDownSec] = useState(180)

  // Sleep Diary form state
  const [bedtime, setBedtime] = useState('23:15')
  const [wakeTime, setWakeTime] = useState('06:30')
  const [hours, setHours] = useState(account.factors.sleepHours || 7.2)
  const [quality, setQuality] = useState<SleepQuality>('Good')
  const [fatigueRating, setFatigueRating] = useState(4)
  const [worryNote, setWorryNote] = useState('')
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    if (!windDownActive) return
    const t = window.setInterval(() => {
      setWindDownSec((s) => {
        if (s <= 1) {
          setWindDownActive(false)
          return 180
        }
        return s - 1
      })
    }, 1000)
    return () => window.clearInterval(t)
  }, [windDownActive])

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
    const r = sec % 60
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
  }

  const avgHours =
    logs.length > 0
      ? logs.reduce((acc, l) => acc + l.hours, 0) / logs.length
      : account.factors.sleepHours

  const consistencyPct = Math.min(
    98,
    Math.max(58, Math.round(92 - Math.abs(avgHours - 7.5) * 14))
  )

  const elapsedSec = 180 - windDownSec
  const activeWindDownStep = elapsedSec < 60 ? 0 : elapsedSec < 120 ? 1 : 2

  const handleSubmitSleepDiary = (e: FormEvent) => {
    e.preventDefault()
    onAddSleepLog({
      bedtime,
      wakeTime,
      hours,
      quality,
      fatigueRating,
      worryNote: worryNote.trim() || undefined,
      envChecklistDone: [],
    })
    setWorryNote('')
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 2200)
  }

  return (
    <div className="space-y-5">
      {/* Hero Banner + BEGIN Sleep Wind-Down Circle */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <section className="lg:col-span-5 rounded-[26px] clay-card-forest p-6 flex flex-col items-center justify-between text-center gap-4">
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#A8C6A4]">
              {isHi ? 'नींद और रिकवरी कार्यक्रम' : '9. Sleep & Recovery'}
            </div>
            <h2 className="font-display text-xl font-bold text-[#E5E8CE]">
              {isHi ? 'बेहतर नींद चाहते हैं? आइए शुरू करें।' : 'Want to sleep better? Let’s work on it.'}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              const nextState = !windDownActive
              setWindDownActive(nextState)
              if (nextState) onExploreSleep('Started Sleep Wind-Down')
            }}
            className="w-36 h-36 rounded-full border-2 border-[#A8C6A4]/50 bg-[#2C472B]/60 hover:bg-[#365735] flex flex-col items-center justify-center gap-1 transition-all shadow-[0_0_40px_rgba(168,198,164,0.22)] cursor-pointer"
          >
            {windDownActive ? (
              <>
                <Pause className="w-5 h-5 text-[#E5E8CE]" />
                <span className="font-mono-num text-2xl font-bold text-[#E5E8CE]">
                  {formatTimer(windDownSec)}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#A8C6A4]">
                  {isHi ? 'विश्राम सक्रिय' : 'RELAXING'}
                </span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 text-[#E5E8CE] ml-0.5" />
                <span className="text-sm font-bold tracking-widest text-[#E5E8CE]">
                  {isHi ? 'शुरू करें' : 'BEGIN'}
                </span>
                <span className="text-[10px] text-[#A8C6A4]">
                  {isHi ? '3-मिनट शांत सत्र' : '3-min Bedtime Calm'}
                </span>
              </>
            )}
          </button>

          {/* Clear 3-Minute Guided Instructions */}
          <div className="w-full rounded-[16px] bg-black/25 p-3.5 text-left space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#A8C6A4]">
              {windDownActive
                ? isHi
                  ? 'अभी क्या करें (लाइव मार्गदर्शन):'
                  : 'What to do right now:'
                : isHi
                  ? '3-मिनट टाइमर के दौरान क्या करें:'
                  : 'What to do during the 3-minute timer:'}
            </div>
            <div className="space-y-1.5">
              {WIND_DOWN_STEPS.map((step, idx) => {
                const isCurrent = windDownActive && activeWindDownStep === idx
                return (
                  <div
                    key={step.id}
                    className={`rounded-[11px] px-2.5 py-2 text-xs transition-colors ${
                      isCurrent
                        ? 'bg-[#4E6B4B]/70 border border-[#A8C6A4]/60 text-[#FAFBF3]'
                        : 'bg-white/5 text-[#E5E8CE]/85'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between gap-2">
                      <span>{isHi ? step.titleHi : step.title}</span>
                      {isCurrent && (
                        <span className="text-[9px] uppercase tracking-wider text-[#A8C6A4] font-mono-num">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] opacity-85 mt-0.5 leading-snug">
                      {isHi ? step.descHi : step.desc}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full text-left">
            <div className="rounded-[15px] bg-black/25 p-3">
              <div className="text-[11px] text-[#A8C6A4]">{isHi ? 'नींद निरंतरता' : 'Consistency'}</div>
              <div className="text-lg font-bold font-mono-num text-[#E5E8CE]">{consistencyPct}%</div>
            </div>
            <div className="rounded-[15px] bg-black/25 p-3">
              <div className="text-[11px] text-[#A8C6A4]">{isHi ? 'औसत अवधि' : 'Avg Duration'}</div>
              <div className="text-lg font-bold font-mono-num text-[#E5E8CE]">{avgHours.toFixed(1)} hrs</div>
            </div>
          </div>
        </section>

        {/* Interactive Sleep Diary & Nighttime Worry Journal */}
        <section className="lg:col-span-7 rounded-[26px] clay-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-bold">
                {isHi ? 'नींद डायरी एवं रात्रि चिंता जर्नल' : 'Sleep Diary & Nighttime Worry Journal'}
              </h3>
              <p className="text-xs opacity-75">
                {isHi
                  ? 'सोने का समय, थकान और मन की चिंता लिखकर आराम से सोएं।'
                  : 'Log last night’s rest, fatigue rating, and park nighttime worries on paper.'}
              </p>
            </div>
            {connectedWearable?.latestReading?.sleepHours && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[11px] clay-tile text-[#344932] dark:text-[#A8C6A4]">
                <Watch className="w-3.5 h-3.5" />
                <span>
                  Wearable: {connectedWearable.latestReading.sleepHours.toFixed(1)} hrs
                </span>
              </span>
            )}
          </div>

          <form onSubmit={handleSubmitSleepDiary} className="space-y-3.5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold mb-1">Bedtime</label>
                <input
                  type="time"
                  value={bedtime}
                  onChange={(e) => setBedtime(e.target.value)}
                  className="w-full h-10 rounded-[12px] clay-input px-2.5 text-xs font-mono-num font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">Wake Time</label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full h-10 rounded-[12px] clay-input px-2.5 text-xs font-mono-num font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">Hours Slept</label>
                <input
                  type="number"
                  min={2}
                  max={12}
                  step={0.5}
                  value={hours}
                  onChange={(e) => setHours(parseFloat(e.target.value) || 7)}
                  className="w-full h-10 rounded-[12px] clay-input px-2.5 text-xs font-mono-num font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">Quality</label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as SleepQuality)}
                  className="w-full h-10 rounded-[12px] clay-input px-2.5 text-xs font-semibold"
                >
                  <option value="Poor">Poor</option>
                  <option value="Okay">Okay</option>
                  <option value="Good">Good</option>
                  <option value="Excellent">Excellent</option>
                </select>
              </div>
            </div>

            <div className="rounded-[16px] clay-well p-3.5 space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span>{isHi ? 'सुबह की थकान (Fatigue Tracking)' : 'Daytime Fatigue Level'}</span>
                <span className="font-mono-num">{fatigueRating}/10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={fatigueRating}
                onChange={(e) => setFatigueRating(parseInt(e.target.value, 10))}
                className="w-full accent-[#4E6B4B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                {isHi ? 'रात्रि चिंता जर्नल (कल के लिए विचार यहाँ लिखें)' : 'Nighttime Worry Journal (Park anxious thoughts for tomorrow)'}
              </label>
              <textarea
                rows={2}
                value={worryNote}
                onChange={(e) => setWorryNote(e.target.value)}
                placeholder={
                  isHi
                    ? 'दिमाग में चल रही बात लिखकर मन शांत करें...'
                    : 'Write any lingering worry here so your mind can rest tonight...'
                }
                className="w-full rounded-[13px] clay-input p-3 text-xs resize-none"
              />
            </div>

            <button
              type="submit"
              className="clay-btn-primary px-5 h-10 rounded-[13px] text-xs font-semibold cursor-pointer inline-flex items-center gap-2"
            >
              <BedDouble className="w-4 h-4" />
              <span>
                {savedFlash
                  ? isHi
                    ? 'नींद लॉग सहेजा गया ✓'
                    : 'Sleep Log Saved ✓'
                  : isHi
                    ? 'नींद और चिंता डायरी सहेजें'
                    : 'Save Sleep & Worry Entry'}
              </span>
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
