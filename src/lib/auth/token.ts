import jwt from 'jsonwebtoken';

export type AuthTokenPayload = {
  sessionId: string;
  userId: string;
  exp?: number;
};

const SESSION_TOKEN_NAME = process.env.SESSION_TOKEN_NAME ?? 'expert_pos_session';

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
}

export function getSessionCookieName(): string {
  return SESSION_TOKEN_NAME;
}

export function createAuthToken(payload: Omit<AuthTokenPayload, 'exp'>): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: SESSION_MAX_AGE_SECONDS });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
