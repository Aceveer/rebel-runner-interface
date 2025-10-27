import { initializeApp, getApps } from 'firebase/app'
import {
  getAuth, setPersistence, browserLocalPersistence,
  isSignInWithEmailLink, sendSignInLinkToEmail, signInWithEmailLink,
  signInAnonymously, updateProfile, signOut
} from 'firebase/auth'
import {
  getFirestore, initializeFirestore, persistentLocalCache
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

// Firestore with offline persistence
initializeFirestore(app, { localCache: persistentLocalCache() })
export const db = getFirestore(app)

// Auth helpers
export const auth = getAuth(app)
setPersistence(auth, browserLocalPersistence)

export function isEmailLink(url?: string) {
  return isSignInWithEmailLink(auth, url ?? (typeof window !== 'undefined' ? window.location.href : ''))
}

export async function startEmailLinkSignIn(email: string) {
  const actionCodeSettings = {
    url: (typeof window !== 'undefined' ? window.location.origin : '') + (process.env.NEXT_PUBLIC_EMAIL_LINK_REDIRECT || '/login'),
    handleCodeInApp: true
  }
  localStorage.setItem('runner-last-email', email)
  await sendSignInLinkToEmail(auth, email, actionCodeSettings)
}

export async function completeEmailLinkSignIn() {
  const email = localStorage.getItem('runner-last-email')
  if (!email) throw new Error('No email stored; open the link on the same device or ask for email again.')
  const cred = await signInWithEmailLink(auth, email, window.location.href)
  localStorage.removeItem('runner-last-email')
  return cred
}

export async function signInKiosk(displayName: string) {
  const { user } = await signInAnonymously(auth)
  if (displayName) await updateProfile(user, { displayName })
  return user
}

export async function logout() { await signOut(auth) }
