import type {
  WearableMetricKey,
  WearableProviderId,
  WearableReading,
  WearableSyncCadence,
} from '../types'

export interface WearableCatalogItem {
  provider: WearableProviderId
  name: string
  nameHi: string
  connectionMode: 'Web Bluetooth Live (GATT)' | 'Health Export / Companion Sync'
  connectionModeHi: string
  supportedMetrics: WearableMetricKey[]
  defaultCadence: WearableSyncCadence
  setupHint: string
  setupHintHi: string
}

export const WEARABLE_CATALOG: WearableCatalogItem[] = [
  {
    provider: 'bluetooth_ble',
    name: 'Bluetooth HR Band / Watch (BLE)',
    nameHi: 'ब्लूटूथ हार्ट-रेट बैंड / घड़ी (BLE)',
    connectionMode: 'Web Bluetooth Live (GATT)',
    connectionModeHi: 'वेब ब्लूटूथ लाइव (GATT)',
    supportedMetrics: ['hr', 'hrv'],
    defaultCadence: 'realtime_ble',
    setupHint: 'Direct GATT 0x180D Heart Rate & RR-interval HRV stream in Chrome/Edge.',
    setupHintHi: 'ब्राउज़र से सीधे ब्लूटूथ हार्ट-रेट और HRV सेंसर जोड़ें।',
  },
  {
    provider: 'apple_watch',
    name: 'Apple Watch (HealthKit)',
    nameHi: 'एप्पल वॉच (हेल्थकिट)',
    connectionMode: 'Health Export / Companion Sync',
    connectionModeHi: 'हेल्थ एक्सपोर्ट / नियमित सिंक',
    supportedMetrics: ['hr', 'hrv', 'sleep', 'steps', 'spo2'],
    defaultCadence: 'daily_checkin',
    setupHint: 'Import Apple Health XML/CSV export or sync today’s rings & sleep summary.',
    setupHintHi: 'Apple Health XML/CSV एक्सपोर्ट आयात करें या आज के स्लीप/हार्ट डेटा जोड़ें।',
  },
  {
    provider: 'fitbit',
    name: 'Fitbit / Pixel Watch',
    nameHi: 'फ़िटबिट / पिक्सल वॉच',
    connectionMode: 'Health Export / Companion Sync',
    connectionModeHi: 'हेल्थ एक्सपोर्ट / नियमित सिंक',
    supportedMetrics: ['hr', 'hrv', 'sleep', 'steps', 'spo2'],
    defaultCadence: 'hourly',
    setupHint: 'Upload Fitbit JSON/CSV export or log today’s Resting HR, HRV, and sleep.',
    setupHintHi: 'Fitbit JSON/CSV आयात करें या Resting HR, HRV और नींद सिंक करें।',
  },
  {
    provider: 'samsung_watch',
    name: 'Samsung Galaxy Watch',
    nameHi: 'सैमसंग गैलेक्सी वॉच',
    connectionMode: 'Health Export / Companion Sync',
    connectionModeHi: 'हेल्थ एक्सपोर्ट / नियमित सिंक',
    supportedMetrics: ['hr', 'hrv', 'sleep', 'steps', 'spo2'],
    defaultCadence: 'every_6h',
    setupHint: 'Import Samsung Health CSV/JSON export or record daily watch biometrics.',
    setupHintHi: 'Samsung Health CSV/JSON आयात करें या दैनिक बायोमेट्रिक्स सिंक करें।',
  },
  {
    provider: 'garmin',
    name: 'Garmin / Polar Sensor',
    nameHi: 'गार्मिन / पोलर सेंसर',
    connectionMode: 'Web Bluetooth Live (GATT)',
    connectionModeHi: 'ब्लूटूथ लाइव / एक्सपोर्ट सिंक',
    supportedMetrics: ['hr', 'hrv', 'sleep', 'steps'],
    defaultCadence: 'hourly',
    setupHint: 'Broadcast HR over BLE or import Garmin Connect CSV/JSON activity metrics.',
    setupHintHi: 'BLE ब्रॉडकास्ट से जुड़ें या Garmin CSV/JSON डेटा आयात करें।',
  },
  {
    provider: 'oura_ring',
    name: 'Oura / Smart Ring',
    nameHi: 'ओउरा / स्मार्ट रिंग',
    connectionMode: 'Health Export / Companion Sync',
    connectionModeHi: 'हेल्थ एक्सपोर्ट / नियमित सिंक',
    supportedMetrics: ['hr', 'hrv', 'sleep', 'spo2'],
    defaultCadence: 'daily_checkin',
    setupHint: 'Import Oura JSON/CSV readiness & nocturnal HRV or log morning ring vitals.',
    setupHintHi: 'Oura JSON/CSV नींद व HRV रिपोर्ट आयात करें या सुबह का डेटा जोड़ें।',
  },
  {
    provider: 'google_health_connect',
    name: 'Android Health Connect',
    nameHi: 'एंड्रॉइड हेल्थ कनेक्ट',
    connectionMode: 'Health Export / Companion Sync',
    connectionModeHi: 'हेल्थ एक्सपोर्ट / नियमित सिंक',
    supportedMetrics: ['hr', 'hrv', 'sleep', 'steps'],
    defaultCadence: 'hourly',
    setupHint: 'Import Android Health Connect / Mi Fit / Noise CSV or JSON health export.',
    setupHintHi: 'Health Connect / Noise / boAt CSV या JSON फ़ाइल आयात करें।',
  },
]

export function getWearableMeta(provider: WearableProviderId): WearableCatalogItem {
  return WEARABLE_CATALOG.find((item) => item.provider === provider) || WEARABLE_CATALOG[0]
}

// Minimal Web Bluetooth interfaces so strict TypeScript compiles cleanly across environments
interface BleCharacteristicLike {
  value?: DataView | null
  startNotifications: () => Promise<BleCharacteristicLike>
  stopNotifications?: () => Promise<BleCharacteristicLike>
  addEventListener: (type: 'characteristicvaluechanged', listener: (ev: Event) => void) => void
  removeEventListener: (type: 'characteristicvaluechanged', listener: (ev: Event) => void) => void
}

interface BleServiceLike {
  getCharacteristic: (uuid: number | string) => Promise<BleCharacteristicLike>
}

interface BleGattServerLike {
  connected: boolean
  connect: () => Promise<BleGattServerLike>
  disconnect: () => void
  getPrimaryService: (uuid: number | string) => Promise<BleServiceLike>
}

interface BleDeviceLike {
  id?: string
  name?: string
  gatt?: BleGattServerLike
  addEventListener: (type: 'gattserverdisconnected', listener: () => void) => void
  removeEventListener: (type: 'gattserverdisconnected', listener: () => void) => void
}

interface NavigatorWithBluetooth extends Navigator {
  bluetooth?: {
    requestDevice: (options: {
      filters?: Array<{ services?: Array<number | string> }>
      optionalServices?: Array<number | string>
      acceptAllDevices?: boolean
    }) => Promise<BleDeviceLike>
  }
}

export interface LiveBleSession {
  deviceId: string
  deviceName: string
  hasHeartRateStream: boolean
  batteryPercent?: number
  disconnect: () => void
}

export function isWebBluetoothAvailable(): boolean {
  if (typeof window === 'undefined') return false
  const nav = navigator as NavigatorWithBluetooth
  return typeof nav.bluetooth?.requestDevice === 'function'
}

export function isBluetoothAllowedByPolicy(): boolean {
  if (typeof document === 'undefined') return false
  const docAny = document as Document & {
    permissionsPolicy?: { allowsFeature?: (feature: string) => boolean }
    featurePolicy?: { allowsFeature?: (feature: string) => boolean }
  }
  try {
    if (typeof docAny.permissionsPolicy?.allowsFeature === 'function') {
      return docAny.permissionsPolicy.allowsFeature('bluetooth')
    }
    if (typeof docAny.featurePolicy?.allowsFeature === 'function') {
      return docAny.featurePolicy.allowsFeature('bluetooth')
    }
  } catch {
    // Ignore policy inspection errors
  }
  return true
}

export function isBluetoothPolicyBlockedError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err || '').toLowerCase()
  return (
    msg.includes('permissions policy') ||
    msg.includes('feature "bluetooth"') ||
    msg.includes("feature 'bluetooth'") ||
    msg.includes('disallowed by permissions')
  )
}

export function parseHeartRateMeasurement(value: DataView): { bpm: number; rrIntervalsMs: number[] } {
  const flags = value.getUint8(0)
  const rate16Bits = (flags & 0x01) !== 0
  let offset = 1

  const bpm = rate16Bits ? value.getUint16(offset, true) : value.getUint8(offset)
  offset += rate16Bits ? 2 : 1

  // Bit 3: Energy Expended Status
  if ((flags & 0x08) !== 0) {
    offset += 2
  }

  // Bit 4: RR-Interval present
  const rrIntervalsMs: number[] = []
  if ((flags & 0x10) !== 0) {
    while (offset + 1 < value.byteLength) {
      const rr1024 = value.getUint16(offset, true)
      rrIntervalsMs.push(Math.round((rr1024 / 1024) * 1000))
      offset += 2
    }
  }

  return { bpm, rrIntervalsMs }
}

export function computeRmssdMs(rrIntervalsMs: number[]): number | undefined {
  if (rrIntervalsMs.length < 2) return undefined
  let sumSquaredDiffs = 0
  let count = 0
  for (let i = 1; i < rrIntervalsMs.length; i += 1) {
    const diff = rrIntervalsMs[i] - rrIntervalsMs[i - 1]
    sumSquaredDiffs += diff * diff
    count += 1
  }
  if (count === 0) return undefined
  return Math.max(5, Math.min(220, Math.round(Math.sqrt(sumSquaredDiffs / count))))
}

interface BleCharacteristicReadable extends BleCharacteristicLike {
  readValue?: () => Promise<DataView>
}

export async function connectBluetoothHeartRateMonitor(callbacks: {
  scanAllWearables?: boolean
  onTelemetry: (reading: { bpm: number; hrvMs?: number }) => void
  onDisconnected: () => void
}): Promise<LiveBleSession> {
  const nav = navigator as NavigatorWithBluetooth
  if (!nav.bluetooth?.requestDevice) {
    throw new Error('WEB_BLUETOOTH_UNAVAILABLE')
  }

  const scanAll = callbacks.scanAllWearables ?? true

  let device: BleDeviceLike
  try {
    device = await nav.bluetooth.requestDevice(
      scanAll
        ? {
            acceptAllDevices: true,
            optionalServices: [
              0x180d, // Heart Rate
              0x180f, // Battery Service
              0x180a, // Device Information
              0x1814, // Running Speed & Cadence
              0x1810, // Blood Pressure
              0x1822, // Pulse Oximeter
              0x181c, // User Data
            ],
          }
        : {
            filters: [{ services: [0x180d] }],
            optionalServices: [0x180f, 0x180a],
          }
    )
  } catch (err) {
    if (isBluetoothPolicyBlockedError(err)) {
      throw new Error('BLUETOOTH_POLICY_BLOCKED')
    }
    throw err
  }

  if (!device.gatt) {
    throw new Error('Selected Bluetooth device does not expose a GATT connection.')
  }

  const server = await device.gatt.connect()

  let resolvedName = device.name?.trim() || ''
  let batteryPercent: number | undefined
  let hasHeartRateStream = false
  let hrCharacteristic: BleCharacteristicLike | null = null

  // Try optional Device Information Service (0x180A) to enrich device name if missing
  if (!resolvedName) {
    try {
      const devInfoService = await server.getPrimaryService(0x180a)
      const modelChar = (await devInfoService.getCharacteristic(0x2a24)) as BleCharacteristicReadable
      if (modelChar.readValue) {
        const val = await modelChar.readValue()
        const decoded = new TextDecoder().decode(val).replace(/\0/g, '').trim()
        if (decoded) resolvedName = decoded
      }
    } catch {
      // Device Information Service not exposed
    }
  }

  // Try optional Battery Service (0x180F)
  try {
    const batteryService = await server.getPrimaryService(0x180f)
    const batteryChar = (await batteryService.getCharacteristic(0x2a19)) as BleCharacteristicReadable
    if (batteryChar.readValue) {
      const val = await batteryChar.readValue()
      if (val.byteLength >= 1) {
        batteryPercent = Math.max(0, Math.min(100, val.getUint8(0)))
      }
    }
  } catch {
    // Battery Service not exposed
  }

  const rrBuffer: number[] = []

  const handleCharacteristicChanged = (event: Event) => {
    const target = event.target as unknown as BleCharacteristicLike | null
    if (!target?.value) return
    const { bpm, rrIntervalsMs } = parseHeartRateMeasurement(target.value)
    if (rrIntervalsMs.length > 0) {
      rrBuffer.push(...rrIntervalsMs)
      if (rrBuffer.length > 24) {
        rrBuffer.splice(0, rrBuffer.length - 24)
      }
    }
    const hrvMs = computeRmssdMs(rrBuffer)
    callbacks.onTelemetry({ bpm, hrvMs })
  }

  // Try Heart Rate Service (0x180D -> 0x2A37) if exposed by this wearable
  try {
    const hrService = await server.getPrimaryService(0x180d)
    const characteristic = await hrService.getCharacteristic(0x2a37)
    characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicChanged)
    await characteristic.startNotifications()
    hrCharacteristic = characteristic
    hasHeartRateStream = true
  } catch {
    // Wearable paired via Bluetooth without standard 0x180D GATT HR broadcast
    hasHeartRateStream = false
  }

  const handleDisconnected = () => {
    if (hrCharacteristic) {
      hrCharacteristic.removeEventListener('characteristicvaluechanged', handleCharacteristicChanged)
    }
    device.removeEventListener('gattserverdisconnected', handleDisconnected)
    callbacks.onDisconnected()
  }

  device.addEventListener('gattserverdisconnected', handleDisconnected)

  return {
    deviceId: device.id || `ble-${Date.now()}`,
    deviceName: resolvedName || 'Bluetooth Wearable',
    hasHeartRateStream,
    batteryPercent,
    disconnect: () => {
      try {
        if (hrCharacteristic) {
          void hrCharacteristic.stopNotifications?.()
        }
      } catch {
        // Ignore cleanup errors
      }
      if (device.gatt?.connected) {
        device.gatt.disconnect()
      }
    },
  }
}

export function parseWearableHealthFile(rawText: string, fileName: string): WearableReading {
  const lower = fileName.toLowerCase()
  const now = Date.now()
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

  if (lower.endsWith('.json')) {
    const parsed = JSON.parse(rawText) as Record<string, unknown> | Array<Record<string, unknown>>
    const record = Array.isArray(parsed) ? parsed[parsed.length - 1] || {} : parsed

    const pickNum = (keys: string[]): number | undefined => {
      for (const k of keys) {
        const v = record[k]
        if (typeof v === 'number' && Number.isFinite(v)) return v
        if (typeof v === 'string' && v.trim() && Number.isFinite(Number(v))) return Number(v)
      }
      return undefined
    }

    const hr = pickNum(['restingHeartRate', 'resting_hr', 'heartRate', 'heart_rate', 'hr', 'bpm'])
    const hrv = pickNum(['hrv', 'hrvMs', 'rmssd', 'sdnn'])
    const sleepMin = pickNum(['sleepMinutes', 'sleep_minutes', 'minutesAsleep'])
    const sleepHrsRaw = pickNum(['sleepHours', 'sleep_hours', 'sleep'])
    const sleepHours =
      typeof sleepHrsRaw === 'number'
        ? clamp(Number(sleepHrsRaw.toFixed(1)), 0, 24)
        : typeof sleepMin === 'number'
          ? clamp(Number((sleepMin / 60).toFixed(1)), 0, 24)
          : undefined
    const steps = pickNum(['steps', 'stepCount', 'step_count', 'dailySteps'])
    const spo2 = pickNum(['spo2', 'spo2Percent', 'oxygenSaturation'])

    if (
      hr === undefined &&
      hrv === undefined &&
      sleepHours === undefined &&
      steps === undefined &&
      spo2 === undefined
    ) {
      throw new Error('No recognized health keys (heartRate, hrv, sleepHours, steps, spo2) found in JSON.')
    }

    return {
      restingHrBpm: hr !== undefined ? clamp(Math.round(hr), 30, 220) : undefined,
      hrvMs: hrv !== undefined ? clamp(Math.round(hrv), 5, 250) : undefined,
      sleepHours,
      steps: steps !== undefined ? clamp(Math.round(steps), 0, 150000) : undefined,
      spo2Percent: spo2 !== undefined ? clamp(Math.round(spo2), 70, 100) : undefined,
      recordedAt: now,
      sourceType: 'file_import',
    }
  }

  if (lower.endsWith('.xml')) {
    const extractLatestValue = (identifier: string): number | undefined => {
      const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`type="${escaped}"[^>]*value="([0-9.]+)"`, 'g')
      let match: RegExpExecArray | null
      let lastVal: number | undefined
      while ((match = regex.exec(rawText)) !== null) {
        const parsed = Number(match[1])
        if (Number.isFinite(parsed)) lastVal = parsed
      }
      return lastVal
    }

    const hr =
      extractLatestValue('HKQuantityTypeIdentifierRestingHeartRate') ??
      extractLatestValue('HKQuantityTypeIdentifierHeartRate')
    const hrv = extractLatestValue('HKQuantityTypeIdentifierHeartRateVariabilitySDNN')
    const steps = extractLatestValue('HKQuantityTypeIdentifierStepCount')
    const spo2Raw = extractLatestValue('HKQuantityTypeIdentifierOxygenSaturation')
    const spo2 =
      spo2Raw !== undefined ? (spo2Raw <= 1 ? Math.round(spo2Raw * 100) : Math.round(spo2Raw)) : undefined

    if (hr === undefined && hrv === undefined && steps === undefined && spo2 === undefined) {
      throw new Error('No Apple Health HKQuantityTypeIdentifier records matched in this XML snippet.')
    }

    return {
      restingHrBpm: hr !== undefined ? clamp(Math.round(hr), 30, 220) : undefined,
      hrvMs: hrv !== undefined ? clamp(Math.round(hrv), 5, 250) : undefined,
      steps: steps !== undefined ? clamp(Math.round(steps), 0, 150000) : undefined,
      spo2Percent: spo2 !== undefined ? clamp(spo2, 70, 100) : undefined,
      recordedAt: now,
      sourceType: 'file_import',
    }
  }

  // CSV fallback
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length < 2) {
    throw new Error('CSV file must contain a header row and at least one data row.')
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/["']/g, ''))
  const lastRow = lines[lines.length - 1].split(',').map((c) => c.trim().replace(/["']/g, ''))

  const findCol = (aliases: string[]): number | undefined => {
    const idx = headers.findIndex((h) => aliases.some((a) => h.includes(a)))
    if (idx === -1 || !lastRow[idx]) return undefined
    const val = Number(lastRow[idx])
    return Number.isFinite(val) ? val : undefined
  }

  const hr = findCol(['resting_hr', 'heart_rate', 'heartrate', 'bpm', 'hr'])
  const hrv = findCol(['hrv', 'rmssd', 'sdnn'])
  const sleepHours = findCol(['sleep_hours', 'sleephours', 'sleep'])
  const steps = findCol(['steps', 'step_count'])
  const spo2 = findCol(['spo2', 'oxygen'])

  if (
    hr === undefined &&
    hrv === undefined &&
    sleepHours === undefined &&
    steps === undefined &&
    spo2 === undefined
  ) {
    throw new Error('No recognized health columns (hr, hrv, sleep, steps, spo2) found in CSV.')
  }

  return {
    restingHrBpm: hr !== undefined ? clamp(Math.round(hr), 30, 220) : undefined,
    hrvMs: hrv !== undefined ? clamp(Math.round(hrv), 5, 250) : undefined,
    sleepHours: sleepHours !== undefined ? clamp(Number(sleepHours.toFixed(1)), 0, 24) : undefined,
    steps: steps !== undefined ? clamp(Math.round(steps), 0, 150000) : undefined,
    spo2Percent: spo2 !== undefined ? clamp(Math.round(spo2), 70, 100) : undefined,
    recordedAt: now,
    sourceType: 'file_import',
  }
}
