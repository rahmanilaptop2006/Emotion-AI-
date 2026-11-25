import type { AuthenticatedSession } from '../types'

export interface CustomAuthError {
  message: string
}

interface AuthResponsePayload {
  token: string
  user: {
    uid: string
    email: string
    displayName: string
    role?: string
    institution?: string
    githubUsername?: string
    githubConnected?: boolean
  }
  error?: string
}

export interface GithubRepoSummary {
  id: number
  name: string
  fullName: string
  isPrivate: boolean
  htmlUrl: string
  description: string
  updatedAt: string
  defaultBranch: string
}

export interface GithubReposResponse {
  connected: boolean
  username?: string
  avatarUrl?: string
  repos: GithubRepoSummary[]
}

interface LocalAuthRecord {
  uid: string
  email: string
  displayName: string
  role: string
  institution: string
  saltHex: string
  hashHex: string
  createdAt: number
}

const LOCAL_AUTH_REGISTRY_KEY = 'emotion_ai_local_accounts_v1'

// Keep active session and Bearer token strictly in JS memory (never localStorage/sessionStorage)
let inMemoryToken: string | null = null
let inMemorySession: AuthenticatedSession | null = null

export function getActiveAuthToken(): string | null {
  return inMemoryToken
}

export function getActiveSession(): AuthenticatedSession | null {
  return inMemorySession
}

export function setCustomAuthSession(session: AuthenticatedSession, token?: string | null): void {
  inMemorySession = session
  if (typeof token === 'string') {
    inMemoryToken = token
  }
}

export function clearCustomAuthSession(): void {
  inMemoryToken = null
  inMemorySession = null
}

function toSession(user: AuthResponsePayload['user']): AuthenticatedSession {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    emailVerified: true,
    providerId: user.githubConnected ? 'github.com' : 'emotion-ai',
    role: user.role,
    institution: user.institution,
    githubUsername: user.githubUsername,
    githubConnected: user.githubConnected,
  }
}

function readLocalRegistry(): Record<string, LocalAuthRecord> {
  try {
    const raw = window.localStorage.getItem(LOCAL_AUTH_REGISTRY_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Record<string, LocalAuthRecord>
  } catch {
    return {}
  }
}

function writeLocalRegistry(registry: Record<string, LocalAuthRecord>): void {
  try {
    window.localStorage.setItem(LOCAL_AUTH_REGISTRY_KEY, JSON.stringify(registry))
  } catch {
    // Ignore storage quota restrictions
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.length % 2 === 0 ? hex : `0${hex}`
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

async function derivePbkdf2Hex(password: string, salt: Uint8Array): Promise<string> {
  const enc = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )
  const saltCopy = new Uint8Array(salt.byteLength)
  saltCopy.set(salt)
  const bits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltCopy,
      iterations: 120000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  )
  return bytesToHex(new Uint8Array(bits))
}

function constantTimeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

async function tryServerAuth(
  endpoint: '/api/auth/login' | '/api/auth/register',
  body: Record<string, string>
): Promise<{ handled: true; data: AuthResponsePayload } | { handled: false }> {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const contentType = res.headers.get('content-type') || ''
    if (res.status === 404 || !contentType.includes('application/json')) {
      // Static-only deployment (e.g., Vercel static / GitHub Pages) without Express auth route
      return { handled: false }
    }

    const data = (await res.json()) as AuthResponsePayload
    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed.')
    }
    return { handled: true, data }
  } catch (err) {
    if (err instanceof TypeError) {
      return { handled: false }
    }
    throw err
  }
}

export async function loginWithCustomAuth(
  emailInput: string,
  password: string
): Promise<AuthenticatedSession> {
  const email = emailInput.trim().toLowerCase()
  const serverResult = await tryServerAuth('/api/auth/login', { email, password })

  if (serverResult.handled) {
    inMemoryToken = serverResult.data.token
    inMemorySession = toSession(serverResult.data.user)
    return inMemorySession
  }

  // Static-host fallback using Web Crypto PBKDF2-SHA256
  const registry = readLocalRegistry()
  const record = registry[email]
  if (!record) {
    throw new Error('No EMOTION AI account found for this email. Switch to Create Account to register.')
  }

  const derived = await derivePbkdf2Hex(password, hexToBytes(record.saltHex))
  if (!constantTimeEqualHex(derived, record.hashHex)) {
    throw new Error('Incorrect email or password. Please verify your credentials.')
  }

  const tokenBytes = window.crypto.getRandomValues(new Uint8Array(24))
  inMemoryToken = `local.${bytesToHex(tokenBytes)}`
  inMemorySession = toSession({
    uid: record.uid,
    email: record.email,
    displayName: record.displayName,
    role: record.role,
    institution: record.institution,
  })
  return inMemorySession
}

export async function registerWithCustomAuth(params: {
  email: string
  password: string
  fullName: string
  role: string
  institution: string
}): Promise<AuthenticatedSession> {
  const email = params.email.trim().toLowerCase()
  const fullName = params.fullName.trim()
  const role = params.role.trim() || 'B Pharm Student and Innovator'
  const institution = params.institution.trim() || 'EMOTION AI Workspace'

  const serverResult = await tryServerAuth('/api/auth/register', {
    email,
    password: params.password,
    fullName,
    role,
    institution,
  })

  if (serverResult.handled) {
    inMemoryToken = serverResult.data.token
    inMemorySession = toSession(serverResult.data.user)
    return inMemorySession
  }

  // Static-host fallback using Web Crypto PBKDF2-SHA256
  const registry = readLocalRegistry()
  if (registry[email]) {
    throw new Error('An account with this email already exists. Switch to Log in to continue.')
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(16))
  const hashHex = await derivePbkdf2Hex(params.password, salt)
  const uidBytes = window.crypto.getRandomValues(new Uint8Array(8))
  const uid = `ea_${bytesToHex(uidBytes)}`

  const newRecord: LocalAuthRecord = {
    uid,
    email,
    displayName: fullName,
    role,
    institution,
    saltHex: bytesToHex(salt),
    hashHex,
    createdAt: Date.now(),
  }

  registry[email] = newRecord
  writeLocalRegistry(registry)

  const tokenBytes = window.crypto.getRandomValues(new Uint8Array(24))
  inMemoryToken = `local.${bytesToHex(tokenBytes)}`
  inMemorySession = toSession({
    uid: newRecord.uid,
    email: newRecord.email,
    displayName: newRecord.displayName,
    role: newRecord.role,
    institution: newRecord.institution,
  })
  return inMemorySession
}

export async function requestGithubOAuthUrl(): Promise<{
  ok: true
  url: string
  redirectUri: string
} | {
  ok: false
  error: string
  needsSetup?: boolean
  redirectUri?: string
}> {
  try {
    const headers: Record<string, string> = {}
    if (inMemoryToken && !inMemoryToken.startsWith('local.')) {
      headers.Authorization = `Bearer ${inMemoryToken}`
    }
    const res = await fetch('/api/auth/github/url', { headers })
    const contentType = res.headers.get('content-type') || ''
    if (res.status === 404 || !contentType.includes('application/json')) {
      return {
        ok: false,
        error: 'GitHub OAuth requires the full-stack server with GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.',
      }
    }
    const data = (await res.json()) as {
      url?: string
      redirectUri?: string
      error?: string
      needsSetup?: boolean
    }
    if (!res.ok || !data.url) {
      return {
        ok: false,
        error: data.error || 'Unable to start GitHub OAuth.',
        needsSetup: Boolean(data.needsSetup),
        redirectUri: data.redirectUri,
      }
    }
    return {
      ok: true,
      url: data.url,
      redirectUri: data.redirectUri || `${window.location.origin}/auth/github/callback`,
    }
  } catch {
    return {
      ok: false,
      error: 'Unable to reach GitHub authentication service.',
    }
  }
}

export async function exchangeGithubHandoff(handoffId: string): Promise<AuthenticatedSession> {
  const res = await fetch('/api/auth/github/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ handoffId }),
  })
  const data = (await res.json()) as AuthResponsePayload
  if (!res.ok || !data.token || !data.user) {
    throw new Error(data.error || 'GitHub sign-in exchange failed.')
  }
  inMemoryToken = data.token
  inMemorySession = toSession(data.user)
  return inMemorySession
}

export async function fetchGithubRepos(): Promise<GithubReposResponse> {
  if (!inMemoryToken || inMemoryToken.startsWith('local.')) {
    return { connected: false, repos: [] }
  }
  const res = await fetch('/api/github/repos', {
    headers: {
      Authorization: `Bearer ${inMemoryToken}`,
    },
  })
  if (!res.ok) {
    return { connected: false, repos: [] }
  }
  return (await res.json()) as GithubReposResponse
}

export async function logoutCustomAuth(): Promise<void> {
  const token = inMemoryToken
  clearCustomAuthSession()
  if (token && !token.startsWith('local.')) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch {
      // Ignore network errors on logout
    }
  }
}

export function mapCustomAuthError(error: unknown, isHi: boolean): string {
  const msg = error instanceof Error ? error.message : ''
  if (msg.includes('already exists')) {
    return isHi
      ? 'यह ईमेल पहले से पंजीकृत है। कृपया लॉग इन करें।'
      : 'An account with this email already exists. Switch to Log in to continue.'
  }
  if (msg.includes('No EMOTION AI account found')) {
    return isHi
      ? 'इस ईमेल से कोई EMOTION AI खाता नहीं मिला। कृपया पहले नया खाता बनाएं।'
      : 'No EMOTION AI account found for this email. Switch to Create Account to register.'
  }
  if (msg.includes('Incorrect email or password')) {
    return isHi
      ? 'ईमेल या पासवर्ड गलत है। कृपया पुनः जांचें।'
      : 'Incorrect email or password. Please verify your credentials.'
  }
  if (msg.includes('at least 6 characters')) {
    return isHi
      ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'
      : 'Password must be at least 6 characters long.'
  }
  if (msg.includes('valid email')) {
    return isHi ? 'कृपया एक मान्य ईमेल पता दर्ज करें।' : 'Please enter a valid email address.'
  }
  return (
    msg ||
    (isHi
      ? 'प्रमाणीकरण विफल रहा। कृपया पुनः प्रयास करें।'
      : 'Authentication failed. Please try again.')
  )
}
