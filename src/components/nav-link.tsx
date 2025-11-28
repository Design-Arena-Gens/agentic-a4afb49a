'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={clsx(
        'rounded px-3 py-2 text-sm font-medium transition hover:bg-blue-50 hover:text-blue-700',
        isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
      )}
    >
      {children}
    </Link>
  );
}
