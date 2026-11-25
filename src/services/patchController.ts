import { isBluetoothAllowedByPolicy, isBluetoothPolicyBlockedError, isWebBluetoothAvailable } from './wearables'

interface BleWritableCharacteristic {
  writeValue?: (data: BufferSource) => Promise<void>
  writeValueWithoutResponse?: (data: BufferSource) => Promise<void>
}

interface BleReadableCharacteristic {
  readValue?: () => Promise<DataView>
}

interface BleServiceLike {
  getCharacteristic: (uuid: number | string) => Promise<BleWritableCharacteristic & BleReadableCharacteristic>
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
      filters?: Array<{ services?: Array<number | string>; namePrefix?: string }>
      optionalServices?: Array<number | string>
      acceptAllDevices?: boolean
    }) => Promise<BleDeviceLike>
  }
}

export interface PatchControllerBleSession {
  deviceId: string
  deviceName: string
  firmware: string
  batteryPercent: number
  hasGattCommandChannel: boolean
  sendDoseRate: (rateMcgHr: number, mode: 'ai_auto' | 'doctor_order' | 'pulse') => Promise<boolean>
  disconnect: () => void
}

const NUS_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'
const NUS_RX_CHAR_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'

let activeBleController: PatchControllerBleSession | null = null

export function getActivePatchControllerBleSession(): PatchControllerBleSession | null {
  return activeBleController
}

export function disconnectActivePatchControllerBle(): void {
  if (activeBleController) {
    try {
      activeBleController.disconnect()
    } catch {
      // Ignore disconnect cleanup error
    }
    activeBleController = null
  }
}

export function emitPatchControllerDosePulse(rateMcgHr: number, source: 'ai' | 'doctor' | 'controller'): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent('emotion-ai-patch-dose-pulse', {
      detail: { rateMcgHr, source, timestamp: Date.now() },
    })
  )
}

export async function dispatchDoseCommandToController(
  rateMcgHr: number,
  mode: 'ai_auto' | 'doctor_order' | 'pulse'
): Promise<{ deliveredOverBle: boolean }> {
  emitPatchControllerDosePulse(
    rateMcgHr,
    mode === 'ai_auto' ? 'ai' : mode === 'doctor_order' ? 'doctor' : 'controller'
  )

  if (!activeBleController) {
    return { deliveredOverBle: false }
  }

  try {
    const ok = await activeBleController.sendDoseRate(rateMcgHr, mode)
    return { deliveredOverBle: ok }
  } catch {
    return { deliveredOverBle: false }
  }
}

export function canUsePatchBluetooth(): { supported: boolean; allowedByPolicy: boolean } {
  return {
    supported: isWebBluetoothAvailable(),
    allowedByPolicy: isBluetoothAllowedByPolicy(),
  }
}

export async function connectPatchControllerViaBluetooth(
  onDisconnected: () => void
): Promise<PatchControllerBleSession> {
  const nav = navigator as NavigatorWithBluetooth
  if (!nav.bluetooth?.requestDevice) {
    throw new Error('WEB_BLUETOOTH_UNAVAILABLE')
  }

  let device: BleDeviceLike
  try {
    device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        NUS_SERVICE_UUID,
        0x180f, // Battery
        0x180a, // Device Info
        0x180d, // Heart Rate
      ],
    })
  } catch (err) {
    if (isBluetoothPolicyBlockedError(err)) {
      throw new Error('BLUETOOTH_POLICY_BLOCKED')
    }
    throw err
  }

  if (!device.gatt) {
    throw new Error('Selected Bluetooth device does not support GATT services.')
  }

  const server = await device.gatt.connect()

  let deviceName = device.name?.trim() || 'AI Transdermal Patch Controller'
  let firmware = 'FW-2.4-BLE'
  let batteryPercent = 94
  let rxChar: BleWritableCharacteristic | null = null

  try {
    const devInfo = await server.getPrimaryService(0x180a)
    try {
      const fwChar = await devInfo.getCharacteristic(0x2a26)
      if (fwChar.readValue) {
        const fwVal = await fwChar.readValue()
        const decoded = new TextDecoder().decode(fwVal).replace(/\0/g, '').trim()
        if (decoded) firmware = decoded
      }
    } catch {
      // Optional firmware string
    }
    if (!device.name) {
      try {
        const modelChar = await devInfo.getCharacteristic(0x2a24)
        if (modelChar.readValue) {
          const modelVal = await modelChar.readValue()
          const decoded = new TextDecoder().decode(modelVal).replace(/\0/g, '').trim()
          if (decoded) deviceName = decoded
        }
      } catch {
        // Optional model name
      }
    }
  } catch {
    // Device Info service unavailable
  }

  try {
    const batterySvc = await server.getPrimaryService(0x180f)
    const batteryChar = await batterySvc.getCharacteristic(0x2a19)
    if (batteryChar.readValue) {
      const view = await batteryChar.readValue()
      if (view.byteLength >= 1) {
        batteryPercent = Math.max(1, Math.min(100, view.getUint8(0)))
      }
    }
  } catch {
    // Battery service unavailable
  }

  try {
    const nusSvc = await server.getPrimaryService(NUS_SERVICE_UUID)
    rxChar = await nusSvc.getCharacteristic(NUS_RX_CHAR_UUID)
  } catch {
    // Nordic UART write characteristic not exposed on non-patch BLE peripherals
    rxChar = null
  }

  const handleDisconnect = () => {
    if (activeBleController?.deviceId === (device.id || deviceName)) {
      activeBleController = null
    }
    onDisconnected()
  }

  device.addEventListener('gattserverdisconnected', handleDisconnect)

  const session: PatchControllerBleSession = {
    deviceId: device.id || `ble-patch-${Date.now()}`,
    deviceName,
    firmware,
    batteryPercent,
    hasGattCommandChannel: Boolean(rxChar),
    sendDoseRate: async (rateMcgHr, mode) => {
      if (!rxChar || !server.connected) return false
      const payload = new TextEncoder().encode(
        `DOSE:${Math.round(rateMcgHr)};MODE:${mode};TS:${Date.now()}\n`
      )
      if (rxChar.writeValueWithoutResponse) {
        await rxChar.writeValueWithoutResponse(payload)
        return true
      }
      if (rxChar.writeValue) {
        await rxChar.writeValue(payload)
        return true
      }
      return false
    },
    disconnect: () => {
      device.removeEventListener('gattserverdisconnected', handleDisconnect)
      if (server.connected) {
        server.disconnect()
      }
    },
  }

  disconnectActivePatchControllerBle()
  activeBleController = session
  return session
}
