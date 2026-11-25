import { BrandLogo } from './BrandLogo'
import type { Language } from '../types'

interface HeaderProps {
  language: Language
}

export function Header({ language: _language }: HeaderProps) {
  return (
    <header className="relative z-20 pt-7 sm:pt-9 px-4 sm:px-6">
      <div className="max-w-[1380px] mx-auto flex flex-col items-center text-center">
        {/* Brand Logo & Name Capsule */}
        <a
          href="#top"
          aria-label="EMOTION AI"
          className="glass-morphism-bar rounded-full pl-2 pr-5 py-1.5 inline-flex items-center gap-2.5 max-w-full transition-transform hover:scale-[1.01]"
        >
          <BrandLogo size="md" />
          <span className="font-display text-base sm:text-lg font-extrabold tracking-tight text-[#1B251A] dark:text-[#E5E8CE] whitespace-nowrap">
            EMOTION AI
          </span>
        </a>
      </div>
    </header>
  )
}
