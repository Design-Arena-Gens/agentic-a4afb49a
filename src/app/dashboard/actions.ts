import { redirect } from 'next/navigation';
import { closeCurrentSession } from '@/lib/auth/session';

export async function logoutAction() {
  'use server';
  await closeCurrentSession();
  redirect('/login');
}
