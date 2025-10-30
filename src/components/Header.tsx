'use client'

import { useEffect, useState } from 'react'
import { auth } from '@/app/lib/firebase'
import { useRouter } from 'next/navigation'

export default function Header() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [time, setTime] = useState('')

  // 🔹 Listen for auth changes
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => setUser(u))
    return () => unsub()
  }, [])

  // 🔹 Live clock
  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [])

  // 🔹 Logout handler
  const handleLogout = async () => {
    await auth.signOut()
    localStorage.clear()
    router.replace('/login')
  }

  return (
    <header className="flex justify-between items-center mb-6 border-b pb-3 w-full">
      {/* Left Section */}
      <div className="flex flex-col text-left">
        <h1 className="text-base sm:text-lg md:text-3xl font-bold text-yellow-400">
          Footwear Queue
        </h1>
      </div>

      {/* Center Section */}
      <div className="flex-1 flex justify-center items-center mx-2">
        {user && (
          <p className="text-sm md:text-base font-medium text-zinc-700 dark:text-zinc-300">
            <span className='font-bold'>User:</span>{' '}
            <span className="text-yellow-500 font-semibold">
              {user.displayName
                ? user.displayName.split(' ')[0]
                : user.email.split('@')[0]}
            </span>
          </p>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Clock */}
        <span className="hidden md:block text-base">{time}</span>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="bg-zinc-800 text-yellow-400 px-4 py-2 rounded-xl font-medium hover:bg-yellow-400 hover:text-zinc-800 transition text-sm md:text-base"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
