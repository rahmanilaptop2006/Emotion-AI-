import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  getRedirectResult,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type {
  CheckInEntry,
  HabitLog,
  JournalEntry,
  Language,
  ThemeMode,
  UserAccount,
  WearableConnection,
} from '../types';

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();

export interface AuthErrorFeedback {
  message: string;
  needsEmailProviderEnable?: boolean;
  needsAuthorizedDomainHelp?: boolean;
}

export function mapAuthError(error: unknown, isHi: boolean): AuthErrorFeedback {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  switch (code) {
    case 'auth/operation-not-allowed':
      return {
        needsEmailProviderEnable: true,
        message: isHi
          ? 'Firebase कंसोल में Email/Password साइन-इन सक्षम नहीं है। नीचे दिए गए Google से साइन इन करें या Firebase Console में Email/Password चालू करें।'
          : 'Email/Password sign-in is not enabled in Firebase Console yet. Enable Email/Password in Firebase Console → Authentication → Sign-in method, or sign in instantly with Google below.',
      };
    case 'auth/email-already-in-use':
      return {
        message: isHi
          ? 'यह ईमेल पहले से पंजीकृत है। कृपया साइन इन करें।'
          : 'An account with this email already exists. Switch to Sign In to continue.',
      };
    case 'auth/invalid-email':
      return {
        message: isHi ? 'कृपया एक मान्य ईमेल पता दर्ज करें।' : 'Please enter a valid email address.',
      };
    case 'auth/weak-password':
      return {
        message: isHi
          ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'
          : 'Password must be at least 6 characters long.',
      };
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return {
        message: isHi
          ? 'ईमेल या पासवर्ड गलत है। कृपया पुनः जांचें।'
          : 'Incorrect email or password. Please verify your credentials.',
      };
    case 'auth/too-many-requests':
      return {
        message: isHi
          ? 'बहुत अधिक प्रयास। कृपया कुछ क्षण प्रतीक्षा करें।'
          : 'Too many attempts. Please wait a moment and try again.',
      };
    case 'auth/popup-closed-by-user':
      return {
        message: isHi
          ? 'Google साइन-इन पॉपअप बंद हो गया। कृपया पुनः प्रयास करें।'
          : 'Google sign-in popup was closed before completing authentication.',
      };
    case 'auth/popup-blocked':
      return {
        message: isHi
          ? 'ब्राउज़र ने पॉपअप ब्लॉक कर दिया। कृपया पॉपअप अनुमति दें।'
          : 'Browser blocked the sign-in popup. Allow popups for this site and try again.',
      };
    case 'auth/unauthorized-domain': {
      const host = typeof window !== 'undefined' ? window.location.hostname : '';
      return {
        needsAuthorizedDomainHelp: true,
        message: isHi
          ? `यह डोमेन (${host}) अभी Firebase Authorized Domains में जुड़ा नहीं है। Google साइन-इन चालू करने के लिए नीचे से डोमेन कॉपी करके Firebase Auth Settings → Authorized domains में जोड़ें।`
          : `This domain (${host}) is not listed in Firebase Authorized Domains yet. Copy the domain below and add it under Firebase Auth Settings → Authorized domains to enable Google Sign-In here.`,
      };
    }
    default:
      return {
        message:
          error instanceof Error && error.message
            ? error.message
            : isHi
              ? 'प्रमाणीकरण विफल रहा। कृपया पुनः प्रयास करें।'
              : 'Authentication failed. Please try again.',
      };
  }
}

export async function signInWithGooglePopup(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: unknown }).code)
        : '';
    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/operation-not-supported-in-this-environment'
    ) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw error;
  }
}

export async function completeGoogleRedirectSignIn(): Promise<User | null> {
  const result = await getRedirectResult(auth);
  return result?.user ?? null;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
}

export async function registerWithEmail(params: {
  email: string;
  password: string;
  fullName: string;
}): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, params.email.trim(), params.password);
  if (params.fullName.trim()) {
    await updateProfile(result.user, { displayName: params.fullName.trim() });
  }
  // Best-effort verification email
  sendEmailVerification(result.user).catch(() => {});
  return result.user;
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function resendVerification(user: User): Promise<void> {
  await sendEmailVerification(user);
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export async function syncVerifiedUserProfileToCloud(params: {
  user: User;
  account: UserAccount;
  language: Language;
  theme: ThemeMode;
}): Promise<void> {
  const { user, account, language, theme } = params;
  if (!user.emailVerified) return;

  const userPath = `users/${user.uid}`;
  const piiPath = `users/${user.uid}/private/pii`;
  const userRef = doc(db, 'users', user.uid);
  const piiRef = doc(db, 'users', user.uid, 'private', 'pii');

  let existingSnap;
  try {
    existingSnap = await getDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  const safeName = (account.name || user.displayName || 'EMOTION AI Member').slice(0, 120);
  const safeRole = (account.role || 'B Pharm Student and Innovator').slice(0, 120);
  const safeInstitution = (account.institution || 'EMOTION AI Secure Workspace').slice(0, 160);
  const safeInitials = (account.avatarInitials || 'EA').slice(0, 4);

  try {
    if (!existingSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        name: safeName,
        role: safeRole,
        institution: safeInstitution,
        avatarInitials: safeInitials,
        wellnessScore: Math.max(0, Math.min(100, Math.round(account.wellnessScore))),
        baselineScore: Math.max(0, Math.min(100, Math.round(account.baselineScore))),
        streakDays: Math.max(0, Math.min(3650, Math.round(account.streakDays))),
        language,
        theme,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(userRef, {
        name: safeName,
        role: safeRole,
        institution: safeInstitution,
        avatarInitials: safeInitials,
        wellnessScore: Math.max(0, Math.min(100, Math.round(account.wellnessScore))),
        baselineScore: Math.max(0, Math.min(100, Math.round(account.baselineScore))),
        streakDays: Math.max(0, Math.min(3650, Math.round(account.streakDays))),
        language,
        theme,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      existingSnap.exists() ? OperationType.UPDATE : OperationType.CREATE,
      userPath
    );
  }

  if (user.email) {
    try {
      const piiSnap = await getDoc(piiRef);
      if (!piiSnap.exists()) {
        await setDoc(piiRef, {
          uid: user.uid,
          email: user.email.slice(0, 254),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, piiPath);
    }
  }
}

export async function syncCheckInToCloud(user: User, entry: CheckInEntry): Promise<void> {
  if (!user.emailVerified) return;
  const safeId = entry.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `users/${user.uid}/checkIns/${safeId}`;
  try {
    await setDoc(doc(db, 'users', user.uid, 'checkIns', safeId), {
      uid: user.uid,
      date: entry.date.slice(0, 40),
      wellnessScore: Math.max(0, Math.min(100, Math.round(entry.wellnessScore))),
      moodLabel: entry.moodLabel.slice(0, 80),
      stressLevel: entry.stressLevel,
      sleepHours: Math.max(0, Math.min(24, Number(entry.sleepHours))),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function syncJournalToCloud(user: User, entry: JournalEntry): Promise<void> {
  if (!user.emailVerified) return;
  const safeId = entry.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `users/${user.uid}/journalEntries/${safeId}`;
  try {
    await setDoc(doc(db, 'users', user.uid, 'journalEntries', safeId), {
      uid: user.uid,
      date: entry.date.slice(0, 60),
      mood: entry.mood.slice(0, 60),
      moodScore: Math.max(0, Math.min(100, Math.round(entry.moodScore))),
      text: entry.text.slice(0, 4000),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function syncHabitLogToCloud(user: User, log: HabitLog): Promise<void> {
  if (!user.emailVerified) return;
  const safeId = `${log.date}_${log.habitId}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `users/${user.uid}/habitLogs/${safeId}`;
  const ref = doc(db, 'users', user.uid, 'habitLogs', safeId);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        habitId: log.habitId.slice(0, 128),
        date: log.date.slice(0, 20),
        completed: log.completed,
        minutesLogged: Math.max(0, Math.min(600, Math.round(log.minutesLogged))),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        completed: log.completed,
        minutesLogged: Math.max(0, Math.min(600, Math.round(log.minutesLogged))),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncWearableToCloud(user: User, wearable: WearableConnection): Promise<void> {
  if (!user.emailVerified) return;
  const safeId = wearable.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `users/${user.uid}/wearables/${safeId}`;
  const ref = doc(db, 'users', user.uid, 'wearables', safeId);

  const metrics = wearable.trackedMetrics.slice(0, 5);
  const reading = wearable.latestReading;
  const payload: Record<string, unknown> = {
    uid: user.uid,
    deviceId: safeId,
    provider: wearable.provider,
    deviceName: (wearable.deviceName.trim() || 'Connected Wearable').slice(0, 80),
    connected: Boolean(wearable.connected),
    regularTrackingEnabled: Boolean(wearable.regularTrackingEnabled),
    syncCadence: wearable.syncCadence,
    trackedMetrics: metrics.length > 0 ? metrics : ['hr', 'sleep'],
    updatedAt: serverTimestamp(),
  };

  if (reading) {
    if (typeof reading.restingHrBpm === 'number') {
      payload.restingHrBpm = Math.max(25, Math.min(240, Math.round(reading.restingHrBpm)));
    }
    if (typeof reading.hrvMs === 'number') {
      payload.hrvMs = Math.max(1, Math.min(300, Math.round(reading.hrvMs)));
    }
    if (typeof reading.spo2Percent === 'number') {
      payload.spo2Percent = Math.max(60, Math.min(100, Math.round(reading.spo2Percent)));
    }
    if (typeof reading.sleepHours === 'number') {
      payload.sleepHours = Math.max(0, Math.min(24, Number(reading.sleepHours.toFixed(1))));
    }
    if (typeof reading.steps === 'number') {
      payload.steps = Math.max(0, Math.min(200000, Math.round(reading.steps)));
    }
    payload.sourceType = reading.sourceType;
  }

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, payload);
    } else {
      const updatePayload = { ...payload };
      delete updatePayload.uid;
      delete updatePayload.deviceId;
      delete updatePayload.provider;
      await updateDoc(ref, updatePayload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeWearableFromCloud(user: User, wearableId: string): Promise<void> {
  if (!user.emailVerified) return;
  const safeId = wearableId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `users/${user.uid}/wearables/${safeId}`;
  try {
    await deleteDoc(doc(db, 'users', user.uid, 'wearables', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export const firebaseProjectConsoleUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`;
export const firebaseAuthorizedDomainsConsoleUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;
