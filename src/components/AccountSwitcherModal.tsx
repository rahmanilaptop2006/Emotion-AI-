import { ShieldCheck, Users, X } from 'lucide-react'
import { motion } from 'framer-motion'
import type { AccountId, Language, UserAccount } from '../types'

interface AccountSwitcherModalProps {
  activeAccountId: AccountId
  accounts: Record<AccountId, UserAccount>
  language: Language
  onSelect: (id: AccountId) => void
  onClose: () => void
}

export function AccountSwitcherModal({
  activeAccountId,
  accounts,
  language,
  onSelect,
  onClose,
}: AccountSwitcherModalProps) {
  const isHi = language === 'hi'

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
        className="w-full max-w-md rounded-[28px] clay-modal overflow-hidden text-[#1B251A] dark:text-[#E5E8CE]"
      >
        <div className="px-6 py-4 bg-[#E7ECD8]/85 dark:bg-[#232F22]/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-[11px] clay-orb-sage text-[#142013] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </span>
            <h3 className="font-display text-base font-bold">
              {isHi ? 'प्रोफ़ाइल बदलें' : 'Switch Account Profile'}
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

        <div className="p-6 space-y-3">
          {Object.values(accounts).map((acc) => {
            const active = acc.id === activeAccountId
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => {
                  onSelect(acc.id)
                  onClose()
                }}
                className={`w-full flex items-center justify-between p-4 rounded-[20px] text-left transition-all cursor-pointer ${
                  active ? 'clay-btn-primary' : 'clay-tile clay-card-interactive'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full clay-orb-ivory text-[#1B251A] dark:text-[#E5E8CE] text-xs font-bold flex items-center justify-center shrink-0">
                    {acc.avatarInitials}
                  </span>
                  <div>
                    <div className="text-sm font-bold">{acc.name}</div>
                    <div className={`text-xs ${active ? 'text-[#162015]/80' : 'text-[#495847] dark:text-[#A8B7A4]'}`}>
                      {acc.role}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold font-mono-num">{acc.wellnessScore}/100</div>
                  <div className={`text-[11px] ${active ? 'text-[#162015]/80' : 'text-[#495847] dark:text-[#A8B7A4]'}`}>
                    {acc.factors.stress}
                  </div>
                </div>
              </button>
            )
          })}

          <div className="pt-2 flex items-center gap-2 text-xs text-[#495847] dark:text-[#A8B7A4]">
            <ShieldCheck className="w-4 h-4 text-[#789575] shrink-0" />
            <span>Each profile stores its own check-ins, journal entries, and patch telemetry locally.</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
