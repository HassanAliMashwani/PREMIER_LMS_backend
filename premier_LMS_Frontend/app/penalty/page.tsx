'use client';

import Link from 'next/link';

export default function PenaltyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-[#120505] to-black flex items-center justify-center p-4">
      {/* Glow background effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-950/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-950/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-lg bg-zinc-950/70 border border-red-500/20 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative z-10 text-center flex flex-col items-center">
        {/* Warning Badge */}
        <div className="w-20 h-20 rounded-full bg-red-950/50 flex items-center justify-center text-red-500 font-extrabold text-3xl border border-red-500/30 shadow-lg shadow-red-950/40 mb-6">
          <span>⚠️</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-yellow-500 tracking-tight mb-4">
          Access Restrained
        </h1>

        {/* Subtitle */}
        <h2 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-6">
          Classroom Policy Violation
        </h2>

        {/* Violation Description Card */}
        <div className="w-full bg-red-950/10 border border-red-500/10 rounded-2xl p-6 text-left mb-8 text-gray-300 space-y-4">
          <p className="text-sm leading-relaxed">
            You have been automatically removed from the live classroom environment due to multiple security violations:
          </p>
          <ul className="text-xs text-gray-400 space-y-2.5 list-disc pl-5">
            <li>Switching browser tabs or minimizing the classroom tab.</li>
            <li>Loss of active browser window focus (clicking out of the classroom stream area).</li>
            <li>Opening developer tools, keyboard shortcut triggers, or inspect overlays.</li>
          </ul>
          <p className="text-xs text-red-400/80 font-medium pt-2 border-t border-red-500/10">
            * Note: These security protocols are strictly enforced to protect copyrighted lecture content from unauthorized recordings.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <Link
            href="/dashboard"
            className="flex-1 px-6 py-3 bg-red-600/90 hover:bg-red-600 active:bg-red-700 text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-red-600/20 hover:scale-[1.02] text-center"
          >
            Back to Dashboard
          </Link>
          <a
            href="mailto:support@premier.edu.pk"
            className="flex-1 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-850 text-gray-300 hover:text-white border border-white/10 font-bold text-sm rounded-xl transition-all duration-200 hover:scale-[1.02] text-center"
          >
            Appeal Penalty
          </a>
        </div>
      </div>
    </div>
  );
}
