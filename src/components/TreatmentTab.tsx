import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent } from 'react'
import {
  Activity,
  AlarmClock,
  Award,
  Bell,
  BellOff,
  BellRing,
  Bot,
  CalendarCheck,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  Cpu,
  Download,
  Droplets,
  FileText,
  KeyRound,
  Layers,
  Lock,
  Minus,
  PenTool,
  Play,
  Plus,
  ShieldCheck,
  Sparkles,
  Stamp,
  Stethoscope,
  Trash2,
  Unlock,
  Upload,
  Video,
  Volume2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  formatCountdown,
  formatTime12h,
  getBrowserNotificationPermission,
  getNextUpcomingDose,
  getScheduledDoseSlots,
  normalizeHHMM,
  playSyrupAlarmChime,
  requestBrowserNotificationPermission,
  type ScheduledDoseSlot,
} from '../services/syrupAlarm'
import { dispatchDoseCommandToController } from '../services/patchController'
import { BrandLogo } from './BrandLogo'
import { PatchController3DWidget } from './PatchController3DWidget'
import type {
  CounsellingBooking,
  DoctorPrescriptionRecord,
  DoctorProfile,
  Language,
  PatchState,
  PrescribedMedicationItem,
  SyrupPrescription,
  TonicLog,
  TreatmentPhase,
  UserAccount,
} from '../types'

interface TreatmentTabProps {
  account: UserAccount
  language: Language
  doctorAuthorized: boolean
  onAuthorizeDoctor: (clinicianName: string) => void
  onLockDoctor: () => void
  onSelectPhase: (phase: TreatmentPhase) => void
  onToggleTonicSlot: (slot: TonicLog['slot']) => void
  onUpdateSyrupRx: (phase: TreatmentPhase, rx: SyrupPrescription) => void
  onToggleSyrupReminder: (phase: TreatmentPhase, enabled: boolean) => void
  onTriggerTestAlarm: (slot: ScheduledDoseSlot, phase: TreatmentPhase, prescribedBy: string) => void
  onUpdatePatch: (updater: (patch: PatchState) => PatchState) => void
  onSaveDoctorPrescription: (record: DoctorPrescriptionRecord) => void
  onAddCounsellingBooking: (booking: Omit<CounsellingBooking, 'id' | 'createdAt' | 'status'>) => void
}

const CLINICIAN_ACCESS_PIN = '2026'

export const COLLABORATED_DOCTORS: DoctorProfile[] = [
  {
    id: 'doc-mehta',
    name: 'Dr. Kavita Mehta (MD)',
    credentials: 'MD Psychiatry · Integrative Stress Medicine',
    specialty: 'Acute & Autonomic Recovery',
    specialtyHi: 'तीव्र तनाव एवं ऑटोनॉमिक रिकवरी',
    hospital: 'AIIMS Wellness & Stress Clinic',
    experienceYears: 14,
    languages: ['English', 'Hindi'],
    regNumber: 'MCI-REG-48291',
    nextAvailable: 'Today, 4:30 PM',
    avatarInitials: 'KM',
  },
  {
    id: 'doc-nair',
    name: 'Dr. Arvind Nair (MD)',
    credentials: 'MD Pharmacology · Sleep & Neuro-Care',
    specialty: 'Intermediate & Patch Titration',
    specialtyHi: 'मध्यम चरण एवं पैच टाइट्रेशन',
    hospital: 'Apollo Mind & Body Centre',
    experienceYears: 12,
    languages: ['English', 'Hindi', 'Malayalam'],
    regNumber: 'MCI-REG-51904',
    nextAvailable: 'Today, 6:00 PM',
    avatarInitials: 'AN',
  },
  {
    id: 'doc-sen',
    name: 'Dr. Riya Sen (Clinical Psychologist)',
    credentials: 'M.Phil, PhD Clinical Psychology',
    specialty: 'CBT & Youth Counselling',
    specialtyHi: 'CBT एवं युवा परामर्श',
    hospital: 'Fortis Behavioural Institute',
    experienceYears: 9,
    languages: ['English', 'Hindi', 'Bengali'],
    regNumber: 'RCI-A-77412',
    nextAvailable: 'Tomorrow, 10:30 AM',
    avatarInitials: 'RS',
  },
  {
    id: 'doc-kulkarni',
    name: 'Dr. Sameer Kulkarni (MD)',
    credentials: 'MD Integrative Medicine · Pharmacognosy',
    specialty: 'Chronic Adaptogen Maintenance',
    specialtyHi: 'दीर्घकालिक एडाप्टोजेन देखभाल',
    hospital: 'Sahyadri Integrative Clinic',
    experienceYears: 16,
    languages: ['English', 'Hindi', 'Marathi'],
    regNumber: 'MCI-REG-39188',
    nextAvailable: 'Tomorrow, 2:00 PM',
    avatarInitials: 'SK',
  },
]

const FALLBACK_ACUTE_RX: SyrupPrescription = {
  morningDoseMl: 10,
  eveningDoseMl: 10,
  frequency: 'Twice Daily (AM/PM)',
  durationDays: 7,
  maxDailyMl: 30,
  prescribedBy: 'Dr. Kavita Mehta (MD)',
  clinicalNote: 'Acute short-course oral syrup stabilization.',
  updatedAt: '08:00 AM',
  morningReminderTime: '08:00',
  middayReminderTime: '14:00',
  eveningReminderTime: '20:00',
  reminderEnabled: true,
}

const FALLBACK_INTERMEDIATE_RX: SyrupPrescription = {
  morningDoseMl: 10,
  eveningDoseMl: 10,
  frequency: 'Twice Daily (AM/PM)',
  durationDays: 21,
  maxDailyMl: 30,
  prescribedBy: 'Dr. Kavita Mehta (MD)',
  clinicalNote: 'Intermediate oral syrup paired with Automated AI Patch.',
  updatedAt: '08:00 AM',
  morningReminderTime: '08:00',
  middayReminderTime: '14:00',
  eveningReminderTime: '20:00',
  reminderEnabled: true,
}

const FALLBACK_CHRONIC_RX: SyrupPrescription = {
  morningDoseMl: 7.5,
  eveningDoseMl: 7.5,
  frequency: 'Twice Daily (AM/PM)',
  durationDays: 60,
  maxDailyMl: 25,
  prescribedBy: 'Dr. Arvind Nair (MD)',
  clinicalNote: 'Long-term maintenance syrup paired with Automated AI Patch.',
  updatedAt: '08:00 AM',
  morningReminderTime: '08:00',
  middayReminderTime: '14:00',
  eveningReminderTime: '20:00',
  reminderEnabled: true,
}

const FREQUENCIES: SyrupPrescription['frequency'][] = [
  'Once Daily',
  'Twice Daily (AM/PM)',
  'Every 8 Hours (TID)',
  'SOS Acute',
]

const COUNSELLING_SLOTS = [
  'Today, 4:30 PM',
  'Today, 6:00 PM',
  'Tomorrow, 10:30 AM',
  'Tomorrow, 5:00 PM',
]

export function TreatmentTab({
  account,
  language,
  doctorAuthorized,
  onAuthorizeDoctor,
  onLockDoctor,
  onSelectPhase,
  onToggleTonicSlot,
  onUpdateSyrupRx,
  onToggleSyrupReminder,
  onTriggerTestAlarm,
  onUpdatePatch,
  onSaveDoctorPrescription,
  onAddCounsellingBooking,
}: TreatmentTabProps) {
  const isHi = language === 'hi'
  const phase: TreatmentPhase = account.treatmentPhase || 'acute'
  const { patch, factors, wellnessScore } = account

  // Top-level 2-Part Section Switcher: Doctor Section vs Prescribed Medication Section
  const [activeSection, setActiveSection] = useState<'medication' | 'doctor'>('medication')
  const [doctorSubTab, setDoctorSubTab] = useState<'doctors' | 'rx' | 'counselling'>('doctors')

  const acuteRx: SyrupPrescription = account.acuteSyrupRx || FALLBACK_ACUTE_RX
  const intermediateRx: SyrupPrescription = account.intermediateSyrupRx || FALLBACK_INTERMEDIATE_RX
  const chronicRx: SyrupPrescription = account.chronicSyrupRx || FALLBACK_CHRONIC_RX
  const activeSyrupRx =
    phase === 'acute' ? acuteRx : phase === 'intermediate' ? intermediateRx : chronicRx

  const today = new Date().toISOString().slice(0, 10)
  const morningTaken = account.tonicLogs.some((t) => t.date === today && t.slot === 'Morning 10ml' && t.taken)
  const eveningTaken = account.tonicLogs.some((t) => t.date === today && t.slot === 'Evening 10ml' && t.taken)

  // Doctor Access Password Gate state
  const [showDoctorLogin, setShowDoctorLogin] = useState(false)
  const [clinicianInput, setClinicianInput] = useState(patch.prescribedBy || 'Dr. Kavita Mehta (MD)')
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')

  // Doctor Prescription Pad State
  const savedRx = account.doctorPrescription
  const [selectedDoctorId, setSelectedDoctorId] = useState(savedRx?.doctorId || COLLABORATED_DOCTORS[0].id)
  const [rxPhase, setRxPhase] = useState<TreatmentPhase>(savedRx?.phase || phase)
  const [rxDiagnosis, setRxDiagnosis] = useState(
    savedRx?.diagnosisNote || 'Autonomic stress & sleep onset support — non-sedating integrative regimen.'
  )
  const [rxMedicines, setRxMedicines] = useState<PrescribedMedicationItem[]>(
    savedRx?.medicines || [
      {
        id: 'med-1',
        medicineName: 'Oral Calming Syrup (Psilocybin)',
        dose: '10 ml',
        timing: 'Twice Daily (After meals)',
        duration: '14 days',
      },
    ]
  )
  const [condNoteAcute, setCondNoteAcute] = useState(
    savedRx?.conditionNotes?.acute ||
      'Short-term stress surge · Oral Calming Syrup (Psilocybin) only.'
  )
  const [condNoteIntermediate, setCondNoteIntermediate] = useState(
    savedRx?.conditionNotes?.intermediate ||
      'Persistent stress plateau · Oral Syrup + Automated AI Transdermal Patch.'
  )
  const [condNoteChronic, setCondNoteChronic] = useState(
    savedRx?.conditionNotes?.chronic ||
      'Long-term maintenance · Sustained Oral Syrup + Automated AI Patch window.'
  )
  const [aiPatchPrescribed, setAiPatchPrescribed] = useState<boolean>(
    savedRx?.aiPatchMention?.prescribed ??
      (savedRx?.phase === 'intermediate' || savedRx?.phase === 'chronic')
  )
  const [rxPatchRate, setRxPatchRate] = useState<number>(
    savedRx?.aiPatchMention?.targetRateMcgHr ?? patch.infusionRateMcgHr ?? 110
  )
  const [rxPatchMin, setRxPatchMin] = useState<number>(
    savedRx?.aiPatchMention?.minRateMcgHr ?? patch.minDoseMcgHr ?? 65
  )
  const [rxPatchMax, setRxPatchMax] = useState<number>(
    savedRx?.aiPatchMention?.maxRateMcgHr ?? patch.maxDoseMcgHr ?? 180
  )
  const [rxPatchDailyLimit, setRxPatchDailyLimit] = useState<number>(
    savedRx?.aiPatchMention?.dailyLimitMcg ?? patch.dailyDoseLimitMcg ?? 3600
  )
  const [rxPatchSchedule, setRxPatchSchedule] = useState<string>(
    savedRx?.aiPatchMention?.wearSchedule || 'Closed-loop daytime/overnight wear (8–12 hrs/day)'
  )
  const [rxPatchNote, setRxPatchNote] = useState<string>(
    savedRx?.aiPatchMention?.clinicalInstruction ||
      'Use only for Intermediate or Chronic condition under MD supervision.'
  )
  const [signatureText, setSignatureText] = useState(savedRx?.signatureText || COLLABORATED_DOCTORS[0].name)
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | undefined>(savedRx?.signatureDataUrl)
  const [stampLabel, setStampLabel] = useState(
    savedRx?.stampLabel || `EMOTION AI CLINICAL SEAL · ${COLLABORATED_DOCTORS[0].regNumber}`
  )
  const [stampDataUrl, setStampDataUrl] = useState<string | undefined>(savedRx?.stampDataUrl)
  const [paperRxUrl, setPaperRxUrl] = useState<string | undefined>(savedRx?.paperPrescriptionUrl)
  const [paperRxName, setPaperRxName] = useState<string | undefined>(savedRx?.paperPrescriptionName)
  const [rxSavedFlash, setRxSavedFlash] = useState(false)

  // Signature Canvas Ref
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawingRef = useRef(false)

  // Counselling Booking State
  const [counsellingDocId, setCounsellingDocId] = useState(COLLABORATED_DOCTORS[2].id)
  const [counsellingMode, setCounsellingMode] = useState<CounsellingBooking['mode']>('Video')
  const [counsellingSlot, setCounsellingSlot] = useState(COUNSELLING_SLOTS[0])
  const [counsellingConcern, setCounsellingConcern] = useState('')
  const [bookingFlash, setBookingFlash] = useState(false)

  // Doctor Syrup Draft State
  const [syrupDoctor, setSyrupDoctor] = useState(activeSyrupRx.prescribedBy)
  const [syrupMorningMl, setSyrupMorningMl] = useState(activeSyrupRx.morningDoseMl)
  const [syrupEveningMl, setSyrupEveningMl] = useState(activeSyrupRx.eveningDoseMl)
  const [syrupFreq, setSyrupFreq] = useState<SyrupPrescription['frequency']>(activeSyrupRx.frequency)
  const [syrupDays, setSyrupDays] = useState(activeSyrupRx.durationDays)
  const [syrupMaxMl, setSyrupMaxMl] = useState(activeSyrupRx.maxDailyMl)
  const [syrupNote, setSyrupNote] = useState(activeSyrupRx.clinicalNote)
  const [syrupMorningTime, setSyrupMorningTime] = useState(
    normalizeHHMM(activeSyrupRx.morningReminderTime, '08:00')
  )
  const [syrupMiddayTime, setSyrupMiddayTime] = useState(
    normalizeHHMM(activeSyrupRx.middayReminderTime, '14:00')
  )
  const [syrupEveningTime, setSyrupEveningTime] = useState(
    normalizeHHMM(activeSyrupRx.eveningReminderTime, '20:00')
  )
  const [syrupSavedFlash, setSyrupSavedFlash] = useState(false)
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    getBrowserNotificationPermission()
  )
  const [clockTick, setClockTick] = useState(() => Date.now())

  // Doctor Patch Draft State (Intermediate & Chronic)
  const [simScenario, setSimScenario] = useState<'live' | 'stress' | 'recovery'>('live')
  const [doctorName, setDoctorName] = useState(patch.prescribedBy || 'Dr. Kavita Mehta (MD)')
  const [draftRate, setDraftRate] = useState(patch.infusionRateMcgHr)
  const [draftMin, setDraftMin] = useState(patch.minDoseMcgHr ?? 65)
  const [draftMax, setDraftMax] = useState(patch.maxDoseMcgHr ?? 180)
  const [draftDailyLimit, setDraftDailyLimit] = useState(patch.dailyDoseLimitMcg ?? 3600)
  const [draftLocked, setDraftLocked] = useState(Boolean(patch.doseLockedByDoctor))
  const [draftNote, setDraftNote] = useState(
    patch.prescriptionNote || 'Maintain steady non-sedating infusion within doctor bounds.'
  )
  const [orderSavedFlash, setOrderSavedFlash] = useState(false)

  useEffect(() => {
    const id = window.setInterval(() => setClockTick(Date.now()), 30000)
    return () => window.clearInterval(id)
  }, [])

  // Sync Syrup form drafts when switching account or switching Acute / Intermediate / Chronic
  useEffect(() => {
    const targetRx =
      phase === 'acute'
        ? account.acuteSyrupRx || FALLBACK_ACUTE_RX
        : phase === 'intermediate'
          ? account.intermediateSyrupRx || FALLBACK_INTERMEDIATE_RX
          : account.chronicSyrupRx || FALLBACK_CHRONIC_RX
    setSyrupDoctor(targetRx.prescribedBy)
    setSyrupMorningMl(targetRx.morningDoseMl)
    setSyrupEveningMl(targetRx.eveningDoseMl)
    setSyrupFreq(targetRx.frequency)
    setSyrupDays(targetRx.durationDays)
    setSyrupMaxMl(targetRx.maxDailyMl)
    setSyrupNote(targetRx.clinicalNote)
    setSyrupMorningTime(normalizeHHMM(targetRx.morningReminderTime, '08:00'))
    setSyrupMiddayTime(normalizeHHMM(targetRx.middayReminderTime, '14:00'))
    setSyrupEveningTime(normalizeHHMM(targetRx.eveningReminderTime, '20:00'))
  }, [account.id, phase, account.acuteSyrupRx, account.intermediateSyrupRx, account.chronicSyrupRx])

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

  // Sync Doctor Rx draft when active account or saved prescription updates
  useEffect(() => {
    const rx = account.doctorPrescription
    if (!rx) return
    setSelectedDoctorId(rx.doctorId || COLLABORATED_DOCTORS[0].id)
    setRxPhase(rx.phase || account.treatmentPhase || 'acute')
    setRxDiagnosis(rx.diagnosisNote || '')
    setRxMedicines(rx.medicines)
    setCondNoteAcute(
      rx.conditionNotes?.acute ||
        'Short-term stress surge · Oral Calming Syrup (Psilocybin) only.'
    )
    setCondNoteIntermediate(
      rx.conditionNotes?.intermediate ||
        'Persistent stress plateau · Oral Syrup + Automated AI Transdermal Patch.'
    )
    setCondNoteChronic(
      rx.conditionNotes?.chronic ||
        'Long-term maintenance · Sustained Oral Syrup + Automated AI Patch window.'
    )
    setAiPatchPrescribed(
      rx.aiPatchMention?.prescribed ?? (rx.phase === 'intermediate' || rx.phase === 'chronic')
    )
    setRxPatchRate(rx.aiPatchMention?.targetRateMcgHr ?? patch.infusionRateMcgHr ?? 110)
    setRxPatchMin(rx.aiPatchMention?.minRateMcgHr ?? patch.minDoseMcgHr ?? 65)
    setRxPatchMax(rx.aiPatchMention?.maxRateMcgHr ?? patch.maxDoseMcgHr ?? 180)
    setRxPatchDailyLimit(rx.aiPatchMention?.dailyLimitMcg ?? patch.dailyDoseLimitMcg ?? 3600)
    setRxPatchSchedule(
      rx.aiPatchMention?.wearSchedule || 'Closed-loop daytime/overnight wear (8–12 hrs/day)'
    )
    setRxPatchNote(
      rx.aiPatchMention?.clinicalInstruction ||
        'Use only for Intermediate or Chronic condition under MD supervision.'
    )
    setSignatureText(rx.signatureText || rx.doctorName)
    setSignatureDataUrl(rx.signatureDataUrl)
    setStampLabel(rx.stampLabel)
    setStampDataUrl(rx.stampDataUrl)
    setPaperRxUrl(rx.paperPrescriptionUrl)
    setPaperRxName(rx.paperPrescriptionName)
  }, [account.id, account.doctorPrescription])

  const selectedDoc =
    COLLABORATED_DOCTORS.find((d) => d.id === selectedDoctorId) || COLLABORATED_DOCTORS[0]

  const handleVerifyDoctor = () => {
    if (pinInput.trim() !== CLINICIAN_ACCESS_PIN) {
      setPinError(
        isHi
          ? `अमान्य डॉक्टर पासवर्ड। अधिकृत पासवर्ड (${CLINICIAN_ACCESS_PIN}) दर्ज करें।`
          : `Incorrect password. Doctor access requires valid clinical password (${CLINICIAN_ACCESS_PIN}).`
      )
      return
    }
    const cleanClinician = clinicianInput.trim() || 'Dr. Kavita Mehta (MD)'
    setSyrupDoctor(cleanClinician)
    setDoctorName(cleanClinician)
    setPinError('')
    setPinInput('')
    setShowDoctorLogin(false)
    onAuthorizeDoctor(cleanClinician)
  }

  // Signature Pad Handlers
  const getCanvasPoint = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  const handleSigPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!doctorAuthorized) return
    const canvas = sigCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    isDrawingRef.current = true
    const { x, y } = getCanvasPoint(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1B251A'
  }

  const handleSigPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!doctorAuthorized || !isDrawingRef.current) return
    const canvas = sigCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { x, y } = getCanvasPoint(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const handleSigPointerUp = () => {
    if (!doctorAuthorized || !isDrawingRef.current) return
    isDrawingRef.current = false
    const canvas = sigCanvasRef.current
    if (canvas) {
      setSignatureDataUrl(canvas.toDataURL('image/png'))
    }
  }

  const clearSignaturePad = () => {
    if (!doctorAuthorized) return
    const canvas = sigCanvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
    }
    setSignatureDataUrl(undefined)
  }

  const handleFileUpload = (
    e: ChangeEvent<HTMLInputElement>,
    target: 'stamp' | 'paperRx'
  ) => {
    if (!doctorAuthorized) return
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : undefined
      if (!result) return
      if (target === 'stamp') {
        setStampDataUrl(result)
      } else {
        setPaperRxUrl(result)
        setPaperRxName(file.name)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSaveDoctorRx = () => {
    if (!doctorAuthorized) return
    const cleanedMeds = rxMedicines.filter((m) => m.medicineName.trim().length > 0)
    const cleanMin = Math.max(30, Math.min(200, Math.round(Number(rxPatchMin) || 65)))
    const cleanMax = Math.max(cleanMin + 20, Math.min(350, Math.round(Number(rxPatchMax) || 180)))
    const cleanRate = Math.max(cleanMin, Math.min(cleanMax, Math.round(Number(rxPatchRate) || 110)))
    const cleanDaily = Math.max(cleanRate * 4, Math.min(7200, Math.round(Number(rxPatchDailyLimit) || 3600)))
    const supportsPatch = rxPhase === 'intermediate' || rxPhase === 'chronic'

    const record: DoctorPrescriptionRecord = {
      doctorId: selectedDoc.id,
      doctorName: selectedDoc.name,
      regNumber: selectedDoc.regNumber,
      phase: rxPhase,
      diagnosisNote: rxDiagnosis.trim() || 'Integrative autonomic stress & sleep support.',
      conditionNotes: {
        acute:
          condNoteAcute.trim() ||
          'Short-term stress surge · Oral Calming Syrup (Psilocybin) only.',
        intermediate:
          condNoteIntermediate.trim() ||
          'Persistent stress plateau · Oral Syrup + Automated AI Transdermal Patch.',
        chronic:
          condNoteChronic.trim() ||
          'Long-term maintenance · Sustained Oral Syrup + Automated AI Patch window.',
      },
      aiPatchMention: {
        prescribed: supportsPatch ? aiPatchPrescribed : false,
        targetRateMcgHr: cleanRate,
        minRateMcgHr: cleanMin,
        maxRateMcgHr: cleanMax,
        dailyLimitMcg: cleanDaily,
        wearSchedule:
          rxPatchSchedule.trim() || 'Closed-loop daytime/overnight wear (8–12 hrs/day)',
        clinicalInstruction:
          rxPatchNote.trim() ||
          'Use only for Intermediate or Chronic condition under MD supervision.',
      },
      medicines:
        cleanedMeds.length > 0
          ? cleanedMeds
          : [
              {
                id: `med-${Date.now()}`,
                medicineName: 'Oral Calming Syrup (Psilocybin)',
                dose: '10 ml',
                timing: 'Twice Daily',
                duration: '14 days',
              },
            ],
      signatureDataUrl,
      signatureText: signatureText.trim() || selectedDoc.name,
      stampLabel: stampLabel.trim() || `EMOTION AI CLINICAL SEAL · ${selectedDoc.regNumber}`,
      stampDataUrl,
      paperPrescriptionUrl: paperRxUrl,
      paperPrescriptionName: paperRxName,
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    onSaveDoctorPrescription(record)
    setRxSavedFlash(true)
    window.setTimeout(() => setRxSavedFlash(false), 2400)
  }

  const handleBookCounselling = () => {
    const doc =
      COLLABORATED_DOCTORS.find((d) => d.id === counsellingDocId) || COLLABORATED_DOCTORS[2]
    onAddCounsellingBooking({
      doctorId: doc.id,
      doctorName: doc.name,
      mode: counsellingMode,
      slotLabel: counsellingSlot,
      concern: counsellingConcern.trim() || 'Stress regulation & emotional balance',
    })
    setCounsellingConcern('')
    setBookingFlash(true)
    window.setTimeout(() => setBookingFlash(false), 2400)
  }

  const handleSaveSyrupOrder = () => {
    if (!doctorAuthorized) return
    const cleanMorning = Math.max(0, Math.min(30, Number(syrupMorningMl) || 0))
    const cleanEvening = Math.max(0, Math.min(30, Number(syrupEveningMl) || 0))
    const dailySum = cleanMorning + cleanEvening
    const cleanMaxDaily = Math.max(dailySum, Math.min(90, Math.round(syrupMaxMl)))
    const cleanDays = Math.max(1, Math.min(180, Math.round(syrupDays)))
    const cleanDoc = syrupDoctor.trim() || 'Dr. Kavita Mehta (MD)'
    const cleanNote =
      syrupNote.trim() ||
      `${phase.toUpperCase()} syrup: AM ${cleanMorning}ml, PM ${cleanEvening}ml (${syrupFreq}).`

    const cleanMorningTime = normalizeHHMM(syrupMorningTime, '08:00')
    const cleanMiddayTime = normalizeHHMM(syrupMiddayTime, '14:00')
    const cleanEveningTime = normalizeHHMM(syrupEveningTime, '20:00')

    onUpdateSyrupRx(phase, {
      morningDoseMl: cleanMorning,
      eveningDoseMl: cleanEvening,
      frequency: syrupFreq,
      durationDays: cleanDays,
      maxDailyMl: cleanMaxDaily,
      prescribedBy: cleanDoc,
      clinicalNote: cleanNote,
      morningReminderTime: cleanMorningTime,
      middayReminderTime: cleanMiddayTime,
      eveningReminderTime: cleanEveningTime,
      reminderEnabled: activeSyrupRx.reminderEnabled ?? true,
    })

    setSyrupSavedFlash(true)
    window.setTimeout(() => setSyrupSavedFlash(false), 2400)
  }

  const effectiveHourlyCap = Math.min(
    patch.maxDoseMcgHr ?? 180,
    Math.floor((patch.dailyDoseLimitMcg ?? 3600) / 24)
  )
  const effectiveFloor = Math.min(patch.minDoseMcgHr ?? 65, effectiveHourlyCap)

  const evaluateAgentCycle = (scenario: 'live' | 'stress' | 'recovery') => {
    setSimScenario(scenario)
    const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    if (patch.doseLockedByDoctor) {
      onUpdatePatch((prev) => ({
        ...prev,
        agentReasoning: `Doctor Hard-Lock active (${patch.prescribedBy}): Held steady at ${patch.infusionRateMcgHr} mcg/hr.`,
        lastEvaluatedAt: timeLabel,
      }))
      return
    }

    let rawTarget = 105
    let rationale = ''
    if (scenario === 'stress') {
      rawTarget = Math.max(effectiveFloor, Math.min(effectiveHourlyCap, 160))
      rationale = `Acute stress spike detected: calibrated to ${rawTarget} mcg/hr within MD bounds (${effectiveFloor}–${effectiveHourlyCap}).`
    } else if (scenario === 'recovery') {
      rawTarget = Math.max(effectiveFloor, Math.min(effectiveHourlyCap, 85))
      rationale = `Parasympathetic recovery detected: tapered to ${rawTarget} mcg/hr within MD bounds (${effectiveFloor}–${effectiveHourlyCap}).`
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
      rationale = `Evaluated ${factors.sleepHours}h sleep & ${factors.typingVarianceMs}ms typing variance -> ${rawTarget} mcg/hr (${effectiveFloor}–${effectiveHourlyCap}).`
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
          ? `${rationale} Dispatched to connected AI Patch Controller (${rawTarget} mcg/hr).`
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
            note: prev.controllerConnected
              ? `${rationale} (Synced to AI Patch Controller)`
              : rationale,
            actor: prev.controllerConnected ? 'controller' : 'ai',
          },
          ...prev.logs.slice(0, 6),
        ],
      }
    })
  }

  const handleApplyDoctorPatchOrder = () => {
    if (!doctorAuthorized) return
    const cleanMin = Math.max(30, Math.min(180, Math.round(draftMin)))
    const cleanMax = Math.max(cleanMin + 10, Math.min(220, Math.round(draftMax)))
    const cleanDaily = Math.max(cleanMin * 24, Math.min(cleanMax * 24 + 480, Math.round(draftDailyLimit)))
    const maxFromDaily = Math.floor(cleanDaily / 24)
    const boundedRate = Math.max(cleanMin, Math.min(cleanMax, maxFromDaily, Math.round(draftRate)))
    const cleanDoctor = doctorName.trim() || 'Dr. Kavita Mehta (MD)'
    const cleanNote = draftNote.trim() || `Dose set to ${boundedRate} mcg/hr.`
    const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

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
        ? `Doctor Hard-Lock by ${cleanDoctor}: Fixed at ${boundedRate} mcg/hr.`
        : `Doctor Range by ${cleanDoctor}: ${boundedRate} mcg/hr (bounds ${cleanMin}–${Math.min(cleanMax, maxFromDaily)} mcg/hr).`,
      lastEvaluatedAt: timeLabel,
      lastDoseReleaseAt: prev.controllerConnected ? timeLabel : prev.lastDoseReleaseAt,
      lastDoseReleaseMcgHr: prev.controllerConnected ? boundedRate : prev.lastDoseReleaseMcgHr,
      logs: [
        {
          id: `md-${Date.now()}`,
          time: timeLabel,
          rateMcgHr: boundedRate,
          note: `${cleanDoctor}: ${cleanNote}`,
          actor: 'doctor',
        },
        ...prev.logs.slice(0, 6),
      ],
    }))

    setOrderSavedFlash(true)
    window.setTimeout(() => setOrderSavedFlash(false), 2400)
  }

  const hours = [0, 3, 6, 9, 12, 15, 18, 21, 24]
  const activeDisplayRate = doctorAuthorized ? draftRate : patch.infusionRateMcgHr
  const scaleFactor = activeDisplayRate / 120
  const transdermalCurve = hours.map((h) =>
    h === 0 ? 10 : Math.min(96, Math.round(68 * (1 - Math.exp(-h / 2.6)) * scaleFactor))
  )
  const oralCurve = [8, 92, 54, 22, 86, 48, 19, 78, 30]
  const width = 460
  const height = 135
  const toPoints = (arr: number[]) =>
    arr
      .map((val, i) => {
        const x = (i / (arr.length - 1)) * (width - 28) + 14
        const y = height - (val / 100) * (height - 24) - 12
        return `${x},${y}`
      })
      .join(' ')

  const projected24hMcg = activeDisplayRate * 24
  const scheduledSlots = getScheduledDoseSlots(activeSyrupRx)
  const nextDoseInfo = getNextUpcomingDose(activeSyrupRx, new Date(clockTick))
  const syrupReminderOn = activeSyrupRx.reminderEnabled !== false

  const patchSpanMcg = Math.max(10, effectiveHourlyCap - effectiveFloor)
  const patchRawWindowPct = Math.max(
    0,
    Math.min(100, Math.round(((patch.infusionRateMcgHr - effectiveFloor) / patchSpanMcg) * 100))
  )
  const patchReleaseBarPct =
    phase === 'acute' ? 0 : Math.max(14, Math.min(100, patchRawWindowPct))
  const patchDoseLevelLabel =
    phase === 'acute'
      ? isHi
        ? 'स्टैंडबाय (केवल सिरप)'
        : 'Standby (Oral Syrup Only)'
      : patchRawWindowPct >= 67
        ? isHi
          ? 'उच्च सहायता रिलीज़'
          : 'Elevated Support'
        : patchRawWindowPct >= 34
          ? isHi
            ? 'संतुलित सक्रिय रिलीज़'
            : 'Balanced Active'
          : isHi
            ? 'शांत रखरखाव रिलीज़'
            : 'Calm Maintenance'

  const phaseStatusTheme =
    phase === 'intermediate'
      ? {
          container:
            'bg-[#FDF6E6] dark:bg-[#292112] border-[#C88A1E]/45 text-[#3B2A09] dark:text-[#F6DCA8]',
          badge: 'bg-[#C88A1E] text-white',
          track: 'bg-[#EADBC0] dark:bg-[#3B3019]',
          fill: 'bg-gradient-to-r from-[#B87714] via-[#D4942A] to-[#E6AA44]',
          accentText: 'text-[#8F5A0B] dark:text-[#F2BE63]',
          phaseLabel: isHi ? 'मध्यम चरण (Intermediate)' : 'Intermediate Phase',
        }
      : phase === 'chronic'
        ? {
            container:
              'bg-[#E7F4EF] dark:bg-[#122620] border-[#26735E]/45 text-[#122E26] dark:text-[#C8EAE0]',
            badge: 'bg-[#26735E] text-white',
            track: 'bg-[#CBE2D9] dark:bg-[#1D3B32]',
            fill: 'bg-gradient-to-r from-[#1F5E4D] via-[#2D826B] to-[#47A88E]',
            accentText: 'text-[#1F5E4D] dark:text-[#78D2B9]',
            phaseLabel: isHi ? 'दीर्घकालिक चरण (Chronic)' : 'Chronic Phase',
          }
        : {
            container:
              'bg-[#EDF2E4] dark:bg-[#182218] border-[#789575]/35 text-[#2E3C2D] dark:text-[#C5D1BF]',
            badge: 'bg-[#6B7E68] text-white',
            track: 'bg-[#D8E1CC] dark:bg-[#243224]',
            fill: 'bg-[#789575]',
            accentText: 'text-[#495847] dark:text-[#A8B7A4]',
            phaseLabel: isHi ? 'तीव्र चरण (Acute)' : 'Acute Phase',
          }

  return (
    <div className="space-y-6">
      {/* =====================================================================
          TREATMENT HUB HEADER + TWO-PART NAVIGATION + DOCTOR PASSWORD GATE
         ===================================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-[28px] sample-pastel-sky p-6 sm:p-7 space-y-5 shadow-[0_18px_40px_-14px_rgba(52,73,50,0.18)] border border-white/80 dark:border-white/10"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#344932] dark:text-[#A8C6A4]">
              <Stethoscope className="w-4 h-4" />
              <span>
                {isHi
                  ? 'EmotionMed + Care Bridge · विश्वसनीय स्वास्थ्य जानकारी और विशेषज्ञ डॉक्टर'
                  : 'EmotionMed + Care Bridge — Connect wellness with trustworthy healthcare information and real professionals.'}
              </span>
            </div>
            <h2 className="font-display text-2xl font-bold text-[#1B251A] dark:text-[#E5E8CE] tracking-tight">
              {activeSection === 'doctor'
                ? isHi
                  ? 'भाग 1 · डॉक्टर अनुभाग (परामर्श, पेपर प्रिस्क्रिप्शन व केयर)'
                  : 'Part 1 · Doctor Section'
                : isHi
                  ? 'भाग 2 · निर्धारित दवा अनुभाग (Acute · Intermediate · Chronic)'
                  : 'Part 2 · Prescribed Medication Section'}
            </h2>
          </div>

          <div className="shrink-0 flex items-center gap-2.5">
            {doctorAuthorized ? (
              <button
                type="button"
                onClick={onLockDoctor}
                className="clay-btn-forest inline-flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                <Unlock className="w-3.5 h-3.5 text-[#A8C6A4]" />
                <span>{isHi ? 'डॉक्टर मोड सक्रिय · लॉक करें' : 'Doctor Unlocked · Lock'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowDoctorLogin((v) => !v)
                  setPinError('')
                }}
                className="clay-btn-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isHi ? 'डॉक्टर लॉगिन (पासवर्ड)' : 'Doctor Access (Password)'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Inline Doctor Password Verification Gate */}
        {!doctorAuthorized && showDoctorLogin && (
          <div className="rounded-[20px] bg-white/85 dark:bg-[#192819] border border-white/90 dark:border-white/10 p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1B251A] dark:text-[#E5E8CE]">
                <KeyRound className="w-4 h-4 text-[#4E6B4B]" />
                <span>
                  {isHi
                    ? 'प्रिस्क्रिप्शन, खुराक और अलार्म संपादन केवल डॉक्टर के लिए लॉक है'
                    : 'Prescribing, Dose & Alarm Editing is Protected by Doctor Password'}
                </span>
              </div>
              <span className="text-[11px] font-mono-num text-[#495847] dark:text-[#A8B7A4]">
                Doctor Password: {CLINICIAN_ACCESS_PIN}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={clinicianInput}
                onChange={(e) => setClinicianInput(e.target.value)}
                aria-label="Doctor Name"
                className="h-11 rounded-[13px] clay-input border-0 px-3 text-xs font-semibold"
              >
                {COLLABORATED_DOCTORS.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
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
                aria-label="Doctor Password"
                placeholder={isHi ? 'डॉक्टर पासवर्ड दर्ज करें' : 'Enter Doctor Password'}
                className="h-11 rounded-[13px] clay-input border-0 px-3.5 text-xs font-mono-num font-semibold"
              />
              <button
                type="button"
                onClick={handleVerifyDoctor}
                className="clay-btn-primary h-11 px-4 rounded-[13px] text-xs font-semibold cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>{isHi ? 'डॉक्टर एक्सेस खोलें' : 'Unlock Doctor Access'}</span>
              </button>
            </div>

            {pinError && (
              <div className="text-xs font-semibold text-[#B42318] dark:text-[#F07D73]">{pinError}</div>
            )}
          </div>
        )}

        {/* Top-Level Two-Part Switcher: 1. Doctor Section | 2. Prescribed Medication Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 rounded-[22px] bg-white/65 dark:bg-[#142014]/80 border border-white/80 dark:border-white/10">
          <button
            type="button"
            onClick={() => setActiveSection('doctor')}
            className={`rounded-[17px] p-4 text-left flex items-center gap-3 cursor-pointer transition-all ${
              activeSection === 'doctor'
                ? 'clay-btn-primary'
                : 'text-[#1B251A] dark:text-[#E5E8CE] hover:bg-white/60 dark:hover:bg-white/5'
            }`}
          >
            <span
              className={`w-10 h-10 rounded-[13px] flex items-center justify-center shrink-0 ${
                activeSection === 'doctor'
                  ? 'bg-white/25 text-white'
                  : 'bg-[#E5ECD7] dark:bg-[#233623] text-[#344932] dark:text-[#A8C6A4]'
              }`}
            >
              <Stethoscope className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-bold truncate">
                {isHi ? '1. डॉक्टर अनुभाग' : '1. Doctor Section'}
              </div>
              <div
                className={`text-xs truncate ${
                  activeSection === 'doctor' ? 'text-white/85' : 'text-[#495847] dark:text-[#A8B7A4]'
                }`}
              >
                {isHi
                  ? 'सहयोगी डॉक्टर · पेपर प्रिस्क्रिप्शन (हस्ताक्षर/स्टाम्प) · परामर्श'
                  : 'Doctors · Paper Rx & Signature/Stamp · Counselling'}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('medication')}
            className={`rounded-[17px] p-4 text-left flex items-center gap-3 cursor-pointer transition-all ${
              activeSection === 'medication'
                ? 'clay-btn-primary'
                : 'text-[#1B251A] dark:text-[#E5E8CE] hover:bg-white/60 dark:hover:bg-white/5'
            }`}
          >
            <span
              className={`w-10 h-10 rounded-[13px] flex items-center justify-center shrink-0 ${
                activeSection === 'medication'
                  ? 'bg-white/25 text-white'
                  : 'bg-[#E5ECD7] dark:bg-[#233623] text-[#344932] dark:text-[#A8C6A4]'
              }`}
            >
              <Droplets className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-bold truncate">
                {isHi ? '2. निर्धारित दवा अनुभाग' : '2. Prescribed Medication'}
              </div>
              <div
                className={`text-xs truncate ${
                  activeSection === 'medication'
                    ? 'text-white/85'
                    : 'text-[#495847] dark:text-[#A8B7A4]'
                }`}
              >
                {isHi
                  ? '1. Acute · 2. Intermediate · 3. Chronic प्रोटोकॉल'
                  : '1. Acute · 2. Intermediate · 3. Chronic'}
              </div>
            </div>
          </button>
        </div>

        {/* Visual Status Bar: Automated AI Patch Dose Release Level (Color-Coded by Treatment Phase) */}
        <div
          role="region"
          aria-label="Automated AI Patch Dose Release Status"
          className={`rounded-[20px] border p-4 sm:p-4.5 space-y-2.5 transition-colors ${phaseStatusTheme.container}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <Activity className={`w-4 h-4 shrink-0 ${phaseStatusTheme.accentText}`} />
              <span className="text-xs sm:text-[13px] font-bold tracking-tight">
                {isHi
                  ? 'स्वचालित AI पैच खुराक रिलीज़ स्तर'
                  : 'Automated AI Patch Dose Release Level'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-[8px] text-[10px] font-bold uppercase tracking-wider ${phaseStatusTheme.badge}`}
              >
                {phaseStatusTheme.phaseLabel}
              </span>
              {phase !== 'acute' && (
                <span className="text-[11px] font-semibold opacity-85">
                  · {patchDoseLevelLabel}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-sm sm:text-base font-bold font-mono-num ${phaseStatusTheme.accentText}`}>
                {phase === 'acute'
                  ? '0 mcg/hr (Standby)'
                  : `${patch.infusionRateMcgHr} mcg/hr`}
              </span>
              {phase !== 'acute' && (
                <span className="text-[11px] font-mono-num font-semibold opacity-75">
                  {patchRawWindowPct}% of MD Window
                </span>
              )}
            </div>
          </div>

          {/* Color-Coded Status Progress Track */}
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={phase === 'acute' ? 0 : patchRawWindowPct}
            aria-label={`Automated AI patch dose release ${phase === 'acute' ? 'standby' : `${patch.infusionRateMcgHr} mcg per hour`}`}
            className={`relative h-3.5 w-full rounded-[9px] overflow-hidden ${phaseStatusTheme.track}`}
          >
            <div
              style={{ width: `${patchReleaseBarPct}%` }}
              className={`h-full rounded-[9px] transition-all duration-500 ${phaseStatusTheme.fill} ${
                phase !== 'acute' && patch.controllerConnected && patch.autoOptimize
                  ? 'animate-pulse'
                  : ''
              }`}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium opacity-85">
            <span className="font-mono-num">
              {phase === 'acute'
                ? isHi
                  ? 'तीव्र चरण: ओरल सिरप सक्रिय · AI पैच स्टैंडबाय'
                  : 'Acute Protocol: Oral Calming Syrup active · AI Patch Standby'
                : `MD Bounds: ${effectiveFloor}–${effectiveHourlyCap} mcg/hr · ${
                    patch.controllerConnected ? 'Controller Linked ✓' : 'Controller Standby'
                  }`}
            </span>

            <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-[3px] bg-[#C88A1E] inline-block" />
                <span>Intermediate</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-[3px] bg-[#26735E] inline-block" />
                <span>Chronic</span>
              </span>
              {activeSection !== 'medication' && (phase === 'intermediate' || phase === 'chronic') && (
                <button
                  type="button"
                  onClick={() => setActiveSection('medication')}
                  className={`underline font-bold cursor-pointer ${phaseStatusTheme.accentText}`}
                >
                  {isHi ? 'पैच रेगुलेटर खोलें →' : 'Open Patch Regulator →'}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {/* =====================================================================
          PART 1: DOCTOR SECTION
         ===================================================================== */}
      {activeSection === 'doctor' && (
        <div className="space-y-6">
          {/* Doctor Sub-tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'doctors' as const, label: isHi ? 'सहयोगी डॉक्टर' : 'Collaborated Doctors', icon: Stethoscope },
              { id: 'rx' as const, label: isHi ? 'पेपर प्रिस्क्रिप्शन, हस्ताक्षर व स्टाम्प' : 'Paper Prescription, Sign & Stamp', icon: PenTool },
              { id: 'counselling' as const, label: isHi ? 'डॉक्टर परामर्श बुक करें' : 'Counselling Booking', icon: Video },
            ].map((item) => {
              const Icon = item.icon
              const active = doctorSubTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDoctorSubTab(item.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-xs font-semibold cursor-pointer transition-all ${
                    active ? 'clay-btn-primary' : 'clay-btn-secondary'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>

          {/* 1A: Collaborated Doctors Directory */}
          {doctorSubTab === 'doctors' && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {COLLABORATED_DOCTORS.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-[24px] clay-card p-5 flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-full clay-btn-primary flex items-center justify-center font-display font-bold text-sm shrink-0">
                      {doc.avatarInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-display text-base font-bold text-[#1B251A] dark:text-[#E5E8CE]">
                          {doc.name}
                        </h3>
                        <span className="text-[11px] font-mono-num px-2 py-0.5 rounded-[8px] clay-tile text-[#344932] dark:text-[#A8C6A4]">
                          {doc.regNumber}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#344932] dark:text-[#A8C6A4] mt-0.5">
                        {doc.credentials}
                      </p>
                      <p className="text-xs text-[#495847] dark:text-[#A8B7A4] mt-1">
                        {isHi ? doc.specialtyHi : doc.specialty} · {doc.hospital} · {doc.experienceYears} yrs
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#495847] dark:text-[#A8B7A4]">
                        <span>Next Slot: {doc.nextAvailable}</span>
                        <span>·</span>
                        <span>{doc.languages.join(', ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDoctorId(doc.id)
                        setSignatureText(doc.name)
                        setStampLabel(`EMOTION AI CLINICAL SEAL · ${doc.regNumber}`)
                        setDoctorSubTab('rx')
                      }}
                      className="clay-btn-secondary py-2.5 px-3 rounded-[12px] text-xs font-semibold cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{isHi ? 'पेपर प्रिस्क्रिप्शन' : 'Paper Prescription'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCounsellingDocId(doc.id)
                        setDoctorSubTab('counselling')
                      }}
                      className="clay-btn-primary py-2.5 px-3 rounded-[12px] text-xs font-semibold cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>{isHi ? 'परामर्श बुक करें' : 'Counselling'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* 1B: Doctor Paper Prescription Pad + Digital Signature + Stamp + Paper Upload */}
          {doctorSubTab === 'rx' && (
            <section className="rounded-[26px] clay-card p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pr-16 sm:pr-0">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1B251A] dark:text-[#E5E8CE]">
                    {isHi
                      ? 'मेडिकल पेपर प्रिस्क्रिप्शन शीट, हस्ताक्षर, स्टाम्प व पेपर अपलोड'
                      : 'Medical Paper Prescription Sheet, Signature, Stamp & Paper Upload'}
                  </h3>
                  <p className="text-xs text-[#495847] dark:text-[#A8B7A4] mt-0.5">
                    {doctorAuthorized
                      ? isHi
                        ? 'डॉक्टर मोड अनलॉक: नीचे पेपर प्रिस्क्रिप्शन शीट पर दवाएं, खुराक, हस्ताक्षर व स्टाम्प लिखें या हस्तलिखित पेपर अपलोड करें।'
                        : 'Doctor Mode Unlocked: Write medicines, sign, stamp on the paper Rx pad below, or upload a handwritten sheet.'
                      : isHi
                        ? 'केवल डॉक्टर पासवर्ड से संपादन योग्य (मरीज़ के लिए रीड-ओनली पेपर प्रिस्क्रिप्शन)।'
                        : 'Verified clinical paper prescription sheet. Unlock with Doctor Password to edit.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {savedRx && (
                    <button
                      type="button"
                      onClick={() => {
                        const docProfile =
                          COLLABORATED_DOCTORS.find((d) => d.id === savedRx.doctorId) ||
                          COLLABORATED_DOCTORS[0]
                        const condNotes = savedRx.conditionNotes || {
                          acute: 'Short-term stress surge · Oral Calming Syrup (Psilocybin) only.',
                          intermediate: 'Persistent stress plateau · Oral Syrup + Automated AI Transdermal Patch.',
                          chronic: 'Long-term maintenance · Sustained Oral Syrup + Automated AI Patch window.',
                        }
                        const patchInfo = savedRx.aiPatchMention
                        const lines = [
                          '====================================================',
                          '         EMOTION AI INTEGRATIVE CARE CLINIC',
                          '             MEDICAL PRESCRIPTION PAD (Rx)',
                          '====================================================',
                          `Doctor      : ${savedRx.doctorName}`,
                          `Credentials : ${docProfile.credentials}`,
                          `Hospital    : ${docProfile.hospital}`,
                          `Reg. Number : ${savedRx.regNumber}`,
                          `Date / Time : ${today} (${savedRx.updatedAt})`,
                          '----------------------------------------------------',
                          `Patient     : ${account.name}`,
                          `Active Stage: ${savedRx.phase.toUpperCase()} CONDITION`,
                          'Patient Condition Classification (All 3 Stages):',
                          `  [${savedRx.phase === 'acute' ? 'X' : ' '}] 1. ACUTE        : ${condNotes.acute}`,
                          `  [${savedRx.phase === 'intermediate' ? 'X' : ' '}] 2. INTERMEDIATE : ${condNotes.intermediate}`,
                          `  [${savedRx.phase === 'chronic' ? 'X' : ' '}] 3. CHRONIC      : ${condNotes.chronic}`,
                          `Clinical Note: ${savedRx.diagnosisNote}`,
                          '----------------------------------------------------',
                          'Rx (Prescribed Medications):',
                          ...savedRx.medicines.map(
                            (m, i) =>
                              `  ${i + 1}. ${m.medicineName} — ${m.dose} | ${m.timing} | ${m.duration}`
                          ),
                          ...(savedRx.phase !== 'acute' && patchInfo?.prescribed
                            ? [
                                '----------------------------------------------------',
                                'AI Transdermal Patch Mention (Intermediate/Chronic):',
                                `  * Automated AI Patch : ${patchInfo.targetRateMcgHr} mcg/hr (Bounds ${patchInfo.minRateMcgHr}-${patchInfo.maxRateMcgHr} mcg/hr | Cap ${patchInfo.dailyLimitMcg} mcg/day)`,
                                `  * Wear Schedule      : ${patchInfo.wearSchedule}`,
                                `  * Instruction        : ${patchInfo.clinicalInstruction}`,
                              ]
                            : [
                                '----------------------------------------------------',
                                'AI Transdermal Patch : Not indicated in Acute condition (Oral Syrup Only)',
                              ]),
                          '----------------------------------------------------',
                          `Signature   : ${savedRx.signatureText || savedRx.doctorName}`,
                          `Clinic Seal : ${savedRx.stampLabel}`,
                          '====================================================',
                        ].join('\n')
                        const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `Rx-${account.name.replace(/\s+/g, '_')}-${today}.txt`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(url)
                      }}
                      className="clay-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] text-xs font-semibold cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isHi ? 'Rx डाउनलोड करें' : 'Download Paper Rx'}</span>
                    </button>
                  )}

                  {!doctorAuthorized && (
                    <button
                      type="button"
                      onClick={() => setShowDoctorLogin(true)}
                      className="clay-btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] text-xs font-semibold cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{isHi ? 'डॉक्टर पासवर्ड से खोलें' : 'Unlock to Prescribe'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Authentic Hospital-Format Digital Prescription matching uploaded clinical layout, tailored to EMOTION AI */}
              {savedRx && (() => {
                const docInfo =
                  COLLABORATED_DOCTORS.find((d) => d.id === savedRx.doctorId) ||
                  COLLABORATED_DOCTORS[0]
                const condNotes = {
                  acute:
                    savedRx.conditionNotes?.acute ||
                    'Short-term stress surge · Oral Calming Syrup (Psilocybin) only.',
                  intermediate:
                    savedRx.conditionNotes?.intermediate ||
                    'Persistent stress plateau · Oral Syrup + Automated AI Transdermal Patch.',
                  chronic:
                    savedRx.conditionNotes?.chronic ||
                    'Long-term maintenance · Sustained Oral Syrup + Automated AI Patch window.',
                }
                return (
                  <div className="max-w-3xl mx-auto bg-white text-black border border-[#D4D8D2] rounded-[2px] shadow-[0_14px_34px_-12px_rgba(20,38,30,0.22)] px-6 sm:px-10 py-7 sm:py-9 font-serif">
                    {/* Two-Column Hospital Style Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5">
                      <div className="flex items-start gap-3">
                        <BrandLogo size="lg" />
                        <div className="leading-tight">
                          <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#1E3B5A]">
                            EMOTION AI
                          </div>
                          <div className="text-[10px] font-sans font-bold uppercase tracking-[0.26em] text-[#B86A28]">
                            INTEGRATIVE CARE
                          </div>
                          <div className="text-xs text-[#4A554A] mt-0.5 font-serif">
                            Digital Mental Wellness Clinic
                          </div>
                        </div>
                      </div>

                      <div className="sm:text-center text-xs leading-snug text-black space-y-0.5 font-bold">
                        <div>EMOTION AI Super Speciality Care, {docInfo.hospital}</div>
                        <div>Tele-Mental Health &amp; Precision Neuro-Ayurveda</div>
                        <div>Reg. Unit - {savedRx.regNumber}</div>
                      </div>
                    </div>

                    {/* Centered Uppercase Document Title */}
                    <div className="text-center pb-2.5">
                      <h4 className="text-sm sm:text-base font-bold uppercase tracking-[0.06em] text-black">
                        DIGITAL CLINICAL PRESCRIPTION (Rx)
                      </h4>
                    </div>

                    {/* Crisp Black-Bordered Two-Column Patient & Protocol Metadata Box */}
                    <div className="border-[1.5px] border-black px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-xs">
                      <div className="space-y-1">
                        <div className="grid grid-cols-[118px_10px_1fr] items-baseline">
                          <span className="font-normal">Patient Name</span>
                          <span>:</span>
                          <span className="font-bold uppercase">{account.name}</span>
                        </div>
                        <div className="grid grid-cols-[118px_10px_1fr] items-baseline">
                          <span className="font-normal">Category / Role</span>
                          <span>:</span>
                          <span>{account.role}</span>
                        </div>
                        <div className="grid grid-cols-[118px_10px_1fr] items-baseline">
                          <span className="font-normal">Condition Stage</span>
                          <span>:</span>
                          <span className="font-bold uppercase">{savedRx.phase} Condition</span>
                        </div>
                        <div className="grid grid-cols-[118px_10px_1fr] items-baseline">
                          <span className="font-normal">Ref. Doctor</span>
                          <span>:</span>
                          <span className="font-semibold">{savedRx.doctorName}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="grid grid-cols-[126px_10px_1fr] items-baseline">
                          <span className="font-normal">Location</span>
                          <span>:</span>
                          <span>{docInfo.hospital}</span>
                        </div>
                        <div className="grid grid-cols-[126px_10px_1fr] items-baseline">
                          <span className="font-normal">Clinical Reg. No</span>
                          <span>:</span>
                          <span className="font-mono-num">{savedRx.regNumber}</span>
                        </div>
                        <div className="grid grid-cols-[126px_10px_1fr] items-baseline">
                          <span className="font-normal">Rx Issue Date / Time</span>
                          <span>:</span>
                          <span className="font-mono-num">
                            {today} / {savedRx.updatedAt}
                          </span>
                        </div>
                        <div className="grid grid-cols-[126px_10px_1fr] items-baseline">
                          <span className="font-normal">Protocol Type</span>
                          <span>:</span>
                          <span>
                            {savedRx.phase === 'acute'
                              ? 'Oral Syrup Only'
                              : 'Oral Syrup + AI Patch'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Centered Section Subheading matching sample */}
                    <div className="text-center text-xs font-bold pt-2.5 pb-4 text-black">
                      {isHi
                        ? 'निर्धारित औषधि एवं स्थिति वर्गीकरण'
                        : 'Prescribed Regimen & Patient Condition Assessment'}
                    </div>

                    {/* Clean Unbordered Underlined Column Table matching sample Parameter | Result | Unit | Reference Range */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr>
                            <th className="pb-1.5 pr-3 font-bold">
                              <span className="border-b border-black pb-0.5 inline-block">
                                Medication / Therapy
                              </span>
                            </th>
                            <th className="pb-1.5 pr-3 font-bold">
                              <span className="border-b border-black pb-0.5 inline-block">
                                Dosage / Rate
                              </span>
                            </th>
                            <th className="pb-1.5 pr-3 font-bold">
                              <span className="border-b border-black pb-0.5 inline-block">
                                Frequency / Timing
                              </span>
                            </th>
                            <th className="pb-1.5 font-bold">
                              <span className="border-b border-black pb-0.5 inline-block">
                                Duration / Window
                              </span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="align-top">
                          {savedRx.medicines.map((med, idx) => (
                            <tr key={med.id}>
                              <td className="py-2 pr-3 font-medium">
                                {idx + 1}. {med.medicineName}
                              </td>
                              <td className="py-2 pr-3 font-mono-num">{med.dose}</td>
                              <td className="py-2 pr-3">{med.timing}</td>
                              <td className="py-2">{med.duration}</td>
                            </tr>
                          ))}

                          {savedRx.phase !== 'acute' &&
                          savedRx.aiPatchMention?.prescribed !== false ? (
                            <tr>
                              <td className="py-2 pr-3 font-medium">
                                {savedRx.medicines.length + 1}. Automated AI Transdermal Patch (
                                {savedRx.phase === 'intermediate' ? 'Intermediate' : 'Chronic'})
                              </td>
                              <td className="py-2 pr-3 font-mono-num">
                                {savedRx.aiPatchMention?.targetRateMcgHr ?? patch.infusionRateMcgHr}{' '}
                                mcg/hr
                              </td>
                              <td className="py-2 pr-3">
                                {savedRx.aiPatchMention?.wearSchedule ||
                                  'Closed-loop wear (8–12 hrs/day)'}
                              </td>
                              <td className="py-2 font-mono-num">
                                {savedRx.aiPatchMention?.minRateMcgHr ?? patch.minDoseMcgHr ?? 65}–
                                {savedRx.aiPatchMention?.maxRateMcgHr ?? patch.maxDoseMcgHr ?? 180}{' '}
                                mcg/hr (Cap{' '}
                                {savedRx.aiPatchMention?.dailyLimitMcg ??
                                  patch.dailyDoseLimitMcg ??
                                  3600}{' '}
                                mcg)
                              </td>
                            </tr>
                          ) : (
                            <tr>
                              <td className="py-2 pr-3 text-[#444]">
                                Automated AI Transdermal Patch
                              </td>
                              <td className="py-2 pr-3 text-[#444]" colSpan={3}>
                                {savedRx.phase === 'acute'
                                  ? 'Not indicated in Acute condition (Reserved for Intermediate & Chronic)'
                                  : 'Held / deferred per clinician order'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Concise Clinical Note & 3 Patient Condition Stages */}
                    <div className="mt-5 pt-3 border-t border-black/15 text-[11px] space-y-1.5 text-[#1A1A1A]">
                      <div>
                        <span className="font-bold">Dx / Clinical Note: </span>
                        <span className="italic">{savedRx.diagnosisNote}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        <div>
                          <span className="font-bold">
                            [{savedRx.phase === 'acute' ? '✓' : ' '}] 1. Acute:
                          </span>{' '}
                          <span>{condNotes.acute}</span>
                        </div>
                        <div>
                          <span className="font-bold">
                            [{savedRx.phase === 'intermediate' ? '✓' : ' '}] 2. Intermediate:
                          </span>{' '}
                          <span>{condNotes.intermediate}</span>
                        </div>
                        <div>
                          <span className="font-bold">
                            [{savedRx.phase === 'chronic' ? '✓' : ' '}] 3. Chronic:
                          </span>{' '}
                          <span>{condNotes.chronic}</span>
                        </div>
                      </div>
                      {savedRx.phase !== 'acute' &&
                        savedRx.aiPatchMention?.prescribed !== false &&
                        savedRx.aiPatchMention?.clinicalInstruction && (
                          <div>
                            <span className="font-bold">AI Patch Instruction: </span>
                            <span>{savedRx.aiPatchMention.clinicalInstruction}</span>
                          </div>
                        )}
                    </div>

                    {/* Centered End of Prescription Divider matching sample */}
                    <div className="text-center text-xs py-6 text-black tracking-tight">
                      -------------------- End of Prescription --------------------
                    </div>

                    {/* Left-Aligned Signature & Clinical Stamp Columns matching sample */}
                    <div className="flex flex-wrap items-end justify-start gap-12 sm:gap-20 pt-2">
                      <div className="space-y-1.5 min-w-[180px]">
                        <div className="h-14 flex items-end">
                          {savedRx.signatureDataUrl ? (
                            <img
                              src={savedRx.signatureDataUrl}
                              alt="Doctor Signature"
                              className="h-12 max-w-[190px] object-contain"
                            />
                          ) : (
                            <span className="font-serif italic text-xl text-[#1A2D4F] px-1">
                              {savedRx.signatureText || savedRx.doctorName}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-black">{savedRx.doctorName}</div>
                        <div className="text-[11px] text-[#222]">{docInfo.credentials}</div>
                      </div>

                      <div className="space-y-1.5 min-w-[180px]">
                        <div className="h-14 flex items-end">
                          {savedRx.stampDataUrl ? (
                            <img
                              src={savedRx.stampDataUrl}
                              alt="Clinic Stamp"
                              className="h-14 w-14 rounded-full object-cover border border-black -rotate-3"
                            />
                          ) : (
                            <div className="h-14 w-14 rounded-full border-[1.5px] border-black p-0.5 -rotate-6 flex items-center justify-center">
                              <div className="w-full h-full rounded-full border border-dashed border-black flex flex-col items-center justify-center text-[6px] font-bold uppercase leading-tight text-center">
                                <Stamp className="w-3 h-3 mb-0.5" />
                                <span>VERIFIED</span>
                                <span>EMOTION AI</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-xs font-bold text-black">
                          EMOTION AI Clinical Seal
                        </div>
                        <div className="text-[11px] text-[#222] max-w-[220px]">
                          {savedRx.stampLabel}
                        </div>
                      </div>
                    </div>

                    {/* Page Marker & Centered Clinical Disclaimer Footer matching sample */}
                    <div className="mt-10 space-y-4">
                      <div className="text-right text-[10px] text-[#333]">Page 1 of 1</div>
                      <div className="text-center text-[10px] font-bold text-black">
                        (For Clinical Care &amp; Patient Interpretation — Supervised by a Registered Medical Practitioner)
                      </div>
                    </div>

                    {/* Uploaded Handwritten Paper Prescription Slip (if attached) */}
                    {savedRx.paperPrescriptionUrl && (
                      <div className="mt-6 pt-4 border-t border-black/20 space-y-2">
                        <div className="text-xs font-bold text-black flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          <span>
                            {isHi
                              ? 'संलग्न हस्तलिखित पेपर प्रिस्क्रिप्शन:'
                              : 'Attached Handwritten Paper Prescription:'}{' '}
                            {savedRx.paperPrescriptionName || 'prescription'}
                          </span>
                        </div>
                        {savedRx.paperPrescriptionUrl.startsWith('data:image/') ? (
                          <img
                            src={savedRx.paperPrescriptionUrl}
                            alt="Uploaded Paper Prescription"
                            className="max-h-72 rounded-[2px] border border-black/30 bg-white object-contain"
                          />
                        ) : (
                          <a
                            href={savedRx.paperPrescriptionUrl}
                            download={savedRx.paperPrescriptionName || 'paper-prescription.pdf'}
                            className="inline-flex items-center gap-1.5 border border-black text-black bg-white px-3 py-1.5 rounded-[2px] text-xs font-semibold hover:bg-black/5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Download Uploaded Paper PDF</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Doctor-Only Prescription Editor */}
              {doctorAuthorized && (
                <div className="rounded-[22px] clay-card-tint p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Prescribing Doctor</label>
                      <select
                        value={selectedDoctorId}
                        onChange={(e) => {
                          const id = e.target.value
                          setSelectedDoctorId(id)
                          const doc = COLLABORATED_DOCTORS.find((d) => d.id === id)
                          if (doc) {
                            setSignatureText(doc.name)
                            setStampLabel(`EMOTION AI CLINICAL SEAL · ${doc.regNumber}`)
                          }
                        }}
                        className="w-full h-10 rounded-[12px] clay-input px-3 text-xs font-semibold"
                      >
                        {COLLABORATED_DOCTORS.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.regNumber})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">
                        {isHi ? 'मरीज़ की स्थिति / उपचार प्रोटोकॉल' : 'Patient Condition / Treatment Protocol'}
                      </label>
                      <select
                        value={rxPhase}
                        onChange={(e) => {
                          const next = e.target.value as TreatmentPhase
                          setRxPhase(next)
                          setAiPatchPrescribed(next === 'intermediate' || next === 'chronic')
                        }}
                        className="w-full h-10 rounded-[12px] clay-input px-3 text-xs font-semibold"
                      >
                        <option value="acute">1. Acute (Oral Syrup Only)</option>
                        <option value="intermediate">2. Intermediate (Syrup + AI Patch)</option>
                        <option value="chronic">3. Chronic (Long-Term Syrup + AI Patch)</option>
                      </select>
                    </div>
                  </div>

                  {/* All 3 Patient Conditions Mentioned on Prescription */}
                  <div className="rounded-[16px] clay-tile p-4 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <ClipboardList className="w-3.5 h-3.5 text-[#4E6B4B]" />
                        <span>
                          {isHi
                            ? 'प्रिस्क्रिप्शन पर तीनों स्थितियों का उल्लेख'
                            : 'Condition Notes on Paper Rx (All 3 Patient Types)'}
                        </span>
                      </span>
                      <span className="text-[11px] font-semibold text-[#344932] dark:text-[#A8C6A4]">
                        Active: {rxPhase.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold mb-1 text-[#344932] dark:text-[#A8C6A4]">
                          1. Acute Condition Note
                        </label>
                        <input
                          type="text"
                          value={condNoteAcute}
                          onChange={(e) => setCondNoteAcute(e.target.value)}
                          className="w-full h-9 rounded-[10px] clay-input px-2.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold mb-1 text-[#344932] dark:text-[#A8C6A4]">
                          2. Intermediate Condition Note
                        </label>
                        <input
                          type="text"
                          value={condNoteIntermediate}
                          onChange={(e) => setCondNoteIntermediate(e.target.value)}
                          className="w-full h-9 rounded-[10px] clay-input px-2.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold mb-1 text-[#344932] dark:text-[#A8C6A4]">
                          3. Chronic Condition Note
                        </label>
                        <input
                          type="text"
                          value={condNoteChronic}
                          onChange={(e) => setCondNoteChronic(e.target.value)}
                          className="w-full h-9 rounded-[10px] clay-input px-2.5 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* AI Patch Prescription Mention System for Intermediate & Chronic Patients */}
                  <div className="rounded-[16px] clay-tile p-4 space-y-3 border border-[#789575]/35">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-[#344932] dark:text-[#A8C6A4]" />
                        <span className="text-xs font-bold">
                          {isHi
                            ? 'मध्यम व दीर्घकालिक मरीज़ के लिए AI पैच उल्लेख प्रणाली'
                            : 'AI Transdermal Patch Mention System (Intermediate & Chronic)'}
                        </span>
                      </div>
                      {rxPhase !== 'acute' ? (
                        <button
                          type="button"
                          onClick={() => setAiPatchPrescribed((v) => !v)}
                          className={`px-3 py-1 rounded-[10px] text-[11px] font-bold cursor-pointer transition-colors ${
                            aiPatchPrescribed
                              ? 'clay-btn-primary'
                              : 'clay-btn-secondary text-[#495847]'
                          }`}
                        >
                          {aiPatchPrescribed ? 'AI Patch Included on Rx ✓' : 'Include AI Patch on Rx'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setRxPhase('intermediate')
                            setAiPatchPrescribed(true)
                          }}
                          className="clay-btn-secondary px-3 py-1 rounded-[10px] text-[11px] font-semibold cursor-pointer"
                        >
                          Switch to Intermediate to Prescribe AI Patch
                        </button>
                      )}
                    </div>

                    {rxPhase === 'acute' ? (
                      <p className="text-xs text-[#495847] dark:text-[#A8B7A4]">
                        Acute condition uses Oral Calming Syrup (Psilocybin) only. Select{' '}
                        <strong>2. Intermediate</strong> or <strong>3. Chronic</strong> above to mention
                        and prescribe the Automated AI Transdermal Patch on the Rx sheet.
                      </p>
                    ) : aiPatchPrescribed ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">
                            Target Rate (mcg/hr)
                          </label>
                          <input
                            type="number"
                            min={30}
                            max={350}
                            value={rxPatchRate}
                            onChange={(e) => setRxPatchRate(Number(e.target.value))}
                            className="w-full h-9 rounded-[10px] clay-input px-2.5 text-xs font-mono-num font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">
                            Min Bound (mcg/hr)
                          </label>
                          <input
                            type="number"
                            min={20}
                            max={200}
                            value={rxPatchMin}
                            onChange={(e) => setRxPatchMin(Number(e.target.value))}
                            className="w-full h-9 rounded-[10px] clay-input px-2.5 text-xs font-mono-num font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">
                            Max Bound (mcg/hr)
                          </label>
                          <input
                            type="number"
                            min={60}
                            max={350}
                            value={rxPatchMax}
                            onChange={(e) => setRxPatchMax(Number(e.target.value))}
                            className="w-full h-9 rounded-[10px] clay-input px-2.5 text-xs font-mono-num font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">
                            Daily Cap (mcg)
                          </label>
                          <input
                            type="number"
                            min={400}
                            max={7200}
                            step={100}
                            value={rxPatchDailyLimit}
                            onChange={(e) => setRxPatchDailyLimit(Number(e.target.value))}
                            className="w-full h-9 rounded-[10px] clay-input px-2.5 text-xs font-mono-num font-semibold"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[11px] font-semibold mb-1">
                            AI Patch Wear Schedule
                          </label>
                          <input
                            type="text"
                            value={rxPatchSchedule}
                            onChange={(e) => setRxPatchSchedule(e.target.value)}
                            className="w-full h-9 rounded-[10px] clay-input px-2.5 text-xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[11px] font-semibold mb-1">
                            AI Patch Clinical Instruction
                          </label>
                          <input
                            type="text"
                            value={rxPatchNote}
                            onChange={(e) => setRxPatchNote(e.target.value)}
                            className="w-full h-9 rounded-[10px] clay-input px-2.5 text-xs"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-[#495847] dark:text-[#A8B7A4]">
                        AI Patch is currently held/optional on this {rxPhase} prescription. Click{' '}
                        <strong>Include AI Patch on Rx</strong> above to mention dose bounds and wear
                        schedule on the paper sheet.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Clinical Diagnosis / Note</label>
                    <input
                      type="text"
                      value={rxDiagnosis}
                      onChange={(e) => setRxDiagnosis(e.target.value)}
                      className="w-full h-10 rounded-[12px] clay-input px-3 text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Medicines &amp; Doses</span>
                      <button
                        type="button"
                        onClick={() =>
                          setRxMedicines((prev) => [
                            ...prev,
                            {
                              id: `med-${Date.now()}`,
                              medicineName: '',
                              dose: '',
                              timing: 'Once Daily',
                              duration: '14 days',
                            },
                          ])
                        }
                        className="clay-btn-secondary inline-flex items-center gap-1 px-3 py-1.5 rounded-[10px] text-xs font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Medicine</span>
                      </button>
                    </div>

                    {rxMedicines.map((med, idx) => (
                      <div key={med.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Medicine name"
                          value={med.medicineName}
                          onChange={(e) =>
                            setRxMedicines((prev) =>
                              prev.map((m, i) => (i === idx ? { ...m, medicineName: e.target.value } : m))
                            )
                          }
                          className="sm:col-span-4 h-10 rounded-[11px] clay-input px-3 text-xs font-semibold"
                        />
                        <input
                          type="text"
                          placeholder="Dose (e.g. 10 ml)"
                          value={med.dose}
                          onChange={(e) =>
                            setRxMedicines((prev) =>
                              prev.map((m, i) => (i === idx ? { ...m, dose: e.target.value } : m))
                            )
                          }
                          className="sm:col-span-3 h-10 rounded-[11px] clay-input px-3 text-xs font-semibold"
                        />
                        <input
                          type="text"
                          placeholder="Timing"
                          value={med.timing}
                          onChange={(e) =>
                            setRxMedicines((prev) =>
                              prev.map((m, i) => (i === idx ? { ...m, timing: e.target.value } : m))
                            )
                          }
                          className="sm:col-span-2 h-10 rounded-[11px] clay-input px-3 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Duration"
                          value={med.duration}
                          onChange={(e) =>
                            setRxMedicines((prev) =>
                              prev.map((m, i) => (i === idx ? { ...m, duration: e.target.value } : m))
                            )
                          }
                          className="sm:col-span-2 h-10 rounded-[11px] clay-input px-3 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setRxMedicines((prev) => prev.filter((_, i) => i !== idx))
                          }
                          aria-label="Remove medicine"
                          className="sm:col-span-1 h-10 rounded-[11px] clay-btn-secondary flex items-center justify-center text-[#B42318] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Signature Canvas + Stamp + Handwritten Paper Upload */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-[16px] clay-tile p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          <PenTool className="w-3.5 h-3.5 text-[#4E6B4B]" />
                          <span>Doctor Digital Signature Pad</span>
                        </span>
                        <button
                          type="button"
                          onClick={clearSignaturePad}
                          className="text-[11px] font-semibold text-[#4E6B4B] hover:underline cursor-pointer"
                        >
                          Clear Canvas
                        </button>
                      </div>
                      <canvas
                        ref={sigCanvasRef}
                        width={360}
                        height={96}
                        onPointerDown={handleSigPointerDown}
                        onPointerMove={handleSigPointerMove}
                        onPointerUp={handleSigPointerUp}
                        onPointerLeave={handleSigPointerUp}
                        className="w-full h-24 rounded-[12px] bg-white border border-[#789575]/30 touch-none cursor-crosshair"
                      />
                      <input
                        type="text"
                        value={signatureText}
                        onChange={(e) => setSignatureText(e.target.value)}
                        placeholder="Typed clinician signature fallback"
                        className="w-full h-9 rounded-[10px] clay-input px-3 text-xs font-serif italic"
                      />
                    </div>

                    <div className="rounded-[16px] clay-tile p-4 space-y-3">
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <Stamp className="w-3.5 h-3.5 text-[#4E6B4B]" />
                        <span>Clinic Stamp &amp; Paper Prescription Upload</span>
                      </div>
                      <input
                        type="text"
                        value={stampLabel}
                        onChange={(e) => setStampLabel(e.target.value)}
                        placeholder="Clinic Seal / Registration Stamp"
                        className="w-full h-9 rounded-[10px] clay-input px-3 text-xs font-semibold"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <label className="clay-btn-secondary h-10 px-3 rounded-[11px] text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer">
                          <Award className="w-3.5 h-3.5" />
                          <span>{stampDataUrl ? 'Change Stamp Image' : 'Upload Stamp Image'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'stamp')}
                            className="hidden"
                          />
                        </label>
                        <label className="clay-btn-secondary h-10 px-3 rounded-[11px] text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{paperRxName ? 'Replace Paper Rx' : 'Upload Paper Rx'}</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileUpload(e, 'paperRx')}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {paperRxName && (
                        <div className="text-[11px] text-[#344932] dark:text-[#A8C6A4] truncate">
                          Attached paper Rx: {paperRxName}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveDoctorRx}
                      className="clay-btn-primary inline-flex items-center gap-2 px-5 h-11 rounded-[14px] text-xs font-semibold cursor-pointer"
                    >
                      {rxSavedFlash ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Prescription Signed &amp; Saved</span>
                        </>
                      ) : (
                        <>
                          <PenTool className="w-4 h-4" />
                          <span>Sign, Stamp &amp; Publish Prescription</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 1C: Doctor Counselling Option */}
          {doctorSubTab === 'counselling' && (
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7 rounded-[26px] clay-card p-6 space-y-4">
                <div className="flex items-center gap-2.5">
                  <CalendarCheck className="w-5 h-5 text-[#4E6B4B]" />
                  <h3 className="font-display text-lg font-bold text-[#1B251A] dark:text-[#E5E8CE]">
                    {isHi ? 'डॉक्टर परामर्श सत्र बुक करें' : 'Schedule Doctor Counselling Session'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      {isHi ? 'परामर्श डॉक्टर चुनें' : 'Select Doctor / Psychologist'}
                    </label>
                    <select
                      value={counsellingDocId}
                      onChange={(e) => setCounsellingDocId(e.target.value)}
                      className="w-full h-11 rounded-[13px] clay-input px-3 text-xs font-semibold"
                    >
                      {COLLABORATED_DOCTORS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} · {d.specialty}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      {isHi ? 'सत्र का माध्यम' : 'Session Mode'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Video', 'Audio', 'In-Person'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setCounsellingMode(m)}
                          className={`h-11 rounded-[12px] text-xs font-semibold cursor-pointer ${
                            counsellingMode === m ? 'clay-btn-primary' : 'clay-btn-secondary'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    {isHi ? 'उपलब्ध समय स्लॉट' : 'Available Slot'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {COUNSELLING_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setCounsellingSlot(slot)}
                        className={`py-2.5 px-2.5 rounded-[12px] text-xs font-semibold cursor-pointer ${
                          counsellingSlot === slot ? 'clay-btn-primary' : 'clay-btn-secondary'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    {isHi ? 'मुख्य विषय / चिंता' : 'Session Focus / Concern'}
                  </label>
                  <input
                    type="text"
                    value={counsellingConcern}
                    onChange={(e) => setCounsellingConcern(e.target.value)}
                    placeholder={isHi ? 'उदा. नींद, परीक्षा तनाव या खुराक समीक्षा' : 'e.g. Sleep onset, exam strain, or dose review'}
                    className="w-full h-11 rounded-[13px] clay-input px-3.5 text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleBookCounselling}
                  className="clay-btn-primary inline-flex items-center gap-2 px-5 h-11 rounded-[14px] text-xs font-semibold cursor-pointer"
                >
                  {bookingFlash ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isHi ? 'परामर्श बुक हो गया' : 'Counselling Session Confirmed'}</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4" />
                      <span>{isHi ? 'परामर्श कन्फर्म करें' : 'Confirm Counselling Session'}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="lg:col-span-5 rounded-[26px] clay-card p-6 space-y-3.5">
                <h4 className="font-display text-base font-bold text-[#1B251A] dark:text-[#E5E8CE]">
                  {isHi ? 'आपके बुक किए गए सत्र' : 'Booked Counselling Sessions'}
                </h4>
                {(account.counsellingBookings || []).length === 0 ? (
                  <div className="rounded-[16px] clay-well p-4 text-xs text-[#495847] dark:text-[#A8B7A4]">
                    {isHi
                      ? 'अभी कोई परामर्श सत्र बुक नहीं है। बाईं ओर से डॉक्टर और समय चुनें।'
                      : 'No sessions booked yet. Pick a doctor and slot on the left to schedule.'}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {(account.counsellingBookings || []).map((b) => (
                      <div key={b.id} className="rounded-[16px] clay-tile p-3.5 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#1B251A] dark:text-[#E5E8CE]">
                            {b.doctorName}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-[7px] clay-btn-primary">
                            {b.mode}
                          </span>
                        </div>
                        <div className="text-xs text-[#344932] dark:text-[#A8C6A4] font-semibold">
                          {b.slotLabel}
                        </div>
                        <div className="text-[11px] text-[#495847] dark:text-[#A8B7A4]">{b.concern}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

        </div>
      )}

      {/* =====================================================================
          PART 2: PRESCRIBED MEDICATION SECTION (1. ACUTE | 2. INTERMEDIATE | 3. CHRONIC)
         ===================================================================== */}
      {activeSection === 'medication' && (
        <div className="space-y-6">
          {/* Doctor-Only Condition Selection Guard Banner */}
          <div className="rounded-[20px] clay-card-tint px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-2.5">
              <span
                className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${
                  doctorAuthorized
                    ? 'bg-[#344932] text-white'
                    : 'bg-[#E5ECD7] dark:bg-[#233623] text-[#344932] dark:text-[#A8C6A4]'
                }`}
              >
                {doctorAuthorized ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </span>
              <div>
                <div className="text-xs font-bold text-[#1B251A] dark:text-[#E5E8CE]">
                  {doctorAuthorized
                    ? isHi
                      ? 'डॉक्टर मोड सक्रिय: आप Acute, Intermediate या Chronic स्थिति बदल सकते हैं'
                      : 'Doctor Mode Active — Condition Selection Unlocked'
                    : isHi
                      ? 'स्थिति चयन केवल डॉक्टर द्वारा (पासवर्ड आवश्यक)'
                      : 'Condition Selection Restricted to Doctor Only'}
                </div>
                <div className="text-[11px] text-[#495847] dark:text-[#A8B7A4]">
                  {doctorAuthorized
                    ? isHi
                      ? 'नीचे से मरीज़ की वर्तमान उपचार स्थिति चुनें।'
                      : 'Select the patient condition below (Acute, Intermediate, or Chronic).'
                    : isHi
                      ? 'केवल अधिकृत डॉक्टर ही Acute, Intermediate या Chronic के बीच बदलाव कर सकते हैं।'
                      : 'Only an authorized Doctor can select or change Acute, Intermediate, or Chronic.'}
                </div>
              </div>
            </div>
            {!doctorAuthorized && (
              <button
                type="button"
                onClick={() => {
                  setShowDoctorLogin(true)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="clay-btn-primary px-3.5 py-2 rounded-[12px] text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{isHi ? 'डॉक्टर पासवर्ड दर्ज करें' : 'Doctor Login to Change'}</span>
              </button>
            )}
          </div>

          {/* 3-Protocol Tabs (Doctor-Only Condition Selection) */}
          <div
            role="tablist"
            aria-label="Three treatment protocols"
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-2 rounded-[22px] clay-card"
          >
            {[
              {
                id: 'acute' as TreatmentPhase,
                title: isHi ? '1. तीव्र (Acute)' : '1. Acute',
                sub: isHi ? 'केवल ओरल सिरप' : 'Oral Syrup Only',
                icon: Droplets,
              },
              {
                id: 'intermediate' as TreatmentPhase,
                title: isHi ? '2. मध्यम (Intermediate)' : '2. Intermediate',
                sub: isHi ? 'सिरप + स्वचालित AI पैच' : 'Syrup + Automated AI Patch',
                icon: Activity,
              },
              {
                id: 'chronic' as TreatmentPhase,
                title: isHi ? '3. दीर्घकालिक (Chronic)' : '3. Chronic',
                sub: isHi ? 'दीर्घकालिक सिरप + AI पैच' : 'Long-Term Syrup + AI Patch',
                icon: ShieldCheck,
              },
            ].map((item) => {
              const Icon = item.icon
              const active = phase === item.id
              const lockedForPatient = !doctorAuthorized && !active
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    if (active) return
                    if (!doctorAuthorized) {
                      setShowDoctorLogin(true)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                      return
                    }
                    onSelectPhase(item.id)
                  }}
                  className={`text-left rounded-[16px] p-4 transition-all flex items-center justify-between gap-3 ${
                    active
                      ? 'clay-btn-primary cursor-default'
                      : lockedForPatient
                        ? 'clay-tile opacity-80 hover:opacity-100 text-[#1B251A] dark:text-[#E5E8CE] cursor-pointer'
                        : 'clay-tile text-[#1B251A] dark:text-[#E5E8CE] cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-10 h-10 rounded-[13px] flex items-center justify-center shrink-0 ${
                        active
                          ? 'bg-white/25 text-white'
                          : 'bg-[#E5ECD7] dark:bg-[#233623] text-[#344932] dark:text-[#A8C6A4]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate">{item.title}</div>
                      <div
                        className={`text-xs truncate ${
                          active ? 'text-white/85' : 'text-[#495847] dark:text-[#A8B7A4]'
                        }`}
                      >
                        {item.sub}
                      </div>
                    </div>
                  </div>
                  {lockedForPatient && (
                    <span
                      title="Doctor password required to change condition"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] bg-[#E5ECD7] dark:bg-[#233623] text-[10px] font-bold text-[#344932] dark:text-[#A8C6A4] shrink-0"
                    >
                      <Lock className="w-3 h-3" />
                      <span>{isHi ? 'डॉक्टर' : 'Doctor'}</span>
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Oral Syrup Protocol Card (Present in Acute, Intermediate, Chronic) */}
          <section className="rounded-[28px] clay-card p-6 sm:p-7 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[13px] clay-btn-primary flex items-center justify-center shrink-0">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1B251A] dark:text-[#E5E8CE]">
                    {phase === 'acute'
                      ? isHi
                        ? 'तीव्र प्रोटोकॉल · ओरल सिरप'
                        : '1. Acute Protocol · Oral Syrup'
                      : phase === 'intermediate'
                        ? isHi
                          ? 'मध्यम प्रोटोकॉल · ओरल सिरप'
                          : '2. Intermediate Protocol · Oral Syrup'
                        : isHi
                          ? 'दीर्घकालिक प्रोटोकॉल · ओरल सिरप'
                          : '3. Chronic Protocol · Oral Syrup'}
                  </h3>
                  <p className="text-xs text-[#495847] dark:text-[#A8B7A4]">
                    {activeSyrupRx.prescribedBy} · {activeSyrupRx.frequency}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onToggleTonicSlot('Morning 10ml')}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-xs font-semibold cursor-pointer ${
                    morningTaken ? 'clay-btn-primary' : 'clay-btn-secondary'
                  }`}
                >
                  {morningTaken && <Check className="w-3.5 h-3.5" />}
                  <span>Morning {activeSyrupRx.morningDoseMl} ml</span>
                </button>
                <button
                  type="button"
                  onClick={() => onToggleTonicSlot('Evening 10ml')}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-xs font-semibold cursor-pointer ${
                    eveningTaken ? 'clay-btn-primary' : 'clay-btn-secondary'
                  }`}
                >
                  {eveningTaken && <Check className="w-3.5 h-3.5" />}
                  <span>Evening {activeSyrupRx.eveningDoseMl} ml</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="rounded-[18px] clay-tile p-3.5">
                <span className="text-[11px] font-medium text-[#495847] dark:text-[#A8B7A4] block">
                  Morning Dose
                </span>
                <span className="text-xl font-bold font-mono-num mt-0.5 block">
                  {activeSyrupRx.morningDoseMl} ml
                </span>
              </div>
              <div className="rounded-[18px] clay-tile p-3.5">
                <span className="text-[11px] font-medium text-[#495847] dark:text-[#A8B7A4] block">
                  Evening Dose
                </span>
                <span className="text-xl font-bold font-mono-num mt-0.5 block">
                  {activeSyrupRx.eveningDoseMl} ml
                </span>
              </div>
              <div className="rounded-[18px] clay-tile p-3.5">
                <span className="text-[11px] font-medium text-[#495847] dark:text-[#A8B7A4] block">
                  Duration
                </span>
                <span className="text-xl font-bold font-mono-num mt-0.5 block">
                  {activeSyrupRx.durationDays} days
                </span>
              </div>
              <div className="rounded-[18px] clay-tile p-3.5">
                <span className="text-[11px] font-medium text-[#495847] dark:text-[#A8B7A4] block">
                  24h Cap
                </span>
                <span className="text-xl font-bold font-mono-num mt-0.5 block">
                  {activeSyrupRx.morningDoseMl + activeSyrupRx.eveningDoseMl}/{activeSyrupRx.maxDailyMl} ml
                </span>
              </div>
            </div>

            {/* Oral Syrup Reminder Alarm */}
            <div className="rounded-[22px] clay-well p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-10 h-10 rounded-[13px] clay-btn-primary flex items-center justify-center shrink-0">
                    <AlarmClock className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#1B251A] dark:text-[#E5E8CE] flex flex-wrap items-center gap-2">
                      <span>{isHi ? 'ओरल सिरप रिमाइंडर अलार्म' : 'Oral Syrup Reminder Alarm'}</span>
                      {!doctorAuthorized && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] clay-tile text-[#344932] dark:text-[#A8C6A4]">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Doctor-Editable Only</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#495847] dark:text-[#A8B7A4] mt-0.5">
                      {nextDoseInfo && syrupReminderOn
                        ? `Next alarm: ${nextDoseInfo.slot.label} at ${formatTime12h(nextDoseInfo.slot.timeHHMM)} (${formatCountdown(nextDoseInfo.minutesUntil, isHi)})`
                        : 'Alarm rings at the exact time prescribed by your doctor.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleSyrupReminder(phase, !syrupReminderOn)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[13px] text-xs font-semibold cursor-pointer ${
                    syrupReminderOn ? 'clay-btn-primary' : 'clay-btn-secondary'
                  }`}
                >
                  {syrupReminderOn ? <BellRing className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                  <span>{syrupReminderOn ? 'Alarm On' : 'Muted'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {scheduledSlots.map((slot) => (
                  <div key={slot.id} className="rounded-[16px] clay-tile p-3.5 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-[#1B251A] dark:text-[#E5E8CE] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#4E6B4B]" />
                        <span>{isHi ? slot.labelHi : slot.label}</span>
                      </div>
                      <div className="font-mono-num text-lg font-bold mt-1">
                        {formatTime12h(slot.timeHHMM)}
                      </div>
                    </div>
                    <span className="text-xs font-mono-num font-bold text-[#344932] dark:text-[#A8C6A4]">
                      {slot.doseMl} ml
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2.5">
                {notifPermission !== 'granted' && notifPermission !== 'unsupported' ? (
                  <button
                    type="button"
                    onClick={async () => {
                      const perm = await requestBrowserNotificationPermission()
                      setNotifPermission(perm)
                    }}
                    className="clay-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[11px] text-xs font-semibold cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Enable Browser Notifications</span>
                  </button>
                ) : (
                  <span className="text-[11px] font-semibold text-[#344932] dark:text-[#A8C6A4]">
                    Alarm Notification Ready
                  </span>
                )}

                {scheduledSlots[0] && (
                  <button
                    type="button"
                    onClick={() => {
                      playSyrupAlarmChime()
                      onTriggerTestAlarm(
                        nextDoseInfo?.slot || scheduledSlots[0],
                        phase,
                        activeSyrupRx.prescribedBy
                      )
                    }}
                    className="clay-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[11px] text-xs font-semibold cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Test Alarm</span>
                  </button>
                )}
              </div>
            </div>

            {/* Doctor-Only Syrup Dose & Alarm Editor */}
            {doctorAuthorized ? (
              <div className="rounded-[22px] clay-card-tint p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#1B251A] dark:text-[#E5E8CE]">
                  <Stethoscope className="w-4 h-4 text-[#4E6B4B]" />
                  <span>Doctor-Only · Edit Syrup Dose &amp; Alarm Times ({phase.toUpperCase()})</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold mb-1">Prescribing Doctor</label>
                    <input
                      type="text"
                      value={syrupDoctor}
                      onChange={(e) => setSyrupDoctor(e.target.value)}
                      className="w-full h-10 rounded-[12px] clay-input px-3 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1">Morning Dose (ml)</label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      step={0.5}
                      value={syrupMorningMl}
                      onChange={(e) => setSyrupMorningMl(parseFloat(e.target.value) || 0)}
                      className="w-full h-10 rounded-[12px] clay-input px-3 text-xs font-mono-num font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1">Evening Dose (ml)</label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      step={0.5}
                      value={syrupEveningMl}
                      onChange={(e) => setSyrupEveningMl(parseFloat(e.target.value) || 0)}
                      className="w-full h-10 rounded-[12px] clay-input px-3 text-xs font-mono-num font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1">Frequency</label>
                    <select
                      value={syrupFreq}
                      onChange={(e) => setSyrupFreq(e.target.value as SyrupPrescription['frequency'])}
                      className="w-full h-10 rounded-[12px] clay-input px-3 text-xs font-semibold"
                    >
                      {FREQUENCIES.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold mb-1">Morning Alarm</label>
                    <input
                      type="time"
                      value={syrupMorningTime}
                      onChange={(e) => setSyrupMorningTime(e.target.value)}
                      className="w-full h-10 rounded-[12px] clay-input px-3 text-xs font-mono-num font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1">Midday Alarm (TID)</label>
                    <input
                      type="time"
                      value={syrupMiddayTime}
                      onChange={(e) => setSyrupMiddayTime(e.target.value)}
                      className="w-full h-10 rounded-[12px] clay-input px-3 text-xs font-mono-num font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1">Evening Alarm</label>
                    <input
                      type="time"
                      value={syrupEveningTime}
                      onChange={(e) => setSyrupEveningTime(e.target.value)}
                      className="w-full h-10 rounded-[12px] clay-input px-3 text-xs font-mono-num font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1">Course Days / 24h Cap</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        max={180}
                        value={syrupDays}
                        onChange={(e) => setSyrupDays(parseInt(e.target.value, 10) || 7)}
                        className="w-1/2 h-10 rounded-[12px] clay-input px-2 text-center text-xs font-mono-num font-bold"
                      />
                      <input
                        type="number"
                        min={10}
                        max={90}
                        value={syrupMaxMl}
                        onChange={(e) => setSyrupMaxMl(parseInt(e.target.value, 10) || 30)}
                        className="w-1/2 h-10 rounded-[12px] clay-input px-2 text-center text-xs font-mono-num font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <input
                    type="text"
                    value={syrupNote}
                    onChange={(e) => setSyrupNote(e.target.value)}
                    placeholder="Doctor order instruction"
                    className="flex-1 min-w-[220px] h-10 rounded-[12px] clay-input px-3 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleSaveSyrupOrder}
                    className="clay-btn-primary inline-flex items-center gap-2 px-5 h-10 rounded-[13px] text-xs font-semibold cursor-pointer"
                  >
                    {syrupSavedFlash ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <>
                        <Stethoscope className="w-4 h-4" />
                        <span>Save Doctor Syrup Order</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-[16px] clay-well p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-[#495847] dark:text-[#A8B7A4]">
                  <Lock className="w-4 h-4 text-[#4E6B4B]" />
                  <span>
                    {isHi
                      ? 'खुराक और अलार्म समय केवल डॉक्टर पासवर्ड से संपादित किए जा सकते हैं।'
                      : 'Dose & Alarm times are editable by Doctors only (Password Protected).'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDoctorLogin(true)}
                  className="clay-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[11px] text-xs font-semibold cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Doctor Unlock</span>
                </button>
              </div>
            )}
          </section>

          {/* Automated AI Patch System (Shown in 2. Intermediate and 3. Chronic) */}
          {(phase === 'intermediate' || phase === 'chronic') && (
            <section className="rounded-[28px] clay-card p-6 sm:p-7 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[13px] clay-btn-forest flex items-center justify-center shrink-0">
                    <Cpu className="w-5 h-5 text-[#A8C6A4]" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#1B251A] dark:text-[#E5E8CE]">
                      {phase === 'intermediate'
                        ? '2. Intermediate · Automated AI Patch System'
                        : '3. Chronic · Long-Term Automated AI Patch System'}
                    </h3>
                    <p className="text-xs text-[#495847] dark:text-[#A8B7A4]">
                      {patch.prescribedBy} · {effectiveFloor}–{effectiveHourlyCap} mcg/hr MD-regulated window
                    </p>
                  </div>
                </div>

                <span className="text-xs font-semibold text-[#344932] dark:text-[#A8C6A4]">
                  {doctorAuthorized ? 'Doctor Dose Edit Unlocked' : 'Dose Editable by Doctors Only'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="rounded-[18px] clay-tile p-3.5">
                  <span className="text-[11px] text-[#495847] dark:text-[#A8B7A4] block">Mode</span>
                  <span className="text-sm font-bold mt-0.5 block">
                    {patch.doseLockedByDoctor
                      ? 'MD Hard-Locked'
                      : patch.autoOptimize
                        ? 'Automated AI Active'
                        : 'Doctor Regulated'}
                  </span>
                </div>
                <div className="rounded-[18px] clay-tile p-3.5">
                  <span className="text-[11px] text-[#495847] dark:text-[#A8B7A4] block">Infusion Rate</span>
                  <span className="text-xl font-bold font-mono-num">{patch.infusionRateMcgHr} mcg/hr</span>
                </div>
                <div className="rounded-[18px] clay-tile p-3.5">
                  <span className="text-[11px] text-[#495847] dark:text-[#A8B7A4] block">MD Bounds</span>
                  <span className="text-lg font-bold font-mono-num">
                    {effectiveFloor}–{effectiveHourlyCap}
                  </span>
                </div>
                <div className="rounded-[18px] clay-tile p-3.5">
                  <span className="text-[11px] text-[#495847] dark:text-[#A8B7A4] block">24h Projected</span>
                  <span className="text-lg font-bold font-mono-num">
                    {projected24hMcg}/{patch.dailyDoseLimitMcg}
                  </span>
                </div>
              </div>

              {/* Phase Color-Coded Automated AI Dose Release Meter */}
              <div className={`rounded-[18px] border p-3.5 space-y-2 ${phaseStatusTheme.container}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 font-bold">
                    <span className={`px-2 py-0.5 rounded-[7px] text-[10px] uppercase tracking-wider ${phaseStatusTheme.badge}`}>
                      {phaseStatusTheme.phaseLabel}
                    </span>
                    <span>
                      {isHi ? 'लाइव खुराक रिलीज़ स्तर:' : 'Live Dose Release Level:'} {patchDoseLevelLabel}
                    </span>
                  </div>
                  <span className={`font-mono-num font-bold ${phaseStatusTheme.accentText}`}>
                    {patch.infusionRateMcgHr} mcg/hr ({patchRawWindowPct}%)
                  </span>
                </div>
                <div className={`h-3 w-full rounded-[8px] overflow-hidden ${phaseStatusTheme.track}`}>
                  <div
                    style={{ width: `${patchReleaseBarPct}%` }}
                    className={`h-full rounded-[8px] transition-all duration-500 ${phaseStatusTheme.fill}`}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono-num opacity-80">
                  <span>Min Floor: {effectiveFloor} mcg/hr</span>
                  <span>Reservoir: {patch.reservoirPercent}%</span>
                  <span>Max Ceiling: {effectiveHourlyCap} mcg/hr</span>
                </div>
              </div>

              {/* AI Transdermal Patch Controller Connection & 3D Dose Release Hardware */}
              <PatchController3DWidget
                patch={patch}
                language={language}
                effectiveFloor={effectiveFloor}
                effectiveHourlyCap={effectiveHourlyCap}
                doctorAuthorized={doctorAuthorized}
                onUpdatePatch={onUpdatePatch}
                onRunAiRelease={() => evaluateAgentCycle('live')}
              />

              <div className="rounded-[22px] clay-card-forest p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-[#A8C6A4]" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#A8C6A4]">
                      Automated AI Closed-Loop Control
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
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold disabled:opacity-75 ${
                      doctorAuthorized && !patch.doseLockedByDoctor ? 'cursor-pointer' : 'cursor-not-allowed'
                    } ${
                      patch.doseLockedByDoctor
                        ? 'clay-btn-danger'
                        : patch.autoOptimize
                          ? 'clay-btn-primary'
                          : 'bg-white/10 text-white'
                    }`}
                  >
                    {patch.doseLockedByDoctor
                      ? 'Locked by Doctor'
                      : patch.autoOptimize
                        ? 'Automated AI: ON'
                        : 'Automated AI: PAUSED'}
                  </button>
                </div>

                <div className="rounded-[14px] bg-black/25 p-3.5 text-xs leading-relaxed text-[#E5E8CE]">
                  {patch.agentReasoning || 'Evaluating live telemetry within doctor-prescribed limits.'}
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => evaluateAgentCycle('live')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] text-xs font-semibold cursor-pointer ${
                      simScenario === 'live' ? 'clay-btn-primary' : 'bg-white/12 text-white'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run Live Signal Check</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => evaluateAgentCycle('stress')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] text-xs font-semibold cursor-pointer ${
                      simScenario === 'stress' ? 'clay-btn-terracotta' : 'bg-white/12 text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Simulate Stress</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => evaluateAgentCycle('recovery')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] text-xs font-semibold cursor-pointer ${
                      simScenario === 'recovery' ? 'clay-btn-secondary' : 'bg-white/12 text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Simulate Calm</span>
                  </button>
                </div>
              </div>

              {/* Doctor-Only Patch Dose Editor */}
              {doctorAuthorized ? (
                <div className="rounded-[22px] clay-card-tint p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-bold flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-[#4E6B4B]" />
                      <span>Doctor-Only · Automated AI Patch Dose Editor</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setDraftLocked((v) => !v)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                        draftLocked ? 'clay-btn-danger' : 'clay-btn-secondary'
                      }`}
                    >
                      {draftLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      <span>{draftLocked ? 'MD Dose Hard-Locked' : 'AI Bounded Mode'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setDraftRate((r) => Math.max(draftMin, r - 5))}
                      className="clay-btn-secondary w-10 h-10 rounded-[12px] flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min={30}
                      max={220}
                      step={5}
                      value={draftRate}
                      onChange={(e) => setDraftRate(parseInt(e.target.value, 10) || 100)}
                      className="flex-1 h-10 rounded-[12px] clay-input text-center text-base font-bold font-mono-num"
                    />
                    <button
                      type="button"
                      onClick={() => setDraftRate((r) => Math.min(draftMax, r + 5))}
                      className="clay-btn-secondary w-10 h-10 rounded-[12px] flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">Min Floor (mcg/hr)</label>
                      <input
                        type="number"
                        value={draftMin}
                        onChange={(e) => setDraftMin(parseInt(e.target.value, 10) || 60)}
                        className="w-full h-10 rounded-[12px] clay-input px-3 text-xs font-mono-num font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">Max Ceiling (mcg/hr)</label>
                      <input
                        type="number"
                        value={draftMax}
                        onChange={(e) => setDraftMax(parseInt(e.target.value, 10) || 180)}
                        className="w-full h-10 rounded-[12px] clay-input px-3 text-xs font-mono-num font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">24h Cap (mcg)</label>
                      <input
                        type="number"
                        value={draftDailyLimit}
                        onChange={(e) => setDraftDailyLimit(parseInt(e.target.value, 10) || 3600)}
                        className="w-full h-10 rounded-[12px] clay-input px-3 text-xs font-mono-num font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <input
                      type="text"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      placeholder="Prescribing Doctor"
                      className="flex-1 min-w-[200px] h-10 rounded-[12px] clay-input px-3 text-xs font-semibold"
                    />
                    <button
                      type="button"
                      onClick={handleApplyDoctorPatchOrder}
                      className="clay-btn-primary inline-flex items-center gap-2 px-5 h-10 rounded-[13px] text-xs font-semibold cursor-pointer"
                    >
                      {orderSavedFlash ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Patch Order Applied</span>
                        </>
                      ) : (
                        <>
                          <Stethoscope className="w-4 h-4" />
                          <span>Save Patch Order</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-[16px] clay-well p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-[#495847] dark:text-[#A8B7A4]">
                    <Lock className="w-4 h-4 text-[#4E6B4B]" />
                    <span>Patch infusion rate and limits are editable by Doctors only.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDoctorLogin(true)}
                    className="clay-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[11px] text-xs font-semibold cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Doctor Unlock</span>
                  </button>
                </div>
              )}

              {/* 24h Plasma Stability Chart */}
              <div className="rounded-[20px] clay-well p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold mb-2">
                  <span>24-Hour Steady Delivery Curve ({activeDisplayRate} mcg/hr)</span>
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-1.5 text-[#344932] dark:text-[#A8C6A4]">
                      <span className="w-3 h-1 rounded-full bg-[#4E6B4B] inline-block" /> AI Patch Plateau
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[#D86A60]">
                      <span className="w-3 h-1 rounded-full bg-[#D86A60] inline-block" /> Oral Fluctuation
                    </span>
                  </div>
                </div>

                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32 overflow-visible">
                  <polyline
                    fill="none"
                    stroke="#D86A60"
                    strokeOpacity="0.7"
                    strokeWidth="2.2"
                    strokeDasharray="4 4"
                    points={toPoints(oralCurve)}
                  />
                  <polyline
                    fill="none"
                    stroke="#4E6B4B"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={toPoints(transdermalCurve)}
                  />
                </svg>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
