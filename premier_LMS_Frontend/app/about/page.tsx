'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumb from '@/components/ui/Breadcrumb';

const credentials = [
  { icon: '⚖️', title: 'Advocate High Court' },
  { icon: '📊', title: 'Associate Chartered Management Accountant' },
  { icon: '💼', title: 'Certified Financial & Management Advisor' },
  { icon: '🏢', title: 'Executive Partner Raja Gulfam & Co' },
  { icon: '📜', title: 'General Secretary Hazara Tax Bar Association' },
  { icon: '🧾', title: 'Income Tax Practitioner' },
  { icon: '🔍', title: 'Financial & Forensic Investigator' },
  { icon: '🛡️', title: 'Certified Fraud Investigator' },
  { icon: '🏦', title: 'Anti Money Laundering Laws Expert' },
  { icon: '🤝', title: 'Cooperative Societies Expert' },
];

const stats = [
  { value: '10+', label: 'Years of Practice' },
  { value: '10', label: 'Specialized Courses' },
  { value: '5,000+', label: 'Students Trained' },
  { value: '100+', label: 'Corporate Clients' },
];

const galleryImages = [
  { src: '/about/cima-certificate.jpeg', alt: 'Receiving Chartered Global Management Accountant certificate at the Embassy of Pakistan', caption: 'CGMA Certification Ceremony' },
  { src: '/about/fbr-award.jpeg', alt: 'Receiving Appreciation Shield from Ministry of Finance at FBR Tax Awareness Ceremony', caption: 'FBR Appreciation Award' },
  { src: '/about/fbr-seminar.jpeg', alt: 'Speaking at FBR Seminar on Minimum Tax Regime Insights', caption: 'FBR Tax Seminar Speaker' },
  { src: '/about/high-court.jpeg', alt: 'At Peshawar High Court Abbottabad Bench', caption: 'Peshawar High Court' },
  { src: '/about/teaching-class.jpeg', alt: 'Teaching Basic Pillars of Accounting in classroom', caption: 'In The Classroom' },
  { src: '/about/office-desk.jpeg', alt: 'Raja Gulfam Kayani at his office with professional library and company banner', caption: 'At Raja Gulfam & Co.' },
];

export default function AboutPage() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <main className="min-h-screen bg-white">
      {/* ════════════════════════════════════════════════════════
          HERO SECTION
         ════════════════════════════════════════════════════════ */}
      <section
        id="about-hero"
        className="relative w-full overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f2d24 0%, #1a4a3a 40%, #2a6a52 70%, #c9a84c 100%)',
        }}
      >
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="container-main relative z-10 py-16 md:py-24">
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'About Us' }]} />

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 rounded-full bg-accent-gold animate-pulse" />
                <span className="text-xs font-semibold text-accent-gold uppercase tracking-wider">Est. 2016 — Abbottabad</span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
                Turning Ambition<br />
                <span className="text-accent-gold">into Expertise</span>
              </h1>

              <p className="text-mint/80 text-base md:text-lg leading-relaxed max-w-lg mb-8">
                Premier Tax Corporate &amp; Accounting School — where practical knowledge meets professional destiny. 
                Founded by a practitioner, built for professionals.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/courses" className="btn-signup no-underline text-center px-6 py-3 text-sm">
                  Explore Courses
                </Link>
                <a href="#founder" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold px-6 py-3 rounded-md text-sm hover:bg-white/20 transition-all no-underline">
                  Meet the Founder
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Portrait image */}
            <div className="relative flex justify-center lg:justify-end animate-fade-in" style={{ animationDelay: '150ms' }}>
              <div className="relative">
                {/* Decorative frame */}
                <div className="absolute -inset-3 rounded-2xl border-2 border-accent-gold/30 -rotate-3 animate-gold-ring" />
                <div className="absolute -inset-3 rounded-2xl border-2 border-white/10 rotate-2" />
                <div className="relative w-72 md:w-80 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 hover-shine">
                  <Image
                    src="/about/founder-portrait.jpeg"
                    alt="Raja Gulfam Kayani — Founder & Lead Instructor"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 object-top"
                    sizes="320px"
                    priority
                  />
                </div>
                {/* Name card overlay */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-card-hover px-5 py-3 text-center whitespace-nowrap">
                  <p className="text-sm font-bold text-text-primary">Raja Gulfam Kayani</p>
                  <p className="text-[11px] text-text-secondary">ACMA · Advocate High Court</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          STATS BAR
         ════════════════════════════════════════════════════════ */}
      <section id="stats-bar" className="bg-brand-green border-b border-brand-green-dark">
        <div className="container-main py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center animate-fade-in hover-stat cursor-default" style={{ animationDelay: `${i * 80}ms` }}>
                <p className="stat-value text-2xl md:text-3xl font-extrabold text-accent-gold mb-1 transition-all duration-300">{stat.value}</p>
                <p className="text-xs md:text-sm font-medium text-mint/70 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FOUNDER PROFILE SECTION
         ════════════════════════════════════════════════════════ */}
      <section id="founder" className="py-14 md:py-20 bg-white">
        <div className="container-main">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left — Image + Logo */}
            <div className="space-y-6 animate-fade-in">
              <div className="group relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-card-hover hover-shine">
                <Image
                  src="/about/office-desk.jpeg"
                  alt="Raja Gulfam Kayani at his professional office"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              {/* Company logo card */}
              <div className="flex items-center gap-4 bg-gray-50 border border-border-light rounded-xl p-4 hover-glow cursor-default">
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-white border border-border-light">
                  <Image
                    src="/about/company-logo.jpeg"
                    alt="Raja Gulfam & Co — Chartered Management Accountants & Corporate Law Associates"
                    width={64}
                    height={64}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">Raja Gulfam &amp; Co.</p>
                  <p className="text-xs text-text-secondary">Chartered Management Accountants &amp; Corporate Law Associates</p>
                  <p className="text-[10px] text-brand-green font-semibold mt-0.5">Since 2016 · Abbottabad, Pakistan</p>
                </div>
              </div>
            </div>

            {/* Right — Bio */}
            <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="w-8 h-0.5 bg-accent-gold rounded-full" />
                <span className="text-xs font-bold text-accent-gold uppercase tracking-wider">Our Founder</span>
              </div>

              <h2 className="text-2xl md:text-3xl font-extrabold text-text-primary leading-tight mb-2">
                Raja Gulfam Kayani
              </h2>
              <p className="text-sm text-brand-green font-semibold mb-6">
                Chartered Management Accountant &amp; Advocate High Court
              </p>

              <div className="space-y-4 text-sm text-text-secondary leading-relaxed">
                <p>
                  In the bustling professional hub of Abbottabad, Raja Gulfam Kayani built a formidable practice.
                  As a Chartered Management Accountant and High Court Advocate heading <strong className="text-text-primary">Raja Gulfam &amp; Co.</strong> since
                  2016, he witnessed a recurring problem: talented youngsters and struggling accountants who had
                  theoretical knowledge but lacked the practical edge to thrive.
                </p>
                <p>
                  Rather than simply hiring, he decided to teach. That&apos;s how <strong className="text-text-primary">Premier Tax
                  Corporate &amp; Accounting School</strong> was born.
                </p>
                <p>
                  We are not a traditional academic institute. We are a practical training ground. We take the
                  complex realities of Finance, Audit, Taxation, and Corporate Affairs — the very challenges
                  Mr. Kayani solves daily for clients — and translate them into a powerful curriculum.
                </p>
                <p>
                  Our suite of <strong className="text-text-primary">10 progressive courses</strong> is designed to take you from
                  the basics of tax practice all the way to the strategic heights of an Advanced Tax Litigation
                  Manager. For lawyers, we open a new window into corporate practice. For accountants, we provide
                  the rocket fuel to break through career plateaus.
                </p>
                <p className="text-text-primary font-medium italic border-l-4 border-accent-gold pl-4 py-1 hover-quote cursor-default">
                  &ldquo;At Premier, you don&apos;t just learn from a teacher; you learn from a practitioner who has been
                  in the trenches since 2016. Welcome to the school where practical knowledge meets professional
                  destiny.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CREDENTIALS GRID
         ════════════════════════════════════════════════════════ */}
      <section id="credentials" className="py-14 md:py-20 bg-bg-light">
        <div className="container-main">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 justify-center mb-4">
              <div className="w-8 h-0.5 bg-accent-gold rounded-full" />
              <span className="text-xs font-bold text-accent-gold uppercase tracking-wider">Professional Credentials</span>
              <div className="w-8 h-0.5 bg-accent-gold rounded-full" />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-text-primary">
              A Multifaceted Professional
            </h2>
            <p className="text-sm text-text-secondary mt-2 max-w-lg mx-auto">
              Raja Gulfam Kayani brings a rare combination of legal, financial, and investigative expertise.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {credentials.map((cred, i) => (
              <div
                key={i}
                className="group bg-white border border-border-light rounded-xl p-4 text-center
                           hover-glow animate-fade-in cursor-default"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="text-2xl mb-2 block hover-icon-bounce">{cred.icon}</span>
                <p className="text-xs font-semibold text-text-primary leading-snug group-hover:text-brand-green transition-colors duration-300">{cred.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          ABOUT THE SCHOOL
         ════════════════════════════════════════════════════════ */}
      <section id="about-school" className="py-14 md:py-20 bg-white">
        <div className="container-main">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — Text */}
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="w-8 h-0.5 bg-accent-gold rounded-full" />
                <span className="text-xs font-bold text-accent-gold uppercase tracking-wider">About The School</span>
              </div>

              <h2 className="text-2xl md:text-3xl font-extrabold text-text-primary leading-tight mb-6">
                Premier Tax Corporate &amp;<br />Accounting School
              </h2>

              <div className="space-y-4 text-sm text-text-secondary leading-relaxed">
                <p>
                  Premier Tax Corporate &amp; Accounting School is Abbottabad&apos;s premier destination for
                  practical financial and legal education. Founded under the esteemed umbrella of{' '}
                  <strong className="text-text-primary">Raja Gulfam &amp; Co.</strong>, we bridge the critical gap between
                  academic theory and professional excellence in the fields of Finance, Audit, Taxation, and
                  Corporate Law.
                </p>
                <p>
                  The school is the vision of Raja Gulfam Kayani, a distinguished Chartered Management Accountant
                  and High Court Advocate. Since 2016, Mr. Kayani has led Raja Gulfam &amp; Co. in delivering top-tier
                  services in corporate affairs. He recognized a vital need in the market: to equip aspiring accountants
                  and lawyers not just with degrees, but with the <strong className="text-text-primary">actionable, practical skills</strong> required
                  to excel from day one.
                </p>
                <p>
                  Premier was born from this mission — to pass on real-world expertise to the next generation.
                </p>
              </div>
            </div>

            {/* Right — Teaching image */}
            <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="group relative w-full aspect-[16/10] rounded-2xl overflow-hidden shadow-card-hover hover-tilt">
                <Image
                  src="/about/teaching-class.jpeg"
                  alt="Raja Gulfam Kayani teaching Basic Pillars of Accounting in classroom"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                {/* Gradient overlay on bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white text-xs font-semibold">
                    Hands-on classroom training — where theory meets practice
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          MISSION SECTION
         ════════════════════════════════════════════════════════ */}
      <section id="mission" className="py-14 md:py-20 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a4a3a 0%, #0f2d24 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute top-10 right-10 w-64 h-64 rounded-full border border-white/5" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full border border-white/5" />

        <div className="container-main relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 justify-center mb-4">
              <div className="w-8 h-0.5 bg-accent-gold rounded-full" />
              <span className="text-xs font-bold text-accent-gold uppercase tracking-wider">Our Mission</span>
              <div className="w-8 h-0.5 bg-accent-gold rounded-full" />
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-6">
              We Don&apos;t Just Teach Concepts —<br />
              <span className="text-accent-gold">We Train Professionals to Apply Them</span>
            </h2>

            <p className="text-mint/80 text-sm md:text-base leading-relaxed mb-10">
              We are dedicated to empowering struggling accountants, assisting finance managers, and junior lawyers
              by equipping them with the practical knowledge of taxation and corporate law that textbooks often miss.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  ),
                  title: 'Practical Curriculum',
                  desc: '10 specialized courses designed around real-world challenges, not textbook theory.',
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  ),
                  title: 'Career Acceleration',
                  desc: 'From foundational skills to advanced mastery — we build professionals, not just students.',
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ),
                  title: 'Industry Credibility',
                  desc: 'Learn from a practitioner recognized by FBR, CIMA, and the High Courts of Pakistan.',
                },
              ].map((item, i) => (
                <div key={i}
                  className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center
                             hover:bg-white/10 hover:border-accent-gold/30 hover:-translate-y-1
                             transition-all duration-300 animate-fade-in hover-shine cursor-default"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-gold/20 text-accent-gold mb-4
                                  group-hover:bg-accent-gold/30 group-hover:scale-110 transition-all duration-300">
                    {item.icon}
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2 group-hover:text-accent-gold transition-colors duration-300">{item.title}</h3>
                  <p className="text-xs text-mint/70 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          OUR PROGRAMS
         ════════════════════════════════════════════════════════ */}
      <section id="programs" className="py-14 md:py-20 bg-bg-light">
        <div className="container-main">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 justify-center mb-4">
              <div className="w-8 h-0.5 bg-accent-gold rounded-full" />
              <span className="text-xs font-bold text-accent-gold uppercase tracking-wider">Our Programs</span>
              <div className="w-8 h-0.5 bg-accent-gold rounded-full" />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-text-primary">
              A Structured Roadmap to Mastery
            </h2>
            <p className="text-sm text-text-secondary mt-2 max-w-lg mx-auto">
              We offer a practical-oriented roadmap of 10 specialized courses — from foundational skills
              to advanced courtroom mastery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Program 1 */}
            <div className="group bg-white border border-border-light rounded-xl overflow-hidden hover-float hover-shine animate-fade-in">
              <div className="h-2 bg-gradient-to-r from-brand-green to-brand-green-light group-hover:from-accent-gold group-hover:to-accent-gold-light transition-all duration-500" />
              <div className="p-6">
                <div className="inline-flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-green/10 text-brand-green px-2.5 py-1 rounded">
                    Foundation
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-accent-gold/10 text-accent-gold-dark px-2.5 py-1 rounded">
                    For Accountants
                  </span>
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-brand-green transition-colors">
                  Certified Tax Practitioner Program
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                  For those looking to enter the world of tax compliance. Build a solid foundation in tax practice,
                  FBR compliance, and financial reporting from the ground up.
                </p>
                <div className="flex items-center gap-4 text-xs text-text-secondary">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Multiple Modules
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Certification Included
                  </span>
                </div>
              </div>
            </div>

            {/* Program 2 */}
            <div className="group bg-white border border-border-light rounded-xl overflow-hidden hover-float hover-shine animate-fade-in"
              style={{ animationDelay: '80ms' }}
            >
              <div className="h-2 bg-gradient-to-r from-accent-gold to-accent-gold-light group-hover:from-brand-green group-hover:to-brand-green-light transition-all duration-500" />
              <div className="p-6">
                <div className="inline-flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-1 rounded">
                    Advanced
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-green/10 text-brand-green px-2.5 py-1 rounded">
                    For Lawyers & Tax Pros
                  </span>
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-accent-gold-dark transition-colors">
                  Advanced Tax Litigation Manager
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                  Designed to open new windows for lawyers and tax professionals, enabling them to confidently
                  practice in corporate and appellate forums with strategic litigation skills.
                </p>
                <div className="flex items-center gap-4 text-xs text-text-secondary">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Multiple Modules
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Certification Included
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          RECOGNITION GALLERY
         ════════════════════════════════════════════════════════ */}
      <section id="gallery" className="py-14 md:py-20 bg-white">
        <div className="container-main">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 justify-center mb-4">
              <div className="w-8 h-0.5 bg-accent-gold rounded-full" />
              <span className="text-xs font-bold text-accent-gold uppercase tracking-wider">Recognition &amp; Impact</span>
              <div className="w-8 h-0.5 bg-accent-gold rounded-full" />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-text-primary">
              In the Field &amp; At the Podium
            </h2>
            <p className="text-sm text-text-secondary mt-2 max-w-lg mx-auto">
              From FBR seminars to the High Court — a practitioner&apos;s journey of impact and recognition.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {galleryImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden shadow-card
                           hover:shadow-card-hover hover:rounded-2xl transition-all duration-500 animate-fade-in cursor-pointer"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent
                                opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0
                                group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <p className="text-white text-sm font-semibold">{img.caption}</p>
                </div>
                {/* Zoom icon */}
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm
                                flex items-center justify-center opacity-0 group-hover:opacity-100
                                transition-opacity duration-300">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CTA SECTION
         ════════════════════════════════════════════════════════ */}
      <section id="cta" className="py-14 md:py-20 bg-bg-light">
        <div className="container-main">
          <div className="relative bg-brand-green rounded-2xl overflow-hidden px-6 md:px-12 py-12 md:py-16 text-center cta-shimmer">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-accent-gold/10 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/3" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4">
                Ready to Accelerate Your Career?
              </h2>
              <p className="text-mint/80 text-sm md:text-base leading-relaxed mb-8">
                At Premier, we don&apos;t just educate — we accelerate careers. Let us help you progress, advocate, and lead.
                Join hundreds of professionals who have transformed their practice with us.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/courses" className="btn-signup no-underline text-center px-8 py-3 text-sm">
                  Browse All Courses
                </Link>
                <Link href="/admission"
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20
                             text-white font-semibold px-8 py-3 rounded-md text-sm hover:bg-white/20 transition-all no-underline">
                  Apply for Admission
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          LIGHTBOX MODAL
         ════════════════════════════════════════════════════════ */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 animate-fade-in"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center
                       text-white hover:bg-white/20 transition-colors z-10"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close lightbox"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous */}
          <button
            className="absolute left-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center
                       text-white hover:bg-white/20 transition-colors z-10"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : galleryImages.length - 1));
            }}
            aria-label="Previous image"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next */}
          <button
            className="absolute right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center
                       text-white hover:bg-white/20 transition-colors z-10 mr-12"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((prev) => (prev !== null && prev < galleryImages.length - 1 ? prev + 1 : 0));
            }}
            aria-label="Next image"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Image */}
          <div className="relative w-[90vw] max-w-4xl aspect-[4/3]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={galleryImages[lightboxIndex].src}
              alt={galleryImages[lightboxIndex].alt}
              fill
              className="object-contain"
              sizes="90vw"
            />
            <p className="absolute -bottom-8 left-0 right-0 text-center text-white text-sm font-medium">
              {galleryImages[lightboxIndex].caption}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
