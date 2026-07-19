/**
 * lib/zoomAPI.ts
 *
 * Zoom REST API utilities for Server-to-Server (S2S) OAuth.
 *
 * ⚠️  IMPORTANT — where to call these functions:
 *   These functions use ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and
 *   ZOOM_CLIENT_SECRET which are SECRET server-only variables.
 *   Only call them from:
 *     • Next.js API Routes  (app/api/...)
 *     • Next.js Server Actions (with "use server")
 *     • Next.js Server Components
 *   NEVER import or call these from a "use client" component or
 *   any module bundled into the browser bundle.
 *
 * Zoom Marketplace app requirements:
 *   App type  : Server-to-Server OAuth
 *   Scopes    : meeting:write:admin   (create / update / delete meetings)
 *               meeting:read:admin    (read meeting details for verification)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ZoomMeetingSettings {
  /** Mute all participants when they join. Default: true */
  mute_upon_entry?: boolean;
  /**
   * When false, participants CANNOT unmute themselves — only the host can.
   * This is the Layer 1 "hard mute" enforcement.
   * Default: false (enforced).
   */
  allow_participants_to_unmute?: boolean;
  /** Turn off waiting room so students can join via our own lobby system. */
  waiting_room?: boolean;
  /** Allow students to join before the host. */
  join_before_host?: boolean;
  /** Restrict screen sharing to host only. */
  screen_sharing?: boolean;
  /** Restrict in-meeting chat. */
  participant_sharing?: string;
  host_video?: boolean;
  participant_video?: boolean;
}

export interface CreateMeetingParams {
  /** Meeting topic / title shown to participants. */
  topic: string;
  /** Scheduled start time in UTC. */
  startTime: Date;
  /** Duration in minutes. */
  durationMinutes: number;
  /** Optional passcode override. Randomly generated if omitted. */
  passcode?: string;
  /** Override any of the default hard-mute settings. */
  settings?: Partial<ZoomMeetingSettings>;
}

export interface CreatedMeeting {
  meetingId: string;
  passcode: string;
  joinUrl: string;
  startUrl: string;
}

export interface ZoomTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

// ─── In-process token cache ───────────────────────────────────────────────────
// Avoids a round-trip to Zoom's OAuth endpoint on every meeting creation.
// Zoom S2S tokens are valid for 1 hour. We refresh 60 s early to be safe.
let _cachedToken: string | null = null;
let _tokenExpiresAt = 0;

// ─── 1. Get S2S OAuth Access Token ───────────────────────────────────────────

/**
 * Fetches a Zoom Server-to-Server OAuth access token.
 *
 * Reads credentials from environment variables:
 *   ZOOM_ACCOUNT_ID
 *   ZOOM_CLIENT_ID
 *   ZOOM_CLIENT_SECRET
 *
 * The token is cached in module scope and reused until 60 seconds
 * before expiry to prevent unnecessary requests.
 *
 * @throws Error if credentials are missing or Zoom rejects the request.
 */
export async function getZoomAccessToken(): Promise<string> {
  // ── Validate environment variables ────────────────────────────────────────
  const accountId     = process.env.ZOOM_ACCOUNT_ID;
  const clientId      = process.env.ZOOM_CLIENT_ID;
  const clientSecret  = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    throw new Error(
      '[zoomAPI] Missing Zoom S2S OAuth credentials. ' +
      'Ensure ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET ' +
      'are set in your .env.local file.',
    );
  }

  // ── Return cached token if still valid ────────────────────────────────────
  const now = Date.now();
  if (_cachedToken && _tokenExpiresAt > now + 60_000) {
    return _cachedToken;
  }

  // ── Request a fresh token ─────────────────────────────────────────────────
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `[zoomAPI] Zoom token request failed (HTTP ${response.status}): ${errorText}`,
    );
  }

  const data: ZoomTokenResponse = await response.json();

  // Cache the token (convert expires_in seconds → ms timestamp)
  _cachedToken     = data.access_token;
  _tokenExpiresAt  = Date.now() + data.expires_in * 1_000;

  console.info('[zoomAPI] ✅ Zoom S2S access token refreshed successfully.');
  return data.access_token;
}

// ─── 2. Create Zoom Meeting with Hard-Mute Enforcement ───────────────────────

/**
 * Creates a scheduled Zoom meeting via the Zoom REST API.
 *
 * Security defaults enforced for every classroom:
 *   • mute_upon_entry               = true   — everyone joins muted
 *   • allow_participants_to_unmute  = false  — ONLY the host can unmute (hard mute)
 *   • waiting_room                  = false  — our app manages the lobby
 *   • join_before_host              = true   — students can enter before the teacher
 *   • participant_sharing           = 'host' — only host can share screen
 *
 * You can override any setting via the `settings` parameter, but the
 * three mute-related fields are always enforced for security.
 *
 * @param params  Meeting topic, time, duration, and optional overrides.
 * @param hostEmail  Zoom user email of the meeting host (teacher account).
 * @returns         The created meeting's ID, passcode, and join/start URLs.
 * @throws Error    If the Zoom API call fails.
 */
export async function createZoomMeeting(
  params: CreateMeetingParams,
  hostEmail: string,
): Promise<CreatedMeeting> {
  if (!hostEmail) {
    throw new Error('[zoomAPI] hostEmail is required to create a Zoom meeting.');
  }

  const token = await getZoomAccessToken();

  // Generate a random 8-character alphanumeric passcode if not provided
  const passcode = params.passcode ?? Math.random().toString(36).substring(2, 10);

  // ── Merge defaults with caller-provided overrides ─────────────────────────
  // Security-critical settings (mute enforcement) are applied last and
  // CANNOT be overridden by the caller — they are always enforced.
  const mergedSettings: ZoomMeetingSettings = {
    // Sane classroom defaults
    host_video:        true,
    participant_video:  false,
    join_before_host:  true,
    waiting_room:      true,
    participant_sharing: 'host',  // Only host can screen share

    // Allow caller to tweak non-security settings
    ...params.settings,

    // ── HARD MUTE — these always override caller-provided values ──────────
    mute_upon_entry:              true,  // Everyone joins muted
    allow_participants_to_unmute: false, // Host must explicitly unmute each student
  };

  const meetingBody = {
    topic:      params.topic,
    type:       2,                              // 2 = Scheduled meeting
    start_time: params.startTime.toISOString(),
    duration:   params.durationMinutes,
    timezone:   'UTC',
    password:   passcode,
    settings:   mergedSettings,
  };

  console.info(
    `[zoomAPI] 📞 Creating Zoom meeting: "${params.topic}" ` +
    `at ${params.startTime.toISOString()} for host ${hostEmail}`,
  );

  const response = await fetch(
    `https://api.zoom.us/v2/users/${encodeURIComponent(hostEmail)}/meetings`,
    {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(meetingBody),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `[zoomAPI] Meeting creation failed (HTTP ${response.status}): ${errorText}\n` +
      `Common causes:\n` +
      `  • ZOOM_CLIENT_ID / ZOOM_CLIENT_SECRET are incorrect\n` +
      `  • The Zoom app is missing the 'meeting:write:admin' scope\n` +
      `  • hostEmail (${hostEmail}) does not exist in your Zoom account`,
    );
  }

  const data = await response.json();

  console.info(`[zoomAPI] ✅ Zoom meeting created. ID: ${data.id}`);

  // ── Post-creation verification ────────────────────────────────────────────
  // Zoom account-level settings can silently override per-meeting settings.
  // We log a warning so administrators know to fix their Zoom dashboard.
  await verifyMeetingSettings(token, data.id);

  return {
    meetingId: String(data.id),
    passcode,
    joinUrl:  data.join_url  ?? '',
    startUrl: data.start_url ?? '',
  };
}

// ─── 3. Post-creation Settings Verification ──────────────────────────────────

/**
 * GETs the newly created meeting back from Zoom and checks whether
 * Zoom's account-level policies silently overrode our requested settings.
 *
 * If overrides are detected, a clear warning is logged with exact steps
 * to fix the Zoom account settings.
 *
 * This is a best-effort check — failures here do not throw.
 */
async function verifyMeetingSettings(
  token: string,
  meetingId: number | string,
): Promise<void> {
  try {
    const res = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return;

    const data = await res.json();
    const s: Record<string, unknown> = data.settings ?? {};

    const checks: Array<{ key: string; expected: unknown; fix: string }> = [
      {
        key: 'allow_participants_to_unmute',
        expected: false,
        fix: 'Zoom Dashboard → Account Settings → In Meeting (Basic) → ' +
             '"Allow participants to unmute themselves" → Lock OFF.',
      },
      {
        key: 'mute_upon_entry',
        expected: true,
        fix: 'Zoom Dashboard → Account Settings → In Meeting (Basic) → ' +
             '"Mute participants upon entry" → Lock ON.',
      },
      {
        key: 'waiting_room',
        expected: true,
        fix: 'Zoom Dashboard → Account Settings → Security → ' +
             '"Waiting Room" → turn ON.',
      },
    ];

    for (const check of checks) {
      if (s[check.key] !== check.expected) {
        console.warn(
          `[zoomAPI] ⚠️  ZOOM ACCOUNT OVERRIDE DETECTED:\n` +
          `  Setting: ${check.key}\n` +
          `  We requested: ${check.expected}\n` +
          `  Zoom applied: ${s[check.key]}\n` +
          `  Fix: ${check.fix}`,
        );
      }
    }
  } catch (err: any) {
    console.warn(`[zoomAPI] Could not verify meeting settings: ${err.message}`);
  }
}

// ─── 4. Update Zoom Meeting Settings ─────────────────────────────────────────

/**
 * Patches an existing meeting to enforce hard-mute settings.
 * Useful for meetings created without the correct settings.
 *
 * @param meetingId  Numeric Zoom meeting ID.
 * @returns          true if the PATCH succeeded, false otherwise.
 */
export async function enforceHardMuteOnMeeting(
  meetingId: string | number,
): Promise<boolean> {
  try {
    const token = await getZoomAccessToken();

    const res = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      method: 'PATCH',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        settings: {
          mute_upon_entry:              true,
          allow_participants_to_unmute: false,
        },
      }),
    });

    if (res.ok || res.status === 204) {
      console.info(`[zoomAPI] ✅ Hard-mute enforced on meeting ${meetingId}.`);
      return true;
    }

    const err = await res.text();
    console.error(`[zoomAPI] ❌ Failed to enforce hard-mute (HTTP ${res.status}): ${err}`);
    return false;
  } catch (err: any) {
    console.error(`[zoomAPI] ❌ enforceHardMuteOnMeeting error: ${err.message}`);
    return false;
  }
}
