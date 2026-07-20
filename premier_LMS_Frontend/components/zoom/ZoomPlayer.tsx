'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import Cookies from 'js-cookie';
import { io } from 'socket.io-client';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface ZoomPlayerProps {
  sdkKey: string;
  signature: string;
  meetingNumber: string;
  password: string;
  userName: string;
  userEmail?: string;
  userId?: string;
  isModerator: boolean;
  /**
   * Zoom Access Token (ZAK) — required for the host to claim host privileges
   * inside the meeting (Admit buttons, waiting-room management, mute-all).
   * Only pass this for moderators. Fetched fresh from the backend on each join.
   */
  zak?: string;
  /** Shared socket from parent to reuse */
  socket?: any;
  /** Called when client is successfully initialized and joined */
  onInit?: (client: any) => void;
  /** Called when user leaves / meeting ends naturally */
  onMeetingEnd?: () => void;
  /** Called on fatal init/join errors */
  onError?: (message: string) => void;
}

type ZoomStatus =
  | 'loading'    // dynamic import in progress
  | 'joining'    // client.init + client.join in progress
  | 'connected'  // successfully joined the meeting
  | 'error';     // something went wrong

// ─── Component ───────────────────────────────────────────────────────────────
function ZoomPlayer({
  sdkKey,
  signature,
  meetingNumber,
  password,
  userName,
  userEmail,
  userId,
  isModerator,
  zak,
  socket,
  onInit,
  onMeetingEnd,
  onError,
}: ZoomPlayerProps) {
  const mountedRef = useRef(true);
  const isInitializingRef = useRef(false);
  const isConnectedRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [status, setStatus] = useState<ZoomStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [userIp, setUserIp] = useState<string>('Loading IP...');
  const [watermarkPos, setWatermarkPos] = useState({ x: 20, y: 30, opacity: 0.15 });
  const [isRecordingActive, setIsRecordingActive] = useState(false);

  // 1. Fetch Student's Public IP on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchIp() {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        if (isMounted) {
          setUserIp(data.ip || 'Unknown IP');
        }
      } catch (err) {
        if (isMounted) {
          setUserIp('IP Unavailable');
        }
      }
    }
    fetchIp();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Style Injection & Cleanup effect
  useEffect(() => {
    // Inject styles for Client View root
    const styleEl = document.createElement('style');
    styleEl.id = 'zoom-client-view-styles';
    styleEl.innerHTML = `
      #zmmtg-root {
        display: block !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 9999 !important;
        background-color: black !important;
        overflow: auto !important;
      }
      body {
        overflow: hidden !important;
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      // Cleanup styles
      const style = document.getElementById('zoom-client-view-styles');
      if (style) {
        style.remove();
      }
      // Explicitly hide/reset the injected zmmtg-root
      const rootEl = document.getElementById('zmmtg-root');
      if (rootEl) {
        rootEl.style.display = 'none';
      }
    };
  }, []);

  // 3. Block Developer Tools, Keyboard Shortcuts, and Right-clicks
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMetaOrCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const isAlt = e.altKey;

      // F12 key
      if (e.key === 'F12') {
        e.preventDefault();
        alert('Developer tools are disabled to protect copyright content.');
        return;
      }

      // Check standard inspection combinations: Ctrl+Shift+I / J / C, Ctrl+U
      // Mac counterparts use Cmd+Option+I / J / C, Cmd+Option+U
      const isDevToolsCombination =
        (isMetaOrCtrl && isShift && (e.key === 'i' || e.key === 'I' || e.key === 'j' || e.key === 'J' || e.key === 'c' || e.key === 'C')) ||
        (isMetaOrCtrl && (e.key === 'u' || e.key === 'U')) ||
        (isMetaOrCtrl && isAlt && (e.key === 'i' || e.key === 'I' || e.key === 'j' || e.key === 'J' || e.key === 'c' || e.key === 'C' || e.key === 'u' || e.key === 'U'));

      if (isDevToolsCombination) {
        e.preventDefault();
        alert('Developer tools and view-source shortcuts are disabled to protect copyright content.');
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 4. Update watermark coordinates and opacity randomly every 6 seconds
  useEffect(() => {
    if (status !== 'connected') return;

    const interval = setInterval(() => {
      const x = Math.floor(Math.random() * 60) + 20; // 20% to 80%
      const y = Math.floor(Math.random() * 60) + 20;
      const opacity = parseFloat((Math.random() * 0.14 + 0.08).toFixed(3)); // Opacity between 0.08 and 0.22
      setWatermarkPos({ x, y, opacity });
    }, 6000);

    return () => clearInterval(interval);
  }, [status]);

  // 6. Connect WebSockets for real-time permissions & recording states sync
  useEffect(() => {
    if (status !== 'connected') return;

    let socketInstance = socket;
    let isLocalSocket = false;

    if (!socketInstance) {
      const token = Cookies.get('accessToken') || '';
      const socketUrl = window.location.protocol + '//' + window.location.hostname + ':3001';
      socketInstance = io(socketUrl, {
        auth: { token },
        transports: ['websocket'],
      });
      socketInstance.emit('join-classroom', { classId: meetingNumber });
      isLocalSocket = true;
    }

    const handlePermissionUpdate = (data: any) => {
      if (data.userId === 'all' || data.userId === userId) {
        if (data.allowMic === false) {
          console.warn('[ZoomPlayer] Locked mic by host.');
        }
        if (data.allowCamera === false) {
          console.warn('[ZoomPlayer] Locked camera by host.');
        }
      }
    };

    const handleRecordingStarted = () => setIsRecordingActive(true);
    const handleRecordingStopped = () => setIsRecordingActive(false);
    const handleRecordingPaused = () => setIsRecordingActive(false);
    const handleRecordingResumed = () => setIsRecordingActive(true);

    const handleHostEndedSession = (data: any) => {
      alert(data.message || 'Host ended the class.');
      onMeetingEnd?.();
    };

    socketInstance.on('permission-update', handlePermissionUpdate);
    socketInstance.on('recording-started', handleRecordingStarted);
    socketInstance.on('recording-stopped', handleRecordingStopped);
    socketInstance.on('recording-paused', handleRecordingPaused);
    socketInstance.on('recording-resumed', handleRecordingResumed);
    socketInstance.on('host-ended-session', handleHostEndedSession);

    return () => {
      socketInstance.off('permission-update', handlePermissionUpdate);
      socketInstance.off('recording-started', handleRecordingStarted);
      socketInstance.off('recording-stopped', handleRecordingStopped);
      socketInstance.off('recording-paused', handleRecordingPaused);
      socketInstance.off('recording-resumed', handleRecordingResumed);
      socketInstance.off('host-ended-session', handleHostEndedSession);

      if (isLocalSocket) {
        socketInstance.disconnect();
      }
    };
  }, [status, meetingNumber, userId, onMeetingEnd, socket]);

  const handleError = (msg: string) => {
    if (!mountedRef.current) return;
    setStatus('error');
    setErrorMessage(msg);
    onError?.(msg);
  };

  // 7. Draw dynamic Canvas watermark
  const drawWatermark = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (status !== 'connected') return;

    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${watermarkPos.opacity})`;
    ctx.font = 'bold 12px monospace';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    const lines = [
      userName,
      userEmail || 'Student',
      `ID: ${userId || 'N/A'}`,
      `IP: ${userIp}`,
      `Session: ${meetingNumber}`,
      `Time: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    ];

    // Compute pixel coordinates from random percentages
    const pxX = (watermarkPos.x / 100) * canvas.width;
    const pxY = (watermarkPos.y / 100) * canvas.height;

    let currentY = pxY;
    lines.forEach((line) => {
      const textWidth = ctx.measureText(line).width;
      ctx.fillText(line, pxX - textWidth / 2, currentY);
      currentY += 16;
    });

    ctx.restore();
  }, [status, watermarkPos, userName, userEmail, userId, userIp, meetingNumber]);

  // 8. Watch for window resize and orientation changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawWatermark();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [drawWatermark]);

  // 9. Re-draw watermark when canvas element mounts or inputs update
  useEffect(() => {
    if (status === 'connected') {
      drawWatermark();
    }
  }, [status, drawWatermark]);

  // 10. Main client view initialization effect
  useEffect(() => {
    if (isInitializingRef.current || isConnectedRef.current) return;
    isInitializingRef.current = true;
    mountedRef.current = true;

    async function initAndJoin() {
      try {
        // Dynamic import to bypass SSR
        const { ZoomMtg } = await import('@zoom/meetingsdk');

        ZoomMtg.setZoomJSLib('https://source.zoom.us/6.2.0/lib', '/av');
        ZoomMtg.preLoadWasm();
        ZoomMtg.prepareWebSDK();

        setStatus('joining');

        ZoomMtg.init({
          leaveUrl: isModerator
            ? `${window.location.origin}/admin/classes`
            : `${window.location.origin}/dashboard`,

          // ── Screen sharing: host-only ────────────────────────────────────────
          // screenShare: 1 shows the share button; 0 hides it entirely for
          // non-host participants, preventing students from attempting to share.
          screenShare: isModerator ? true : false,

          // Ensure the full participant management panel renders for the host.
          // Without isSupportAV the SDK may suppress host-only controls
          // such as the waiting-room admit panel and per-user mute buttons.
          isSupportAV: true,

          // Collapse the audio panel by default — reduces student UI noise.
          audioPanelAlwaysOpen: false,

          success: () => {
            // ── Build join parameters ──────────────────────────────────────────
            // The zak (Zoom Access Token) is passed only for the host/moderator.
            // It is what causes Zoom's backend to actually grant host privileges
            // inside the meeting — without it, role:1 in the JWT only elevates
            // the SDK UI, but the Participants panel Admit buttons stay hidden.
            ZoomMtg.join({
              meetingNumber: meetingNumber,
              userName:      userName,
              signature:     signature,
              sdkKey:        sdkKey,
              userEmail:     userEmail || '',
              passWord:      password,
              // ZAK grants actual host role — enables Admit, waiting-room
              // management, mute-all, and all other host controls.
              // Only passed for the host/moderator.
              ...(isModerator && zak ? { zak } : {}),
              success: () => {
                setStatus('connected');
                isConnectedRef.current = true;
                onInit?.(null);

                // ── Host-only: waiting-room & participant join listeners ──────
                // These give the host console visibility into who is entering
                // (or stuck in) the Zoom waiting room, as a diagnostic tool.
                // onWaitingRoomParticipantJoin fires when Zoom's native waiting
                // room is active and a participant is held there.
                if (isModerator) {
                  // Cast event name to `any` because the Zoom SDK's type
                  // definitions only declare overloads for a narrow set of QoS
                  // events; waiting-room and join events are valid at runtime
                  // but not yet reflected in the shipped .d.ts types.
                  ZoomMtg.inMeetingServiceListener(
                    'onWaitingRoomParticipantJoin' as any,
                    (data: any) => {
                      console.info(
                        `[ZoomPlayer] 🚪 Participant entered Zoom waiting room:`,
                        data?.userId,
                        data?.displayName,
                      );
                    },
                  );

                  ZoomMtg.inMeetingServiceListener(
                    'onUserJoin' as any,
                    (data: any) => {
                      console.info(
                        `[ZoomPlayer] ✅ Participant joined the meeting:`,
                        data?.userId,
                        data?.displayName,
                      );
                    },
                  );
                }

                // ── Hard-mute guard (client-side enforcement layer) ──────────
                // The authoritative control is the Zoom meeting setting
                // `allow_participants_to_unmute: false` set via the REST API
                // (POST /v2/meetings → settings.allow_participants_to_unmute).
                //
                // This listener is a defense-in-depth layer: if a student
                // somehow unmutes themselves, we immediately re-mute them.
                // Fires within ~200 ms. Does NOT run for the host/moderator.
                if (!isModerator) {
                  ZoomMtg.inMeetingServiceListener(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    'onAudioStateChange' as any,
                    (data: any) => {
                      if (data?.muted === false) {
                        // Student unmuted — re-mute immediately
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (ZoomMtg as any).muteAudio({
                          mute: true,
                          success: () => {},
                          error: (e: any) =>
                            console.error('[ZoomPlayer] Re-mute failed:', e),
                        });
                      }
                    }
                  );
                }
              },
              error: (err: any) => {
                console.error('[Zoom] Join error:', err);
                handleError(err?.errorMessage || 'Failed to join the meeting.');
              },
            });
          },
          error: (err: any) => {
            console.error('[Zoom] Init error:', err);
            handleError(err?.errorMessage || 'Failed to initialize Zoom meeting.');
          },
        });
      } catch (err: any) {
        console.error('[Zoom] Initialization crashed:', err);
        handleError('Failed to initialize Zoom Client SDK.');
      } finally {
        isInitializingRef.current = false;
      }
    }

    initAndJoin();

    return () => {
      mountedRef.current = false;
      isConnectedRef.current = false;
    };
  }, [sdkKey, signature, meetingNumber, password, userName, userEmail, isModerator, onInit, onMeetingEnd]);

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="relative">
      {/* Loading Overlay */}
      {(status === 'loading' || status === 'joining') && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-[#0a1f17] to-black z-[10000] gap-4 text-white">
          <div className="w-10 h-10 border-4 border-[#c9a84c]/20 border-t-[#c9a84c] rounded-full animate-spin" />
          <p className="text-sm text-gray-300 font-medium animate-pulse">
            {status === 'loading'
              ? 'Loading video conferencing SDK…'
              : 'Joining secure meeting room…'}
          </p>
        </div>
      )}

      {/* Error Overlay */}
      {status === 'error' && (
        <div className="fixed inset-0 flex flex-col items-center justify-center p-6 text-center z-[10000] gap-4 bg-black text-white">
          <div className="w-12 h-12 rounded-full bg-red-950 flex items-center justify-center text-red-500 font-bold text-xl border border-red-500/30">
            !
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="font-bold text-lg text-red-400">
              Unable to Connect
            </h3>
            <p className="text-sm text-gray-400">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Screenshot protection forensic Canvas watermark */}
      {status === 'connected' && (
        <canvas
          ref={canvasRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 10000,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Recording Indicator */}
      {status === 'connected' && isRecordingActive && (
        <div className="fixed top-4 left-4 z-[10000] flex items-center gap-2 px-3 py-1.5 bg-black/60 border border-red-500/30 rounded-full backdrop-blur-md shadow-lg animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
          <span className="w-2.5 h-2.5 absolute rounded-full bg-red-600" />
          <span className="text-[10px] font-extrabold text-red-500 tracking-widest uppercase ml-1">REC</span>
        </div>
      )}
    </div>
  );
}

export default memo(ZoomPlayer);
