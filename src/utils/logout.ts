import { signOut } from 'firebase/auth'
import { auth } from '@/app/lib/firebase'

export async function handleLogout() {
  try {
    await signOut(auth)
    // remove cached items if any
    localStorage.removeItem('rebel-role')
    localStorage.removeItem('activeRole')
    localStorage.removeItem('rebel-user')
    console.log('User logged out successfully')
  } catch (error) {
    console.error('Error logging out:', error)
  }
}
