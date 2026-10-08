export const SESSION_COOKIE = 'st_admin_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type SessionPayload = {
  sub: string;
  email: string;
  exp: number;
};

function authSecret() {
  return process.env.AUTH_SECRET?.trim() || '';
}

function bytesToBase64Url(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (const byte of arr) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function textToBase64Url(value: string) {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

function base64UrlToText(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function safeEqual(left: string, right: string) {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function signPayload(payload: string) {
  const secret = authSecret();
  if (!secret) return '';
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return bytesToBase64Url(signature);
}

export function isAuthConfigured() {
  return Boolean(authSecret());
}

export async function createSessionToken(userId: string, email: string) {
  const payload = textToBase64Url(
    JSON.stringify({
      sub: userId,
      email,
      exp: Date.now() + SESSION_MAX_AGE * 1000,
    } satisfies SessionPayload),
  );
  const signature = await signPayload(payload);
  return `${payload}.${signature}`;
}

export async function readSessionToken(token?: string | null): Promise<SessionPayload | null> {
  if (!token || !isAuthConfigured()) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = await signPayload(payload);
  if (!expected || !safeEqual(signature, expected)) return null;

  try {
    const data = JSON.parse(base64UrlToText(payload)) as SessionPayload;
    if (!data.sub || !data.email || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE,
  };
}
