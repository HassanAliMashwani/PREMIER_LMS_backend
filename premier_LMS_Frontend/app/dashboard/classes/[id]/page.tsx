'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useModal } from '@/lib/ModalContext';
import ZoomPlayer from '@/components/zoom/ZoomPlayer';
import { io } from 'socket.io-client';
import Cookies from 'js-cookie';

// ─── Types ───────────────────────────────────────────────────────────────────
interface ZoomCredentials {
  zoomMeetingId: string;
  zoomPasscode: string;
  signature: string;
  sdkKey: string;
  userName: string;
  userRole: string;
  isModerator: boolean;
  allowStudentMic: boolean;
  allowStudentCamera: boolean;
  allowStudentScreenshare: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function ClassroomPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { showAlert } = useModal();
  const isAdmin = user?.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState<ZoomCredentials | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [zoomClient, setZoomClient] = useState<any>(null);
  const zoomClientRef = useRef<any>(null);
  const [isMicAllowed, setIsMicAllowed] = useState(true);

  // Real-time Virtual Classroom states
  const [socket, setSocket] = useState<any>(null);
  const [isWaiting, setIsWaiting] = useState(true);
  const [waitingList, setWaitingList] = useState<any[]>([]);
  const [participantList, setParticipantList] = useState<any[]>([]);
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<'stopped' | 'recording' | 'paused'>('stopped');

  const credentialsFetchedRef = useRef(false);

  // ─── Poll class status (students only) ─────────────────────────────────
  // Every 10 seconds, check if admin ended the class
  useEffect(() => {
    if (authLoading || !user || isAdmin || !id) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/classes/${id}`);
        if (data.status === 'completed') {
          clearInterval(interval);
          await showAlert('Lecture Ended', 'This lecture has been ended by the instructor.');
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Failed to poll class status:', err);
      }
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [id, isAdmin, authLoading, user, router, showAlert]);

  // ─── Fetch Zoom credentials from backend ───────────────────────────────
  useEffect(() => {
    if (authLoading || !user || !id) return;
    if (credentialsFetchedRef.current) return;
    credentialsFetchedRef.current = true;

    async function fetchCredentials() {
      try {
        const { data } = await api.get(`/classes/${id}/join`);
        setCredentials(data as ZoomCredentials);
        setIsMicAllowed(data.allowStudentMic);

        if (data.isModerator) {
          setIsWaiting(false); // Moderators bypass waiting room
          try {
            const liveStateRes = await api.get(`/classes/${id}/live-state`);
            setWaitingList(liveStateRes.data.waiting);
            setParticipantList(liveStateRes.data.active);
          } catch (e) {
            console.error("Failed to fetch initial live class state:", e);
          }
        }
        setLoading(false);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
          'Unable to join this classroom. Please verify the class status and try again.',
        );
        setLoading(false);
      }
    }

    fetchCredentials();
  }, [id, authLoading, user]);

  // ─── WebSocket Signaling Setup ─────────────────────────────────────────
  useEffect(() => {
    if (authLoading || !user || !id || !credentials) return;

    const token = Cookies.get('accessToken') || '';

    const socketUrl = window.location.protocol + '//' + window.location.hostname + ':3001';
    const socketInstance = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    setSocket(socketInstance);

    // Join room when server confirms handshake is complete
    socketInstance.on('ready', () => {
      socketInstance.emit('join-classroom', { classId: id });
    });

    // Handle waiting state for students
    socketInstance.on('permission-update', (data: any) => {
      if (!user || data.userId !== user.id) return;

      if (data.waiting === true) {
        setIsWaiting(true);
      } else if (data.waiting === false) {
        setIsWaiting(false);
      }

      if (data.message) {
        showAlert('Host Action', data.message);
      }
    });

    socketInstance.on('waiting-approved', () => {
      setIsWaiting(false); // Automatically un-blocks the ZoomPlayer component
      socketInstance.emit('join-classroom', { classId: id }); // Re-emit to record attendance as Active
    });

    socketInstance.on('waiting-rejected', () => {
      setIsWaiting(false);
      setError('Your request to join this classroom was rejected by the instructor.');
    });

    socketInstance.on('kicked', (data: any) => {
      if (!user || data.userId !== user.id) return;

      // Zoom Web SDK cleanup
      if (zoomClientRef.current) {
        try {
          zoomClientRef.current.leaveMeeting();
        } catch (e) { }
      }
      setIsWaiting(true);
      setError('You have been kicked from the classroom. You have been placed back in the waiting room.');
    });

    socketInstance.on('banned', (data: any) => {
      if (!user || data.userId !== user.id) return;

      if (zoomClientRef.current) {
        try {
          zoomClientRef.current.leaveMeeting();
        } catch (e) { }
      }
      setIsWaiting(false);
      setError('You have been permanently banned from this classroom.');
      // Optionally redirect them away completely
      setTimeout(() => {
        window.location.href = '/dashboard/classes';
      }, 3000);
    });

    // Hosts / Co-hosts listeners
    if (credentials.isModerator) {
      socketInstance.on('waiting-update', (student: any) => {
        setWaitingList((prev) => {
          if (prev.some((s) => s.userId === student.userId)) return prev;
          return [...prev, student];
        });
      });

      socketInstance.on('student-joined', (student: any) => {
        setParticipantList((prev) => {
          if (prev.some((p) => p.userId === student.userId)) return prev;
          return [...prev, student];
        });
      });

      socketInstance.on('student-left', (student: any) => {
        setParticipantList((prev) => prev.filter((p) => p.userId !== student.userId));
        setWaitingList((prev) => prev.filter((s) => s.userId !== student.userId));
      });

      socketInstance.on('request-to-speak', (student: any) => {
        showAlert('Request to Speak', `${student.name} requested permission to speak.`);
      });
    }

    // Recording status sync
    socketInstance.on('recording-started', (data: any) => {
      if (data?.fallback) {
        showAlert('Recording Notice', 'Please use the "Record" button on the Zoom toolbar to manage recording.');
      } else {
        setRecordingStatus('recording');
        if (data?.message) showAlert('Recording Started', data.message);
      }
    });
    socketInstance.on('recording-stopped', (data: any) => {
      if (!data?.fallback) setRecordingStatus('stopped');
    });
    socketInstance.on('recording-paused', (data: any) => {
      if (!data?.fallback) setRecordingStatus('paused');
    });
    socketInstance.on('recording-resumed', (data: any) => {
      if (!data?.fallback) setRecordingStatus('recording');
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [id, authLoading, user, credentials]);

  // ─── Classroom Management Actions ─────────────────────────────────────
  const handleAdmitStudent = (studentId: string) => {
    if (!socket) return;
    socket.emit('admit-student', { classId: id, studentId });
    setWaitingList((prev) => prev.filter((s) => s.userId !== studentId));
  };

  const handleRejectStudent = (studentId: string) => {
    if (!socket) return;
    socket.emit('reject-student', { classId: id, studentId });
    setWaitingList((prev) => prev.filter((s) => s.userId !== studentId));
  };

  const handleKickStudent = (studentId: string) => {
    if (!socket) return;
    socket.emit('kick-student', { classId: id, studentId });
    setParticipantList((prev) => prev.filter((p) => p.userId !== studentId));
  };

  const handleBanStudent = (studentId: string) => {
    if (!socket) return;
    socket.emit('ban-student', { classId: id, studentId, reason: 'Banned by host' });
    setParticipantList((prev) => prev.filter((p) => p.userId !== studentId));
  };

  const handleToggleMicLock = (studentId: string, currentLock: boolean) => {
    if (!socket) return;
    socket.emit('toggle-mic-lock', { classId: id, studentId, lock: !currentLock });
  };

  const handleToggleCameraLock = (studentId: string, currentLock: boolean) => {
    if (!socket) return;
    socket.emit('toggle-camera-lock', { classId: id, studentId, lock: !currentLock });
  };

  const handleToggleScreenshareLock = (studentId: string, currentLock: boolean) => {
    if (!socket) return;
    socket.emit('toggle-screenshare-lock', { classId: id, studentId, lock: !currentLock });
  };

  const handleControlRecording = (action: 'start' | 'pause' | 'resume' | 'stop') => {
    if (!socket) return;
    socket.emit('control-recording', { classId: id, action });
  };

  // ─── Exit handler ──────────────────────────────────────────────────────
  const handleExit = async (endClass: boolean) => {
    if (endClass) {
      try {
        await api.patch(`/classes/${id}`, { status: 'completed' });
      } catch (err) {
        console.error('Failed to end class:', err);
      }
    }
    router.push(isAdmin ? '/admin/classes' : '/dashboard');
  };

  // ─── Zoom callbacks ────────────────────────────────────────────────────
  const handleMeetingEnd = () => {
    if (isAdmin) {
      router.push('/admin/classes');
    } else {
      router.push('/dashboard');
    }
  };

  const handleZoomError = (message: string) => {
    setError(message);
  };

  const handleToggleMicPermission = async () => {
    if (!zoomClient || !credentials) return;
    const newSetting = !isMicAllowed;
    try {
      // client.muteAll(true) mutes all and locks unmute.
      // client.muteAll(false) allows participants to unmute.
      await zoomClient.muteAll(!newSetting);

      // Update database status so late joiners match
      await api.patch(`/classes/${id}`, { allowStudentMic: newSetting });

      setIsMicAllowed(newSetting);
      showAlert("Permission Updated", newSetting ? "Students are now allowed to unmute." : "All students are muted and locked.");
    } catch (err) {
      console.error("Failed to update mic permission:", err);
      showAlert("Error", "Failed to update microphone permission.");
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <main className="fixed inset-0 w-screen h-screen bg-black z-50 overflow-hidden flex flex-col">
      {/* Floating Header Actions */}
      <div className="absolute top-4 left-4 z-[9999] flex items-center gap-3">
        <button
          onClick={() => {
            if (isAdmin) {
              setShowExitDialog(true);
            } else {
              handleExit(false);
            }
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-black/60 hover:bg-black border border-white/10 rounded-lg backdrop-blur-md shadow-lg transition-all duration-200 no-underline cursor-pointer"
        >
          <svg className="w-4 h-4 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="hover:text-[#c9a84c] transition-colors duration-200 font-medium">Exit Classroom</span>
        </button>

        {credentials && credentials.isModerator && (
          <button
            onClick={() => {
              const inviteMsg = `Join our Live Lecture: "${credentials.userName}"\n` +
                `Class Link: ${window.location.origin}/dashboard/classes/${id}\n\n` +
                `Direct Zoom Credentials:\n` +
                `Meeting ID: ${credentials.zoomMeetingId}\n` +
                `Passcode: ${credentials.zoomPasscode}`;
              navigator.clipboard.writeText(inviteMsg);
              showAlert("Invite Copied", "Meeting invitation details copied to clipboard!");
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-black/60 hover:bg-black border border-white/10 rounded-lg backdrop-blur-md shadow-lg transition-all duration-200 no-underline cursor-pointer"
          >
            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span className="hover:text-emerald-400 transition-colors duration-200 font-medium">Invite Students</span>
          </button>
        )}

        {credentials && credentials.isModerator && (
          <button
            onClick={() => setShowControlPanel(!showControlPanel)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-black/60 hover:bg-black border border-white/10 rounded-lg backdrop-blur-md shadow-lg transition-all duration-200 no-underline cursor-pointer"
          >
            <svg className="w-4 h-4 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="hover:text-[#c9a84c] transition-colors duration-200 font-medium">Host Panel</span>
          </button>
        )}
      </div>

      {/* Loading state — before credentials arrive */}
      {loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-[#0a1f17] to-black z-40 gap-4 text-white">
          <div className="w-10 h-10 border-4 border-[#c9a84c]/20 border-t-[#c9a84c] rounded-full animate-spin" />
          <p className="text-sm text-gray-300 font-medium animate-pulse">Preparing secure live connection…</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-40 gap-4 bg-black text-white">
          <div className="w-12 h-12 rounded-full bg-red-950 flex items-center justify-center text-red-500 font-bold text-xl border border-red-500/30">
            !
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="font-bold text-lg text-red-400">Unable to Connect</h3>
            <p className="text-sm text-gray-400">{error}</p>
          </div>
          <button
            onClick={() => handleExit(false)}
            className="btn-signup cursor-pointer px-5 py-2.5 text-sm font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      )}

      {/* Student Waiting Room Overlay */}
      {isWaiting && !error && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-[#0a1c14] to-black text-white p-6">
          <div className="relative flex flex-col items-center space-y-6 max-w-md text-center">
            {/* Pulsing secure lock */}
            <div className="w-16 h-16 rounded-full bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.15)] animate-pulse">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold tracking-tight">Waiting for Host Approval</h2>
              <p className="text-sm text-gray-400 leading-relaxed font-medium">
                The live class instructor will admit you shortly. Please wait in this secure lobby.
              </p>
            </div>

            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Attendee:</span>
                <span className="font-semibold text-gray-200">{user?.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Email:</span>
                <span className="font-semibold text-gray-200">{user?.email}</span>
              </div>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="px-5 py-2.5 bg-neutral-900 border border-white/10 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-all duration-200 cursor-pointer shadow-lg"
            >
              Cancel & Leave
            </button>
          </div>
        </div>
      )}

      {/* Host Control Panel Sidebar Drawer */}
      {credentials && credentials.isModerator && showControlPanel && (
        <div className="absolute right-0 top-0 bottom-0 w-80 z-[10000] bg-black/90 border-l border-white/10 backdrop-blur-md text-white shadow-2xl flex flex-col animate-slide-in">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-accent-gold">Host Control Panel</h3>
            <button
              onClick={() => setShowControlPanel(false)}
              className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Cloud Recording Control Block */}
            <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Cloud Recording</h4>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${recordingStatus === 'recording' ? 'bg-red-500 animate-ping' : recordingStatus === 'paused' ? 'bg-amber-500' : 'bg-gray-500'
                  }`} />
                <span className="text-xs font-semibold capitalize text-gray-300">
                  Status: {recordingStatus}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1.5">
                {recordingStatus === 'stopped' ? (
                  <button
                    onClick={() => handleControlRecording('start')}
                    className="col-span-2 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-[11px] transition-all duration-200 cursor-pointer text-center"
                  >
                    Start Recording
                  </button>
                ) : (
                  <>
                    {recordingStatus === 'recording' ? (
                      <button
                        onClick={() => handleControlRecording('pause')}
                        className="py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-[11px] transition-all duration-200 cursor-pointer text-center"
                      >
                        Pause
                      </button>
                    ) : (
                      <button
                        onClick={() => handleControlRecording('resume')}
                        className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] transition-all duration-200 cursor-pointer text-center"
                      >
                        Resume
                      </button>
                    )}
                    <button
                      onClick={() => handleControlRecording('stop')}
                      className="py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl text-[11px] transition-all duration-200 cursor-pointer text-center border border-white/10"
                    >
                      Stop
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Waiting Room Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Waiting Room ({waitingList.length})</h4>
              {waitingList.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No students waiting</p>
              ) : (
                <div className="space-y-2">
                  {waitingList.map((s) => (
                    <div key={s.userId} className="flex items-center justify-between bg-white/5 border border-white/5 p-2 rounded-xl">
                      <span className="text-xs font-medium truncate max-w-[120px]">{s.name}</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleAdmitStudent(s.userId)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition-all duration-200 cursor-pointer"
                        >
                          Admit
                        </button>
                        <button
                          onClick={() => handleRejectStudent(s.userId)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[10px] transition-all duration-200 cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Joined Participants Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Students ({participantList.length})</h4>
              {participantList.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No active students</p>
              ) : (
                <div className="space-y-2">
                  {participantList.map((p) => (
                    <div key={p.userId} className="flex flex-col gap-2 bg-white/5 border border-white/5 p-3 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold truncate max-w-[140px] text-gray-200">
                          {p.name} {p.userId === user?.id && <span className="text-gray-500 font-normal ml-1">(You)</span>}
                        </span>
                        {p.userId !== user?.id && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleKickStudent(p.userId)}
                              className="px-1.5 py-0.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 text-[9px] font-bold rounded cursor-pointer"
                            >
                              Kick
                            </button>
                            <button
                              onClick={() => handleBanStudent(p.userId)}
                              className="px-1.5 py-0.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-[9px] font-bold rounded cursor-pointer"
                            >
                              Ban
                            </button>
                          </div>
                        )}
                      </div>
                      {/* Permission Toggles */}
                      {p.userId !== user?.id && (
                        <div className="flex justify-between items-center border-t border-white/5 pt-2">
                          <span className="text-[10px] font-semibold text-gray-400">Permissions</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToggleMicLock(p.userId, false)}
                              className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white cursor-pointer"
                              title="Toggle Mic Access"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleToggleCameraLock(p.userId, false)}
                              className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white cursor-pointer"
                              title="Toggle Camera Access"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleToggleScreenshareLock(p.userId, false)}
                              className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white cursor-pointer"
                              title="Toggle Screen Share"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Waiting Room Overlay for Students */}
      {isWaiting && !error && credentials && !credentials.isModerator && (
        <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#0a0a0a] text-white">
          <div className="w-12 h-12 border-4 border-brand-green/30 border-t-brand-green rounded-full animate-spin mb-6" />
          <h2 className="text-xl font-bold mb-2 text-center">Waiting for the instructor to admit you</h2>
          <p className="text-sm text-gray-400 text-center max-w-md px-6">
            You are currently in the waiting room. The live class will begin as soon as the host admits you.
          </p>
        </div>
      )}

      {/* Zoom Component View — rendered once credentials are available and not waiting */}
      {!loading && !error && credentials && !isWaiting && (
        <ZoomPlayer
          sdkKey={credentials.sdkKey}
          signature={credentials.signature}
          meetingNumber={credentials.zoomMeetingId}
          password={credentials.zoomPasscode}
          userName={
            credentials.isModerator
              ? `${credentials.userName} (Instructor)`
              : credentials.userName
          }
          userEmail={user?.email || ''}
          userId={user?.id}
          isModerator={credentials.isModerator}
          socket={socket}
          onInit={(client) => {
            setZoomClient(client);
            zoomClientRef.current = client;
          }}
          onMeetingEnd={handleMeetingEnd}
          onError={handleZoomError}
        />
      )}

      {/* Host Control Panel at the bottom */}
      {credentials && credentials.isModerator && zoomClient && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[9999] bg-black/85 border border-white/10 px-6 py-3.5 rounded-2xl backdrop-blur-md shadow-2xl flex items-center gap-6 text-white max-w-sm w-full">
          <div className="flex flex-col flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent-gold">Class Control Panel</span>
            <span className="text-[11px] text-gray-300 mt-0.5">Manage live student permissions</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleMicPermission}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${isMicAllowed
                  ? "bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-400 border border-emerald-500/20"
                  : "bg-red-600/20 hover:bg-red-600/35 text-red-400 border border-red-500/20"
                }`}
            >
              {isMicAllowed ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span>Student Mic: ON</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                  <span>Student Mic: MUTED</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Exit Confirmation Dialog (Admin only) */}
      {showExitDialog && isAdmin && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/55 backdrop-blur-md">
          <div className="relative bg-[#0f1d18]/70 border border-white/15 backdrop-blur-xl p-6 rounded-2xl w-full max-w-sm mx-4 text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] space-y-4 animate-scale-up">
            {/* Glowing top light */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

            <h3 className="font-extrabold text-base text-red-400 flex items-center gap-2 uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Exit Classroom
            </h3>
            <p className="text-sm text-gray-200/90 leading-relaxed font-medium">
              Do you want to end this live class for all students, or just leave the classroom?
            </p>
            <div className="flex flex-col gap-2.5 pt-2 border-t border-white/10">
              <button
                onClick={() => handleExit(true)}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all duration-200 cursor-pointer shadow-[0_0_12px_rgba(220,38,38,0.25)] hover:shadow-[0_0_18px_rgba(220,38,38,0.4)]"
              >
                End Class for All
              </button>
              <button
                onClick={() => handleExit(false)}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl text-sm transition-all duration-200 cursor-pointer"
              >
                Just Leave
              </button>
              <button
                onClick={() => setShowExitDialog(false)}
                className="px-4 py-2.5 bg-transparent border border-white/10 hover:border-white/20 hover:bg-white/5 text-gray-300 font-bold rounded-xl text-sm transition-all duration-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
