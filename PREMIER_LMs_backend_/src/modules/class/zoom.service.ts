import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class ZoomService {
  private readonly logger = new Logger(ZoomService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly accountId: string;
  private readonly sdkKey: string;
  private readonly sdkSecret: string;
  private readonly teacherEmail: string;

  // In-memory token cache to avoid hitting Zoom's token endpoint on every request
  private cachedToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('ZOOM_CLIENT_ID', '');
    this.clientSecret = this.configService.get<string>('ZOOM_CLIENT_SECRET', '');
    this.accountId = this.configService.get<string>('ZOOM_ACCOUNT_ID', '');
    this.sdkKey = this.configService.get<string>('ZOOM_SDK_KEY', '');
    this.sdkSecret = this.configService.get<string>('ZOOM_SDK_SECRET', '');
    this.teacherEmail = this.configService.get<string>('ZOOM_TEACHER_EMAIL', '');

    // Log config status at startup so missing vars are immediately visible
    if (!this.clientId || !this.clientSecret || !this.accountId) {
      this.logger.warn('⚠️  Zoom Server-to-Server OAuth credentials are NOT fully configured. Meeting auto-scheduling will fail.');
    }
    if (!this.teacherEmail) {
      this.logger.warn('⚠️  ZOOM_TEACHER_EMAIL is NOT set. Meeting auto-scheduling will fail.');
    }
    if (!this.sdkKey || !this.sdkSecret) {
      this.logger.warn('⚠️  Zoom Meeting SDK credentials are NOT set. Client-side joining will fail.');
    }
  }

  getClientId(): string {
    return this.clientId;
  }

  getSdkKey(): string {
    this.ensureSdkCredentials();
    return this.sdkKey;
  }

  normalizeMeetingNumber(meetingNumber: string): string {
    const normalized = String(meetingNumber || '').replace(/\D/g, '');
    if (!normalized) {
      throw new BadRequestException('Invalid Zoom meeting number. Please enter the numeric meeting ID.');
    }
    return normalized;
  }

  /**
   * Generates the Zoom Meeting SDK Signature (JWT HS256) server-side.
   */
  generateSignature(params: { meetingNumber: string; role: number }): string {
    this.ensureSdkCredentials();

    const meetingNumber = this.normalizeMeetingNumber(params.meetingNumber);
    const iat = Math.floor(Date.now() / 1000) - 30;
    const exp = iat + 60 * 60 * 2;

    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      appKey: this.sdkKey,
      sdkKey: this.sdkKey,
      mn: Number(meetingNumber),
      role: params.role,
      iat,
      exp,
      tokenExp: exp,
    };

    // [DEBUGGING ONLY] Log the exact requested values
    console.log('[DEBUG-BACKEND] --- ZOOM SIGNATURE GENERATION ---');
    console.log(`[DEBUG-BACKEND] mn: ${payload.mn} (type: ${typeof payload.mn})`);
    console.log(`[DEBUG-BACKEND] role: ${payload.role} (type: ${typeof payload.role})`);
    console.log(`[DEBUG-BACKEND] iat: ${payload.iat} (type: ${typeof payload.iat})`);
    console.log(`[DEBUG-BACKEND] exp: ${payload.exp} (type: ${typeof payload.exp})`);
    console.log(`[DEBUG-BACKEND] appKey length: ${payload.appKey?.length}, sdkKey length: ${payload.sdkKey?.length}`);
    console.log('[DEBUG-BACKEND] -----------------------------------');

    return this.signJWT(header, payload, this.sdkSecret);
  }

  private ensureSdkCredentials() {
    if (!this.sdkKey || this.sdkKey.trim() === '') {
      this.logger.error('ZOOM_SDK_KEY is missing or empty.');
      throw new InternalServerErrorException('Zoom Meeting SDK Key is not configured.');
    }
    if (!this.sdkSecret || this.sdkSecret.trim() === '') {
      this.logger.error('ZOOM_SDK_SECRET is missing or empty.');
      throw new InternalServerErrorException('Zoom Meeting SDK Secret is not configured.');
    }
  }

  /**
   * Helper function to manually sign a JWT using HS256 to avoid third-party library dependency issues.
   */
  private signJWT(header: any, payload: any, secret: string): string {
    const base64UrlEncode = (obj: any) => {
      return Buffer.from(JSON.stringify(obj))
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    };

    const headerEncoded = base64UrlEncode(header);
    const payloadEncoded = base64UrlEncode(payload);

    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${headerEncoded}.${payloadEncoded}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return `${headerEncoded}.${payloadEncoded}.${signature}`;
  }

  /**
   * Fetches Server-to-Server OAuth access token from Zoom token endpoint.
   * Caches the token in memory to prevent rate-limit issues.
   */
  async getAccessToken(): Promise<string | null> {
    // Return cached token if still valid (with 60-second buffer)
    const now = Date.now();
    if (this.cachedToken && this.tokenExpiresAt > now + 60_000) {
      return this.cachedToken;
    }

    if (!this.accountId || !this.clientId || !this.clientSecret) {
      this.logger.error('❌ Cannot get Zoom access token: ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, or ZOOM_ACCOUNT_ID is missing from .env');
      return null;
    }

    try {
      const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const response = await fetch('https://zoom.us/oauth/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'account_credentials',
          account_id: this.accountId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`❌ Zoom OAuth token request failed (HTTP ${response.status}): ${errorText}`);
        return null;
      }

      const data = await response.json();
      this.cachedToken = data.access_token;
      // expires_in is in seconds, convert to ms
      this.tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1_000;
      this.logger.log('✅ Zoom access token refreshed successfully.');
      return data.access_token;
    } catch (error: any) {
      this.logger.error(`❌ Failed to get Zoom OAuth token: ${error.message}`);
      return null;
    }
  }

  /**
   * Creates a Zoom Meeting automatically using Zoom API.
   * Uses the teacher email from ZOOM_TEACHER_EMAIL env var as the meeting host.
   */
  async createZoomMeeting(params: {
    topic: string;
    startTime: Date;
    durationMinutes: number;
  }): Promise<{ meetingId: string; passcode: string } | null> {
    const token = await this.getAccessToken();
    if (!token) {
      this.logger.warn('❌ Zoom Server-to-Server OAuth is not configured or token fetch failed. Auto-scheduling skipped.');
      return null;
    }

    // Check teacher email
    if (!this.teacherEmail) {
      this.logger.error('❌ ZOOM_TEACHER_EMAIL is not set in .env — cannot create meeting without a host email. Please add it and restart the server.');
      return null;
    }

    try {
      const passcode = Math.random().toString(36).substring(2, 10);

      this.logger.log(`📞 Calling Zoom API: POST /v2/users/${this.teacherEmail}/meetings`);
      this.logger.log(`   Topic: "${params.topic}", Start: ${params.startTime.toISOString()}, Duration: ${params.durationMinutes}min`);

      const response = await fetch(
        `https://api.zoom.us/v2/users/${encodeURIComponent(this.teacherEmail)}/meetings`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic: params.topic,
            type: 2, // Scheduled meeting
            start_time: params.startTime.toISOString(),
            duration: params.durationMinutes,
            timezone: 'UTC',
            password: passcode,
            settings: {
              host_video: true,
              participant_video: false,
              mute_upon_entry: true,
              waiting_room: false,
              join_before_host: true,
              participant_sharing: 'host',
            },
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`❌ Zoom meeting creation failed (HTTP ${response.status}): ${errorText}`);
        this.logger.error(`   ↳ This usually means: wrong ZOOM_TEACHER_EMAIL, missing scopes (meeting:write:admin), or the Zoom app is not activated.`);
        return null;
      }

      const data = await response.json();
      this.logger.log(`✅ Zoom meeting created successfully! ID: ${data.id}`);

      // Verification Step: GET the created meeting back to check if Zoom overrode our settings
      try {
        const verifyResponse = await fetch(`https://api.zoom.us/v2/meetings/${data.id}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          const actualSettings = verifyData.settings || {};
          if (actualSettings.waiting_room !== false) {
            this.logger.warn(`⚠️ ZOOM ACCOUNT SETTINGS OVERRIDE: We requested waiting_room=false, but Zoom forced it to ${actualSettings.waiting_room}. Please unlock this setting in your Zoom.us web dashboard.`);
          }
          if (actualSettings.join_before_host !== true) {
            this.logger.warn(`⚠️ ZOOM ACCOUNT SETTINGS OVERRIDE: We requested join_before_host=true, but Zoom forced it to ${actualSettings.join_before_host}. Please unlock this setting in your Zoom.us web dashboard.`);
          }
        }
      } catch (verifyErr: any) {
        this.logger.warn(`Could not verify Zoom meeting settings post-creation: ${verifyErr.message}`);
      }

      return {
        meetingId: String(data.id),
        passcode: passcode,
      };
    } catch (error: any) {
      this.logger.error(`❌ Error creating Zoom meeting: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Ends a running Zoom meeting via Zoom REST API.
   * This frees up the host's concurrent meeting slot.
   */
  async endZoomMeeting(meetingId: string): Promise<boolean> {
    const token = await this.getAccessToken();
    if (!token) {
      this.logger.warn('❌ Cannot end Zoom meeting: OAuth token unavailable.');
      return false;
    }

    const normalizedId = this.normalizeMeetingNumber(meetingId);

    try {
      this.logger.log(`🛑 Ending Zoom meeting ${normalizedId} via API...`);

      const response = await fetch(
        `https://api.zoom.us/v2/meetings/${normalizedId}/status`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'end' }),
        },
      );

      if (response.status === 204 || response.status === 200) {
        this.logger.log(`✅ Zoom meeting ${normalizedId} ended successfully.`);
        return true;
      }

      // 404 means the meeting already ended or doesn't exist — treat as success
      if (response.status === 404) {
        this.logger.log(`ℹ️ Zoom meeting ${normalizedId} was already ended or not found.`);
        return true;
      }

      const errorText = await response.text();
      this.logger.error(`❌ Failed to end Zoom meeting ${normalizedId} (HTTP ${response.status}): ${errorText}`);
      return false;
    } catch (error: any) {
      this.logger.error(`❌ Error ending Zoom meeting ${normalizedId}: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Updates an existing Zoom Meeting.
   */
  async updateZoomMeeting(meetingId: string, params: {
    topic?: string;
    startTime?: Date;
    durationMinutes?: number;
  }): Promise<boolean> {
    const token = await this.getAccessToken();
    if (!token) return false;

    const normalizedId = this.normalizeMeetingNumber(meetingId);
    try {
      const response = await fetch(`https://api.zoom.us/v2/meetings/${normalizedId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(params.topic && { topic: params.topic }),
          ...(params.startTime && { start_time: params.startTime.toISOString() }),
          ...(params.durationMinutes && { duration: params.durationMinutes }),
        }),
      });

      if (!response.ok && response.status !== 204) {
        this.logger.error(`❌ Failed to update Zoom meeting ${normalizedId}`);
        return false;
      }
      return true;
    } catch (error: any) {
      this.logger.error(`❌ Error updating Zoom meeting ${normalizedId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Deletes a Zoom Meeting permanently.
   */
  async deleteZoomMeeting(meetingId: string): Promise<boolean> {
    const token = await this.getAccessToken();
    if (!token) return false;

    const normalizedId = this.normalizeMeetingNumber(meetingId);
    try {
      const response = await fetch(`https://api.zoom.us/v2/meetings/${normalizedId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok || response.status === 204 || response.status === 404) {
        this.logger.log(`✅ Zoom meeting ${normalizedId} deleted.`);
        return true;
      }
      return false;
    } catch (error: any) {
      this.logger.error(`❌ Error deleting Zoom meeting ${normalizedId}: ${error.message}`);
      return false;
    }
  }
}
