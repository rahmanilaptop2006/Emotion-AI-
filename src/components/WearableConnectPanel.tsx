import { useEffect, useRef, useState } from 'react'
import {
  Activity,
  Bluetooth,
  Check,
  Clock,
  ExternalLink,
  Footprints,
  HeartPulse,
  Moon,
  Plus,
  RefreshCw,
  Trash2,
  Watch,
} from 'lucide-react'
import {
  WEARABLE_CATALOG,
  connectBluetoothHeartRateMonitor,
  getWearableMeta,
  isBluetoothAllowedByPolicy,
  isBluetoothPolicyBlockedError,
  isWebBluetoothAvailable,
  type LiveBleSession,
} from '../services/wearables'
import type {
  Language,
  WearableConnection,
  WearableMetricKey,
  WearableProviderId,
  WearableReading,
  WearableSyncCadence,
} from '../types'

interface WearableConnectPanelProps {
  wearables: WearableConnection[]
  hasWearable?: boolean
  onSetHasWearable: (val: boolean) => void
  language: Language
  onUpsertWearable: (connection: WearableConnection) => void
  onRemoveWearable: (wearableId: string) => void
  onApplyToCheckIn: (reading: WearableReading, deviceName: string) => void
  onDone?: () => void
}

const CADENCE_LABELS: Record<WearableSyncCadence, { en: string; hi: string }> = {
  realtime_ble: { en: 'Live BLE', hi: 'लाइव BLE' },
  hourly: { en: 'Hourly', hi: 'प्रति घंटा' },
  every_6h: { en: 'Every 6h', hi: 'हर 6 घंटे' },
  daily_checkin: { en: 'Daily', hi: 'दैनिक' },
}

const METRIC_LABELS: Record<WearableMetricKey, { en: string; hi: string }> = {
  hr: { en: 'HR', hi: 'हृदय गति' },
  hrv: { en: 'HRV', hi: 'HRV' },
  sleep: { en: 'Sleep', hi: 'नींद' },
  steps: { en: 'Steps', hi: 'कदम' },
  spo2: { en: 'SpO2', hi: 'SpO2' },
}

export function WearableConnectPanel({
  wearables,
  hasWearable,
  onSetHasWearable,
  language,
  onUpsertWearable,
  onRemoveWearable,
  onApplyToCheckIn,
  onDone,
}: WearableConnectPanelProps) {
  const isHi = language === 'hi'
  const bleSessionRef = useRef<LiveBleSession | null>(null)

  const [selectedProvider, setSelectedProvider] = useState<WearableProviderId>('apple_watch')
  const [deviceName, setDeviceName] = useState<string>('Apple Watch')
  const [cadence, setCadence] = useState<WearableSyncCadence>('daily_checkin')
  const [trackedMetrics, setTrackedMetrics] = useState<WearableMetricKey[]>(['hr', 'hrv', 'sleep', 'steps'])

  const [hrInput, setHrInput] = useState<string>('')
  const [hrvInput, setHrvInput] = useState<string>('')
  const [sleepInput, setSleepInput] = useState<string>('')
  const [stepsInput, setStepsInput] = useState<string>('')
  const [spo2Input, setSpo2Input] = useState<string>('')

  const [bleConnecting, setBleConnecting] = useState(false)
  const [bleActiveDevice, setBleActiveDevice] = useState<string | null>(null)
  const [bleHasHrStream, setBleHasHrStream] = useState<boolean>(false)
  const [bleBatteryPercent, setBleBatteryPercent] = useState<number | undefined>(undefined)
  const [bleScanAll, setBleScanAll] = useState<boolean>(true)
  const [bleLiveBpm, setBleLiveBpm] = useState<number | null>(null)
  const [bleLiveHrv, setBleLiveHrv] = useState<number | undefined>(undefined)
  const [blePolicyBlocked, setBlePolicyBlocked] = useState<boolean>(
    () => !isBluetoothAllowedByPolicy()
  )
  const webBluetoothSupported = isWebBluetoothAvailable()

  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [editingReadingId, setEditingReadingId] = useState<string | null>(null)
  const [appliedBanner, setAppliedBanner] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      bleSessionRef.current?.disconnect()
      bleSessionRef.current = null
    }
  }, [])

  const handleSelectProvider = (provider: WearableProviderId) => {
    const meta = getWearableMeta(provider)
    setSelectedProvider(provider)
    setDeviceName(isHi ? meta.nameHi : meta.name)
    setCadence(meta.defaultCadence)
    setTrackedMetrics(meta.supportedMetrics)
    setErrorMessage(null)
  }

  const toggleMetric = (metric: WearableMetricKey) => {
    setTrackedMetrics((prev) =>
      prev.includes(metric)
        ? prev.length > 1
          ? prev.filter((m) => m !== metric)
          : prev
        : [...prev, metric]
    )
  }

  const buildReadingFromInputs = (): WearableReading | undefined => {
    const hr = hrInput.trim() ? Number(hrInput) : undefined
    const hrv = hrvInput.trim() ? Number(hrvInput) : undefined
    const sleep = sleepInput.trim() ? Number(sleepInput) : undefined
    const steps = stepsInput.trim() ? Number(stepsInput) : undefined
    const spo2 = spo2Input.trim() ? Number(spo2Input) : undefined

    const hasAny =
      (hr !== undefined && Number.isFinite(hr)) ||
      (hrv !== undefined && Number.isFinite(hrv)) ||
      (sleep !== undefined && Number.isFinite(sleep)) ||
      (steps !== undefined && Number.isFinite(steps)) ||
      (spo2 !== undefined && Number.isFinite(spo2))

    if (!hasAny) return undefined

    return {
      restingHrBpm: hr !== undefined && Number.isFinite(hr) ? Math.max(25, Math.min(240, Math.round(hr))) : undefined,
      hrvMs: hrv !== undefined && Number.isFinite(hrv) ? Math.max(1, Math.min(300, Math.round(hrv))) : undefined,
      sleepHours: sleep !== undefined && Number.isFinite(sleep) ? Math.max(0, Math.min(24, Number(sleep.toFixed(1)))) : undefined,
      steps: steps !== undefined && Number.isFinite(steps) ? Math.max(0, Math.min(200000, Math.round(steps))) : undefined,
      spo2Percent: spo2 !== undefined && Number.isFinite(spo2) ? Math.max(60, Math.min(100, Math.round(spo2))) : undefined,
      recordedAt: Date.now(),
      sourceType: 'manual_log',
    }
  }

  const handlePairBluetooth = async () => {
    setErrorMessage(null)
    setStatusMessage(null)
    if (!isWebBluetoothAvailable()) {
      setErrorMessage(
        isHi
          ? 'इस ब्राउज़र में Web Bluetooth उपलब्ध नहीं है।'
          : 'Web Bluetooth is not supported in this browser.'
      )
      return
    }

    setBleConnecting(true)
    try {
      const session = await connectBluetoothHeartRateMonitor({
        scanAllWearables: bleScanAll,
        onTelemetry: ({ bpm, hrvMs }) => {
          setBleLiveBpm(bpm)
          if (hrvMs !== undefined) setBleLiveHrv(hrvMs)
        },
        onDisconnected: () => {
          setBleActiveDevice(null)
          setBleHasHrStream(false)
          setBleBatteryPercent(undefined)
          bleSessionRef.current = null
        },
      })
      bleSessionRef.current = session
      setBlePolicyBlocked(false)
      setBleActiveDevice(session.deviceName)
      setBleHasHrStream(session.hasHeartRateStream)
      setBleBatteryPercent(session.batteryPercent)
      setSelectedProvider('bluetooth_ble')
      setDeviceName(session.deviceName)
      setCadence('realtime_ble')

      const existingBle = wearables.find(
        (w) => w.provider === 'bluetooth_ble' && w.deviceName === session.deviceName
      )
      onUpsertWearable({
        id: existingBle?.id || `wr-ble-${Date.now()}`,
        provider: 'bluetooth_ble',
        deviceName: session.deviceName.slice(0, 80),
        connected: true,
        regularTrackingEnabled: true,
        syncCadence: 'realtime_ble',
        trackedMetrics: session.hasHeartRateStream ? ['hr', 'hrv'] : trackedMetrics,
        lastSyncedAt: Date.now(),
        latestReading: existingBle?.latestReading,
      })

      setStatusMessage(
        isHi
          ? `${session.deviceName} ब्लूटूथ से जुड़ गया है।`
          : `Connected to ${session.deviceName} via Bluetooth.`
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'BLUETOOTH_POLICY_BLOCKED' || isBluetoothPolicyBlockedError(err)) {
        setBlePolicyBlocked(true)
        setSelectedProvider('bluetooth_ble')
        setDeviceName(isHi ? 'ब्लूटूथ वॉच / बैंड' : 'Bluetooth Watch / Band')
        setCadence('realtime_ble')
        setErrorMessage(
          isHi
            ? 'ब्लूटूथ अनुमति के लिए "Open Direct Tab" पर क्लिक करें।'
            : 'Click "Open Direct Tab" to grant Bluetooth access.'
        )
      } else if (msg === 'WEB_BLUETOOTH_UNAVAILABLE') {
        setErrorMessage(
          isHi ? 'Web Bluetooth उपलब्ध नहीं है।' : 'Web Bluetooth is unavailable in this browser.'
        )
      } else {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : isHi
              ? 'ब्लूटूथ पेयरिंग विफल रही।'
              : 'Bluetooth pairing cancelled or failed.'
        )
      }
    } finally {
      setBleConnecting(false)
    }
  }

  const handleSaveBleToConnection = () => {
    if (!bleActiveDevice || bleLiveBpm === null) return
    const existingBle =
      wearables.find((w) => w.provider === 'bluetooth_ble' && w.deviceName === bleActiveDevice) ||
      wearables.find((w) => w.provider === 'bluetooth_ble')
    const reading: WearableReading = {
      restingHrBpm: bleLiveBpm,
      hrvMs: bleLiveHrv,
      recordedAt: Date.now(),
      sourceType: 'ble_live',
    }
    const conn: WearableConnection = {
      id: existingBle?.id || `wr-ble-${Date.now()}`,
      provider: 'bluetooth_ble',
      deviceName: bleActiveDevice.slice(0, 80),
      connected: true,
      regularTrackingEnabled: true,
      syncCadence: 'realtime_ble',
      trackedMetrics: bleLiveHrv !== undefined ? ['hr', 'hrv'] : ['hr'],
      lastSyncedAt: Date.now(),
      latestReading: reading,
    }
    onUpsertWearable(conn)
    onApplyToCheckIn(reading, conn.deviceName)
    setAppliedBanner(conn.deviceName)
    setStatusMessage(
      isHi ? `${conn.deviceName}: ${bleLiveBpm} BPM सेव किया गया।` : `Saved ${bleLiveBpm} BPM from ${conn.deviceName}.`
    )
  }

  const handleConnectWearable = () => {
    setErrorMessage(null)
    setStatusMessage(null)
    const trimmedName = deviceName.trim().slice(0, 80)
    if (!trimmedName) {
      setErrorMessage(isHi ? 'डिवाइस का नाम दर्ज करें।' : 'Enter a device name.')
      return
    }

    const reading = buildReadingFromInputs()
    const targetId = editingReadingId || `wr-${selectedProvider}-${Date.now()}`
    const existingTarget = wearables.find((w) => w.id === targetId)

    const connection: WearableConnection = {
      id: targetId,
      provider: existingTarget?.provider || selectedProvider,
      deviceName: trimmedName,
      connected: true,
      regularTrackingEnabled: true,
      syncCadence: cadence,
      trackedMetrics,
      lastSyncedAt: reading ? reading.recordedAt : existingTarget?.lastSyncedAt,
      latestReading: reading || existingTarget?.latestReading,
    }

    onUpsertWearable(connection)
    if (reading) {
      onApplyToCheckIn(reading, connection.deviceName)
      setAppliedBanner(connection.deviceName)
    }

    setStatusMessage(
      isHi ? `${connection.deviceName} जुड़ गया है।` : `${connection.deviceName} connected.`
    )
    setEditingReadingId(null)
    setHrInput('')
    setHrvInput('')
    setSleepInput('')
    setStepsInput('')
    setSpo2Input('')
  }

  const handleStartEditDevice = (conn: WearableConnection) => {
    setEditingReadingId(conn.id)
    setSelectedProvider(conn.provider)
    setDeviceName(conn.deviceName)
    setCadence(conn.syncCadence)
    setTrackedMetrics(conn.trackedMetrics)
    setHrInput(conn.latestReading?.restingHrBpm !== undefined ? String(conn.latestReading.restingHrBpm) : '')
    setHrvInput(conn.latestReading?.hrvMs !== undefined ? String(conn.latestReading.hrvMs) : '')
    setSleepInput(conn.latestReading?.sleepHours !== undefined ? String(conn.latestReading.sleepHours) : '')
    setStepsInput(conn.latestReading?.steps !== undefined ? String(conn.latestReading.steps) : '')
    setSpo2Input(conn.latestReading?.spo2Percent !== undefined ? String(conn.latestReading.spo2Percent) : '')
    setErrorMessage(null)
    setStatusMessage(null)
  }

  const activeRegularCount = wearables.filter((w) => w.connected && w.regularTrackingEnabled).length

  return (
    <div className="space-y-4">
      {/* Wearable Gate (Yes / No) */}
      <div className="clay-tile rounded-[20px] p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-[12px] clay-orb-sage text-white flex items-center justify-center shrink-0">
              <Watch className="w-4 h-4" />
            </span>
            <h4 className="font-display text-sm sm:text-base font-bold">
              {isHi ? 'क्या आपके पास वियरेबल्स हैं?' : 'Do you have a wearable device?'}
            </h4>
          </div>
          {wearables.length > 0 && hasWearable === true && (
            <span className="text-xs font-mono-num font-semibold text-[#344932] dark:text-[#A8C6A4]">
              {activeRegularCount > 0
                ? isHi
                  ? `${activeRegularCount} सक्रिय`
                  : `${activeRegularCount} active`
                : isHi
                  ? `${wearables.length} जुड़े`
                  : `${wearables.length} linked`}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            aria-pressed={hasWearable === true}
            onClick={() => onSetHasWearable(true)}
            className={`py-2.5 px-4 rounded-[14px] text-xs font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
              hasWearable === true ? 'clay-option-selected' : 'clay-tile clay-option-unselected'
            }`}
          >
            {hasWearable === true && <Check className="w-3.5 h-3.5 shrink-0" />}
            <span>{isHi ? 'हाँ (Yes)' : 'Yes'}</span>
          </button>
          <button
            type="button"
            aria-pressed={hasWearable === false}
            onClick={() => onSetHasWearable(false)}
            className={`py-2.5 px-4 rounded-[14px] text-xs font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
              hasWearable === false ? 'clay-option-selected' : 'clay-tile clay-option-unselected'
            }`}
          >
            {hasWearable === false && <Check className="w-3.5 h-3.5 shrink-0" />}
            <span>{isHi ? 'नहीं (No)' : 'No'}</span>
          </button>
        </div>
      </div>

      {hasWearable === false && (
        <div className="clay-well rounded-[16px] px-4 py-3 text-xs text-[#495847] dark:text-[#A8B7A4]">
          {isHi ? 'स्मार्टफ़ोन आधारित ट्रैकिंग सक्रिय है।' : 'Phone-only tracking is active.'}
        </div>
      )}

      {hasWearable === undefined && (
        <div className="clay-well rounded-[16px] px-4 py-3 text-xs text-[#495847] dark:text-[#A8B7A4]">
          {isHi ? 'कनेक्ट करने के लिए ऊपर "हाँ" चुनें।' : 'Select Yes above to connect your wearable.'}
        </div>
      )}

      {hasWearable === true && (
        <>
          {errorMessage && (
            <div className="clay-well rounded-[14px] px-4 py-3 text-xs font-medium text-[#B42318] dark:text-[#F48D84]">
              {errorMessage}
            </div>
          )}
          {statusMessage && (
            <div className="clay-card-tint rounded-[14px] px-4 py-3 text-xs font-semibold text-[#1B251A] dark:text-[#E5E8CE]">
              {statusMessage}
            </div>
          )}
          {appliedBanner && (
            <div className="clay-well rounded-[14px] px-4 py-2.5 text-xs text-[#344932] dark:text-[#A8C6A4] flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {isHi ? `${appliedBanner} डेटा अपडेट किया गया।` : `Synced vitals from ${appliedBanner}.`}
                </span>
              </span>
              {onDone && (
                <button
                  type="button"
                  onClick={onDone}
                  className="font-bold underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isHi ? 'आगे बढ़ें' : 'Continue'}
                </button>
              )}
            </div>
          )}

          {/* Direct Device Bluetooth Card */}
          <div className="clay-tile rounded-[18px] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 rounded-[12px] clay-orb-sage text-white flex items-center justify-center shrink-0">
                  <Bluetooth className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold">
                    {bleActiveDevice
                      ? isHi
                        ? `ब्लूटूथ जुड़ा: ${bleActiveDevice}`
                        : `Connected: ${bleActiveDevice}`
                      : isHi
                        ? 'डायरेक्ट डिवाइस ब्लूटूथ'
                        : 'Direct Device Bluetooth'}
                  </div>
                  <div className="text-[11px] text-[#495847] dark:text-[#A8B7A4]">
                    {bleActiveDevice ? (
                      <span className="font-mono-num font-semibold text-[#1B251A] dark:text-[#E5E8CE]">
                        {bleLiveBpm !== null
                          ? `${bleLiveBpm} BPM${bleLiveHrv !== undefined ? ` · HRV ${bleLiveHrv} ms` : ''}`
                          : bleHasHrStream
                            ? isHi
                              ? 'डेटा प्रतीक्षारत...'
                              : 'Waiting for HR...'
                            : isHi
                              ? 'ब्लूटूथ पेयर्ड'
                              : 'Bluetooth paired'}
                        {bleBatteryPercent !== undefined ? ` · ${bleBatteryPercent}%` : ''}
                      </span>
                    ) : !webBluetoothSupported ? (
                      isHi ? 'ब्राउज़र में उपलब्ध नहीं' : 'Unavailable in this browser'
                    ) : isHi ? (
                      'वॉच, बैंड या HR सेंसर जोड़ें'
                    ) : (
                      'Pair watch, fitness band, or HR strap'
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {bleActiveDevice ? (
                  <>
                    {bleLiveBpm !== null && (
                      <button
                        type="button"
                        onClick={handleSaveBleToConnection}
                        className="clay-btn-primary px-3 py-2 rounded-[12px] text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {isHi ? 'सेव करें' : 'Save & Apply'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        bleSessionRef.current?.disconnect()
                        bleSessionRef.current = null
                        setBleActiveDevice(null)
                        setBleHasHrStream(false)
                        setBleBatteryPercent(undefined)
                        setBleLiveBpm(null)
                        setBleLiveHrv(undefined)
                      }}
                      className="clay-btn-secondary px-3 py-2 rounded-[12px] text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {isHi ? 'डिस्कनेक्ट' : 'Disconnect'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={bleConnecting || !webBluetoothSupported}
                      onClick={handlePairBluetooth}
                      className="clay-btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      <Bluetooth className="w-3.5 h-3.5" />
                      <span>
                        {bleConnecting
                          ? isHi
                            ? 'खोज रहा है...'
                            : 'Scanning...'
                          : isHi
                            ? 'ब्लूटूथ से जोड़ें'
                            : 'Connect Bluetooth'}
                      </span>
                    </button>
                    {blePolicyBlocked && (
                      <a
                        href={typeof window !== 'undefined' ? window.location.href : '/'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="clay-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 rounded-[12px] text-xs font-semibold whitespace-nowrap shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{isHi ? 'नए टैब में खोलें' : 'Open Direct Tab'}</span>
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>

            {!bleActiveDevice && webBluetoothSupported && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#789575]/20 text-[11px] text-[#495847] dark:text-[#A8B7A4]">
                <span>
                  {bleScanAll
                    ? isHi
                      ? 'स्कैन: सभी नज़दीकी ब्लूटूथ डिवाइस'
                      : 'Scan: All Bluetooth wearables'
                    : isHi
                      ? 'स्कैन: केवल HR सेंसर'
                      : 'Scan: HR sensors only'}
                </span>
                <button
                  type="button"
                  onClick={() => setBleScanAll((prev) => !prev)}
                  className="font-semibold text-[#344932] dark:text-[#A8C6A4] hover:underline cursor-pointer"
                >
                  {bleScanAll
                    ? isHi
                      ? 'केवल HR'
                      : 'HR Only'
                    : isHi
                      ? 'सभी डिवाइस'
                      : 'All Devices'}
                </button>
              </div>
            )}
          </div>

          {/* Connected Wearables List */}
          {wearables.length > 0 && (
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-[#495847] dark:text-[#A8B7A4]">
                {isHi ? 'जुड़े हुए डिवाइस' : 'Connected Devices'}
              </div>
              {wearables.map((conn) => {
                const meta = getWearableMeta(conn.provider)
                const r = conn.latestReading
                return (
                  <div key={conn.id} className="clay-tile rounded-[18px] p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate">{conn.deviceName}</div>
                        <div className="text-[11px] text-[#495847] dark:text-[#A8B7A4] flex flex-wrap items-center gap-1.5">
                          <span>{isHi ? meta.nameHi : meta.name}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {isHi
                              ? CADENCE_LABELS[conn.syncCadence].hi
                              : CADENCE_LABELS[conn.syncCadence].en}
                          </span>
                          {conn.lastSyncedAt && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono-num">
                                {new Date(conn.lastSyncedAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            onUpsertWearable({
                              ...conn,
                              regularTrackingEnabled: !conn.regularTrackingEnabled,
                            })
                          }
                          className={`px-3 py-1.5 rounded-[11px] text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                            conn.regularTrackingEnabled ? 'clay-btn-primary' : 'clay-btn-secondary'
                          }`}
                        >
                          {conn.regularTrackingEnabled
                            ? isHi
                              ? 'सक्रिय'
                              : 'Active'
                            : isHi
                              ? 'रुका'
                              : 'Paused'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEditDevice(conn)}
                          aria-label="Update reading"
                          className="clay-btn-secondary p-2 rounded-[10px] cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveWearable(conn.id)}
                          aria-label="Remove wearable"
                          className="clay-btn-secondary p-2 rounded-[10px] text-[#B42318] dark:text-[#F48D84] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {r && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {r.restingHrBpm !== undefined && (
                          <div className="clay-well rounded-[12px] px-3 py-2 text-xs">
                            <div className="text-[10px] text-[#495847] dark:text-[#A8B7A4] inline-flex items-center gap-1">
                              <HeartPulse className="w-3 h-3" />
                              <span>{isHi ? 'हृदय गति' : 'HR'}</span>
                            </div>
                            <div className="font-mono-num font-bold mt-0.5">{r.restingHrBpm} bpm</div>
                          </div>
                        )}
                        {r.hrvMs !== undefined && (
                          <div className="clay-well rounded-[12px] px-3 py-2 text-xs">
                            <div className="text-[10px] text-[#495847] dark:text-[#A8B7A4] inline-flex items-center gap-1">
                              <Activity className="w-3 h-3" />
                              <span>HRV</span>
                            </div>
                            <div className="font-mono-num font-bold mt-0.5">{r.hrvMs} ms</div>
                          </div>
                        )}
                        {r.sleepHours !== undefined && (
                          <div className="clay-well rounded-[12px] px-3 py-2 text-xs">
                            <div className="text-[10px] text-[#495847] dark:text-[#A8B7A4] inline-flex items-center gap-1">
                              <Moon className="w-3 h-3" />
                              <span>{isHi ? 'नींद' : 'Sleep'}</span>
                            </div>
                            <div className="font-mono-num font-bold mt-0.5">{r.sleepHours.toFixed(1)} hrs</div>
                          </div>
                        )}
                        {r.steps !== undefined && (
                          <div className="clay-well rounded-[12px] px-3 py-2 text-xs">
                            <div className="text-[10px] text-[#495847] dark:text-[#A8B7A4] inline-flex items-center gap-1">
                              <Footprints className="w-3 h-3" />
                              <span>{isHi ? 'कदम' : 'Steps'}</span>
                            </div>
                            <div className="font-mono-num font-bold mt-0.5">{r.steps.toLocaleString()}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {r && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            onApplyToCheckIn(r, conn.deviceName)
                            setAppliedBanner(conn.deviceName)
                          }}
                          className="text-xs font-semibold text-[#344932] dark:text-[#A8C6A4] hover:underline cursor-pointer"
                        >
                          {isHi ? 'डैशबोर्ड पर लागू करें →' : 'Apply to Dashboard →'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Add / Update Wearable Form (Simplified, No Import File) */}
          <div className="clay-well rounded-[20px] p-4 space-y-4">
            <div className="text-xs font-bold inline-flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-[#344932] dark:text-[#A8C6A4]" />
              <span>
                {editingReadingId
                  ? isHi
                    ? 'डिवाइस अपडेट करें'
                    : 'Update Wearable'
                  : isHi
                    ? 'वियरेबल जोड़ें'
                    : 'Connect Wearable'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {WEARABLE_CATALOG.map((item) => {
                const active = selectedProvider === item.provider
                return (
                  <button
                    key={item.provider}
                    type="button"
                    aria-pressed={active}
                    disabled={Boolean(editingReadingId)}
                    onClick={() => handleSelectProvider(item.provider)}
                    className={`p-2.5 rounded-[13px] text-left text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-60 ${
                      active ? 'clay-option-selected' : 'clay-tile clay-option-unselected'
                    }`}
                  >
                    <div className="truncate">{isHi ? item.nameHi : item.name}</div>
                  </button>
                )
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="space-y-1 text-xs font-semibold">
                <span className="block text-[11px] text-[#495847] dark:text-[#A8B7A4]">
                  {isHi ? 'डिवाइस नाम' : 'Device Name'}
                </span>
                <input
                  type="text"
                  maxLength={80}
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="Apple Watch"
                  className="w-full clay-input px-3 py-2 rounded-[12px] text-xs font-medium"
                />
              </label>

              <label className="space-y-1 text-xs font-semibold">
                <span className="flex items-center gap-1 text-[11px] text-[#495847] dark:text-[#A8B7A4]">
                  <Clock className="w-3 h-3" />
                  <span>{isHi ? 'सिंक अंतराल' : 'Sync Schedule'}</span>
                </span>
                <select
                  value={cadence}
                  onChange={(e) => setCadence(e.target.value as WearableSyncCadence)}
                  className="w-full clay-input px-3 py-2 rounded-[12px] text-xs font-semibold"
                >
                  {(['daily_checkin', 'hourly', 'every_6h', 'realtime_ble'] as WearableSyncCadence[]).map(
                    (c) => (
                      <option key={c} value={c}>
                        {isHi ? CADENCE_LABELS[c].hi : CADENCE_LABELS[c].en}
                      </option>
                    )
                  )}
                </select>
              </label>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(METRIC_LABELS) as WearableMetricKey[]).map((m) => {
                const on = trackedMetrics.includes(m)
                return (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleMetric(m)}
                    className={`px-2.5 py-1 rounded-[10px] text-[11px] font-semibold cursor-pointer ${
                      on ? 'clay-btn-primary' : 'clay-tile'
                    }`}
                  >
                    {isHi ? METRIC_LABELS[m].hi : METRIC_LABELS[m].en}
                  </button>
                )
              })}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <label className="space-y-1">
                <span className="text-[10px] text-[#495847] dark:text-[#A8B7A4]">HR (bpm)</span>
                <input
                  type="number"
                  min={25}
                  max={240}
                  value={hrInput}
                  onChange={(e) => setHrInput(e.target.value)}
                  placeholder="72"
                  className="w-full clay-input px-2.5 py-1.5 rounded-[10px] text-xs font-mono-num"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] text-[#495847] dark:text-[#A8B7A4]">HRV (ms)</span>
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={hrvInput}
                  onChange={(e) => setHrvInput(e.target.value)}
                  placeholder="54"
                  className="w-full clay-input px-2.5 py-1.5 rounded-[10px] text-xs font-mono-num"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] text-[#495847] dark:text-[#A8B7A4]">Sleep (hrs)</span>
                <input
                  type="number"
                  min={0}
                  max={24}
                  step={0.5}
                  value={sleepInput}
                  onChange={(e) => setSleepInput(e.target.value)}
                  placeholder="7.5"
                  className="w-full clay-input px-2.5 py-1.5 rounded-[10px] text-xs font-mono-num"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] text-[#495847] dark:text-[#A8B7A4]">Steps</span>
                <input
                  type="number"
                  min={0}
                  max={200000}
                  value={stepsInput}
                  onChange={(e) => setStepsInput(e.target.value)}
                  placeholder="6800"
                  className="w-full clay-input px-2.5 py-1.5 rounded-[10px] text-xs font-mono-num"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] text-[#495847] dark:text-[#A8B7A4]">SpO2 (%)</span>
                <input
                  type="number"
                  min={60}
                  max={100}
                  value={spo2Input}
                  onChange={(e) => setSpo2Input(e.target.value)}
                  placeholder="98"
                  className="w-full clay-input px-2.5 py-1.5 rounded-[10px] text-xs font-mono-num"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {editingReadingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingReadingId(null)
                    setHrInput('')
                    setHrvInput('')
                    setSleepInput('')
                    setStepsInput('')
                    setSpo2Input('')
                  }}
                  className="h-10 px-4 rounded-[13px] clay-btn-secondary text-xs font-semibold cursor-pointer"
                >
                  {isHi ? 'रद्द करें' : 'Cancel'}
                </button>
              )}
              <button
                type="button"
                onClick={handleConnectWearable}
                className="flex-1 h-10 px-4 rounded-[13px] clay-btn-primary text-xs font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <Watch className="w-3.5 h-3.5" />
                <span>
                  {editingReadingId
                    ? isHi
                      ? 'अपडेट सेव करें'
                      : 'Save Update'
                    : isHi
                      ? 'वियरेबल जोड़ें'
                      : 'Connect Wearable'}
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
