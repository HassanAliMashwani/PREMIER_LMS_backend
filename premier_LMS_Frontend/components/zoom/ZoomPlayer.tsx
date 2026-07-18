'use client';

import { useEffect, useRef, useState, memo } from 'react';
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
  socket,
  onInit,
  onMeetingEnd,
  onError,
}: ZoomPlayerProps) {
  const mountedRef = useRef(true);
  const isInitializingRef = useRef(false);
  const isConnectedRef = useRef(false);
  const [status, setStatus] = useState<ZoomStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [watermarkPos, setWatermarkPos] = useState({ x: 20, y: 30 });
  const [isRecordingActive, setIsRecordingActive] = useState(false);

  // Style Injection & Cleanup effect
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

  // Block right-clicks and Picture-in-Picture on component mount
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Update watermark coordinates randomly every 8 seconds
  useEffect(() => {
    if (status !== 'connected') return;

    const interval = setInterval(() => {
      const x = Math.floor(Math.random() * 70) + 10; // 10% to 80%
      const y = Math.floor(Math.random() * 70) + 10;
      setWatermarkPos({ x, y });
    }, 8000);

    return () => clearInterval(interval);
  }, [status]);

  // Connect WebSockets for real-time permissions & recording states sync
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
        // Microphone and Camera control in Client View is not programmatically accessible in the same way,
        // but we keep the warnings and socket structure for compatibility.
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

  // Main client view initialization effect
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
          success: () => {
            ZoomMtg.join({
              meetingNumber: meetingNumber,
              userName: userName,
              signature: signature,
              sdkKey: sdkKey,
              userEmail: userEmail || '',
              passWord: password,
              success: () => {
                setStatus('connected');
                isConnectedRef.current = true;
                onInit?.(null);
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

      {/* Screenshot protection watermark */}
      {status === 'connected' && (
        <div
          style={{
            position: 'fixed',
            left: `${watermarkPos.x}%`,
            top: `${watermarkPos.y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 10000,
            opacity: 0.18,
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
            textShadow: '1px 1px 2px #000000',
          }}
          className="transition-all duration-1000 ease-in-out pointer-events-none select-none flex flex-col items-center"
        >
          <span>{userName}</span>
          <span>{userEmail || 'Student'}</span>
          <span>Session: {meetingNumber}</span>
          <span>{new Date().toLocaleDateString()}</span>
        </div>
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
