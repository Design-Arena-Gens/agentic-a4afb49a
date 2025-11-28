import { redirect } from 'next/navigation';
import { LoginForm } from './login-form';
import { getUserFromCookies } from '@/lib/auth/session';

export default async function LoginPage() {
  const user = await getUserFromCookies();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <LoginForm />
    </div>
  );
}
