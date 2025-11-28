import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from '../prisma';
import { createAuthToken, getSessionCookieName, getSessionCookieOptions, verifyAuthToken } from './token';

export type AuthenticatedUser = {
  id: string;
  username: string;
  displayName: string;
  roles: string[];
  permissions: string[];
  isSystem: boolean;
};

export async function createUserSession(
  userId: string,
  metadata: { userAgent?: string | null; ipAddress?: string | null }
) {
  const session = await prisma.userSession.create({
    data: {
      userId,
      userAgent: metadata.userAgent ?? undefined,
      ipAddress: metadata.ipAddress ?? undefined,
    },
  });

  const token = createAuthToken({
    sessionId: session.id,
    userId,
  });

  const cookieStore = await cookies();
  cookieStore.set(getSessionCookieName(), token, getSessionCookieOptions());

  return session;
}

export async function closeUserSession(sessionId: string) {
  await prisma.userSession.updateMany({
    where: { id: sessionId, logoutAt: null },
    data: { logoutAt: new Date() },
  });

  const cookieStore = await cookies();
  cookieStore.delete(getSessionCookieName());
}

export async function closeCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (!token) {
    return;
  }

  const parsed = verifyAuthToken(token);
  if (!parsed) {
    cookieStore.delete(getSessionCookieName());
    return;
  }

  await closeUserSession(parsed.sessionId);
}

async function collectUserPermissions(userId: string): Promise<string[]> {
  const rolePermissions = await prisma.rolePermission.findMany({
    where: {
      role: {
        users: {
          some: { userId },
        },
      },
    },
    select: {
      permission: true,
    },
  });

  const codes = new Set<string>();
  rolePermissions.forEach((entry) => {
    codes.add(entry.permission.code);
  });
  return Array.from(codes);
}

async function collectUserRoles(userId: string): Promise<string[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    select: { role: { select: { name: true } } },
  });
  return userRoles.map((ur) => ur.role.name);
}

export async function resolveAuthenticatedUser(token?: string | null): Promise<AuthenticatedUser | null> {
  if (!token) {
    return null;
  }

  const parsed = verifyAuthToken(token);
  if (!parsed) {
    return null;
  }

  const session = await prisma.userSession.findUnique({
    where: { id: parsed.sessionId },
    include: {
      user: true,
    },
  });

  if (!session || !session.user || session.logoutAt) {
    return null;
  }

  if (!session.user.isActive) {
    await closeUserSession(session.id);
    return null;
  }

  const roles = await collectUserRoles(session.userId);
  const permissions = await collectUserPermissions(session.userId);

  return {
    id: session.user.id,
    username: session.user.username,
    displayName: session.user.displayName,
    roles,
    permissions,
    isSystem: session.user.isSystem,
  };
}

export async function getUserFromCookies(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  return resolveAuthenticatedUser(token);
}

export async function getUserFromRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  const token = request.cookies.get(getSessionCookieName())?.value;
  return resolveAuthenticatedUser(token);
}

export function userHasPermission(user: AuthenticatedUser | null, permission: string): boolean {
  if (!user) {
    return false;
  }
  if (user.roles.includes('SUPER_USER')) {
    return true;
  }
  return user.permissions.includes(permission);
}

export function userHasRole(user: AuthenticatedUser | null, role: string): boolean {
  return !!user?.roles.includes(role);
}
