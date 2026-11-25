import { BarChart3, Compass, HeartPulse, Home, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Language, TabId } from '../types'

interface SectionDockProps {
  activeTab: TabId
  language: Language
  onSelectTab: (tab: TabId) => void
}

export function SectionDock({
  activeTab,
  language,
  onSelectTab,
}: SectionDockProps) {
  const isHi = language === 'hi'

  const sections: { id: TabId; label: string; icon: typeof Home }[] = [
    { id: 'home', label: isHi ? 'डैशबोर्ड' : 'Overview', icon: Home },
    { id: 'explore', label: isHi ? 'थैरेपी' : 'Explore', icon: Compass },
    { id: 'treatment', label: isHi ? 'उपचार' : 'Treatment', icon: HeartPulse },
    { id: 'report', label: isHi ? 'रिपोर्ट' : 'Report', icon: BarChart3 },
    { id: 'pharmasafe', label: isHi ? 'इमोशनमेड' : 'EmotionMed', icon: ShieldCheck },
  ]

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-3 pointer-events-none">
      <motion.nav
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        aria-label={isHi ? 'अनुभाग नेविगेशन डॉक' : 'Section navigation dock'}
        className="glass-capsule-dock pointer-events-auto flex items-center gap-1 sm:gap-1.5 p-1.5 rounded-full max-w-full overflow-x-auto"
      >
        {sections.map((item) => {
          const Icon = item.icon
          const active = activeTab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={active ? 'page' : undefined}
              title={item.label}
              className={`relative h-12 sm:h-10 px-3 sm:px-3.5 rounded-full inline-flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 font-semibold whitespace-nowrap shrink-0 transition-transform duration-150 cursor-pointer hover:-translate-y-0.5 ${
                active
                  ? 'text-[#F6F8EE]'
                  : 'text-[#1B251A] dark:text-[#C5D8C1] hover:bg-[#789575]/18 dark:hover:bg-white/10'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="glass-dock-active-capsule"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-full glass-capsule-active z-0"
                />
              )}
              <span className="relative z-10 inline-flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-[10px] sm:text-xs leading-none">{item.label}</span>
              </span>
            </button>
          )
        })}
      </motion.nav>
    </div>
  )
}
