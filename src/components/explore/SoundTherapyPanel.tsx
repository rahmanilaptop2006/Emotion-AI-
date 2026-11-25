import { useEffect, useState } from 'react'
import {
  Activity,
  AudioLines,
  Brain,
  Clock,
  Headphones,
  Pause,
  Play,
  Sparkles,
  Square,
  Volume2,
} from 'lucide-react'
import { getSuggestedSoundTherapy } from '../../services/assessments'
import {
  CALMING_SOUND_TRACKS,
  SOUND_THERAPY_CATEGORIES,
  soundSynthesizer,
  type CalmingSoundTrack,
  type SoundTrackId,
} from '../../services/soundSynthesizer'
import type { Language, SoundTherapyCategory, UserAccount } from '../../types'

interface SoundTherapyPanelProps {
  account: UserAccount
  language: Language
  onExploreLog: (detail?: string) => void
}

function formatTimerClock(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function SoundTherapyPanel({
  account,
  language,
  onExploreLog,
}: SoundTherapyPanelProps) {
  const isHi = language === 'hi'
  const [activeTrack, setActiveTrack] = useState<SoundTrackId | null>(() =>
    soundSynthesizer.getActiveTrack()
  )
  const [volume, setVolume] = useState(0.6)
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const [selectedLibraryCategory, setSelectedLibraryCategory] = useState<
    SoundTherapyCategory | 'all'
  >('all')

  // Compute automatic Sound Therapy recommendation from patient's latest assessment & factor levels
  const autoSuggestion = getSuggestedSoundTherapy({
    dailyMood: account.latestAssessment?.dailyMood,
    stressRating: account.latestAssessment?.stressRating,
    sleepQuality: account.latestAssessment?.sleepQuality,
    phq9Score: account.latestAssessment?.phq9Score,
    gad7Score: account.latestAssessment?.gad7Score,
    pss10Score: account.latestAssessment?.pss10Score,
    stressLabel: account.factors.stress,
    sleepHours: account.factors.sleepHours,
  })

  const featuredTracks = CALMING_SOUND_TRACKS.filter((t) => t.featuredSound)
  const libraryTracks = CALMING_SOUND_TRACKS.filter(
    (t) =>
      !t.featuredSound &&
      (selectedLibraryCategory === 'all' || t.category === selectedLibraryCategory)
  )

  useEffect(() => {
    if (!activeTrack) {
      setSessionSeconds(0)
      return
    }
    const timer = window.setInterval(() => {
      setSessionSeconds((prev) => prev + 1)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [activeTrack])

  useEffect(() => {
    return () => {
      soundSynthesizer.stop()
    }
  }, [])

  const handleTogglePlay = (track: CalmingSoundTrack) => {
    if (activeTrack === track.id) {
      soundSynthesizer.stop()
      setActiveTrack(null)
      return
    }
    soundSynthesizer.play(track.id, volume)
    setActiveTrack(track.id)
    setSessionSeconds(0)
    onExploreLog(track.name)
  }

  const handleStop = () => {
    soundSynthesizer.stop()
    setActiveTrack(null)
  }

  const handleVolumeChange = (nextVol: number) => {
    setVolume(nextVol)
    soundSynthesizer.setVolume(nextVol)
  }

  const activeTrackObj = activeTrack
    ? CALMING_SOUND_TRACKS.find((t) => t.id === activeTrack) || null
    : null

  return (
    <div className="space-y-6">
      {/* Header & Master Playback Controls */}
      <div className="rounded-[26px] clay-card p-6 sm:p-7 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <h3 className="font-display text-xl sm:text-2xl font-bold text-[#1B251A] dark:text-[#E5E8CE]">
              {isHi ? 'साउंड थेरेपी (ध्वनि चिकित्सा)' : 'Sound Therapy'}
            </h3>
            <p className="text-xs sm:text-sm text-[#495847] dark:text-[#A8C6A4] leading-relaxed">
              {isHi
                ? 'तनाव के स्तर, नींद और एकाग्रता के अनुसार 40Hz गामा तरंगें, तिब्बती सिंगिंग बाउल और 432Hz बांसुरी ध्वनि।'
                : 'Curated 40Hz Gamma brainwaves, Tibetan singing bowls, and 432Hz bamboo flute sessions tailored to your emotional levels.'}
            </p>
          </div>

          <div className="clay-well rounded-[16px] px-4 py-2.5 flex items-center gap-3 min-w-[210px]">
            <Volume2 className="w-4 h-4 text-[#344932] dark:text-[#A8C6A4] shrink-0" />
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              aria-label={isHi ? 'ध्वनि स्तर' : 'Sound therapy volume'}
              className="w-full accent-[#5E7D5B]"
            />
            <span className="text-[11px] font-mono-num font-semibold w-9 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>

        {/* Auto-Recommended Banner based on Patient Levels */}
        <div className="rounded-[20px] clay-card-tint p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <span className="w-11 h-11 rounded-[14px] clay-orb-sage text-[#142013] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </span>
            <div className="min-w-0 space-y-0.5">
              <div className="text-xs font-semibold text-[#344932] dark:text-[#A8C6A4]">
                {isHi
                  ? `आपके स्तर के लिए स्वचालित सुझाव · तनाव: ${account.factors.stress} · नींद: ${account.factors.sleepHours}h`
                  : `Auto-Suggested for Your Levels · Stress: ${account.factors.stress} · Sleep: ${account.factors.sleepHours}h`}
              </div>
              <div className="font-display text-sm sm:text-base font-bold text-[#1B251A] dark:text-[#E5E8CE]">
                {isHi ? autoSuggestion.titleHi : autoSuggestion.title}
              </div>
              <p className="text-xs text-[#495847] dark:text-[#C5D1BF]">
                {isHi ? autoSuggestion.reasonHi : autoSuggestion.reason}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const target = CALMING_SOUND_TRACKS.find((t) => t.id === autoSuggestion.trackId)
              if (target) handleTogglePlay(target)
            }}
            className="clay-btn-primary px-4 py-2.5 rounded-[14px] text-xs font-semibold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            {activeTrack === autoSuggestion.trackId ? (
              <>
                <Pause className="w-4 h-4" />
                <span>{isHi ? 'रोकें' : 'Pause Suggested'}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>{isHi ? 'सुझाई गई ध्वनि चलाएं' : 'Play Suggested'}</span>
              </>
            )}
          </button>
        </div>

        {/* Active Playback Bar */}
        {activeTrackObj && (
          <div className="rounded-[18px] clay-well px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-[11px] clay-btn-primary flex items-center justify-center shrink-0">
                <AudioLines className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">
                  {isHi ? activeTrackObj.nameHi : activeTrackObj.name}
                </div>
                <div className="text-[11px] font-mono-num text-[#495847] dark:text-[#A8C6A4]">
                  {isHi ? 'सक्रिय सत्र' : 'Playing'} · {formatTimerClock(sessionSeconds)}
                  {activeTrackObj.frequencyBadge ? ` · ${activeTrackObj.frequencyBadge}` : ''}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStop}
              className="clay-btn-danger px-3.5 py-2 rounded-[12px] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Square className="w-3.5 h-3.5" />
              <span>{isHi ? 'बंद करें' : 'Stop Audio'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 3 Curated Featured Sound Therapy Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {featuredTracks.map((track) => {
          const isPlaying = activeTrack === track.id
          const isSuggested = autoSuggestion.trackId === track.id
          const TrackIcon =
            track.id === 'locked_in_40hz_gamma'
              ? Brain
              : track.id === 'tibetan_cleaning_energy'
                ? Activity
                : Headphones

          return (
            <div
              key={track.id}
              className={`rounded-[24px] p-5 flex flex-col justify-between gap-4 transition-all ${
                isPlaying ? 'clay-option-selected' : 'clay-card clay-card-interactive'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 ${
                      isPlaying ? 'bg-white/20 text-white' : 'clay-orb-sage text-[#142013]'
                    }`}
                  >
                    <TrackIcon className="w-5 h-5" />
                  </span>
                  <div
                    className={`text-[11px] font-mono-num text-right ${
                      isPlaying ? 'text-white/85' : 'text-[#495847] dark:text-[#A8C6A4]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{track.duration}</span>
                    </span>
                    {isSuggested && (
                      <div className="font-sans font-semibold mt-0.5">
                        {isHi ? 'अनुशंसित' : 'Suggested'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div
                    className={`text-[11px] font-medium ${
                      isPlaying ? 'text-white/80' : 'text-[#495847] dark:text-[#A8C6A4]'
                    }`}
                  >
                    {track.frequencyBadge}
                  </div>
                  <h4 className="font-display text-base font-bold leading-snug">
                    {isHi ? track.nameHi : track.name}
                  </h4>
                  <p
                    className={`text-xs leading-relaxed ${
                      isPlaying ? 'text-white/85' : 'text-[#495847] dark:text-[#C5D1BF]'
                    }`}
                  >
                    {isHi ? track.detailHi : track.detail}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <span
                  className={`text-[11px] font-mono-num ${
                    isPlaying ? 'text-white/90' : 'text-[#495847] dark:text-[#A8C6A4]'
                  }`}
                >
                  {isPlaying
                    ? `${isHi ? 'चल रहा है' : 'Active'} · ${formatTimerClock(sessionSeconds)}`
                    : track.id === 'locked_in_40hz_gamma'
                      ? isHi
                        ? 'डीप वर्क फ़्लो'
                        : 'Deep Work Flow'
                      : track.id === 'tibetan_cleaning_energy'
                        ? isHi
                          ? 'एनर्जी हीलिंग'
                          : 'Energy Cleansing'
                        : isHi
                          ? 'कॉर्टिसोल शांति'
                          : 'Cortisol Calm'}
                </span>

                <button
                  type="button"
                  onClick={() => handleTogglePlay(track)}
                  className={`px-4 py-2 rounded-[13px] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isPlaying ? 'bg-white text-[#1B251A]' : 'clay-btn-primary'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>{isHi ? 'रोकें' : 'Pause'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>{isHi ? 'चलाएं' : 'Play'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Additional Clinical Soundscape Library */}
      <div className="rounded-[24px] clay-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-display text-sm sm:text-base font-bold">
              {isHi ? 'अतिरिक्त चिकित्सीय ध्वनि पुस्तकालय' : 'Clinical Soundscape Library'}
            </h4>
            <p className="text-xs text-[#495847] dark:text-[#A8C6A4]">
              {isHi
                ? 'बाइनॉरल बीट्स, व्हाइट/पिंक/ब्राउन नॉइज़ और टिनिटस राहत।'
                : 'Binaural frequencies, color noises, vibroacoustic waves, and nature ambience.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedLibraryCategory('all')}
              className={`px-3 py-1.5 rounded-[11px] text-xs font-semibold cursor-pointer whitespace-nowrap ${
                selectedLibraryCategory === 'all' ? 'clay-btn-primary' : 'clay-btn-secondary'
              }`}
            >
              {isHi ? 'सभी' : 'All'}
            </button>
            {SOUND_THERAPY_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedLibraryCategory(cat.id)}
                className={`px-3 py-1.5 rounded-[11px] text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  selectedLibraryCategory === cat.id ? 'clay-btn-primary' : 'clay-btn-secondary'
                }`}
              >
                {isHi ? cat.labelHi : cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {libraryTracks.map((track) => {
            const isPlaying = activeTrack === track.id
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => handleTogglePlay(track)}
                className={`rounded-[16px] p-3.5 text-left flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  isPlaying ? 'clay-option-selected' : 'clay-tile clay-card-interactive'
                }`}
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="text-xs font-bold truncate">
                    {isHi ? track.nameHi : track.name}
                  </div>
                  <div
                    className={`text-[11px] truncate ${
                      isPlaying ? 'text-white/80' : 'text-[#495847] dark:text-[#A8B7A4]'
                    }`}
                  >
                    {isHi ? track.detailHi : track.detail}
                  </div>
                </div>
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isPlaying ? 'bg-white text-[#1B251A]' : 'clay-btn-secondary'
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
