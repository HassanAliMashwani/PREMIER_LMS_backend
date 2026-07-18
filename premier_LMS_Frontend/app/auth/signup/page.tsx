'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

function getStrength(pw: string): { label: string; color: string; width: string } {
  if (pw.length < 6) return { label: 'Weak', color: 'bg-red-400', width: 'w-1/4' };
  if (pw.length < 8) return { label: 'Fair', color: 'bg-amber-400', width: 'w-1/2' };
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw) && pw.length >= 10)
    return { label: 'Strong', color: 'bg-green-500', width: 'w-full' };
  return { label: 'Medium', color: 'bg-amber-400', width: 'w-3/4' };
}

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const set = (field: string, val: string) => {
    setForm((p) => ({ ...p, [field]: val }));
    setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    if (!form.confirm) e.confirm = 'Please confirm your password';
    else if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setApiError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      router.push('/dashboard');
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrength(form.password);

  const inputClass = (field: string) =>
    `w-full pl-11 pr-4 py-3 text-sm border-2 rounded-xl bg-gray-50/50 text-text-primary
     placeholder:text-gray-400 transition-all duration-200 focus:ring-0 focus:bg-white
     ${errors[field] ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-brand-green'}`;

  return (
    <main className="min-h-screen flex">
      {/* LEFT — Visual / Branding Side */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0d3b2e 0%, #1a5e4a 30%, #0f2d24 70%, #0a1f17 100%)' }}>

        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-accent-gold/10 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-32 right-16 w-80 h-80 rounded-full bg-brand-green/15 blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-400/10 blur-2xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />

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
            Start Your
            <span className="block text-accent-gold">Learning Journey</span>
          </h2>

          <p className="text-white/60 text-base leading-relaxed mb-10">
            Join thousands of students mastering Pakistan&apos;s tax laws with expert-led courses, live interactive classes, and comprehensive study materials.
          </p>

          {/* Steps */}
          <div className="space-y-4 text-left">
            {[
              { step: '01', title: 'Create Account', desc: 'Fill in your details to get started' },
              { step: '02', title: 'Submit Admission', desc: 'Apply for your desired courses' },
              { step: '03', title: 'Start Learning', desc: 'Access live classes and recordings' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <div className="w-10 h-10 rounded-lg bg-accent-gold/20 flex items-center justify-center shrink-0">
                  <span className="text-accent-gold text-sm font-bold">{item.step}</span>
                </div>
                <div>
                  <h4 className="text-white text-sm font-bold">{item.title}</h4>
                  <p className="text-white/50 text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-10 bg-white relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-green/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-accent-gold/5 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4" />

        <div className="w-full max-w-md relative z-10">
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-green to-emerald-700 flex items-center justify-center mb-4 shadow-lg shadow-brand-green/20 lg:hidden">
              <span className="text-accent-gold text-2xl font-extrabold tracking-tight">P</span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Create Account</h1>
            <p className="text-sm text-text-secondary mt-1.5">Join Premier Academy</p>
          </div>

          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5 flex items-center gap-2.5">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 11-12.728 0" /></svg>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label htmlFor="signup-name" className="block text-sm font-semibold text-text-primary mb-2">Full Name</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </span>
                <input id="signup-name" type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
                  placeholder="Ahmed Raza" className={inputClass('name')} />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="signup-email" className="block text-sm font-semibold text-text-primary mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </span>
                <input id="signup-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                  placeholder="you@example.com" className={inputClass('email')} />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="signup-phone" className="block text-sm font-semibold text-text-primary mb-2">Phone Number</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </span>
                <input id="signup-phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)}
                  placeholder="+92 300 1234567" className={inputClass('phone')} />
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.phone}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="signup-password" className="block text-sm font-semibold text-text-primary mb-2">Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </span>
                <input id="signup-password" type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={(e) => set('password', e.target.value)} placeholder="••••••••"
                  autoComplete="new-password"
                  className={`${inputClass('password')} !pr-12`} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text-primary transition-colors p-1"
                  aria-label={showPw ? 'Hide password' : 'Show password'}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d={showPw
                        ? 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18'
                        : 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'} />
                  </svg>
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.password}</p>}
              {/* Strength bar */}
              {form.password && (
                <div className="mt-2">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                  </div>
                  <p className={`text-[10px] font-medium mt-1 ${
                    strength.label === 'Strong' ? 'text-green-600' : strength.label === 'Weak' ? 'text-red-500' : 'text-amber-600'
                  }`}>{strength.label}</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="signup-confirm" className="block text-sm font-semibold text-text-primary mb-2">Confirm Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </span>
                <input id="signup-confirm" type="password" value={form.confirm} onChange={(e) => set('confirm', e.target.value)}
                  placeholder="••••••••" autoComplete="new-password" className={inputClass('confirm')} />
              </div>
              {errors.confirm && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.confirm}</p>}
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full btn-signup py-3.5 text-base font-bold rounded-xl disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-brand-green/20 hover:shadow-xl hover:shadow-brand-green/30 transition-all duration-300 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-text-secondary font-medium">Already a member?</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Login Link */}
          <p className="text-center text-sm text-text-secondary">
            Have an account?{' '}
            <Link href="/auth/login" className="font-bold text-brand-green hover:text-brand-green-dark transition-colors no-underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
