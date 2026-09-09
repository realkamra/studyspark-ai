'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { LogIn, Lock, Mail, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useConvexAuth } from 'convex/react'
import { useNavigate } from 'react-router'

export function SignIn2({ redirectAfterAuth = '/dashboard' }: { redirectAfterAuth?: string }) {
  const { signIn } = useAuth()
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Redirect once Convex confirms the session is authenticated.
  // We use isAuthLoading (not useAuth's isLoading which includes the
  // user query — that query throws when unauthenticated, making
  // isLoading permanently true on the sign-in page).
  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      navigate(redirectAfterAuth, { replace: true })
    }
  }, [isAuthenticated, isAuthLoading, navigate, redirectAfterAuth])

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSignIn = async () => {
    setError('')
    if (!email) {
      setError('Please enter your email.')
      return
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.')
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'login') {
        // Login flow: email + password with optional OTP verification
        if (!password) {
          setError('Please enter your password.')
          setSubmitting(false)
          return
        }

        if (!otpSent) {
          // Step 1: Send verification code (like signup)
          try {
            await signIn('email-otp', { email, flow: 'signIn' })
            setOtpSent(true)
          } catch (err: any) {
            console.error('Sign in OTP error:', err)
            setError(err?.message ?? 'Invalid email or password. Please try again.')
          }
        } else {
          // Step 2: Verify code and sign in
          if (otpCode.length !== 6) {
            setError('Enter the 6-digit code.')
            setSubmitting(false)
            return
          }
          try {
            await signIn('email-otp', { email, code: otpCode, flow: 'email-verification' })
          } catch (err: any) {
            console.error('Sign in verify error:', err)
            setError(err?.message ?? 'Invalid verification code. Please try again.')
            setSubmitting(false)
            return
          }

          try {
            await signIn('password', { email, password, flow: 'signIn' })
          } catch (err: any) {
            console.error('Sign in password error:', err)
            setError(err?.message ?? 'Something went wrong. Please try again.')
          }
        }
      } else {
        // Signup flow
        if (!password) {
          setError('Please enter a password.')
          setSubmitting(false)
          return
        }

        if (!otpSent) {
          // Step 1: Send verification code
          try {
            await signIn('email-otp', { email, flow: 'signUp' })
            setOtpSent(true)
          } catch {
            setError('Something went wrong. Please try again.')
          }
        } else {
          // Step 2: Verify code and create account
          if (otpCode.length !== 6) {
            setError('Enter the 6-digit code.')
            setSubmitting(false)
            return
          }
          try {
            await signIn('email-otp', { email, code: otpCode, flow: 'email-verification' })
          } catch {
            setError('Invalid verification code. Please try again.')
            setSubmitting(false)
            return
          }

          try {
            await signIn('password', { email, password, flow: 'signUp' })
          } catch {
            setError('Something went wrong. Please try again.')
          }
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleModeChange = (newMode: 'login' | 'signup') => {
    setMode(newMode)
    setOtpSent(false)
    setOtpCode('')
    setError('')
  }

  const isSignup = mode === 'signup'

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-sm bg-gradient-to-b from-sky-50/50 to-white rounded-3xl shadow-xl p-8 flex flex-col items-center border border-blue-100 text-black">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white mb-5 shadow-md">
          <LogIn className="w-7 h-7 text-black" />
        </div>
        <h2 className="text-2xl font-semibold mb-1.5 text-center">
          {mode === 'login' ? 'Sign in with email' : 'Create your account'}
        </h2>
        <p className="text-gray-500 text-sm mb-6 text-center leading-5">
          {mode === 'login'
            ? 'Make a new doc to bring your words, data, and teams together. For free'
            : 'Create an account to bring your words, data, and teams together.'}
        </p>

        {/* Account toggle — primary switch, top of card */}
        <div className="w-full flex rounded-xl bg-gray-100 p-1 mb-3">
          <button
            type="button"
            onClick={() => handleModeChange('login')}
            aria-pressed={mode === 'login'}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              mode === 'login' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('signup')}
            aria-pressed={mode === 'signup'}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              mode === 'signup' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign up
          </button>
        </div>

        {!otpSent ? (
          <>
            <div className="w-full flex flex-col gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black text-sm"
                />
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  placeholder={isSignup ? 'Create a password (8+ characters)' : 'Password'}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black text-sm"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              {!isSignup && (
                <div className="flex justify-end -mt-1">
                  <button type="button" className="text-xs font-medium text-gray-500 hover:text-black hover:underline">
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleSignIn}
              disabled={submitting}
              className="w-full mt-5 bg-gradient-to-b from-gray-700 to-gray-900 text-white font-medium py-2.5 rounded-xl shadow hover:brightness-105 active:scale-[0.98] transition disabled:opacity-60"
            >
              {submitting ? 'Working…' : isSignup ? 'Continue' : 'Get Started'}
            </button>

            <div className="flex items-center w-full my-4">
              <div className="flex-grow border-t border-dashed border-gray-200" />
              <span className="mx-2 text-xs text-gray-400">Or sign in with</span>
              <div className="flex-grow border-t border-dashed border-gray-200" />
            </div>

            <div className="flex gap-3 w-full justify-center">
              <button type="button" className="flex items-center justify-center w-12 h-12 rounded-xl border bg-white hover:bg-gray-100 transition grow">
                <img src="https://cdn.21st.dev/assets/mirror/38/38146bfd9eff6dbf0d74771f2e625c70d87d3770e0d080dbb6e50db1d5403f46.svg" alt="Google" className="w-6 h-6" />
              </button>
              <button type="button" className="flex items-center justify-center w-12 h-12 rounded-xl border bg-white hover:bg-gray-100 transition grow">
                <img src="https://cdn.21st.dev/assets/mirror/49/49c99a2bb048f4c4941540ccf601621071669cdd1f51e52312a412f23bb2d5fa.svg" alt="Facebook" className="w-6 h-6" />
              </button>
              <button type="button" className="flex items-center justify-center w-12 h-12 rounded-xl border bg-white hover:bg-gray-100 transition grow">
                <img src="https://cdn.21st.dev/assets/mirror/c2/c221b3f2143cf5d8d85a3b68da84dbae21b18db4164e63ca8c07c6ffdbb922c4.svg" alt="Apple" className="w-6 h-6" />
              </button>
            </div>
          </>
        ) : (
          <div className="w-full flex flex-col gap-4">
            <button
              type="button"
              onClick={() => {
                setOtpSent(false)
                setOtpCode('')
                setError('')
              }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-black self-start"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="text-center">
              <p className="text-sm font-medium text-black">Verify your email</p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                We sent a 6-digit code to <span className="font-medium text-black">{email}</span>
              </p>
            </div>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black text-center font-mono text-2xl tracking-[0.3em]"
              autoFocus
            />

            <button
              onClick={handleSignIn}
              disabled={submitting || otpCode.length !== 6}
              className="w-full bg-gradient-to-b from-gray-700 to-gray-900 text-white font-medium py-2.5 rounded-xl shadow hover:brightness-105 active:scale-[0.98] transition disabled:opacity-60"
            >
              {submitting ? 'Verifying…' : 'Verify code'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}