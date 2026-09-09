'use client';

import { useId, useState, useCallback } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type AuthMode = 'login' | 'signup';
type AuthMethod = 'password' | 'otp';
type SignupStep = 'details' | 'verify';

interface FullAuthFormProps {
  onPasswordSubmit: (email: string, password: string) => Promise<void>;
  onOtpRequest: (email: string) => Promise<void>;
  onOtpVerify: (email: string, code: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  otpCode: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  otpCode?: string;
  name?: string;
  general?: string;
}

const inputBase =
  'min-h-11 w-full rounded-lg border bg-background px-3 py-2.5 text-base text-foreground shadow-xs outline-none transition-[color,box-shadow,border-color] duration-150 ease-[var(--ease-out)] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60 md:text-sm';

const errorText = 'mt-1.5 text-xs font-medium text-destructive';

export function FullAuthForm({
  onPasswordSubmit,
  onOtpRequest,
  onOtpVerify,
  isLoading = false,
  className,
}: FullAuthFormProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [method, setMethod] = useState<AuthMethod>('password');
  const [signupStep, setSignupStep] = useState<SignupStep>('details');
  const [showPassword, setShowPassword] = useState(false);
  const formId = useId();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otpCode: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [otpSent, setOtpSent] = useState(false);

  const fieldId = (field: keyof FormData) => `${formId}-${field}`;
  const errorId = (field: keyof FormData) => `${fieldId(field)}-error`;

  const validateField = useCallback((field: keyof FormData, value: string): string => {
    switch (field) {
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email address';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'At least 8 characters';
        if (mode === 'signup' && method === 'password') {
          const hasUpper = /[A-Z]/.test(value);
          const hasLower = /[a-z]/.test(value);
          const hasNumber = /\d/.test(value);
          const strength = [hasUpper, hasLower, hasNumber].filter(Boolean).length;
          if (strength < 2) return 'Use uppercase, lowercase, and numbers';
        }
        return '';
      case 'confirmPassword':
        if (mode === 'signup' && method === 'password' && value !== formData.password) {
          return 'Passwords do not match';
        }
        return '';
      case 'name':
        if (mode === 'signup' && !value.trim()) return 'Name is required';
        return '';
      case 'otpCode':
        if (value.length !== 6) return 'Enter the 6-digit code';
        return '';
      default:
        return '';
    }
  }, [mode, method, formData.password]);

  const handleBlur = (field: keyof FormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const validateForm = (): boolean => {
    const fieldsToCheck: (keyof FormData)[] = ['email'];
    if (method === 'password') fieldsToCheck.push('password');
    if (method === 'password' && mode === 'signup') {
      fieldsToCheck.push('confirmPassword');
      if (signupStep === 'details') fieldsToCheck.push('name');
    }
    if (method === 'otp' && signupStep === 'verify') {
      fieldsToCheck.push('otpCode');
    }

    const newErrors: FormErrors = {};
    let hasError = false;
    fieldsToCheck.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        hasError = true;
      }
    });

    setErrors(newErrors);
    setTouched(fieldsToCheck.reduce((acc, f) => ({ ...acc, [f]: true }), {}));
    return !hasError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (method === 'password') {
        if (mode === 'login') {
          await onPasswordSubmit(formData.email, formData.password);
        } else {
          if (signupStep === 'details') {
            await onOtpRequest(formData.email);
            setSignupStep('verify');
          } else {
            await onOtpVerify(formData.email, formData.otpCode);
            await onPasswordSubmit(formData.email, formData.password);
          }
        }
      } else {
        if (mode === 'login') {
          if (!otpSent) {
            await onOtpRequest(formData.email);
            setOtpSent(true);
          } else {
            await onOtpVerify(formData.email, formData.otpCode);
          }
        } else {
          if (signupStep === 'details') {
            await onOtpRequest(formData.email);
            setSignupStep('verify');
          } else {
            await onOtpVerify(formData.email, formData.otpCode);
          }
        }
      }
    } catch (err) {
      setErrors({
        general: err instanceof Error ? err.message : 'Something went wrong'
      });
    }
  };

  const handleMethodChange = (newMethod: AuthMethod) => {
    setMethod(newMethod);
    setOtpSent(false);
    setSignupStep('details');
    setErrors({});
    setTouched({});
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    // Accounts are always created with a password + email verification,
    // so switch back to the password method when signing up.
    if (newMode === 'signup') setMethod('password');
    setOtpSent(false);
    setSignupStep('details');
    setErrors({});
    setTouched({});
    setFormData({ name: '', email: '', password: '', confirmPassword: '', otpCode: '' });
  };

  const goBack = () => {
    if (signupStep === 'verify') {
      setSignupStep('details');
      setFormData(prev => ({ ...prev, otpCode: '' }));
      setErrors({});
    }
  };

  const renderError = (field: keyof FormData) => (
    errors[field] ? (
      <p id={errorId(field)} className={errorText} role="alert">
        {errors[field]}
      </p>
    ) : null
  );

  const renderPasswordToggle = () => (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-[color,background-color,transform] duration-150 ease-[var(--ease-out)] hover:bg-muted hover:text-foreground active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      aria-pressed={showPassword}
    >
      {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
    </button>
  );

  const renderFieldIcon = (Icon: typeof Mail) => (
    <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
  );

  const hasVerificationView = (method === 'otp' && otpSent) || (method === 'password' && mode === 'signup' && signupStep === 'verify');

  if (hasVerificationView) {
    const otpInputId = fieldId('otpCode');
    const passwordInputId = fieldId('password');
    const verifyTitleId = `${formId}-verify-title`;
    const verifyDescriptionId = `${formId}-verify-description`;

    return (
      <form
        id={`${formId}-verify-form`}
        onSubmit={handleSubmit}
        className={cn('space-y-5 animate-in', className)}
        aria-labelledby={verifyTitleId}
      >
        <button
          type="button"
          onClick={goBack}
          className="pressable inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-[color,transform] duration-150 ease-[var(--ease-out)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </button>

        <div className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-accent text-primary">
            <Mail className="size-5" aria-hidden="true" />
          </div>
          <h2 id={verifyTitleId} className="text-xl font-semibold tracking-tight">
            {mode === 'signup' ? 'Verify your email' : 'Enter your code'}
          </h2>
          <p id={verifyDescriptionId} className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
            We sent a 6-digit code to <span className="font-medium text-foreground">{formData.email}</span>
          </p>
        </div>

        {errors.general && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-destructive" role="alert">
            {errors.general}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor={otpInputId} className="text-sm font-medium">Verification code</label>
          <input
            id={otpInputId}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            value={formData.otpCode}
            onChange={(e) => handleChange('otpCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
            onBlur={() => handleBlur('otpCode')}
            disabled={isLoading}
            className={cn(
              inputBase,
              'text-center font-mono text-2xl tracking-[0.3em]',
              errors.otpCode && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30'
            )}
            aria-invalid={Boolean(errors.otpCode)}
            aria-describedby={errors.otpCode ? errorId('otpCode') : verifyDescriptionId}
            maxLength={6}
            autoFocus
          />
          {renderError('otpCode')}
        </div>

        {method === 'password' && mode === 'signup' && (
          <div className="space-y-2">
            <label htmlFor={passwordInputId} className="text-sm font-medium">Create password</label>
            <div className="relative">
              {renderFieldIcon(Lock)}
              <input
                id={passwordInputId}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                disabled={isLoading}
                className={cn(
                  inputBase,
                  'pl-10 pr-11',
                  errors.password && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30'
                )}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? errorId('password') : undefined}
              />
              {renderPasswordToggle()}
            </div>
            {renderError('password')}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          aria-busy={isLoading}
          className="pressable inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-[background-color,box-shadow,transform,opacity] duration-150 ease-[var(--ease-out)] hover:bg-primary/90 hover:shadow-md active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {isLoading ? (
            <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Verifying…</>
          ) : (
            <>{mode === 'signup' ? 'Create account' : 'Sign in'} <ArrowRight className="size-4" aria-hidden="true" /></>
          )}
        </button>
      </form>
    );
  }

  const nameInputId = fieldId('name');
  const emailInputId = fieldId('email');
  const passwordInputId = fieldId('password');
  const confirmPasswordInputId = fieldId('confirmPassword');
  const formTitleId = `${formId}-title`;

  return (
    <form id={`${formId}-form`} onSubmit={handleSubmit} className={cn('space-y-5', className)} aria-labelledby={formTitleId}>
      <h2 id={formTitleId} className="sr-only">{mode === 'login' ? 'Sign in' : 'Create your account'}</h2>

      <div className="space-y-2">
        <span className="text-sm font-medium">Sign in method</span>
        <div className="flex rounded-lg border border-border bg-muted/60 p-1" role="group" aria-label="Sign in method">
          <button
            type="button"
            onClick={() => handleMethodChange('password')}
            aria-pressed={method === 'password'}
            className={cn(
              'pressable min-h-9 flex-1 rounded-md px-3 py-2 text-sm font-medium transition-[background-color,color,box-shadow,transform] duration-150 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              method === 'password' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => handleMethodChange('otp')}
            disabled={mode === 'signup'}
            aria-pressed={method === 'otp'}
            title={mode === 'signup' ? 'Create an account with a password instead' : undefined}
            className={cn(
              'pressable min-h-9 flex-1 rounded-md px-3 py-2 text-sm font-medium transition-[background-color,color,box-shadow,transform] duration-150 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed',
              mode === 'signup' && 'opacity-40',
              method === 'otp' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            One-time code
          </button>
        </div>
        {mode === 'signup' && (
          <p className="text-xs leading-5 text-muted-foreground">
            Accounts are created with an email + password and a quick email verification.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Account</span>
        <div className="flex rounded-lg border border-border bg-muted/60 p-1" role="group" aria-label="Account action">
          <button
            type="button"
            onClick={() => handleModeChange('login')}
            aria-pressed={mode === 'login'}
            className={cn(
              'pressable min-h-9 flex-1 rounded-md px-3 py-2 text-sm font-medium transition-[background-color,color,box-shadow,transform] duration-150 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              mode === 'login' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('signup')}
            aria-pressed={mode === 'signup'}
            className={cn(
              'pressable min-h-9 flex-1 rounded-md px-3 py-2 text-sm font-medium transition-[background-color,color,box-shadow,transform] duration-150 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              mode === 'signup' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Sign up
          </button>
        </div>
      </div>

      {errors.general && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-destructive" role="alert">
          {errors.general}
        </div>
      )}

      {mode === 'signup' && (
        <div className="space-y-2">
          <label htmlFor={nameInputId} className="text-sm font-medium">Full name</label>
          <div className="relative">
            {renderFieldIcon(User)}
            <input
              id={nameInputId}
              type="text"
              autoComplete="name"
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              disabled={isLoading}
              className={cn(
                inputBase,
                'pl-10',
                errors.name && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30'
              )}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? errorId('name') : undefined}
            />
          </div>
          {renderError('name')}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor={emailInputId} className="text-sm font-medium">Email address</label>
        <div className="relative">
          {renderFieldIcon(Mail)}
          <input
            id={emailInputId}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            disabled={isLoading}
            className={cn(
              inputBase,
              'pl-10',
              errors.email && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30'
            )}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? errorId('email') : undefined}
            autoFocus
          />
        </div>
        {renderError('email')}
      </div>

      {method === 'password' && (
        <>
          <div className="space-y-2">
            <label htmlFor={passwordInputId} className="text-sm font-medium">Password</label>
            <div className="relative">
              {renderFieldIcon(Lock)}
              <input
                id={passwordInputId}
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder={mode === 'login' ? 'Your password' : 'At least 8 characters'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                disabled={isLoading}
                className={cn(
                  inputBase,
                  'pl-10 pr-11',
                  errors.password && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30'
                )}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? errorId('password') : undefined}
              />
              {renderPasswordToggle()}
            </div>
            {renderError('password')}
          </div>

          {mode === 'signup' && (
            <div className="space-y-2">
              <label htmlFor={confirmPasswordInputId} className="text-sm font-medium">Confirm password</label>
              <div className="relative">
                {renderFieldIcon(Lock)}
                <input
                  id={confirmPasswordInputId}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  disabled={isLoading}
                  className={cn(
                    inputBase,
                    'pl-10',
                    errors.confirmPassword && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30'
                  )}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={errors.confirmPassword ? errorId('confirmPassword') : undefined}
                />
              </div>
              {renderError('confirmPassword')}
            </div>
          )}

          {mode === 'login' && (
            <div className="text-right">
              <button type="button" className="rounded-md text-xs font-medium text-primary underline-offset-4 transition-[color,transform] duration-150 ease-[var(--ease-out)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Forgot password?
              </button>
            </div>
          )}
        </>
      )}

      <button
        type="submit"
        disabled={isLoading}
        aria-busy={isLoading}
        className="pressable inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-[background-color,box-shadow,transform,opacity] duration-150 ease-[var(--ease-out)] hover:bg-primary/90 hover:shadow-md active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {isLoading ? (
          <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Working…</>
        ) : (
          <>{mode === 'login' ? 'Sign in' : 'Continue'} <ArrowRight className="size-4" aria-hidden="true" /></>
        )}
      </button>

      <p className="text-center text-xs leading-5 text-muted-foreground">
        By continuing, you agree to our{' '}
        <a href="#" className="font-medium text-primary underline-offset-4 transition-[color] duration-150 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Terms</a>{' '}
        and{' '}
        <a href="#" className="font-medium text-primary underline-offset-4 transition-[color] duration-150 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Privacy</a>
      </p>
    </form>
  );
}
