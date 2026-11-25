import { useEffect, useState } from 'react'
import { BedDouble, BookOpen, Brain, Dna, Headphones, HeartHandshake } from 'lucide-react'
import type {
  EmotionDnaProfile,
  ExplorationActivityType,
  Language,
  LowMoodPlanItem,
  MindGymSession,
  SleepLogEntry,
  UserAccount,
} from '../types'
import { EmotionDnaPanel } from './explore/EmotionDnaPanel'
import { LowMoodSupportPanel } from './explore/LowMoodSupportPanel'
import { MindGymPanel } from './explore/MindGymPanel'
import { PoemsStoriesPanel } from './explore/PoemsStoriesPanel'
import { SleepRecoveryPanel } from './explore/SleepRecoveryPanel'
import { SoundTherapyPanel } from './explore/SoundTherapyPanel'
import type { CheckModalStartStep } from './MentalCheckModal'

export type ExploreSection =
  | 'emotion_dna'
  | 'sound_therapy'
  | 'low_mood'
  | 'sleep'
  | 'mindgym'
  | 'poems_stories'

interface ExploreTabProps {
  account: UserAccount
  language: Language
  initialSection?: ExploreSection
  onOpenAssessment: (step?: CheckModalStartStep) => void
  onUpdateEmotionDna: (dna: EmotionDnaProfile) => void
  onToggleLowMoodItem: (itemId: string) => void
  onAddLowMoodItem: (item: Omit<LowMoodPlanItem, 'id' | 'date' | 'completed'>) => void
  onSaveLowMoodReflection: (text: string) => void
  onAddSleepLog: (entry: Omit<SleepLogEntry, 'id' | 'date'>) => void
  onAddMindGymSession: (session: Omit<MindGymSession, 'id' | 'date' | 'timestamp'>) => void
  onRecordExploration: (type: ExplorationActivityType, detail?: string) => void
  onNavigateToTreatment: () => void
}

export function ExploreTab({
  account,
  language,
  initialSection,
  onOpenAssessment,
  onUpdateEmotionDna,
  onToggleLowMoodItem,
  onAddLowMoodItem,
  onSaveLowMoodReflection,
  onAddSleepLog,
  onAddMindGymSession,
  onRecordExploration,
  onNavigateToTreatment,
}: ExploreTabProps) {
  const isHi = language === 'hi'
  const [section, setSection] = useState<ExploreSection>(initialSection || 'emotion_dna')

  useEffect(() => {
    if (initialSection) {
      setSection(initialSection)
    }
  }, [initialSection])

  const exploreNav: {
    id: ExploreSection
    label: string
    labelHi: string
    icon: typeof Dna
  }[] = [
    { id: 'emotion_dna', label: 'Emotion DNA', labelHi: 'इमोशन DNA', icon: Dna },
    { id: 'sound_therapy', label: 'Sound Therapy', labelHi: 'साउंड थेरेपी', icon: Headphones },
    { id: 'low_mood', label: 'Low-Mood Support', labelHi: 'लो-मूड सहायता', icon: HeartHandshake },
    { id: 'sleep', label: 'Sleep & Recovery', labelHi: 'नींद व रिकवरी', icon: BedDouble },
    { id: 'mindgym', label: 'MindGym', labelHi: 'माइंडजिम', icon: Brain },
    { id: 'poems_stories', label: 'Poems & Stories', labelHi: 'कविताएं व कहानियां', icon: BookOpen },
  ]

  return (
    <div className="space-y-6">
      {/* Explore Pillar Switcher */}
      <nav
        aria-label="Explore wellness modules"
        className="rounded-[24px] clay-card p-2.5 flex flex-wrap items-center gap-2"
      >
        {exploreNav.map((item) => {
          const Icon = item.icon
          const active = section === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSection(item.id)
                if (item.id === 'emotion_dna') onRecordExploration('emotion_dna')
                if (item.id === 'sound_therapy') onRecordExploration('sound', 'Visited Sound Therapy')
                if (item.id === 'sleep') onRecordExploration('sleep', 'Visited Sleep & Recovery')
                if (item.id === 'poems_stories') onRecordExploration('poems_stories', 'Visited Poems & Stories')
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[15px] text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                active ? 'clay-btn-primary' : 'clay-btn-secondary'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{isHi ? item.labelHi : item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* SECTION 1: EMOTION DNA */}
      {section === 'emotion_dna' && (
        <EmotionDnaPanel
          account={account}
          language={language}
          onUpdateEmotionDna={onUpdateEmotionDna}
          onOpenTriggerDetective={() => onOpenAssessment('trigger_detective')}
          onExploreLog={(detail) => onRecordExploration('emotion_dna', detail)}
        />
      )}

      {/* SECTION 2: SOUND THERAPY */}
      {section === 'sound_therapy' && (
        <SoundTherapyPanel
          account={account}
          language={language}
          onExploreLog={(detail) => onRecordExploration('sound', detail)}
        />
      )}

      {/* SECTION 3: LOW-MOOD SUPPORT */}
      {section === 'low_mood' && (
        <LowMoodSupportPanel
          account={account}
          language={language}
          onTogglePlanItem={onToggleLowMoodItem}
          onAddPlanItem={onAddLowMoodItem}
          onSaveReflection={onSaveLowMoodReflection}
          onNavigateToTreatment={onNavigateToTreatment}
        />
      )}

      {/* SECTION 4: SLEEP & RECOVERY */}
      {section === 'sleep' && (
        <SleepRecoveryPanel
          account={account}
          language={language}
          onAddSleepLog={onAddSleepLog}
          onExploreSleep={(detail) => onRecordExploration('sleep', detail)}
        />
      )}

      {/* SECTION 5: MINDGYM */}
      {section === 'mindgym' && (
        <MindGymPanel
          account={account}
          language={language}
          onAddSession={onAddMindGymSession}
        />
      )}

      {/* SECTION 6: POEMS & STORIES */}
      {section === 'poems_stories' && (
        <PoemsStoriesPanel
          language={language}
          onExploreLog={(detail) => onRecordExploration('poems_stories', detail)}
        />
      )}
    </div>
  )
}
