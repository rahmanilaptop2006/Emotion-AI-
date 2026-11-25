import { useState } from 'react'
import { Check, Phone, ShieldAlert, X } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Language, UserAccount } from '../types'

interface SafetyGuardianModalProps {
  account: UserAccount
  language: Language
  onClose: () => void
}

export function SafetyGuardianModal({ account, language, onClose }: SafetyGuardianModalProps) {
  const isHi = language === 'hi'
  const [tab, setTab] = useState<'helplines' | 'grounding' | 'contacts'>('helplines')
  const [sosDispatched, setSosDispatched] = useState(false)

  const helplines = [
    { name: 'Tele-MANAS (India 24/7)', number: '14416 / 1800-891-4416', note: 'National free confidential mental health helpline' },
    { name: 'KIRAN Mental Health', number: '1800-599-0019', note: 'Ministry of Social Justice 24x7 support' },
    { name: 'Emergency Services', number: '112', note: 'Immediate local medical response' },
  ]

  const groundingSteps = [
    { count: 5, label: isHi ? '5 चीज़ें देखें' : '5 things you can see right around you' },
    { count: 4, label: isHi ? '4 स्पर्श महसूस करें' : '4 textures you can physically touch' },
    { count: 3, label: isHi ? '3 ध्वनियाँ सुनें' : '3 subtle ambient sounds you can hear' },
    { count: 2, label: isHi ? '2 गंध पहचानें' : '2 distinct scents in the air' },
    { count: 1, label: isHi ? '1 गहरी धीमी सांस' : '1 slow grounding breath in and out' },
  ]

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
        className="w-full max-w-xl rounded-[28px] clay-modal overflow-hidden text-[#1B251A] dark:text-[#E5E8CE]"
      >
        <div className="px-6 py-4 bg-[#E7ECD8]/85 dark:bg-[#232F22]/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-[11px] clay-btn-danger flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <h3 className="font-display text-base font-bold">
              {isHi ? 'सुरक्षा गार्जियन एवं संकट सहायता' : 'Safety Guardian & Crisis Support'}
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

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-2 p-1.5 rounded-[18px] clay-well">
            {(
              [
                { id: 'helplines', label: isHi ? 'हेल्पलाइन' : '24/7 Helplines' },
                { id: 'grounding', label: isHi ? '5-इंद्रिय ग्राउंडिंग' : '5-4-3-2-1 Grounding' },
                { id: 'contacts', label: isHi ? 'विश्वस्त संपर्क' : 'Trusted Contacts' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex-1 py-2 rounded-[13px] text-xs font-semibold cursor-pointer transition-all ${
                  tab === t.id
                    ? 'clay-btn-primary'
                    : 'text-[#2D3B2C] dark:text-[#C5D1BF]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'helplines' && (
            <div className="space-y-3">
              {helplines.map((h) => (
                <div
                  key={h.name}
                  className="rounded-[20px] clay-tile p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-sm font-bold">{h.name}</div>
                    <div className="text-xs text-[#495847] dark:text-[#A8B7A4] mt-0.5">{h.note}</div>
                  </div>
                  <a
                    href={`tel:${h.number.split('/')[0].trim()}`}
                    className="clay-btn-danger inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[13px] text-xs font-semibold whitespace-nowrap"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{h.number.split('/')[0].trim()}</span>
                  </a>
                </div>
              ))}
            </div>
          )}

          {tab === 'grounding' && (
            <div className="space-y-2.5">
              {groundingSteps.map((s) => (
                <div
                  key={s.count}
                  className="rounded-[18px] clay-tile p-3.5 flex items-center gap-3"
                >
                  <span className="w-8 h-8 rounded-full clay-orb-sage text-[#162015] text-xs font-bold flex items-center justify-center shrink-0">
                    {s.count}
                  </span>
                  <span className="text-sm font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'contacts' && (
            <div className="space-y-3">
              {account.trustedContacts.map((c) => (
                <div
                  key={c.phone}
                  className="rounded-[20px] clay-tile p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-sm font-bold">{c.name}</div>
                    <div className="text-xs text-[#495847] dark:text-[#A8B7A4]">
                      {c.relation} · {c.phone}
                    </div>
                  </div>
                  <a
                    href={`tel:${c.phone.replace(/\s+/g, '')}`}
                    className="clay-btn-primary px-4 py-2 rounded-[13px] text-xs font-semibold"
                  >
                    Call
                  </a>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setSosDispatched(true)}
                className="w-full h-[46px] rounded-[16px] clay-btn-danger text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                {sosDispatched ? <Check className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                <span>
                  {sosDispatched
                    ? isHi
                      ? 'विश्वस्त संपर्क को सतर्कता संदेश तैयार है'
                      : 'Check-In Alert Logged for Trusted Contacts'
                    : isHi
                      ? 'विश्वस्त संपर्क को सहायता अलर्ट भेजें'
                      : 'Send Gentle Check-In Alert to Contacts'}
                </span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
