'use client'

import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/app/lib/firebase'
import { ensureUserProfile } from '@/app/lib/userProfile'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // For simplicity we treat “username” as an email address
      const userCred = await signInWithEmailAndPassword(auth, email, password)
      await ensureUserProfile()               // 🔥 ensure Firestore doc exists
      router.push('/home') // go to main screen after login
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center flex-col mx-4">    
    
    <h1 className="text-3xl md:text-5xl font-semibold text-center justify-center max-w-7xl py-16">Rebel Rundle Mall Footwear Running Interface</h1>
      <form
        onSubmit={handleLogin}
        className="shadow-md rounded-2xl p-8 w-full max-w-lg space-y-5 border border-[#ffdd00]"
      >
        <h1 className="text-3xl md:text-5xl font-semibold text-center">Staff Login</h1>

        <div className="space-y-2">
          <label className="block text-base md:text-xl font-medium">Username</label>
          <input
            type="text"
            placeholder="you@rebelsport.com"
            className="border p-3 rounded-xl w-full"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-base md:text-xl font-medium">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            className="border p-3 rounded-xl w-full"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="text-lg md:text-xl w-full bg-black text-white py-3 rounded-xl hover:opacity-90 cursor-pointer hover:bg-[#ffdd00] hover:text-black border border-[#ffdd00]  hover:border-black"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </main>
  )
}
