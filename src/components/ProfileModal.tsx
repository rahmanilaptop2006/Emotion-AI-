import { useEffect, useState } from 'react'
import { CheckCircle2, ExternalLink, Github, Lock, LogOut, Moon, RotateCcw, ShieldCheck, Sun, User, X } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  exchangeGithubHandoff,
  fetchGithubRepos,
  requestGithubOAuthUrl,
  type GithubRepoSummary,
} from '../services/customAuth'
import type { AccountId, AuthenticatedSession, Language, PrivacySettings, ThemeMode, UserAccount } from '../types'

interface ProfileModalProps {
  account: UserAccount
  accounts: Record<AccountId, UserAccount>
  authSession: AuthenticatedSession | null
  language: Language
  theme: ThemeMode
  onClose: () => void
  onSelectAccount: (id: AccountId) => void
  onToggleTheme: () => void
  onToggleLanguage: () => void
  onUpdatePrivacy: (privacy: PrivacySettings) => void
  onResetDemoData: () => void
  onUpdateAuthSession?: (session: AuthenticatedSession) => void
  onSignOut: () => void
}

export function ProfileModal({
  account,
  accounts,
  authSession,
  language,
  theme,
  onClose,
  onSelectAccount,
  onToggleTheme,
  onToggleLanguage,
  onUpdatePrivacy,
  onResetDemoData,
  onUpdateAuthSession,
  onSignOut,
}: ProfileModalProps) {
  const isHi = language === 'hi'
  const accountList = Object.values(accounts)
  const [githubRepos, setGithubRepos] = useState<GithubRepoSummary[]>([])
  const [githubUsername, setGithubUsername] = useState<string | undefined>(authSession?.githubUsername)
  const [githubConnected, setGithubConnected] = useState<boolean>(Boolean(authSession?.githubConnected))
  const [githubLoading, setGithubLoading] = useState(false)
  const [githubNotice, setGithubNotice] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void fetchGithubRepos()
      .then((res) => {
        if (!active) return
        if (res.connected) {
          setGithubConnected(true)
          setGithubUsername(res.username)
          setGithubRepos(res.repos)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [authSession?.uid, authSession?.githubConnected])

  useEffect(() => {
    const handleMsg = async (event: MessageEvent) => {
      const origin = event.origin || ''
      const isTrusted =
        origin === window.location.origin ||
        origin.endsWith('.run.app') ||
        origin.includes('localhost')
      if (!isTrusted) return
      if (event.data?.type === 'GITHUB_OAUTH_SUCCESS' && typeof event.data.handoffId === 'string') {
        setGithubLoading(true)
        setGithubNotice(null)
        try {
          const updated = await exchangeGithubHandoff(event.data.handoffId)
          onUpdateAuthSession?.(updated)
          const reposRes = await fetchGithubRepos()
          setGithubConnected(reposRes.connected)
          setGithubUsername(reposRes.username || updated.githubUsername)
          setGithubRepos(reposRes.repos)
        } catch (err) {
          setGithubNotice(err instanceof Error ? err.message : 'Could not link GitHub.')
        } finally {
          setGithubLoading(false)
        }
      } else if (event.data?.type === 'GITHUB_OAUTH_ERROR') {
        setGithubLoading(false)
        setGithubNotice(
          typeof event.data.error === 'string' ? event.data.error : 'GitHub authorization failed.'
        )
      }
    }
    window.addEventListener('message', handleMsg)
    return () => window.removeEventListener('message', handleMsg)
  }, [onUpdateAuthSession])

  const handleConnectGithub = async () => {
    setGithubLoading(true)
    setGithubNotice(null)
    const res = await requestGithubOAuthUrl()
    if (!res.ok) {
      setGithubNotice(res.error)
      setGithubLoading(false)
      return
    }
    const popup = window.open(res.url, 'github_oauth_popup', 'width=600,height=720')
    if (!popup) {
      setGithubNotice(
        isHi ? 'पॉपअप ब्लॉक है। कृपया अनुमति दें।' : 'Popup was blocked. Please allow popups.'
      )
      setGithubLoading(false)
    }
  }

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
        className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-[28px] clay-modal text-[#1B251A] dark:text-[#E5E8CE]"
      >
        <div className="px-6 py-4 bg-[#E7ECD8]/85 dark:bg-[#232F22]/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-[11px] clay-orb-sage text-[#142013] flex items-center justify-center">
              <User className="w-4 h-4" />
            </span>
            <h3 className="font-display text-base font-bold">
              {isHi ? 'प्रोफ़ाइल और प्राथमिकताएं' : 'Profile & Telemetry Preferences'}
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
          {/* Authenticated Session Card */}
          {authSession && (
            <div className="clay-tile rounded-[18px] p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <ShieldCheck className="w-4 h-4 text-[#2C7A58] dark:text-[#98B495] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">
                      {authSession.displayName || account.name}
                    </div>
                    <div className="text-[11px] text-[#495847] dark:text-[#A8B7A4] truncate">
                      {authSession.email}
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2C7A58] dark:text-[#98D1A3] whitespace-nowrap shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isHi ? 'सक्रिय खाता' : 'Active'}</span>
                </span>
              </div>
            </div>
          )}

          {/* GitHub Full-Access Integration Card */}
          <div className="clay-tile rounded-[18px] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4 shrink-0" />
                <div>
                  <div className="text-xs font-bold">
                    {isHi ? 'GitHub एक्सेस व रिपॉज़िटरी' : 'GitHub Full Access'}
                  </div>
                  <div className="text-[11px] text-[#495847] dark:text-[#A8B7A4]">
                    {githubConnected && githubUsername
                      ? `@${githubUsername} · repo & profile access`
                      : isHi
                        ? 'पूर्ण रिपॉज़िटरी पहुँच के लिए GitHub जोड़ें'
                        : 'Connect your GitHub account for full repo access'}
                  </div>
                </div>
              </div>
              {!githubConnected && (
                <button
                  type="button"
                  onClick={handleConnectGithub}
                  disabled={githubLoading}
                  className="clay-btn-primary px-3 py-1.5 rounded-[10px] text-[11px] font-semibold cursor-pointer whitespace-nowrap disabled:opacity-60"
                >
                  {githubLoading
                    ? isHi
                      ? 'जुड़ रहा है...'
                      : 'Connecting...'
                    : isHi
                      ? 'GitHub जोड़ें'
                      : 'Connect GitHub'}
                </button>
              )}
            </div>

            {githubNotice && (
              <div className="text-[11px] text-[#BF2B24] dark:text-[#FF8E88]">{githubNotice}</div>
            )}

            {githubConnected && githubRepos.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {githubRepos.slice(0, 6).map((repo) => (
                  <a
                    key={repo.id}
                    href={repo.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-2 p-2.5 rounded-[12px] clay-well hover:opacity-90 transition-opacity"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                        {repo.isPrivate && <Lock className="w-3 h-3 shrink-0 opacity-70" />}
                        <span className="truncate">{repo.fullName}</span>
                      </div>
                      {repo.description && (
                        <div className="text-[10px] opacity-75 truncate">{repo.description}</div>
                      )}
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Switch Account */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-[#495847] dark:text-[#A8B7A4]">
              {isHi ? 'खाता चुनें' : 'Active Patient / Researcher Profile'}
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {accountList.map((acc) => {
                const active = acc.id === account.id
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => onSelectAccount(acc.id)}
                    className={`flex items-center justify-between p-3.5 rounded-[18px] text-left transition-all cursor-pointer ${
                      active ? 'clay-btn-primary' : 'clay-tile clay-card-interactive'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-full clay-orb-ivory text-[#1B251A] dark:text-[#E5E8CE] text-xs font-bold flex items-center justify-center">
                        {acc.avatarInitials}
                      </span>
                      <div>
                        <div className="text-sm font-bold">{acc.name}</div>
                        <div className={`text-xs ${active ? 'text-[#162015]/80' : 'text-[#495847] dark:text-[#A8B7A4]'}`}>
                          {acc.role}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono-num">{acc.wellnessScore}/100</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Appearance & Language */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onToggleTheme}
              className="clay-btn-secondary flex items-center justify-between p-3.5 rounded-[16px] text-xs font-semibold cursor-pointer"
            >
              <span>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onToggleLanguage}
              className="clay-btn-secondary flex items-center justify-between p-3.5 rounded-[16px] text-xs font-semibold cursor-pointer"
            >
              <span>Language</span>
              <span>{language === 'hi' ? 'हिन्दी' : 'English'}</span>
            </button>
          </div>

          {/* Privacy Consent */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-[#495847] dark:text-[#A8B7A4]">
              On-Device Phenotyping Signals
            </div>
            {(
              [
                { key: 'keystrokeDynamics', label: 'Keystroke cadence & latency timing' },
                { key: 'voiceProsody', label: 'Voice biomarker pitch analysis' },
                { key: 'circadianScreen', label: 'Circadian screen-off estimation' },
              ] as const
            ).map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between p-3.5 rounded-[16px] clay-well text-xs font-medium cursor-pointer"
              >
                <span>{item.label}</span>
                <input
                  type="checkbox"
                  checked={account.privacy[item.key]}
                  onChange={(e) =>
                    onUpdatePrivacy({
                      ...account.privacy,
                      [item.key]: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-[#789575]"
                />
              </label>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onResetDemoData}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#495847] dark:text-[#A8B7A4] hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Local Data</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onSignOut}
                className="clay-btn-danger inline-flex items-center gap-1.5 px-4 h-[42px] rounded-[14px] text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isHi ? 'साइन आउट' : 'Sign Out'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="clay-btn-primary px-5 h-[42px] rounded-[14px] text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                {isHi ? 'पूर्ण' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
