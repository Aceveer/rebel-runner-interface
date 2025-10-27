import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db, auth } from './firebase'

/** Ensure a user doc exists and return its data */
export async function ensureUserProfile() {
  const user = auth.currentUser
  if (!user) throw new Error('No user signed in')

  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    const newUser = {
      displayName: user.displayName || '',
      email: user.email || '',
      roles: ['seller', 'runner'],    // default both roles
      activeRole: 'seller',           // default starting role
      storeId: 'REBEL-ADELAIDE',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    }
    await setDoc(ref, newUser)
    return newUser
  } else {
    await updateDoc(ref, { lastLogin: serverTimestamp() })
    return snap.data()
  }
}

/** Switch the user's active role */
export async function switchActiveRole(role: 'runner' | 'seller') {
  const user = auth.currentUser
  if (!user) throw new Error('No user signed in')

  const ref = doc(db, 'users', user.uid)
  await updateDoc(ref, { activeRole: role })
}
