/**
 * POST /api/zoom/signature
 *
 * Generates the Zoom Meeting SDK HS256 JWT signature server-side.
 * This endpoint keeps ZOOM_SDK_KEY and ZOOM_SDK_SECRET off the client
 * entirely — they are read only from server environment variables and
 * are never included in any response payload.
 *
 * Request body:
 *   { meetingNumber: string, role: 0 | 1 }
 *     role 0 = participant (student)
 *     role 1 = host (moderator/admin)
 *
 * Response:
 *   200 { signature: string }
 *   400 { error: string }
 *   500 { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

// ─── Environment variable validation ────────────────────────────────────────
// Validated once at module load so a missing var surfaces immediately in
// server logs rather than silently producing invalid signatures.
const SDK_KEY = process.env.ZOOM_SDK_KEY;
const SDK_SECRET = process.env.ZOOM_SDK_SECRET;

if (!SDK_KEY || !SDK_SECRET) {
  console.error(
    '[zoom/signature] ⚠️  ZOOM_SDK_KEY or ZOOM_SDK_SECRET is not set. ' +
    'Signature generation will fail for all requests.',
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Base64URL-encodes a plain JavaScript object (serialised as JSON).
 * Produces URL-safe output with no padding chars, matching Zoom's
 * expected JWT segment format exactly.
 */
function base64UrlEncodeObject(obj: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Strips all non-digit characters from a meeting number string and
 * confirms at least one digit remains. Zoom meeting numbers are always
 * purely numeric (9–11 digits) but may arrive with spaces or dashes
 * from copy-paste.
 */
function normalizeMeetingNumber(raw: unknown): string {
  if (typeof raw !== 'string' && typeof raw !== 'number') {
    throw new RangeError('meetingNumber must be a string or number.');
  }
  const normalized = String(raw).replace(/\D/g, '');
  if (!normalized) {
    throw new RangeError(
      'meetingNumber contains no digits. Provide the numeric Zoom meeting ID.',
    );
  }
  return normalized;
}

/**
 * Builds and signs the Zoom Meeting SDK JWT using HS256.
 *
 * Zoom SDK JWT payload fields:
 *   appKey   — your SDK Key (same value as sdkKey; Zoom requires both)
 *   sdkKey   — your SDK Key
 *   mn       — meeting number as a Number (not string)
 *   role     — 0 (participant) | 1 (host)
 *   iat      — issued-at (Unix timestamp, 30 s in the past for clock skew)
 *   exp      — expiry  (iat + 2 hours; Zoom max is 48 h)
 *   tokenExp — must equal exp (Zoom SDK requirement)
 */
function generateZoomSignature(meetingNumber: string, role: 0 | 1): string {
  if (!SDK_KEY || !SDK_SECRET) {
    throw new Error('Zoom SDK credentials are not configured on the server.');
  }

  const iat = Math.floor(Date.now() / 1000) - 30; // 30 s grace for clock skew
  const exp = iat + 60 * 60 * 2;                  // 2-hour validity window

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    appKey:   SDK_KEY,
    sdkKey:   SDK_KEY,
    mn:       Number(meetingNumber), // Must be numeric, not a string
    role,
    iat,
    exp,
    tokenExp: exp,                   // Zoom SDK requires this to match exp
  };

  const headerEncoded  = base64UrlEncodeObject(header);
  const payloadEncoded = base64UrlEncodeObject(payload);
  const signingInput   = `${headerEncoded}.${payloadEncoded}`;

  const signature = createHmac('sha256', SDK_SECRET)
    .update(signingInput)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── 1. Parse request body ──────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body.' },
      { status: 400 },
    );
  }

  const { meetingNumber, role } = body;

  // ── 2. Validate inputs ─────────────────────────────────────────────────────
  if (meetingNumber === undefined || meetingNumber === null || meetingNumber === '') {
    return NextResponse.json(
      { error: 'meetingNumber is required.' },
      { status: 400 },
    );
  }

  if (role !== 0 && role !== 1) {
    return NextResponse.json(
      { error: 'role must be 0 (participant) or 1 (host).' },
      { status: 400 },
    );
  }

  // ── 3. Normalize meeting number ────────────────────────────────────────────
  let normalizedMeetingNumber: string;
  try {
    normalizedMeetingNumber = normalizeMeetingNumber(meetingNumber);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // ── 4. Generate signature ──────────────────────────────────────────────────
  try {
    const signature = generateZoomSignature(normalizedMeetingNumber, role as 0 | 1);
    return NextResponse.json({ signature }, { status: 200 });
  } catch (err: any) {
    console.error('[zoom/signature] Signature generation failed:', err.message);
    return NextResponse.json(
      { error: 'Failed to generate Zoom signature. Check server configuration.' },
      { status: 500 },
    );
  }
}

// Explicitly reject all other HTTP methods with a clear error
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed. Use POST.' }, { status: 405 });
}
