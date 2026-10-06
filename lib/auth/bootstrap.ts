export const BOOTSTRAP_COOKIE = 'st_admin_session';
export const BOOTSTRAP_MAX_AGE = 60 * 60 * 24 * 7;
export const BOOTSTRAP_USER_ID = '00000000-0000-4000-a000-000000000001';

type BootstrapPayload = {
  email: string;
  exp: number;
};

function authSecret() {
  return process.env.AUTH_SECRET?.trim() || '';
}

function bootstrapEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || '';
}

function bootstrapPassword() {
  return process.env.ADMIN_PASSWORD ?? '';
}

export function isBootstrapConfigured() {
  return Boolean(authSecret() && bootstrapEmail() && bootstrapPassword());
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

export function verifyBootstrapPassword(email: string, password: string) {
  if (!isBootstrapConfigured()) return false;
  if (!safeEqual(email, bootstrapEmail())) return false;
  return safeEqual(password, bootstrapPassword());
}

export async function createBootstrapToken(email: string) {
  const payload = textToBase64Url(
    JSON.stringify({
      email,
      exp: Date.now() + BOOTSTRAP_MAX_AGE * 1000,
    } satisfies BootstrapPayload),
  );
  const signature = await signPayload(payload);
  return `${payload}.${signature}`;
}

export async function readBootstrapToken(token?: string | null) {
  if (!token || !isBootstrapConfigured()) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = await signPayload(payload);
  if (!expected || !safeEqual(signature, expected)) return null;

  try {
    const data = JSON.parse(base64UrlToText(payload)) as BootstrapPayload;
    if (!data.email || data.exp < Date.now()) return null;
    if (!safeEqual(data.email, bootstrapEmail())) return null;
    return data;
  } catch {
    return null;
  }
}

export function bootstrapCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: BOOTSTRAP_MAX_AGE,
  };
}
