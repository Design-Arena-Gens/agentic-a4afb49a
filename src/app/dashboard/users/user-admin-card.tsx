'use client';

import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { useFormState, useFormStatus } from 'react-dom';
import { resetPasswordAction, toggleUserActiveAction, updateUserRolesAction } from './actions';
import { initialUserActionState } from './state';

interface RoleOption {
  name: string;
  description: string | null;
}

interface UserAdminCardProps {
  user: {
    id: string;
    username: string;
    displayName: string;
    isActive: boolean;
    isSystem: boolean;
    roles: string[];
    lastLogin: string | null;
    createdAt: string;
  };
  roleOptions: RoleOption[];
  permissionsByRole: Record<string, string[]>;
}

function SaveRolesButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-blue-600 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
    >
      {pending ? 'Saving...' : 'Save Roles'}
    </button>
  );
}

function ToggleActiveButton({ isActive }: { isActive: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={clsx(
        'rounded px-3 py-2 text-xs font-semibold uppercase tracking-wide',
        isActive ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200',
        pending && 'cursor-not-allowed opacity-70'
      )}
    >
      {pending ? 'Processing...' : isActive ? 'Deactivate' : 'Activate'}
    </button>
  );
}

function ResetPasswordButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-amber-200"
    >
      {pending ? 'Resetting...' : 'Reset Password'}
    </button>
  );
}

export function UserAdminCard({ user, roleOptions, permissionsByRole }: UserAdminCardProps) {
  const [resetMode, setResetMode] = useState(false);
  const [passwordState, passwordAction] = useFormState(resetPasswordAction, initialUserActionState);

  const permissionList = useMemo(() => {
    return user.roles
      .map((role) => permissionsByRole[role] ?? [])
      .flat()
      .sort();
  }, [user.roles, permissionsByRole]);

  return (
    <div className={clsx('rounded border p-4 shadow-sm', user.isSystem ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-white')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-lg font-semibold text-gray-900">{user.displayName}</p>
          <p className="text-xs text-gray-500">{user.username}</p>
          <p className="text-xs text-gray-500">Created {new Date(user.createdAt).toLocaleDateString()}</p>
          <p className="text-xs text-gray-500">Last login {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</p>
        </div>
        <span
          className={clsx(
            'rounded px-2 py-1 text-xs font-semibold uppercase',
            user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          )}
        >
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="mt-4 space-y-4">
        <form action={updateUserRolesAction} className="space-y-2">
          <input type="hidden" name="userId" value={user.id} />
          <p className="text-xs font-semibold uppercase text-gray-500">Roles</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {roleOptions.map((role) => {
              const disabled = user.isSystem;
              return (
                <label
                  key={role.name}
                  className={clsx('flex items-start gap-2 rounded border border-gray-200 p-2 text-sm', disabled && 'opacity-70')}
                >
                  <input
                    type="checkbox"
                    name="roles"
                    value={role.name}
                    defaultChecked={user.roles.includes(role.name)}
                    disabled={disabled}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-semibold text-gray-800">{role.name.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-gray-500">{role.description ?? 'No description provided.'}</span>
                  </span>
                </label>
              );
            })}
          </div>
          {!user.isSystem && <SaveRolesButton />}
        </form>

        <div>
          <p className="text-xs font-semibold uppercase text-gray-500">Effective permissions</p>
          {permissionList.length === 0 ? (
            <p className="text-xs text-gray-500">No permissions assigned.</p>
          ) : (
            <ul className="mt-1 grid list-disc gap-1 pl-5 text-xs text-gray-600 sm:grid-cols-2">
              {permissionList.map((permission) => (
                <li key={permission}>{permission}</li>
              ))}
            </ul>
          )}
        </div>

        {!user.isSystem && (
          <form action={toggleUserActiveAction} className="inline-flex items-center gap-2">
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="isActive" value={(!user.isActive).toString()} />
            <ToggleActiveButton isActive={user.isActive} />
          </form>
        )}

        <div className="space-y-2 border-t border-dashed border-gray-200 pt-3">
          <button
            type="button"
            onClick={() => setResetMode((prev) => !prev)}
            className="rounded bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-200"
          >
            {resetMode ? 'Cancel password reset' : 'Reset password'}
          </button>
          {resetMode && (
            <form action={passwordAction} className="space-y-2">
              <input type="hidden" name="userId" value={user.id} />
              <input
                type="password"
                name="password"
                required
                minLength={8}
                placeholder="New password"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
              />
              {passwordState.message && (
                <p className={`text-xs ${passwordState.success ? 'text-green-700' : 'text-red-600'}`}>
                  {passwordState.message}
                </p>
              )}
              <ResetPasswordButton />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
