'use client';

import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const hideFooter = 
    pathname.startsWith('/auth') || 
    pathname.startsWith('/admin') ||
    pathname.startsWith('/dashboard/classes') ||
    pathname.startsWith('/dashboard/recordings/player');

  if (hideFooter) return null;

  return (
    <footer className="bg-gray-50 border-t border-border-light">
      <div className="container-main py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-brand-green flex items-center justify-center">
            <span className="text-accent-gold text-[8px] font-extrabold leading-none">P</span>
          </div>
          <span className="text-sm text-text-secondary">
            &copy; 2026 Premier Academy — All rights reserved.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/about" className="text-xs text-text-secondary hover:text-text-primary transition-colors no-underline">
            About Us
          </a>
          <a href="#" className="text-xs text-text-secondary hover:text-text-primary transition-colors no-underline">
            Privacy Policy
          </a>
          <a href="#" className="text-xs text-text-secondary hover:text-text-primary transition-colors no-underline">
            Terms of Service
          </a>
          <a href="#" className="text-xs text-text-secondary hover:text-text-primary transition-colors no-underline">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
