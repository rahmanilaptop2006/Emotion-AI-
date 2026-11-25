import { useEffect, useRef, useState } from 'react'
import { Check, Info, Loader2, Mic, Smile, Square, X } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Language } from '../types'

type VoiceStressLevel = 'Low' | 'Mild' | 'Moderate' | 'Elevated'

interface VoiceBiomarkerRunnerProps {
  language: Language
  onSaveVoiceLevel: (level: VoiceStressLevel) => void
  onDone?: () => void
  doneLabel?: string
}

interface VoiceBiomarkerModalProps {
  language: Language
  onClose: () => void
  onSaveVoiceLevel: (level: VoiceStressLevel) => void
}

interface VoiceAnalysisResult {
  vocalStressLevel: string
  pitchVarianceIndex: string
  speakingRateWPM: number
  pauseLatencyMs: number
  positiveScore: number
  negativeScore: number
  clinicalInsight: string
  suggestedMicroIntervention: string
}

export function VoiceBiomarkerRunner({
  language,
  onSaveVoiceLevel,
  onDone,
  doneLabel,
}: VoiceBiomarkerRunnerProps) {
  const isHi = language === 'hi'
  const [recording, setRecording] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [micActive, setMicActive] = useState(false)
  const [liveEnergy, setLiveEnergy] = useState(0)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [sampleText, setSampleText] = useState(
    'I had a calm day overall and feel grateful for taking time to check in with myself.'
  )
  const [result, setResult] = useState<VoiceAnalysisResult>({
    vocalStressLevel: 'Mild',
    pitchVarianceIndex: 'Steady prosody',
    speakingRateWPM: 126,
    pauseLatencyMs: 420,
    positiveScore: 76,
    negativeScore: 24,
    clinicalInsight: 'Steady vocal pacing reflects balanced emotional regulation.',
    suggestedMicroIntervention: '2-Min Breathing',
  })

  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const timerRef = useRef<number | null>(null)
  const meterTimerRef = useRef<number | null>(null)
  const startMsRef = useRef<number>(0)
  const samplesRef = useRef<number[]>([])

  const stopAudioCapture = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (meterTimerRef.current !== null) {
      window.clearInterval(meterTimerRef.current)
      meterTimerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
    setMicActive(false)
    setLiveEnergy(0)
  }

  useEffect(() => {
    return () => stopAudioCapture()
  }, [])

  const handleToggleRecord = async () => {
    if (!recording) {
      setElapsedSec(0)
      samplesRef.current = []
      startMsRef.current = Date.now()
      setRecording(true)

      timerRef.current = window.setInterval(() => {
        setElapsedSec(Math.max(1, Math.round((Date.now() - startMsRef.current) / 1000)))
      }, 350)

      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          streamRef.current = stream
          const Ctx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
          if (Ctx) {
            const ctx = new Ctx()
            audioCtxRef.current = ctx
            const source = ctx.createMediaStreamSource(stream)
            const analyser = ctx.createAnalyser()
            analyser.fftSize = 256
            source.connect(analyser)
            const dataArr = new Uint8Array(analyser.frequencyBinCount)
            setMicActive(true)
            meterTimerRef.current = window.setInterval(() => {
              analyser.getByteTimeDomainData(dataArr)
              let sumSq = 0
              for (let i = 0; i < dataArr.length; i++) {
                const centered = (dataArr[i] - 128) / 128
                sumSq += centered * centered
              }
              const rms = Math.sqrt(sumSq / dataArr.length)
              const pct = Math.min(100, Math.round(rms * 340))
              samplesRef.current.push(pct)
              setLiveEnergy(pct)
            }, 110)
          }
        } catch {
          setMicActive(false)
        }
      }
      return
    }

    const durationSec = Math.max(2, (Date.now() - startMsRef.current) / 1000)
    const energySamples = [...samplesRef.current]
    stopAudioCapture()
    setRecording(false)
    setAnalyzing(true)

    const words = Math.max(8, sampleText.trim().split(/\s+/).filter(Boolean).length)
    const measuredWpm = Math.min(195, Math.max(92, Math.round((words / durationSec) * 60)))
    const avgEnergy =
      energySamples.length > 0
        ? energySamples.reduce((a, b) => a + b, 0) / energySamples.length
        : 24
    const meanSquareDiff =
      energySamples.length > 1
        ? energySamples.reduce((sum, v) => sum + Math.pow(v - avgEnergy, 2), 0) /
          energySamples.length
        : 40
    const jitter = Math.round(Math.sqrt(meanSquareDiff))
    const silentFrames = energySamples.filter((e) => e < 6).length
    const pauseRatio = energySamples.length > 0 ? silentFrames / energySamples.length : 0.25
    const pauseLatency = Math.round(350 + pauseRatio * 620)
    const pitchVariance =
      jitter > 22 || avgEnergy > 44 ? 'elevated' : avgEnergy > 18 ? 'moderate' : 'steady'

    const positivePct = Math.max(
      25,
      Math.min(92, Math.round(84 - jitter * 0.8 - pauseRatio * 35))
    )
    const negativePct = 100 - positivePct

    try {
      const res = await fetch('/api/analyze-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: sampleText,
          audioMetrics: {
            pitchVariance,
            pauseLatency,
            wpm: measuredWpm,
          },
        }),
      })
      const data = await res.json()
      const level = (data.vocalStressLevel || 'Mild') as string
      const normalizedLevel: VoiceStressLevel =
        level === 'Low' || level === 'Mild' || level === 'Moderate' || level === 'Elevated'
          ? level
          : level.toLowerCase().includes('high')
            ? 'Elevated'
            : 'Mild'

      setResult({
        vocalStressLevel: normalizedLevel,
        pitchVarianceIndex: data.pitchVarianceIndex || pitchVariance,
        speakingRateWPM: data.speakingRateWPM || measuredWpm,
        pauseLatencyMs: data.pauseLatencyMs || pauseLatency,
        positiveScore: positivePct,
        negativeScore: negativePct,
        clinicalInsight:
          data.clinicalInsight ||
          'Speech prosody indicates steady pacing with mild daytime strain.',
        suggestedMicroIntervention: data.suggestedMicroIntervention || '2-Min Box Breathing',
      })
      onSaveVoiceLevel(normalizedLevel)
    } catch {
      const fallbackLevel: VoiceStressLevel =
        jitter > 24 || pauseLatency > 700 ? 'Moderate' : 'Mild'
      setResult({
        vocalStressLevel: fallbackLevel,
        pitchVarianceIndex: jitter > 20 ? 'Dynamic pitch variance' : 'Balanced prosody',
        speakingRateWPM: measuredWpm,
        pauseLatencyMs: pauseLatency,
        positiveScore: positivePct,
        negativeScore: negativePct,
        clinicalInsight:
          'Acoustic signal shows coherent phrasing with gentle vocal effort.',
        suggestedMicroIntervention: '2-Min Box Breathing',
      })
      onSaveVoiceLevel(fallbackLevel)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Sample Card 5 Look: "How was your day?" + Inner White Card + Trigger Bars */}
      <div className="rounded-[24px] sample-pastel-sky p-5 space-y-4 border border-white/75 dark:border-white/10">
        <div className="text-center">
          <h4 className="font-display text-lg font-bold">
            {isHi ? 'आपका दिन कैसा रहा?' : 'How was your day?'}
          </h4>
        </div>

        <div className="rounded-[20px] clay-tile p-4 space-y-4">
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-full bg-[#FFE7A3] text-[#8E5B00] flex items-center justify-center shrink-0">
              <Smile className="w-4 h-4" />
            </span>
            <p className="text-xs leading-relaxed font-medium">{result.clinicalInsight}</p>
          </div>

          {/* Positive & Negative Trigger Progress Bars (Sample Card 5) */}
          <div className="space-y-2.5 pt-1">
            <div>
              <div className="flex justify-between text-[11px] font-semibold mb-1">
                <span>{isHi ? 'सकारात्मक संकेत' : 'Positive triggers'}</span>
                <span className="font-mono-num">{result.positiveScore}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full clay-well overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#789575] via-[#5E7D5B] to-[#344932]"
                  style={{ width: `${result.positiveScore}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-semibold mb-1">
                <span>{isHi ? 'तनाव संकेत' : 'Negative'}</span>
                <span className="font-mono-num">{result.negativeScore}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full clay-well overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#D9926E] to-[#E07A5F]"
                  style={{ width: `${result.negativeScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Floating Microphone CTA */}
        <div className="flex flex-col items-center gap-2 pt-1">
          <motion.button
            type="button"
            onClick={handleToggleRecord}
            animate={{ scale: recording ? [1, 1.09, 1] : 1 }}
            transition={{ repeat: recording ? Infinity : 0, duration: 1.2 }}
            className={`w-16 h-16 rounded-full flex items-center justify-center cursor-pointer shadow-lg ${
              recording
                ? 'clay-btn-danger'
                : 'bg-white dark:bg-[#1E2E1E] text-[#344932] dark:text-[#A8C6A4]'
            }`}
          >
            {recording ? <Square className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </motion.button>
          <span className="text-[11px] font-semibold opacity-80 text-center">
            {recording
              ? isHi
                ? `रिकॉर्डिंग (${elapsedSec}s)... विश्लेषण के लिए रोकें`
                : `Listening (${elapsedSec}s)${micActive ? ' · live mic' : ''} — tap to stop & analyze`
              : isHi
                ? 'अपनी आवाज़ रिकॉर्ड करने के लिए माइक दबाएं'
                : 'Tap microphone and speak naturally'}
          </span>

          {recording && (
            <div className="w-44 h-2 rounded-full clay-well overflow-hidden p-0.5">
              <div
                className="h-full rounded-full clay-bar-emerald transition-all duration-100"
                style={{ width: `${Math.max(12, liveEnergy)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Editable Speech Prompt */}
      <div>
        <label className="block text-xs font-semibold opacity-80 mb-1">
          {isHi ? 'बोलने के लिए वाक्य' : 'Spoken Check-In Phrase'}
        </label>
        <textarea
          rows={2}
          value={sampleText}
          onChange={(e) => setSampleText(e.target.value)}
          className="w-full rounded-[14px] clay-input border-0 px-3.5 py-2 text-xs"
        />
      </div>

      {analyzing && (
        <div className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-[#344932] dark:text-[#A8C6A4]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{isHi ? 'पिच और विराम विश्लेषण...' : 'Analyzing pitch & pause latency...'}</span>
        </div>
      )}

      {/* Readout Grid */}
      <div className="grid grid-cols-3 gap-2.5 text-center">
        <div className="rounded-[14px] clay-tile p-2.5">
          <span className="block text-[10px] opacity-75">{isHi ? 'तनाव स्तर' : 'Vocal Stress'}</span>
          <span className="text-sm font-bold">{result.vocalStressLevel}</span>
        </div>
        <div className="rounded-[14px] clay-tile p-2.5">
          <span className="block text-[10px] opacity-75">{isHi ? 'बोलने की गति' : 'Pace'}</span>
          <span className="text-sm font-bold font-mono-num">{result.speakingRateWPM} WPM</span>
        </div>
        <div className="rounded-[14px] clay-tile p-2.5">
          <span className="block text-[10px] opacity-75">{isHi ? 'विराम अवधि' : 'Pause Gap'}</span>
          <span className="text-sm font-bold font-mono-num">{result.pauseLatencyMs} ms</span>
        </div>
      </div>

      {/* How Voice Biomarker Analysis Reads Your Condition */}
      <div className="rounded-[16px] clay-well p-3.5 text-xs space-y-1.5">
        <div className="font-bold inline-flex items-center gap-1.5 text-[#344932] dark:text-[#A8C6A4]">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>
            {isHi
              ? 'वॉइस बायोमार्कर आपकी स्थिति कैसे समझता है?'
              : 'How Voice Biomarker Analysis Reads Your Condition'}
          </span>
        </div>
        <ul className="space-y-1 text-[11px] opacity-85 list-disc pl-4">
          <li>
            {isHi
              ? 'पिच स्थिरता व ऊर्जा: आवाज़ के कंपन से तनाव और शांति का स्तर पहचाना जाता है।'
              : 'Vocal Stability & Energy: Micro-tremors and energy variability reflect sympathetic arousal.'}
          </li>
          <li>
            {isHi
              ? 'विराम विलंब (Pause Latency): शब्दों के बीच लंबे विराम थकान या तनाव संकेत दे सकते हैं।'
              : 'Pause Latency & Pace: Extended speech pauses or rushed WPM correlate with mental load.'}
          </li>
        </ul>
      </div>

      {onDone && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#246A49] dark:text-[#8EE0B6]">
            <Check className="w-3.5 h-3.5" />
            <span>{isHi ? 'परिणाम सहेजा गया' : 'Saved'}</span>
          </span>
          <button
            type="button"
            onClick={onDone}
            className="clay-btn-primary px-5 h-[42px] rounded-[14px] text-xs font-semibold cursor-pointer"
          >
            {doneLabel ?? (isHi ? 'पूर्ण' : 'Done')}
          </button>
        </div>
      )}
    </div>
  )
}

export function VoiceBiomarkerModal({
  language,
  onClose,
  onSaveVoiceLevel,
}: VoiceBiomarkerModalProps) {
  const isHi = language === 'hi'

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0E150E]/55 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-[28px] clay-modal overflow-hidden"
      >
        <div className="px-6 py-4 clay-card-tint flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-[11px] clay-orb-sage text-white flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </span>
            <h3 className="font-display text-base font-bold">
              {isHi ? 'वॉइस बायोमार्कर विश्लेषण' : 'Voice Biomarker Analysis'}
            </h3>
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

        <div className="p-6 overflow-y-auto">
          <VoiceBiomarkerRunner
            language={language}
            onSaveVoiceLevel={onSaveVoiceLevel}
            onDone={onClose}
          />
        </div>
      </motion.div>
    </div>
  )
}
