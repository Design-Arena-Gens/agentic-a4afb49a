'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { comparePassword } from '@/lib/auth/password';
import { createUserSession } from '@/lib/auth/session';
import type { LoginFormState } from './state';

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: 'Invalid credentials supplied.',
    };
  }

  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
  });

  if (!user || !user.isActive) {
    return { success: false, message: 'User not found or inactive.' };
  }

  const validPassword = await comparePassword(password, user.passwordHash);
  if (!validPassword) {
    return { success: false, message: 'Invalid username or password.' };
  }

  const requestHeaders = await headers();
  const userAgent = requestHeaders.get('user-agent');
  const forwardedFor = requestHeaders.get('x-forwarded-for');
  const ipAddress = forwardedFor?.split(',')[0]?.trim() ?? null;

  await createUserSession(user.id, { userAgent, ipAddress });

  redirect('/dashboard');
}
