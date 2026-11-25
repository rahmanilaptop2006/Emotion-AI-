import { useEffect, useRef, useState } from 'react'
import {
  AlarmClock,
  BarChart3,
  Bot,
  Check,
  Clock,
  Compass,
  Cpu,
  Globe,
  HeartPulse,
  Home,
  LogOut,
  Moon,
  ShieldAlert,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react'
import { AuthScreen, type RegistrationProfileMeta } from './components/AuthScreen'
import { SectionDock } from './components/SectionDock'
import { Hero } from './components/Hero'
import { Header } from './components/Header'
import { BrandLogo } from './components/BrandLogo'
import { HomeTab } from './components/HomeTab'
import { ExploreTab, type ExploreSection } from './components/ExploreTab'
import { TreatmentTab } from './components/TreatmentTab'
import { ReportTab } from './components/ReportTab'
import { PharmaSafeTab } from './components/PharmaSafeTab'
import { MentalCheckModal, type CheckModalStartStep } from './components/MentalCheckModal'
import { BreathingModal } from './components/BreathingModal'
import { GuidedTherapyModal, type GuidedTherapyMode } from './components/GuidedTherapyModal'
import { TypingTestModal } from './components/TypingTestModal'
import { VoiceBiomarkerModal } from './components/VoiceBiomarkerModal'
import { TransdermalPatchModal } from './components/TransdermalPatchModal'
import { PatientChatbotModal } from './components/PatientChatbotModal'
import { SafetyGuardianModal } from './components/SafetyGuardianModal'
import { ProfileModal } from './components/ProfileModal'
import { AccountSwitcherModal } from './components/AccountSwitcherModal'
import { logoutCustomAuth, setCustomAuthSession } from './services/customAuth'
import {
  addCounsellingBooking,
  addDoctorQuestion,
  addLowMoodPlanItem,
  addMindGymSession,
  addMindfulnessHabit,
  addSideEffectEntry,
  addSleepLogEntry,
  addTriggerDetectiveEntry,
  deleteMindfulnessHabit,
  ensureAuthenticatedAccount,
  loadAppState,
  recordFullAssessment,
  recordPatientExploration,
  removeWearableConnection,
  resetAppState,
  saveAppState,
  saveDoctorPrescription,
  saveLowMoodReflection,
  savePrivacyConsent,
  saveRelaxationProfile,
  setHasWearable,
  setTreatmentPhase,
  toggleLowMoodPlanItem,
  toggleMindfulnessHabit,
  togglePharmaSafeMedicationToday,
  toggleSyrupReminderEnabled,
  toggleTonicSlot,
  updateAccount,
  updateEmotionDna,
  updatePatchState,
  updatePrivacySettings,
  updateSyrupPrescription,
  upsertWearableConnection,
  type AppPersistedState,
} from './services/storage'
import {
  formatTime12h,
  getScheduledDoseSlots,
  playSyrupAlarmChime,
  sendBrowserDoseNotification,
  type ScheduledDoseSlot,
} from './services/syrupAlarm'
import type { AccountId, AuthenticatedSession, TabId, TreatmentPhase } from './types'

type ActiveModal =
  | null
  | 'check'
  | 'breathing'
  | 'guided'
  | 'typing'
  | 'voice'
  | 'patch'
  | 'patch-doctor'
  | 'chat'
  | 'safety'
  | 'profile'
  | 'accounts'

export default function App() {
  const [appState, setAppState] = useState<AppPersistedState>(() => loadAppState())
  const [activeTab, setActiveTab] = useState<TabId>('home')
  const [exploreSection, setExploreSection] = useState<ExploreSection>('emotion_dna')
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)
  const [checkInitialStep, setCheckInitialStep] = useState<CheckModalStartStep | undefined>(undefined)
  const [guidedTherapyMode, setGuidedTherapyMode] = useState<GuidedTherapyMode | null>(null)
  const [authSession, setAuthSession] = useState<AuthenticatedSession | null>(null)
  const [doctorAuthorized, setDoctorAuthorized] = useState(false)
  const [activeSyrupAlarm, setActiveSyrupAlarm] = useState<{
    slot: ScheduledDoseSlot
    phase: TreatmentPhase
    prescribedBy: string
    isTest?: boolean
  } | null>(null)
  const firedAlarmKeysRef = useRef<Set<string>>(new Set())
  const snoozedAlarmsRef = useRef<Record<string, number>>({})

  const account = appState.accounts[appState.activeAccountId] || Object.values(appState.accounts)[0]

  useEffect(() => {
    const root = document.documentElement
    if (appState.theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    saveAppState(appState)
  }, [appState])

  useEffect(() => {
    if (!activeModal) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModal(null)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [activeModal])

  // Global Oral Syrup Reminder Alarm Scheduler (checks doctor-prescribed times)
  useEffect(() => {
    if (!authSession || !account) return

    const checkSchedule = () => {
      const phase: TreatmentPhase = account.treatmentPhase || 'acute'
      const rx =
        phase === 'acute'
          ? account.acuteSyrupRx
          : phase === 'intermediate'
            ? account.intermediateSyrupRx
            : account.chronicSyrupRx
      if (!rx || rx.reminderEnabled === false) return

      const now = new Date()
      const dateStr = now.toISOString().slice(0, 10)
      const hh = String(now.getHours()).padStart(2, '0')
      const mm = String(now.getMinutes()).padStart(2, '0')
      const nowHHMM = `${hh}:${mm}`
      const nowMs = now.getTime()

      const slots = getScheduledDoseSlots(rx)
      for (const slot of slots) {
        const snoozeTime = snoozedAlarmsRef.current[slot.id]
        const snoozeDue = typeof snoozeTime === 'number' && nowMs >= snoozeTime
        const minuteMatch = slot.timeHHMM === nowHHMM
        const fireKey = `${account.id}-${phase}-${dateStr}-${slot.id}-${slot.timeHHMM}`

        const alreadyTaken =
          slot.id !== 'midday' &&
          account.tonicLogs.some(
            (log) => log.date === dateStr && log.slot === slot.tonicSlot && log.taken
          )

        if (snoozeDue) {
          delete snoozedAlarmsRef.current[slot.id]
          if (!alreadyTaken) {
            setActiveSyrupAlarm({ slot, phase, prescribedBy: rx.prescribedBy })
            playSyrupAlarmChime()
            sendBrowserDoseNotification(
              appState.language === 'hi'
                ? `सिरप खुराक अलार्म · ${slot.labelHi}`
                : `Oral Syrup Alarm · ${slot.label}`,
              appState.language === 'hi'
                ? `${slot.doseMl} ml खुराक लेने का समय (${rx.prescribedBy})`
                : `Time to take ${slot.doseMl} ml oral syrup (Prescribed by ${rx.prescribedBy})`
            )
            break
          }
        } else if (minuteMatch && !firedAlarmKeysRef.current.has(fireKey)) {
          firedAlarmKeysRef.current.add(fireKey)
          if (!alreadyTaken) {
            setActiveSyrupAlarm({ slot, phase, prescribedBy: rx.prescribedBy })
            playSyrupAlarmChime()
            sendBrowserDoseNotification(
              appState.language === 'hi'
                ? `सिरप खुराक अलार्म · ${slot.labelHi}`
                : `Oral Syrup Alarm · ${slot.label}`,
              appState.language === 'hi'
                ? `${slot.doseMl} ml खुराक लेने का समय (${formatTime12h(slot.timeHHMM)} · ${rx.prescribedBy})`
                : `Time for your ${formatTime12h(slot.timeHHMM)} oral syrup (${slot.doseMl} ml · ${rx.prescribedBy})`
            )
            break
          }
        }
      }
    }

    checkSchedule()
    const timer = window.setInterval(checkSchedule, 10000)
    return () => window.clearInterval(timer)
  }, [authSession, account, appState.language])

  // Repeat alarm chime gently up to 2 extra times while alarm banner stays open
  useEffect(() => {
    if (!activeSyrupAlarm) return
    let repeats = 0
    const ringInterval = window.setInterval(() => {
      repeats += 1
      if (repeats >= 3) {
        window.clearInterval(ringInterval)
        return
      }
      playSyrupAlarmChime()
    }, 9000)
    return () => window.clearInterval(ringInterval)
  }, [activeSyrupAlarm])

  const scrollToWorkspace = (tab?: TabId) => {
    if (tab) setActiveTab(tab)
    const el = document.getElementById('workspace')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToWearables = () => {
    setActiveTab('home')
    window.setTimeout(() => {
      const target = document.getElementById('wearables-section') || document.getElementById('workspace')
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }

  const handleToggleLanguage = () => {
    setAppState((prev) => ({ ...prev, language: prev.language === 'en' ? 'hi' : 'en' }))
  }

  const handleToggleTheme = () => {
    setAppState((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }))
  }

  const handleSelectAccount = (id: AccountId) => {
    setAppState((prev) => ({ ...prev, activeAccountId: id }))
  }

  const handleSignOut = async () => {
    setActiveModal(null)
    setDoctorAuthorized(false)
    setAuthSession(null)
    await logoutCustomAuth()
  }

  const handleAuthSuccess = (session: AuthenticatedSession, meta?: RegistrationProfileMeta) => {
    setAppState((prev) =>
      ensureAuthenticatedAccount(prev, {
        uid: session.uid,
        name: meta?.fullName || session.displayName,
        email: session.email,
        role: meta?.role || session.role,
        institution: meta?.institution || session.institution,
      })
    )
    setCustomAuthSession(session)
    setAuthSession(session)
  }

  const openAssessment = (step?: CheckModalStartStep) => {
    setCheckInitialStep(step)
    setActiveModal('check')
  }

  const openBreathing = (sourceLabel = 'Breathing Exercise') => {
    setAppState((prev) =>
      recordPatientExploration(prev, prev.activeAccountId, 'breathing', sourceLabel)
    )
    setActiveModal('breathing')
  }

  const openGuidedTherapy = (mode: GuidedTherapyMode) => {
    setAppState((prev) =>
      recordPatientExploration(prev, prev.activeAccountId, 'guided', mode)
    )
    setGuidedTherapyMode(mode)
    setActiveModal('guided')
  }

  const handleChatbotAction = (actionType: 'breathing' | 'sound' | 'tonic' | 'grounding' | 'sos') => {
    setActiveModal(null)
    if (actionType === 'breathing') openBreathing('Emotion AI')
    else if (actionType === 'sound') {
      setExploreSection('sound_therapy')
      scrollToWorkspace('explore')
    } else if (actionType === 'tonic') scrollToWorkspace('treatment')
    else if (actionType === 'grounding' || actionType === 'sos') {
      if (actionType === 'grounding') {
        setAppState((prev) =>
          recordPatientExploration(prev, prev.activeAccountId, 'grounding', 'SOS Grounding')
        )
      }
      setActiveModal('safety')
    }
  }

  const railNavItems: { id: TabId; label: string; icon: typeof Home }[] = [
    { id: 'home', label: 'Overview', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'treatment', label: 'Treatment', icon: HeartPulse },
    { id: 'report', label: 'Report', icon: BarChart3 },
    { id: 'pharmasafe', label: 'EmotionMed', icon: ShieldCheck },
  ]

  if (!authSession) {
    return (
      <AuthScreen
        language={appState.language}
        theme={appState.theme}
        onToggleLanguage={handleToggleLanguage}
        onToggleTheme={handleToggleTheme}
        onAuthSuccess={handleAuthSuccess}
      />
    )
  }

  return (
    <div className="w-full min-h-screen bg-[#E7ECD9] dark:bg-[#0E150E] text-[#1B251A] dark:text-[#E5E8CE] transition-colors">
      {/* Persistent Top-Left Corner Vertical Floating Controls (Language & Logout, Visible Across All Pages) */}
      <div
        aria-label={appState.language === 'hi' ? 'बाईं ओर फ्लोटिंग नियंत्रण' : 'Left floating controls'}
        className="fixed top-2.5 left-2.5 z-40 flex flex-col items-start gap-1.5 pointer-events-none"
      >
        {/* 1. English / Hindi */}
        <button
          type="button"
          onClick={handleToggleLanguage}
          aria-label="Toggle Hindi / English"
          className="pointer-events-auto glass-morphism-bar clay-btn-secondary inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold cursor-pointer shadow-md whitespace-nowrap"
        >
          <Globe className="w-3 h-3 shrink-0" />
          <span>{appState.language === 'hi' ? 'Hindi / English' : 'English / हिन्दी'}</span>
        </button>

        {/* 2. Logout */}
        <button
          type="button"
          onClick={handleSignOut}
          aria-label={appState.language === 'hi' ? 'लॉग आउट' : 'Logout'}
          className="pointer-events-auto glass-morphism-bar clay-btn-secondary inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold cursor-pointer shadow-md whitespace-nowrap"
        >
          <LogOut className="w-3 h-3 shrink-0" />
          <span>{appState.language === 'hi' ? 'लॉग आउट' : 'Logout'}</span>
        </button>
      </div>

      {/* Persistent Top-Right Corner Vertical Floating Controls (Visible Across All Pages) */}
      <div
        aria-label={appState.language === 'hi' ? 'फ्लोटिंग नियंत्रण' : 'Floating controls'}
        className="fixed top-2.5 right-2.5 z-40 flex flex-col items-end gap-1.5 pointer-events-none"
      >
        {/* 1. SOS */}
        <button
          type="button"
          onClick={() => setActiveModal('safety')}
          aria-label={appState.language === 'hi' ? 'आपातकालीन SOS सहायता' : 'Emergency SOS Help'}
          className="pointer-events-auto clay-btn-danger inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide cursor-pointer shadow-md whitespace-nowrap"
        >
          <ShieldAlert className="w-3 h-3 shrink-0" />
          <span>SOS</span>
        </button>

        {/* 2. Mode Changer (Light / Dark) */}
        <button
          type="button"
          onClick={handleToggleTheme}
          aria-label={appState.theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
          className="pointer-events-auto glass-morphism-bar clay-btn-secondary inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold cursor-pointer shadow-md whitespace-nowrap"
        >
          {appState.theme === 'dark' ? (
            <Moon className="w-3 h-3 text-[#E5E8CE] shrink-0" />
          ) : (
            <Sun className="w-3 h-3 text-[#344932] shrink-0" />
          )}
          <span>{appState.theme === 'dark' ? 'Dark' : 'Light'}</span>
        </button>

        {/* 3. AI */}
        <button
          type="button"
          onClick={() => setActiveModal('chat')}
          aria-label={appState.language === 'hi' ? 'AI चैट और वॉइस बॉट' : 'AI Chat & Voice Bot'}
          className="pointer-events-auto clay-btn-primary inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold cursor-pointer shadow-md whitespace-nowrap"
        >
          <Bot className="w-3 h-3 shrink-0" />
          <span>AI</span>
        </button>
      </div>

      {/* Full-Viewport Hero with EMOTION AI & Vision anchored at top */}
      <Hero
        language={appState.language}
        onStartCheck={() => openAssessment()}
        onOpenEmotion={() => setActiveModal('chat')}
        onOpenWearables={scrollToWearables}
        topBar={<Header language={appState.language} />}
      />

      {/* Claymorphic Workspace Frame with Left Forest Clay Icon Rail */}
      <main id="workspace" className="min-h-screen pt-8 sm:pt-10 pb-28 px-2 sm:px-6 lg:px-8">
        <div className="max-w-[1380px] mx-auto rounded-[32px] clay-shell overflow-hidden flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
          {/* Left Slim Dark Forest Clay Icon Rail */}
          <aside
            aria-label="Workspace icon rail"
            className="hidden md:flex flex-col items-center justify-between w-[74px] shrink-0 clay-rail text-[#E5E8CE] py-6"
          >
            <div className="flex flex-col items-center gap-3.5">
              <a
                href="#top"
                title="Back to Hero"
                className="mb-2 transition-transform hover:scale-105"
              >
                <BrandLogo size="lg" />
              </a>

              {railNavItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    title={item.label}
                    aria-label={item.label}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-11 h-11 rounded-[15px] flex items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? 'clay-orb-ivory text-[#14261E] dark:text-[#E5E8CE]'
                        : 'text-[#A8C6A4] hover:bg-white/10 hover:text-[#E5E8CE]'
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </button>
                )
              })}

              <div className="w-7 h-0.5 rounded-full bg-white/15 my-1" />

              <button
                type="button"
                title="Agentic AI Transdermal Patch"
                aria-label="Agentic AI Transdermal Patch"
                onClick={() => setActiveModal('patch')}
                className="w-11 h-11 rounded-[15px] bg-[#789575]/30 text-[#E5E8CE] hover:bg-[#789575] hover:text-[#14261E] shadow-[inset_2px_2px_5px_rgba(255,255,255,0.18),inset_-2px_-3px_6px_rgba(0,0,0,0.4)] flex items-center justify-center transition-all cursor-pointer"
              >
                <Cpu className="w-[18px] h-[18px]" />
              </button>

              <button
                type="button"
                title="Chat Bot"
                aria-label="Chat Bot"
                onClick={() => setActiveModal('chat')}
                className="w-11 h-11 rounded-[15px] text-[#A8C6A4] hover:bg-white/10 hover:text-[#E5E8CE] flex items-center justify-center transition-colors cursor-pointer"
              >
                <Bot className="w-[18px] h-[18px]" />
              </button>

              <button
                type="button"
                title="Safety Guardian SOS"
                aria-label="Safety Guardian SOS"
                onClick={() => setActiveModal('safety')}
                className="w-11 h-11 rounded-[15px] text-[#F07D73] hover:bg-[#B42318]/30 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ShieldAlert className="w-[18px] h-[18px]" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-3.5">
              <button
                type="button"
                title="Toggle Light / Dark mode"
                aria-label="Toggle theme"
                onClick={handleToggleTheme}
                className="w-11 h-11 rounded-[15px] text-[#A8C6A4] hover:bg-white/10 hover:text-[#E5E8CE] flex items-center justify-center transition-colors cursor-pointer"
              >
                {appState.theme === 'dark' ? (
                  <Sun className="w-[18px] h-[18px]" />
                ) : (
                  <Moon className="w-[18px] h-[18px]" />
                )}
              </button>

              <button
                type="button"
                title="Profile & Settings"
                aria-label="Profile settings"
                onClick={() => setActiveModal('profile')}
                className="w-11 h-11 rounded-full clay-orb-sage text-[#14261E] text-xs font-bold flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
              >
                {account.avatarInitials}
              </button>

              <button
                type="button"
                title="Sign Out"
                aria-label="Sign out"
                onClick={handleSignOut}
                className="w-11 h-11 rounded-[15px] text-[#A8C6A4] hover:bg-[#B42318]/30 hover:text-[#F07D73] flex items-center justify-center transition-colors cursor-pointer"
              >
                <LogOut className="w-[18px] h-[18px]" />
              </button>
            </div>
          </aside>

          {/* Main Dashboard Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 p-4 sm:p-6 lg:p-7">
              {activeTab === 'home' && (
                <HomeTab
                  account={account}
                  language={appState.language}
                  onOpenCheck={() => openAssessment('checkin')}
                  onOpenTypingTest={() => setActiveModal('typing')}
                  onOpenVoiceCheck={() => setActiveModal('voice')}
                  onOpenBreathing={() => openBreathing('Overview Card')}
                  onOpenChat={() => setActiveModal('chat')}
                  onOpenSafety={() => setActiveModal('safety')}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onSetHasWearable={(val) =>
                    setAppState((prev) => setHasWearable(prev, prev.activeAccountId, val))
                  }
                  onUpsertWearable={(connection) => {
                    setAppState((prev) =>
                      upsertWearableConnection(prev, prev.activeAccountId, connection)
                    )
                  }}
                  onRemoveWearable={(wearableId) => {
                    setAppState((prev) =>
                      removeWearableConnection(prev, prev.activeAccountId, wearableId)
                    )
                  }}
                  onApplyWearableReading={(reading) =>
                    setAppState((prev) =>
                      updateAccount(prev, prev.activeAccountId, (acc) => ({
                        ...acc,
                        factors: {
                          ...acc.factors,
                          sleepHours:
                            typeof reading.sleepHours === 'number'
                              ? reading.sleepHours
                              : acc.factors.sleepHours,
                        },
                      }))
                    )
                  }
                />
              )}

              {activeTab === 'explore' && (
                <ExploreTab
                  account={account}
                  language={appState.language}
                  initialSection={exploreSection}
                  onOpenAssessment={openAssessment}
                  onUpdateEmotionDna={(dna) =>
                    setAppState((prev) => updateEmotionDna(prev, prev.activeAccountId, dna))
                  }
                  onToggleLowMoodItem={(itemId) =>
                    setAppState((prev) =>
                      toggleLowMoodPlanItem(prev, prev.activeAccountId, itemId)
                    )
                  }
                  onAddLowMoodItem={(item) =>
                    setAppState((prev) => addLowMoodPlanItem(prev, prev.activeAccountId, item))
                  }
                  onSaveLowMoodReflection={(text) =>
                    setAppState((prev) =>
                      saveLowMoodReflection(prev, prev.activeAccountId, text)
                    )
                  }
                  onAddSleepLog={(entry) =>
                    setAppState((prev) => addSleepLogEntry(prev, prev.activeAccountId, entry))
                  }
                  onAddMindGymSession={(session) =>
                    setAppState((prev) => addMindGymSession(prev, prev.activeAccountId, session))
                  }
                  onRecordExploration={(type, detail) =>
                    setAppState((prev) =>
                      recordPatientExploration(prev, prev.activeAccountId, type, detail)
                    )
                  }
                  onNavigateToTreatment={() => setActiveTab('treatment')}
                />
              )}

              {activeTab === 'treatment' && (
                <TreatmentTab
                  account={account}
                  language={appState.language}
                  doctorAuthorized={doctorAuthorized}
                  onAuthorizeDoctor={() => setDoctorAuthorized(true)}
                  onLockDoctor={() => setDoctorAuthorized(false)}
                  onSelectPhase={(phase) =>
                    setAppState((prev) => setTreatmentPhase(prev, prev.activeAccountId, phase))
                  }
                  onToggleTonicSlot={(slot) =>
                    setAppState((prev) => toggleTonicSlot(prev, prev.activeAccountId, slot))
                  }
                  onUpdateSyrupRx={(phase, rx) =>
                    setAppState((prev) => updateSyrupPrescription(prev, prev.activeAccountId, phase, rx))
                  }
                  onToggleSyrupReminder={(phase, enabled) =>
                    setAppState((prev) =>
                      toggleSyrupReminderEnabled(prev, prev.activeAccountId, phase, enabled)
                    )
                  }
                  onTriggerTestAlarm={(slot, phase, prescribedBy) => {
                    setActiveSyrupAlarm({ slot, phase, prescribedBy, isTest: true })
                    sendBrowserDoseNotification(
                      appState.language === 'hi'
                        ? `सिरप अलार्म परीक्षण · ${slot.labelHi}`
                        : `Oral Syrup Alarm Test · ${slot.label}`,
                      appState.language === 'hi'
                        ? `${slot.doseMl} ml · निर्धारित समय ${formatTime12h(slot.timeHHMM)} (${prescribedBy})`
                        : `${slot.doseMl} ml scheduled at ${formatTime12h(slot.timeHHMM)} by ${prescribedBy}`
                    )
                  }}
                  onUpdatePatch={(updater) =>
                    setAppState((prev) => updatePatchState(prev, prev.activeAccountId, updater))
                  }
                  onSaveDoctorPrescription={(record) =>
                    setAppState((prev) =>
                      saveDoctorPrescription(prev, prev.activeAccountId, record)
                    )
                  }
                  onAddCounsellingBooking={(booking) =>
                    setAppState((prev) =>
                      addCounsellingBooking(prev, prev.activeAccountId, booking)
                    )
                  }
                />
              )}

              {activeTab === 'report' && (
                <ReportTab
                  account={account}
                  language={appState.language}
                  theme={appState.theme}
                  onToggleTheme={handleToggleTheme}
                  onOpenProfile={() => setActiveModal('profile')}
                  onSignOut={handleSignOut}
                  onToggleTonicSlot={(slot) =>
                    setAppState((prev) => toggleTonicSlot(prev, prev.activeAccountId, slot))
                  }
                  onToggleHabit={(habitId) =>
                    setAppState((prev) =>
                      toggleMindfulnessHabit(prev, prev.activeAccountId, habitId)
                    )
                  }
                  onAddHabit={(title, category, targetMinutes) =>
                    setAppState((prev) =>
                      addMindfulnessHabit(prev, prev.activeAccountId, title, category, targetMinutes)
                    )
                  }
                  onDeleteHabit={(habitId) =>
                    setAppState((prev) => deleteMindfulnessHabit(prev, prev.activeAccountId, habitId))
                  }
                  onOpenBreathing={() => openBreathing('Report Tab')}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}
              {activeTab === 'pharmasafe' && (
                <PharmaSafeTab
                  account={account}
                  language={appState.language}
                  onNavigateToTreatment={() => setActiveTab('treatment')}
                  onOpenChat={() => setActiveModal('chat')}
                  onOpenSafety={() => setActiveModal('safety')}
                  onToggleMedicationToday={(medId) =>
                    setAppState((prev) =>
                      togglePharmaSafeMedicationToday(prev, prev.activeAccountId, medId)
                    )
                  }
                  onAddSideEffect={(entry) =>
                    setAppState((prev) => addSideEffectEntry(prev, prev.activeAccountId, entry))
                  }
                  onAddDoctorQuestion={(question) =>
                    setAppState((prev) => addDoctorQuestion(prev, prev.activeAccountId, question))
                  }
                />
              )}
            </div>

            <footer className="border-t border-[#789575]/20 py-5 px-6">
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-[#495847] dark:text-[#A8C6A4]">
                <span>EMOTION AI · Mental Wellness &amp; Integrative Care</span>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setActiveModal('patch')}
                    className="hover:underline cursor-pointer"
                  >
                    Automated AI Patch
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModal('safety')}
                    className="hover:underline cursor-pointer"
                  >
                    Crisis Helplines (14416)
                  </button>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </main>

      {/* Active Interactive Modals */}
      {activeModal === 'check' && (
        <MentalCheckModal
          account={account}
          language={appState.language}
          initialStep={checkInitialStep}
          onClose={() => setActiveModal(null)}
          onToggleLanguage={handleToggleLanguage}
          onSavePrivacyConsent={(accepted) =>
            setAppState((prev) => savePrivacyConsent(prev, prev.activeAccountId, accepted))
          }
          onSaveFullAssessment={(snapshot, wellnessScore, profile) =>
            setAppState((prev) =>
              recordFullAssessment(
                prev,
                prev.activeAccountId,
                snapshot,
                wellnessScore,
                profile
              )
            )
          }
          onSaveRelaxationProfile={(profile) =>
            setAppState((prev) => saveRelaxationProfile(prev, prev.activeAccountId, profile))
          }
          onSaveTypingMetrics={(wpm, varianceMs) =>
            setAppState((prev) =>
              updateAccount(prev, prev.activeAccountId, (acc) => ({
                ...acc,
                factors: { ...acc.factors, typingWpm: wpm, typingVarianceMs: varianceMs },
              }))
            )
          }
          onSaveVoiceLevel={(level) =>
            setAppState((prev) =>
              updateAccount(prev, prev.activeAccountId, (acc) => ({
                ...acc,
                factors: { ...acc.factors, voiceStress: level },
              }))
            )
          }
          onSaveTriggerEntry={(entry) =>
            setAppState((prev) => addTriggerDetectiveEntry(prev, prev.activeAccountId, entry))
          }
          onOpenBreathing={() => openBreathing('Mental Check')}
          onOpenGuidedTherapy={openGuidedTherapy}
          onOpenSoundTherapy={() => {
            setExploreSection('sound_therapy')
            scrollToWorkspace('explore')
          }}
          onOpenChat={() => setActiveModal('chat')}
          onOpenSafety={() => setActiveModal('safety')}
        />
      )}

      {activeModal === 'breathing' && (
        <BreathingModal language={appState.language} onClose={() => setActiveModal(null)} />
      )}

      {activeModal === 'guided' && guidedTherapyMode && (
        <GuidedTherapyModal
          mode={guidedTherapyMode}
          language={appState.language}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'typing' && (
        <TypingTestModal
          language={appState.language}
          onClose={() => setActiveModal(null)}
          onSaveMetrics={(wpm, varianceMs) =>
            setAppState((prev) =>
              updateAccount(prev, prev.activeAccountId, (acc) => ({
                ...acc,
                factors: { ...acc.factors, typingWpm: wpm, typingVarianceMs: varianceMs },
              }))
            )
          }
        />
      )}

      {activeModal === 'voice' && (
        <VoiceBiomarkerModal
          language={appState.language}
          onClose={() => setActiveModal(null)}
          onSaveVoiceLevel={(level) =>
            setAppState((prev) =>
              updateAccount(prev, prev.activeAccountId, (acc) => ({
                ...acc,
                factors: { ...acc.factors, voiceStress: level },
              }))
            )
          }
        />
      )}

      {(activeModal === 'patch' || activeModal === 'patch-doctor') && (
        <TransdermalPatchModal
          account={account}
          language={appState.language}
          initialSection={activeModal === 'patch-doctor' ? 'doctor' : 'overview'}
          doctorAuthorized={doctorAuthorized}
          onAuthorizeDoctor={() => setDoctorAuthorized(true)}
          onLockDoctor={() => setDoctorAuthorized(false)}
          onClose={() => setActiveModal(null)}
          onUpdatePatch={(updater) =>
            setAppState((prev) => updatePatchState(prev, prev.activeAccountId, updater))
          }
        />
      )}

      {activeModal === 'chat' && (
        <PatientChatbotModal
          account={account}
          language={appState.language}
          onClose={() => setActiveModal(null)}
          onTriggerAction={handleChatbotAction}
        />
      )}

      {activeModal === 'safety' && (
        <SafetyGuardianModal
          account={account}
          language={appState.language}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'profile' && (
        <ProfileModal
          account={account}
          accounts={appState.accounts}
          authSession={authSession}
          language={appState.language}
          theme={appState.theme}
          onClose={() => setActiveModal(null)}
          onSelectAccount={handleSelectAccount}
          onToggleTheme={handleToggleTheme}
          onToggleLanguage={handleToggleLanguage}
          onUpdatePrivacy={(privacy) =>
            setAppState((prev) => updatePrivacySettings(prev, prev.activeAccountId, privacy))
          }
          onResetDemoData={() => setAppState(resetAppState())}
          onUpdateAuthSession={(updated) => setAuthSession(updated)}
          onSignOut={handleSignOut}
        />
      )}

      {activeModal === 'accounts' && (
        <AccountSwitcherModal
          activeAccountId={appState.activeAccountId}
          accounts={appState.accounts}
          language={appState.language}
          onSelect={handleSelectAccount}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Floating Frosted Glass Capsule Section Dock */}
      <SectionDock
        activeTab={activeTab}
        language={appState.language}
        onSelectTab={(tab) => scrollToWorkspace(tab)}
      />

      {/* Ringing Oral Syrup Reminder Notification Alarm Overlay */}
      {activeSyrupAlarm && (
        <div
          role="alertdialog"
          aria-live="assertive"
          className="fixed top-4 right-4 left-4 sm:left-auto sm:w-[400px] z-[60] rounded-[24px] clay-modal p-5 space-y-3.5 text-[#1B251A] dark:text-[#E5E8CE]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <span className="w-10 h-10 rounded-[13px] clay-orb-sage text-[#142013] flex items-center justify-center shrink-0 animate-pulse">
                <AlarmClock className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-[#344932] dark:text-[#A9C2A6]">
                  {activeSyrupAlarm.isTest
                    ? appState.language === 'hi'
                      ? 'सिरप रिमाइंडर अलार्म (परीक्षण)'
                      : 'Syrup Reminder Alarm (Test)'
                    : appState.language === 'hi'
                      ? 'ओरल सिरप खुराक का समय!'
                      : 'Oral Syrup Dose Alarm!'}
                </div>
                <div className="font-display text-base font-bold mt-0.5">
                  {appState.language === 'hi'
                    ? `${activeSyrupAlarm.slot.labelHi} · ${activeSyrupAlarm.slot.doseMl} ml`
                    : `${activeSyrupAlarm.slot.label} · ${activeSyrupAlarm.slot.doseMl} ml`}
                </div>
                <div className="text-xs text-[#495847] dark:text-[#A8B7A4] mt-0.5">
                  {formatTime12h(activeSyrupAlarm.slot.timeHHMM)} · {activeSyrupAlarm.prescribedBy}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveSyrupAlarm(null)}
              aria-label="Dismiss alarm"
              className="clay-btn-secondary p-1.5 rounded-[10px] cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const todayStr = new Date().toISOString().slice(0, 10)
                const alreadyTaken = account.tonicLogs.some(
                  (t) =>
                    t.date === todayStr &&
                    t.slot === activeSyrupAlarm.slot.tonicSlot &&
                    t.taken
                )
                if (!alreadyTaken) {
                  setAppState((prev) =>
                    toggleTonicSlot(prev, prev.activeAccountId, activeSyrupAlarm.slot.tonicSlot)
                  )
                }
                setActiveSyrupAlarm(null)
              }}
              className="flex-1 h-10 px-3.5 rounded-[13px] clay-btn-primary text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {appState.language === 'hi'
                  ? `${activeSyrupAlarm.slot.doseMl} ml ली गई`
                  : `Mark ${activeSyrupAlarm.slot.doseMl} ml Taken`}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                snoozedAlarmsRef.current[activeSyrupAlarm.slot.id] = Date.now() + 10 * 60 * 1000
                setActiveSyrupAlarm(null)
              }}
              className="h-10 px-3 rounded-[13px] clay-btn-secondary text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{appState.language === 'hi' ? '10 मि स्नूज़' : 'Snooze 10m'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
