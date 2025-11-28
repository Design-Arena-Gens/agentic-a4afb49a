import { redirect } from 'next/navigation';
import { PERMISSIONS } from '../security/permissions';
import { getUserFromCookies, userHasPermission } from './session';

export async function requireUser() {
  const user = await getUserFromCookies();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function requirePermission(permission: string) {
  const user = await requireUser();
  if (!userHasPermission(user, permission)) {
    redirect('/unauthorized');
  }
  return user;
}

export async function requireAnyPermission(permissions: string[]) {
  const user = await requireUser();
  if (!permissions.some((permission) => userHasPermission(user, permission))) {
    redirect('/unauthorized');
  }
  return user;
}

export { PERMISSIONS };
