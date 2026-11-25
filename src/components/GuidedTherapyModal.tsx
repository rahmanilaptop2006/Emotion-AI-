import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Compass,
  Headphones,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { soundSynthesizer, type SoundTrackId } from '../services/soundSynthesizer'
import type { Language } from '../types'

export type GuidedTherapyMode = 'pmr' | 'imagery' | 'mindfulness'

interface GuidedTherapyModalProps {
  mode: GuidedTherapyMode
  language: Language
  onClose: () => void
}

const PMR_STEPS = [
  {
    region: 'Hands & Forearms',
    regionHi: 'हाथ और अग्रभाग',
    tensePrompt: 'Clench both fists gently for 5 seconds—feel the forearm tension without straining.',
    tensePromptHi: '5 सेकंड के लिए दोनों मुट्ठियां हल्के से बंद करें और खिंचाव महसूस करें।',
    releasePrompt: 'Open fingers wide and let warmth flow into your palms for 10 seconds.',
    releasePromptHi: '10 सेकंड के लिए उंगलियां ढीली छोड़ें और हथेलियों में आराम महसूस करें।',
  },
  {
    region: 'Shoulders & Neck',
    regionHi: 'कंधे और गर्दन',
    tensePrompt: 'Raise your shoulders softly toward your ears and hold steady.',
    tensePromptHi: 'अपने कंधों को धीरे से कानों की ओर उठाकर 5 सेकंड रोकें।',
    releasePrompt: 'Drop your shoulders down completely; feel your collarbones widen.',
    releasePromptHi: 'कंधों को पूरी तरह नीचे छोड़ दें और गर्दन को हल्का महसूस करें।',
  },
  {
    region: 'Brow, Eyes & Jaw',
    regionHi: 'भौंहें, आंखें और जबड़ा',
    tensePrompt: 'Squint lightly and press lips together for 5 seconds.',
    tensePromptHi: 'आंखों को हल्के से बंद करें और जबड़े को 5 सेकंड के लिए कसें।',
    releasePrompt: 'Unclench your jaw, part teeth slightly, and smooth your forehead.',
    releasePromptHi: 'जबड़े को ढीला छोड़ें, माथे की सिलवटें शांत करें।',
  },
  {
    region: 'Chest & Upper Back',
    regionHi: 'छाती और ऊपरी पीठ',
    tensePrompt: 'Take a full breath and draw shoulder blades slightly back.',
    tensePromptHi: 'गहरी सांस लें और कंधों को हल्का पीछे की ओर खींचें।',
    releasePrompt: 'Exhale slowly and allow your ribcage to settle.',
    releasePromptHi: 'धीरे से सांस छोड़ें और छाती को शांत होने दें।',
  },
  {
    region: 'Legs & Feet',
    regionHi: 'पैर और पंजे',
    tensePrompt: 'Curl toes downward and engage calves gently for 5 seconds.',
    tensePromptHi: 'पैरों की उंगलियों को हल्के से मोड़ें और पिंडलियों में तनाव महसूस करें।',
    releasePrompt: 'Uncurl toes and feel heaviness melt into the floor.',
    releasePromptHi: 'पैरों को पूरी तरह ढीला छोड़ दें और विश्राम महसूस करें।',
  },
]

const IMAGERY_SCENES: {
  id: SoundTrackId
  title: string
  titleHi: string
  cue: string
  cueHi: string
}[] = [
  {
    id: 'zen_nature',
    title: 'Zen Forest Stream & Birds',
    titleHi: 'ज़ेन वन झरना व पक्षी स्वर',
    cue: 'Picture dappled morning light filtering over a clear woodland brook while soft birdsong softens every exhale.',
    cueHi: 'कल्पना करें कि पेड़ों से छनकर आती सुबह की रोशनी, बहते झरने और पक्षियों के मधुर स्वर हर सांस के साथ मन को शांत कर रहे हैं।',
  },
  {
    id: 'autumn_guitar',
    title: 'Cozy Acoustic Guitar & Rain',
    titleHi: 'सुकून भरा एकॉस्टिक गिटार व बारिश',
    cue: 'Listen to warm fingerpicked acoustic guitar strings over gentle autumn raindrops while resting comfortably indoors.',
    cueHi: 'हल्की बारिश की बूंदों के साथ कोमल एकॉस्टिक गिटार की धुन सुनें और भीतर सुरक्षित शांति का अनुभव करें।',
  },
  {
    id: 'celestial_drone',
    title: 'Deep Celestial Sanctuary Drone',
    titleHi: 'गहन अंतरिक्ष शांति नाद',
    cue: 'Drift into a spacious, quiet night sanctuary as deep ambient harmonics slow and steady your breathing.',
    cueHi: 'गहरे शांत अंतरिक्ष की ओर ध्यान ले जाएं क्योंकि कोमल ध्वनि तरंगें आपकी सांस और हृदय गति को स्थिर करती हैं।',
  },
  {
    id: 'sleep_resonance',
    title: '432Hz + 528Hz Deep Sanctuary',
    titleHi: '432Hz + 528Hz गहरी शांति क्षितिज',
    cue: 'Rest your gaze on a soft golden horizon as warm 432Hz and 528Hz resonance eases bodily tension.',
    cueHi: 'सुनहरे क्षितिज पर ध्यान टिकाएं क्योंकि 432Hz + 528Hz ध्वनि तरंगें पूरे शरीर के तनाव को शांत करती हैं।',
  },
]

const MINDFULNESS_CUES = [
  {
    phase: 'Arrive & Notice',
    phaseHi: 'उपस्थिति और ध्यान',
    text: 'Feel the contact points of your feet and back against your chair. Nothing needs to be fixed right now.',
    textHi: 'अपनी पीठ और पैरों के सहारे को महसूस करें। इस पल कुछ भी ठीक करने की जल्दी नहीं है।',
  },
  {
    phase: 'Breath as Anchor',
    phaseHi: 'सांस का सहारा',
    text: 'Follow the natural coolness of air entering your nostrils and the warmth of each unhurried exhale.',
    textHi: 'भीतर आती ठंडी हवा और बाहर जाती गर्म सांस के प्राकृतिक प्रवाह को बिना बदले देखें।',
  },
  {
    phase: 'Thoughts as Clouds',
    phaseHi: 'विचारों का अवलोकन',
    text: 'When a busy thought arises, name it softly ("planning", "worry") and let it drift past like a cloud.',
    textHi: 'जब कोई व्यस्त विचार आए, तो उसे हल्के से पहचानें और बिना उलझे गुजर जाने दें।',
  },
  {
    phase: 'Kind Awareness',
    phaseHi: 'करुणामय जागरूकता',
    text: 'Rest in a spacious, unhurried quiet before gently returning attention to your room.',
    textHi: 'कमरे में लौटने से पहले इस शांत और स्थिर जागरूकता में कुछ क्षण विश्राम करें।',
  },
]

export function GuidedTherapyModal({ mode, language, onClose }: GuidedTherapyModalProps) {
  const isHi = language === 'hi'
  const [running, setRunning] = useState(true)

  // PMR state
  const [pmrIdx, setPmrIdx] = useState(0)
  const [pmrPhase, setPmrPhase] = useState<'tense' | 'release'>('tense')
  const [pmrSeconds, setPmrSeconds] = useState(5)
  const [pmrCompleted, setPmrCompleted] = useState(false)

  // Imagery state
  const [sceneIdx, setSceneIdx] = useState(0)
  const [imagerySeconds, setImagerySeconds] = useState(300) // 5 min
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [volume, setVolume] = useState(0.55)

  // Mindfulness state
  const [mindSeconds, setMindSeconds] = useState(300) // 5 min

  // PMR ticker
  useEffect(() => {
    if (mode !== 'pmr' || !running || pmrCompleted) return
    const timer = window.setInterval(() => {
      setPmrSeconds((prev) => {
        if (prev > 1) return prev - 1
        if (pmrPhase === 'tense') {
          setPmrPhase('release')
          return 10
        }
        if (pmrIdx + 1 >= PMR_STEPS.length) {
          setPmrCompleted(true)
          setRunning(false)
          return 0
        }
        setPmrIdx((idx) => idx + 1)
        setPmrPhase('tense')
        return 5
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [mode, running, pmrPhase, pmrIdx, pmrCompleted])

  // Imagery ticker
  useEffect(() => {
    if (mode !== 'imagery' || !running) return
    const timer = window.setInterval(() => {
      setImagerySeconds((prev) => {
        if (prev <= 1) {
          setRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [mode, running])

  // Mindfulness ticker
  useEffect(() => {
    if (mode !== 'mindfulness' || !running) return
    const timer = window.setInterval(() => {
      setMindSeconds((prev) => {
        if (prev <= 1) {
          setRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [mode, running])

  // Clean up audio on unmount if started here
  useEffect(() => {
    return () => {
      if (mode === 'imagery' && audioPlaying) {
        soundSynthesizer.stop()
      }
    }
  }, [mode, audioPlaying])

  const formatMMSS = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const toggleSceneAudio = (idx: number) => {
    const track = IMAGERY_SCENES[idx].id
    if (audioPlaying && sceneIdx === idx) {
      soundSynthesizer.stop()
      setAudioPlaying(false)
    } else {
      soundSynthesizer.stop()
      soundSynthesizer.play(track, volume)
      setSceneIdx(idx)
      setAudioPlaying(true)
    }
  }

  const headerTitle =
    mode === 'pmr'
      ? isHi
        ? 'प्रगतिशील मांसपेशी विश्राम (PMR)'
        : 'Progressive Muscle Relaxation'
      : mode === 'imagery'
        ? isHi
          ? 'निर्देशित शांत कल्पना (Guided Imagery)'
          : 'Guided Imagery & Nature Audio'
        : isHi
          ? '5-मिनट माइंडफुलनेस अभ्यास'
          : 'Mindfulness Practice (5 min)'

  const HeaderIcon = mode === 'pmr' ? Sparkles : mode === 'imagery' ? Headphones : Compass

  const mindCueIndex = Math.min(
    MINDFULNESS_CUES.length - 1,
    Math.floor(((300 - mindSeconds) / 300) * MINDFULNESS_CUES.length)
  )

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
        className="w-full max-w-lg rounded-[28px] clay-modal overflow-hidden text-[#1B251A] dark:text-[#E5E8CE]"
      >
        <div className="px-6 py-4 bg-[#E7ECD8]/85 dark:bg-[#232F22]/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-[11px] clay-orb-sage text-[#142013] flex items-center justify-center">
              <HeaderIcon className="w-4 h-4" />
            </span>
            <h3 className="font-display text-base font-bold">{headerTitle}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="clay-btn-secondary p-2 rounded-[11px] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {mode === 'pmr' && (
            <>
              {pmrCompleted ? (
                <div className="text-center py-4 space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-full clay-orb-sage text-[#142013] flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="font-display text-lg font-bold">
                    {isHi ? 'संपूर्ण शरीर विश्राम पूर्ण' : 'Full-Body Muscle Release Complete'}
                  </div>
                  <p className="text-sm text-[#495847] dark:text-[#A8B7A4]">
                    {isHi
                      ? 'सभी 5 प्रमुख मांसपेशी समूहों से तनाव मुक्त हो चुका है।'
                      : 'You completed all 5 somatic tension-and-release cycles across the body.'}
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPmrIdx(0)
                        setPmrPhase('tense')
                        setPmrSeconds(5)
                        setPmrCompleted(false)
                        setRunning(true)
                      }}
                      className="clay-btn-secondary px-4 h-[42px] rounded-[14px] text-xs font-semibold cursor-pointer"
                    >
                      {isHi ? 'फिर से करें' : 'Repeat Session'}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="clay-btn-primary px-5 h-[42px] rounded-[14px] text-xs font-semibold cursor-pointer"
                    >
                      {isHi ? 'पूर्ण' : 'Done'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs font-semibold text-[#495847] dark:text-[#A8B7A4]">
                    <span>
                      {isHi
                        ? `चरण ${pmrIdx + 1} / ${PMR_STEPS.length}`
                        : `Muscle Group ${pmrIdx + 1} of ${PMR_STEPS.length}`}
                    </span>
                    <span className="font-mono-num">{pmrSeconds}s</span>
                  </div>

                  <div className="clay-well rounded-[22px] p-5 text-center space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#496346] dark:text-[#98B495]">
                      {pmrPhase === 'tense'
                        ? isHi
                          ? 'हल्का तनाव (5 सेकंड)'
                          : 'Gentle Engage (5s)'
                        : isHi
                          ? 'गहरा विश्राम (10 सेकंड)'
                          : 'Slow Release (10s)'}
                    </div>
                    <h4 className="font-display text-xl font-bold">
                      {isHi ? PMR_STEPS[pmrIdx].regionHi : PMR_STEPS[pmrIdx].region}
                    </h4>
                    <p className="text-sm text-[#495847] dark:text-[#C5D1BF] leading-relaxed">
                      {pmrPhase === 'tense'
                        ? isHi
                          ? PMR_STEPS[pmrIdx].tensePromptHi
                          : PMR_STEPS[pmrIdx].tensePrompt
                        : isHi
                          ? PMR_STEPS[pmrIdx].releasePromptHi
                          : PMR_STEPS[pmrIdx].releasePrompt}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setRunning((r) => !r)}
                      className="clay-btn-primary inline-flex items-center gap-2 px-5 h-[44px] rounded-[15px] text-xs font-semibold cursor-pointer"
                    >
                      {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      <span>{running ? (isHi ? 'रोकें' : 'Pause') : isHi ? 'शुरू करें' : 'Resume'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (pmrIdx + 1 >= PMR_STEPS.length) {
                          setPmrCompleted(true)
                          setRunning(false)
                        } else {
                          setPmrIdx((i) => i + 1)
                          setPmrPhase('tense')
                          setPmrSeconds(5)
                        }
                      }}
                      className="clay-btn-secondary inline-flex items-center gap-1.5 px-4 h-[44px] rounded-[15px] text-xs font-semibold cursor-pointer"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                      <span>{isHi ? 'अगला समूह' : 'Next Group'}</span>
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {mode === 'imagery' && (
            <>
              <div className="clay-well rounded-[22px] p-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-[#496346] dark:text-[#98B495]">
                  <span>{isHi ? IMAGERY_SCENES[sceneIdx].titleHi : IMAGERY_SCENES[sceneIdx].title}</span>
                  <span className="font-mono-num">{formatMMSS(imagerySeconds)}</span>
                </div>
                <p className="text-sm leading-relaxed text-[#1B251A] dark:text-[#E5E8CE]">
                  {isHi ? IMAGERY_SCENES[sceneIdx].cueHi : IMAGERY_SCENES[sceneIdx].cue}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {IMAGERY_SCENES.map((sc, idx) => {
                  const active = sceneIdx === idx
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => toggleSceneAudio(idx)}
                      className={`p-3 rounded-[16px] text-left text-xs font-semibold transition-all cursor-pointer ${
                        active && audioPlaying ? 'clay-btn-primary' : 'clay-tile clay-card-interactive'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">{isHi ? sc.titleHi : sc.title}</span>
                        {active && audioPlaying ? (
                          <Pause className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Play className="w-3.5 h-3.5 shrink-0" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-[14px] clay-well">
                  <Volume2 className="w-4 h-4 text-[#495847] dark:text-[#A8B7A4]" />
                  <input
                    type="range"
                    min={0.05}
                    max={1}
                    step={0.05}
                    value={volume}
                    aria-label="Imagery sound volume"
                    onChange={(e) => {
                      const nextVol = parseFloat(e.target.value)
                      setVolume(nextVol)
                      if (audioPlaying) {
                        soundSynthesizer.setVolume(nextVol)
                      }
                    }}
                    className="w-24 accent-[#789575]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRunning((r) => !r)}
                    className="clay-btn-primary inline-flex items-center gap-1.5 px-4 h-[42px] rounded-[14px] text-xs font-semibold cursor-pointer"
                  >
                    {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{running ? (isHi ? 'रोकें' : 'Pause') : isHi ? 'शुरू करें' : 'Resume'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundSynthesizer.stop()
                      setAudioPlaying(false)
                      setImagerySeconds(300)
                    }}
                    className="clay-btn-secondary inline-flex items-center gap-1.5 px-3.5 h-[42px] rounded-[14px] text-xs font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isHi ? 'रीसेट' : 'Reset'}</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {mode === 'mindfulness' && (
            <>
              <div className="text-center space-y-4">
                <div className="w-36 h-36 mx-auto rounded-full clay-well flex items-center justify-center">
                  <div className="w-28 h-28 rounded-full clay-orb-sage text-[#142013] flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold font-mono-num">{formatMMSS(mindSeconds)}</span>
                    <span className="text-[11px] font-semibold mt-0.5">
                      {isHi
                        ? MINDFULNESS_CUES[mindCueIndex].phaseHi
                        : MINDFULNESS_CUES[mindCueIndex].phase}
                    </span>
                  </div>
                </div>

                <div className="clay-tile rounded-[20px] p-4 text-sm text-[#1B251A] dark:text-[#E5E8CE] leading-relaxed">
                  {isHi
                    ? MINDFULNESS_CUES[mindCueIndex].textHi
                    : MINDFULNESS_CUES[mindCueIndex].text}
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setRunning((r) => !r)}
                    className="clay-btn-primary inline-flex items-center gap-2 px-5 h-[44px] rounded-[15px] text-xs font-semibold cursor-pointer"
                  >
                    {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{running ? (isHi ? 'रोकें' : 'Pause') : isHi ? 'शुरू करें' : 'Resume'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMindSeconds(300)
                      setRunning(true)
                    }}
                    className="clay-btn-secondary inline-flex items-center gap-1.5 px-4 h-[44px] rounded-[15px] text-xs font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isHi ? 'रीसेट' : 'Reset'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
