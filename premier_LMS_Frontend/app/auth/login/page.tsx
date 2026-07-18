'use client';

import { useState, FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const reason = searchParams.get('reason');

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Minimum 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setApiError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const ok = await login(email, password);
      if (ok) {
        const storedUser = localStorage.getItem('premier_user');
        if (storedUser) {
          const userObj = JSON.parse(storedUser);
          if (userObj.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/dashboard');
          }
        } else {
          router.push('/');
        }
      }
    } catch {
      setApiError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex">
      {/* LEFT — Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-white relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-brand-green/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-accent-gold/5 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />

        <div className="w-full max-w-md relative z-10">
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-green to-emerald-700 flex items-center justify-center mb-4 shadow-lg shadow-brand-green/20">
              <span className="text-accent-gold text-2xl font-extrabold tracking-tight">P</span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Welcome Back</h1>
            <p className="text-sm text-text-secondary mt-1.5">Sign in to your learning portal</p>
          </div>

          {/* Session expired notice */}
          {reason === 'session_expired' && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3 mb-5 flex items-center gap-2.5">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              Your session has expired. Please sign in again.
            </div>
          )}

          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5 flex items-center gap-2.5">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 11-12.728 0" /></svg>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold text-text-primary mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </span>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                  placeholder="you@example.com"
                  className={`w-full pl-11 pr-4 py-3 text-sm border-2 rounded-xl bg-gray-50/50 text-text-primary
                             placeholder:text-gray-400 transition-all duration-200 focus:ring-0 focus:bg-white
                             ${errors.email ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-brand-green'}`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold text-text-primary mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </span>
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-12 py-3 text-sm border-2 rounded-xl bg-gray-50/50 text-text-primary
                             placeholder:text-gray-400 transition-all duration-200 focus:ring-0 focus:bg-white
                             ${errors.password ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-brand-green'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text-primary transition-colors p-1"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.password}</p>}
            </div>

            {/* Forgot */}
            <div className="text-right">
              <a href="#" className="text-xs font-semibold text-brand-green hover:text-brand-green-dark transition-colors no-underline">
                Forgot Password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-signup py-3.5 text-base font-bold rounded-xl disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-brand-green/20 hover:shadow-xl hover:shadow-brand-green/30 transition-all duration-300"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-7">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-text-secondary font-medium">New here?</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-text-secondary">
            Don&apos;t have an account?{' '}
            <Link href="/admission" className="font-bold text-brand-green hover:text-brand-green-dark transition-colors no-underline">
              Apply for Admission
            </Link>
          </p>
        </div>
      </div>

      {/* RIGHT — Visual / Branding Side */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0d3b2e 0%, #1a5e4a 30%, #0f2d24 70%, #0a1f17 100%)' }}>

        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-accent-gold/10 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-32 left-16 w-80 h-80 rounded-full bg-brand-green/15 blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
          <div className="absolute top-1/2 right-1/3 w-48 h-48 rounded-full bg-emerald-400/10 blur-2xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />

          {/* Decorative grid pattern */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-lg px-12 text-center">
          {/* Large icon */}
          <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <span className="text-accent-gold text-4xl font-black tracking-tighter">P</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
            Premier Tax
            <span className="block text-accent-gold">Education Platform</span>
          </h2>

          <p className="text-white/60 text-base leading-relaxed mb-10">
            Access live classes, recorded lectures, and expert guidance from Pakistan&apos;s top tax professionals. Your journey to mastering taxation starts here.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3">
            {['Live Classes', 'Expert Faculty', 'Recorded Sessions', 'Certifications'].map((feature) => (
              <span key={feature} className="px-4 py-2 text-xs font-semibold text-white/80 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full">
                {feature}
              </span>
            ))}
          </div>

          {/* Testimonial / stat */}
          <div className="mt-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className="w-4 h-4 text-accent-gold" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              ))}
            </div>
            <p className="text-white/70 text-sm italic leading-relaxed">
              &ldquo;Premier Academy transformed my understanding of Pakistan&apos;s tax laws. The live classes and expert support are unmatched.&rdquo;
            </p>
            <p className="text-white/40 text-xs mt-3 font-medium">— Satisfied Student</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-brand-green/30 border-t-brand-green rounded-full animate-spin" />
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}
