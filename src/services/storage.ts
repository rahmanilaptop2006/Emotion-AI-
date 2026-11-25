import type {
  AccountId,
  AssessmentResultSnapshot,
  CheckInEntry,
  ClinicalGoalItem,
  CounsellingBooking,
  DoctorChatMessage,
  DoctorPrescriptionRecord,
  EmotionDnaProfile,
  ExplorationActivityType,
  HabitCategory,
  HabitLog,
  JournalEntry,
  Language,
  LowMoodPlanItem,
  MindGymSession,
  MindfulnessHabit,
  PatchState,
  PatientExplorationTracker,
  PrivacySettings,
  RelaxationProfile,
  SideEffectEntry,
  SleepLogEntry,
  SoundTherapyCategory,
  SyrupOrderLog,
  SyrupPrescription,
  ThemeMode,
  TonicLog,
  TreatmentPhase,
  TriggerDetectiveEntry,
  UserAccount,
  WearableConnection,
  WearableReading,
} from '../types';

const STORAGE_KEY = 'sensewell_state_v3';

function isoDaysAgo(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 86400000);
  return d.toISOString().slice(0, 10);
}

const DEFAULT_MINDFULNESS_HABITS: MindfulnessHabit[] = [
  {
    id: 'mh-breath',
    title: 'Box Breathing Cadence (4-4-4-4)',
    titleHi: 'बॉक्स ब्रीदिंग (4-4-4-4)',
    category: 'breathing',
    targetMinutes: 5,
  },
  {
    id: 'mh-ground',
    title: '5-4-3-2-1 Sensory Grounding',
    titleHi: '5-4-3-2-1 इंद्रिय ग्राउंडिंग',
    category: 'somatic',
    targetMinutes: 4,
  },
  {
    id: 'mh-sound',
    title: 'Acoustic Soundscape Decompression',
    titleHi: 'ध्वनि चिकित्सा विश्राम',
    category: 'meditation',
    targetMinutes: 10,
  },
  {
    id: 'mh-curfew',
    title: '11 PM Screen Wind-Down',
    titleHi: 'रात 11 बजे स्क्रीन विश्राम',
    category: 'digital-hygiene',
    targetMinutes: 15,
  },
];

const DEFAULT_ACUTE_SYRUP_RX: SyrupPrescription = {
  morningDoseMl: 10,
  eveningDoseMl: 10,
  frequency: 'Twice Daily (AM/PM)',
  durationDays: 7,
  maxDailyMl: 30,
  prescribedBy: 'Dr. Kavita Mehta (MD)',
  clinicalNote: 'Acute short-course oral syrup stabilization only. Editable exclusively by attending doctor.',
  updatedAt: '08:00 AM',
  morningReminderTime: '08:00',
  middayReminderTime: '14:00',
  eveningReminderTime: '20:00',
  reminderEnabled: true,
};

const DEFAULT_INTERMEDIATE_SYRUP_RX: SyrupPrescription = {
  morningDoseMl: 10,
  eveningDoseMl: 10,
  frequency: 'Twice Daily (AM/PM)',
  durationDays: 21,
  maxDailyMl: 30,
  prescribedBy: 'Dr. Kavita Mehta (MD)',
  clinicalNote: 'Intermediate step-down oral syrup paired with Automated AI transdermal patch calibration.',
  updatedAt: '08:00 AM',
  morningReminderTime: '08:00',
  middayReminderTime: '14:00',
  eveningReminderTime: '20:00',
  reminderEnabled: true,
};

const DEFAULT_CHRONIC_SYRUP_RX: SyrupPrescription = {
  morningDoseMl: 7.5,
  eveningDoseMl: 7.5,
  frequency: 'Twice Daily (AM/PM)',
  durationDays: 60,
  maxDailyMl: 25,
  prescribedBy: 'Dr. Arvind Nair (MD)',
  clinicalNote: 'Long-term chronic maintenance oral syrup paired with Automated AI transdermal patch.',
  updatedAt: '08:00 AM',
  morningReminderTime: '08:00',
  middayReminderTime: '14:00',
  eveningReminderTime: '20:00',
  reminderEnabled: true,
};

const DEFAULT_DOCTOR_PRESCRIPTION: DoctorPrescriptionRecord = {
  doctorId: 'doc-mehta',
  doctorName: 'Dr. Kavita Mehta (MD)',
  regNumber: 'MCI-REG-48291',
  phase: 'acute',
  diagnosisNote: 'Autonomic stress & sleep onset support — non-sedating integrative regimen.',
  conditionNotes: {
    acute: 'Short-term stress surge · Oral Calming Syrup (Psilocybin) only.',
    intermediate: 'Persistent stress plateau · Oral Syrup + Automated AI Transdermal Patch.',
    chronic: 'Long-term maintenance · Sustained Oral Syrup + Automated AI Patch window.',
  },
  aiPatchMention: {
    prescribed: false,
    targetRateMcgHr: 110,
    minRateMcgHr: 65,
    maxRateMcgHr: 180,
    dailyLimitMcg: 3600,
    wearSchedule: 'Closed-loop daytime/overnight wear (8–12 hrs/day)',
    clinicalInstruction: 'Use only for Intermediate or Chronic condition under MD supervision.',
  },
  medicines: [
    {
      id: 'med-1',
      medicineName: 'Oral Calming Syrup (Psilocybin)',
      dose: '10 ml',
      timing: 'Twice Daily (After meals)',
      duration: '14 days',
    },
  ],
  signatureText: 'Dr. Kavita Mehta, MD',
  stampLabel: 'EMOTION AI CLINICAL SEAL · REG #48291',
  updatedAt: 'Today, 09:30 AM',
};

const DEFAULT_EMOTION_DNA: EmotionDnaProfile = {
  lowFocus: 74,
  overthinking: 78,
  selfCriticism: 52,
  peoplePleasing: 48,
  anxiety: 64,
  energyLevel: 68,
  updatedAt: 'Today',
  userCorrected: false,
};

const DEFAULT_TRIGGER_LOGS: TriggerDetectiveEntry[] = [
  {
    id: 'td-1',
    timestamp: Date.now() - 86400000,
    date: isoDaysAgo(1),
    situation: 'Back-to-back lab deadlines & unread emails',
    emotion: 'Overwhelmed',
    bodyCue: 'Tight shoulders & shallow breathing',
    automaticThought: 'If I pause even for 10 minutes, I will fall behind on everything.',
    reframe: 'One focused 25-minute block after 4-4-4-4 breathing restores speed and clarity.',
    intensity: 7,
  },
];

const DEFAULT_LOW_MOOD_PLAN: LowMoodPlanItem[] = [
  {
    id: 'lm-1',
    title: 'Clean something small (desk or water bottle)',
    titleHi: 'अपनी मेज़ या छोटी जगह साफ करें',
    energyTag: 'Low',
    category: 'action',
    completed: false,
    date: isoDaysAgo(0),
  },
  {
    id: 'lm-2',
    title: 'Write a 3-item priority list',
    titleHi: 'आज के 3 मुख्य कार्यों की सूची बनाएं',
    energyTag: 'Low',
    category: 'routine',
    completed: false,
    date: isoDaysAgo(0),
  },
  {
    id: 'lm-3',
    title: 'Step outside for 8 minutes of morning daylight',
    titleHi: 'सुबह की धूप में 8 मिनट टहलें',
    energyTag: 'Medium',
    category: 'pleasant',
    completed: false,
    date: isoDaysAgo(0),
  },
];

const DEFAULT_SLEEP_LOGS: SleepLogEntry[] = [
  {
    id: 'sl-1',
    date: isoDaysAgo(2),
    bedtime: '23:15',
    wakeTime: '06:30',
    hours: 7.2,
    quality: 'Good',
    fatigueRating: 4,
    envChecklistDone: ['Cool room', 'Low warm light'],
  },
  {
    id: 'sl-2',
    date: isoDaysAgo(1),
    bedtime: '23:40',
    wakeTime: '06:45',
    hours: 7.0,
    quality: 'Okay',
    fatigueRating: 5,
    worryNote: 'Finished study checklist before bed.',
    envChecklistDone: ['Cool room', 'Phone silent'],
  },
];

const DEFAULT_MIND_GYM_SESSIONS: MindGymSession[] = [
  { id: 'mg-1', game: 'Linking Pairs', score: 4200, level: 9, date: isoDaysAgo(4), timestamp: Date.now() - 4 * 86400000 },
  { id: 'mg-2', game: 'Linking Pairs', score: 5150, level: 11, date: isoDaysAgo(3), timestamp: Date.now() - 3 * 86400000 },
  { id: 'mg-3', game: 'Linking Pairs', score: 4850, level: 11, date: isoDaysAgo(2), timestamp: Date.now() - 2 * 86400000 },
  { id: 'mg-4', game: 'Linking Pairs', score: 5640, level: 12, date: isoDaysAgo(1), timestamp: Date.now() - 1 * 86400000 },
  { id: 'mg-5', game: 'Linking Pairs', score: 6230, level: 13, date: isoDaysAgo(0), timestamp: Date.now() - 3600000, reflection: 'Focused smoothly without rushing pairs.' },
];

const DEFAULT_CLINICAL_GOALS: ClinicalGoalItem[] = [
  {
    id: 'cg-1',
    goal: 'Stabilize sleep onset below 20 minutes & achieve 7h+ restorative sleep 5 nights/week',
    referralPathway: 'Behavioral Sleep Hygiene + Evening Psilocybin Protocol',
    targetDate: '4 Weeks',
    progressPct: 68,
    updatedBy: 'Dr. Kavita Mehta (MD)',
  },
  {
    id: 'cg-2',
    goal: 'Reduce exam-week cognitive overthinking episodes using Trigger Detective reframing',
    referralPathway: 'CBT Counselling Bridge with Dr. Riya Sen',
    targetDate: '6 Weeks',
    progressPct: 54,
    updatedBy: 'Dr. Riya Sen',
  },
];

const DEFAULT_EXPLORATION_TRACKER: PatientExplorationTracker = {
  exploredModules: [],
  autoMarkedHabits: {},
};

function normalizeTreatmentPhase(raw?: string): TreatmentPhase {
  if (raw === 'chronic') return 'chronic';
  if (raw === 'intermediate' || raw === 'intermediate_chronic') return 'intermediate';
  return 'acute';
}

export interface AppPersistedState {
  activeAccountId: AccountId;
  language: Language;
  theme: ThemeMode;
  accounts: Record<AccountId, UserAccount>;
}

const DEFAULT_ACCOUNTS: Record<AccountId, UserAccount> = {
  yaman: {
    id: 'yaman',
    name: 'Yaman Kamali',
    role: 'B Pharm Student and Innovator',
    institution: 'Department of Pharmaceutical Sciences',
    avatarInitials: 'YK',
    wellnessScore: 76,
    baselineScore: 72,
    streakDays: 9,
    factors: {
      sleepHours: 7.2,
      sleepLatencyMin: 18,
      screenTimeHours: 4.8,
      lateNightMinutes: 24,
      typingWpm: 62,
      typingVarianceMs: 44,
      voiceStress: 'Mild',
      stress: 'Medium',
    },
    checkIns: [
      {
        id: 'y-c1',
        date: 'Nov 09',
        timestamp: Date.now() - 5 * 86400000,
        wellnessScore: 68,
        moodLabel: 'Exam Prep Pressure',
        stressLevel: 'Medium',
        sleepHours: 6.4,
      },
      {
        id: 'y-c2',
        date: 'Nov 10',
        timestamp: Date.now() - 4 * 86400000,
        wellnessScore: 71,
        moodLabel: 'Steady Focus',
        stressLevel: 'Medium',
        sleepHours: 6.8,
      },
      {
        id: 'y-c3',
        date: 'Nov 11',
        timestamp: Date.now() - 3 * 86400000,
        wellnessScore: 74,
        moodLabel: 'Composed',
        stressLevel: 'Low',
        sleepHours: 7.1,
      },
      {
        id: 'y-c4',
        date: 'Nov 12',
        timestamp: Date.now() - 2 * 86400000,
        wellnessScore: 73,
        moodLabel: 'Lab Fatigue',
        stressLevel: 'Medium',
        sleepHours: 6.9,
      },
      {
        id: 'y-c5',
        date: 'Nov 13',
        timestamp: Date.now() - 1 * 86400000,
        wellnessScore: 78,
        moodLabel: 'Calm & Clear',
        stressLevel: 'Low',
        sleepHours: 7.5,
      },
      {
        id: 'y-c6',
        date: 'Today',
        timestamp: Date.now(),
        wellnessScore: 76,
        moodLabel: 'Balanced Alertness',
        stressLevel: 'Medium',
        sleepHours: 7.2,
      },
    ],
    journalEntries: [
      {
        id: 'y-j1',
        date: 'Nov 13, 08:40 PM',
        timestamp: Date.now() - 86400000,
        mood: 'Calm & Focused',
        moodScore: 78,
        text: 'Completed pharmacognosy formulation notes and took the morning 10ml Ashwagandha-Brahmi tonic. Zero afternoon crash during lab practicals.',
        aiReflection:
          'Your steady pacing and consistent morning routine appear to support sustained alertness without afternoon fatigue.',
        suggestedIntervention: '2-min Box Breathing before sleep',
        groundingPrompt: 'Take three unhurried exhales longer than your inhales as you close your books.',
      },
    ],
    tonicLogs: [
      {
        id: 'y-t1',
        date: isoDaysAgo(0),
        slot: 'Morning 10ml',
        taken: true,
        timestamp: Date.now() - 14400000,
      },
      {
        id: 'y-t2',
        date: isoDaysAgo(0),
        slot: 'Evening 10ml',
        taken: false,
        timestamp: Date.now(),
      },
      {
        id: 'y-t3',
        date: isoDaysAgo(1),
        slot: 'Morning 10ml',
        taken: true,
        timestamp: Date.now() - 86400000,
      },
      {
        id: 'y-t4',
        date: isoDaysAgo(1),
        slot: 'Evening 10ml',
        taken: true,
        timestamp: Date.now() - 72000000,
      },
    ],
    mindfulnessHabits: DEFAULT_MINDFULNESS_HABITS,
    habitLogs: [
      { id: 'y-hl1', habitId: 'mh-breath', date: isoDaysAgo(0), completed: true, minutesLogged: 5, timestamp: Date.now() - 12000000 },
      { id: 'y-hl2', habitId: 'mh-sound', date: isoDaysAgo(0), completed: true, minutesLogged: 10, timestamp: Date.now() - 3600000 },
      { id: 'y-hl3', habitId: 'mh-breath', date: isoDaysAgo(1), completed: true, minutesLogged: 5, timestamp: Date.now() - 86400000 },
      { id: 'y-hl4', habitId: 'mh-curfew', date: isoDaysAgo(1), completed: true, minutesLogged: 15, timestamp: Date.now() - 80000000 },
    ],
    patch: {
      active: true,
      infusionRateMcgHr: 120,
      wearHours: 6.5,
      reservoirPercent: 74,
      autoOptimize: true,
      minDoseMcgHr: 65,
      maxDoseMcgHr: 180,
      dailyDoseLimitMcg: 3600,
      prescribedBy: 'Dr. Kavita Mehta (MD)',
      prescriptionNote: 'Maintain non-sedating Bacoside-Withanolide plateau between 65–180 mcg/hr during exam weeks.',
      doseLockedByDoctor: false,
      agentReasoning:
        'Stable 7.2h sleep recovery and mild 44ms keystroke variance support a balanced 120 mcg/hr Bacoside-Withanolide plateau.',
      lastEvaluatedAt: '02:15 PM',
      logs: [
        { id: 'pl-1', time: '08:00 AM', rateMcgHr: 110, note: 'Baseline adaptogen micro-infusion initialized', actor: 'doctor' },
        { id: 'pl-2', time: '11:30 AM', rateMcgHr: 135, note: 'Agent AI adjusted for mid-morning keystroke variance', actor: 'ai' },
        { id: 'pl-3', time: '02:15 PM', rateMcgHr: 120, note: 'Returned to steady-state plasma plateau', actor: 'ai' },
      ],
    },
    privacy: {
      keystrokeDynamics: true,
      voiceProsody: true,
      circadianScreen: true,
    },
    trustedContacts: [
      { name: 'Dr. Kavita Mehta', relation: 'Faculty Mentor', phone: '+91 98110 42190' },
      { name: 'Rohan Sharma', relation: 'Family', phone: '+91 98712 30455' },
    ],
  },
  abdullah: {
    id: 'abdullah',
    name: 'Abdullah Rahmani',
    role: 'B Pharm Student and Innovator',
    institution: 'Allied Health & Neuro-Care Unit',
    avatarInitials: 'AR',
    wellnessScore: 64,
    baselineScore: 69,
    streakDays: 5,
    factors: {
      sleepHours: 5.9,
      sleepLatencyMin: 29,
      screenTimeHours: 6.5,
      lateNightMinutes: 52,
      typingWpm: 54,
      typingVarianceMs: 68,
      voiceStress: 'Moderate',
      stress: 'High',
    },
    checkIns: [
      {
        id: 'a-c1',
        date: 'Nov 09',
        timestamp: Date.now() - 5 * 86400000,
        wellnessScore: 70,
        moodLabel: 'Routine Shift',
        stressLevel: 'Medium',
        sleepHours: 6.7,
      },
      {
        id: 'a-c2',
        date: 'Nov 10',
        timestamp: Date.now() - 4 * 86400000,
        wellnessScore: 66,
        moodLabel: 'Late Rounds',
        stressLevel: 'High',
        sleepHours: 5.8,
      },
      {
        id: 'a-c3',
        date: 'Nov 11',
        timestamp: Date.now() - 3 * 86400000,
        wellnessScore: 62,
        moodLabel: 'Screen Strain',
        stressLevel: 'High',
        sleepHours: 5.5,
      },
      {
        id: 'a-c4',
        date: 'Nov 12',
        timestamp: Date.now() - 2 * 86400000,
        wellnessScore: 65,
        moodLabel: 'Recovering',
        stressLevel: 'Medium',
        sleepHours: 6.2,
      },
      {
        id: 'a-c5',
        date: 'Nov 13',
        timestamp: Date.now() - 1 * 86400000,
        wellnessScore: 63,
        moodLabel: 'Cognitive Fatigue',
        stressLevel: 'High',
        sleepHours: 5.7,
      },
      {
        id: 'a-c6',
        date: 'Today',
        timestamp: Date.now(),
        wellnessScore: 64,
        moodLabel: 'Needs Reset',
        stressLevel: 'High',
        sleepHours: 5.9,
      },
    ],
    journalEntries: [
      {
        id: 'a-j1',
        date: 'Nov 13, 11:15 PM',
        timestamp: Date.now() - 86400000,
        mood: 'Tired & Stretched',
        moodScore: 63,
        text: 'Long ward documentation shift today. Late-night phone scrolling delayed sleep onset.',
        aiReflection:
          'Extended screen exposure after shifts keeps cortical arousal elevated. A warm non-sedating infusion and 4-7-8 breathing can ease the transition to rest.',
        suggestedIntervention: '4-7-8 Pranayama + Rain Soundscape',
        groundingPrompt: 'Notice the weight of your shoulders dropping as you exhale slowly.',
      },
    ],
    tonicLogs: [
      {
        id: 'a-t1',
        date: isoDaysAgo(0),
        slot: 'Morning 10ml',
        taken: true,
        timestamp: Date.now() - 18000000,
      },
      {
        id: 'a-t2',
        date: isoDaysAgo(0),
        slot: 'Evening 10ml',
        taken: false,
        timestamp: Date.now(),
      },
    ],
    mindfulnessHabits: DEFAULT_MINDFULNESS_HABITS,
    habitLogs: [
      { id: 'a-hl1', habitId: 'mh-ground', date: isoDaysAgo(0), completed: true, minutesLogged: 4, timestamp: Date.now() - 9000000 },
    ],
    patch: {
      active: true,
      infusionRateMcgHr: 150,
      wearHours: 9.2,
      reservoirPercent: 61,
      autoOptimize: true,
      minDoseMcgHr: 75,
      maxDoseMcgHr: 180,
      dailyDoseLimitMcg: 3840,
      prescribedBy: 'Dr. Arvind Nair (MD)',
      prescriptionNote: 'Allow autonomous step-up up to 180 mcg/hr during late clinical rounds; keep floor at 75 mcg/hr.',
      doseLockedByDoctor: false,
      agentReasoning:
        'Short 5.9h sleep and 68ms keystroke jitter triggered an autonomous cortisol-buffering step-up to 150 mcg/hr.',
      lastEvaluatedAt: '01:00 PM',
      logs: [
        { id: 'al-1', time: '07:30 AM', rateMcgHr: 130, note: 'Post-short-sleep cortisol buffer rate', actor: 'doctor' },
        { id: 'al-2', time: '01:00 PM', rateMcgHr: 150, note: 'Elevated ward load detected via typing cadence', actor: 'ai' },
      ],
    },
    privacy: {
      keystrokeDynamics: true,
      voiceProsody: true,
      circadianScreen: true,
    },
    trustedContacts: [
      { name: 'Imran Khan', relation: 'Brother', phone: '+91 98201 77432' },
    ],
  },
  farhan: {
    id: 'farhan',
    name: 'Farhan Khan',
    role: 'B Pharm Student and Innovator',
    institution: 'Herbal Bio-Availability Lab',
    avatarInitials: 'FK',
    wellnessScore: 84,
    baselineScore: 80,
    streakDays: 14,
    factors: {
      sleepHours: 7.8,
      sleepLatencyMin: 12,
      screenTimeHours: 3.9,
      lateNightMinutes: 10,
      typingWpm: 68,
      typingVarianceMs: 31,
      voiceStress: 'Low',
      stress: 'Low',
    },
    checkIns: [
      {
        id: 'f-c1',
        date: 'Nov 09',
        timestamp: Date.now() - 5 * 86400000,
        wellnessScore: 79,
        moodLabel: 'Steady',
        stressLevel: 'Low',
        sleepHours: 7.4,
      },
      {
        id: 'f-c2',
        date: 'Nov 10',
        timestamp: Date.now() - 4 * 86400000,
        wellnessScore: 81,
        moodLabel: 'Energized',
        stressLevel: 'Low',
        sleepHours: 7.6,
      },
      {
        id: 'f-c3',
        date: 'Nov 11',
        timestamp: Date.now() - 3 * 86400000,
        wellnessScore: 83,
        moodLabel: 'Clear-Headed',
        stressLevel: 'Low',
        sleepHours: 7.7,
      },
      {
        id: 'f-c4',
        date: 'Nov 12',
        timestamp: Date.now() - 2 * 86400000,
        wellnessScore: 82,
        moodLabel: 'Productive',
        stressLevel: 'Low',
        sleepHours: 7.5,
      },
      {
        id: 'f-c5',
        date: 'Nov 13',
        timestamp: Date.now() - 1 * 86400000,
        wellnessScore: 85,
        moodLabel: 'Rested',
        stressLevel: 'Low',
        sleepHours: 7.9,
      },
      {
        id: 'f-c6',
        date: 'Today',
        timestamp: Date.now(),
        wellnessScore: 84,
        moodLabel: 'Optimal Equilibrium',
        stressLevel: 'Low',
        sleepHours: 7.8,
      },
    ],
    journalEntries: [
      {
        id: 'f-j1',
        date: 'Nov 13, 07:30 PM',
        timestamp: Date.now() - 86400000,
        mood: 'Optimal Calm',
        moodScore: 85,
        text: 'Franz diffusion cell permeability tests for Bacoside A finished ahead of schedule. Sleep hygiene has noticeably stabilized morning typing rhythm.',
        aiReflection:
          'Consistent circadian wind-down and regular adaptogen adherence are keeping autonomic strain low across the week.',
        suggestedIntervention: 'Evening 10ml Herbal Tonic',
        groundingPrompt: 'Carry this unhurried tempo into your evening meal.',
      },
    ],
    tonicLogs: [
      {
        id: 'f-t1',
        date: isoDaysAgo(0),
        slot: 'Morning 10ml',
        taken: true,
        timestamp: Date.now() - 18000000,
      },
      {
        id: 'f-t2',
        date: isoDaysAgo(0),
        slot: 'Evening 10ml',
        taken: true,
        timestamp: Date.now() - 3600000,
      },
    ],
    mindfulnessHabits: DEFAULT_MINDFULNESS_HABITS,
    habitLogs: [
      { id: 'f-hl1', habitId: 'mh-breath', date: isoDaysAgo(0), completed: true, minutesLogged: 5, timestamp: Date.now() - 15000000 },
      { id: 'f-hl2', habitId: 'mh-sound', date: isoDaysAgo(0), completed: true, minutesLogged: 10, timestamp: Date.now() - 7200000 },
      { id: 'f-hl3', habitId: 'mh-curfew', date: isoDaysAgo(0), completed: true, minutesLogged: 15, timestamp: Date.now() - 3600000 },
    ],
    patch: {
      active: true,
      infusionRateMcgHr: 95,
      wearHours: 4.0,
      reservoirPercent: 86,
      autoOptimize: true,
      minDoseMcgHr: 60,
      maxDoseMcgHr: 150,
      dailyDoseLimitMcg: 3000,
      prescribedBy: 'Dr. Kavita Mehta (MD)',
      prescriptionNote: 'Gentle maintenance window (60–150 mcg/hr) while sleep recovery remains above 7.5h.',
      doseLockedByDoctor: false,
      agentReasoning:
        'Optimal 7.8h sleep and low 31ms keystroke variance sustain a gentle 95 mcg/hr steady maintenance infusion.',
      lastEvaluatedAt: '09:00 AM',
      logs: [
        { id: 'fl-1', time: '09:00 AM', rateMcgHr: 95, note: 'Low-dose maintenance adaptogenic plateau', actor: 'doctor' },
      ],
    },
    privacy: {
      keystrokeDynamics: true,
      voiceProsody: true,
      circadianScreen: true,
    },
    trustedContacts: [
      { name: 'Ayesha Siddiqui', relation: 'Spouse', phone: '+91 98195 61209' },
    ],
  },
};

function cloneDefaults(): AppPersistedState {
  return {
    activeAccountId: 'yaman',
    language: 'en',
    theme: 'light',
    accounts: JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS)),
  };
}

export function loadAppState(): AppPersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefaults();
    const parsed = JSON.parse(raw) as Partial<AppPersistedState>;
    const defaults = cloneDefaults();

    const replaceIngredient = (str: string) => str.replace(/sytosibian/gi, 'Psilocybin');

    const sanitizeRx = (rx?: UserAccount['doctorPrescription']) => {
      if (!rx) return DEFAULT_DOCTOR_PRESCRIPTION;
      const filteredMeds = (rx.medicines || [])
        .filter(
          (m) =>
            !/theanine/i.test(m.medicineName) &&
            !/magnesium\s*glyc/i.test(m.medicineName)
        )
        .map((m) => ({
          ...m,
          medicineName: replaceIngredient(m.medicineName),
        }));
      return {
        ...rx,
        conditionNotes: rx.conditionNotes
          ? {
              acute: replaceIngredient(rx.conditionNotes.acute),
              intermediate: replaceIngredient(rx.conditionNotes.intermediate),
              chronic: replaceIngredient(rx.conditionNotes.chronic),
            }
          : DEFAULT_DOCTOR_PRESCRIPTION.conditionNotes,
        medicines:
          filteredMeds.length > 0 ? filteredMeds : [...DEFAULT_DOCTOR_PRESCRIPTION.medicines],
      };
    };

    const enrichAccount = (acc: UserAccount): UserAccount => ({
      ...acc,
      role: 'B Pharm Student and Innovator',
      doctorPrescription: sanitizeRx(acc.doctorPrescription),
      emotionDna: acc.emotionDna || { ...DEFAULT_EMOTION_DNA },
      triggerLogs: acc.triggerLogs || [...DEFAULT_TRIGGER_LOGS],
      lowMoodPlan: acc.lowMoodPlan || [...DEFAULT_LOW_MOOD_PLAN],
      lowMoodReflection: acc.lowMoodReflection || '',
      sleepLogs: acc.sleepLogs || [...DEFAULT_SLEEP_LOGS],
      mindGymSessions: acc.mindGymSessions || [...DEFAULT_MIND_GYM_SESSIONS],
      sideEffectDiary: (acc.sideEffectDiary || []).map((entry) => ({
        ...entry,
        medicine: replaceIngredient(entry.medicine),
      })),
      doctorQuestions: (
        acc.doctorQuestions || [
          'Can I take Psilocybin syrup after dinner if I study late?',
          'How does sleep consistency affect my next-day stress plateau?',
        ]
      ).map(replaceIngredient),
      takenMedicationIdsToday: acc.takenMedicationIdsToday || [],
      takenMedicationDate: acc.takenMedicationDate || isoDaysAgo(0),
      clinicalGoals: (acc.clinicalGoals || [...DEFAULT_CLINICAL_GOALS]).map((goal) => ({
        ...goal,
        referralPathway: replaceIngredient(goal.referralPathway),
      })),
      explorationTracker: acc.explorationTracker || { ...DEFAULT_EXPLORATION_TRACKER },
    });

    const mergedAccounts: Record<AccountId, UserAccount> = {
      yaman: enrichAccount({
        ...defaults.accounts.yaman,
        ...(parsed.accounts?.yaman || {}),
        mindfulnessHabits: parsed.accounts?.yaman?.mindfulnessHabits || defaults.accounts.yaman.mindfulnessHabits,
        habitLogs: parsed.accounts?.yaman?.habitLogs || defaults.accounts.yaman.habitLogs,
        patch: { ...defaults.accounts.yaman.patch, ...(parsed.accounts?.yaman?.patch || {}) },
        treatmentPhase: normalizeTreatmentPhase(parsed.accounts?.yaman?.treatmentPhase),
        acuteSyrupRx: { ...DEFAULT_ACUTE_SYRUP_RX, ...(parsed.accounts?.yaman?.acuteSyrupRx || {}) },
        intermediateSyrupRx: {
          ...DEFAULT_INTERMEDIATE_SYRUP_RX,
          ...(parsed.accounts?.yaman?.intermediateSyrupRx || parsed.accounts?.yaman?.chronicSyrupRx || {}),
        },
        chronicSyrupRx: { ...DEFAULT_CHRONIC_SYRUP_RX, ...(parsed.accounts?.yaman?.chronicSyrupRx || {}) },
        syrupOrderLogs: parsed.accounts?.yaman?.syrupOrderLogs || [],
        doctorPrescription: parsed.accounts?.yaman?.doctorPrescription || DEFAULT_DOCTOR_PRESCRIPTION,
        counsellingBookings: parsed.accounts?.yaman?.counsellingBookings || [],
        doctorChatThreads: parsed.accounts?.yaman?.doctorChatThreads || {},
      }),
      abdullah: enrichAccount({
        ...defaults.accounts.abdullah,
        ...(parsed.accounts?.abdullah || {}),
        mindfulnessHabits: parsed.accounts?.abdullah?.mindfulnessHabits || defaults.accounts.abdullah.mindfulnessHabits,
        habitLogs: parsed.accounts?.abdullah?.habitLogs || defaults.accounts.abdullah.habitLogs,
        patch: { ...defaults.accounts.abdullah.patch, ...(parsed.accounts?.abdullah?.patch || {}) },
        treatmentPhase: normalizeTreatmentPhase(parsed.accounts?.abdullah?.treatmentPhase),
        acuteSyrupRx: { ...DEFAULT_ACUTE_SYRUP_RX, ...(parsed.accounts?.abdullah?.acuteSyrupRx || {}) },
        intermediateSyrupRx: {
          ...DEFAULT_INTERMEDIATE_SYRUP_RX,
          ...(parsed.accounts?.abdullah?.intermediateSyrupRx || parsed.accounts?.abdullah?.chronicSyrupRx || {}),
        },
        chronicSyrupRx: { ...DEFAULT_CHRONIC_SYRUP_RX, ...(parsed.accounts?.abdullah?.chronicSyrupRx || {}) },
        syrupOrderLogs: parsed.accounts?.abdullah?.syrupOrderLogs || [],
        doctorPrescription: parsed.accounts?.abdullah?.doctorPrescription || DEFAULT_DOCTOR_PRESCRIPTION,
        counsellingBookings: parsed.accounts?.abdullah?.counsellingBookings || [],
        doctorChatThreads: parsed.accounts?.abdullah?.doctorChatThreads || {},
      }),
      farhan: enrichAccount({
        ...defaults.accounts.farhan,
        ...(parsed.accounts?.farhan || {}),
        mindfulnessHabits: parsed.accounts?.farhan?.mindfulnessHabits || defaults.accounts.farhan.mindfulnessHabits,
        habitLogs: parsed.accounts?.farhan?.habitLogs || defaults.accounts.farhan.habitLogs,
        patch: { ...defaults.accounts.farhan.patch, ...(parsed.accounts?.farhan?.patch || {}) },
        treatmentPhase: normalizeTreatmentPhase(parsed.accounts?.farhan?.treatmentPhase),
        acuteSyrupRx: { ...DEFAULT_ACUTE_SYRUP_RX, ...(parsed.accounts?.farhan?.acuteSyrupRx || {}) },
        intermediateSyrupRx: {
          ...DEFAULT_INTERMEDIATE_SYRUP_RX,
          ...(parsed.accounts?.farhan?.intermediateSyrupRx || parsed.accounts?.farhan?.chronicSyrupRx || {}),
        },
        chronicSyrupRx: { ...DEFAULT_CHRONIC_SYRUP_RX, ...(parsed.accounts?.farhan?.chronicSyrupRx || {}) },
        syrupOrderLogs: parsed.accounts?.farhan?.syrupOrderLogs || [],
        doctorPrescription: parsed.accounts?.farhan?.doctorPrescription || DEFAULT_DOCTOR_PRESCRIPTION,
        counsellingBookings: parsed.accounts?.farhan?.counsellingBookings || [],
        doctorChatThreads: parsed.accounts?.farhan?.doctorChatThreads || {},
      }),
    };

    if (parsed.accounts) {
      for (const [id, acc] of Object.entries(parsed.accounts)) {
        if (!mergedAccounts[id] && acc && typeof acc === 'object') {
          mergedAccounts[id] = enrichAccount({
            ...defaults.accounts.yaman,
            ...acc,
            id,
            mindfulnessHabits: acc.mindfulnessHabits || DEFAULT_MINDFULNESS_HABITS,
            habitLogs: acc.habitLogs || [],
            patch: { ...defaults.accounts.yaman.patch, ...(acc.patch || {}) },
            treatmentPhase: normalizeTreatmentPhase(acc.treatmentPhase),
            acuteSyrupRx: { ...DEFAULT_ACUTE_SYRUP_RX, ...(acc.acuteSyrupRx || {}) },
            intermediateSyrupRx: {
              ...DEFAULT_INTERMEDIATE_SYRUP_RX,
              ...(acc.intermediateSyrupRx || acc.chronicSyrupRx || {}),
            },
            chronicSyrupRx: { ...DEFAULT_CHRONIC_SYRUP_RX, ...(acc.chronicSyrupRx || {}) },
            syrupOrderLogs: acc.syrupOrderLogs || [],
            doctorPrescription: acc.doctorPrescription || DEFAULT_DOCTOR_PRESCRIPTION,
            counsellingBookings: acc.counsellingBookings || [],
            doctorChatThreads: acc.doctorChatThreads || {},
          });
        }
      }
    }

    return {
      activeAccountId:
        parsed.activeAccountId && mergedAccounts[parsed.activeAccountId]
          ? parsed.activeAccountId
          : defaults.activeAccountId,
      language: parsed.language === 'hi' ? 'hi' : 'en',
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      accounts: mergedAccounts,
    };
  } catch {
    return cloneDefaults();
  }
}

export function computeInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'EA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function ensureAuthenticatedAccount(
  state: AppPersistedState,
  profile: {
    uid: string;
    name?: string | null;
    email?: string | null;
    role?: string;
    institution?: string;
  }
): AppPersistedState {
  const existing = state.accounts[profile.uid];
  const fallbackName =
    profile.name?.trim() ||
    profile.email?.split('@')[0] ||
    'EMOTION AI User';

  if (existing) {
    const updatedAccount: UserAccount = {
      ...existing,
      name: profile.name?.trim() || existing.name,
      role: 'B Pharm Student and Innovator',
      institution: profile.institution?.trim() || existing.institution,
      avatarInitials: computeInitials(profile.name?.trim() || existing.name),
    };
    const next: AppPersistedState = {
      ...state,
      activeAccountId: profile.uid,
      accounts: {
        ...state.accounts,
        [profile.uid]: updatedAccount,
      },
    };
    saveAppState(next);
    return next;
  }

  const template = state.accounts.yaman || cloneDefaults().accounts.yaman;
  const freshAccount: UserAccount = {
    ...JSON.parse(JSON.stringify(template)),
    id: profile.uid,
    name: fallbackName,
    role: 'B Pharm Student and Innovator',
    institution: profile.institution?.trim() || 'EMOTION AI Secure Workspace',
    avatarInitials: computeInitials(fallbackName),
    wellnessScore: 76,
    baselineScore: 74,
    streakDays: 1,
    checkIns: [
      {
        id: `ci-init-${Date.now()}`,
        date: 'Today',
        timestamp: Date.now(),
        wellnessScore: 76,
        moodLabel: 'Initial Baseline',
        stressLevel: 'Low',
        sleepHours: 7.4,
      },
    ],
    journalEntries: [],
    tonicLogs: [],
    mindfulnessHabits: JSON.parse(JSON.stringify(DEFAULT_MINDFULNESS_HABITS)),
    habitLogs: [],
    treatmentPhase: 'acute',
    acuteSyrupRx: { ...DEFAULT_ACUTE_SYRUP_RX },
    intermediateSyrupRx: { ...DEFAULT_INTERMEDIATE_SYRUP_RX },
    chronicSyrupRx: { ...DEFAULT_CHRONIC_SYRUP_RX },
    syrupOrderLogs: [],
    doctorPrescription: { ...DEFAULT_DOCTOR_PRESCRIPTION },
    counsellingBookings: [],
    doctorChatThreads: {},
    emotionDna: { ...DEFAULT_EMOTION_DNA },
    triggerLogs: [...DEFAULT_TRIGGER_LOGS],
    lowMoodPlan: [...DEFAULT_LOW_MOOD_PLAN],
    lowMoodReflection: '',
    sleepLogs: [...DEFAULT_SLEEP_LOGS],
    mindGymSessions: [...DEFAULT_MIND_GYM_SESSIONS],
    sideEffectDiary: [],
    doctorQuestions: [
      'Can I take Psilocybin syrup after dinner if I study late?',
      'How does sleep consistency affect my next-day stress plateau?',
    ],
    takenMedicationIdsToday: [],
    takenMedicationDate: isoDaysAgo(0),
    clinicalGoals: [...DEFAULT_CLINICAL_GOALS],
    explorationTracker: { ...DEFAULT_EXPLORATION_TRACKER },
    patch: {
      ...JSON.parse(JSON.stringify(template.patch)),
      prescribedBy: 'Dr. Kavita Mehta (MD)',
      lastEvaluatedAt: 'Just now',
      logs: [
        {
          id: `pl-init-${Date.now()}`,
          time: 'Just now',
          rateMcgHr: 110,
          note: 'Initial calibration initialized for authenticated profile',
          actor: 'doctor',
        },
      ],
    },
  };

  const next: AppPersistedState = {
    ...state,
    activeAccountId: profile.uid,
    accounts: {
      ...state.accounts,
      [profile.uid]: freshAccount,
    },
  };
  saveAppState(next);
  return next;
}

export function saveAppState(state: AppPersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function resetAppState(): AppPersistedState {
  const fresh = cloneDefaults();
  saveAppState(fresh);
  return fresh;
}

export function updateAccount(
  state: AppPersistedState,
  accountId: AccountId,
  updater: (acc: UserAccount) => UserAccount
): AppPersistedState {
  const next: AppPersistedState = {
    ...state,
    accounts: {
      ...state.accounts,
      [accountId]: updater(state.accounts[accountId]),
    },
  };
  saveAppState(next);
  return next;
}

export function recordCheckIn(
  state: AppPersistedState,
  accountId: AccountId,
  entry: Omit<CheckInEntry, 'id' | 'date' | 'timestamp'>
): AppPersistedState {
  const newEntry: CheckInEntry = {
    ...entry,
    id: `ci-${Date.now()}`,
    date: 'Just now',
    timestamp: Date.now(),
  };
  return updateAccount(state, accountId, (acc) => ({
    ...acc,
    wellnessScore: entry.wellnessScore,
    factors: {
      ...acc.factors,
      sleepHours: entry.sleepHours,
      stress: entry.stressLevel,
    },
    checkIns: [...acc.checkIns.slice(-9), newEntry],
  }));
}

export function addJournalEntry(
  state: AppPersistedState,
  accountId: AccountId,
  entry: Omit<JournalEntry, 'id' | 'date' | 'timestamp'>
): AppPersistedState {
  const now = new Date();
  const formattedDate = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const newEntry: JournalEntry = {
    ...entry,
    id: `je-${Date.now()}`,
    date: `Today, ${formattedDate}`,
    timestamp: Date.now(),
  };
  return updateAccount(state, accountId, (acc) => ({
    ...acc,
    journalEntries: [newEntry, ...acc.journalEntries],
  }));
}

export function toggleTonicSlot(
  state: AppPersistedState,
  accountId: AccountId,
  slot: TonicLog['slot']
): AppPersistedState {
  const today = new Date().toISOString().slice(0, 10);
  return updateAccount(state, accountId, (acc) => {
    const existingIdx = acc.tonicLogs.findIndex((t) => t.date === today && t.slot === slot);
    const updatedLogs = [...acc.tonicLogs];
    if (existingIdx >= 0) {
      updatedLogs[existingIdx] = {
        ...updatedLogs[existingIdx],
        taken: !updatedLogs[existingIdx].taken,
        timestamp: Date.now(),
      };
    } else {
      updatedLogs.push({
        id: `tl-${Date.now()}`,
        date: today,
        slot,
        taken: true,
        timestamp: Date.now(),
      });
    }
    return { ...acc, tonicLogs: updatedLogs };
  });
}

export function updatePatchState(
  state: AppPersistedState,
  accountId: AccountId,
  updater: (patch: PatchState) => PatchState
): AppPersistedState {
  return updateAccount(state, accountId, (acc) => ({
    ...acc,
    patch: updater(acc.patch),
  }));
}

export function updatePrivacySettings(
  state: AppPersistedState,
  accountId: AccountId,
  privacy: PrivacySettings
): AppPersistedState {
  return updateAccount(state, accountId, (acc) => ({
    ...acc,
    privacy,
  }));
}

export function toggleMindfulnessHabit(
  state: AppPersistedState,
  accountId: AccountId,
  habitId: string
): AppPersistedState {
  const today = new Date().toISOString().slice(0, 10);
  return updateAccount(state, accountId, (acc) => {
    const habit = acc.mindfulnessHabits.find((h) => h.id === habitId);
    const existingIdx = acc.habitLogs.findIndex((l) => l.date === today && l.habitId === habitId);
    const updatedLogs: HabitLog[] = [...acc.habitLogs];
    if (existingIdx >= 0) {
      updatedLogs[existingIdx] = {
        ...updatedLogs[existingIdx],
        completed: !updatedLogs[existingIdx].completed,
        timestamp: Date.now(),
      };
    } else {
      updatedLogs.push({
        id: `hl-${Date.now()}`,
        habitId,
        date: today,
        completed: true,
        minutesLogged: habit?.targetMinutes ?? 5,
        timestamp: Date.now(),
      });
    }
    return { ...acc, habitLogs: updatedLogs };
  });
}

export function addMindfulnessHabit(
  state: AppPersistedState,
  accountId: AccountId,
  title: string,
  category: HabitCategory,
  targetMinutes: number
): AppPersistedState {
  const trimmed = title.trim();
  if (!trimmed) return state;
  const newHabit: MindfulnessHabit = {
    id: `mh-custom-${Date.now()}`,
    title: trimmed,
    titleHi: trimmed,
    category,
    targetMinutes: Math.max(1, Math.min(90, Math.round(targetMinutes))),
    custom: true,
  };
  return updateAccount(state, accountId, (acc) => ({
    ...acc,
    mindfulnessHabits: [...acc.mindfulnessHabits, newHabit],
  }));
}

export function deleteMindfulnessHabit(
  state: AppPersistedState,
  accountId: AccountId,
  habitId: string
): AppPersistedState {
  return updateAccount(state, accountId, (acc) => ({
    ...acc,
    mindfulnessHabits: acc.mindfulnessHabits.filter((h) => h.id !== habitId),
    habitLogs: acc.habitLogs.filter((l) => l.habitId !== habitId),
  }));
}

export function savePrivacyConsent(
  state: AppPersistedState,
  accountId: AccountId,
  accepted: boolean
): AppPersistedState {
  return updateAccount(state, accountId, (acc) => ({
    ...acc,
    privacyConsentAccepted: accepted,
  }));
}

export function setHasWearable(
  state: AppPersistedState,
  accountId: AccountId,
  hasWearable: boolean
): AppPersistedState {
  return updateAccount(state, accountId, (acc) => ({
    ...acc,
    hasWearable,
  }));
}

export function saveRelaxationProfile(
  state: AppPersistedState,
  accountId: AccountId,
  profile: RelaxationProfile
): AppPersistedState {
  return updateAccount(state, accountId, (acc) => ({
    ...acc,
    relaxationProfile: profile,
  }));
}

export function recordFullAssessment(
  state: AppPersistedState,
  accountId: AccountId,
  snapshot: AssessmentResultSnapshot,
  computedWellnessScore: number,
  relaxationProfile: RelaxationProfile
): AppPersistedState {
  const stressLevel: 'Low' | 'Medium' | 'High' =
    snapshot.stressRating >= 7 || computedWellnessScore < 60
      ? 'High'
      : snapshot.stressRating >= 4 || computedWellnessScore < 76
        ? 'Medium'
        : 'Low';

  const checkInEntry: CheckInEntry = {
    id: `ci-${Date.now()}`,
    date: 'Just now',
    timestamp: snapshot.timestamp,
    wellnessScore: computedWellnessScore,
    moodLabel: `${snapshot.dailyMood} · ${snapshot.stressRating}/10`,
    stressLevel,
    sleepHours: snapshot.sleepHours,
  };

  return updateAccount(state, accountId, (acc) => ({
    ...acc,
    privacyConsentAccepted: true,
    wellnessScore: computedWellnessScore,
    factors: {
      ...acc.factors,
      sleepHours: snapshot.sleepHours,
      stress: stressLevel,
    },
    checkIns: [...acc.checkIns.slice(-9), checkInEntry],
    relaxationProfile,
    latestAssessment: snapshot,
    assessmentHistory: [snapshot, ...(acc.assessmentHistory || [])].slice(0, 12),
  }));
}

export function upsertWearableConnection(
  state: AppPersistedState,
  accountId: AccountId,
  connection: WearableConnection
): AppPersistedState {
  return updateAccount(state, accountId, (acc) => {
    const existing = acc.wearables || [];
    const idx = existing.findIndex((w) => w.id === connection.id);
    const updatedList =
      idx >= 0
        ? existing.map((w, i) => (i === idx ? connection : w))
        : [...existing, connection];

    const sleepUpdate =
      connection.regularTrackingEnabled && typeof connection.latestReading?.sleepHours === 'number'
        ? connection.latestReading.sleepHours
        : acc.factors.sleepHours;

    return {
      ...acc,
      factors: {
        ...acc.factors,
        sleepHours: sleepUpdate,
      },
      wearables: updatedList,
    };
  });
}

export function syncWearableReadingToAccount(
  state: AppPersistedState,
  accountId: AccountId,
  wearableId: string,
  reading: WearableReading
): AppPersistedState {
  return updateAccount(state, accountId, (acc) => {
    const existing = acc.wearables || [];
    const updatedList = existing.map((w) =>
      w.id === wearableId
        ? {
            ...w,
            connected: true,
            lastSyncedAt: reading.recordedAt,
            latestReading: reading,
          }
        : w
    );

    return {
      ...acc,
      factors: {
        ...acc.factors,
        sleepHours:
          typeof reading.sleepHours === 'number' ? reading.sleepHours : acc.factors.sleepHours,
      },
      wearables: updatedList,
    };
  });
}

export function removeWearableConnection(
  state: AppPersistedState,
  accountId: AccountId,
  wearableId: string
): AppPersistedState {
  return updateAccount(state, accountId, (acc) => ({
    ...acc,
    wearables: (acc.wearables || []).filter((w) => w.id !== wearableId),
  }));
}

export function setTreatmentPhase(
  state: AppPersistedState,
  accountId: AccountId,
  phase: TreatmentPhase
): AppPersistedState {
  return updateAccount(state, accountId, (acc) => ({
    ...acc,
    treatmentPhase: phase,
  }));
}

export function updateSyrupPrescription(
  state: AppPersistedState,
  accountId: AccountId,
  phase: TreatmentPhase,
  rx: SyrupPrescription,
  logNote?: string
): AppPersistedState {
  const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const stampedRx: SyrupPrescription = { ...rx, updatedAt: timeLabel };
  const phaseLabel = phase === 'acute' ? 'Acute' : phase === 'intermediate' ? 'Intermediate' : 'Chronic';
  const logEntry: SyrupOrderLog = {
    id: `srx-${Date.now()}`,
    phase,
    time: timeLabel,
    morningDoseMl: stampedRx.morningDoseMl,
    eveningDoseMl: stampedRx.eveningDoseMl,
    doctorName: stampedRx.prescribedBy,
    note:
      logNote ||
      `${phaseLabel} syrup prescribed: AM ${stampedRx.morningDoseMl}ml (${stampedRx.morningReminderTime || '08:00'}) · PM ${stampedRx.eveningDoseMl}ml (${stampedRx.eveningReminderTime || '20:00'}) (${stampedRx.frequency}, ${stampedRx.durationDays}d)`,
  };
  return updateAccount(state, accountId, (acc) => ({
    ...acc,
    ...(phase === 'acute'
      ? { acuteSyrupRx: stampedRx }
      : phase === 'intermediate'
        ? { intermediateSyrupRx: stampedRx }
        : { chronicSyrupRx: stampedRx }),
    syrupOrderLogs: [logEntry, ...(acc.syrupOrderLogs || [])].slice(0, 12),
  }));
}

export function toggleSyrupReminderEnabled(
  state: AppPersistedState,
  accountId: AccountId,
  phase: TreatmentPhase,
  enabled: boolean
): AppPersistedState {
  return updateAccount(state, accountId, (acc) => {
    const currentRx =
      phase === 'acute'
        ? acc.acuteSyrupRx || DEFAULT_ACUTE_SYRUP_RX
        : phase === 'intermediate'
          ? acc.intermediateSyrupRx || DEFAULT_INTERMEDIATE_SYRUP_RX
          : acc.chronicSyrupRx || DEFAULT_CHRONIC_SYRUP_RX;
    const updatedRx: SyrupPrescription = { ...currentRx, reminderEnabled: enabled };
    return {
      ...acc,
      ...(phase === 'acute'
        ? { acuteSyrupRx: updatedRx }
        : phase === 'intermediate'
          ? { intermediateSyrupRx: updatedRx }
          : { chronicSyrupRx: updatedRx }),
    };
  });
}

export function saveDoctorPrescription(
  state: AppPersistedState,
  accountId: AccountId,
  record: DoctorPrescriptionRecord
): AppPersistedState {
  return updateAccount(state, accountId, (acc) => {
    const usePatch =
      (record.phase === 'intermediate' || record.phase === 'chronic') &&
      Boolean(record.aiPatchMention?.prescribed);
    const pm = record.aiPatchMention;
    const nextPatch =
      usePatch && pm
        ? {
            ...acc.patch,
            active: true,
            infusionRateMcgHr: pm.targetRateMcgHr,
            minDoseMcgHr: pm.minRateMcgHr,
            maxDoseMcgHr: pm.maxRateMcgHr,
            dailyDoseLimitMcg: pm.dailyLimitMcg,
            prescribedBy: record.doctorName,
            prescriptionNote: pm.clinicalInstruction || acc.patch.prescriptionNote,
            lastEvaluatedAt: record.updatedAt,
          }
        : acc.patch;
    return {
      ...acc,
      treatmentPhase: record.phase,
      doctorPrescription: record,
      patch: nextPatch,
    };
  });
}

export function addCounsellingBooking(
  state: AppPersistedState,
  accountId: AccountId,
  booking: Omit<CounsellingBooking, 'id' | 'createdAt' | 'status'>
): AppPersistedState {
  const newBooking: CounsellingBooking = {
    ...booking,
    id: `cb-${Date.now()}`,
    status: 'Confirmed',
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  return updateAccount(state, accountId, (acc) => ({
    ...acc,
    counsellingBookings: [newBooking, ...(acc.counsellingBookings || [])].slice(0, 10),
  }));
}

export function addDoctorChatMessage(
  state: AppPersistedState,
  accountId: AccountId,
  doctorId: string,
  message: Omit<DoctorChatMessage, 'id' | 'timestamp'>
): AppPersistedState {
  const entry: DoctorChatMessage = {
    ...message,
    id: `dcm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  return updateAccount(state, accountId, (acc) => {
    const existingThreads = acc.doctorChatThreads || {};
    const current = existingThreads[doctorId] || [];
    return {
      ...acc,
      doctorChatThreads: {
        ...existingThreads,
        [doctorId]: [...current, entry].slice(-40),
      },
    };
  });
}

export function setPreferredSoundCategory(
  state: AppPersistedState,
  accountId: AccountId,
  category: SoundTherapyCategory,
  label: RelaxationProfile['preferredAudio']
): AppPersistedState {
  return updateAccount(state, accountId, (acc) => {
    const existing: RelaxationProfile = acc.relaxationProfile ?? {
      physicalTension: 'Moderate',
      busyThoughts: 'Moderate',
      breathingComfort: 'Moderate',
      sleepRelaxation: 'Needed',
      preferredAudio: label,
      preferredAudioCategory: category,
      sessionDuration: '5–10 min',
    };
    return {
      ...acc,
      relaxationProfile: {
        ...existing,
        preferredAudio: label,
        preferredAudioCategory: category,
      },
    };
  });
}

const EXPLORATION_HABIT_MAP: Partial<
  Record<
    ExplorationActivityType,
    { habitId: string; source: string; sourceHi: string }
  >
> = {
  sound: {
    habitId: 'mh-sound',
    source: 'Calming Soundscapes exploration',
    sourceHi: 'शांत ध्वनि अन्वेषण द्वारा स्वतः पूर्ण',
  },
  breathing: {
    habitId: 'mh-breath',
    source: 'Paced Breathing session',
    sourceHi: 'ब्रीदिंग सत्र द्वारा स्वतः पूर्ण',
  },
  grounding: {
    habitId: 'mh-ground',
    source: 'Sensory Grounding exploration',
    sourceHi: 'ग्राउंडिंग अन्वेषण द्वारा स्वतः पूर्ण',
  },
  trigger_detective: {
    habitId: 'mh-ground',
    source: 'Trigger Detective cognitive reframe',
    sourceHi: 'ट्रिगर डिटेक्टिव अभ्यास द्वारा स्वतः पूर्ण',
  },
  low_mood: {
    habitId: 'mh-ground',
    source: 'Low-Mood Behavioural Activation',
    sourceHi: 'लो-मूड एक्शन प्लान द्वारा स्वतः पूर्ण',
  },
  guided: {
    habitId: 'mh-ground',
    source: 'Guided Relaxation Therapy',
    sourceHi: 'निर्देशित विश्राम सत्र द्वारा स्वतः पूर्ण',
  },
  sleep: {
    habitId: 'mh-curfew',
    source: 'Sleep & Recovery wind-down',
    sourceHi: 'स्लीप और रिकवरी अन्वेषण द्वारा स्वतः पूर्ण',
  },
  worry_journal: {
    habitId: 'mh-curfew',
    source: 'Nighttime Worry Journal',
    sourceHi: 'रात्रि चिंता जर्नल द्वारा स्वतः पूर्ण',
  },
};

export function recordPatientExploration(
  state: AppPersistedState,
  accountId: AccountId,
  activityType: ExplorationActivityType,
  detail?: string
): AppPersistedState {
  const today = new Date().toISOString().slice(0, 10);
  const nowTs = Date.now();
  const mapping = EXPLORATION_HABIT_MAP[activityType];

  return updateAccount(state, accountId, (acc) => {
    const tracker = acc.explorationTracker || { exploredModules: [], autoMarkedHabits: {} };
    const moduleKey = `${today}:${activityType}`;
    const exploredModules = tracker.exploredModules.includes(moduleKey)
      ? tracker.exploredModules
      : [moduleKey, ...tracker.exploredModules].slice(0, 40);

    let updatedHabitLogs = [...acc.habitLogs];
    const autoMarkedHabits = { ...tracker.autoMarkedHabits };

    if (mapping) {
      const habit = acc.mindfulnessHabits.find((h) => h.id === mapping.habitId);
      const existingIdx = updatedHabitLogs.findIndex(
        (l) => l.date === today && l.habitId === mapping.habitId
      );
      if (existingIdx >= 0) {
        updatedHabitLogs[existingIdx] = {
          ...updatedHabitLogs[existingIdx],
          completed: true,
          timestamp: nowTs,
        };
      } else {
        updatedHabitLogs.push({
          id: `hl-auto-${nowTs}`,
          habitId: mapping.habitId,
          date: today,
          completed: true,
          minutesLogged: habit?.targetMinutes ?? 5,
          timestamp: nowTs,
        });
      }
      autoMarkedHabits[mapping.habitId] = {
        source: detail ? `${mapping.source}: ${detail}` : mapping.source,
        sourceHi: detail ? `${mapping.sourceHi} (${detail})` : mapping.sourceHi,
        date: today,
        timestamp: nowTs,
      };
    }

    return {
      ...acc,
      habitLogs: updatedHabitLogs,
      explorationTracker: {
        exploredModules,
        autoMarkedHabits,
      },
    };
  });
}

export function updateEmotionDna(
  state: AppPersistedState,
  accountId: AccountId,
  dna: EmotionDnaProfile
): AppPersistedState {
  return updateAccount(state, accountId, (acc) => ({
    ...acc,
    emotionDna: {
      ...dna,
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  }));
}

export function addTriggerDetectiveEntry(
  state: AppPersistedState,
  accountId: AccountId,
  entry: Omit<TriggerDetectiveEntry, 'id' | 'timestamp' | 'date'>
): AppPersistedState {
  const today = new Date().toISOString().slice(0, 10);
  const newEntry: TriggerDetectiveEntry = {
    ...entry,
    id: `td-${Date.now()}`,
    timestamp: Date.now(),
    date: today,
  };
  const next = updateAccount(state, accountId, (acc) => {
    const dna = acc.emotionDna || { ...DEFAULT_EMOTION_DNA };
    const boost = Math.max(0, entry.intensity - 5) * 2;
    const nextDna: EmotionDnaProfile = {
      ...dna,
      anxiety: entry.emotion === 'Anxiety' ? Math.min(95, Math.max(35, dna.anxiety + boost)) : dna.anxiety,
      overthinking:
        entry.emotion === 'Overwhelmed'
          ? Math.min(95, Math.max(35, dna.overthinking + boost))
          : dna.overthinking,
      lowFocus:
        entry.emotion === 'Low Focus' ? Math.min(95, Math.max(35, dna.lowFocus + boost)) : dna.lowFocus,
      selfCriticism:
        entry.emotion === 'Self-Criticism'
          ? Math.min(95, Math.max(35, dna.selfCriticism + boost))
          : dna.selfCriticism,
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    return {
      ...acc,
      emotionDna: nextDna,
      triggerLogs: [newEntry, ...(acc.triggerLogs || [])].slice(0, 20),
    };
  });
  return recordPatientExploration(next, accountId, 'trigger_detective', entry.emotion);
}

export function toggleLowMoodPlanItem(
  state: AppPersistedState,
  accountId: AccountId,
  itemId: string
): AppPersistedState {
  let completedTitle: string | undefined;
  const next = updateAccount(state, accountId, (acc) => {
    const list = (acc.lowMoodPlan || []).map((item) => {
      if (item.id !== itemId) return item;
      const nextCompleted = !item.completed;
      if (nextCompleted) completedTitle = item.title;
      return { ...item, completed: nextCompleted };
    });
    return { ...acc, lowMoodPlan: list };
  });
  if (completedTitle) {
    return recordPatientExploration(next, accountId, 'low_mood', completedTitle);
  }
  return next;
}

export function addLowMoodPlanItem(
  state: AppPersistedState,
  accountId: AccountId,
  item: Omit<LowMoodPlanItem, 'id' | 'date' | 'completed'>
): AppPersistedState {
  const today = new Date().toISOString().slice(0, 10);
  const next = updateAccount(state, accountId, (acc) => {
    const existing = acc.lowMoodPlan || [];
    if (existing.some((x) => x.title.toLowerCase() === item.title.toLowerCase())) {
      return acc;
    }
    const created: LowMoodPlanItem = {
      ...item,
      id: `lm-${Date.now()}`,
      completed: false,
      date: today,
    };
    return { ...acc, lowMoodPlan: [created, ...existing].slice(0, 18) };
  });
  return recordPatientExploration(next, accountId, 'low_mood', item.title);
}

export function saveLowMoodReflection(
  state: AppPersistedState,
  accountId: AccountId,
  reflection: string
): AppPersistedState {
  const next = updateAccount(state, accountId, (acc) => ({
    ...acc,
    lowMoodReflection: reflection,
  }));
  return recordPatientExploration(next, accountId, 'low_mood', 'Reflection logged');
}

export function addSleepLogEntry(
  state: AppPersistedState,
  accountId: AccountId,
  entry: Omit<SleepLogEntry, 'id' | 'date'>
): AppPersistedState {
  const today = new Date().toISOString().slice(0, 10);
  const newLog: SleepLogEntry = {
    ...entry,
    id: `sl-${Date.now()}`,
    date: today,
  };
  const next = updateAccount(state, accountId, (acc) => ({
    ...acc,
    factors: {
      ...acc.factors,
      sleepHours: entry.hours,
    },
    sleepLogs: [newLog, ...(acc.sleepLogs || [])].slice(0, 14),
  }));
  return recordPatientExploration(
    next,
    accountId,
    entry.worryNote?.trim() ? 'worry_journal' : 'sleep',
    `${entry.hours.toFixed(1)} hrs`
  );
}

export function addMindGymSession(
  state: AppPersistedState,
  accountId: AccountId,
  session: Omit<MindGymSession, 'id' | 'date' | 'timestamp'>
): AppPersistedState {
  const today = new Date().toISOString().slice(0, 10);
  const entry: MindGymSession = {
    ...session,
    id: `mg-${Date.now()}`,
    date: today,
    timestamp: Date.now(),
  };
  const next = updateAccount(state, accountId, (acc) => {
    const dna = acc.emotionDna || { ...DEFAULT_EMOTION_DNA };
    const improvedFocus = Math.max(20, dna.lowFocus - 2);
    return {
      ...acc,
      emotionDna: { ...dna, lowFocus: improvedFocus },
      mindGymSessions: [...(acc.mindGymSessions || []), entry].slice(-20),
    };
  });
  return recordPatientExploration(next, accountId, 'mindgym', session.game);
}

export function togglePharmaSafeMedicationToday(
  state: AppPersistedState,
  accountId: AccountId,
  medId: string
): AppPersistedState {
  const today = new Date().toISOString().slice(0, 10);
  return updateAccount(state, accountId, (acc) => {
    const baseList = acc.takenMedicationDate === today ? acc.takenMedicationIdsToday || [] : [];
    const exists = baseList.includes(medId);
    const updated = exists ? baseList.filter((id) => id !== medId) : [...baseList, medId];
    return {
      ...acc,
      takenMedicationDate: today,
      takenMedicationIdsToday: updated,
    };
  });
}

export function addSideEffectEntry(
  state: AppPersistedState,
  accountId: AccountId,
  entry: Omit<SideEffectEntry, 'id' | 'date' | 'timestamp'>
): AppPersistedState {
  const created: SideEffectEntry = {
    ...entry,
    id: `se-${Date.now()}`,
    date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
  };
  return updateAccount(state, accountId, (acc) => ({
    ...acc,
    sideEffectDiary: [created, ...(acc.sideEffectDiary || [])].slice(0, 15),
  }));
}

export function addDoctorQuestion(
  state: AppPersistedState,
  accountId: AccountId,
  question: string
): AppPersistedState {
  const trimmed = question.trim();
  if (!trimmed) return state;
  return updateAccount(state, accountId, (acc) => ({
    ...acc,
    doctorQuestions: [trimmed, ...(acc.doctorQuestions || [])].slice(0, 12),
  }));
}

export function saveClinicalGoals(
  state: AppPersistedState,
  accountId: AccountId,
  goals: ClinicalGoalItem[]
): AppPersistedState {
  return updateAccount(state, accountId, (acc) => ({
    ...acc,
    clinicalGoals: goals,
  }));
}

