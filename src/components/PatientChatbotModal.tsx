import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import {
  ChevronDown,
  Loader2,
  Mic,
  Paperclip,
  RotateCcw,
  Send,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { motion } from 'framer-motion'
import type { ChatMessage, Language, UserAccount } from '../types'

interface PatientChatbotModalProps {
  account: UserAccount
  language: Language
  onClose: () => void
  onTriggerAction: (actionType: 'breathing' | 'sound' | 'tonic' | 'grounding' | 'sos') => void
}

type ChatbotSection = 'text' | 'voice'

function formatCallDuration(seconds: number): string {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

function selectSiriLikeVoice(
  voices: SpeechSynthesisVoice[],
  isHi: boolean
): SpeechSynthesisVoice | undefined {
  if (!voices.length) return undefined
  const langPrefix = isHi ? 'hi' : 'en'
  const matchingLang = voices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix))
  const pool = matchingLang.length > 0 ? matchingLang : voices

  const priorityPatterns = isHi
    ? [/siri/i, /lekha/i, /swara.*natural|swara/i, /neelam/i, /google हिन्दी|google hindi/i, /natural|enhanced/i]
    : [
        /siri.*female|siri/i,
        /samantha/i,
        /ava.*premium|ava.*enhanced|ava/i,
        /allison/i,
        /victoria/i,
        /karen/i,
        /serena/i,
        /aria.*natural|aria/i,
        /jenny.*natural|jenny/i,
        /sonia.*natural|sonia/i,
        /google us english/i,
        /google uk english female/i,
        /natural|enhanced|premium/i,
      ]

  for (const pattern of priorityPatterns) {
    const found = pool.find((v) => pattern.test(v.name))
    if (found) return found
  }

  return pool.find((v) => v.localService) || pool[0]
}

function SparkleFourPoint({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
    </svg>
  )
}

export function PatientChatbotModal({
  account,
  language,
  onClose,
  onTriggerAction,
}: PatientChatbotModalProps) {
  const isHi = language === 'hi'
  const [section, setSection] = useState<ChatbotSection>('text')
  const [modeMenuOpen, setModeMenuOpen] = useState(false)

  // Chat state
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  // Voice Bot state (audio-only via Cartesia, zero written reply shown)
  const [callActive, setCallActive] = useState(false)
  const [callSeconds, setCallSeconds] = useState(0)
  const [listening, setListening] = useState(false)
  const [voiceSpeaking, setVoiceSpeaking] = useState(false)
  const [voiceMuted, setVoiceMuted] = useState(false)
  const [hasSpokenReply, setHasSpokenReply] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const recognitionRef = useRef<any>(null)
  const callActiveRef = useRef(false)
  const voiceMutedRef = useRef(false)
  const messagesRef = useRef(messages)
  const isSendingRef = useRef(false)
  const cachedVoicesRef = useRef<SpeechSynthesisVoice[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const ttsAbortRef = useRef<AbortController | null>(null)
  const lastVoiceReplyRef = useRef<string>('')
  const lastVoiceAudioRef = useRef<{ base64: string; mimeType: string } | null>(null)
  const speechEndTimerRef = useRef<number | null>(null)

  useEffect(() => {
    callActiveRef.current = callActive
  }, [callActive])

  useEffect(() => {
    voiceMutedRef.current = voiceMuted
  }, [voiceMuted])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const loadVoices = () => {
      cachedVoicesRef.current = window.speechSynthesis.getVoices()
    }
    loadVoices()
    window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices)
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', loadVoices)
    }
  }, [])

  useEffect(() => {
    if (!callActive) return
    const timer = window.setInterval(() => {
      setCallSeconds((prev) => prev + 1)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [callActive])

  const stopRecognition = () => {
    if (speechEndTimerRef.current !== null) {
      window.clearTimeout(speechEndTimerRef.current)
      speechEndTimerRef.current = null
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null
        recognitionRef.current.onend = null
        recognitionRef.current.onerror = null
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
      recognitionRef.current = null
    }
    setListening(false)
  }

  const stopSpeech = () => {
    if (ttsAbortRef.current) {
      ttsAbortRef.current.abort()
      ttsAbortRef.current = null
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause()
        audioRef.current.onended = null
        audioRef.current.onerror = null
      } catch {
        // ignore
      }
      audioRef.current = null
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setVoiceSpeaking(false)
  }

  useEffect(() => {
    return () => {
      callActiveRef.current = false
      stopRecognition()
      stopSpeech()
    }
  }, [])

  const startListeningTurn = () => {
    if (typeof window === 'undefined') return

    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRec) {
      setVoiceError(
        isHi
          ? 'इस ब्राउज़र में लाइव माइक स्पीच रिकग्निशन समर्थित नहीं है। कृपया Chrome या Safari में माइक्रोफ़ोन अनुमति दें।'
          : 'Live microphone speech recognition is unavailable or blocked in this browser. Please allow microphone access in Chrome or Safari.'
      )
      setCallActive(false)
      callActiveRef.current = false
      return
    }

    stopRecognition()

    try {
      const rec = new SpeechRec()
      rec.lang = isHi ? 'hi-IN' : 'en-US'
      rec.interimResults = true
      rec.continuous = false
      rec.maxAlternatives = 1
      let finalTranscript = ''
      let latestInterim = ''
      let submittedTurn = false

      const flushSpokenTurn = () => {
        if (submittedTurn) return
        const spoken = (finalTranscript || latestInterim).trim()
        if (!spoken) return
        submittedTurn = true
        stopRecognition()
        void sendMessage(spoken, true)
      }

      rec.onresult = (event: any) => {
        let sawFinal = false
        let interimBatch = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = event.results[i][0]?.transcript || ''
          if (event.results[i].isFinal) {
            finalTranscript += piece + ' '
            sawFinal = true
          } else {
            interimBatch += piece + ' '
          }
        }
        latestInterim = interimBatch.trim()

        if (speechEndTimerRef.current !== null) {
          window.clearTimeout(speechEndTimerRef.current)
        }

        if (sawFinal && finalTranscript.trim()) {
          speechEndTimerRef.current = window.setTimeout(flushSpokenTurn, 140)
        } else if (latestInterim) {
          speechEndTimerRef.current = window.setTimeout(flushSpokenTurn, 700)
        }
      }

      rec.onerror = (event: any) => {
        if (speechEndTimerRef.current !== null) {
          window.clearTimeout(speechEndTimerRef.current)
          speechEndTimerRef.current = null
        }
        setListening(false)
        const errType = event?.error
        if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          setVoiceError(
            isHi
              ? 'माइक्रोफ़ोन अनुमति अस्वीकार की गई। कृपया ब्राउज़र सेटिंग्स में माइक की अनुमति दें।'
              : 'Microphone permission was blocked. Please allow microphone access to talk.'
          )
          setCallActive(false)
          callActiveRef.current = false
        } else if (errType === 'no-speech' && callActiveRef.current) {
          window.setTimeout(() => {
            if (callActiveRef.current && !isSendingRef.current) {
              startListeningTurn()
            }
          }, 140)
        }
      }

      rec.onend = () => {
        if (speechEndTimerRef.current !== null) {
          window.clearTimeout(speechEndTimerRef.current)
          speechEndTimerRef.current = null
        }
        setListening(false)
        if (submittedTurn) return
        const spoken = (finalTranscript || latestInterim).trim()
        if (spoken) {
          submittedTurn = true
          void sendMessage(spoken, true)
        } else if (callActiveRef.current && !isSendingRef.current) {
          window.setTimeout(() => {
            if (callActiveRef.current && !isSendingRef.current) {
              startListeningTurn()
            }
          }, 150)
        }
      }

      recognitionRef.current = rec
      rec.start()
      setListening(true)
      setVoiceError(null)
    } catch {
      setListening(false)
    }
  }

  const speakWithBrowserFallback = (cleanSpeech: string, resumeMicAfter: boolean) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setVoiceSpeaking(false)
      if (resumeMicAfter && callActiveRef.current) {
        globalThis.setTimeout(() => {
          if (callActiveRef.current) startListeningTurn()
        }, 120)
      }
      return
    }

    try {
      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(cleanSpeech)
      utter.lang = isHi ? 'hi-IN' : 'en-US'
      utter.rate = isHi ? 1.04 : 1.12
      utter.pitch = isHi ? 1.08 : 1.12

      const voices =
        cachedVoicesRef.current.length > 0
          ? cachedVoicesRef.current
          : window.speechSynthesis.getVoices()
      const siriVoice = selectSiriLikeVoice(voices, isHi)
      if (siriVoice) utter.voice = siriVoice

      utter.onstart = () => setVoiceSpeaking(true)
      utter.onend = () => {
        setVoiceSpeaking(false)
        if (resumeMicAfter && callActiveRef.current) {
          window.setTimeout(() => {
            if (callActiveRef.current) {
              startListeningTurn()
            }
          }, 100)
        }
      }
      utter.onerror = () => {
        setVoiceSpeaking(false)
        if (resumeMicAfter && callActiveRef.current) {
          window.setTimeout(() => {
            if (callActiveRef.current) startListeningTurn()
          }, 140)
        }
      }

      window.speechSynthesis.speak(utter)
    } catch {
      setVoiceSpeaking(false)
    }
  }

  const playAudioBlob = async (
    audioBlob: Blob,
    cleanSpeechFallback: string,
    resumeMicAfter: boolean
  ) => {
    const objectUrl = URL.createObjectURL(audioBlob)
    audioUrlRef.current = objectUrl
    const audio = new Audio(objectUrl)
    audioRef.current = audio

    audio.onended = () => {
      if (audioUrlRef.current === objectUrl) {
        URL.revokeObjectURL(objectUrl)
        audioUrlRef.current = null
      }
      audioRef.current = null
      setVoiceSpeaking(false)
      if (resumeMicAfter && callActiveRef.current) {
        window.setTimeout(() => {
          if (callActiveRef.current) startListeningTurn()
        }, 100)
      }
    }

    audio.onerror = () => {
      if (audioUrlRef.current === objectUrl) {
        URL.revokeObjectURL(objectUrl)
        audioUrlRef.current = null
      }
      audioRef.current = null
      speakWithBrowserFallback(cleanSpeechFallback, resumeMicAfter)
    }

    await audio.play()
  }

  const playInlineBase64Audio = async (
    base64Audio: string,
    mimeType: string,
    cleanSpeechFallback: string,
    resumeMicAfter: boolean
  ) => {
    stopSpeech()
    if (voiceMutedRef.current) {
      if (resumeMicAfter && callActiveRef.current) {
        window.setTimeout(() => {
          if (callActiveRef.current) startListeningTurn()
        }, 100)
      }
      return
    }
    try {
      setVoiceSpeaking(true)
      const binary = window.atob(base64Audio)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: mimeType || 'audio/mpeg' })
      await playAudioBlob(blob, cleanSpeechFallback, resumeMicAfter)
    } catch {
      speakWithBrowserFallback(cleanSpeechFallback, resumeMicAfter)
    }
  }

  const speakText = async (text: string, resumeMicAfter = false, preferCached = false) => {
    const cleanSpeech = text.replace(/[*_`#>]+/g, '').trim()
    if (!cleanSpeech) return

    if (preferCached && lastVoiceAudioRef.current) {
      await playInlineBase64Audio(
        lastVoiceAudioRef.current.base64,
        lastVoiceAudioRef.current.mimeType,
        cleanSpeech,
        resumeMicAfter
      )
      return
    }

    stopSpeech()

    if (voiceMutedRef.current) {
      if (resumeMicAfter && callActiveRef.current) {
        window.setTimeout(() => {
          if (callActiveRef.current) startListeningTurn()
        }, 100)
      }
      return
    }

    const controller = new AbortController()
    ttsAbortRef.current = controller
    setVoiceSpeaking(true)

    try {
      const res = await fetch('/api/tts/cartesia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanSpeech, language }),
        signal: controller.signal,
      })

      if (controller.signal.aborted) return

      if (res.ok && res.headers.get('content-type')?.includes('audio')) {
        const audioBlob = await res.blob()
        if (controller.signal.aborted) return
        await playAudioBlob(audioBlob, cleanSpeech, resumeMicAfter)
        return
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        setVoiceSpeaking(false)
        return
      }
    }

    speakWithBrowserFallback(cleanSpeech, resumeMicAfter)
  }

  const sendMessage = async (textToSend: string, viaVoice = false) => {
    const trimmed = textToSend.trim()
    if (!trimmed || isSendingRef.current) return

    isSendingRef.current = true
    const priorHistory = messagesRef.current.slice(viaVoice ? -4 : -8)
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, userMsg])
    if (!viaVoice) {
      setInput('')
    }
    setLoading(true)

    try {
      const res = await fetch('/api/patient-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: priorHistory,
          userContext: {
            name: account.name,
            role: account.role,
            wellnessScore: account.wellnessScore,
            factors: account.factors,
            patch: account.patch,
          },
          language,
          isVoice: viaVoice,
        }),
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const data = await res.json()
      const botText =
        typeof data?.reply === 'string' && data.reply.trim()
          ? data.reply.trim()
          : 'I am listening closely. Take a slow breath and tell me how I can help next.'

      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: botText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedAction: data.suggestedAction,
      }
      setMessages((prev) => [...prev, botMsg])

      if (viaVoice) {
        lastVoiceReplyRef.current = botText
        setHasSpokenReply(true)
        const cleanSpeech = botText.replace(/[*_`#>]+/g, '').trim()
        if (typeof data?.audioBase64 === 'string' && data.audioBase64.length > 0) {
          const mimeType = typeof data.audioMimeType === 'string' ? data.audioMimeType : 'audio/mpeg'
          lastVoiceAudioRef.current = { base64: data.audioBase64, mimeType }
          void playInlineBase64Audio(data.audioBase64, mimeType, cleanSpeech, callActiveRef.current)
        } else {
          lastVoiceAudioRef.current = null
          if (!voiceMutedRef.current) {
            speakWithBrowserFallback(cleanSpeech, callActiveRef.current)
          } else if (callActiveRef.current) {
            window.setTimeout(() => {
              if (callActiveRef.current) startListeningTurn()
            }, 100)
          }
        }
      }
    } catch {
      const fallbackText = isHi
        ? 'कनेक्शन में अस्थायी बाधा आई है। नाक से धीरे 3 गहरी सांसें लें—मैं यहीं हूँ।'
        : 'Temporary connection issue. Take three gentle breaths and try asking again.'
      const fallbackAction: ChatMessage['suggestedAction'] = {
        type: 'breathing',
        label: isHi ? '2-मिनट बॉक्स ब्रीदिंग' : 'Start 2-Min Box Breathing',
      }
      const fallbackMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedAction: fallbackAction,
      }
      setMessages((prev) => [...prev, fallbackMsg])
      if (viaVoice) {
        lastVoiceReplyRef.current = fallbackText
        setHasSpokenReply(true)
        void speakText(fallbackText, callActiveRef.current)
      }
    } finally {
      setLoading(false)
      isSendingRef.current = false
    }
  }

  const handleOrbTap = () => {
    setVoiceError(null)
    if (voiceSpeaking) {
      stopSpeech()
      if (callActiveRef.current) {
        startListeningTurn()
      }
      return
    }
    if (callActive) {
      callActiveRef.current = false
      setCallActive(false)
      stopRecognition()
      stopSpeech()
      return
    }

    callActiveRef.current = true
    setCallActive(true)
    setCallSeconds(0)
    startListeningTurn()
  }

  const switchToVoiceAndListen = () => {
    setSection('voice')
    setModeMenuOpen(false)
    if (!callActiveRef.current) {
      callActiveRef.current = true
      setCallActive(true)
      setCallSeconds(0)
      startListeningTurn()
    }
  }

  const switchToText = () => {
    callActiveRef.current = false
    setCallActive(false)
    stopRecognition()
    stopSpeech()
    setSection('text')
    setModeMenuOpen(false)
  }

  const handleSubmitText = (e: FormEvent) => {
    e.preventDefault()
    void sendMessage(input, false)
  }

  const handleTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim()) {
        void sendMessage(input, false)
      }
    }
  }

  const handleAttachContext = () => {
    const snippet = isHi
      ? `मेरा वर्तमान वेलनेस स्कोर ${account.wellnessScore}/100 और तनाव स्तर ${account.factors.stress} है। `
      : `My current wellness score is ${account.wellnessScore}/100 with ${account.factors.stress} stress. `
    setInput((prev) => (prev.includes(snippet.trim()) ? prev : `${prev}${snippet}`))
  }

  const suggestionCards = isHi
    ? [
        {
          label: 'मेरा शेड्यूल और प्राथमिकताएं व्यवस्थित करें।',
          prompt: 'मेरा आज का शेड्यूल और मुख्य प्राथमिकताएं शांत तरीके से व्यवस्थित करने में मदद करें।',
        },
        {
          label: 'लक्ष्य को आसान चरणों में बांटें।',
          prompt: 'मेरे आज के लक्ष्य को छोटे और आसान चरणों में बांटें।',
        },
        {
          label: 'आज रात गहरी नींद के लिए उपाय बताएं।',
          prompt: 'आज रात बेहतर और गहरी नींद लेने के सबसे प्रभावी तरीके क्या हैं?',
        },
        {
          label: 'तनाव व अति-चिंतन शांत करें।',
          prompt: 'मन के अनावश्यक विचारों और तनाव को तुरंत शांत करने के लिए मुझे क्या करना चाहिए?',
        },
      ]
    : [
        {
          label: 'Organize my schedule and priorities.',
          prompt: 'Help me organize my schedule and priorities calmly for today.',
        },
        {
          label: 'Break my goal into actionable steps.',
          prompt: 'Break my main goal today into clear, actionable steps.',
        },
        {
          label: 'Help me sleep deeper tonight.',
          prompt: 'What are the best ways to quiet racing thoughts and sleep deeper tonight?',
        },
        {
          label: 'Calm my stress and sharpen focus.',
          prompt: 'Give me practical steps to calm stress and regain focus right now.',
        },
      ]

  const isOrbActive = listening || voiceSpeaking || callActive

  return (
    <div
      className="fixed inset-0 z-50 w-screen h-screen flex flex-col text-white overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 90% 45% at 50% -5%, rgba(92, 235, 168, 0.36), transparent 68%), linear-gradient(180deg, #279A66 0%, #156A4A 26%, #093529 52%, #051715 80%, #030D0C 100%)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Emotion AI Companion"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.txt,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            setInput((prev) =>
              `${prev}${prev ? ' ' : ''}[${file.name}] `
            )
          }
          e.target.value = ''
        }}
      />

      {/* =================================================================
          SECTION 1: CHAT BOT (MATCHING LEFT SCREEN OF REFERENCE IMAGE)
         ================================================================= */}
      {section === 'text' && (
        <div className="flex-1 flex flex-col min-h-0 max-w-2xl w-full mx-auto px-5 sm:px-8 pt-6 pb-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-3 shrink-0 mb-4">
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setMessages([])
                    setInput('')
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/18 border border-white/15 text-xs font-medium text-white/95 cursor-pointer transition-colors"
                >
                  {isHi ? '+ नया चैट' : '+ New Chat'}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={switchToVoiceAndListen}
                className="min-h-[44px] px-5 py-2.5 rounded-full bg-white/14 hover:bg-white/22 border border-white/22 text-sm font-semibold text-white inline-flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
                <Mic className="w-5 h-5 text-[#6EE7B7]" />
                <span>{isHi ? 'वॉइस' : 'Voice'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  callActiveRef.current = false
                  stopRecognition()
                  stopSpeech()
                  onClose()
                }}
                className="px-3.5 py-1.5 rounded-full bg-white/12 hover:bg-white/20 border border-white/18 text-xs font-medium text-white/95 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>{isHi ? 'बंद करें' : 'Close Chat'}</span>
              </button>
            </div>
          </div>

          {messages.length === 0 ? (
            /* Welcome Screen (Exact match to Left Panel of reference image, zero photos) */
            <div className="flex-1 flex flex-col justify-end sm:justify-center gap-7 min-h-0">
              {/* Large Two-Line Headline */}
              <h1 className="font-display text-[30px] sm:text-[38px] font-semibold tracking-tight text-white leading-[1.15]">
                {isHi ? (
                  <>
                    आज हम किस विषय
                    <br />
                    पर काम करें?
                  </>
                ) : (
                  <>
                    What can we
                    <br />
                    work on today?
                  </>
                )}
              </h1>

              {/* Horizontal Scrollable Translucent Suggestion Cards */}
              <div className="flex items-stretch gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
                {suggestionCards.map((card) => (
                  <button
                    key={card.label}
                    type="button"
                    onClick={() => void sendMessage(card.prompt, false)}
                    className="w-[154px] sm:w-[172px] min-h-[124px] shrink-0 snap-start rounded-[20px] bg-[#071D19]/82 hover:bg-[#0B2B24]/92 border border-white/10 hover:border-[#6EE7B7]/35 p-4 flex flex-col justify-between text-left transition-all cursor-pointer group"
                  >
                    <span className="text-[#5EEAD4] group-hover:text-[#A7F3D0] transition-colors">
                      <SparkleFourPoint className="w-5 h-5 text-[#4ADE80]" />
                    </span>
                    <span className="text-[12.5px] sm:text-[13px] leading-[1.35] text-white/90 font-normal">
                      {card.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Large Glassmorphic Rounded Composer Box */}
              <form
                onSubmit={handleSubmitText}
                className="relative rounded-[28px] bg-[#0B2320]/78 border border-white/12 focus-within:border-[#6EE7B7]/45 backdrop-blur-xl p-5 flex flex-col justify-between min-h-[210px] sm:min-h-[245px] shadow-[0_24px_60px_rgba(0,0,0,0.45)] transition-colors"
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder={
                    isHi
                      ? 'AI से कोई सवाल पूछें या अपने विचार लिखें...'
                      : 'Ask AI a question or describe your idea...'
                  }
                  rows={4}
                  className="w-full flex-1 bg-transparent resize-none text-[15px] text-white placeholder:text-white/55 outline-none leading-relaxed"
                />

                {/* Bottom Row inside Composer: Paperclip left, Pill Selector + Glowing Green Mic/Send right */}
                <div className="flex items-center justify-between gap-3 pt-3">
                  <button
                    type="button"
                    onClick={handleAttachContext}
                    title={isHi ? 'अपना वेलनेस संदर्भ जोड़ें' : 'Attach your wellness context'}
                    aria-label={isHi ? 'वेलनेस संदर्भ जोड़ें' : 'Attach wellness context'}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/18 border border-white/10 flex items-center justify-center text-white/85 cursor-pointer transition-colors"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2.5 relative">
                    <button
                      type="button"
                      onClick={() => setModeMenuOpen((o) => !o)}
                      className="h-10 px-4 rounded-full bg-white/10 hover:bg-white/18 border border-white/12 text-xs font-medium text-white/95 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span>Emotion AI</span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                    </button>

                    {modeMenuOpen && (
                      <div className="absolute right-12 bottom-12 w-44 rounded-2xl bg-[#071C18] border border-white/15 p-1.5 shadow-2xl z-20">
                        <button
                          type="button"
                          onClick={() => setModeMenuOpen(false)}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-[#6EE7B7] bg-white/8 cursor-pointer"
                        >
                          {isHi ? 'Emotion चैट मोड (सक्रिय)' : 'Emotion Chat (Active)'}
                        </button>
                        <button
                          type="button"
                          onClick={switchToVoiceAndListen}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-white/85 hover:bg-white/8 cursor-pointer"
                        >
                          {isHi ? 'Emotion वॉइस बॉट पर जाएं' : 'Switch to Voice Bot'}
                        </button>
                      </div>
                    )}

                    {input.trim() ? (
                      <button
                        type="submit"
                        disabled={loading}
                        aria-label={isHi ? 'संदेश भेजें' : 'Send message'}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-[#031B12] cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
                        style={{
                          background:
                            'radial-gradient(circle at 35% 30%, #BDFCE0 0%, #4ADE80 48%, #0E704D 100%)',
                          boxShadow: '0 0 22px rgba(74, 222, 128, 0.48)',
                        }}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={switchToVoiceAndListen}
                        aria-label={isHi ? 'वॉइस बॉट शुरू करें' : 'Open Voice Bot'}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-[#031B12] cursor-pointer transition-transform active:scale-95"
                        style={{
                          background:
                            'radial-gradient(circle at 35% 30%, #BDFCE0 0%, #4ADE80 48%, #0E704D 100%)',
                          boxShadow: '0 0 22px rgba(74, 222, 128, 0.48)',
                        }}
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          ) : (
            /* Active Conversation Stream (Same Emerald-Obsidian Palette, No Photo) */
            <>
              <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-start gap-2.5 max-w-[90%] sm:max-w-[80%]">
                      {msg.sender === 'bot' && (
                        <span className="w-7 h-7 rounded-full bg-[#092922] border border-[#4ADE80]/35 flex items-center justify-center shrink-0 mt-0.5 text-[#4ADE80]">
                          <SparkleFourPoint className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <div
                        className={`rounded-[22px] px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                          msg.sender === 'user'
                            ? 'bg-gradient-to-br from-[#238B5E] to-[#135D43] border border-emerald-300/25 text-white font-medium shadow-[0_8px_24px_rgba(16,185,129,0.22)]'
                            : 'bg-[#08211C]/88 border border-white/12 text-white/95'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>

                    {msg.suggestedAction && (
                      <button
                        type="button"
                        onClick={() => onTriggerAction(msg.suggestedAction!.type)}
                        className="mt-2 ml-9 px-3.5 py-1.5 rounded-full bg-[#4ADE80]/15 hover:bg-[#4ADE80]/25 border border-[#4ADE80]/35 text-[#A7F3D0] text-xs font-medium cursor-pointer transition-colors"
                      >
                        {msg.suggestedAction.label} →
                      </button>
                    )}

                    <span
                      className={`mt-1 text-[10px] text-white/45 font-mono-num ${
                        msg.sender === 'bot' ? 'ml-9' : ''
                      }`}
                    >
                      {msg.sender === 'bot' ? `Emotion · ${msg.timestamp}` : msg.timestamp}
                    </span>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2 text-xs text-[#A7F3D0] ml-9">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isHi ? 'Emotion विचार कर रहा है...' : 'Emotion is thinking...'}</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Compact Bottom Glass Composer during active chat */}
              <form
                onSubmit={handleSubmitText}
                className="mt-3 rounded-[24px] bg-[#0B2320]/85 border border-white/15 focus-within:border-[#6EE7B7]/45 backdrop-blur-xl px-4 py-3 flex items-center gap-2.5 shrink-0 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
              >
                <button
                  type="button"
                  onClick={handleAttachContext}
                  aria-label={isHi ? 'वेलनेस संदर्भ जोड़ें' : 'Attach wellness context'}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/18 flex items-center justify-center text-white/85 shrink-0 cursor-pointer"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isHi
                      ? 'AI से कोई सवाल पूछें या अपने विचार लिखें...'
                      : 'Ask AI a question or describe your idea...'
                  }
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/55 outline-none"
                />

                {input.trim() ? (
                  <button
                    type="submit"
                    disabled={loading}
                    aria-label={isHi ? 'संदेश भेजें' : 'Send message'}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[#031B12] shrink-0 cursor-pointer"
                    style={{
                      background:
                        'radial-gradient(circle at 35% 30%, #BDFCE0 0%, #4ADE80 48%, #0E704D 100%)',
                      boxShadow: '0 0 18px rgba(74, 222, 128, 0.45)',
                    }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={switchToVoiceAndListen}
                    aria-label={isHi ? 'वॉइस बॉट' : 'Voice Bot'}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[#031B12] shrink-0 cursor-pointer"
                    style={{
                      background:
                        'radial-gradient(circle at 35% 30%, #BDFCE0 0%, #4ADE80 48%, #0E704D 100%)',
                      boxShadow: '0 0 18px rgba(74, 222, 128, 0.45)',
                    }}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}
              </form>
            </>
          )}
        </div>
      )}

      {/* =================================================================
          SECTION 2: VOICE BOT (MATCHING RIGHT SCREEN OF REFERENCE IMAGE)
          - NO photo in center; luminous mint-to-midnight orb matching image
          - Yellow "Tap" in exact center
          - Audio-only Cartesia spoken output (zero written reply text)
         ================================================================= */}
      {section === 'voice' && (
        <div className="flex-1 flex flex-col items-center justify-between px-6 pt-8 pb-8 max-w-xl w-full mx-auto">
          {/* Top Centered Translucent "Close Chat" Pill matching reference image */}
          <div className="w-full flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                callActiveRef.current = false
                stopRecognition()
                stopSpeech()
                onClose()
              }}
              className="px-4 py-2 rounded-full bg-white/14 hover:bg-white/22 border border-white/20 backdrop-blur-md text-xs font-medium text-white inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>{isHi ? 'चैट बंद करें' : 'Close Chat'}</span>
            </button>
          </div>

          {/* Center Glowing Mint-to-Navy Orb Matching Reference Image */}
          <div className="flex-1 flex flex-col items-center justify-center my-4">
            <button
              type="button"
              onClick={handleOrbTap}
              aria-label={callActive ? 'Stop voice assistant' : 'Start voice assistant'}
              className="relative w-60 h-60 sm:w-64 sm:h-64 flex items-center justify-center cursor-pointer bg-transparent border-0 focus:outline-none group"
            >
              {/* Soft outer emerald wave halo */}
              <motion.span
                aria-hidden="true"
                animate={{
                  scale: isOrbActive ? [0.95, 1.24, 0.95] : [0.96, 1.08, 0.96],
                  opacity: isOrbActive ? [0.55, 0.1, 0.55] : [0.35, 0.12, 0.35],
                }}
                transition={{
                  repeat: Infinity,
                  duration: listening ? 1.7 : voiceSpeaking ? 1.4 : 3.6,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle, rgba(110, 231, 183, 0.36) 28%, rgba(34, 197, 94, 0.14) 58%, transparent 74%)',
                }}
              />

              {/* Secondary ripple wave ring */}
              <motion.span
                aria-hidden="true"
                animate={{
                  scale: isOrbActive ? [1, 1.15, 0.96, 1] : [1, 1.05, 1],
                  opacity: isOrbActive ? [0.45, 0.72, 0.35, 0.45] : [0.22, 0.38, 0.22],
                }}
                transition={{
                  repeat: Infinity,
                  duration: listening ? 1.4 : voiceSpeaking ? 1.2 : 3.8,
                  ease: 'easeInOut',
                }}
                className="absolute inset-5 rounded-full pointer-events-none border border-emerald-200/35"
              />

              {/* Luminous Gradient Orb matching reference image (NO photo) */}
              <motion.div
                animate={{
                  scale: listening
                    ? [1, 1.08, 0.97, 1.06, 1]
                    : voiceSpeaking
                      ? [1, 1.1, 0.96, 1.07, 1]
                      : [1, 1.03, 0.99, 1],
                  y: isOrbActive ? [0, -4, 2, 0] : [0, -2, 1, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: listening ? 1.6 : voiceSpeaking ? 1.3 : 3.5,
                  ease: 'easeInOut',
                }}
                className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-full border border-white/30 flex items-center justify-center transition-transform group-hover:scale-105"
                style={{
                  background:
                    'radial-gradient(circle at 36% 48%, rgba(236, 255, 247, 0.98) 0%, rgba(124, 245, 188, 0.95) 24%, rgba(56, 184, 138, 0.88) 46%, rgba(16, 48, 82, 0.96) 72%, rgba(8, 16, 46, 0.99) 100%)',
                  boxShadow:
                    '0 0 55px rgba(92, 235, 168, 0.42), inset -12px -8px 28px rgba(8, 16, 46, 0.65), inset 8px 6px 22px rgba(255, 255, 255, 0.35)',
                }}
              />
            </button>
          </div>

          {/* Subtle Minimal Bottom Controls (Status + Chat switch + Mute/Replay, zero answer text) */}
          <div className="w-full flex flex-col items-center gap-3">
            <div className="text-xs font-medium text-emerald-100/80 font-mono-num">
              {callActive
                ? `${formatCallDuration(callSeconds)} · ${
                    listening
                      ? isHi
                        ? 'सुन रहा है...'
                        : 'Listening...'
                      : loading
                        ? isHi
                          ? 'विचार कर रहा है...'
                          : 'Thinking...'
                        : voiceSpeaking
                          ? isHi
                            ? 'बोल रहा है...'
                            : 'Speaking...'
                          : isHi
                            ? 'सक्रिय'
                            : 'Active'
                  }`
                : isHi
                  ? 'वॉइस तैयार है'
                  : 'Voice Ready'}
            </div>

            {voiceError && (
              <div className="w-full rounded-2xl bg-red-950/60 border border-red-400/35 px-4 py-2.5 text-xs text-red-200 text-center">
                {voiceError}
              </div>
            )}

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={switchToText}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/18 border border-white/15 text-xs font-medium text-white/90 cursor-pointer transition-colors"
              >
                {isHi ? 'टेक्स्ट चैट' : 'Back to Chat'}
              </button>

              {hasSpokenReply && (
                <button
                  type="button"
                  onClick={() => void speakText(lastVoiceReplyRef.current, false, true)}
                  className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/18 border border-white/15 text-xs font-medium text-white/90 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isHi ? 'दोबारा सुनें' : 'Replay'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (!voiceMuted) stopSpeech()
                  setVoiceMuted((m) => !m)
                }}
                aria-label={voiceMuted ? 'Unmute speaker' : 'Mute speaker'}
                className="p-2 rounded-full bg-white/10 hover:bg-white/18 border border-white/15 text-white/90 cursor-pointer transition-colors"
              >
                {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
