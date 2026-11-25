import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { Language, TabId } from '../types'

interface NavbarProps {
  language: Language
  activeTab: TabId
  onNavigateTab: (tab: TabId) => void
  onOpenPatch: () => void
  onOpenChat: () => void
}

export function Navbar({ language, activeTab, onNavigateTab, onOpenPatch, onOpenChat }: NavbarProps) {
  const [hiddenOnWorkspace, setHiddenOnWorkspace] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setHiddenOnWorkspace(window.scrollY > window.innerHeight * 0.55)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navItems: { id: TabId | 'patch' | 'chat'; label: string }[] = [
    { id: 'home', label: language === 'hi' ? 'डैशबोर्ड' : 'Dashboard' },
    { id: 'explore', label: language === 'hi' ? 'अन्वेषण' : 'Explore' },
    { id: 'treatment', label: language === 'hi' ? 'उपचार' : 'Treatment' },
    { id: 'report', label: language === 'hi' ? 'रिपोर्ट' : 'Report' },
    { id: 'patch', label: language === 'hi' ? 'एजेंटिक पैच' : 'Agentic Patch' },
    { id: 'chat', label: language === 'hi' ? 'इमोशन एआई' : 'EMOTION AI' },
  ]

  return (
    <div className="fixed top-[18px] left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{
          opacity: hiddenOnWorkspace ? 0 : 1,
          y: hiddenOnWorkspace ? -20 : 0,
        }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        aria-label="Primary navigation"
        className={`glass-capsule-dock flex items-center gap-5 px-5 py-2 rounded-full max-w-full overflow-x-auto ${
          hiddenOnWorkspace ? 'pointer-events-none' : 'pointer-events-auto'
        }`}
      >
        <a
          href="#top"
          className="font-display text-[17px] font-bold text-[#1B251A] dark:text-[#E5E8CE] tracking-tight whitespace-nowrap shrink-0"
        >
          EMOTION AI
        </a>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {navItems.map((item) => {
            const isActive = item.id === activeTab
            return (
              <a
                key={item.id}
                href={item.id === 'chat' ? '#chat' : item.id === 'patch' ? '#patch' : '#workspace'}
                onClick={(e) => {
                  e.preventDefault()
                  if (item.id === 'chat') {
                    onOpenChat()
                  } else if (item.id === 'patch') {
                    onOpenPatch()
                  } else {
                    onNavigateTab(item.id)
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-[13px] whitespace-nowrap shrink-0 transition-all ${
                  isActive
                    ? 'glass-capsule-active font-semibold'
                    : 'font-medium text-[#1B251A]/80 dark:text-[#C9D7C5] hover:bg-[#789575]/15 dark:hover:bg-white/10 hover:text-[#1B251A] dark:hover:text-[#F0F4E3]'
                }`}
              >
                {item.label}
              </a>
            )
          })}
        </div>
      </motion.nav>
    </div>
  )
}
