'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/app/lib/firebase'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        router.replace('/login')  // redirect unauthenticated users
      }
      setChecking(false)
    })
    return () => unsubscribe()
  }, [router])

  if (checking)
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Loading...
      </div>
    )

  return <>{children}</>
}
