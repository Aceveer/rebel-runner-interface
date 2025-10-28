'use client'
import AuthGuard from '@/components/AuthGuard'
import HomePage from './HomePage'

export default function ProtectedHome() {
  return (
    <AuthGuard>
      <HomePage />
    </AuthGuard>
  )
}
