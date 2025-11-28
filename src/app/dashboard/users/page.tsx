import { prisma } from '@/lib/prisma';
import { PERMISSIONS, requirePermission } from '@/lib/auth/guards';
import { CreateUserForm } from './create-user-form';
import { UserAdminCard } from './user-admin-card';
import { ROLE_LABELS } from '@/lib/security/permissions';

export const dynamic = 'force-dynamic';

export default async function UsersAdminPage() {
  await requirePermission(PERMISSIONS.MANAGE_USERS);

  const [roles, users] = await Promise.all([
    prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        sessions: {
          orderBy: { loginAt: 'desc' },
          take: 1,
        },
      },
    }),
  ]);

  const roleOptions = roles.map((role) => ({
    name: role.name,
    description: role.description,
  }));

  const permissionsByRole = roles.reduce<Record<string, string[]>>((accumulator, role) => {
    accumulator[role.name] = role.permissions.map((entry) => entry.permission.code).sort();
    return accumulator;
  }, {});

  const usersView = users.map((user) => ({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    isActive: user.isActive,
    isSystem: user.isSystem,
    roles: user.roles.map((record) => record.role.name),
    lastLogin: user.sessions[0]?.loginAt.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Security Administration</h1>
        <p className="text-sm text-gray-500">
          Manage user accounts, enforce least-privilege access, and audit role assignments across the EXPERT POS ecosystem.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Accounts</h2>
          <div className="space-y-4">
            {usersView.map((user) => (
              <UserAdminCard
                key={user.id}
                user={user}
                roleOptions={roleOptions}
                permissionsByRole={permissionsByRole}
              />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Create User</h2>
          <CreateUserForm roles={roleOptions} />

          <div className="rounded border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-md font-semibold text-gray-800">Role catalogue</h3>
            <p className="text-xs text-gray-500">Each role inherits the permissions listed below.</p>
            <div className="mt-3 space-y-3">
              {roles.map((role) => (
                <div key={role.id} className="rounded border border-gray-100 bg-gray-50 p-3">
                  <p className="text-sm font-semibold text-gray-800">
                    {ROLE_LABELS[role.name] ?? role.name}
                  </p>
                  <ul className="mt-1 grid list-disc gap-1 pl-4 text-xs text-gray-600">
                    {role.permissions.map((entry) => (
                      <li key={entry.permission.id}>{entry.permission.code}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
