'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { getCourseBySlug } from '@/lib/mockData';
import { useAuth } from '@/lib/AuthContext';

const paymentMethods = [
  { id: 'bank', label: 'Bank Transfer', details: 'Account: HBL 0012-34567890-01\nAccount Title: Premier Academy Pvt Ltd\nBranch: Gulberg III, Lahore' },
  { id: 'easypaisa', label: 'EasyPaisa', details: 'Account: 0300-1234567\nAccount Title: Premier Academy' },
  { id: 'jazzcash', label: 'JazzCash', details: 'Account: 0301-7654321\nAccount Title: Premier Academy' },
];

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [method, setMethod] = useState('bank');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const slug = params.slug as string;
  const course = getCourseBySlug(slug);

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.push('/auth/login');
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <div className="w-10 h-10 border-4 border-brand-green/30 border-t-brand-green rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !course) return null;

  const discount = course.originalPrice ? course.originalPrice - (course.price ?? 0) : 0;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.type.startsWith('image/') || f.type === 'application/pdf')) setFile(f);
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-bg-light flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center max-w-md animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-text-primary mb-2">Payment Submitted!</h1>
          <p className="text-sm text-text-secondary mb-6 leading-relaxed">
            Our team will verify your payment and activate your course within <strong>24 hours</strong>.
            You&apos;ll receive a confirmation email at <strong>{user.email}</strong>.
          </p>
          <button onClick={() => router.push('/')} className="btn-signup px-8 py-2.5">
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-light">
      <div className="container-main py-6 md:py-10">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Courses', href: '/courses' },
          { label: course.title, href: `/courses/${course.slug}` },
          { label: 'Checkout' },
        ]} />

        <h1 className="text-2xl font-extrabold text-text-primary mt-4 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-border-light rounded-xl p-6 lg:sticky lg:top-24">
              <h2 className="text-base font-bold text-text-primary mb-4">Order Summary</h2>
              <div className="flex gap-4 mb-5">
                <div className="relative w-24 h-14 rounded-lg overflow-hidden shrink-0">
                  <Image src={course.thumbnail} alt={course.title} fill className="object-cover" sizes="96px" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-text-primary line-clamp-2">{course.title}</h3>
                  <p className="text-xs text-text-secondary mt-0.5">{course.instructor}</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-border-light pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="text-text-primary">Rs. {(course.originalPrice ?? course.price ?? 0).toLocaleString('en-PK')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Discount</span>
                    <span className="text-green-600 font-medium">−Rs. {discount.toLocaleString('en-PK')}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold border-t border-border-light pt-3 mt-2">
                  <span className="text-text-primary">Total</span>
                  <span className="text-text-primary">Rs. {(course.price ?? 0).toLocaleString('en-PK')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="bg-white border border-border-light rounded-xl p-6">
              <h2 className="text-base font-bold text-text-primary mb-5">Payment Method</h2>

              {/* Method selection */}
              <div className="space-y-3 mb-6">
                {paymentMethods.map((pm) => (
                  <label key={pm.id}
                    className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                      method === pm.id ? 'border-brand-green bg-brand-green/5' : 'border-border-light hover:border-gray-300'
                    }`}>
                    <input type="radio" name="payment" value={pm.id} checked={method === pm.id}
                      onChange={(e) => setMethod(e.target.value)}
                      className="mt-0.5 accent-brand-green" />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-text-primary">{pm.label}</span>
                      {method === pm.id && (
                        <pre className="text-xs text-text-secondary mt-2 whitespace-pre-wrap font-sans bg-gray-50 rounded-md p-3">
                          {pm.details}
                        </pre>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              {/* File upload */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-text-primary mb-2">
                  Upload Payment Screenshot / Receipt
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                    dragOver ? 'border-brand-green bg-brand-green/5' : 'border-border-light hover:border-gray-400'
                  }`}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input id="file-upload" type="file" accept="image/*,.pdf" className="hidden"
                    onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium text-text-primary">{file.name}</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="text-red-500 hover:text-red-700 ml-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-text-secondary">Drag & drop or <span className="text-brand-green font-medium">browse</span></p>
                      <p className="text-xs text-text-secondary mt-1">Accepts images and PDF</p>
                    </>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading || !file}
                className="w-full btn-signup py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Submitting…
                  </span>
                ) : 'Submit for Verification'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
