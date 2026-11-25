import type { RelaxationProfile, SoundTherapyCategory } from '../types'

export type SoundTrackId =
  // Original 6 Drive MP3 tracks (preserved for GuidedTherapyModal & saved preferences)
  | 'sleep_resonance'
  | 'autumn_guitar'
  | 'crystal_chimes'
  | 'sleep_drift'
  | 'zen_nature'
  | 'celestial_drone'
  // 13 synthesized stereo therapeutic tracks (19 total)
  | 'tibetan_bowl_432'
  | 'crystal_gong_bath'
  | 'quartz_chimes_bath'
  | 'white_noise'
  | 'pink_noise'
  | 'brown_noise'
  | 'binaural_delta_2hz'
  | 'binaural_theta_6hz'
  | 'binaural_alpha_10hz'
  | 'binaural_beta_16hz'
  | 'vibro_40hz_gamma'
  | 'vibro_64hz_somatic'
  | 'tinnitus_notch_mask'
  | 'tinnitus_shimmer_waves'
  // 3 Featured Sound Therapy tracks
  | 'locked_in_40hz_gamma'
  | 'tibetan_cleaning_energy'
  | 'cortisol_reset_432hz_bansuri'

export interface SoundCategoryMeta {
  id: SoundTherapyCategory
  label: string
  labelHi: string
  preferenceLabel: RelaxationProfile['preferredAudio']
  description: string
  descriptionHi: string
}

export const SOUND_THERAPY_CATEGORIES: SoundCategoryMeta[] = [
  {
    id: 'sound_baths',
    label: 'Sound Baths',
    labelHi: 'साउंड बाथ',
    preferenceLabel: 'Sound Baths',
    description: 'Singing bowls, gongs, and crystal chimes.',
    descriptionHi: 'सिंगिंग बाउल, गोंग और क्रिस्टल चाइम्स।',
  },
  {
    id: 'color_noise',
    label: 'White, Pink & Brown Noise',
    labelHi: 'व्हाइट, पिंक व ब्राउन नॉइज़',
    preferenceLabel: 'White/Pink/Brown Noise',
    description: 'Steady masking & nature ambience for sleep or focus.',
    descriptionHi: 'नींद और एकाग्रता के लिए स्थिर ध्वनि व प्रकृति स्वर।',
  },
  {
    id: 'binaural_beats',
    label: 'Binaural Beats',
    labelHi: 'बाइनॉरल बीट्स',
    preferenceLabel: 'Binaural Beats',
    description: 'Stereo L/R frequencies (use headphones).',
    descriptionHi: 'हेडफ़ोन के लिए बाईं/दाईं आवृत्ति तरंगें।',
  },
  {
    id: 'vibroacoustic',
    label: 'Vibroacoustic Therapy',
    labelHi: 'वाइब्रोअकॉस्टिक थेरेपी',
    preferenceLabel: 'Vibroacoustic Therapy',
    description: 'Low-frequency somatic sound waves.',
    descriptionHi: 'शारीरिक विश्राम के लिए निम्न-आवृत्ति तरंगें।',
  },
  {
    id: 'tinnitus_enrichment',
    label: 'Tinnitus Enrichment',
    labelHi: 'टिनिटस साउंड एनरिचमेंट',
    preferenceLabel: 'Tinnitus Enrichment',
    description: 'Soft masking & modulated sound relief.',
    descriptionHi: 'कानों की गूंज कम करने वाली कोमल ध्वनि।',
  },
]

export interface CalmingSoundTrack {
  id: SoundTrackId
  category: SoundTherapyCategory
  source: 'mp3' | 'synth'
  url?: string
  duration: string
  frequencyBadge?: string
  featuredSound?: boolean
  name: string
  nameHi: string
  detail: string
  detailHi: string
}

export const CALMING_SOUND_TRACKS: CalmingSoundTrack[] = [
  // Featured Sound Therapy Sessions (Extracted from user's sound preferences)
  {
    id: 'locked_in_40hz_gamma',
    category: 'binaural_beats',
    source: 'mp3',
    url: '/sounds/gamma_40hz_focus.mp3',
    duration: '90:00',
    frequencyBadge: '40Hz Gamma · 200/240Hz Stereo',
    featuredSound: true,
    name: '40Hz Gamma Brainwave Focus',
    nameHi: '40Hz गामा ब्रेनवेव फोकस',
    detail: 'Steady 40Hz stereo gamma binaural waves layered over warm harmonic resonance for deep concentration.',
    detailHi: 'गहरी एकाग्रता और शांत मानसिक प्रवाह के लिए स्थिर 40Hz बाइनॉरल तरंगें।',
  },
  {
    id: 'tibetan_cleaning_energy',
    category: 'sound_baths',
    source: 'mp3',
    url: '/sounds/tibetan_singing_bowls.mp3',
    duration: 'Loop',
    frequencyBadge: '136.1Hz / 432Hz Bronze Bowls',
    featuredSound: true,
    name: 'Tibetan Singing Bowls & Chimes',
    nameHi: 'तिब्बती सिंगिंग बाउल नाद',
    detail: 'Resonant hand-hammered Tibetan bronze bowls with slow shimmering overtones for whole-body calm.',
    detailHi: 'संपूर्ण मानसिक और शारीरिक विश्राम के लिए गूंजते तिब्बती कांस्य बाउल नाद।',
  },
  {
    id: 'cortisol_reset_432hz_bansuri',
    category: 'sound_baths',
    source: 'mp3',
    url: '/sounds/bansuri_432hz_flute.mp3',
    duration: 'Loop',
    frequencyBadge: '432Hz Bamboo Flute & Tanpura',
    featuredSound: true,
    name: '432Hz Bamboo Bansuri Flute',
    nameHi: '432Hz बांसुरी और तानपुरा राग',
    detail: 'Warm bamboo bansuri flute notes tuned to 432Hz over a soft tanpura drone to quiet overthinking.',
    detailHi: 'अति-चिंतन और तनाव शांत करने के लिए 432Hz मधुर बांसुरी व तानपुरा ध्वनि।',
  },

  // 1. Sound Baths (5 tracks)
  {
    id: 'tibetan_bowl_432',
    category: 'sound_baths',
    source: 'synth',
    duration: 'Loop',
    name: '432Hz Deep Temple Bowl',
    nameHi: '432Hz मंदिर कांस्य बाउल',
    detail: 'Sustained warm bronze overtones tuned to 432Hz.',
    detailHi: '432Hz आवृत्ति पर कोमल ताम्र प्रतिध्वनि।',
  },
  {
    id: 'crystal_gong_bath',
    category: 'sound_baths',
    source: 'synth',
    duration: 'Loop',
    name: 'Crystal Gong Resonance',
    nameHi: 'क्रिस्टल गोंग प्रतिध्वनि',
    detail: 'Slow-swelling resonant gong harmonics.',
    detailHi: 'धीरे-धीरे गूंजती क्रिस्टल गोंग ध्वनि।',
  },
  {
    id: 'quartz_chimes_bath',
    category: 'sound_baths',
    source: 'synth',
    duration: 'Loop',
    name: 'Quartz Wind Chimes',
    nameHi: 'क्वार्ट्ज़ विंड चाइम्स',
    detail: 'Airy pentatonic shimmer intervals.',
    detailHi: 'हल्की मधुर घंटी तरंगें।',
  },
  {
    id: 'crystal_chimes',
    category: 'sound_baths',
    source: 'mp3',
    url: '/sounds/track3_brain_relaxing_528.mp3',
    duration: '0:57',
    name: '528Hz Soft Crystal Bells',
    nameHi: '528Hz कोमल क्रिस्टल घंटियाँ',
    detail: 'Sparkling celesta bells over 528Hz pads.',
    detailHi: '528Hz पर झिलमिलाती क्रिस्टल घंटियाँ।',
  },
  {
    id: 'celestial_drone',
    category: 'sound_baths',
    source: 'mp3',
    url: '/sounds/track6_celestial_sanctuary.mp3',
    duration: '2:32',
    name: 'Ambient Harmonic Drone',
    nameHi: 'शांत हार्मोनिक नाद',
    detail: 'Spacious ambient pads with zero percussion.',
    detailHi: 'गहन ध्यान के लिए शांत ध्वनि विस्तार।',
  },

  // 2. White, Pink & Brown Noise (5 tracks)
  {
    id: 'white_noise',
    category: 'color_noise',
    source: 'synth',
    duration: 'Loop',
    name: 'Gentle White Noise',
    nameHi: 'कोमल व्हाइट नॉइज़',
    detail: 'Even-spectrum gentle masking for focus.',
    detailHi: 'एकाग्रता के लिए समतल शांत ध्वनि।',
  },
  {
    id: 'pink_noise',
    category: 'color_noise',
    source: 'synth',
    duration: 'Loop',
    name: 'Warm Rain Pink Noise',
    nameHi: 'हल्की बारिश पिंक नॉइज़',
    detail: 'Balanced rain-like tone for deep rest.',
    detailHi: 'गहरी नींद के लिए हल्की बारिश जैसी ध्वनि।',
  },
  {
    id: 'brown_noise',
    category: 'color_noise',
    source: 'synth',
    duration: 'Loop',
    name: 'Deep Waterfall Brown Noise',
    nameHi: 'गहरा जलप्रपात ब्राउन नॉइज़',
    detail: 'Velvety low waterfall rumble for quiet calm.',
    detailHi: 'मन को शांत करने वाली गहरी जलप्रपात ध्वनि।',
  },
  {
    id: 'autumn_guitar',
    category: 'color_noise',
    source: 'mp3',
    url: '/sounds/track2_autumn_guitar.mp3',
    duration: '2:33',
    name: 'Acoustic Guitar & Soft Rain',
    nameHi: 'एकॉस्टिक गिटार व हल्की बारिश',
    detail: 'Soft fingerpicked guitar layered over rain.',
    detailHi: 'हल्की बारिश के साथ शांत गिटार धुन।',
  },
  {
    id: 'zen_nature',
    category: 'color_noise',
    source: 'mp3',
    url: '/sounds/track5_zen_nature.mp3',
    duration: '0:32',
    name: 'Forest Stream & Birdsong',
    nameHi: 'वन झरना व पक्षी स्वर',
    detail: 'Woodland water stream and forest calm.',
    detailHi: 'बहते झरने और वन की शांत ध्वनि।',
  },

  // 3. Binaural Beats (4 tracks)
  {
    id: 'binaural_delta_2hz',
    category: 'binaural_beats',
    source: 'synth',
    duration: 'Loop',
    name: '2Hz Delta Sleep Waves',
    nameHi: '2Hz डेल्टा निद्रा तरंगें',
    detail: 'True L/R stereo pulse for sleep onset.',
    detailHi: 'गहरी नींद के लिए बायाँ/दायाँ पल्स।',
  },
  {
    id: 'binaural_theta_6hz',
    category: 'binaural_beats',
    source: 'synth',
    duration: 'Loop',
    name: '6Hz Theta Meditation Waves',
    nameHi: '6Hz थीटा ध्यान तरंगें',
    detail: 'Gentle 6Hz beat for calm meditation.',
    detailHi: 'शांत ध्यान और विश्राम के लिए 6Hz लय।',
  },
  {
    id: 'binaural_alpha_10hz',
    category: 'binaural_beats',
    source: 'synth',
    duration: 'Loop',
    name: '10Hz Alpha Calm Waves',
    nameHi: '10Hz अल्फा शांत तरंगें',
    detail: 'Light anxiety ease & calm awareness.',
    detailHi: 'चिंता कम करने व शांत स्पष्टता के लिए।',
  },
  {
    id: 'binaural_beta_16hz',
    category: 'binaural_beats',
    source: 'synth',
    duration: 'Loop',
    name: '16Hz Beta Alert Waves',
    nameHi: '16Hz बीटा एकाग्रता तरंगें',
    detail: 'Crisp L/R cognitive rhythm for study.',
    detailHi: 'पढ़ाई व काम में एकाग्रता के लिए 16Hz।',
  },

  // 4. Vibroacoustic Therapy (3 tracks)
  {
    id: 'vibro_40hz_gamma',
    category: 'vibroacoustic',
    source: 'synth',
    duration: 'Loop',
    name: '40Hz Low Somatic Pulse',
    nameHi: '40Hz सोमैटिक पल्स तरंग',
    detail: 'Warm 40Hz low-frequency body relaxation.',
    detailHi: 'शारीरिक तनाव मुक्ति हेतु 40Hz तरंग।',
  },
  {
    id: 'vibro_64hz_somatic',
    category: 'vibroacoustic',
    source: 'synth',
    duration: 'Loop',
    name: '64Hz Deep Bass Hum',
    nameHi: '64Hz गहन शारीरिक गूंज',
    detail: 'Gentle 64Hz + 128Hz harmonic resonance.',
    detailHi: 'कोमल निम्न-आवृत्ति शारीरिक विश्राम।',
  },
  {
    id: 'sleep_resonance',
    category: 'vibroacoustic',
    source: 'mp3',
    url: '/sounds/track1_anxiety_relief_432_528.mp3',
    duration: '2:24',
    name: '432Hz Warm Earth Drone',
    nameHi: '432Hz शांत अर्थ ड्रोन',
    detail: 'Sub-bass chords & 432Hz warmth.',
    detailHi: '432Hz + 528Hz शांत सब-बास ध्वनि।',
  },

  // 5. Tinnitus Sound Enrichment (3 tracks)
  {
    id: 'tinnitus_notch_mask',
    category: 'tinnitus_enrichment',
    source: 'synth',
    duration: 'Loop',
    name: 'Filtered Flowing Water',
    nameHi: 'कोमल जल प्रवाह ध्वनि',
    detail: 'Smooth bandpass water-like masking.',
    detailHi: 'कानों की झनझनाहट ढकने वाली शांत ध्वनि।',
  },
  {
    id: 'tinnitus_shimmer_waves',
    category: 'tinnitus_enrichment',
    source: 'synth',
    duration: 'Loop',
    name: 'Soft Ocean Shimmer',
    nameHi: 'कोमल सागर तरंग शिमर',
    detail: 'Rolling harmonic shimmer to ease ringing.',
    detailHi: 'रिंगिंग कम करने के लिए कोमल शिमर तरंगें।',
  },
  {
    id: 'sleep_drift',
    category: 'tinnitus_enrichment',
    source: 'mp3',
    url: '/sounds/track4_fall_asleep_528.mp3',
    duration: '0:59',
    name: '528Hz Night Ocean Swell',
    nameHi: '528Hz रात्रि सागर ध्वनि',
    detail: 'Slow swells to settle bedtime ringing.',
    detailHi: 'सोते समय कानों को शांत रखने वाली ध्वनि।',
  },
]

const TRACK_MAP: Record<SoundTrackId, CalmingSoundTrack> = CALMING_SOUND_TRACKS.reduce(
  (acc, track) => {
    acc[track.id] = track
    return acc
  },
  {} as Record<SoundTrackId, CalmingSoundTrack>
)

class SoundSynthesizer {
  private audio: HTMLAudioElement | null = null
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private activeNodes: AudioNode[] = []
  private timers: number[] = []
  private activeId: SoundTrackId | null = null

  public getActiveTrack(): SoundTrackId | null {
    return this.activeId
  }

  public setVolume(volume: number): void {
    const safeVol = Math.min(1, Math.max(0, volume))
    if (this.audio) {
      this.audio.volume = safeVol
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(safeVol * 0.45, this.ctx.currentTime, 0.05)
    }
  }

  public stop(): void {
    if (this.audio) {
      try {
        this.audio.pause()
        this.audio.currentTime = 0
        this.audio.removeAttribute('src')
        this.audio.load()
      } catch {
        // Ignore cleanup errors
      }
      this.audio = null
    }

    this.timers.forEach((id) => window.clearInterval(id))
    this.timers = []

    this.activeNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
          ;(node as OscillatorNode).stop()
        }
        node.disconnect()
      } catch {
        // Ignore node disconnect errors
      }
    })
    this.activeNodes = []

    if (this.masterGain) {
      try {
        this.masterGain.disconnect()
      } catch {
        // Ignore
      }
      this.masterGain = null
    }

    if (this.ctx) {
      void this.ctx.close().catch(() => {})
      this.ctx = null
    }

    this.activeId = null
  }

  private ensureContext(volume: number): { ctx: AudioContext; master: GainNode } | null {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    const ctx = new Ctx()
    const master = ctx.createGain()
    master.gain.setValueAtTime(0.001, ctx.currentTime)
    master.gain.exponentialRampToValueAtTime(Math.max(0.02, volume * 0.45), ctx.currentTime + 0.35)
    master.connect(ctx.destination)
    this.ctx = ctx
    this.masterGain = master
    return { ctx, master }
  }

  private createNoiseBuffer(
    ctx: AudioContext,
    color: 'white' | 'pink' | 'brown'
  ): AudioBuffer {
    const length = ctx.sampleRate * 3
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const output = buffer.getChannelData(0)

    if (color === 'white') {
      for (let i = 0; i < length; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.35
      }
    } else if (color === 'pink') {
      let b0 = 0
      let b1 = 0
      let b2 = 0
      let b3 = 0
      let b4 = 0
      let b5 = 0
      let b6 = 0
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.969 * b2 + white * 0.153852
        b3 = 0.8665 * b3 + white * 0.3104856
        b4 = 0.55 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.016898
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.07
        b6 = white * 0.115926
      }
    } else {
      let lastOut = 0
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1
        lastOut = (lastOut + 0.02 * white) / 1.02
        output[i] = lastOut * 2.2
      }
    }
    return buffer
  }

  private startSynthesized(trackId: SoundTrackId, volume: number): void {
    const setup = this.ensureContext(volume)
    if (!setup) return
    const { ctx, master } = setup

    const register = <T extends AudioNode>(node: T): T => {
      this.activeNodes.push(node)
      return node
    }

    const addOsc = (freq: number, type: OscillatorType, gainVal: number, pan = 0) => {
      const osc = register(ctx.createOscillator())
      const g = register(ctx.createGain())
      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      g.gain.setValueAtTime(gainVal, ctx.currentTime)
      if (typeof ctx.createStereoPanner === 'function' && pan !== 0) {
        const panner = register(ctx.createStereoPanner())
        panner.pan.setValueAtTime(pan, ctx.currentTime)
        osc.connect(g)
        g.connect(panner)
        panner.connect(master)
      } else {
        osc.connect(g)
        g.connect(master)
      }
      osc.start()
      return { osc, g }
    }

    if (trackId === 'tibetan_bowl_432') {
      addOsc(144, 'sine', 0.4)
      addOsc(432, 'sine', 0.35)
      addOsc(434.2, 'sine', 0.16)
      addOsc(648, 'triangle', 0.08)
    } else if (trackId === 'crystal_gong_bath') {
      const { g: breath } = addOsc(196, 'sine', 0.36)
      addOsc(293.66, 'sine', 0.22)
      addOsc(392, 'sine', 0.14)
      const lfo = register(ctx.createOscillator())
      const lfoGain = register(ctx.createGain())
      lfo.frequency.setValueAtTime(0.14, ctx.currentTime)
      lfoGain.gain.setValueAtTime(0.14, ctx.currentTime)
      lfo.connect(lfoGain)
      lfoGain.connect(breath.gain)
      lfo.start()
    } else if (trackId === 'quartz_chimes_bath') {
      const notes = [528, 594, 660, 792, 880, 1056]
      addOsc(264, 'sine', 0.18)
      const triggerChime = () => {
        if (!this.ctx || !this.masterGain) return
        const freq = notes[Math.floor(Math.random() * notes.length)]
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = 'sine'
        o.frequency.setValueAtTime(freq, ctx.currentTime)
        g.gain.setValueAtTime(0.001, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.08)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.8)
        o.connect(g)
        g.connect(master)
        o.start()
        o.stop(ctx.currentTime + 2.9)
      }
      triggerChime()
      this.timers.push(window.setInterval(triggerChime, 2100))
    } else if (trackId === 'white_noise' || trackId === 'pink_noise' || trackId === 'brown_noise') {
      const color = trackId === 'white_noise' ? 'white' : trackId === 'pink_noise' ? 'pink' : 'brown'
      const src = register(ctx.createBufferSource())
      src.buffer = this.createNoiseBuffer(ctx, color)
      src.loop = true
      const filter = register(ctx.createBiquadFilter())
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(
        color === 'white' ? 2800 : color === 'pink' ? 1800 : 750,
        ctx.currentTime
      )
      src.connect(filter)
      filter.connect(master)
      src.start()
    } else if (
      trackId === 'binaural_delta_2hz' ||
      trackId === 'binaural_theta_6hz' ||
      trackId === 'binaural_alpha_10hz' ||
      trackId === 'binaural_beta_16hz'
    ) {
      const pair =
        trackId === 'binaural_delta_2hz'
          ? [200, 202]
          : trackId === 'binaural_theta_6hz'
            ? [220, 226]
            : trackId === 'binaural_alpha_10hz'
              ? [240, 250]
              : [260, 276]
      addOsc(pair[0], 'sine', 0.45, -1)
      addOsc(pair[1], 'sine', 0.45, 1)
    } else if (trackId === 'vibro_40hz_gamma' || trackId === 'vibro_64hz_somatic') {
      const base = trackId === 'vibro_40hz_gamma' ? 40 : 64
      const { g } = addOsc(base, 'sine', 0.55)
      addOsc(base * 2, 'sine', 0.2)
      const pulse = register(ctx.createOscillator())
      const pulseGain = register(ctx.createGain())
      pulse.frequency.setValueAtTime(0.35, ctx.currentTime)
      pulseGain.gain.setValueAtTime(0.15, ctx.currentTime)
      pulse.connect(pulseGain)
      pulseGain.connect(g.gain)
      pulse.start()
    } else if (trackId === 'tinnitus_notch_mask') {
      const src = register(ctx.createBufferSource())
      src.buffer = this.createNoiseBuffer(ctx, 'pink')
      src.loop = true
      const bp = register(ctx.createBiquadFilter())
      bp.type = 'bandpass'
      bp.frequency.setValueAtTime(2400, ctx.currentTime)
      bp.Q.setValueAtTime(0.85, ctx.currentTime)
      src.connect(bp)
      bp.connect(master)
      src.start()
    } else if (trackId === 'tinnitus_shimmer_waves') {
      const src = register(ctx.createBufferSource())
      src.buffer = this.createNoiseBuffer(ctx, 'pink')
      src.loop = true
      const hp = register(ctx.createBiquadFilter())
      hp.type = 'bandpass'
      hp.frequency.setValueAtTime(3400, ctx.currentTime)
      hp.Q.setValueAtTime(1.2, ctx.currentTime)
      const swell = register(ctx.createGain())
      swell.gain.setValueAtTime(0.4, ctx.currentTime)
      const lfo = register(ctx.createOscillator())
      const lfoGain = register(ctx.createGain())
      lfo.frequency.setValueAtTime(0.18, ctx.currentTime)
      lfoGain.gain.setValueAtTime(0.22, ctx.currentTime)
      lfo.connect(lfoGain)
      lfoGain.connect(swell.gain)
      src.connect(hp)
      hp.connect(swell)
      swell.connect(master)
      src.start()
      lfo.start()
      addOsc(432, 'sine', 0.12)
    } else if (trackId === 'locked_in_40hz_gamma') {
      // 40Hz Gamma stereo binaural beat (200Hz L / 240Hz R) + warm focus pad & soft pink-noise bed
      addOsc(200, 'sine', 0.36, -1)
      addOsc(240, 'sine', 0.36, 1)
      addOsc(120, 'sine', 0.24)
      addOsc(360, 'triangle', 0.05)

      const noise = register(ctx.createBufferSource())
      noise.buffer = this.createNoiseBuffer(ctx, 'pink')
      noise.loop = true
      const lp = register(ctx.createBiquadFilter())
      lp.type = 'lowpass'
      lp.frequency.setValueAtTime(620, ctx.currentTime)
      const nGain = register(ctx.createGain())
      nGain.gain.setValueAtTime(0.18, ctx.currentTime)
      noise.connect(lp)
      lp.connect(nGain)
      nGain.connect(master)
      noise.start()
    } else if (trackId === 'tibetan_cleaning_energy') {
      // Layered Tibetan healing bowls with slow gentle bowl strikes
      addOsc(136.1, 'sine', 0.3)
      addOsc(272.2, 'sine', 0.18)
      addOsc(432, 'sine', 0.22)
      addOsc(433.6, 'sine', 0.14)
      addOsc(528, 'sine', 0.1)
      const strikeFreqs = [272.2, 432, 528, 648]
      const strikeBowl = () => {
        if (!this.ctx || !this.masterGain) return
        const f = strikeFreqs[Math.floor(Math.random() * strikeFreqs.length)]
        const o1 = ctx.createOscillator()
        const o2 = ctx.createOscillator()
        const g = ctx.createGain()
        o1.type = 'sine'
        o2.type = 'sine'
        o1.frequency.setValueAtTime(f, ctx.currentTime)
        o2.frequency.setValueAtTime(f * 2.004, ctx.currentTime)
        g.gain.setValueAtTime(0.001, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.14)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4.4)
        o1.connect(g)
        o2.connect(g)
        g.connect(master)
        o1.start()
        o2.start()
        o1.stop(ctx.currentTime + 4.5)
        o2.stop(ctx.currentTime + 4.5)
      }
      strikeBowl()
      this.timers.push(window.setInterval(strikeBowl, 3400))
    } else if (trackId === 'cortisol_reset_432hz_bansuri') {
      // A=432Hz Bamboo Bansuri meditative raga phrases over warm Tanpura drone (Sa 108Hz / Pa 162Hz / Sa 216Hz)
      addOsc(108, 'sine', 0.28)
      addOsc(162, 'sine', 0.16)
      addOsc(216, 'triangle', 0.08)

      // Yaman/Bhoopali raga notes centered at 432Hz Sa = 216Hz / 432Hz
      const phrase = [432, 486, 540, 648, 720, 648, 540, 486, 432, 384, 432]
      let step = 0
      const playBansuriNote = () => {
        if (!this.ctx || !this.masterGain) return
        const freq = phrase[step % phrase.length]
        step += 1

        const osc = ctx.createOscillator()
        const overtone = ctx.createOscillator()
        const vib = ctx.createOscillator()
        const vibGain = ctx.createGain()
        const filter = ctx.createBiquadFilter()
        const env = ctx.createGain()

        osc.type = 'sine'
        overtone.type = 'triangle'
        osc.frequency.setValueAtTime(freq, ctx.currentTime)
        overtone.frequency.setValueAtTime(freq * 2, ctx.currentTime)

        vib.frequency.setValueAtTime(4.2, ctx.currentTime)
        vibGain.gain.setValueAtTime(2.6, ctx.currentTime)
        vib.connect(vibGain)
        vibGain.connect(osc.frequency)

        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(1400, ctx.currentTime)

        const otGain = ctx.createGain()
        otGain.gain.setValueAtTime(0.08, ctx.currentTime)

        env.gain.setValueAtTime(0.001, ctx.currentTime)
        env.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + 0.45)
        env.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 1.8)
        env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.95)

        osc.connect(filter)
        overtone.connect(otGain)
        otGain.connect(filter)
        filter.connect(env)
        env.connect(master)

        osc.start()
        overtone.start()
        vib.start()
        osc.stop(ctx.currentTime + 3.0)
        overtone.stop(ctx.currentTime + 3.0)
        vib.stop(ctx.currentTime + 3.0)
      }
      playBansuriNote()
      this.timers.push(window.setInterval(playBansuriNote, 2600))
    }
  }

  public play(trackId: SoundTrackId, volume = 0.55): void {
    if (this.activeId === trackId) {
      this.stop()
      return
    }
    this.stop()

    const track = TRACK_MAP[trackId]
    if (!track) return

    this.activeId = trackId

    if (track.source === 'mp3' && track.url) {
      const resolvedUrl = `${import.meta.env.BASE_URL}${track.url.replace(/^\/+/, '')}`
      const audio = new Audio(resolvedUrl)
      audio.loop = true
      audio.preload = 'auto'
      audio.volume = Math.min(1, Math.max(0, volume))
      this.audio = audio
      void audio.play().catch(() => {
        // Ignore autoplay rejection if triggered without gesture
      })
      return
    }

    this.startSynthesized(trackId, volume)
  }
}

export const soundSynthesizer = new SoundSynthesizer()
