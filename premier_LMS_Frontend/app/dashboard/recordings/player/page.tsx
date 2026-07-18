'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

interface LectureItem {
  id: string;
  classNo: number | string | null;
  title: string;
  duration: number | string;
  isLocked?: boolean;
}

interface PlayerState {
  videoId: string;
  currentLectureId: string;
  courseName: string;
  lectures: LectureItem[];
}

interface SavedNote {
  id: string;
  text: string;
  timeString: string;
  timeSeconds: number;
}

// Cache verification requests to prevent React StrictMode double-fetching the single-use token
const tokenCache = new Map<string, Promise<any>>();

const formatDuration = (totalMinutes: number | string): string => {
  const numMinutes = Number(totalMinutes);
  if (isNaN(numMinutes) || !numMinutes) return "0 mins";
  const hrs = Math.floor(numMinutes / 60);
  const mins = numMinutes % 60;
  if (hrs > 0) {
    return `${hrs} hr${hrs > 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}`;
  }
  return `${mins} min${mins !== 1 ? 's' : ''}`;
};

function RecordingPlayer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();

  const token = searchParams.get('token') || undefined;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playerData, setPlayerData] = useState<PlayerState | null>(null);
  const [securePlayback, setSecurePlayback] = useState<any>(null);
  const [activeLectureId, setActiveLectureId] = useState<string>('');
  const [switchingLecture, setSwitchingLecture] = useState<string | null>(null);
  
  // UI Panels toggles
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  
  // Interactive Seeking & Notes
  const [videoStartSecs, setVideoStartSecs] = useState<number>(0);
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [noteText, setNoteText] = useState('');
  const [noteTime, setNoteTime] = useState('0:00');
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);

  // Watermark state
  const [watermarkPos, setWatermarkPos] = useState({ top: '25%', left: '25%' });
  const noteInputRef = useRef<HTMLTextAreaElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Floating Watermark logic
  useEffect(() => {
    const interval = setInterval(() => {
      const randomTop = Math.floor(Math.random() * 60) + 20;
      const randomLeft = Math.floor(Math.random() * 60) + 20;
      setWatermarkPos({ top: `${randomTop}%`, left: `${randomLeft}%` });
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  // Harden: Prevent Right clicks & context menu on video page
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    window.addEventListener('contextmenu', handleContextMenu);
    return () => window.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  // Initial fetch
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }
    if (!token) {
      setError('Access Token missing. Please load recordings through your student dashboard.');
      setLoading(false);
      return;
    }

    const currentToken = token;

    async function verifyAndInitialize() {
      try {
        if (!tokenCache.has(currentToken)) {
          const promise = api.post('/classes/recording/verify', { token: currentToken }).then(res => res.data);
          tokenCache.set(currentToken, promise);
          // Auto-cleanup after 10 seconds
          setTimeout(() => tokenCache.delete(currentToken), 10000);
        }
        const data = await tokenCache.get(currentToken);
        setPlayerData(data);
        setActiveLectureId(data.currentLectureId);

        // Fetch secure playback details
        try {
          const secureRes = await api.get(`/classes/recordings/secure-playback/${data.currentLectureId}`);
          setSecurePlayback(secureRes.data);
          setVideoStartSecs(secureRes.data.lastPosition || 0);
        } catch (e) {
          console.warn('Failed to load secure playback progress:', e);
        }

        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Access token invalid or expired.');
        setLoading(false);
      }
    }
    verifyAndInitialize();
  }, [token, user, authLoading, router]);

  // Periodic Playback Progress Tracking Hook
  useEffect(() => {
    if (!activeLectureId || !videoRef.current) return;

    let lastSavedTime = videoRef.current.currentTime || 0;

    const saveProgress = async () => {
      if (!videoRef.current) return;
      const currentPos = Math.floor(videoRef.current.currentTime);
      const durationWatched = Math.max(0, currentPos - Math.floor(lastSavedTime));
      lastSavedTime = currentPos;

      if (durationWatched > 0) {
        try {
          await api.patch('/classes/recordings/progress', {
            recordedLectureId: activeLectureId,
            durationWatched,
            lastPosition: currentPos,
          });
        } catch (err) {
          console.error('Failed to update playback progress:', err);
        }
      }
    };

    const interval = setInterval(saveProgress, 5000);

    return () => {
      clearInterval(interval);
      saveProgress(); // Final save on component change/unmount
    };
  }, [activeLectureId, securePlayback]);

  // Load notes from localStorage once activeLectureId changes
  useEffect(() => {
    if (activeLectureId) {
      const saved = localStorage.getItem(`notes_${activeLectureId}`);
      if (saved) {
        try {
          setNotes(JSON.parse(saved));
        } catch (e) {
          setNotes([]);
        }
      } else {
        setNotes([]);
      }
    }
  }, [activeLectureId]);

  // Switch to a different lecture
  const handleSelectLecture = async (lectureId: string) => {
    if (lectureId === activeLectureId || switchingLecture) return;
    setSwitchingLecture(lectureId);
    setVideoStartSecs(0);
    try {
      const { data: tokenData } = await api.post(`/classes/${lectureId}/recording-token`);
      const { data } = await api.post('/classes/recording/verify', { token: tokenData.token });
      setPlayerData(data);
      setActiveLectureId(data.currentLectureId);

      // Fetch secure playback details
      try {
        const secureRes = await api.get(`/classes/recordings/secure-playback/${data.currentLectureId}`);
        setSecurePlayback(secureRes.data);
        setVideoStartSecs(secureRes.data.lastPosition || 0);
      } catch (e) {
        setSecurePlayback(null);
      }
    } catch (err: any) {
      console.error('Failed to switch lecture:', err);
    } finally {
      setSwitchingLecture(null);
    }
  };

  // Parse time MM:SS or H:MM:SS to seconds
  const parseTimeToSeconds = (timeStr: string): number => {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return isNaN(parts[0]) ? 0 : parts[0];
  };

  // Save a new note
  const handleSaveNote = () => {
    if (!noteText.trim()) return;

    const seconds = parseTimeToSeconds(noteTime);
    const newNote: SavedNote = {
      id: Math.random().toString(36).substring(2, 9),
      text: noteText,
      timeString: noteTime,
      timeSeconds: seconds,
    };

    const updatedNotes = [...notes, newNote].sort((a, b) => a.timeSeconds - b.timeSeconds);
    setNotes(updatedNotes);
    localStorage.setItem(`notes_${activeLectureId}`, JSON.stringify(updatedNotes));
    setNoteText('');
  };

  // Delete a note
  const handleDeleteNote = (noteId: string) => {
    const updated = notes.filter(n => n.id !== noteId);
    setNotes(updated);
    localStorage.setItem(`notes_${activeLectureId}`, JSON.stringify(updated));
  };

  // Seek video to specific timestamp
  const handleSeek = (seconds: number) => {
    setVideoStartSecs(seconds);
  };

  // Find active lecture object
  const activeLecture = playerData?.lectures.find(l => l.id === activeLectureId);

  // Generate realistic transcript lines based on lecture title
  const generateTranscript = (title: string) => {
    return [
      { time: '0:00', seconds: 0, text: `Hello everyone and welcome back to our course session covering: ${title}.` },
      { time: '1:15', seconds: 75, text: "In this class, we will go over the practical applications, compliance requirements, and primary formulas." },
      { time: '2:40', seconds: 160, text: "Please review the slide presentation available in the downloads dropdown to follow along with the core calculations." },
      { time: '4:20', seconds: 260, text: "We will now walk through our first practice scenario. Pay close attention to exceptions and corporate filing rules." },
      { time: '6:50', seconds: 410, text: "If you have questions about this concept, please use the discussion board or make a note here in your dashboard." },
    ];
  };

  const transcriptLines = activeLecture ? generateTranscript(activeLecture.title) : [];

  // Loading Screen
  if (authLoading || (loading && !error)) {
    return (
      <main className="fixed inset-0 w-screen h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-700 z-50">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-gray-500 animate-pulse uppercase tracking-wider">Establishing secure connection...</p>
      </main>
    );
  }

  // Error Screen
  if (error) {
    return (
      <main className="fixed inset-0 w-screen h-screen bg-gray-100 flex items-center justify-center p-6 text-gray-800 z-50">
        <div className="bg-white border border-gray-200 p-8 rounded-2xl w-full max-w-md shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-extrabold text-2xl mx-auto shadow-inner">!</div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-xl text-red-600">Access Denied</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{error}</p>
          </div>
          <button onClick={() => window.close()} className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-bold shadow hover:bg-blue-700 transition-all cursor-pointer">Close Window</button>
        </div>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 w-screen h-screen bg-gray-50 overflow-hidden flex flex-col font-sans select-none z-50 text-gray-800">
      
      {/* ================= HEADER BAR ================= */}
      <header className="h-[64px] bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-30 shadow-sm">
        {/* Branding & Breadcrumbs */}
        <div className="flex items-center gap-6 overflow-hidden pr-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.close()}>
            <span className="text-blue-600 font-black text-xl tracking-tight">Premier</span>
            <span className="text-gray-300 font-light">|</span>
            <span className="text-gray-600 font-semibold text-xs tracking-wider uppercase">Academy</span>
          </div>

          {/* Breadcrumbs */}
          <div className="hidden md:flex items-center gap-2 text-[13px] text-gray-500 truncate font-medium">
            <span className="text-gray-400 font-normal">/</span>
            <span className="hover:text-blue-600 transition-colors truncate max-w-[200px]">{playerData?.courseName}</span>
            <span className="text-gray-400">/</span>
            <span className="text-blue-600 font-semibold truncate max-w-[150px]">Class {activeLecture?.classNo || 'N/A'}</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-800 font-bold truncate max-w-[250px]">{activeLecture?.title}</span>
          </div>
        </div>

        {/* Exit & Controls */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-right">
            <p className="text-xs font-bold text-gray-800">{user?.name}</p>
            <p className="text-[10px] text-gray-400">{user?.email}</p>
          </div>
          <button
            onClick={() => window.close()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Exit Player
          </button>
        </div>
      </header>

      {/* ================= CORE CONTENT GRID ================= */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ===== COLUMN 1: LEFT SIDEBAR — SYLLABUS LIST ===== */}
        <aside className={`${sidebarOpen ? 'w-[320px] min-w-[320px]' : 'w-0 min-w-0'} h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden z-20`}>
          <div className="p-4 border-b border-gray-200 shrink-0 bg-gray-50/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Course Syllabus</h3>
            <p className="text-xs font-bold text-gray-800 truncate">{playerData?.courseName}</p>
            <p className="text-[11px] text-gray-500 mt-1 font-medium">{playerData?.lectures.length} Video session{(playerData?.lectures.length || 0) !== 1 ? 's' : ''}</p>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {playerData?.lectures.map((lecture) => {
              const isActive = lecture.id === activeLectureId;
              const isSwitching = switchingLecture === lecture.id;

              return (
                <button
                  key={lecture.id}
                  onClick={() => !lecture.isLocked && handleSelectLecture(lecture.id)}
                  disabled={isSwitching || lecture.isLocked}
                  className={`w-full text-left py-3.5 px-4 flex items-start gap-3 border-b border-gray-100 transition-all group relative border-l-4 ${
                    lecture.isLocked
                      ? 'opacity-55 cursor-not-allowed text-gray-400 bg-gray-50/20'
                      : isActive
                        ? 'bg-blue-50/40 border-l-blue-600 text-blue-700 cursor-pointer'
                        : 'hover:bg-gray-50 border-l-transparent text-gray-700 hover:text-gray-900 cursor-pointer'
                  }`}
                >
                  {/* Status Circle Icon */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 border-2 transition-colors ${
                    lecture.isLocked
                      ? 'border-gray-200 bg-gray-50 text-gray-400'
                      : isActive
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-300 bg-white text-gray-400 group-hover:border-gray-400 group-hover:text-gray-500'
                  }`}>
                    {isSwitching ? (
                      <span className="w-2.5 h-2.5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                    ) : lecture.isLocked ? (
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    ) : isActive ? (
                      <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    ) : (
                      <svg className="w-2.5 h-2.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="3">
                        <circle cx="12" cy="12" r="10" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                    )}
                  </div>

                  {/* Lecture metadata */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold leading-snug break-words ${isActive ? 'text-blue-700' : 'text-gray-800'}`}>
                      {lecture.classNo ? `${lecture.classNo}. ` : ''}{lecture.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-500">
                      {lecture.isLocked ? (
                        <span className="bg-red-50 text-red-600 px-1 py-0.5 rounded text-[8px] uppercase font-bold">Locked</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-600 px-1 py-0.5 rounded text-[8px] uppercase font-bold">Video</span>
                      )}
                      <span>•</span>
                      <span>{formatDuration(lecture.duration)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ===== COLUMN 2: CENTER PANEL — VIDEO PLAYER & TRANSCRIPT ===== */}
        <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-white flex flex-col p-6">
          
          {/* Header Controls for Sidebars */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 border border-gray-200 hover:border-blue-100 rounded-lg transition-colors cursor-pointer"
            >
              <svg className={`w-3.5 h-3.5 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {sidebarOpen ? 'Hide Syllabus' : 'Show Syllabus'}
            </button>

            <button
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 border border-gray-200 hover:border-blue-100 rounded-lg transition-colors cursor-pointer"
            >
              {rightSidebarOpen ? 'Hide Notes' : 'Show Notes'}
              <svg className={`w-3.5 h-3.5 transition-transform ${rightSidebarOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Active Lecture Title */}
          <div className="mb-4">
            <span className="text-[10px] uppercase font-bold tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded">ACTIVE VIDEO</span>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mt-2">
              {activeLecture?.classNo ? `Class ${activeLecture.classNo}: ` : ''}{activeLecture?.title}
            </h1>
          </div>

          {/* Video Iframe Container */}
          <div className="relative w-full aspect-[16/9] bg-black rounded-xl overflow-hidden shadow-lg border border-gray-200 shrink-0">
            {securePlayback?.streamUrl ? (
              <video
                ref={videoRef}
                key={securePlayback.id}
                src={securePlayback.streamUrl}
                controls
                autoPlay
                controlsList="nodownload"
                disablePictureInPicture
                className="absolute inset-0 w-full h-full object-cover"
                onLoadedMetadata={(e: any) => {
                  if (videoStartSecs > 0) {
                    e.target.currentTime = videoStartSecs;
                  }
                }}
              />
            ) : playerData && (
              <iframe
                key={`${playerData.videoId}_${videoStartSecs}`}
                src={`https://www.youtube.com/embed/${playerData.videoId}?autoplay=1&rel=0&start=${videoStartSecs}`}
                loading="lazy"
                className="absolute inset-0 w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            )}

            {/* DYNAMIC SECURE WATERMARK */}
            <div
              style={{
                top: watermarkPos.top,
                left: watermarkPos.left,
                transition: 'top 3s ease-in-out, left 3s ease-in-out',
              }}
              className="absolute z-20 pointer-events-none select-none text-white/[0.08] font-mono text-[10px] md:text-xs tracking-wider space-y-0.5 whitespace-nowrap bg-black/5 p-2 rounded-md"
            >
              <p>CONFIDENTIAL | {user?.name}</p>
              <p>{user?.email}</p>
              <p>SESSION SECURE</p>
            </div>
          </div>

          {/* ================= CONTROLS ROW ================= */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-gray-200 shrink-0 bg-white">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setRightSidebarOpen(true);
                  setTimeout(() => noteInputRef.current?.focus(), 150);
                }}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 hover:border-blue-600 text-gray-700 hover:text-blue-600 font-bold rounded-lg text-xs transition-colors cursor-pointer bg-white"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Save Note
              </button>

              {/* Resource Download Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setResourcesOpen(!resourcesOpen)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-lg text-xs transition-all cursor-pointer bg-white"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Downloads
                  <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {resourcesOpen && (
                  <div className="absolute left-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30">
                    <button onClick={() => setResourcesOpen(false)} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      Lecture Notes (PDF)
                    </button>
                    <button onClick={() => setResourcesOpen(false)} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      Practice Materials (ZIP)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right side feedback */}
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l-1.922-.641A3.001 3.001 0 015 7.242V4a1 1 0 012 0v3.242c0 .496.129.983.374 1.411l1.31 2.29M18 10h-2.586l.66-2.64A1 1 0 0015.11 6H13v4h-2V6a1 1 0 00-2 0v5h9a2 2 0 002-2V8a2 2 0 00-2-2z" />
                </svg>
                Share
              </button>

              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden shrink-0">
                <button
                  onClick={() => setLiked(liked === true ? null : true)}
                  className={`px-3 py-1.5 border-r border-gray-200 transition-colors ${liked === true ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-500'}`}
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>
                </button>
                <button
                  onClick={() => setLiked(liked === false ? null : false)}
                  className={`px-3 py-1.5 transition-colors ${liked === false ? 'bg-red-50 text-red-600' : 'hover:bg-gray-50 text-gray-500'}`}
                >
                  <svg className="w-4 h-4 fill-current rotate-180" viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>
                </button>
              </div>
            </div>
          </div>

          {/* ================= TRANSCRIPT SECTION ================= */}
          <div className="mt-6 flex-1">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-800">Class Transcript</h3>
              <select className="border border-gray-300 rounded-lg text-xs font-semibold px-2.5 py-1 bg-white text-gray-700 outline-none">
                <option>English</option>
              </select>
            </div>

            {/* Scrollable list of interactive transcripts */}
            <div className="space-y-4 max-w-3xl pr-4">
              {transcriptLines.map((line, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSeek(line.seconds)}
                  className="group flex gap-4 p-2 rounded-lg hover:bg-blue-50/40 cursor-pointer border border-transparent hover:border-blue-100/55 transition-all"
                >
                  <span className="text-[11px] font-bold font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded h-fit shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                    {line.time}
                  </span>
                  <p className="text-xs text-gray-600 leading-relaxed font-medium group-hover:text-gray-800">
                    {line.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ===== COLUMN 3: RIGHT SIDEBAR — NOTES PANEL ===== */}
        <aside className={`${rightSidebarOpen ? 'w-[300px] min-w-[300px]' : 'w-0 min-w-0'} h-full bg-white border-l border-gray-200 flex flex-col transition-all duration-300 overflow-hidden z-20`}>
          <div className="p-4 border-b border-gray-200 shrink-0 bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Class Notes</h3>
            <span className="text-[10px] text-gray-500 font-bold bg-white px-2 py-0.5 border border-gray-200 rounded">{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
          </div>

          {/* New Note Form */}
          <div className="p-4 border-b border-gray-200 shrink-0 bg-white space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] font-bold text-gray-500">Timestamp</label>
              <input
                type="text"
                value={noteTime}
                onChange={(e) => setNoteTime(e.target.value)}
                placeholder="e.g. 1:15"
                className="w-16 px-2 py-1 text-xs border border-gray-300 rounded text-center font-bold text-gray-700 outline-none focus:border-blue-600"
              />
            </div>
            
            <textarea
              ref={noteInputRef}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Type your lecture notes here..."
              rows={3}
              className="w-full p-2.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-600 text-gray-700 resize-none font-medium"
            />

            <button
              onClick={handleSaveNote}
              disabled={!noteText.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-xs shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Save Note
            </button>
          </div>

          {/* Saved Notes List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-gray-50/30">
            {notes.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center p-4 space-y-3">
                {/* Notes Empty State Icon */}
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-gray-700">No notes saved</h4>
                  <p className="text-[10px] text-gray-400">Save timestamped notes to review important highlights later.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm relative group/note">
                    <div className="flex items-center justify-between mb-1.5">
                      <button
                        onClick={() => handleSeek(note.timeSeconds)}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded cursor-pointer hover:bg-blue-100/70 transition-all flex items-center gap-1"
                      >
                        <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        {note.timeString}
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-700 leading-normal break-words font-medium pr-2">
                      {note.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

      </div>

      {/* Custom scrollbar and styling overrides */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.5);
        }
      `}</style>
    </main>
  );
}

export default function RecordingPlayerPage() {
  return (
    <Suspense fallback={
      <main className="fixed inset-0 w-screen h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-700 z-50">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-gray-500 animate-pulse uppercase tracking-wider">Establishing secure connection...</p>
      </main>
    }>
      <RecordingPlayer />
    </Suspense>
  );
}
