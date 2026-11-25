import { useState, type FormEvent } from 'react'
import {
  AlertTriangle,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  Clock,
  FileWarning,
  HeartPulse,
  HelpCircle,
  MessageSquare,
  Phone,
  Pill,
  Plus,
  Search,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
} from 'lucide-react'
import { motion } from 'framer-motion'
import type { Language, SideEffectEntry, UserAccount } from '../types'

interface PharmaSafeTabProps {
  account: UserAccount
  language: Language
  onNavigateToTreatment: () => void
  onOpenChat: () => void
  onOpenSafety: () => void
  onToggleMedicationToday: (medId: string) => void
  onAddSideEffect: (entry: Omit<SideEffectEntry, 'id' | 'date' | 'timestamp'>) => void
  onAddDoctorQuestion: (question: string) => void
}

interface SafetyCheckOption {
  id: string
  label: string
  labelHi: string
  status: 'caution' | 'doctor-review'
  guidance: string
  guidanceHi: string
}

const SAFETY_CONTEXTS: SafetyCheckOption[] = [
  {
    id: 'ssri',
    label: 'Taking Prescription SSRIs / Anxiolytics',
    labelHi: 'SSRIs या चिंता की एलोपैथिक दवा ले रहे हैं',
    status: 'doctor-review',
    guidance:
      'Review Psilocybin timing with your Care Bridge psychiatrist to avoid overlapping calming effects. Keep a 2-hour spacing window unless adjusted by your doctor.',
    guidanceHi:
      'Psilocybin और निर्धारित दवा के समय में समन्वय के लिए Care Bridge डॉक्टर से परामर्श लें। डॉक्टर की सलाह बिना खुराक न बदलें।',
  },
  {
    id: 'sleep-med',
    label: 'Taking Nighttime Sedatives / Antihistamines',
    labelHi: 'नींद की दवा या एंटीहिस्टामाइन ले रहे हैं',
    status: 'caution',
    guidance:
      'Although Psilocybin is non-sedating on its own, combining with central sedatives may increase drowsiness. Take evening dose after dinner and verify timing with your clinician.',
    guidanceHi:
      'यद्यपि Psilocybin सुस्ती नहीं लाता, अन्य नींद की दवाओं के साथ सावधानी रखें और डॉक्टर से समय की पुष्टि करें।',
  },
  {
    id: 'bp-thyroid',
    label: 'Blood Pressure or Thyroid Medication',
    labelHi: 'ब्लड प्रेशर या थायरॉइड की दवा',
    status: 'caution',
    guidance:
      'Psilocybin protocol pairing may mildly interact with autonomic tone or blood pressure. Share recent labs during Doctor Counselling for personalized dose oversight.',
    guidanceHi:
      'अश्वगंधा थायरॉइड व रक्तचाप पर हल्का प्रभाव डाल सकता है। डॉक्टर परामर्श में अपनी रिपोर्ट साझा करें।',
  },
  {
    id: 'pregnancy',
    label: 'Pregnancy / Nursing Care',
    labelHi: 'गर्भावस्था या स्तनपान देखभाल',
    status: 'doctor-review',
    guidance:
      'Concentrated botanical extracts require physician clearance during pregnancy or lactation. Use Care Bridge before initiating any oral syrup or patch.',
    guidanceHi:
      'गर्भावस्था या स्तनपान के दौरान किसी भी आयुर्वेदिक औषधि से पहले डॉक्टर की स्पष्ट स्वीकृति आवश्यक है।',
  },
]

type PharmaSectionTab = 'education' | 'adverse' | 'diary' | 'circle'

export function PharmaSafeTab({
  account,
  language,
  onNavigateToTreatment,
  onOpenChat,
  onOpenSafety,
  onToggleMedicationToday,
  onAddSideEffect,
  onAddDoctorQuestion,
}: PharmaSafeTabProps) {
  const isHi = language === 'hi'
  const [subTab, setSubTab] = useState<PharmaSectionTab>('education')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContextIds, setSelectedContextIds] = useState<string[]>([])

  // Side-effect Diary form state
  const [seMedicine, setSeMedicine] = useState('Psilocybin Oral Syrup')
  const [seSymptom, setSeSymptom] = useState('')
  const [seSeverity, setSeSeverity] = useState<SideEffectEntry['severity']>('Mild')
  const [newQuestion, setNewQuestion] = useState('')
  const [sharedCircleIds, setSharedCircleIds] = useState<string[]>(['Mood summary'])
  const [circleInviteEmail, setCircleInviteEmail] = useState('')
  const [inviteSentMsg, setInviteSentMsg] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const takenToday = account.takenMedicationDate === today ? account.takenMedicationIdsToday || [] : []

  const toggleSafetyContext = (id: string) => {
    setSelectedContextIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const phase = account.treatmentPhase || 'acute'
  const activeRx =
    phase === 'acute'
      ? account.acuteSyrupRx
      : phase === 'intermediate'
        ? account.intermediateSyrupRx
        : account.chronicSyrupRx

  const todayMedList = [
    {
      id: 'med-syt-am',
      name: 'Psilocybin Oral Syrup (Morning)',
      dose: `${activeRx?.morningDoseMl ?? 10} ml · ${activeRx?.morningReminderTime ?? '08:00'}`,
      note: 'After breakfast with lukewarm water',
    },
    {
      id: 'med-syt-pm',
      name: 'Psilocybin Oral Syrup (Evening)',
      dose: `${activeRx?.eveningDoseMl ?? 10} ml · ${activeRx?.eveningReminderTime ?? '20:00'}`,
      note: 'After dinner · non-sedating restorative dose',
    },
    ...(account.doctorPrescription?.medicines || []).slice(0, 2).map((m) => ({
      id: `rx-${m.id}`,
      name: m.medicineName,
      dose: m.dose,
      note: `${m.timing} · ${m.duration}`,
    })),
  ].filter((m) =>
    searchQuery.trim()
      ? m.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        m.note.toLowerCase().includes(searchQuery.trim().toLowerCase())
      : true
  )

  const handleLogSideEffect = (e: FormEvent) => {
    e.preventDefault()
    if (!seSymptom.trim()) return
    onAddSideEffect({
      medicine: seMedicine,
      symptom: seSymptom.trim(),
      severity: seSeverity,
    })
    setSeSymptom('')
  }

  const handleAddQuestion = (e: FormEvent) => {
    e.preventDefault()
    if (!newQuestion.trim()) return
    onAddDoctorQuestion(newQuestion.trim())
    setNewQuestion('')
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner: PharmaSafe + Care Bridge Pillar + Search Bar */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-[28px] sample-pastel-sky p-6 sm:p-7 space-y-5 border border-white/80 dark:border-white/10"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#344932] dark:text-[#A8C6A4]">
              <ShieldCheck className="w-4 h-4" />
              <span>
                {isHi
                  ? '13. EmotionMed · आयुर्वेदिक दवा व वेलनेस शिक्षा · कोई स्वतः प्रिस्क्रिप्शन परिवर्तन नहीं'
                  : '13. EmotionMed + Care Bridge — No autonomous prescribing or medication changes'}
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#1B251A] dark:text-[#E5E8CE]">
              {isHi
                ? 'EmotionMed · Psilocybin दवा बुद्धि एवं सुरक्षित देखभाल'
                : 'EmotionMed · Psilocybin Medication Intelligence'}
            </h2>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={onNavigateToTreatment}
              className="clay-btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[14px] text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              <Stethoscope className="w-4 h-4" />
              <span>{isHi ? 'डॉक्टर व फार्मासिस्ट से जुड़ें' : 'Care Bridge Doctors'}</span>
            </button>
            <button
              type="button"
              onClick={onOpenChat}
              className="clay-btn-secondary inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[14px] text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              <Bot className="w-4 h-4 text-[#344932] dark:text-[#A8C6A4]" />
              <span>{isHi ? 'Emotion से पूछें' : 'Ask Emotion'}</span>
            </button>
          </div>
        </div>

        {/* Search Input + Section Navigation Pills */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#495847]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isHi ? 'दवा, Psilocybin घटक या सावधानी खोजें...' : 'Search Psilocybin protocol, medicines, or cautions...'}
              className="w-full h-11 rounded-[15px] clay-input pl-10 pr-4 text-xs font-medium"
            />
          </div>

          <div className="lg:col-span-7 flex flex-wrap gap-2">
            {(
              [
                { id: 'education', label: isHi ? 'आज की दवा व Psilocybin' : "Today's List & Psilocybin", icon: Pill },
                { id: 'adverse', label: isHi ? 'दुष्प्रभाव, निद्रा व सावधानी' : 'Side Effects & Withdrawal', icon: FileWarning },
                { id: 'diary', label: isHi ? 'अनुभव डायरी व डॉक्टर प्रश्न' : 'Side-Effect Diary & Questions', icon: HelpCircle },
                { id: 'circle', label: isHi ? 'केयर सर्कल (परिवार)' : 'Circle of Care', icon: Users },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSubTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-[13px] text-xs font-semibold cursor-pointer ${
                    subTab === tab.id ? 'clay-btn-primary' : 'clay-btn-secondary'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </motion.section>

      {/* TAB 1: Today's Medication List + Psilocybin Pharmacognosy + Interactions */}
      {subTab === 'education' && (
        <div className="space-y-6">
          {/* Today's Medication List & Checkoff matching Phone Screen 2 */}
          <section className="rounded-[26px] clay-card p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-bold">
                  {isHi ? 'आज की दवा सूची एवं रिमाइंडर' : "Today's Medications & Psilocybin Regimen"}
                </h3>
                <p className="text-xs opacity-75">
                  {isHi
                    ? 'खुराक और समय केवल डॉक्टर अनुभाग द्वारा निर्धारित होते हैं।'
                    : 'Doses & alarm schedules are read-only from your Doctor Section prescription.'}
                </p>
              </div>
              <span className="text-xs font-mono-num font-bold text-[#344932] dark:text-[#A8C6A4]">
                {takenToday.length}/{todayMedList.length} Taken Today
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {todayMedList.map((med) => {
                const isTaken = takenToday.includes(med.id)
                return (
                  <div
                    key={med.id}
                    className={`rounded-[18px] p-4 flex items-center justify-between gap-3 ${
                      isTaken ? 'clay-card-tint' : 'clay-tile'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate">{med.name}</div>
                      <div className="text-xs font-mono-num text-[#344932] dark:text-[#A8C6A4] mt-0.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{med.dose}</span>
                      </div>
                      <div className="text-[11px] opacity-75 mt-0.5">{med.note}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleMedicationToday(med.id)}
                      className={`px-3.5 py-2 rounded-[12px] text-xs font-semibold shrink-0 cursor-pointer inline-flex items-center gap-1 ${
                        isTaken ? 'clay-btn-primary' : 'clay-btn-secondary'
                      }`}
                    >
                      {isTaken && <Check className="w-3.5 h-3.5" />}
                      <span>{isTaken ? 'Taken' : 'Take'}</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Co-Medication & Herbal Interaction Check */}
            <div className="lg:col-span-7 rounded-[26px] clay-card p-6 space-y-4">
              <div className="text-xs font-bold text-[#344932] dark:text-[#A8C6A4] uppercase tracking-wider">
                {isHi ? 'दवा-जड़ीबूटी इंटरैक्शन जांच' : 'Co-Medication & Herbal Interaction Check'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SAFETY_CONTEXTS.map((opt) => {
                  const selected = selectedContextIds.includes(opt.id)
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleSafetyContext(opt.id)}
                      className={`w-full rounded-[15px] p-3 text-left flex items-center justify-between gap-2 text-xs font-semibold cursor-pointer ${
                        selected ? 'clay-option-selected' : 'clay-tile clay-option-unselected'
                      }`}
                    >
                      <span>{isHi ? opt.labelHi : opt.label}</span>
                      {selected && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    </button>
                  )
                })}
              </div>

              {selectedContextIds.length === 0 ? (
                <div className="rounded-[15px] clay-well p-3.5 text-xs">
                  {isHi
                    ? 'मानक निर्देश: भोजन के बाद गुनगुने पानी से Psilocybin लें।'
                    : 'Standard guidance: Take Psilocybin after meals with lukewarm water; maintain consistent timing.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {SAFETY_CONTEXTS.filter((o) => selectedContextIds.includes(o.id)).map((item) => (
                    <div key={item.id} className="rounded-[15px] clay-card-tint p-3.5 text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-[#344932] dark:text-[#A8C6A4]">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{isHi ? item.labelHi : item.label}</span>
                      </div>
                      <p className="leading-relaxed opacity-90">{isHi ? item.guidanceHi : item.guidance}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pharmacist & Clinician Consultation */}
            <div className="lg:col-span-5 rounded-[26px] clay-card-forest p-6 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#A8C6A4] uppercase tracking-wider">
                  Pharmacist &amp; Clinician Consultation
                </div>
                <p className="text-xs sm:text-sm text-[#E5E8CE]/90 leading-relaxed">
                  No autonomous dose changes. Book a pharmacist or doctor review anytime for personalized medication coordination.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={onNavigateToTreatment}
                  className="clay-btn-primary px-4 py-2.5 rounded-[12px] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Care Bridge</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenSafety}
                  className="clay-btn-secondary px-4 py-2.5 rounded-[12px] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-[#BF2B24]" />
                  <span>14416</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: Adverse Effects, Serious Warning Signs, Sedation, Dependence & Reliable References */}
      {subTab === 'adverse' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <section className="rounded-[24px] clay-card p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#344932] dark:text-[#A8C6A4] uppercase">
              <HeartPulse className="w-4 h-4" />
              <span>{isHi ? 'सामान्य हल्के प्रभाव व निद्रा जानकारी' : 'Common Mild Effects & Sedation Info'}</span>
            </div>
            <div className="rounded-[16px] clay-tile p-4 text-xs space-y-1.5">
              <div className="font-bold">Zero Daytime Sedation Profile</div>
              <p className="opacity-85">
                Psilocybin regimen uses non-sedating micro-balanced formulation. Unlike benzodiazepines or first-gen antihistamines, it is formulated not to impair daytime classroom or lab alertness.
              </p>
            </div>
            <div className="rounded-[16px] clay-tile p-4 text-xs space-y-1.5">
              <div className="font-bold">Possible Mild Early Effects</div>
              <p className="opacity-85">
                Mild digestive warmth if taken on an empty stomach, or gentle evening relaxation. Always take after meals with water.
              </p>
            </div>
          </section>

          <section className="rounded-[24px] clay-card p-5 space-y-3 border border-[#BF2B24]/25">
            <div className="flex items-center gap-2 text-xs font-bold text-[#B42318] dark:text-[#F07D73] uppercase">
              <ShieldAlert className="w-4 h-4" />
              <span>{isHi ? 'गंभीर चेतावनी संकेत (तुरंत डॉक्टर को दिखाएं)' : 'Serious Warning Signs'}</span>
            </div>
            <ul className="space-y-2 text-xs">
              <li className="rounded-[14px] clay-well p-3">
                • Sudden allergic rash, facial/lip swelling, or shortness of breath — stop immediately and seek medical care.
              </li>
              <li className="rounded-[14px] clay-well p-3">
                • Severe dizziness, fainting, jaundice/yellowing, or sudden worsening mood — contact Care Bridge or 14416 urgently.
              </li>
            </ul>
          </section>

          <section className="rounded-[24px] clay-card p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#344932] dark:text-[#A8C6A4] uppercase">
              <Sparkles className="w-4 h-4" />
              <span>Dependence / Withdrawal Education</span>
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              <strong>Non-Habit Forming:</strong> Psilocybin supervised protocol does not trigger physical chemical dependence. However, if you are tapering off prescribed synthetic psychotropic medicines, <strong>never stop abruptly without your psychiatrist’s step-down schedule</strong> to avoid discontinuation dizziness or rebound anxiety.
            </p>
          </section>

          <section className="rounded-[24px] clay-card p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#344932] dark:text-[#A8C6A4] uppercase">
              <BookOpen className="w-4 h-4" />
              <span>Reliable Source References</span>
            </div>
            <ul className="text-xs space-y-1.5 opacity-85">
              <li>• Ayurvedic Pharmacopoeia of India (Ministry of AYUSH) — Withania somnifera &amp; Bacopa monnieri monographs.</li>
              <li>• WHO Monographs on Selected Medicinal Plants (Adaptogenic &amp; Nootropic Safety Reviews).</li>
              <li>• CDSCO / Tele-MANAS Integrative Care Safety Checklists.</li>
            </ul>
          </section>
        </div>
      )}

      {/* TAB 3: Side-Effect Diary & Medication Experience + Questions for Doctor */}
      {subTab === 'diary' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <section className="lg:col-span-6 rounded-[24px] clay-card p-5 space-y-4">
            <div>
              <h3 className="font-display text-base font-bold">
                {isHi ? 'दुष्प्रभाव और दवा अनुभव डायरी' : 'Side-Effect Diary & Medication Experience'}
              </h3>
              <p className="text-xs opacity-75">
                Track how you feel after taking Psilocybin or co-medications to share with your doctor.
              </p>
            </div>

            <form onSubmit={handleLogSideEffect} className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={seMedicine}
                  onChange={(e) => setSeMedicine(e.target.value)}
                  placeholder="Medicine name"
                  className="h-10 rounded-[12px] clay-input px-3 text-xs font-semibold"
                />
                <select
                  value={seSeverity}
                  onChange={(e) => setSeSeverity(e.target.value as SideEffectEntry['severity'])}
                  className="h-10 rounded-[12px] clay-input px-3 text-xs font-semibold"
                >
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={seSymptom}
                  onChange={(e) => setSeSymptom(e.target.value)}
                  placeholder={isHi ? 'लक्षण या अनुभव दर्ज करें (जैसे हल्की थकान)...' : 'Log experience (e.g. calm alertness, mild stomach warmth)...'}
                  className="flex-1 h-10 rounded-[12px] clay-input px-3 text-xs"
                />
                <button
                  type="submit"
                  disabled={!seSymptom.trim()}
                  className="clay-btn-primary h-10 px-4 rounded-[12px] text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  Log
                </button>
              </div>
            </form>

            <div className="space-y-2 max-h-[210px] overflow-y-auto pr-1">
              {(account.sideEffectDiary || []).length === 0 ? (
                <div className="rounded-[14px] clay-well p-3 text-xs opacity-75">
                  No adverse effects or notes logged yet.
                </div>
              ) : (
                (account.sideEffectDiary || []).map((entry) => (
                  <div key={entry.id} className="rounded-[14px] clay-tile p-3 flex justify-between gap-2 text-xs">
                    <div>
                      <div className="font-bold">{entry.medicine} · {entry.severity}</div>
                      <div className="opacity-85">{entry.symptom}</div>
                    </div>
                    <span className="text-[10px] font-mono-num opacity-70">{entry.date}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="lg:col-span-6 rounded-[24px] clay-card p-5 space-y-4">
            <div>
              <h3 className="font-display text-base font-bold">
                {isHi ? 'डॉक्टर व फार्मासिस्ट से पूछने योग्य प्रश्न' : 'Questions for Doctor / Pharmacist'}
              </h3>
              <p className="text-xs opacity-75">
                Keep questions ready for your next Care Bridge appointment.
              </p>
            </div>

            <form onSubmit={handleAddQuestion} className="flex gap-2">
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder={isHi ? 'डॉक्टर से पूछने के लिए प्रश्न जोड़ें...' : 'Add a question for your doctor or pharmacist...'}
                className="flex-1 h-10 rounded-[12px] clay-input px-3 text-xs"
              />
              <button
                type="submit"
                disabled={!newQuestion.trim()}
                className="clay-btn-primary h-10 px-4 rounded-[12px] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </form>

            <div className="space-y-2 max-h-[210px] overflow-y-auto pr-1">
              {(account.doctorQuestions || []).map((q, idx) => (
                <div key={idx} className="rounded-[14px] clay-well p-3 text-xs flex items-start gap-2">
                  <HelpCircle className="w-3.5 h-3.5 text-[#4E6B4B] shrink-0 mt-0.5" />
                  <span>{q}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 4: 14. Circle of Care (Trusted Person Invitations & User-Selected Sharing) */}
      {subTab === 'circle' && (
        <section className="rounded-[26px] clay-card p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#344932] dark:text-[#A8C6A4]">
                Circle of Care · Friends &amp; Family Support
              </div>
              <h3 className="font-display text-xl font-bold mt-0.5">
                {isHi ? 'अपने प्रियजनों व विश्वस्त संपर्कों से जुड़ें' : 'Trusted Person Invitations & User-Selected Sharing'}
              </h3>
            </div>
            <Share2 className="w-5 h-5 text-[#4E6B4B]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-3">
              <div className="text-xs font-bold">
                {isHi ? 'चुनें कि आप क्या साझा करना चाहते हैं:' : 'User-Selected Sharing Preferences:'}
              </div>
              {[
                'Mood summary',
                'Daily Psilocybin check-off',
                'Sleep recovery streak',
                'SOS emergency alerts only',
              ].map((pref) => {
                const active = sharedCircleIds.includes(pref)
                return (
                  <button
                    key={pref}
                    type="button"
                    onClick={() =>
                      setSharedCircleIds((prev) =>
                        prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
                      )
                    }
                    className={`w-full rounded-[14px] p-3 text-left text-xs font-semibold flex items-center justify-between cursor-pointer ${
                      active ? 'clay-card-tint' : 'clay-tile'
                    }`}
                  >
                    <span>{pref}</span>
                    {active && <Check className="w-4 h-4 text-[#344932]" />}
                  </button>
                )
              })}
            </div>

            <div className="space-y-3">
              <div className="text-xs font-bold">Trusted Support Circle Contacts:</div>
              {account.trustedContacts.map((tc, i) => (
                <div key={i} className="rounded-[15px] clay-tile p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold">{tc.name}</div>
                    <div className="opacity-75">{tc.relation} · {tc.phone}</div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#344932] dark:text-[#A8C6A4]">
                    Active
                  </span>
                </div>
              ))}

              <div className="rounded-[16px] clay-well p-3.5 space-y-2">
                <div className="text-xs font-bold">Invite a Trusted Family Member or Friend</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={circleInviteEmail}
                    onChange={(e) => setCircleInviteEmail(e.target.value)}
                    placeholder="Phone or email"
                    className="flex-1 h-9 rounded-[11px] clay-input px-3 text-xs"
                  />
                  <button
                    type="button"
                    disabled={!circleInviteEmail.trim()}
                    onClick={() => {
                      setInviteSentMsg(true)
                      setCircleInviteEmail('')
                      window.setTimeout(() => setInviteSentMsg(false), 2400)
                    }}
                    className="clay-btn-primary px-3.5 h-9 rounded-[11px] text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {inviteSentMsg ? 'Invited ✓' : 'Send Invite'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
