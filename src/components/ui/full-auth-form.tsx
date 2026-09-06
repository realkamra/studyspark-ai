'use client';

import { useState, useCallback } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ============================================================
   DESIGN TOKENS — matching src/index.css
   ============================================================ */
const TRANSITION = '150ms cubic-bezier(0.23, 1, 0.32, 1)';
const PRESS_SCALE = 0.97;

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
  const [verifiedEmail, setVerifiedEmail] = useState('');

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
          // Check password strength
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
    const fieldsToCheck: (keyof FormData)[] = ['email', 'password'];
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
          // Signup with password - check if email verified
          if (signupStep === 'details') {
            // For signup, we need to first verify email via OTP
            setSignupStep('verify');
            await onOtpRequest(formData.email);
          } else {
            // Second step: verify OTP and create account
            await onOtpVerify(formData.email, formData.otpCode);
            // Then sign in with password
            await onPasswordSubmit(formData.email, formData.password);
          }
        }
      } else {
        // OTP method
        if (mode === 'login') {
          if (!otpSent) {
            await onOtpRequest(formData.email);
            setOtpSent(true);
          } else {
            await onOtpVerify(formData.email, formData.otpCode);
          }
        } else {
          // Signup with OTP
          if (signupStep === 'details') {
            setSignupStep('verify');
            await onOtpRequest(formData.email);
          } else {
            // Verify and complete signup (need to handle password for new account)
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

  // Render OTP verification view
  if ((method === 'otp' && otpSent) || (method === 'password' && mode === 'signup' && signupStep === 'verify')) {
    return (
      <div className={cn('space-y-4 animate-in fade-in-50', className)}>
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 pressable"
          style={{ transition: TRANSITION }}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="text-center mb-6">
          <Mail className="h-12 w-12 text-[#ef5f47] mx-auto mb-3" />
          <h3 className="text-xl font-bold mb-2">
            {mode === 'signup' ? 'Verify your email' : 'Enter code'}
          </h3>
          <p className="text-muted-foreground text-sm">
            We sent a 6-digit code to <span className="font-medium">{formData.email}</span>
          </p>
        </div>

        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {errors.general}
          </div>
        )}

        <div>
          <input
            type="text"
            placeholder="6-digit code"
            value={formData.otpCode}
            onChange={(e) => handleChange('otpCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
            onBlur={() => handleBlur('otpCode')}
            disabled={isLoading}
            className={cn(
              'w-full text-center py-3 px-4 bg-[#f7f8f5] border rounded-xl text-2xl font-mono tracking-widest',
              errors.otpCode ? 'border-red-400' : 'border-[#17201d]/10'
            )}
            maxLength={6}
            autoFocus
          />
          {errors.otpCode && (
            <p className="text-red-500 text-xs mt-1.5">{errors.otpCode}</p>
          )}
        </div>

        {method === 'password' && mode === 'signup' && (
          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                disabled={isLoading}
                className={cn(
                  'w-full pl-10 pr-12 py-3 bg-[#f7f8f5] border rounded-xl',
                  errors.password ? 'border-red-400' : 'border-[#17201d]/10'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password}</p>}
          </div>
        )}

        <button
          type="submit"
          onClick={handleSubmit}
          disabled={isLoading}
          className={cn(
            'w-full flex items-center justify-center gap-2 bg-[#17201d] text-white font-medium py-3 px-6 rounded-xl pressable',
            'disabled:opacity-50'
          )}
          style={{
            transition: TRANSITION,
            transform: isLoading ? 'none' : undefined
          }}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              {mode === 'signup' ? 'Create account' : 'Sign in'}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    );
  }

  // Main form
  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {/* Method toggle */}
      <div className="flex bg-[#f7f8f5] rounded-xl p-1 mb-6">
        <button
          type="button"
          onClick={() => handleMethodChange('password')}
          className={cn(
            'flex-1 py-2 px-3 rounded-lg text-sm font-medium pressable',
            method === 'password'
              ? 'bg-white shadow-sm text-[#17201d]'
              : 'text-muted-foreground hover:text-foreground'
          )}
          style={{ transition: TRANSITION }}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => handleMethodChange('otp')}
          className={cn(
            'flex-1 py-2 px-3 rounded-lg text-sm font-medium pressable',
            method === 'otp'
              ? 'bg-white shadow-sm text-[#17201d]'
              : 'text-muted-foreground hover:text-foreground'
          )}
          style={{ transition: TRANSITION }}
        >
          One-time code
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-[#f7f8f5] rounded-xl p-1 mb-6">
        <button
          type="button"
          onClick={() => handleModeChange('login')}
          className={cn(
            'flex-1 py-2 px-3 rounded-lg text-sm font-medium pressable',
            mode === 'login'
              ? 'bg-white shadow-sm text-[#17201d]'
              : 'text-muted-foreground hover:text-foreground'
          )}
          style={{ transition: TRANSITION }}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('signup')}
          className={cn(
            'flex-1 py-2 px-3 rounded-lg text-sm font-medium pressable',
            mode === 'signup'
              ? 'bg-white shadow-sm text-[#17201d]'
              : 'text-muted-foreground hover:text-foreground'
          )}
          style={{ transition: TRANSITION }}
        >
          Sign up
        </button>
      </div>

      {errors.general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {errors.general}
        </div>
      )}

      {/* Name field for signup */}
      {mode === 'signup' && (
        <div>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Full name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              disabled={isLoading}
              className={cn(
                'w-full pl-10 pr-4 py-3 bg-[#f7f8f5] border rounded-xl',
                errors.name ? 'border-red-400' : 'border-[#17201d]/10'
              )}
            />
          </div>
          {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name}</p>}
        </div>
      )}

      {/* Email */}
      <div>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="email"
            placeholder="Email address"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            disabled={isLoading}
            className={cn(
              'w-full pl-10 pr-4 py-3 bg-[#f7f8f5] border rounded-xl',
              errors.email ? 'border-red-400' : 'border-[#17201d]/10'
            )}
            autoFocus
          />
        </div>
        {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>}
      </div>

      {/* Password (only for password method) */}
      {method === 'password' && (
        <>
          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'login' ? 'Password' : 'Create password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                disabled={isLoading}
                className={cn(
                  'w-full pl-10 pr-12 py-3 bg-[#f7f8f5] border rounded-xl',
                  errors.password ? 'border-red-400' : 'border-[#17201d]/10'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password}</p>}
          </div>

          {/* Confirm password for signup */}
          {mode === 'signup' && (
            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  disabled={isLoading}
                  className={cn(
                    'w-full pl-10 pr-4 py-3 bg-[#f7f8f5] border rounded-xl',
                    errors.confirmPassword ? 'border-red-400' : 'border-[#17201d]/10'
                  )}
                />
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword}</p>}
            </div>
          )}

          {/* Forgot password for login */}
          {mode === 'login' && (
            <div className="text-right">
              <button type="button" className="text-xs text-[#ef5f47] hover:underline">
                Forgot password?
              </button>
            </div>
          )}
        </>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          'w-full flex items-center justify-center gap-2 bg-[#17201d] text-white font-medium py-3 px-6 rounded-xl pressable',
          'disabled:opacity-50'
        )}
        style={{
          transition: TRANSITION,
          transform: isLoading ? 'none' : undefined
        }}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            {mode === 'login' ? 'Sign in' : 'Continue'}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        By continuing, you agree to our{' '}
        <a href="#" className="text-[#ef5f47] hover:underline">Terms</a> and{' '}
        <a href="#" className="text-[#ef5f47] hover:underline">Privacy</a>
      </p>
    </form>
  );
}