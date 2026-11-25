import { useEffect, useState, type FormEvent } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Check,
  Copy,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Mail,
  Moon,
  Sun,
  User,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { BrandLogo } from './BrandLogo'
import {
  loginWithCustomAuth,
  mapCustomAuthError,
  registerWithCustomAuth,
} from '../services/customAuth'
import {
  firebaseAuthorizedDomainsConsoleUrl,
  mapAuthError,
  signInWithGooglePopup,
} from '../services/firebase'
import type { AuthenticatedSession, Language, ThemeMode } from '../types'

export interface RegistrationProfileMeta {
  fullName: string
  role: string
  institution: string
}

interface AuthScreenProps {
  language: Language
  theme: ThemeMode
  initialError?: unknown
  onClearInitialError?: () => void
  onToggleLanguage: () => void
  onToggleTheme: () => void
  onAuthSuccess: (session: AuthenticatedSession, meta?: RegistrationProfileMeta) => void
}

type AuthMode = 'login' | 'register'

export function AuthScreen({
  language,
  theme,
  initialError,
  onClearInitialError,
  onToggleLanguage,
  onToggleTheme,
  onAuthSuccess,
}: AuthScreenProps) {
  const isHi = language === 'hi'
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('B Pharm Student and Innovator')
  const [institution, setInstitution] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showForgotHelp, setShowForgotHelp] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [needsAuthorizedDomainHelp, setNeedsAuthorizedDomainHelp] = useState(false)
  const [copiedDomain, setCopiedDomain] = useState(false)

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : ''

  useEffect(() => {
    if (!initialError) return
    const mapped = mapAuthError(initialError, isHi)
    setErrorMsg(mapped.message)
    setNeedsAuthorizedDomainHelp(Boolean(mapped.needsAuthorizedDomainHelp))
  }, [initialError, isHi])

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setErrorMsg(null)
    setShowForgotHelp(false)
    setNeedsAuthorizedDomainHelp(false)
    onClearInitialError?.()
  }

  const handleCopyHostname = async () => {
    if (!currentHostname || typeof navigator === 'undefined' || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(currentHostname)
      setCopiedDomain(true)
      window.setTimeout(() => setCopiedDomain(false), 2000)
    } catch {
      // Ignore clipboard permission errors
    }
  }

  const handleGoogleSignIn = async () => {
    setErrorMsg(null)
    setShowForgotHelp(false)
    setNeedsAuthorizedDomainHelp(false)
    onClearInitialError?.()
    setGoogleLoading(true)
    try {
      const user = await signInWithGooglePopup()
      if (user) {
        onAuthSuccess({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'Google User',
          emailVerified: user.emailVerified,
          providerId: 'google.com',
        })
      }
    } catch (err) {
      const mapped = mapAuthError(err, isHi)
      setErrorMsg(mapped.message)
      setNeedsAuthorizedDomainHelp(Boolean(mapped.needsAuthorizedDomainHelp))
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setShowForgotHelp(false)
    setNeedsAuthorizedDomainHelp(false)

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg(isHi ? 'कृपया एक मान्य ईमेल पता दर्ज करें।' : 'Please enter a valid email address.')
      return
    }

    if (password.length < 6) {
      setErrorMsg(
        isHi ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'Password must be at least 6 characters.'
      )
      return
    }

    if (mode === 'register') {
      if (!fullName.trim()) {
        setErrorMsg(isHi ? 'कृपया अपना पूरा नाम दर्ज करें।' : 'Please enter your full name.')
        return
      }
      if (password !== confirmPassword) {
        setErrorMsg(isHi ? 'दोनों पासवर्ड मेल नहीं खा रहे हैं।' : 'Passwords do not match.')
        return
      }
    }

    setSubmitting(true)
    try {
      if (mode === 'login') {
        const session = await loginWithCustomAuth(trimmedEmail, password)
        onAuthSuccess(session)
      } else {
        const meta: RegistrationProfileMeta = {
          fullName: fullName.trim(),
          role: role.trim() || 'B Pharm Student and Innovator',
          institution: institution.trim() || 'EMOTION AI Workspace',
        }
        const session = await registerWithCustomAuth({
          email: trimmedEmail,
          password,
          fullName: meta.fullName,
          role: meta.role,
          institution: meta.institution,
        })
        onAuthSuccess(session, meta)
      }
    } catch (err) {
      setErrorMsg(mapCustomAuthError(err, isHi))
    } finally {
      setSubmitting(false)
    }
  }

  const anyLoading = submitting || googleLoading

  return (
    <div className="min-h-screen w-full sample-pastel-sky text-[#1B251A] dark:text-[#E5E8CE] transition-colors flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Bar */}
      <header className="max-w-[1100px] w-full mx-auto flex items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-3">
          <BrandLogo size="lg" />
          <span className="font-display text-lg font-bold tracking-tight whitespace-nowrap">
            EMOTION AI
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
            className="clay-btn-secondary inline-flex items-center gap-2 px-3.5 py-2 rounded-[14px] text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            <span>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
            {theme === 'dark' ? (
              <Moon className="w-3.5 h-3.5" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-[#344932]" />
            )}
          </button>

          <button
            type="button"
            onClick={onToggleLanguage}
            aria-label="Toggle language"
            className="clay-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[14px] text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{isHi ? 'EN' : 'हिं'}</span>
          </button>
        </div>
      </header>

      {/* Main Custom EMOTION AI Login & Social Connect Card */}
      <main className="max-w-[980px] w-full mx-auto my-auto py-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          className="clay-shell rounded-[34px] p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
        >
          {/* Left Panel: Clean Halo + EMOTION AI + Google Sign-In */}
          <section className="lg:col-span-5 sample-pastel-sky rounded-[28px] p-7 sm:p-8 flex flex-col items-center justify-between text-center gap-6 border border-white/75 dark:border-white/10">
            <div className="pt-2">
              <div className="w-20 h-20 mx-auto rounded-full bg-white/65 dark:bg-white/10 shadow-[0_0_40px_rgba(94,125,91,0.38)] flex items-center justify-center">
                <BrandLogo size="lg" />
              </div>
              <h1 className="mt-6 font-display text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
                EMOTION AI
              </h1>
              <p className="mt-1.5 text-xs font-medium text-[#495847] dark:text-[#A8C6A4]">
                {isHi
                  ? 'व्यक्तिगत मानसिक स्वास्थ्य व समग्र देखभाल'
                  : 'Personal Mental Wellness & Care Companion'}
              </p>
            </div>

            <div className="w-full space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={anyLoading}
                className="w-full h-11 px-4 rounded-full bg-white dark:bg-[#192819] text-[#1B251A] dark:text-[#E5E8CE] shadow-md flex items-center justify-center gap-2.5 text-xs font-semibold cursor-pointer disabled:opacity-60 hover:opacity-95 transition-opacity"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
                <span>
                  {googleLoading
                    ? isHi
                      ? 'Google से जुड़ रहा है...'
                      : 'Connecting Google...'
                    : isHi
                      ? 'Google से लॉग इन करें'
                      : 'Continue with Google'}
                </span>
              </button>
            </div>
          </section>

          {/* Right Panel: Custom Sign In / Create Account */}
          <section className="lg:col-span-7 clay-card rounded-[28px] p-6 sm:p-8 flex flex-col justify-center">
            <div className="max-w-md w-full mx-auto space-y-5">
              <div className="space-y-1">
                <h2 className="font-display text-xl font-bold tracking-tight">
                  {mode === 'login'
                    ? isHi
                      ? 'अपने खाते में लॉग इन करें'
                      : 'Sign in to your account'
                    : isHi
                      ? 'अपना EMOTION AI खाता बनाएं'
                      : 'Create your EMOTION AI account'}
                </h2>
                <p className="text-xs text-[#495847] dark:text-[#A8C6A4]">
                  {mode === 'login'
                    ? isHi
                      ? 'आगे बढ़ने के लिए अपना ईमेल और पासवर्ड दर्ज करें।'
                      : 'Enter your EMOTION AI credentials, or continue with Google.'
                    : isHi
                      ? 'कुछ ही सेकंड में अपनी व्यक्तिगत प्रोफ़ाइल शुरू करें।'
                      : 'Set up your personal wellness profile in seconds.'}
                </p>
              </div>

              <div className="clay-well p-1.5 rounded-[18px] grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={`h-10 rounded-[13px] text-xs font-semibold transition-all cursor-pointer ${
                    mode === 'login' ? 'clay-btn-primary' : 'opacity-75 hover:opacity-100'
                  }`}
                >
                  {isHi ? 'लॉग इन' : 'Log in'}
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`h-10 rounded-[13px] text-xs font-semibold transition-all cursor-pointer ${
                    mode === 'register' ? 'clay-btn-primary' : 'opacity-75 hover:opacity-100'
                  }`}
                >
                  {isHi ? 'नया खाता' : 'Create Account'}
                </button>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="clay-tile rounded-[16px] p-3.5 text-xs text-[#BF2B24] dark:text-[#FF8E88] space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>

                  {needsAuthorizedDomainHelp && (
                    <div className="pl-6 space-y-2">
                      {currentHostname && (
                        <div className="flex flex-wrap items-center gap-2">
                          <code className="px-2 py-1 rounded-[8px] bg-black/5 dark:bg-white/10 text-[11px] font-mono text-[#1B251A] dark:text-[#E5E8CE] break-all">
                            {currentHostname}
                          </code>
                          <button
                            type="button"
                            onClick={handleCopyHostname}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-white/80 dark:bg-white/10 text-[11px] font-semibold text-[#1B251A] dark:text-[#E5E8CE] cursor-pointer hover:opacity-90"
                          >
                            {copiedDomain ? (
                              <>
                                <Check className="w-3 h-3 text-[#246A49] dark:text-[#8EE0B6]" />
                                <span>{isHi ? 'कॉपी हुआ' : 'Copied'}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>{isHi ? 'डोमेन कॉपी करें' : 'Copy domain'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                      <a
                        href={firebaseAuthorizedDomainsConsoleUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block font-semibold underline"
                      >
                        {isHi
                          ? 'Authorized Domains सेटिंग खोलें'
                          : 'Open Authorized Domains Settings'}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {showForgotHelp && (
                <div
                  role="status"
                  className="clay-tile rounded-[16px] p-3.5 text-xs text-[#344932] dark:text-[#C8D8BC] space-y-1.5"
                >
                  <div className="font-bold">
                    {isHi ? 'पासवर्ड सहायता' : 'Password Recovery Help'}
                  </div>
                  <p className="opacity-85 leading-relaxed">
                    {isHi
                      ? 'यदि आप पासवर्ड भूल गए हैं, तो आप Google से लॉग इन कर सकते हैं या "नया खाता" टैब से नया खाता बना सकते हैं।'
                      : 'If you forgot your password, you can sign in with Google or create a new profile under Create Account.'}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
                {mode === 'register' && (
                  <>
                    <div className="space-y-1.5">
                      <label htmlFor="auth-fullname" className="block text-xs font-semibold">
                        {isHi ? 'पूरा नाम' : 'Full Name'}
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 opacity-60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="auth-fullname"
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder={isHi ? 'आपका नाम' : 'Your full name'}
                          className="w-full h-11 pl-10 pr-3.5 rounded-[14px] clay-input text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label htmlFor="auth-role" className="block text-xs font-semibold">
                          {isHi ? 'भूमिका' : 'Role'}
                        </label>
                        <select
                          id="auth-role"
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full h-11 px-3 rounded-[14px] clay-input text-xs font-medium"
                        >
                          <option value="B Pharm Student and Innovator">
                            {isHi ? 'बी फार्मा छात्र व इनोवेटर' : 'B Pharm Student and Innovator'}
                          </option>
                          <option value="Clinical Patient">
                            {isHi ? 'रोगी' : 'Clinical Patient'}
                          </option>
                          <option value="Physician / Doctor">
                            {isHi ? 'चिकित्सक' : 'Physician / Doctor'}
                          </option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="auth-institution" className="block text-xs font-semibold">
                          {isHi ? 'संस्थान (वैकल्पिक)' : 'Clinic / Dept.'}
                        </label>
                        <input
                          id="auth-institution"
                          type="text"
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          placeholder={isHi ? 'वैकल्पिक' : 'Optional'}
                          className="w-full h-11 px-3.5 rounded-[14px] clay-input text-xs"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="auth-email" className="block text-xs font-semibold">
                    {isHi ? 'ईमेल पता' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 opacity-60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full h-11 pl-10 pr-3.5 rounded-[14px] clay-input text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="auth-password" className="block text-xs font-semibold">
                      {isHi ? 'पासवर्ड' : 'Password'}
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setShowForgotHelp((prev) => !prev)}
                        className="text-[11px] font-semibold text-[#344932] dark:text-[#A8C6A4] hover:underline cursor-pointer"
                      >
                        {isHi ? 'पासवर्ड भूल गए?' : 'Forgot password?'}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 opacity-60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isHi ? 'कम से कम 6 अक्षर' : 'Minimum 6 characters'}
                      className="w-full h-11 pl-10 pr-10 rounded-[14px] clay-input text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 opacity-70 hover:opacity-100 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {mode === 'register' && (
                  <div className="space-y-1.5">
                    <label htmlFor="auth-confirm-password" className="block text-xs font-semibold">
                      {isHi ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'}
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 opacity-60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="auth-confirm-password"
                        type={showConfirm ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={isHi ? 'दोबारा दर्ज करें' : 'Re-enter password'}
                        className="w-full h-11 pl-10 pr-10 rounded-[14px] clay-input text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((prev) => !prev)}
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 opacity-70 hover:opacity-100 cursor-pointer"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={anyLoading}
                  className="w-full h-11 px-5 rounded-[15px] clay-btn-primary flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer disabled:opacity-60 mt-2"
                >
                  <span>
                    {submitting
                      ? isHi
                        ? 'प्रतीक्षा करें...'
                        : 'Authenticating...'
                      : mode === 'login'
                        ? isHi
                          ? 'लॉग इन करें'
                          : 'Log in to EMOTION AI'
                        : isHi
                          ? 'खाता बनाएं'
                          : 'Create Account'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="pt-1 text-center text-xs text-[#495847] dark:text-[#A8C6A4]">
                {mode === 'login' ? (
                  <>
                    <span>{isHi ? 'नए उपयोगकर्ता हैं?' : 'New to EMOTION AI?'} </span>
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="font-semibold text-[#1B251A] dark:text-[#E5E8CE] hover:underline cursor-pointer"
                    >
                      {isHi ? 'नया खाता बनाएं' : 'Create an account'}
                    </button>
                  </>
                ) : (
                  <>
                    <span>{isHi ? 'पहले से खाता है?' : 'Already have an account?'} </span>
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="font-semibold text-[#1B251A] dark:text-[#E5E8CE] hover:underline cursor-pointer"
                    >
                      {isHi ? 'लॉग इन करें' : 'Log in'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>
        </motion.div>
      </main>

      <footer className="max-w-[1100px] w-full mx-auto pt-4 flex flex-wrap items-center justify-between gap-3 text-xs opacity-75">
        <span>EMOTION AI · Mental Wellness Companion</span>
        <span>24/7 Helpline · Tele-MANAS 14416</span>
      </footer>
    </div>
  )
}
