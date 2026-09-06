'use client';

import { useState, useCallback } from 'react';
import { Mail, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailOtpFormProps {
  /** Callback when email is submitted - triggers the OTP send */
  onSubmit: (email: string) => Promise<void>;
  /** Initial email value (e.g., from localStorage) */
  initialEmail?: string;
  /** Additional CSS classes */
  className?: string;
  /** Text for the submit button */
  submitText?: string;
  /** Whether we're in a loading state */
  isLoading?: boolean;
}

export function EmailOtpForm({
  onSubmit,
  initialEmail = '',
  className,
  submitText = 'Send code',
  isLoading = false,
}: EmailOtpFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validateEmail = useCallback((value: string): string => {
    if (!value.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
    return '';
  }, []);

  const handleBlur = () => {
    setTouched(true);
    const err = validateEmail(email);
    setError(err);
  };

  const handleChange = (value: string) => {
    setEmail(value);
    if (touched) {
      const err = validateEmail(value);
      setError(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) {
      setError(err);
      setTouched(true);
      return;
    }
    setError('');
    setSubmitted(true);
    try {
      await onSubmit(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code. Try again.');
      setSubmitted(false);
    }
  };

  // If already submitted, show success state
  if (submitted) {
    return (
      <div className={cn('text-center py-8 animate-in fade-in-50', className)}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#d8f36a] mb-4">
          <svg className="w-8 h-8 text-[#17201d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">Check your inbox</h3>
        <p className="text-muted-foreground text-sm mb-6">
          We&apos;ve sent a 6-digit code to <span className="font-medium">{email}</span>
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="text-[#ef5f47] font-medium hover:underline text-sm"
        >
          Change email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <div className="text-center mb-6">
        <Mail className="h-12 w-12 text-[#ef5f47] mx-auto mb-3" />
        <h3 className="text-xl font-bold mb-2">Sign in with email</h3>
        <p className="text-muted-foreground text-sm">
          Enter your email and we&apos;ll send you a 6-digit code.
        </p>
      </div>

      <div className="relative">
        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          disabled={isLoading}
          className={cn(
            'w-full pl-10 pr-4 py-3 bg-[#f7f8f5] border rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#d8f36a] transition-all',
            error ? 'border-destructive' : 'border-[#17201d]/10'
          )}
          aria-label="Email Address"
          aria-describedby={error ? 'email-error' : undefined}
          autoComplete="email"
          autoFocus
        />
        {error && (
          <p id="email-error" className="text-destructive text-xs mt-1.5 flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </p>
        )}
      </div>

      {isLoading && !submitted && (
        <div className="text-center text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
          Sending code…
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !email.trim() || submitted}
        className={cn(
          'w-full relative flex items-center justify-center gap-2 bg-[#17201d] text-white font-medium py-3 px-6 rounded-xl transition-all',
          'hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(23,32,29,0.2)] focus:outline-none focus:ring-2 focus:ring-[#d8f36a]',
          'disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none'
        )}
      >
        <span className="flex items-center justify-center gap-2">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              {submitText}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </span>
      </button>

      <p className="text-center text-xs text-muted-foreground">
        By continuing, you agree to our{' '}
        <a href="#" className="text-[#ef5f47] hover:underline">Terms of Service</a>{' '}
        and{' '}
        <a href="#" className="text-[#ef5f47] hover:underline">Privacy Policy</a>
      </p>
    </form>
  );
}