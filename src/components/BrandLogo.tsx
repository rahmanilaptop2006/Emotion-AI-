import { useId } from 'react'

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_MAP: Record<NonNullable<BrandLogoProps['size']>, string> = {
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-11 h-11',
}

export function BrandLogo({ size = 'md', className = '' }: BrandLogoProps) {
  const uid = useId().replace(/:/g, '')
  const bgId = `ea-bg-${uid}`
  const petalId = `ea-petal-${uid}`
  const waveId = `ea-wave-${uid}`

  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`${SIZE_MAP[size]} shrink-0 drop-shadow-[0_4px_12px_rgba(36,60,34,0.3)] ${className}`}
    >
      <defs>
        <linearGradient id={bgId} x1="4" y1="3" x2="40" y2="41" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#89AA85" />
          <stop offset="52%" stopColor="#4F6E4C" />
          <stop offset="100%" stopColor="#213825" />
        </linearGradient>
        <linearGradient id={petalId} x1="22" y1="9" x2="22" y2="27" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FAFBF3" />
          <stop offset="100%" stopColor="#DCE6CC" />
        </linearGradient>
        <linearGradient id={waveId} x1="8" y1="28" x2="36" y2="33" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E5E8CE" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#C8D8BC" stopOpacity="0.92" />
        </linearGradient>
      </defs>

      <rect x="2" y="2" width="40" height="40" rx="13" fill={`url(#${bgId})`} />
      <rect
        x="2.75"
        y="2.75"
        width="38.5"
        height="38.5"
        rx="12.25"
        stroke="#E5E8CE"
        strokeOpacity="0.45"
        strokeWidth="1.5"
      />

      <path
        d="M21.5 25.5C16.2 25.2 12.1 21.8 11.4 16.4C16 16.7 19.6 19.4 21.5 25.5Z"
        fill="#E7ECD9"
        fillOpacity="0.72"
      />
      <path
        d="M22.5 25.5C27.8 25.2 31.9 21.8 32.6 16.4C28 16.7 24.4 19.4 22.5 25.5Z"
        fill="#E7ECD9"
        fillOpacity="0.72"
      />

      <path
        d="M22 9.5C25.3 13.7 26.1 19.8 22 25.8C17.9 19.8 18.7 13.7 22 9.5Z"
        fill={`url(#${petalId})`}
      />

      <path
        d="M8.5 29.8H13.2C14.3 29.8 15 26.2 16.2 26.2C17.5 26.2 18.3 33.4 19.7 33.4C21.2 33.4 22.1 24.2 23.6 24.2C25 24.2 25.9 31.5 27.3 31.5C28.4 31.5 29.1 28.4 30.2 28.4C31.1 28.4 31.7 29.8 32.6 29.8H35.5"
        stroke={`url(#${waveId})`}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
