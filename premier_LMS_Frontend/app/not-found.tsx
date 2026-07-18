import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-bg-light flex items-center justify-center px-4 py-12">
      <div className="text-center animate-fade-in max-w-md">
        <div className="w-20 h-20 rounded-full bg-brand-green flex items-center justify-center mx-auto mb-6">
          <span className="text-accent-gold text-3xl font-extrabold">TM</span>
        </div>
        <h1 className="text-6xl font-extrabold text-brand-green mb-4">404</h1>
        <h2 className="text-2xl font-bold text-text-primary mb-3">Page Not Found</h2>
        <p className="text-sm text-text-secondary leading-relaxed mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link href="/" className="btn-signup px-8 py-3 text-base no-underline inline-block">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
