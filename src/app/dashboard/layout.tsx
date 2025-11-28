import { ReactNode } from 'react';
import Link from 'next/link';
import { NavLink } from '@/components/nav-link';
import { requireUser, PERMISSIONS } from '@/lib/auth/guards';
import { logoutAction } from './actions';
import { ROLE_COLORS, ROLE_LABELS } from '@/lib/security/permissions';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/sales', label: 'Sales', permission: PERMISSIONS.VIEW_SALES },
  { href: '/dashboard/purchases', label: 'Purchases', permission: PERMISSIONS.VIEW_PURCHASES },
  { href: '/dashboard/products', label: 'Products', permission: PERMISSIONS.VIEW_PRODUCTS },
  { href: '/dashboard/users', label: 'Users & Roles', permission: PERMISSIONS.MANAGE_USERS },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  const allowedNavItems = NAV_ITEMS.filter((item) => {
    if (!item.permission) {
      return true;
    }
    if (user.roles.includes('SUPER_USER')) {
      return true;
    }
    return user.permissions.includes(item.permission);
  });

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-xl font-bold text-blue-600">
            EXPERT POS
          </Link>
          <nav className="flex items-center gap-2">
            {allowedNavItems.map((item) => (
              <NavLink key={item.href} href={item.href}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">{user.displayName}</p>
              <div className="flex flex-wrap gap-1">
                {user.roles.map((role) => (
                  <span
                    key={role}
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${ROLE_COLORS[role] ?? 'bg-gray-200 text-gray-700'}`}
                  >
                    {ROLE_LABELS[role] ?? role}
                  </span>
                ))}
              </div>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-300"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-6">
        <div className="rounded-lg bg-white p-6 shadow-sm">{children}</div>
      </main>
    </div>
  );
}
