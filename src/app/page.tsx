import { redirect } from 'next/navigation';
import { getUserFromCookies } from '@/lib/auth/session';

export default async function Home() {
  const user = await getUserFromCookies();
  if (user) {
    redirect('/dashboard');
  }
  redirect('/login');
}
