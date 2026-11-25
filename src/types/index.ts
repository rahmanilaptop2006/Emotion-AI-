export type AccountId = string;
export type Language = 'en' | 'hi';
export type ThemeMode = 'light' | 'dark';
export type TabId = 'home' | 'explore' | 'treatment' | 'report' | 'pharmasafe';

export interface AuthenticatedSession {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  providerId: string;
  role?: string;
  institution?: string;
  githubUsername?: string;
  githubConnected?: boolean;
}

export interface TelemetryFactors {
  sleepHours: number;
  sleepLatencyMin: number;
  screenTimeHours: number;
  lateNightMinutes: number;
  typingWpm: number;
  typingVarianceMs: number;
  voiceStress: 'Low' | 'Mild' | 'Moderate' | 'Elevated';
  stress: 'Low' | 'Medium' | 'High';
}

export interface CheckInEntry {
  id: string;
  date: string;
  timestamp: number;
  wellnessScore: number;
  moodLabel: string;
  stressLevel: 'Low' | 'Medium' | 'High';
  sleepHours: number;
  notes?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  timestamp: number;
  mood: string;
  moodScore: number;
  text: string;
  aiReflection?: string;
  suggestedIntervention?: string;
  groundingPrompt?: string;
}

export interface TonicLog {
  id: string;
  date: string;
  slot: 'Morning 10ml' | 'Evening 10ml';
  taken: boolean;
  timestamp: number;
}

export type HabitCategory = 'breathing' | 'meditation' | 'digital-hygiene' | 'somatic';

export interface MindfulnessHabit {
  id: string;
  title: string;
  titleHi: string;
  category: HabitCategory;
  targetMinutes: number;
  custom?: boolean;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  minutesLogged: number;
  timestamp: number;
}

export interface PatchInfusionLog {
  id: string;
  time: string;
  rateMcgHr: number;
  note: string;
  actor?: 'ai' | 'doctor' | 'user' | 'controller';
}

export interface PatchState {
  active: boolean;
  infusionRateMcgHr: number;
  wearHours: number;
  reservoirPercent: number;
  autoOptimize: boolean;
  minDoseMcgHr: number;
  maxDoseMcgHr: number;
  dailyDoseLimitMcg: number;
  prescribedBy: string;
  prescriptionNote?: string;
  doseLockedByDoctor?: boolean;
  agentReasoning?: string;
  lastEvaluatedAt?: string;
  controllerConnected?: boolean;
  controllerDeviceName?: string;
  controllerTransport?: 'ble' | 'digital_link';
  controllerFirmware?: string;
  controllerBatteryPct?: number;
  controllerView?: 'top' | 'bottom' | 'xray';
  lastDoseReleaseAt?: string;
  lastDoseReleaseMcgHr?: number;
  cumulativeReleasedMcg?: number;
  logs: PatchInfusionLog[];
}

export interface PrivacySettings {
  keystrokeDynamics: boolean;
  voiceProsody: boolean;
  circadianScreen: boolean;
}

export interface TrustedContact {
  name: string;
  relation: string;
  phone: string;
}

export type AssessmentToolId = 'phq9' | 'gad7' | 'who5' | 'pss10';
export type DailyCheckInMood = 'Very Low' | 'Low' | 'Okay' | 'Good' | 'Great';
export type SleepQuality = 'Poor' | 'Okay' | 'Good' | 'Excellent';
export type StressorContext = 'Study' | 'Work' | 'Health' | 'Other';
export type FunctionalImpactLevel =
  | 'Not difficult'
  | 'Somewhat difficult'
  | 'Very difficult'
  | 'Extremely difficult';
export type GuidedActivityId = 'breathing' | 'pmr' | 'imagery' | 'mindfulness';

export type SoundTherapyCategory =
  | 'sound_baths'
  | 'color_noise'
  | 'binaural_beats'
  | 'vibroacoustic'
  | 'tinnitus_enrichment';

export interface RelaxationProfile {
  physicalTension: 'Low' | 'Moderate' | 'High';
  busyThoughts: 'Low' | 'Moderate' | 'High';
  breathingComfort: 'Comfortable' | 'Moderate' | 'Tight';
  sleepRelaxation: 'Optional' | 'Needed';
  preferredAudio:
    | 'Sound Baths'
    | 'White/Pink/Brown Noise'
    | 'Binaural Beats'
    | 'Vibroacoustic Therapy'
    | 'Tinnitus Enrichment'
    | 'Nature Sounds'
    | 'Rain & Thunder'
    | '432Hz Ambient'
    | 'Ocean Waves';
  preferredAudioCategory?: SoundTherapyCategory;
  sessionDuration: '2–5 min' | '5–10 min' | '10–15 min';
}

export type WearableProviderId =
  | 'bluetooth_ble'
  | 'apple_watch'
  | 'fitbit'
  | 'garmin'
  | 'samsung_watch'
  | 'oura_ring'
  | 'google_health_connect';

export type WearableSyncCadence = 'realtime_ble' | 'hourly' | 'every_6h' | 'daily_checkin';
export type WearableMetricKey = 'hr' | 'hrv' | 'sleep' | 'steps' | 'spo2';

export interface WearableReading {
  restingHrBpm?: number;
  hrvMs?: number;
  spo2Percent?: number;
  sleepHours?: number;
  steps?: number;
  recordedAt: number;
  sourceType: 'ble_live' | 'file_import' | 'manual_log';
}

export interface WearableConnection {
  id: string;
  provider: WearableProviderId;
  deviceName: string;
  connected: boolean;
  regularTrackingEnabled: boolean;
  syncCadence: WearableSyncCadence;
  trackedMetrics: WearableMetricKey[];
  lastSyncedAt?: number;
  latestReading?: WearableReading;
}

export interface AssessmentResultSnapshot {
  id: string;
  timestamp: number;
  date: string;
  dailyMood: DailyCheckInMood;
  stressRating: number;
  sleepQuality: SleepQuality;
  sleepHours: number;
  affectedBy: StressorContext[];
  phq9Score?: number;
  phq9Range?: string;
  phq9Item9Flag?: boolean;
  gad7Score?: number;
  gad7Range?: string;
  who5Percent?: number;
  who5Range?: string;
  pss10Score?: number;
  pss10Range?: string;
  functionalImpact: FunctionalImpactLevel;
  safetyEscalated: boolean;
  recommendedActivities: GuidedActivityId[];
  wearableHrBpm?: number;
  wearableHrvMs?: number;
  wearableSteps?: number;
  typingWpm?: number;
  typingVarianceMs?: number;
  voiceStressLevel?: 'Low' | 'Mild' | 'Moderate' | 'Elevated';
}

export type TreatmentPhase = 'acute' | 'intermediate' | 'chronic';

export interface SyrupPrescription {
  morningDoseMl: number;
  eveningDoseMl: number;
  frequency: 'Once Daily' | 'Twice Daily (AM/PM)' | 'Every 8 Hours (TID)' | 'SOS Acute';
  durationDays: number;
  maxDailyMl: number;
  prescribedBy: string;
  clinicalNote: string;
  updatedAt?: string;
  morningReminderTime?: string;
  middayReminderTime?: string;
  eveningReminderTime?: string;
  reminderEnabled?: boolean;
}

export interface SyrupOrderLog {
  id: string;
  phase: TreatmentPhase;
  time: string;
  morningDoseMl: number;
  eveningDoseMl: number;
  doctorName: string;
  note: string;
}

export interface DoctorProfile {
  id: string;
  name: string;
  credentials: string;
  specialty: string;
  specialtyHi: string;
  hospital: string;
  experienceYears: number;
  languages: string[];
  regNumber: string;
  nextAvailable: string;
  avatarInitials: string;
}

export interface PrescribedMedicationItem {
  id: string;
  medicineName: string;
  dose: string;
  timing: string;
  duration: string;
}

export interface DoctorPrescriptionRecord {
  doctorId: string;
  doctorName: string;
  regNumber: string;
  phase: TreatmentPhase;
  diagnosisNote: string;
  conditionNotes?: {
    acute: string;
    intermediate: string;
    chronic: string;
  };
  aiPatchMention?: {
    prescribed: boolean;
    targetRateMcgHr: number;
    minRateMcgHr: number;
    maxRateMcgHr: number;
    dailyLimitMcg: number;
    wearSchedule: string;
    clinicalInstruction: string;
  };
  medicines: PrescribedMedicationItem[];
  signatureDataUrl?: string;
  signatureText?: string;
  stampLabel: string;
  stampDataUrl?: string;
  paperPrescriptionUrl?: string;
  paperPrescriptionName?: string;
  updatedAt: string;
}

export interface CounsellingBooking {
  id: string;
  doctorId: string;
  doctorName: string;
  mode: 'Video' | 'Audio' | 'In-Person';
  slotLabel: string;
  concern: string;
  status: 'Confirmed' | 'Completed';
  createdAt: string;
}

export interface DoctorChatMessage {
  id: string;
  sender: 'patient' | 'doctor';
  text: string;
  timestamp: string;
}

export interface EmotionDnaProfile {
  lowFocus: number;
  overthinking: number;
  selfCriticism: number;
  peoplePleasing: number;
  anxiety: number;
  energyLevel: number;
  updatedAt: string;
  userCorrected?: boolean;
}

export interface TriggerDetectiveEntry {
  id: string;
  timestamp: number;
  date: string;
  situation: string;
  emotion: 'Anxiety' | 'Overwhelmed' | 'Low Focus' | 'Self-Criticism' | 'Fatigue';
  bodyCue: string;
  automaticThought: string;
  reframe: string;
  intensity: number;
}

export interface LowMoodPlanItem {
  id: string;
  title: string;
  titleHi: string;
  energyTag: 'Low' | 'Medium' | 'High';
  category: 'action' | 'routine' | 'pleasant' | 'social';
  completed: boolean;
  date: string;
}

export interface SleepLogEntry {
  id: string;
  date: string;
  bedtime: string;
  wakeTime: string;
  hours: number;
  quality: SleepQuality;
  fatigueRating: number;
  worryNote?: string;
  envChecklistDone: string[];
}

export interface MindGymSession {
  id: string;
  game: 'Linking Pairs' | 'Reaction Speed' | 'Pattern Recall' | 'Focus Timer';
  score: number;
  level: number;
  reflection?: string;
  date: string;
  timestamp: number;
}

export interface SideEffectEntry {
  id: string;
  medicine: string;
  symptom: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  date: string;
  timestamp: number;
}

export interface ClinicalGoalItem {
  id: string;
  goal: string;
  referralPathway: string;
  targetDate: string;
  progressPct: number;
  updatedBy: string;
}

export type ExplorationActivityType =
  | 'sound'
  | 'breathing'
  | 'grounding'
  | 'trigger_detective'
  | 'low_mood'
  | 'sleep'
  | 'worry_journal'
  | 'mindgym'
  | 'emotion_dna'
  | 'poems_stories'
  | 'pharmasafe'
  | 'guided';

export interface AutoMarkedHabitMeta {
  source: string;
  sourceHi: string;
  date: string;
  timestamp: number;
}

export interface PatientExplorationTracker {
  exploredModules: string[];
  autoMarkedHabits: Record<string, AutoMarkedHabitMeta>;
}

export interface UserAccount {
  id: AccountId;
  name: string;
  role: string;
  institution: string;
  avatarInitials: string;
  wellnessScore: number;
  baselineScore: number;
  streakDays: number;
  factors: TelemetryFactors;
  checkIns: CheckInEntry[];
  journalEntries: JournalEntry[];
  tonicLogs: TonicLog[];
  mindfulnessHabits: MindfulnessHabit[];
  habitLogs: HabitLog[];
  patch: PatchState;
  treatmentPhase?: TreatmentPhase;
  acuteSyrupRx?: SyrupPrescription;
  intermediateSyrupRx?: SyrupPrescription;
  chronicSyrupRx?: SyrupPrescription;
  syrupOrderLogs?: SyrupOrderLog[];
  doctorPrescription?: DoctorPrescriptionRecord;
  counsellingBookings?: CounsellingBooking[];
  doctorChatThreads?: Record<string, DoctorChatMessage[]>;
  privacy: PrivacySettings;
  trustedContacts: TrustedContact[];
  privacyConsentAccepted?: boolean;
  hasWearable?: boolean;
  relaxationProfile?: RelaxationProfile;
  latestAssessment?: AssessmentResultSnapshot;
  assessmentHistory?: AssessmentResultSnapshot[];
  wearables?: WearableConnection[];
  emotionDna?: EmotionDnaProfile;
  triggerLogs?: TriggerDetectiveEntry[];
  lowMoodPlan?: LowMoodPlanItem[];
  lowMoodReflection?: string;
  sleepLogs?: SleepLogEntry[];
  mindGymSessions?: MindGymSession[];
  sideEffectDiary?: SideEffectEntry[];
  doctorQuestions?: string[];
  takenMedicationIdsToday?: string[];
  takenMedicationDate?: string;
  clinicalGoals?: ClinicalGoalItem[];
  explorationTracker?: PatientExplorationTracker;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  suggestedAction?: {
    type: 'breathing' | 'sound' | 'tonic' | 'grounding' | 'sos';
    label: string;
  };
}
