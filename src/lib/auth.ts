import type { AstroCookies } from 'astro';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { AUTH } from './constants';

const SESSION_COOKIE_NAME = AUTH.COOKIE_NAME;
const SESSION_MAX_AGE = AUTH.SESSION_MAX_AGE;

export interface SessionData {
  accessToken: string;
  username: string;
  githubUserId: string;
  avatarUrl: string;
  email: string | null;
  profileUrl: string;
  name: string | null;
}

/**
 * Gets the session secret from environment variables
 * Throws an error in production if SESSION_SECRET is not set
 */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;

  // In production, SESSION_SECRET must be set
  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error(
      'SESSION_SECRET environment variable is required in production. ' +
      'Generate one with: openssl rand -base64 32'
    );
  }

  // In development, use fallback but warn
  if (!secret) {
    console.warn(
      '⚠️  WARNING: Using development SESSION_SECRET. ' +
      'Set SESSION_SECRET in .env for better security. ' +
      'Generate one with: openssl rand -base64 32'
    );
    return AUTH.DEVELOPMENT_SECRET;
  }

  return secret;
}

/**
 * Encrypts session data using HMAC-SHA256
 */
function encryptSessionData(data: SessionData): string {
  const secret = getSessionSecret();
  const payload = JSON.stringify(data);
  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  const signature = hmac.digest('hex');

  // Format: base64(payload).signature
  return `${Buffer.from(payload).toString('base64')}.${signature}`;
}

/**
 * Decrypts and validates session data
 */
function decryptSessionData(encrypted: string): SessionData | null {
  try {
    const [payloadB64, signature] = encrypted.split('.');
    if (!payloadB64 || !signature) return null;

    const payload = Buffer.from(payloadB64, 'base64').toString('utf-8');

    // Verify signature
    const secret = getSessionSecret();
    const hmac = createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    // Use constant-time comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedSignatureBuffer = Buffer.from(expectedSignature, 'hex');

    // timingSafeEqual requires buffers of same length
    if (signatureBuffer.length !== expectedSignatureBuffer.length ||
        !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)) {
      console.error('Invalid session signature');
      return null;
    }

    return JSON.parse(payload);
  } catch (error) {
    console.error('Error decrypting session:', error);
    return null;
  }
}

/**
 * Creates a session by setting an HTTP-only cookie
 */
export function createSession(cookies: AstroCookies, sessionData: SessionData): void {
  const encryptedData = encryptSessionData(sessionData);

  cookies.set(SESSION_COOKIE_NAME, encryptedData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

/**
 * Gets the current session from cookies
 */
export function getSession(cookies: AstroCookies): SessionData | null {
  const encryptedData = cookies.get(SESSION_COOKIE_NAME);
  if (!encryptedData || !encryptedData.value) return null;

  return decryptSessionData(encryptedData.value);
}

/**
 * Destroys the current session
 */
export function destroySession(cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIE_NAME, {
    path: '/',
  });
}

/**
 * Generates a random state parameter for OAuth
 */
export function generateState(): string {
  return randomBytes(AUTH.OAUTH_STATE_BYTES).toString('hex');
}
