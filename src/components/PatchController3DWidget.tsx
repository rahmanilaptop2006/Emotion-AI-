import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import {
  Activity,
  BatteryCharging,
  Bluetooth,
  CheckCircle2,
  Cpu,
  Eye,
  Link2,
  Link2Off,
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react'
import {
  canUsePatchBluetooth,
  connectPatchControllerViaBluetooth,
  disconnectActivePatchControllerBle,
  dispatchDoseCommandToController,
} from '../services/patchController'
import type { Language, PatchState } from '../types'

interface PatchController3DWidgetProps {
  patch: PatchState
  language: Language
  effectiveFloor: number
  effectiveHourlyCap: number
  doctorAuthorized: boolean
  onUpdatePatch: (updater: (patch: PatchState) => PatchState) => void
  onRunAiRelease?: () => void
  compact?: boolean
}

type ControllerView = 'top' | 'bottom' | 'xray'

function createRoundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}

function createSlabGeometry(
  w: number,
  h: number,
  r: number,
  depth: number,
  bevel: number
): THREE.ExtrudeGeometry {
  return new THREE.ExtrudeGeometry(createRoundedRectShape(w, h, r), {
    depth,
    bevelEnabled: true,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 3,
    curveSegments: 12,
  })
}

export function PatchController3DWidget({
  patch,
  language,
  effectiveFloor,
  effectiveHourlyCap,
  onUpdatePatch,
  onRunAiRelease,
  compact = false,
}: PatchController3DWidgetProps) {
  const isHi = language === 'hi'
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const [view, setView] = useState<ControllerView>(patch.controllerView || 'top')
  const [connectingMode, setConnectingMode] = useState<'none' | 'ble' | 'digital'>('none')
  const [bleError, setBleError] = useState<string | null>(null)
  const [pulseFlashUntil, setPulseFlashUntil] = useState<number>(0)

  const viewRef = useRef<ControllerView>(view)
  const connectedRef = useRef<boolean>(Boolean(patch.controllerConnected))
  const rateRef = useRef<number>(patch.infusionRateMcgHr)
  const pulseFlashRef = useRef<number>(0)

  useEffect(() => {
    viewRef.current = view
  }, [view])

  useEffect(() => {
    connectedRef.current = Boolean(patch.controllerConnected)
  }, [patch.controllerConnected])

  useEffect(() => {
    rateRef.current = patch.infusionRateMcgHr
  }, [patch.infusionRateMcgHr])

  useEffect(() => {
    const onDosePulse = () => {
      const until = Date.now() + 1800
      pulseFlashRef.current = until
      setPulseFlashUntil(until)
    }
    window.addEventListener('emotion-ai-patch-dose-pulse', onDosePulse)
    return () => window.removeEventListener('emotion-ai-patch-dose-pulse', onDosePulse)
  }, [])

  // Three.js Hardware Scene replicating AI_Transdermal_Patch_Controller
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    } catch {
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

    const scene = new THREE.Scene()
    const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 100)
    cam.position.set(0, 0, 8.2)

    scene.add(new THREE.AmbientLight(0xffffff, 0.78))
    const dl1 = new THREE.DirectionalLight(0xffffff, 0.95)
    dl1.position.set(4, 5, 8)
    scene.add(dl1)
    const dl2 = new THREE.DirectionalLight(0x88ffee, 0.45)
    dl2.position.set(-5, -4, -6)
    scene.add(dl2)

    const dev = new THREE.Group()
    scene.add(dev)

    const geometries: THREE.BufferGeometry[] = []
    const materials: THREE.Material[] = []
    const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      geometries.push(g)
      return g
    }
    const trackMat = <T extends THREE.Material>(m: T): T => {
      materials.push(m)
      return m
    }

    // Thin matte black controller shell
    const shellMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x0a0a0c,
        roughness: 0.35,
        metalness: 0.5,
        transparent: true,
        opacity: 1,
      })
    )
    dev.add(new THREE.Mesh(trackGeo(createSlabGeometry(3.2, 2.1, 0.55, 0.1, 0.03)), shellMat))

    // Top status LED ring & center emitter
    const ledMat = trackMat(new THREE.MeshBasicMaterial({ color: 0x3fd1c9 }))
    const led = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.2, 0.03, 10, 40)), ledMat)
    led.position.set(-0.85, 0.4, 0.135)
    dev.add(led)

    const dot = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(0.09, 24)), ledMat)
    dot.position.set(-0.85, 0.4, 0.136)
    dev.add(dot)

    // Charging bay + plug + docked cable on right edge
    const bayMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.9 }))
    const bay = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.06, 0.46, 0.07)), bayMat)
    bay.position.set(1.61, 0, 0.05)
    dev.add(bay)

    const metalMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x9a9ea3, metalness: 0.9, roughness: 0.3 })
    )
    const plug = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.3, 0.38, 0.06)), metalMat)
    plug.position.set(1.47, 0, 0.05)
    dev.add(plug)

    const cableMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x1a1a1d, roughness: 0.6 }))
    const cable = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.03, 0.03, 1, 10)), cableMat)
    cable.rotation.z = Math.PI / 2
    cable.scale.y = 0.3
    cable.position.set(1.2, 0, 0.05)
    dev.add(cable)

    // Patch underside: adhesive pad + hydrogel reservoir + 7x7 microneedles
    const padMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xe3b894, roughness: 0.9 }))
    const pad = new THREE.Mesh(
      trackGeo(createSlabGeometry(3.6, 2.5, 0.65, 0.02, 0.012)),
      padMat
    )
    pad.position.z = -0.07
    dev.add(pad)

    const resMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xbfe9e5,
        roughness: 0.4,
        emissive: 0x2a8f88,
        emissiveIntensity: 0.5,
      })
    )
    const res = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.7, 0.7, 0.02, 48)), resMat)
    res.rotation.x = Math.PI / 2
    res.position.set(0, 0, -0.09)
    dev.add(res)

    const mnGeo = trackGeo(new THREE.ConeGeometry(0.022, 0.05, 6))
    const mnMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0xcfd4d8, metalness: 0.8, roughness: 0.3 })
    )
    for (let i = 0; i < 7; i += 1) {
      for (let j = 0; j < 7; j += 1) {
        const a = (i - 3) * 0.17
        const b = (j - 3) * 0.17
        if (a * a + b * b > 0.45) continue
        const m = new THREE.Mesh(mnGeo, mnMat)
        m.rotation.x = -Math.PI / 2
        m.position.set(a, b, -0.12)
        dev.add(m)
      }
    }

    // Internal PCB, AI processor chip, gold pins, battery & BLE loop antenna
    const inner = new THREE.Group()
    dev.add(inner)

    const pcbMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x0b5d3b, roughness: 0.5 }))
    const pcb = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.6, 1.5, 0.015)), pcbMat)
    pcb.position.z = 0.03
    inner.add(pcb)

    const chipMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x14181b,
        roughness: 0.3,
        metalness: 0.6,
        emissive: 0x0e8f8a,
        emissiveIntensity: 0.6,
      })
    )
    const chip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.7, 0.7, 0.04)), chipMat)
    chip.position.set(-0.2, 0.1, 0.06)
    inner.add(chip)

    const pinMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.3 })
    )
    const pinVGeo = trackGeo(new THREE.BoxGeometry(0.06, 0.12, 0.02))
    const pinHGeo = trackGeo(new THREE.BoxGeometry(0.12, 0.06, 0.02))
    for (let k = 0; k < 6; k += 1) {
      ;[1, -1].forEach((s) => {
        const p1 = new THREE.Mesh(pinVGeo, pinMat)
        p1.position.set(-0.2 + (k - 2.5) * 0.12, 0.1 + s * 0.4, 0.05)
        inner.add(p1)
        const p2 = new THREE.Mesh(pinHGeo, pinMat)
        p2.position.set(-0.2 + s * 0.4, 0.1 + (k - 2.5) * 0.12, 0.05)
        inner.add(p2)
      })
    }

    const battMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x3c6ea5, roughness: 0.5 }))
    const batt = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.9, 0.8, 0.05)), battMat)
    batt.position.set(0.7, -0.1, 0.06)
    inner.add(batt)

    const antMat = trackMat(new THREE.MeshBasicMaterial({ color: 0x3fd1c9 }))
    const ant = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(0.28, 0.02, 8, 32, Math.PI * 1.5)),
      antMat
    )
    ant.position.set(-0.95, -0.4, 0.05)
    inner.add(ant)

    // Pointer drag interaction
    const target = { x: 0, y: 0 }
    const rot = { x: 0, y: 0 }
    let drag = false
    let lx = 0
    let ly = 0
    let lastAppliedView: ControllerView | null = null

    const syncTargetForView = (v: ControllerView) => {
      target.x = v === 'xray' ? -0.35 : 0
      target.y = v === 'bottom' ? Math.PI : v === 'xray' ? 0.5 : 0
      inner.visible = v === 'xray'
    }
    syncTargetForView(viewRef.current)
    lastAppliedView = viewRef.current

    const handlePointerDown = (e: PointerEvent) => {
      drag = true
      lx = e.clientX
      ly = e.clientY
      canvas.setPointerCapture(e.pointerId)
    }
    const handlePointerUp = () => {
      drag = false
    }
    const handlePointerMove = (e: PointerEvent) => {
      if (!drag) return
      target.y += (e.clientX - lx) * 0.01
      target.x += (e.clientY - ly) * 0.01
      lx = e.clientX
      ly = e.clientY
    }

    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointerup', handlePointerUp)
    canvas.addEventListener('pointercancel', handlePointerUp)
    canvas.addEventListener('pointermove', handlePointerMove)

    const resize = () => {
      const w = Math.max(120, container.clientWidth)
      const h = Math.max(120, container.clientHeight)
      renderer.setSize(w, h, false)
      cam.aspect = w / h
      cam.position.z = w / h < 0.9 ? 10.2 : w / h < 1.3 ? 8.2 : 6.4
      cam.updateProjectionMatrix()
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)

    let rafId = 0
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const animate = (t: number) => {
      rafId = requestAnimationFrame(animate)

      const curView = viewRef.current
      if (curView !== lastAppliedView) {
        syncTargetForView(curView)
        lastAppliedView = curView
      }

      const targetOpacity = curView === 'xray' ? 0.16 : 1
      rot.x += (target.x - rot.x) * 0.1
      rot.y += (target.y - rot.y) * 0.1
      dev.rotation.x = rot.x
      dev.rotation.y = rot.y
      shellMat.opacity += (targetOpacity - shellMat.opacity) * 0.12

      const isConnected = connectedRef.current
      const isPulsingRelease = Date.now() < pulseFlashRef.current
      const speed = isPulsingRelease
        ? 0.014
        : isConnected
          ? 0.002 + Math.min(0.006, rateRef.current * 0.00003)
          : 0.0012
      const pulse = reduceMotion ? 1 : 0.6 + 0.4 * Math.sin(t * speed)

      if (!isConnected) {
        ledMat.color.setRGB(0.55 * pulse, 0.45 * pulse, 0.25 * pulse)
        chipMat.emissiveIntensity = 0.15
        resMat.emissiveIntensity = 0.15
      } else if (isPulsingRelease) {
        ledMat.color.setRGB(0.32 * pulse, 0.95 * pulse, 0.72 * pulse)
        chipMat.emissiveIntensity = 1.4
        resMat.emissiveIntensity = 1.15
      } else {
        ledMat.color.setRGB(0.25 * pulse, 0.82 * pulse, 0.78 * pulse)
        chipMat.emissiveIntensity = 0.35 + pulse * 0.75
        resMat.emissiveIntensity = 0.45 + Math.min(0.45, rateRef.current / 280)
      }

      renderer.render(scene, cam)
    }

    rafId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafId)
      observer.disconnect()
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('pointercancel', handlePointerUp)
      canvas.removeEventListener('pointermove', handlePointerMove)
      geometries.forEach((g) => g.dispose())
      materials.forEach((m) => m.dispose())
      renderer.dispose()
    }
  }, [])

  const isConnected = Boolean(patch.controllerConnected)
  const isReleaseFlashing = Date.now() < pulseFlashUntil
  const bluetoothCheck = canUsePatchBluetooth()

  const handleConnectDigitalController = async () => {
    setBleError(null)
    setConnectingMode('digital')
    const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const releaseRate = Math.max(effectiveFloor, Math.min(effectiveHourlyCap, patch.infusionRateMcgHr))
    await dispatchDoseCommandToController(releaseRate, 'ai_auto')

    onUpdatePatch((prev) => ({
      ...prev,
      active: true,
      controllerConnected: true,
      controllerDeviceName: 'AI Transdermal Patch Controller',
      controllerTransport: 'digital_link',
      controllerFirmware: 'FW-2.4-CL',
      controllerBatteryPct: prev.controllerBatteryPct ?? 96,
      lastDoseReleaseAt: timeLabel,
      lastDoseReleaseMcgHr: releaseRate,
      cumulativeReleasedMcg: Math.round((prev.cumulativeReleasedMcg ?? 0) + releaseRate / 6),
      logs: [
        {
          id: `ctrl-conn-${Date.now()}`,
          time: timeLabel,
          rateMcgHr: releaseRate,
          note: `AI Patch Controller connected & synced to automated dose release (${releaseRate} mcg/hr).`,
          actor: 'controller',
        },
        ...prev.logs.slice(0, 6),
      ],
    }))
    setConnectingMode('none')
  }

  const handlePairBleController = async () => {
    setBleError(null)
    if (!bluetoothCheck.supported || !bluetoothCheck.allowedByPolicy) {
      setBleError(
        isHi
          ? 'इस एम्बेडेड ब्राउज़र में Web Bluetooth अवरुद्ध है — नीचे "Connect AI Patch Controller" बटन से सीधे कंट्रोलर लिंक करें।'
          : 'Browser Bluetooth permission is restricted in this frame. Use "Connect AI Patch Controller" to link directly.'
      )
      return
    }

    setConnectingMode('ble')
    try {
      const session = await connectPatchControllerViaBluetooth(() => {
        const discTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        onUpdatePatch((prev) => ({
          ...prev,
          controllerConnected: false,
          logs: [
            {
              id: `ctrl-disc-${Date.now()}`,
              time: discTime,
              rateMcgHr: prev.infusionRateMcgHr,
              note: 'AI Patch Controller Bluetooth connection closed.',
              actor: 'controller',
            },
            ...prev.logs.slice(0, 6),
          ],
        }))
      })

      const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const releaseRate = Math.max(effectiveFloor, Math.min(effectiveHourlyCap, patch.infusionRateMcgHr))
      await dispatchDoseCommandToController(releaseRate, 'ai_auto')

      onUpdatePatch((prev) => ({
        ...prev,
        active: true,
        controllerConnected: true,
        controllerDeviceName: session.deviceName,
        controllerTransport: 'ble',
        controllerFirmware: session.firmware,
        controllerBatteryPct: session.batteryPercent,
        lastDoseReleaseAt: timeLabel,
        lastDoseReleaseMcgHr: releaseRate,
        cumulativeReleasedMcg: Math.round((prev.cumulativeReleasedMcg ?? 0) + releaseRate / 6),
        logs: [
          {
            id: `ctrl-ble-${Date.now()}`,
            time: timeLabel,
            rateMcgHr: releaseRate,
            note: `BLE paired with ${session.deviceName} (${session.firmware}) · Automated release ${releaseRate} mcg/hr active.`,
            actor: 'controller',
          },
          ...prev.logs.slice(0, 6),
        ],
      }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err || '')
      if (msg === 'BLUETOOTH_POLICY_BLOCKED' || msg === 'WEB_BLUETOOTH_UNAVAILABLE') {
        setBleError(
          isHi
            ? 'Bluetooth उपलब्ध नहीं है। आप "Connect AI Patch Controller" से सीधे कंट्रोलर जोड़ सकते हैं।'
            : 'Direct BLE picker is unavailable here. Click "Connect AI Patch Controller" to link your patch unit.'
        )
      } else if (!msg.toLowerCase().includes('cancel')) {
        setBleError(msg || 'Could not pair Bluetooth patch controller.')
      }
    } finally {
      setConnectingMode('none')
    }
  }

  const handleDisconnectController = () => {
    disconnectActivePatchControllerBle()
    const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    onUpdatePatch((prev) => ({
      ...prev,
      controllerConnected: false,
      logs: [
        {
          id: `ctrl-off-${Date.now()}`,
          time: timeLabel,
          rateMcgHr: prev.infusionRateMcgHr,
          note: 'AI Patch Controller disconnected. Automated dose standby.',
          actor: 'controller',
        },
        ...prev.logs.slice(0, 6),
      ],
    }))
  }

  const handleTriggerDoseRelease = async () => {
    if (!isConnected) return
    const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const boundedRate = Math.max(effectiveFloor, Math.min(effectiveHourlyCap, patch.infusionRateMcgHr))
    const pulseMcg = Math.max(8, Math.round(boundedRate / 6))
    const { deliveredOverBle } = await dispatchDoseCommandToController(boundedRate, 'pulse')

    onUpdatePatch((prev) => ({
      ...prev,
      infusionRateMcgHr: boundedRate,
      reservoirPercent: Math.max(8, Number((prev.reservoirPercent - 0.3).toFixed(1))),
      lastDoseReleaseAt: timeLabel,
      lastDoseReleaseMcgHr: boundedRate,
      cumulativeReleasedMcg: (prev.cumulativeReleasedMcg ?? 0) + pulseMcg,
      logs: [
        {
          id: `pulse-${Date.now()}`,
          time: timeLabel,
          rateMcgHr: boundedRate,
          note: `AI Patch Controller released ${pulseMcg} mcg micro-bolus at ${boundedRate} mcg/hr${deliveredOverBle ? ' (BLE GATT confirmed)' : ''}.`,
          actor: 'controller',
        },
        ...prev.logs.slice(0, 6),
      ],
    }))
  }

  return (
    <div className="rounded-[24px] clay-well border border-[#789575]/30 p-4 sm:p-5 space-y-4">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 ${
              isConnected ? 'clay-btn-primary' : 'clay-tile text-[#344932] dark:text-[#A8C6A4]'
            }`}
          >
            <Cpu className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-[#1B251A] dark:text-[#E5E8CE] flex flex-wrap items-center gap-2">
              <span>{isHi ? 'AI पैच कंट्रोलर कनेक्शन' : 'AI Transdermal Patch Controller'}</span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] text-[10px] font-bold uppercase tracking-wider ${
                  isConnected
                    ? 'bg-[#344932] text-white'
                    : 'bg-[#E5ECD7] dark:bg-[#233623] text-[#495847] dark:text-[#A8B7A4]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isConnected ? 'bg-[#7CE8B4] animate-pulse' : 'bg-[#8C9B84]'
                  }`}
                />
                <span>{isConnected ? (isHi ? 'कनेक्टेड' : 'Connected') : isHi ? 'डिस्कनेक्टेड' : 'Not Connected'}</span>
              </span>
            </div>
            <p className="text-[11px] text-[#495847] dark:text-[#A8B7A4] truncate">
              {isConnected
                ? `${patch.controllerDeviceName || 'AI Transdermal Patch Controller'} · ${
                    patch.controllerTransport === 'ble' ? 'Bluetooth BLE' : 'Closed-Loop Link'
                  } · ${patch.controllerFirmware || 'FW-2.4'}`
                : isHi
                  ? 'स्वचालित AI पैच खुराक रिलीज़ चलाने के लिए पैच कंट्रोलर कनेक्ट करें।'
                  : 'Connect the 3D hardware patch controller to drive automated AI dose release.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isConnected ? (
            <>
              <button
                type="button"
                disabled={connectingMode !== 'none'}
                onClick={handleConnectDigitalController}
                className="clay-btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] text-xs font-semibold cursor-pointer disabled:opacity-60"
              >
                {connectingMode === 'digital' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Link2 className="w-3.5 h-3.5" />
                )}
                <span>{isHi ? 'AI पैच कंट्रोलर जोड़ें' : 'Connect AI Patch Controller'}</span>
              </button>

              <button
                type="button"
                disabled={connectingMode !== 'none'}
                onClick={handlePairBleController}
                className="clay-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 rounded-[12px] text-xs font-semibold cursor-pointer disabled:opacity-60"
              >
                {connectingMode === 'ble' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Bluetooth className="w-3.5 h-3.5 text-[#344932] dark:text-[#A8C6A4]" />
                )}
                <span>{isHi ? 'ब्लूटूथ पेयर करें' : 'Pair via Bluetooth'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleTriggerDoseRelease}
                className="clay-btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] text-xs font-semibold cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isHi ? 'AI खुराक रिलीज़ करें' : 'Release AI Dose Pulse'}</span>
              </button>

              {onRunAiRelease && (
                <button
                  type="button"
                  onClick={onRunAiRelease}
                  className="clay-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 rounded-[12px] text-xs font-semibold cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#4E6B4B]" />
                  <span>{isHi ? 'ऑटो AI सिंक' : 'Sync AI Rate'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDisconnectController}
                className="clay-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 rounded-[12px] text-xs font-semibold text-[#B42318] dark:text-[#F07D73] cursor-pointer"
              >
                <Link2Off className="w-3.5 h-3.5" />
                <span>{isHi ? 'डिस्कनेक्ट' : 'Disconnect'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {bleError && (
        <div className="rounded-[12px] bg-[#FDF2F0] dark:bg-[#2F1B19] border border-[#D86A60]/40 px-3 py-2 text-xs text-[#8C2B23] dark:text-[#F5B0A8]">
          {bleError}
        </div>
      )}

      {/* 3D Interactive Patch Hardware Viewport + Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left: 3D Hardware Controller Canvas */}
        <div className="lg:col-span-7 rounded-[18px] bg-[#E3EAD8] dark:bg-[#101912] border border-[#789575]/25 p-3 flex flex-col justify-between">
          <div
            ref={containerRef}
            className={`relative w-full ${compact ? 'h-48' : 'h-56 sm:h-64'} rounded-[14px] overflow-hidden`}
          >
            <canvas
              ref={canvasRef}
              aria-label="Interactive 3D AI Transdermal Patch Controller"
              className="w-full h-full block touch-none cursor-grab active:cursor-grabbing"
            />

            {/* Overlay Live Status Pill */}
            <div className="pointer-events-none absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-[9px] bg-[#141E14]/80 text-[#E5E8CE] text-[10px] font-semibold backdrop-blur-sm">
              <Activity className="w-3 h-3 text-[#6FE3D8]" />
              <span className="font-mono-num">
                {isConnected
                  ? isReleaseFlashing
                    ? `RELEASING PULSE · ${patch.infusionRateMcgHr} mcg/hr`
                    : `ACTIVE · ${patch.infusionRateMcgHr} mcg/hr`
                  : 'STANDBY · DRAG TO INSPECT 3D'}
              </span>
            </div>
          </div>

          {/* 3-View Selector: Black side | Patch side | Inside */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5">
            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: 'top' as ControllerView, label: isHi ? 'ब्लैक साइड' : 'Black side' },
                  { id: 'bottom' as ControllerView, label: isHi ? 'पैच साइड' : 'Patch side' },
                  { id: 'xray' as ControllerView, label: isHi ? 'अंदरूनी भाग' : 'Inside' },
                ] as const
              ).map((v) => {
                const active = view === v.id
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setView(v.id)
                      onUpdatePatch((prev) => ({ ...prev, controllerView: v.id }))
                    }}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-[10px] text-[11px] font-semibold cursor-pointer transition-all ${
                      active
                        ? 'clay-btn-primary'
                        : 'clay-tile text-[#1B251A] dark:text-[#E5E8CE]'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>{v.label}</span>
                  </button>
                )
              })}
            </div>
            <span className="text-[10px] text-[#495847] dark:text-[#A8B7A4] font-medium">
              {isHi ? 'घुमाने के लिए ड्रैग करें' : 'Drag 3D patch to rotate'}
            </span>
          </div>
        </div>

        {/* Right: Controller Dose Release Telemetry */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-[14px] clay-tile p-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#495847] dark:text-[#A8B7A4] block">
                {isHi ? 'वर्तमान रिलीज़' : 'Controller Output'}
              </span>
              <span className="text-lg font-bold font-mono-num text-[#1B251A] dark:text-[#E5E8CE] block mt-0.5">
                {isConnected ? `${patch.infusionRateMcgHr} mcg/hr` : 'Standby'}
              </span>
            </div>

            <div className="rounded-[14px] clay-tile p-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#495847] dark:text-[#A8B7A4] block">
                {isHi ? 'हाइड्रोजेल रिजर्वायर' : 'Hydrogel Reservoir'}
              </span>
              <span className="text-lg font-bold font-mono-num text-[#1B251A] dark:text-[#E5E8CE] block mt-0.5">
                {patch.reservoirPercent}%
              </span>
            </div>

            <div className="rounded-[14px] clay-tile p-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#495847] dark:text-[#A8B7A4] flex items-center gap-1">
                <BatteryCharging className="w-3 h-3 text-[#4E6B4B]" />
                <span>{isHi ? 'बैटरी' : 'Battery'}</span>
              </span>
              <span className="text-base font-bold font-mono-num text-[#1B251A] dark:text-[#E5E8CE] block mt-0.5">
                {isConnected ? `${patch.controllerBatteryPct ?? 96}%` : '—'}
              </span>
            </div>

            <div className="rounded-[14px] clay-tile p-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#495847] dark:text-[#A8B7A4] block">
                {isHi ? 'कुल डिलीवरी' : 'Total Released'}
              </span>
              <span className="text-base font-bold font-mono-num text-[#1B251A] dark:text-[#E5E8CE] block mt-0.5">
                {patch.cumulativeReleasedMcg ?? 0} mcg
              </span>
            </div>
          </div>

          <div className="rounded-[14px] clay-card-tint p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-2 font-bold text-[#1B251A] dark:text-[#E5E8CE]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${isConnected ? 'text-[#344932] dark:text-[#A8C6A4]' : 'text-[#8C9B84]'}`}
                />
                <span>
                  {isConnected
                    ? isHi
                      ? 'ऑटोमेटेड AI डोज़ लिंक सक्रिय'
                      : 'Automated AI Dose Release Linked'
                    : isHi
                      ? 'लिंक प्रतीक्षारत'
                      : 'Awaiting Controller Connection'}
                </span>
              </span>
              <span className="font-mono-num text-[11px] text-[#495847] dark:text-[#A8B7A4]">
                {patch.lastDoseReleaseAt || '—'}
              </span>
            </div>
            <p className="text-[11px] leading-snug text-[#495847] dark:text-[#A8B7A4]">
              {isConnected
                ? `Doctor window ${effectiveFloor}–${effectiveHourlyCap} mcg/hr enforced. Running AI telemetry or Doctor titration dispatches dose updates straight to the 7×7 microneedle array.`
                : 'Connect the controller above to synchronize closed-loop Automated AI dose titration directly with the transdermal microneedle array.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
