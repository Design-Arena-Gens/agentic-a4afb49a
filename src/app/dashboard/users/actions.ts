'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { PERMISSIONS, requirePermission } from '@/lib/auth/guards';
import { hashPassword } from '@/lib/auth/password';
import type { UserActionState } from './state';

const createUserSchema = z.object({
  username: z.string().min(3),
  displayName: z.string().min(3),
  password: z.string().min(8),
  roles: z.array(z.string()).min(1),
});

const updateRolesSchema = z.object({
  userId: z.string().uuid(),
  roles: z.array(z.string()),
});

const toggleActiveSchema = z.object({
  userId: z.string().uuid(),
  isActive: z.coerce.boolean(),
});

export async function createUserAction(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  await requirePermission(PERMISSIONS.MANAGE_USERS);

  const roles = formData.getAll('roles').filter((value): value is string => typeof value === 'string');
  const parsed = createUserSchema.safeParse({
    username: formData.get('username'),
    displayName: formData.get('displayName'),
    password: formData.get('password'),
    roles,
  });

  if (!parsed.success) {
    return { success: false, message: 'Please check the provided information.' };
  }

  const { username, displayName, password } = parsed.data;
  const uniqueUsername = username.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { username: uniqueUsername } });
  if (existing) {
    return { success: false, message: 'Username already exists.' };
  }

  const passwordHash = await hashPassword(password);

  const roleRecords = await prisma.role.findMany({
    where: { name: { in: parsed.data.roles } },
  });

  if (roleRecords.length !== parsed.data.roles.length) {
    return { success: false, message: 'One or more selected roles are invalid.' };
  }

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: uniqueUsername,
        displayName: displayName.trim(),
        passwordHash,
      },
    });

    for (const role of roleRecords) {
      await tx.userRole.create({
        data: { userId: user.id, roleId: role.id },
      });
    }
  });

  revalidatePath('/dashboard/users');
  return { success: true, message: 'User created successfully.' };
}

export async function updateUserRolesAction(formData: FormData) {
  await requirePermission(PERMISSIONS.MANAGE_USERS);

  const roles = formData.getAll('roles').filter((role): role is string => typeof role === 'string');
  const parsed = updateRolesSchema.safeParse({
    userId: formData.get('userId'),
    roles,
  });

  if (!parsed.success) {
    return;
  }

  const { userId } = parsed.data;

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });

    if (!user) {
      return;
    }

    const requestedRoles = [...parsed.data.roles];

    if (user.isSystem && !requestedRoles.includes('SUPER_USER')) {
      requestedRoles.push('SUPER_USER');
    }

    const allRoles = await tx.role.findMany({ where: { name: { in: requestedRoles } } });

    await tx.userRole.deleteMany({ where: { userId } });
    for (const role of allRoles) {
      await tx.userRole.create({ data: { userId, roleId: role.id } });
    }
  });

  revalidatePath('/dashboard/users');
}

export async function toggleUserActiveAction(formData: FormData) {
  await requirePermission(PERMISSIONS.MANAGE_USERS);

  const parsed = toggleActiveSchema.safeParse({
    userId: formData.get('userId'),
    isActive: formData.get('isActive'),
  });

  if (!parsed.success) {
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user || user.isSystem) {
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isActive: parsed.data.isActive },
  });

  revalidatePath('/dashboard/users');
}

const resetPasswordSchema = z.object({
  userId: z.string().uuid(),
  password: z.string().min(8),
});

export async function resetPasswordAction(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  await requirePermission(PERMISSIONS.MANAGE_USERS);

  const parsed = resetPasswordSchema.safeParse({
    userId: formData.get('userId'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { success: false, message: 'Password must be at least 8 characters.' };
  }

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user) {
    return { success: false, message: 'User not found.' };
  }

  if (user.isSystem && parsed.data.password.trim().length === 0) {
    return { success: false, message: 'Invalid password supplied.' };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  revalidatePath('/dashboard/users');
  return { success: true, message: 'Password reset successfully.' };
}
