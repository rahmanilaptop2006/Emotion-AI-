import type { SyrupPrescription, TonicLog } from '../types'

export interface ScheduledDoseSlot {
  id: 'morning' | 'midday' | 'evening'
  label: string
  labelHi: string
  timeHHMM: string
  doseMl: number
  tonicSlot: TonicLog['slot']
}

const VALID_HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/

export function normalizeHHMM(val: string | undefined, fallback: string): string {
  if (val && VALID_HHMM.test(val.trim())) return val.trim()
  return fallback
}

export function formatTime12h(hhmm: string): string {
  const clean = normalizeHHMM(hhmm, '08:00')
  const [hStr, mStr] = clean.split(':')
  const h24 = parseInt(hStr, 10)
  const suffix = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${String(h12).padStart(2, '0')}:${mStr} ${suffix}`
}

export function getScheduledDoseSlots(rx: SyrupPrescription): ScheduledDoseSlot[] {
  const morningTime = normalizeHHMM(rx.morningReminderTime, '08:00')
  const middayTime = normalizeHHMM(rx.middayReminderTime, '14:00')
  const eveningTime = normalizeHHMM(rx.eveningReminderTime, '20:00')

  const slots: ScheduledDoseSlot[] = []

  if (rx.morningDoseMl > 0 || rx.frequency === 'Once Daily' || rx.frequency === 'SOS Acute') {
    slots.push({
      id: 'morning',
      label: 'Morning Dose',
      labelHi: 'सुबह की खुराक',
      timeHHMM: morningTime,
      doseMl: rx.morningDoseMl,
      tonicSlot: 'Morning 10ml',
    })
  }

  if (rx.frequency === 'Every 8 Hours (TID)') {
    slots.push({
      id: 'midday',
      label: 'Midday Dose',
      labelHi: 'दोपहर की खुराक',
      timeHHMM: middayTime,
      doseMl: rx.morningDoseMl,
      tonicSlot: 'Morning 10ml',
    })
  }

  if (
    rx.frequency === 'Twice Daily (AM/PM)' ||
    rx.frequency === 'Every 8 Hours (TID)' ||
    (rx.frequency === 'SOS Acute' && rx.eveningDoseMl > 0)
  ) {
    slots.push({
      id: 'evening',
      label: 'Evening Dose',
      labelHi: 'शाम की खुराक',
      timeHHMM: eveningTime,
      doseMl: rx.eveningDoseMl,
      tonicSlot: 'Evening 10ml',
    })
  }

  return slots.sort((a, b) => a.timeHHMM.localeCompare(b.timeHHMM))
}

export function getNextUpcomingDose(
  rx: SyrupPrescription,
  now: Date = new Date()
): { slot: ScheduledDoseSlot; minutesUntil: number } | null {
  const slots = getScheduledDoseSlots(rx)
  if (slots.length === 0) return null

  const currentMins = now.getHours() * 60 + now.getMinutes()
  let best: { slot: ScheduledDoseSlot; minutesUntil: number } | null = null

  for (const slot of slots) {
    const [h, m] = slot.timeHHMM.split(':').map((n) => parseInt(n, 10))
    const targetMins = h * 60 + m
    const diff = targetMins >= currentMins ? targetMins - currentMins : 1440 - currentMins + targetMins
    if (!best || diff < best.minutesUntil) {
      best = { slot, minutesUntil: diff }
    }
  }

  return best
}

export function formatCountdown(minutesUntil: number, isHi: boolean): string {
  if (minutesUntil === 0) return isHi ? 'अभी समय हुआ है' : 'Due right now'
  const hrs = Math.floor(minutesUntil / 60)
  const mins = minutesUntil % 60
  if (hrs === 0) return isHi ? `${mins} मिनट में` : `in ${mins}m`
  if (mins === 0) return isHi ? `${hrs} घंटे में` : `in ${hrs}h`
  return isHi ? `${hrs} घं ${mins} मि में` : `in ${hrs}h ${mins}m`
}

let activeAudioCtx: AudioContext | null = null

export function playSyrupAlarmChime(): void {
  if (typeof window === 'undefined') return
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return

    if (!activeAudioCtx || activeAudioCtx.state === 'closed') {
      activeAudioCtx = new Ctx()
    }
    const ctx = activeAudioCtx
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {})
    }

    // Gentle double-pattern clinical chime (C5 - E5 - G5 - C6)
    const notes = [523.25, 659.25, 783.99, 1046.5]
    const now = ctx.currentTime

    for (let repeat = 0; repeat < 2; repeat++) {
      const baseOffset = repeat * 1.15
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + baseOffset + idx * 0.16)

        gain.gain.setValueAtTime(0.0001, now + baseOffset + idx * 0.16)
        gain.gain.exponentialRampToValueAtTime(0.16, now + baseOffset + idx * 0.16 + 0.03)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + baseOffset + idx * 0.16 + 0.42)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now + baseOffset + idx * 0.16)
        osc.stop(now + baseOffset + idx * 0.16 + 0.45)
      })
    }
  } catch {
    // Ignore audio context restrictions if user has not interacted yet
  }
}

export function getBrowserNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function requestBrowserNotificationPermission(): Promise<
  NotificationPermission | 'unsupported'
> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

export function sendBrowserDoseNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(title, {
      body,
      icon: `${import.meta.env.BASE_URL}favicon.svg`,
      tag: 'emotion-ai-syrup-alarm',
    })
  } catch {
    // Some embedded contexts block direct Notification construction
  }
}
