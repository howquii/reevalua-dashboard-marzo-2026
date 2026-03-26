'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layers, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email for a confirmation link')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.push('/search')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-notion-sidebar">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-notion-text rounded-lg flex items-center justify-center">
            <Layers size={16} className="text-white" />
          </div>
          <span className="font-semibold text-notion-text text-lg">Ad Swipe</span>
        </div>

        {/* Card */}
        <div className="bg-white border border-notion-border rounded-xl p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-notion-text mb-1">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h1>
          <p className="text-sm text-notion-muted mb-6">
            {mode === 'login'
              ? 'Welcome back to Ad Swipe'
              : 'Start discovering winning ads'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-notion-muted mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full border border-notion-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-notion-muted mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full border border-notion-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}
            {message && (
              <p className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">{message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-notion-text text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-xs text-notion-muted mt-6">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(null) }}
              className="text-notion-text font-medium hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
