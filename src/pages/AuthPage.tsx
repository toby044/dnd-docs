import { useState, useCallback, type FormEvent } from 'react'
import { useAuth } from '@/hooks/useAuth'

export function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    const { error: authError } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password)

    if (authError) {
      setError(authError.message)
    } else if (isSignUp) {
      setMessage('Check your email to confirm your account.')
    }
    setLoading(false)
  }, [email, password, isSignUp, signIn, signUp])

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600/20 rounded-2xl mb-4">
            <span className="i-lucide-book-open text-3xl text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-stone-100">D&D Docs</h1>
          <p className="text-stone-500 mt-1 text-sm">Your campaign documentation hub</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-stone-800/50 border border-stone-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-stone-200 mb-4">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-900/30 border border-green-800 rounded-lg text-green-300 text-sm">
              {message}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-stone-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="adventurer@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-stone-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                placeholder="Min 6 characters"
                minLength={6}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-6"
          >
            {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>

          <p className="text-center text-sm text-stone-500 mt-4">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null) }}
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
