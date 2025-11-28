'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { loginAction } from './actions';
import { initialLoginState } from './state';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white shadow transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
      disabled={pending}
    >
      {pending ? 'Signing in...' : 'Sign In'}
    </button>
  );
}

export function LoginForm() {
  const [state, action] = useFormState(loginAction, initialLoginState);

  return (
    <form action={action} className="space-y-6 rounded-lg bg-white p-8 shadow-lg">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">EXPERT POS</h1>
        <p className="text-sm text-gray-500">Please sign in with your enterprise credentials.</p>
      </div>
      <div className="space-y-2">
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          autoComplete="username"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
        />
      </div>
      {state.message ? (
        <p className="text-sm text-red-600" role="alert">
          {state.message}
        </p>
      ) : null}
      <SubmitButton />
      <p className="text-xs text-gray-400">
        Authorized access only. Super users may manage roles and permissions within the admin control center.
      </p>
    </form>
  );
}
