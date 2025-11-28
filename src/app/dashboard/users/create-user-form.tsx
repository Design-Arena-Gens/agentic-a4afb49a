'use client';

import { useId } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createUserAction } from './actions';
import { initialUserActionState } from './state';

interface CreateUserFormProps {
  roles: { name: string; description: string | null }[];
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
    >
      {pending ? 'Creating...' : 'Create User'}
    </button>
  );
}

export function CreateUserForm({ roles }: CreateUserFormProps) {
  const [state, action] = useFormState(createUserAction, initialUserActionState);
  const usernameId = useId();
  const displayNameId = useId();
  const passwordId = useId();

  return (
    <form action={action} className="space-y-4 rounded border border-gray-200 bg-gray-50 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label htmlFor={usernameId} className="text-sm font-medium text-gray-700">
          Username
          <input
            id={usernameId}
            name="username"
            required
            minLength={3}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="enterprise id"
          />
        </label>
        <label htmlFor={displayNameId} className="text-sm font-medium text-gray-700">
          Display name
          <input
            id={displayNameId}
            name="displayName"
            required
            minLength={3}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="Full name"
          />
        </label>
      </div>
      <label htmlFor={passwordId} className="text-sm font-medium text-gray-700">
        Temporary password
        <input
          id={passwordId}
          name="password"
          type="password"
          required
          minLength={8}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="At least 8 characters"
        />
      </label>
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-gray-700">Assign roles</legend>
        <p className="text-xs text-gray-500">Roles determine permissions. Combine as needed for the user&apos;s responsibilities.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {roles.map((role) => (
            <label key={role.name} className="flex items-start gap-2 rounded border border-gray-200 bg-white p-2 text-sm">
              <input type="checkbox" name="roles" value={role.name} className="mt-1" />
              <span>
                <span className="block font-semibold text-gray-800">{role.name.replace(/_/g, ' ')}</span>
                <span className="text-xs text-gray-500">{role.description ?? 'No description provided.'}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {state.message && <p className={`text-sm ${state.success ? 'text-blue-700' : 'text-red-600'}`}>{state.message}</p>}
      <SubmitButton />
    </form>
  );
}
