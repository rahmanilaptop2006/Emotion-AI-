import { useEffect, useState } from 'react'
import {
  Bot,
  CheckCircle2,
  Cpu,
  KeyRound,
  Layers,
  Lock,
  Minus,
  Play,
  Plus,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Unlock,
  X,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { dispatchDoseCommandToController } from '../services/patchController'
import { PatchController3DWidget } from './PatchController3DWidget'
import type { Language, PatchState, UserAccount } from '../types'

interface TransdermalPatchModalProps {
  account: UserAccount
  language: Language
  initialSection?: 'overview' | 'doctor'
  doctorAuthorized: boolean
  onAuthorizeDoctor: (clinicianName: string) => void
  onLockDoctor: () => void
  onClose: () => void
  onUpdatePatch: (updater: (patch: PatchState) => PatchState) => void
}

const CLINICIAN_ACCESS_PIN = '2026'

export function TransdermalPatchModal({
  account,
  language,
  initialSection = 'overview',
  doctorAuthorized,
  onAuthorizeDoctor,
  onLockDoctor,
  onClose,
  onUpdatePatch,
}: TransdermalPatchModalProps) {
  const isHi = language === 'hi'
  const { patch, factors, wellnessScore } = account
  const [activeSection, setActiveSection] = useState<'overview' | 'doctor'>(initialSection)
  const [simScenario, setSimScenario] = useState<'live' | 'stress' | 'recovery'>('live')
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')

  // Doctor Dose Regulation local draft state
  const [doctorName, setDoctorName] = useState(patch.prescribedBy || 'Dr. Kavita Mehta (MD)')
  const [draftRate, setDraftRate] = useState(patch.infusionRateMcgHr)
  const [draftMin, setDraftMin] = useState(patch.minDoseMcgHr ?? 65)
  const [draftMax, setDraftMax] = useState(patch.maxDoseMcgHr ?? 180)
  const [draftDailyLimit, setDraftDailyLimit] = useState(patch.dailyDoseLimitMcg ?? 3600)
  const [draftLocked, setDraftLocked] = useState(Boolean(patch.doseLockedByDoctor))
  const [draftNote, setDraftNote] = useState(
    patch.prescriptionNote ||
      'Maintain non-sedating steady-state wellness plateau within physician-regulated limits.'
  )
  const [orderSavedFlash, setOrderSavedFlash] = useState(false)

  useEffect(() => {
    setDoctorName(patch.prescribedBy || 'Dr. Kavita Mehta (MD)')
    setDraftRate(patch.infusionRateMcgHr)
    setDraftMin(patch.minDoseMcgHr ?? 65)
    setDraftMax(patch.maxDoseMcgHr ?? 180)
    setDraftDailyLimit(patch.dailyDoseLimitMcg ?? 3600)
    setDraftLocked(Boolean(patch.doseLockedByDoctor))
    setDraftNote(patch.prescriptionNote || '')
  }, [
    account.id,
    patch.prescribedBy,
    patch.infusionRateMcgHr,
    patch.minDoseMcgHr,
    patch.maxDoseMcgHr,
    patch.dailyDoseLimitMcg,
    patch.doseLockedByDoctor,
    patch.prescriptionNote,
  ])

  const effectiveHourlyCap = Math.min(
    patch.maxDoseMcgHr ?? 180,
    Math.floor((patch.dailyDoseLimitMcg ?? 3600) / 24)
  )
  const effectiveFloor = Math.min(patch.minDoseMcgHr ?? 65, effectiveHourlyCap)

  const evaluateAgentCycle = (scenario: 'live' | 'stress' | 'recovery') => {
    setSimScenario(scenario)
    const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    if (patch.doseLockedByDoctor) {
      const lockedNote = isHi
        ? `चिकित्सक लॉक सक्रिय (${patch.prescribedBy}): स्वचालित एआई ने खुराक ${patch.infusionRateMcgHr} mcg/hr पर स्थिर रखी।`
        : `Physician Hard-Lock active (${patch.prescribedBy}): Agentic AI preserved regulated infusion rate at ${patch.infusionRateMcgHr} mcg/hr.`
      onUpdatePatch((prev) => ({
        ...prev,
        agentReasoning: lockedNote,
        lastEvaluatedAt: timeLabel,
      }))
      return
    }

    let rawTarget = 105
    let rationale = ''

    if (scenario === 'stress') {
      rawTarget = 160
      const clamped = Math.max(effectiveFloor, Math.min(effectiveHourlyCap, rawTarget))
      rationale = isHi
        ? `तीव्र परीक्षा तनाव सिग्नल (+28ms विचलन): डॉक्टर सीमा (${effectiveFloor}–${effectiveHourlyCap} mcg/hr) के भीतर ${clamped} mcg/hr निर्धारित।`
        : `Simulated acute academic stress (+28ms keystroke jitter): Agentic AI stepped up flux to ${clamped} mcg/hr within MD bounds (${effectiveFloor}–${effectiveHourlyCap} mcg/hr).`
      rawTarget = clamped
    } else if (scenario === 'recovery') {
      rawTarget = 85
      const clamped = Math.max(effectiveFloor, Math.min(effectiveHourlyCap, rawTarget))
      rationale = isHi
        ? `गहरी नींद और शांत श्वसन: डॉक्टर सीमा (${effectiveFloor}–${effectiveHourlyCap} mcg/hr) के भीतर ${clamped} mcg/hr पर कम किया।`
        : `Deep parasympathetic recovery detected: Agentic AI tapered infusion to ${clamped} mcg/hr within MD bounds (${effectiveFloor}–${effectiveHourlyCap} mcg/hr).`
      rawTarget = clamped
    } else {
      const sleepPenalty = factors.sleepHours < 6.5 ? 25 : factors.sleepHours >= 7.5 ? -10 : 5
      const varianceDelta = factors.typingVarianceMs > 55 ? 20 : factors.typingVarianceMs < 38 ? -10 : 5
      const voiceDelta =
        factors.voiceStress === 'Elevated'
          ? 20
          : factors.voiceStress === 'Moderate'
            ? 12
            : factors.voiceStress === 'Low'
              ? -8
              : 0
      const scoreDelta = wellnessScore < 68 ? 15 : wellnessScore > 80 ? -10 : 0

      rawTarget = Math.max(
        effectiveFloor,
        Math.min(effectiveHourlyCap, 105 + sleepPenalty + varianceDelta + voiceDelta + scoreDelta)
      )
      rationale = isHi
        ? `नींद (${factors.sleepHours}h) व कीस्ट्रोक (${factors.typingVarianceMs}ms) पर डॉक्टर सीमा (${effectiveFloor}–${effectiveHourlyCap}) में ${rawTarget} mcg/hr निर्धारित।`
        : `Evaluated live telemetry (${factors.sleepHours}h sleep, ${factors.typingVarianceMs}ms keystroke variance, ${factors.voiceStress} voice) -> locked at ${rawTarget} mcg/hr within ${patch.prescribedBy} bounds (${effectiveFloor}–${effectiveHourlyCap}).`
    }

    if (patch.controllerConnected) {
      void dispatchDoseCommandToController(rawTarget, 'ai_auto')
    }

    onUpdatePatch((prev) => {
      const pulseMcg = prev.controllerConnected ? Math.max(8, Math.round(rawTarget / 6)) : 0
      return {
        ...prev,
        autoOptimize: true,
        infusionRateMcgHr: rawTarget,
        agentReasoning: prev.controllerConnected
          ? `${rationale} Synced live to AI Patch Controller (${rawTarget} mcg/hr).`
          : rationale,
        lastEvaluatedAt: timeLabel,
        lastDoseReleaseAt: prev.controllerConnected ? timeLabel : prev.lastDoseReleaseAt,
        lastDoseReleaseMcgHr: prev.controllerConnected ? rawTarget : prev.lastDoseReleaseMcgHr,
        reservoirPercent: prev.controllerConnected
          ? Math.max(8, Number((prev.reservoirPercent - 0.2).toFixed(1)))
          : prev.reservoirPercent,
        cumulativeReleasedMcg: prev.controllerConnected
          ? (prev.cumulativeReleasedMcg ?? 0) + pulseMcg
          : prev.cumulativeReleasedMcg,
        logs: [
          {
            id: `agent-${Date.now()}`,
            time: timeLabel,
            rateMcgHr: rawTarget,
            note: `${prev.controllerConnected ? 'Controller + AI' : 'Agentic AI'}: ${rationale.slice(0, 92)}${rationale.length > 92 ? '...' : ''}`,
            actor: prev.controllerConnected ? 'controller' : 'ai',
          },
          ...prev.logs.slice(0, 6),
        ],
      }
    })
  }

  const handleVerifyDoctor = () => {
    if (pinInput.trim() !== CLINICIAN_ACCESS_PIN) {
      setPinError(
        isHi
          ? `अमान्य डॉक्टर पिन। कृपया अधिकृत पिन (${CLINICIAN_ACCESS_PIN}) दर्ज करें।`
          : `Invalid Clinician PIN. Enter authorized MD PIN (${CLINICIAN_ACCESS_PIN}).`
      )
      return
    }
    const cleanDoc = doctorName.trim() || 'Attending Physician (MD)'
    setPinError('')
    setPinInput('')
    onAuthorizeDoctor(cleanDoc)
  }

  const handleApplyDoctorOrder = () => {
    if (!doctorAuthorized) return
    const cleanMin = Math.max(30, Math.min(180, Math.round(draftMin)))
    const cleanMax = Math.max(cleanMin + 10, Math.min(220, Math.round(draftMax)))
    const cleanDaily = Math.max(cleanMin * 24, Math.min(cleanMax * 24 + 480, Math.round(draftDailyLimit)))
    const maxFromDaily = Math.floor(cleanDaily / 24)
    const boundedRate = Math.max(cleanMin, Math.min(cleanMax, maxFromDaily, Math.round(draftRate)))
    const cleanDoctor = doctorName.trim() || 'Attending Physician (MD)'
    const cleanNote =
      draftNote.trim() ||
      `Dose regulated to ${boundedRate} mcg/hr (${cleanMin}–${cleanMax} mcg/hr envelope).`
    const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    setDraftMin(cleanMin)
    setDraftMax(cleanMax)
    setDraftDailyLimit(cleanDaily)
    setDraftRate(boundedRate)

    if (patch.controllerConnected) {
      void dispatchDoseCommandToController(boundedRate, 'doctor_order')
    }

    onUpdatePatch((prev) => ({
      ...prev,
      infusionRateMcgHr: boundedRate,
      minDoseMcgHr: cleanMin,
      maxDoseMcgHr: cleanMax,
      dailyDoseLimitMcg: cleanDaily,
      prescribedBy: cleanDoctor,
      prescriptionNote: cleanNote,
      doseLockedByDoctor: draftLocked,
      autoOptimize: draftLocked ? false : prev.autoOptimize,
      agentReasoning: draftLocked
        ? `Doctor Hard-Lock by ${cleanDoctor}: Fixed infusion at ${boundedRate} mcg/hr. ${cleanNote}`
        : `Doctor Regulation updated by ${cleanDoctor}: Rate ${boundedRate} mcg/hr; AI autonomous range ${cleanMin}–${Math.min(cleanMax, maxFromDaily)} mcg/hr (${cleanDaily} mcg/24h cap).`,
      lastEvaluatedAt: timeLabel,
      lastDoseReleaseAt: prev.controllerConnected ? timeLabel : prev.lastDoseReleaseAt,
      lastDoseReleaseMcgHr: prev.controllerConnected ? boundedRate : prev.lastDoseReleaseMcgHr,
      logs: [
        {
          id: `md-${Date.now()}`,
          time: timeLabel,
          rateMcgHr: boundedRate,
          note: `${cleanDoctor} ${draftLocked ? 'locked' : 'regulated'} dose (${cleanMin}–${cleanMax} mcg/hr): ${cleanNote.slice(0, 68)}${cleanNote.length > 68 ? '...' : ''}`,
          actor: 'doctor',
        },
        ...prev.logs.slice(0, 6),
      ],
    }))

    setOrderSavedFlash(true)
    window.setTimeout(() => setOrderSavedFlash(false), 2400)
  }

  const hours = [0, 3, 6, 9, 12, 15, 18, 21, 24]
  const activeDisplayRate = activeSection === 'doctor' ? draftRate : patch.infusionRateMcgHr
  const scaleFactor = activeDisplayRate / 120
  const transdermalCurve = hours.map((h) =>
    h === 0 ? 10 : Math.min(96, Math.round(68 * (1 - Math.exp(-h / 2.6)) * scaleFactor))
  )
  const oralCurve = [8, 92, 54, 22, 86, 48, 19, 78, 30]

  const width = 460
  const height = 140
  const toPoints = (arr: number[]) =>
    arr
      .map((val, i) => {
        const x = (i / (arr.length - 1)) * (width - 28) + 14
        const y = height - (val / 100) * (height - 24) - 12
        return `${x},${y}`
      })
      .join(' ')

  const projected24hMcg = activeDisplayRate * 24

  return (
    <div
      className="fixed inset-0 z-50 bg-[#141C13]/55 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[28px] clay-modal text-[#1B251A] dark:text-[#E5E8CE]"
      >
        {/* Header */}
        <div className="px-6 py-4 clay-card-forest text-[#E5E8CE] flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[13px] clay-orb-sage text-[#14261E] flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold">
                {isHi
                  ? 'एजेंटिक एआई ट्रांसडर्मल पैच कंट्रोल'
                  : 'Agentic AI · Transdermal Patch Controller'}
              </h3>
              <p className="text-xs text-[#C4D3BF]">
                {patch.prescribedBy} · {effectiveFloor}–{effectiveHourlyCap} mcg/hr regulated window
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-[12px] hover:bg-white/10 text-[#E5E8CE] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Segmented Clay Mode Switcher: AI Telemetry vs Doctor Dose Editor */}
          <div className="flex items-center gap-2 p-1.5 rounded-[18px] clay-well">
            <button
              type="button"
              onClick={() => setActiveSection('overview')}
              className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-[13px] text-xs font-semibold cursor-pointer transition-all ${
                activeSection === 'overview'
                  ? 'clay-btn-primary'
                  : 'text-[#2D3B2C] dark:text-[#C5D1BF]'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>{isHi ? 'एआई पैच और PK कर्व' : 'Automated AI & PK Curve'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('doctor')}
              className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-[13px] text-xs font-semibold cursor-pointer transition-all ${
                activeSection === 'doctor'
                  ? 'clay-btn-forest'
                  : 'text-[#2D3B2C] dark:text-[#C5D1BF]'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>{isHi ? 'डॉक्टर खुराक नियंत्रण' : 'Doctor Dose Regulation'}</span>
            </button>
          </div>

          {/* Top KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="rounded-[18px] clay-tile p-3.5">
              <span className="text-[11px] font-medium text-[#495847] dark:text-[#A8B7A4] block">
                Regulation Mode
              </span>
              <span className="text-sm font-bold text-[#1B251A] dark:text-[#E5E8CE] mt-0.5 block">
                {patch.doseLockedByDoctor
                  ? 'MD Hard-Locked'
                  : patch.autoOptimize
                    ? 'AI Within MD Range'
                    : 'Manual Override'}
              </span>
            </div>
            <div className="rounded-[18px] clay-tile p-3.5">
              <span className="text-[11px] font-medium text-[#495847] dark:text-[#A8B7A4] block">
                Infusion Rate
              </span>
              <span className="text-xl font-bold font-mono-num">{patch.infusionRateMcgHr} mcg/hr</span>
            </div>
            <div className="rounded-[18px] clay-tile p-3.5">
              <span className="text-[11px] font-medium text-[#495847] dark:text-[#A8B7A4] block">
                MD Bounds
              </span>
              <span className="text-lg font-bold font-mono-num">
                {effectiveFloor}–{effectiveHourlyCap}
              </span>
            </div>
            <div className="rounded-[18px] clay-tile p-3.5">
              <span className="text-[11px] font-medium text-[#495847] dark:text-[#A8B7A4] block">
                24h Projected
              </span>
              <span className="text-lg font-bold font-mono-num">
                {projected24hMcg}/{patch.dailyDoseLimitMcg}
              </span>
            </div>
          </div>

          {/* ==============================================================
              DOCTOR DOSE REGULATION & EDITING PANEL (DOCTORS ONLY)
             ============================================================== */}
          {activeSection === 'doctor' && (
            <div className="space-y-5">
              {!doctorAuthorized ? (
                <div className="rounded-[22px] clay-card-tint p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-[12px] clay-card-forest text-[#E5E8CE] flex items-center justify-center">
                        <Lock className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="font-display text-sm font-bold">
                          {isHi
                            ? 'चिकित्सक सत्यापन · केवल डॉक्टर खुराक बदल सकते हैं'
                            : 'Doctors Only · Clinician Dose Verification'}
                        </h4>
                        <p className="text-[11px] text-[#495847] dark:text-[#A8B7A4]">
                          {isHi
                            ? 'पैच खुराक संपादन के लिए अधिकृत डॉक्टर पिन दर्ज करें।'
                            : 'Enter authorized Clinician PIN to edit active mcg/hr infusion dose or limits.'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono-num text-[#495847] dark:text-[#A8B7A4]">
                      Authorized MD PIN: {CLINICIAN_ACCESS_PIN}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      placeholder="Dr. Kavita Mehta (MD)"
                      aria-label="Doctor Name"
                      className="h-11 rounded-[13px] clay-input border-0 px-3.5 text-xs font-semibold"
                    />
                    <input
                      type="password"
                      inputMode="numeric"
                      value={pinInput}
                      onChange={(e) => {
                        setPinInput(e.target.value)
                        if (pinError) setPinError('')
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleVerifyDoctor()
                      }}
                      placeholder={isHi ? 'पिन दर्ज करें (2026)' : 'Clinician PIN (2026)'}
                      aria-label="Clinician PIN"
                      className="h-11 rounded-[13px] clay-input border-0 px-3.5 text-xs font-mono-num font-semibold"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyDoctor}
                      className="clay-btn-primary h-11 px-4 rounded-[13px] text-xs font-semibold cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{isHi ? 'डॉक्टर संपादन खोलें' : 'Unlock Doctor Editor'}</span>
                    </button>
                  </div>

                  {pinError && (
                    <div className="text-xs font-semibold text-[#B42318] dark:text-[#F07D73]">
                      {pinError}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-[22px] clay-card-tint p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-[12px] clay-card-forest text-[#E5E8CE] flex items-center justify-center">
                        <Stethoscope className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="font-display text-sm font-bold">
                          {isHi ? 'चिकित्सक खुराक विनियमन पैनल' : 'Physician Dose Regulation & Titration'}
                        </h4>
                        <p className="text-[11px] text-[#495847] dark:text-[#A8B7A4]">
                          {isHi
                            ? 'मरीज़ की सक्रिय खुराक और स्वचालित एआई की सुरक्षित सीमा तय करें'
                            : 'Set active micro-infusion rate, automated AI boundaries, and 24h cumulative cap'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onLockDoctor}
                      className="clay-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
                    >
                      <Lock className="w-3 h-3" />
                      <span>{isHi ? 'लॉक करें' : 'Lock Doctor Edit'}</span>
                    </button>
                  </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setDraftLocked((v) => !v)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                      draftLocked ? 'clay-btn-danger' : 'clay-btn-secondary'
                    }`}
                  >
                    {draftLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    <span>{draftLocked ? 'MD Dose Hard-Locked' : 'AI Bounded Mode'}</span>
                  </button>
                </div>

                {/* Clinician Attribution */}
                <div>
                  <label
                    htmlFor="doctor-name-input"
                    className="block text-xs font-semibold text-[#495847] dark:text-[#A8B7A4] mb-1.5"
                  >
                    {isHi ? 'निर्देशित चिकित्सक (Doctor / Clinician)' : 'Prescribing Doctor / Clinician'}
                  </label>
                  <input
                    id="doctor-name-input"
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Dr. Kavita Mehta (MD)"
                    className="w-full h-[42px] rounded-[14px] clay-input border-0 px-3.5 text-sm font-medium"
                  />
                </div>

                {/* Exact Infusion Dose Stepper + Input */}
                <div className="rounded-[18px] clay-well p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold">
                      {isHi ? 'सक्रिय इन्फ्यूजन खुराक (mcg/hr)' : 'Prescribed Active Infusion Rate (mcg/hr)'}
                    </span>
                    <span className="text-[11px] font-mono-num text-[#495847] dark:text-[#A8B7A4]">
                      24h Delivery: {draftRate * 24} mcg
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label="Decrease dose by 5 mcg/hr"
                      onClick={() => setDraftRate((r) => Math.max(draftMin, r - 5))}
                      className="clay-btn-secondary w-11 h-11 rounded-[14px] flex items-center justify-center cursor-pointer shrink-0"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="number"
                        aria-label="Active infusion rate mcg per hour"
                        min={30}
                        max={220}
                        step={5}
                        value={draftRate}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10)
                          if (!Number.isNaN(val)) setDraftRate(val)
                        }}
                        className="w-full h-11 rounded-[14px] clay-input border-0 px-4 text-center text-lg font-bold font-mono-num"
                      />
                      <span className="text-xs font-semibold text-[#495847] dark:text-[#A8B7A4] shrink-0">
                        mcg/hr
                      </span>
                    </div>

                    <button
                      type="button"
                      aria-label="Increase dose by 5 mcg/hr"
                      onClick={() => setDraftRate((r) => Math.min(draftMax, r + 5))}
                      className="clay-btn-secondary w-11 h-11 rounded-[14px] flex items-center justify-center cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="range"
                    min={draftMin}
                    max={draftMax}
                    step={5}
                    value={Math.max(draftMin, Math.min(draftMax, draftRate))}
                    onChange={(e) => setDraftRate(parseInt(e.target.value, 10))}
                    className="w-full accent-[#789575]"
                  />
                </div>

                {/* Automated AI Bounds & 24h Cumulative Cap */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-[16px] clay-tile p-3.5 space-y-1.5">
                    <label
                      htmlFor="min-dose-input"
                      className="block text-[11px] font-semibold text-[#495847] dark:text-[#A8B7A4]"
                    >
                      AI Min Floor (mcg/hr)
                    </label>
                    <input
                      id="min-dose-input"
                      type="number"
                      min={30}
                      max={160}
                      step={5}
                      value={draftMin}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10)
                        if (!Number.isNaN(val)) setDraftMin(val)
                      }}
                      className="w-full h-10 rounded-[12px] clay-input border-0 px-3 text-sm font-bold font-mono-num"
                    />
                  </div>

                  <div className="rounded-[16px] clay-tile p-3.5 space-y-1.5">
                    <label
                      htmlFor="max-dose-input"
                      className="block text-[11px] font-semibold text-[#495847] dark:text-[#A8B7A4]"
                    >
                      AI Max Ceiling (mcg/hr)
                    </label>
                    <input
                      id="max-dose-input"
                      type="number"
                      min={80}
                      max={220}
                      step={5}
                      value={draftMax}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10)
                        if (!Number.isNaN(val)) setDraftMax(val)
                      }}
                      className="w-full h-10 rounded-[12px] clay-input border-0 px-3 text-sm font-bold font-mono-num"
                    />
                  </div>

                  <div className="rounded-[16px] clay-tile p-3.5 space-y-1.5">
                    <label
                      htmlFor="daily-cap-input"
                      className="block text-[11px] font-semibold text-[#495847] dark:text-[#A8B7A4]"
                    >
                      24h Dose Cap (mcg)
                    </label>
                    <input
                      id="daily-cap-input"
                      type="number"
                      min={1200}
                      max={5280}
                      step={120}
                      value={draftDailyLimit}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10)
                        if (!Number.isNaN(val)) setDraftDailyLimit(val)
                      }}
                      className="w-full h-10 rounded-[12px] clay-input border-0 px-3 text-sm font-bold font-mono-num"
                    />
                  </div>
                </div>

                {/* Clinical Regulation Note */}
                <div>
                  <label
                    htmlFor="doctor-note-input"
                    className="block text-xs font-semibold text-[#495847] dark:text-[#A8B7A4] mb-1.5"
                  >
                    {isHi ? 'क्लिनिकल टिप्पणियाँ एवं कारण' : 'Clinical Titration Order Note'}
                  </label>
                  <textarea
                    id="doctor-note-input"
                    rows={2}
                    value={draftNote}
                    onChange={(e) => setDraftNote(e.target.value)}
                    placeholder="Reason for dose adjustment or regulation boundaries..."
                    className="w-full rounded-[16px] clay-input border-0 px-3.5 py-2.5 text-xs"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <span className="text-[11px] text-[#495847] dark:text-[#A8B7A4]">
                    {draftLocked
                      ? 'Automated AI cycles will hold this exact rate until unlocked.'
                      : `Automated AI may titrate within ${draftMin}–${Math.min(draftMax, Math.floor(draftDailyLimit / 24))} mcg/hr.`}
                  </span>
                  <button
                    type="button"
                    onClick={handleApplyDoctorOrder}
                    className="clay-btn-forest inline-flex items-center gap-2 px-5 h-[44px] rounded-[15px] text-xs font-semibold cursor-pointer"
                  >
                    {orderSavedFlash ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#98C494]" />
                        <span>{isHi ? 'आदेश सहेजा गया' : 'Doctor Order Applied'}</span>
                      </>
                    ) : (
                      <>
                        <Stethoscope className="w-4 h-4" />
                        <span>{isHi ? 'डॉक्टर खुराक आदेश लागू करें' : 'Apply Doctor Dose Order'}</span>
                      </>
                    )}
                  </button>
                </div>
                </div>
              )}
            </div>
          )}

          {/* ==============================================================
              AUTOMATED AI & PK OVERVIEW PANEL
             ============================================================== */}
          {activeSection === 'overview' && (
            <>
              {/* Connect AI Transdermal Patch Controller (3D Hardware + BLE/Closed-Loop Dose Release) */}
              <PatchController3DWidget
                compact
                patch={patch}
                language={language}
                effectiveFloor={effectiveFloor}
                effectiveHourlyCap={effectiveHourlyCap}
                doctorAuthorized={doctorAuthorized}
                onUpdatePatch={onUpdatePatch}
                onRunAiRelease={() => evaluateAgentCycle('live')}
              />

              {/* Agentic AI Autonomous Decision Engine */}
              <div className="rounded-[22px] clay-card-forest text-[#E5E8CE] p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-[#98C494]" />
                    <span className="text-xs font-semibold tracking-wide uppercase text-[#A8C6A4]">
                      Agentic AI Closed-Loop Decision Engine
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={!doctorAuthorized || Boolean(patch.doseLockedByDoctor)}
                    onClick={() =>
                      onUpdatePatch((prev) => ({
                        ...prev,
                        autoOptimize: !prev.autoOptimize,
                      }))
                    }
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-70 ${
                      doctorAuthorized && !patch.doseLockedByDoctor ? 'cursor-pointer' : 'cursor-not-allowed'
                    } ${
                      patch.doseLockedByDoctor
                        ? 'clay-btn-danger'
                        : patch.autoOptimize
                          ? 'clay-btn-primary'
                          : 'bg-white/10 text-[#E5E8CE]'
                    }`}
                  >
                    {patch.doseLockedByDoctor
                      ? 'Locked by Doctor'
                      : patch.autoOptimize
                        ? 'Autonomous Loop: ON'
                        : 'Autonomous Loop: PAUSED'}
                  </button>
                </div>

                <div className="rounded-[16px] bg-black/25 shadow-[inset_3px_3px_8px_rgba(0,0,0,0.45)] p-3.5 text-xs leading-relaxed text-[#E5E8CE]">
                  <div className="font-semibold text-[#A8C6A4] mb-1">
                    Latest Agentic Reasoning ({patch.lastEvaluatedAt || 'Active'}):
                  </div>
                  {patch.agentReasoning ||
                    'Evaluating smartphone keystroke flight variance, circadian sleep recovery, and vocal stress prosody within doctor-prescribed bounds.'}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => evaluateAgentCycle('live')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[13px] text-xs font-semibold cursor-pointer transition-all ${
                      simScenario === 'live'
                        ? 'clay-btn-primary'
                        : 'bg-white/12 hover:bg-white/20 text-[#E5E8CE]'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isHi ? 'लाइव बायोमार्कर विश्लेषण चलाएं' : 'Run Agentic AI Cycle (Live Signals)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => evaluateAgentCycle('stress')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[13px] text-xs font-semibold cursor-pointer transition-all ${
                      simScenario === 'stress'
                        ? 'clay-btn-terracotta'
                        : 'bg-white/10 hover:bg-white/18 text-[#E5E8CE]'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isHi ? 'तनाव स्पाइक टेस्ट' : 'Simulate Acute Stress'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => evaluateAgentCycle('recovery')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[13px] text-xs font-semibold cursor-pointer transition-all ${
                      simScenario === 'recovery'
                        ? 'clay-btn-secondary'
                        : 'bg-white/10 hover:bg-white/18 text-[#E5E8CE]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{isHi ? 'गहरा विश्राम टेस्ट' : 'Simulate Deep Calm'}</span>
                  </button>
                </div>
              </div>

              {/* Doctor-Only Dose Restriction Notice */}
              <div className="rounded-[18px] clay-well p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-[#495847] dark:text-[#A8B7A4]">
                  <Lock className="w-4 h-4 text-[#344932] dark:text-[#A9C2A6] shrink-0" />
                  <span>
                    {isHi
                      ? 'खुराक (mcg/hr) केवल डॉक्टर द्वारा ही संपादित की जा सकती है।'
                      : 'Active infusion dose & AI bounds are editable by Doctors only.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSection('doctor')}
                  className="clay-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] text-xs font-semibold cursor-pointer"
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>{isHi ? 'डॉक्टर नियंत्रण खोलें' : 'Doctor Dose Control'}</span>
                </button>
              </div>
            </>
          )}

          {/* PK SVG Curve (Visible in both views so Doctor sees live curve preview while editing!) */}
          <div className="rounded-[20px] clay-well p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold mb-2">
              <span>
                24-Hour Plasma Stability Profile ({activeDisplayRate} mcg/hr)
              </span>
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 text-[#344932] dark:text-[#A9C2A6]">
                  <span className="w-3 h-1 rounded-full bg-[#789575] inline-block" /> Transdermal Plateau
                </span>
                <span className="inline-flex items-center gap-1.5 text-[#B42318] dark:text-[#F07D73]">
                  <span className="w-3 h-1 rounded-full bg-[#B42318] inline-block" /> Oral Spike-Trough
                </span>
              </div>
            </div>

            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 overflow-visible">
              <polyline
                fill="none"
                stroke="#B42318"
                strokeOpacity="0.65"
                strokeWidth="2.2"
                strokeDasharray="4 4"
                points={toPoints(oralCurve)}
              />
              <polyline
                fill="none"
                stroke="#789575"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={toPoints(transdermalCurve)}
              />
            </svg>
            <div className="flex justify-between text-[11px] text-[#495847] dark:text-[#A8B7A4] font-mono-num">
              <span>0h</span>
              <span>6h</span>
              <span>12h</span>
              <span>18h</span>
              <span>24h</span>
            </div>
          </div>

          {/* Safety Ceiling & Agentic Decision Audit Log */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs px-1">
              <span className="text-xs font-semibold text-[#495847] dark:text-[#A8B7A4]">
                Doctor &amp; Agentic AI Infusion Audit Log
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-[#344932] dark:text-[#A9C2A6]">
                <ShieldCheck className="w-3.5 h-3.5" /> Non-Sedating MD Ceiling (≤{effectiveHourlyCap})
              </span>
            </div>
            {patch.logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between gap-3 text-xs px-4 py-3 rounded-[14px] clay-well"
              >
                <span className="font-medium leading-snug">
                  <span className="font-bold text-[#344932] dark:text-[#A9C2A6] mr-1.5">
                    [{log.actor === 'doctor' ? 'MD' : log.actor === 'controller' ? 'Controller' : log.actor === 'user' ? 'Manual' : 'AI'}]
                  </span>
                  {log.note}
                </span>
                <span className="text-[#495847] dark:text-[#A8B7A4] font-mono-num shrink-0 font-semibold">
                  {log.time} · {log.rateMcgHr} mcg/hr
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
