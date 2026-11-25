import crypto from 'crypto';
import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
function getPort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const val = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(val)) return val;
  }
  if (process.env.PORT) {
    const val = parseInt(process.env.PORT, 10);
    if (!isNaN(val)) return val;
  }
  return 3000;
}

function getHost(): string {
  const hostArgIndex = process.argv.indexOf('--host');
  if (hostArgIndex !== -1 && process.argv[hostArgIndex + 1]) {
    return process.argv[hostArgIndex + 1];
  }
  return process.env.HOST || '0.0.0.0';
}

const port = getPort();
const host = getHost();

app.use(express.json({ limit: '10mb' }));
app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'bluetooth=(self), microphone=(self)');
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), port, host });
});

// EMOTION AI Native Custom Authentication (scrypt + HMAC-SHA256 Bearer tokens)
interface ServerAuthUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  institution: string;
  saltHex: string;
  hashHex: string;
  createdAt: number;
}

const AUTH_SESSION_SECRET =
  process.env.AUTH_SESSION_SECRET?.trim() || crypto.randomBytes(32).toString('hex');
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const authUsersByEmail = new Map<string, ServerAuthUser>();
const authUsersByUid = new Map<string, ServerAuthUser>();
const revokedTokenIds = new Set<string>();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hashPasswordScrypt(password: string, saltHex: string): string {
  return crypto.scryptSync(password, saltHex, 64).toString('hex');
}

function verifyPasswordScrypt(password: string, saltHex: string, storedHashHex: string): boolean {
  const computed = crypto.scryptSync(password, saltHex, 64);
  const stored = Buffer.from(storedHashHex, 'hex');
  if (computed.length !== stored.length) return false;
  return crypto.timingSafeEqual(computed, stored);
}

function signSessionToken(user: ServerAuthUser): string {
  const payload = {
    jti: crypto.randomBytes(16).toString('hex'),
    uid: user.uid,
    email: user.email,
    iat: Date.now(),
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', AUTH_SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

function verifySessionToken(
  token: string
): { jti: string; user: ServerAuthUser } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload, signature] = parts;
  if (!encodedPayload || !signature) return null;

  const expectedSig = crypto
    .createHmac('sha256', AUTH_SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as {
      jti?: string;
      uid?: string;
      exp?: number;
    };
    if (!parsed.jti || !parsed.uid || typeof parsed.exp !== 'number') return null;
    if (parsed.exp <= Date.now() || revokedTokenIds.has(parsed.jti)) return null;
    const user = authUsersByUid.get(parsed.uid);
    if (!user) return null;
    return { jti: parsed.jti, user };
  } catch {
    return null;
  }
}

function serializeAuthUser(user: ServerAuthUser) {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    institution: user.institution,
  };
}

app.post('/api/auth/register', (req, res) => {
  const rawEmail = req.body?.email;
  const rawPassword = req.body?.password;
  const rawFullName = req.body?.fullName;
  const rawRole = req.body?.role;
  const rawInstitution = req.body?.institution;

  if (typeof rawEmail !== 'string' || typeof rawPassword !== 'string' || typeof rawFullName !== 'string') {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const email = rawEmail.trim().toLowerCase();
  const fullName = rawFullName.trim().slice(0, 120);
  const role =
    typeof rawRole === 'string' && rawRole.trim()
      ? rawRole.trim().slice(0, 80)
      : 'B Pharm Student and Innovator';
  const institution =
    typeof rawInstitution === 'string' && rawInstitution.trim()
      ? rawInstitution.trim().slice(0, 120)
      : 'EMOTION AI Workspace';

  if (!email || email.length > 254 || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (!fullName) {
    return res.status(400).json({ error: 'Please enter your full name.' });
  }
  if (rawPassword.length < 6 || rawPassword.length > 128) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }
  if (authUsersByEmail.has(email)) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const saltHex = crypto.randomBytes(16).toString('hex');
  const hashHex = hashPasswordScrypt(rawPassword, saltHex);
  const user: ServerAuthUser = {
    uid: `ea_${crypto.randomBytes(8).toString('hex')}`,
    email,
    displayName: fullName,
    role,
    institution,
    saltHex,
    hashHex,
    createdAt: Date.now(),
  };

  authUsersByEmail.set(email, user);
  authUsersByUid.set(user.uid, user);

  const token = signSessionToken(user);
  return res.status(201).json({
    token,
    user: serializeAuthUser(user),
  });
});

app.post('/api/auth/login', (req, res) => {
  const rawEmail = req.body?.email;
  const rawPassword = req.body?.password;

  if (typeof rawEmail !== 'string' || typeof rawPassword !== 'string') {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const email = rawEmail.trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (rawPassword.length < 6 || rawPassword.length > 128) {
    return res.status(400).json({ error: 'Incorrect email or password.' });
  }

  const user = authUsersByEmail.get(email);
  if (!user || !verifyPasswordScrypt(rawPassword, user.saltHex, user.hashHex)) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  const token = signSessionToken(user);
  return res.json({
    token,
    user: serializeAuthUser(user),
  });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const verified = token ? verifySessionToken(token) : null;
  if (!verified) {
    return res.status(401).json({ error: 'Unauthorized session.' });
  }
  return res.json({ user: serializeAuthUser(verified.user) });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const verified = token ? verifySessionToken(token) : null;
  if (verified) {
    revokedTokenIds.add(verified.jti);
  }
  return res.json({ ok: true });
});

// GitHub OAuth Flow (Full repo + user access via popup + postMessage)
interface GithubHandoffEntry {
  token: string;
  user: ReturnType<typeof serializeAuthUser> & {
    githubUsername: string;
    githubConnected: boolean;
  };
  expiresAt: number;
}

const githubStates = new Map<string, { linkUid?: string; expiresAt: number }>();
const githubHandoffs = new Map<string, GithubHandoffEntry>();
const githubAccessTokensByUid = new Map<string, { accessToken: string; username: string; avatarUrl?: string }>();

function getGithubRedirectUri(): string {
  const rawAppUrl = (process.env.APP_URL || '').trim().replace(/\/+$/, '');
  if (rawAppUrl && rawAppUrl !== 'MY_APP_URL') {
    return `${rawAppUrl}/auth/github/callback`;
  }
  return `http://localhost:${port}/auth/github/callback`;
}

app.get('/api/auth/github/url', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return res.status(503).json({
      error: 'GitHub OAuth is not configured yet. Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in AI Studio Secrets.',
      needsSetup: true,
      redirectUri: getGithubRedirectUri(),
    });
  }

  // Optional: link GitHub to an already-signed-in Bearer session
  let linkUid: string | undefined;
  const authHeader = req.headers.authorization || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (bearer) {
    const verified = verifySessionToken(bearer);
    if (verified) linkUid = verified.user.uid;
  }

  const state = crypto.randomBytes(24).toString('hex');
  githubStates.set(state, { linkUid, expiresAt: Date.now() + 10 * 60 * 1000 });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGithubRedirectUri(),
    scope: 'repo read:user user:email',
    state,
  });

  return res.json({
    url: `https://github.com/login/oauth/authorize?${params.toString()}`,
    redirectUri: getGithubRedirectUri(),
  });
});

app.get(['/auth/github/callback', '/auth/github/callback/'], async (req, res) => {
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  const oauthError = typeof req.query.error === 'string' ? req.query.error : '';

  const renderPopupResult = (payload: Record<string, string>) => {
    const safeJson = JSON.stringify(payload).replace(/</g, '\\u003c');
    return res.status(200).send(`<!doctype html>
<html>
  <body style="font-family: system-ui, sans-serif; padding: 24px; background: #E7ECD9; color: #1B251A;">
    <p>${payload.type === 'GITHUB_OAUTH_SUCCESS' ? 'GitHub connected! Closing window...' : 'GitHub sign-in did not complete. You may close this window.'}</p>
    <script>
      (function() {
        var msg = ${safeJson};
        if (window.opener) {
          window.opener.postMessage(msg, '*');
          window.close();
        } else {
          window.location.href = '/';
        }
      })();
    </script>
  </body>
</html>`);
  };

  if (oauthError) {
    return renderPopupResult({ type: 'GITHUB_OAUTH_ERROR', error: 'GitHub authorization was cancelled.' });
  }

  const stateEntry = state ? githubStates.get(state) : undefined;
  if (state) githubStates.delete(state);
  if (!code || !stateEntry || stateEntry.expiresAt < Date.now()) {
    return renderPopupResult({ type: 'GITHUB_OAUTH_ERROR', error: 'Invalid or expired GitHub sign-in state.' });
  }

  const clientId = process.env.GITHUB_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return renderPopupResult({ type: 'GITHUB_OAUTH_ERROR', error: 'GitHub OAuth secrets are missing on server.' });
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: getGithubRedirectUri(),
      }),
    });

    const tokenData = (await tokenRes.json()) as { access_token?: string; error_description?: string };
    const ghAccessToken = tokenData.access_token;
    if (!ghAccessToken) {
      return renderPopupResult({
        type: 'GITHUB_OAUTH_ERROR',
        error: tokenData.error_description || 'Could not obtain GitHub access token.',
      });
    }

    const ghHeaders = {
      Authorization: `Bearer ${ghAccessToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'EMOTION-AI-App',
    };

    const userRes = await fetch('https://api.github.com/user', { headers: ghHeaders });
    if (!userRes.ok) {
      return renderPopupResult({ type: 'GITHUB_OAUTH_ERROR', error: 'Failed to read GitHub profile.' });
    }
    const ghUser = (await userRes.json()) as {
      id: number;
      login: string;
      name?: string | null;
      email?: string | null;
      avatar_url?: string | null;
    };

    let primaryEmail = ghUser.email?.trim().toLowerCase() || '';
    if (!primaryEmail) {
      const emailsRes = await fetch('https://api.github.com/user/emails', { headers: ghHeaders });
      if (emailsRes.ok) {
        const emails = (await emailsRes.json()) as { email: string; primary: boolean; verified: boolean }[];
        const best = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified) || emails[0];
        if (best?.email) primaryEmail = best.email.trim().toLowerCase();
      }
    }
    if (!primaryEmail) {
      primaryEmail = `${ghUser.login}@users.noreply.github.com`;
    }

    let appUser = stateEntry.linkUid ? authUsersByUid.get(stateEntry.linkUid) : undefined;
    if (!appUser) {
      appUser = authUsersByEmail.get(primaryEmail);
    }
    if (!appUser) {
      const uid = `gh_${ghUser.id}`;
      appUser = {
        uid,
        email: primaryEmail,
        displayName: (ghUser.name || ghUser.login).slice(0, 120),
        role: 'B Pharm Student and Innovator',
        institution: `GitHub · @${ghUser.login}`.slice(0, 120),
        saltHex: crypto.randomBytes(16).toString('hex'),
        hashHex: crypto.randomBytes(64).toString('hex'),
        createdAt: Date.now(),
      };
      authUsersByEmail.set(primaryEmail, appUser);
      authUsersByUid.set(uid, appUser);
    }

    githubAccessTokensByUid.set(appUser.uid, {
      accessToken: ghAccessToken,
      username: ghUser.login,
      avatarUrl: ghUser.avatar_url || undefined,
    });

    const sessionToken = signSessionToken(appUser);
    const handoffId = crypto.randomBytes(24).toString('hex');
    githubHandoffs.set(handoffId, {
      token: sessionToken,
      user: {
        ...serializeAuthUser(appUser),
        githubUsername: ghUser.login,
        githubConnected: true,
      },
      expiresAt: Date.now() + 90 * 1000,
    });

    return renderPopupResult({ type: 'GITHUB_OAUTH_SUCCESS', handoffId });
  } catch (err) {
    console.error('GitHub OAuth callback error:', err);
    return renderPopupResult({ type: 'GITHUB_OAUTH_ERROR', error: 'GitHub OAuth exchange failed.' });
  }
});

app.post('/api/auth/github/exchange', (req, res) => {
  const handoffId = typeof req.body?.handoffId === 'string' ? req.body.handoffId : '';
  if (!handoffId) {
    return res.status(400).json({ error: 'Missing GitHub handoff token.' });
  }
  const entry = githubHandoffs.get(handoffId);
  githubHandoffs.delete(handoffId);
  if (!entry || entry.expiresAt < Date.now()) {
    return res.status(401).json({ error: 'GitHub session handoff expired. Please try again.' });
  }
  return res.json({ token: entry.token, user: entry.user });
});

app.get('/api/github/repos', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const verified = token ? verifySessionToken(token) : null;
  if (!verified) {
    return res.status(401).json({ error: 'Unauthorized session.' });
  }

  const gh = githubAccessTokensByUid.get(verified.user.uid);
  if (!gh) {
    return res.json({ connected: false, repos: [] });
  }

  try {
    const ghRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=15', {
      headers: {
        Authorization: `Bearer ${gh.accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'EMOTION-AI-App',
      },
    });
    if (!ghRes.ok) {
      return res.status(502).json({ error: 'Could not fetch GitHub repositories.' });
    }
    const rawRepos = (await ghRes.json()) as Array<{
      id: number;
      name: string;
      full_name: string;
      private: boolean;
      html_url: string;
      description: string | null;
      updated_at: string;
      default_branch: string;
    }>;
    return res.json({
      connected: true,
      username: gh.username,
      avatarUrl: gh.avatarUrl,
      repos: rawRepos.map((r) => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        isPrivate: r.private,
        htmlUrl: r.html_url,
        description: r.description || '',
        updatedAt: r.updated_at,
        defaultBranch: r.default_branch,
      })),
    });
  } catch (err) {
    console.error('GitHub repos fetch error:', err);
    return res.status(502).json({ error: 'Failed to load GitHub repositories.' });
  }
});

// Downloadable JPEG logo endpoint
app.get('/api/logo.jpg', (_req, res) => {
  const candidates = [
    path.resolve(__dirname, 'public', 'emotion-ai-logo.jpg'),
    path.resolve(__dirname, 'dist', 'emotion-ai-logo.jpg'),
  ];
  const filePath = candidates.find((p) => fs.existsSync(p));
  if (!filePath) {
    return res.status(404).json({ error: 'Logo JPEG not found' });
  }
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Content-Disposition', 'attachment; filename="emotion-ai-logo.jpg"');
  return res.sendFile(filePath);
});

// Shared Cartesia synthesis helper (keeps CARTESIA_API_KEY strictly on server)
async function synthesizeCartesiaSpeech(
  rawText: string,
  language: string,
  timeoutMs = 5500
): Promise<{ ok: true; audioBuffer: Buffer } | { ok: false; status: number; error: string }> {
  const cleanText = rawText
    .replace(/[*_`#>]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1200);

  if (!cleanText) {
    return { ok: false, status: 400, error: 'Text cannot be empty.' };
  }

  const apiKey = process.env.CARTESIA_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_CARTESIA_API_KEY') {
    return { ok: false, status: 503, error: 'Cartesia API key is not configured on the server.' };
  }

  const envVoiceId = process.env.CARTESIA_VOICE_ID?.trim();
  const voiceId =
    envVoiceId && /^[0-9a-fA-F-]{16,64}$/.test(envVoiceId)
      ? envVoiceId
      : 'db6b0ed5-d5d3-463d-ae85-518a07d3c2b4';

  const ttsLanguage = language === 'hi' ? 'hi' : 'en';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const upstream = await fetch('https://api.cartesia.ai/tts/bytes', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Cartesia-Version': '2026-08-14',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: 'sonic-3',
        transcript: cleanText,
        voice: {
          mode: 'id',
          id: voiceId,
        },
        language: ttsLanguage,
        output_format: {
          container: 'mp3',
          bit_rate: 64000,
          sample_rate: 24000,
        },
        generation_config: {
          speed: 1.06,
        },
      }),
      signal: controller.signal,
    });

    if (!upstream.ok) {
      console.warn(`Cartesia TTS upstream returned HTTP ${upstream.status}`);
      return { ok: false, status: 502, error: 'Cartesia synthesis unavailable.' };
    }

    const audioBuffer = Buffer.from(await upstream.arrayBuffer());
    return { ok: true, audioBuffer };
  } catch (err: any) {
    console.warn('Cartesia TTS proxy error:', err?.message || 'unknown error');
    return { ok: false, status: 502, error: 'Cartesia synthesis failed.' };
  } finally {
    clearTimeout(timeoutId);
  }
}

// Server-side Cartesia TTS proxy (keeps CARTESIA_API_KEY strictly on server)
app.post('/api/tts/cartesia', async (req, res) => {
  const rawText = req.body?.text;
  if (typeof rawText !== 'string' || !rawText.trim()) {
    return res.status(400).json({ error: 'Text is required for speech synthesis.' });
  }

  const result = await synthesizeCartesiaSpeech(rawText, req.body?.language === 'hi' ? 'hi' : 'en');
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error, fallback: true });
  }

  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Cache-Control', 'no-store');
  return res.send(result.audioBuffer);
});

let cachedGeminiClient: GoogleGenAI | null = null;
let cachedGeminiKey: string | null = null;

// Helper to get cached GoogleGenAI client with standard User-Agent header
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY)?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  if (cachedGeminiClient && cachedGeminiKey === apiKey) {
    return cachedGeminiClient;
  }
  cachedGeminiKey = apiKey;
  cachedGeminiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  return cachedGeminiClient;
}

function getClinicalRuleEngineResponse(
  lower: string,
  language: string,
  userContext: any,
  isVoice = false
): { reply: string; suggestedAction?: { type: 'breathing' | 'sound' | 'tonic' | 'grounding' | 'sos'; label: string } } {
  const patientName = userContext?.name || 'Friend';
  const patientScore = userContext?.wellnessScore ?? 72;
  const stressLevel = userContext?.factors?.stress || 'Moderate';
  const sleepHours = userContext?.factors?.sleepHours ?? 6.5;
  const typingWpm = userContext?.factors?.typingWpm ?? 44;
  const typingVar = userContext?.factors?.typingVarianceMs ?? 48;
  const patchRate = userContext?.patch?.infusionRateMcgHr ?? 110;
  const reservoir = userContext?.patch?.reservoirPercent ?? 84;

  let reply = '';
  let action: { type: 'breathing' | 'sound' | 'tonic' | 'grounding' | 'sos'; label: string } | undefined = undefined;

  const isGreeting =
    /^(hi|hello|hey|hii|namaste|नमस्ते|हाय|हेलो)[\s!?.]*$/i.test(lower.trim()) ||
    /\b(who are you|what is your name)\b/i.test(lower);

  if (
    /\b(patch|transdermal|infusion|mcg)\b/i.test(lower) ||
    lower.includes('पैच')
  ) {
    reply = language === 'hi'
      ? `आपका एआई ट्रांसडर्मल पैच अभी ${patchRate} mcg/hr की दर से काम कर रहा है (रिज़र्वायर: ${reservoir}%)। यह आपकी स्थिति के अनुसार 60–180 mcg/hr के सुरक्षित दायरे में खुराक नियंत्रित करता है।`
      : `Your AI Transdermal Patch is currently infusing at ${patchRate} mcg/hr (${reservoir}% reservoir remaining), safely adjusting within the 60–180 mcg/hr window.`;
    if (!isVoice) action = { type: 'tonic', label: language === 'hi' ? 'पैच विवरण देखें' : 'Inspect Patch Details' };
  } else if (
    /\b(wellness score|my score|my report|emotion dna|biomarker|typing|keystroke|phenotyp)\b/i.test(lower) ||
    lower.includes('वेलनेस स्कोर') ||
    lower.includes('रिपोर्ट')
  ) {
    reply = language === 'hi'
      ? `आपका वर्तमान वेलनेस स्कोर ${patientScore}/100 है। कीस्ट्रोक गति ${typingWpm} WPM (${typingVar} ms वेरिएंस), नींद ${sleepHours} घंटे और तनाव स्तर ${stressLevel} दर्ज है।`
      : `Your current Wellness Score is ${patientScore}/100, based on ${sleepHours}h logged sleep, ${typingWpm} WPM typing cadence (${typingVar} ms variance), and ${stressLevel} stress.`;
  } else if (
    /\b(psilocybin|emotionmed|medication|medicine|syrup|drug|dosage|dose|side effect|pharmacology)\b/i.test(lower) ||
    lower.includes('दवा') ||
    lower.includes('खुराक')
  ) {
    reply = language === 'hi'
      ? `Psilocybin प्रोटोकॉल चिकित्सकीय निगरानी में EmotionMed के अंतर्गत दिया जाता है। सटीक खुराक, समय या अन्य दवाओं के साथ सावधानी के लिए कृपया अपने Care Bridge डॉक्टर से परामर्श लें।`
      : `Psilocybin is administered under clinician-supervised EmotionMed protocols. Always confirm your exact schedule or potential interactions with SSRIs or sedatives through Care Bridge with your doctor.`;
    if (!isVoice) action = { type: 'tonic', label: language === 'hi' ? 'इमोशनमेड देखें' : 'View EmotionMed' };
  } else if (
    /\b(panic|anxiety|anxious|stress|overwhelm|nervous)\b/i.test(lower) ||
    lower.includes('घबराहट') ||
    lower.includes('तनाव') ||
    lower.includes('चिंता')
  ) {
    reply = language === 'hi'
      ? `घबराहट या तनाव कम करने के लिए अभी कंधे ढीले छोड़ें और 4-4-4-4 बॉक्स ब्रीदिंग करें: 4 सेकंड सांस लें, 4 सेकंड रोकें, 4 सेकंड छोड़ें और 4 सेकंड रुकें। यह तुरंत मन और धड़कन को शांत करता है।`
      : `To calm acute stress or anxiety right away, drop your shoulders and do 4 slow cycles of Box Breathing: inhale for 4 seconds, hold for 4, exhale for 4, and pause for 4.`;
    if (!isVoice) action = { type: 'breathing', label: language === 'hi' ? 'बॉक्स ब्रीदिंग शुरू करें' : 'Start 2-min Box Breathing' };
  } else if (
    /\b(sad|depress|lonely|burnout|exhaust|hopeless|low mood)\b/i.test(lower) ||
    lower.includes('उदास') ||
    lower.includes('अकेला')
  ) {
    reply = language === 'hi'
      ? `जब मन भारी या थका हुआ लगे, तो खुद पर दबाव न डालें। थोड़ा पानी पिएं, स्क्रीन से 5 मिनट दूर हटें और किसी करीबी व्यक्ति से बात करें।`
      : `When you feel low or drained, be gentle with yourself—take a 5-minute break from screens, drink a glass of water, and focus on just one small comforting step.`;
    if (!isVoice) action = { type: 'grounding', label: language === 'hi' ? '5-इंद्रिय ग्राउंडिंग' : '5-Senses Grounding' };
  } else if (
    /\b(sleep|insomnia|nightmare|awake)\b/i.test(lower) ||
    lower.includes('नींद') ||
    lower.includes('सोना')
  ) {
    reply = language === 'hi'
      ? `बेहतर नींद के लिए सोने से 30 मिनट पहले स्क्रीन बंद करें, कमरे की रोशनी हल्की रखें और 4-7-8 प्राणायाम (4 सेकंड सांस लें, 7 सेकंड रोकें, 8 सेकंड धीरे छोड़ें) का अभ्यास करें।`
      : `For deeper sleep, dim screens 30 minutes before bed and try 4 rounds of 4-7-8 breathing: inhale for 4 seconds, hold for 7 seconds, and exhale slowly for 8 seconds.`;
    if (!isVoice) action = { type: 'sound', label: language === 'hi' ? 'ध्वनि चिकित्सा सुनें' : 'Open Sound Therapy' };
  } else if (
    /\b(exam|study|focus|concentrat)\b/i.test(lower) ||
    lower.includes('पढ़ाई') ||
    lower.includes('परीक्षा')
  ) {
    reply = language === 'hi'
      ? `पढ़ाई में एकाग्रता बढ़ाने के लिए 45 मिनट ध्यान से पढ़ें और फिर 10 मिनट का स्क्रीन-मुक्त ब्रेक लें। एक समय में केवल एक विषय पर ध्यान केंद्रित करें।`
      : `To sharpen focus while studying, work in 45-minute single-topic blocks followed by a 10-minute screen-free break, and keep water nearby.`;
  } else if (isGreeting) {
    reply = language === 'hi'
      ? `नमस्ते ${patientName}! मैं Emotion हूँ। बताइए आज आप किस सवाल या विषय पर मदद चाहते हैं?`
      : `Hello ${patientName}! I'm Emotion. What specific question can I help you answer today?`;
  } else {
    reply = language === 'hi'
      ? `कृपया अपना प्रश्न थोड़ा स्पष्ट पूछें—मैं आपके सवाल का सीधा और सटीक उत्तर देने के लिए तैयार हूँ।`
      : `Please ask your question directly—I'm here to give a specific, clear answer to whatever you'd like to know.`;
  }

  return { reply, suggestedAction: action };
}

// AI Reflection & Empathetic Companion (Server-side Gemini AI)
app.post('/api/gemini-reflect', async (req, res) => {
  try {
    const { journalText, moodScore, factors, language = 'English' } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Graceful on-device fallback prompt
      return res.json({
        reflection: `Thank you for sharing your thoughts. Notice how expressing yourself helps release tension. Your current wellness score reflects normal variations in daily stress. Remember to take steady, deep breaths and honor your efforts today.`,
        suggestedIntervention: 'Box Breathing (2 min)',
        groundingPrompt: 'Notice 3 things in your room that bring you a sense of grounding and safety.',
        source: 'on-device-rule-engine',
      });
    }

    const prompt = `You are EMOTION AI's compassionate mental wellness coach and digital phenotyping companion.
The user has checked in with:
- Mood/Wellness Score: ${moodScore || 65}/100
- Key Stress Factors: ${JSON.stringify(factors || ['academic/work pressure', 'screen fatigue'])}
- User's Reflection/Journal: "${journalText || 'Feeling a bit overwhelmed and tired.'}"
- Preferred Language: ${language}

Provide:
1. A warm, non-judgmental, brief empathetic reflection (2-3 sentences max).
2. One specific micro-intervention (e.g. 2-min box breathing, 5-senses grounding, physiological sigh, or a sip of warm herbal infusion).
3. A gentle self-care reminder.

Important: Be supportive, avoid clinical jargon, never diagnose, and align with EMOTION AI's gentle, accessible tone.
Respond in valid JSON format matching this schema:
{
  "reflection": "...",
  "suggestedIntervention": "...",
  "groundingPrompt": "..."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      ...parsed,
      source: 'gemini-ai',
    });
  } catch (err: any) {
    console.error('Gemini reflection error:', err);
    return res.json({
      reflection: 'Take a gentle breath. You have handled tough days before, and you can take this one minute by minute. A 2-minute breathing exercise can quickly reset your nervous system.',
      suggestedIntervention: 'Box Breathing (4-4-4-4)',
      groundingPrompt: 'Inhale gently for 4 counts, hold for 4, exhale slowly for 4, and pause for 4.',
      source: 'fallback',
    });
  }
});

// Voice biomarker analysis endpoint (Server-side Gemini AI)
app.post('/api/analyze-voice', async (req, res) => {
  try {
    const { transcript, audioMetrics } = req.body;
    const ai = getGeminiClient();

    if (!ai || !transcript) {
      return res.json({
        vocalStressLevel: 'Mild-to-Moderate',
        pitchVarianceIndex: audioMetrics?.pitchVariance || 'Normal (moderate fluctuation)',
        speakingRateWPM: audioMetrics?.wpm || 135,
        pauseLatencyMs: audioMetrics?.pauseLatency || 620,
        clinicalInsight: 'Speech rhythm displays slight hesitation and vocal tension typical of cognitive fatigue, but maintains emotional coherence.',
        suggestedMicroIntervention: '4-7-8 Pranayama or 2-min Sound Therapy',
      });
    }

    const prompt = `Analyze this user's vocal check-in for digital phenotyping stress markers:
Transcript: "${transcript}"
Acoustic Metrics: Pitch variance: ${audioMetrics?.pitchVariance || 'medium'}, Pause latency: ${audioMetrics?.pauseLatency || 'medium'}ms, Speaking rate: ${audioMetrics?.wpm || '130'} WPM.

Analyze vocal biomarkers (pitch variance, speech cadence, cognitive strain signals) without diagnosing.
Return JSON:
{
  "vocalStressLevel": "Low" | "Mild" | "Elevated" | "High",
  "pitchVarianceIndex": "Short description",
  "speakingRateWPM": 130,
  "pauseLatencyMs": 600,
  "clinicalInsight": "Warm observational summary of vocal indicators",
  "suggestedMicroIntervention": "Specific exercise suggestion"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err: any) {
    return res.json({
      vocalStressLevel: 'Mild',
      pitchVarianceIndex: 'Slightly compressed variance',
      speakingRateWPM: 128,
      pauseLatencyMs: 650,
      clinicalInsight: 'Vocal patterns indicate minor cognitive tiredness. A brief grounding break will replenish your focus.',
      suggestedMicroIntervention: 'Box Breathing (2 min)',
    });
  }
});

// Full Multimodal Voice & Text Patient Chatbot Endpoint (Server-side Gemini AI)
app.post('/api/patient-chat', async (req, res) => {
  try {
    const {
      message,
      history = [],
      userContext = {},
      language = 'en',
      isVoice = false,
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const lower = message.toLowerCase();
    const crisisKeywords = [
      'kill myself', 'suicide', 'end my life', 'want to die', 'harm myself',
      'cut myself', 'giving up on life', 'no reason to live', 'मरना चाहता हूँ',
      'आत्महत्या', 'जान देना'
    ];
    const isCrisis = crisisKeywords.some((kw) => lower.includes(kw));

    if (isCrisis) {
      return res.json({
        reply: language === 'hi'
          ? `मैं समझ सकता हूँ कि आप इस समय बहुत गहरे कष्ट और अकेलेपन से गुज़र रहे हैं। कृपया याद रखें कि आप अकेले नहीं हैं और आपकी जान बहुत अनमोल है।\n\nतुरंत सहायता के लिए कृपया इन निःशुल्क और गोपनीय हेल्पलाइन पर संपर्क करें:\n• टेली-मानस (Tele-MANAS, भारत): 14416 या 1800-891-4416 (24/7)\n• राष्ट्रीय आपातकालीन: 112\n• किरण (KIRAN): 1800-599-0019\n\nकृपया किसी विश्वस्त मित्र, परिवार या डॉक्टर से अभी बात करें। हम आपकी सुरक्षा की परवाह करते हैं।`
          : `I hear how much deep pain and exhaustion you are carrying right now. Please know that your life matters, and you do not have to carry this heavy weight alone.\n\nPlease reach out immediately to a caring professional who can support you right now:\n• Tele-MANAS (India 24/7 Crisis Helpline): 14416 or 1800-891-4416\n• KIRAN Mental Health Helpline: 1800-599-0019\n• Emergency Medical Services: 112\n\nI am right here with you. Please take a gentle breath and contact a loved one or one of these lifelines immediately.`,
        suggestedAction: {
          type: 'sos',
          label: language === 'hi' ? 'आपातकालीन सहायता (SOS)' : 'Open Crisis Support (SOS)',
        },
        crisisDetected: true,
      });
    }

    const ai = getGeminiClient();

    // Context description
    const patientName = userContext.name || 'Patient';
    const patientScore = userContext.wellnessScore ?? 72;
    const patientStress = userContext.factors?.stress || 'Medium';

    const attachVoiceAudioIfRequested = async (payload: Record<string, any>) => {
      if (!isVoice || typeof payload.reply !== 'string') return payload;
      const apiKey = process.env.CARTESIA_API_KEY?.trim();
      if (!apiKey || apiKey === 'MY_CARTESIA_API_KEY') return payload;
      const tts = await synthesizeCartesiaSpeech(payload.reply, language, 4500);
      if (tts.ok) {
        return {
          ...payload,
          audioBase64: tts.audioBuffer.toString('base64'),
          audioMimeType: 'audio/mpeg',
        };
      }
      return payload;
    };

    if (!ai) {
      const fallbackResult = getClinicalRuleEngineResponse(lower, language, userContext, Boolean(isVoice));
      return res.json(
        await attachVoiceAudioIfRequested({
          ...fallbackResult,
          crisisDetected: false,
          source: 'clinical-rule-engine',
        })
      );
    }

    try {
      // Keep voice context ultra-lean (last 4 turns) for minimum latency
      const rawHistory = Array.isArray(history) ? history.slice(isVoice ? -4 : -8) : [];
      const mappedTurns: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

      for (const h of rawHistory) {
        if (!h || typeof h.text !== 'string' || !h.text.trim()) continue;
        const role: 'user' | 'model' = h.sender === 'user' ? 'user' : 'model';
        if (mappedTurns.length === 0 && role !== 'user') continue;
        if (mappedTurns.length > 0 && mappedTurns[mappedTurns.length - 1].role === role) {
          mappedTurns[mappedTurns.length - 1].parts[0].text += `\n${h.text.trim()}`;
        } else {
          mappedTurns.push({ role, parts: [{ text: h.text.trim() }] });
        }
      }

      const trimmedMsg = message.trim();
      if (mappedTurns.length > 0 && mappedTurns[mappedTurns.length - 1].role === 'user') {
        if (mappedTurns[mappedTurns.length - 1].parts[0].text !== trimmedMsg) {
          mappedTurns[mappedTurns.length - 1].parts[0].text = trimmedMsg;
        }
      } else {
        mappedTurns.push({ role: 'user', parts: [{ text: trimmedMsg }] });
      }

      const asksAboutReportOrStats =
        /\b(wellness|score|report|dna|patch|reservoir|mcg|typing|keystroke|my sleep|my stress|assessment)\b/i.test(lower) ||
        lower.includes('वेलनेस') ||
        lower.includes('स्कोर') ||
        lower.includes('रिपोर्ट') ||
        lower.includes('पैच');

      const asksAboutMedication =
        /\b(psilocybin|emotionmed|medicine|medication|syrup|drug|dose|dosage|interaction|side effect)\b/i.test(lower) ||
        lower.includes('दवा') ||
        lower.includes('खुराक');

      const conditionalSections: string[] = [];
      if (asksAboutReportOrStats) {
        conditionalSections.push(
          `User's current metrics (share ONLY the specific figures relevant to their question): Wellness Score ${patientScore}/100, Stress ${patientStress}, Sleep ${userContext?.factors?.sleepHours ?? 6.5}h, Patch ${userContext?.patch?.infusionRateMcgHr ?? 110} mcg/hr (${userContext?.patch?.reservoirPercent ?? 84}% reservoir).`
        );
      }
      if (asksAboutMedication) {
        conditionalSections.push(
          `Medication note (mention ONLY because the user asked about medication/Psilocybin): Psilocybin is EmotionMed's clinician-supervised formulation; advise verifying dose changes or SSRI/sedative interactions with a Care Bridge doctor.`
        );
      }

      const conditionalContextBlock =
        conditionalSections.length > 0 ? `\n\n${conditionalSections.join('\n')}` : '';

      const systemInstruction = isVoice
        ? `You are Emotion, a helpful voice assistant for ${patientName}.
STRICT RULES:
1. Answer ONLY the exact question asked—directly, accurately, and concisely in 1 to 2 natural spoken sentences (maximum 40 words) with ZERO markdown, bullets, or filler.
2. Do NOT generate a wellness report, and do NOT mention wellness scores, sleep stats, patch infusion rates, or Psilocybin/drugs unless the user specifically asked about them.
3. Language: ${language === 'hi' ? 'Natural spoken Hindi' : 'Natural spoken English'}.
4. Never diagnose medical conditions; only mention crisis helplines (Tele-MANAS 14416 / 112) if self-harm or crisis is expressed.${conditionalContextBlock}`
        : `You are Emotion, a helpful, intelligent AI assistant chatting with ${patientName}.
STRICT RULES:
1. Answer ONLY and specifically the question the user asked. Be direct, clear, accurate, and conversational.
2. Do NOT output an unrequested wellness report, health summary, score breakdown, patch rate, or drug/Psilocybin information unless the user explicitly asked about their report, stats, patch, or that medication.
3. If the user asks a general question (e.g. science, pharmacy, daily life, stress tips, sleep tips, study help, or casual conversation), answer that exact question directly without forcing app telemetry or medication talk into the reply.
4. Language: ${language === 'hi' ? 'Natural, clear Hindi' : 'Natural, clear English'}.
5. Never diagnose medical disorders; only provide emergency helplines (Tele-MANAS 14416 / Emergency 112) if the user expresses crisis or self-harm.${conditionalContextBlock}`;

      const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
        Promise.race([
          promise,
          new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
          ),
        ]);

      const response = await withTimeout(
        Promise.any([
          ai.models
            .generateContent({
              model: 'gemini-3.1-flash-lite',
              contents: mappedTurns,
              config: {
                systemInstruction,
                thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
              },
            })
            .then((res) => ({ res, model: 'gemini-3.1-flash-lite' })),
          ai.models
            .generateContent({
              model: 'gemini-4-hydrogen',
              contents: mappedTurns,
              config: {
                systemInstruction,
                thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              },
            })
            .then((res) => ({ res, model: 'gemini-4-hydrogen' })),
        ]),
        isVoice ? 4500 : 9000,
        'gemini-chat'
      );

      const usedModel = response.model;
      let replyText =
        response.res.text?.trim() ||
        (language === 'hi'
          ? 'मैं आपकी बात सुन रहा हूँ। बताइए मैं कैसे मदद करूँ?'
          : 'I hear you clearly. Tell me a bit more about what you need right now.');

      if (isVoice) {
        replyText = replyText
          .replace(/[*_`#>]+/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      }

      // Only attach a suggested action button for text chat when genuinely triggered by the question/answer
      let suggestedAction:
        | { type: 'breathing' | 'sound' | 'tonic' | 'grounding' | 'sos'; label: string }
        | undefined;
      if (!isVoice) {
        const lowerReply = replyText.toLowerCase();

        if (lowerReply.includes('box breath') || lowerReply.includes('breathing exercise') || lowerReply.includes('बॉक्स ब्रीदिंग')) {
          suggestedAction = {
            type: 'breathing',
            label: language === 'hi' ? '2-मिनट बॉक्स ब्रीदिंग' : 'Start Box Breathing (2 min)',
          };
        } else if (asksAboutMedication && (lowerReply.includes('psilocybin') || lowerReply.includes('emotionmed'))) {
          suggestedAction = {
            type: 'tonic',
            label: language === 'hi' ? 'उपचार व इमोशनमेड देखें' : 'Open Treatment & Rx',
          };
        } else if (lowerReply.includes('sound therapy') || lowerReply.includes('ध्वनि चिकित्सा')) {
          suggestedAction = {
            type: 'sound',
            label: language === 'hi' ? 'ध्वनि चिकित्सा' : 'Play Sound Therapy',
          };
        } else if (lowerReply.includes('5-4-3-2-1') || lowerReply.includes('sensory grounding')) {
          suggestedAction = {
            type: 'grounding',
            label: language === 'hi' ? '5 इंद्रिय ग्राउंडिंग' : '5 Senses Grounding',
          };
        }
      }

      return res.json(
        await attachVoiceAudioIfRequested({
          reply: replyText,
          suggestedAction,
          crisisDetected: false,
          source: usedModel,
        })
      );
    } catch (genAiError: any) {
      console.warn(
        'Gemini AI call failed, falling back to clinical rule engine:',
        genAiError?.message || genAiError
      );
      const fallbackResult = getClinicalRuleEngineResponse(lower, language, userContext, Boolean(isVoice));
      return res.json(
        await attachVoiceAudioIfRequested({
          ...fallbackResult,
          crisisDetected: false,
          source: 'clinical-rule-engine-fallback',
        })
      );
    }
  } catch (err: any) {
    console.error('Patient chat fatal error:', err);
    return res.json({
      reply:
        'Take a gentle breath. I am right here with you. Take 3 slow, deep abdominal breaths to steady your nervous system.',
      suggestedAction: { type: 'breathing', label: '2-min Box Breathing' },
      source: 'fatal-fallback',
    });
  }
});

async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const distIndexPath = path.resolve(distPath, 'index.html');
  const hasDistBuild = fs.existsSync(distIndexPath);
  const preferProductionStatic =
    process.env.NODE_ENV === 'production' ||
    (process.env.npm_lifecycle_event === 'start' && hasDistBuild);

  const serveStaticDist = () => {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API route not found' });
      }
      return res.sendFile(distIndexPath);
    });
  };

  if (!preferProductionStatic) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          allowedHosts: true,
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      if (hasDistBuild) {
        console.warn('Vite unavailable, falling back to static dist build:', viteErr);
        serveStaticDist();
      } else {
        throw viteErr;
      }
    }
  } else {
    serveStaticDist();
  }

  const server = app.listen(port, host, () => {
    console.log(`EMOTION AI Server running at http://${host}:${port}`);
  });

  server.on('error', (err: any) => {
    console.error('Server listen error:', err);
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
