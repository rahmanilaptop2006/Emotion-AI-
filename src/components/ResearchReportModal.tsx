import { useState } from 'react'
import { Download, FileText, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { exportResearchReportToWord } from '../services/wordExport'
import type { Language, UserAccount } from '../types'

interface ResearchReportModalProps {
  account: UserAccount
  language: Language
  onClose: () => void
}

export function ResearchReportModal({ account, language, onClose }: ResearchReportModalProps) {
  const isHi = language === 'hi'
  const [section, setSection] = useState<'pivot' | 'formulation' | 'roadmap'>('pivot')

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
        className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-[28px] clay-modal text-[#1B251A] dark:text-[#E5E8CE]"
      >
        <div className="px-6 py-4 bg-[#E7ECD8]/90 dark:bg-[#232F22]/95 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-[11px] clay-orb-sage text-[#142013] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </span>
            <h3 className="font-display text-base font-bold">
              {isHi ? 'EMOTION AI फार्माकोग्नॉसी एवं एआई डोजियर' : 'EMOTION AI Research & Pharmacognosy Dossier'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportResearchReportToWord(account)}
              className="clay-btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] text-xs font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Word (.doc)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="clay-btn-secondary p-2 rounded-[11px] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-2 p-1.5 rounded-[18px] clay-well">
            {(
              [
                { id: 'pivot', label: 'Architecture Pivot' },
                { id: 'formulation', label: 'Herbal Formulation' },
                { id: 'roadmap', label: 'B.Pharm Validation Roadmap' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSection(t.id)}
                className={`flex-1 py-2 rounded-[13px] text-xs font-semibold cursor-pointer transition-all ${
                  section === t.id
                    ? 'clay-btn-primary'
                    : 'text-[#2D3B2C] dark:text-[#C5D1BF]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {section === 'pivot' && (
            <div className="overflow-x-auto rounded-[20px] clay-well p-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#789575]/25">
                    <th className="p-3 font-bold">Dimension</th>
                    <th className="p-3 font-bold">Conventional Hardware Patch</th>
                    <th className="p-3 font-bold">EMOTION AI Zero-Hardware Pivot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#789575]/20">
                  <tr>
                    <td className="p-3 font-semibold">Sensing Input</td>
                    <td className="p-3">Dedicated wearable electrodes</td>
                    <td className="p-3">Smartphone keystroke cadence, voice &amp; circadian usage</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">Pharmacotherapy</td>
                    <td className="p-3">Synthetic sedatives / tolerance risk</td>
                    <td className="p-3">Standardized non-sedating Ashwagandha + Brahmi tonic</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">Patient Adherence</td>
                    <td className="p-3">High cost, hardware friction</td>
                    <td className="p-3">Zero-cost software + accessible herbal delivery</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {section === 'formulation' && (
            <div className="space-y-3 text-sm">
              <div className="rounded-[20px] clay-tile p-4">
                <div className="font-bold">Synergistic Adaptogen Matrix (Per 10 ml Dose)</div>
                <p className="text-xs text-[#495847] dark:text-[#A8B7A4] mt-1 leading-relaxed">
                  Withania somnifera (300 mg, 5% withanolides), Bacopa monnieri (250 mg, 20% bacosides),
                  Convolvulus pluricaulis (200 mg), Nardostachys jatamansi (150 mg), Ocimum sanctum (150 mg).
                </p>
              </div>
              <div className="rounded-[20px] clay-tile p-4">
                <div className="font-bold">Hormone-Neutral &amp; Non-Sedating Verification</div>
                <p className="text-xs text-[#495847] dark:text-[#A8B7A4] mt-1 leading-relaxed">
                  Balances HPA-axis reactivity without central nervous system depression or endocrine interference.
                </p>
              </div>
            </div>
          )}

          {section === 'roadmap' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                { phase: 'Phase 1', title: 'HPTLC Marker Standardization', detail: 'Verify Bacoside A & Withanolide A linearity across batches.' },
                { phase: 'Phase 2', title: 'Franz Cell Permeation', detail: 'Validate zero-order transdermal flux across ex-vivo membrane.' },
                { phase: 'Phase 3', title: 'Campus Pilot Telemetry', detail: 'Correlate keystroke variance against PSS-10 scores.' },
                { phase: 'Phase 4', title: 'Tele-MANAS Escalation', detail: 'Seamless clinical referral pathway for high-strain alerts.' },
              ].map((step) => (
                <div
                  key={step.phase}
                  className="rounded-[20px] clay-tile p-4"
                >
                  <div className="text-xs font-semibold text-[#496346] dark:text-[#98B495]">{step.phase}</div>
                  <div className="text-sm font-bold mt-0.5">{step.title}</div>
                  <p className="text-xs text-[#495847] dark:text-[#A8B7A4] mt-1">{step.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
