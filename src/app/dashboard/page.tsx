import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireUser, PERMISSIONS } from '@/lib/auth/guards';
import { userHasPermission } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

function formatCurrency(value: Prisma.Decimal | number | null | undefined) {
  let numeric: number;
  if (value instanceof Prisma.Decimal) {
    numeric = value.toNumber();
  } else if (typeof value === 'number') {
    numeric = value;
  } else {
    numeric = 0;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numeric);
}

export default async function DashboardHome() {
  const user = await requireUser();

  const [salesAgg, purchasesAgg, productCount, recentSales, recentSessions] = await Promise.all([
    prisma.sale.aggregate({
      _count: true,
      _sum: { totalAmount: true },
    }),
    prisma.purchase.aggregate({
      _count: true,
      _sum: { totalAmount: true },
    }),
    prisma.product.count(),
    prisma.sale.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        createdBy: {
          select: { displayName: true, username: true },
        },
      },
    }),
    prisma.userSession.findMany({
      orderBy: { loginAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: { displayName: true, username: true },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Welcome back, {user.displayName}</h1>
        <p className="text-sm text-gray-500">
          Monitor real-time performance metrics and security-critical activity for your EXPERT POS environment.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-800">Total Sales</p>
          <p className="text-2xl font-semibold text-blue-900">{salesAgg._count}</p>
          <p className="text-xs text-blue-700">{formatCurrency(salesAgg._sum.totalAmount)} processed</p>
        </div>
        <div className="rounded border border-green-100 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">Total Purchases</p>
          <p className="text-2xl font-semibold text-green-900">{purchasesAgg._count}</p>
          <p className="text-xs text-green-700">{formatCurrency(purchasesAgg._sum.totalAmount)} received</p>
        </div>
        <div className="rounded border border-amber-100 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">Active Products</p>
          <p className="text-2xl font-semibold text-amber-900">{productCount}</p>
          <p className="text-xs text-amber-700">Inventory catalogue overview</p>
        </div>
        <div className="rounded border border-purple-100 bg-purple-50 p-4">
          <p className="text-sm font-medium text-purple-800">Your Roles</p>
          <p className="text-2xl font-semibold text-purple-900">{user.roles.length}</p>
          <p className="text-xs text-purple-700">{user.roles.join(', ')}</p>
        </div>
      </div>

      {userHasPermission(user, PERMISSIONS.VIEW_SALES) && (
        <div className="rounded border border-gray-200 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Recent Sales Activity</h2>
            <a href="/dashboard/sales" className="text-sm font-medium text-blue-600 hover:underline">
              View all
            </a>
          </div>
          <div className="space-y-3">
            {recentSales.length === 0 ? (
              <p className="text-sm text-gray-500">No sales recorded yet.</p>
            ) : (
              recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between rounded bg-gray-50 p-3">
                  <div>
                    <p className="font-medium text-gray-800">{sale.reference}</p>
                    <p className="text-xs text-gray-500">
                      {sale.createdAt.toLocaleString()} by {sale.createdBy?.displayName ?? sale.createdBy?.username}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{formatCurrency(sale.totalAmount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="rounded border border-gray-200 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Authentication Audit Trail</h2>
          <span className="text-xs text-gray-500">Last 5 sessions</span>
        </div>
        <div className="space-y-3">
          {recentSessions.map((session) => (
            <div key={session.id} className="flex flex-wrap items-center justify-between gap-2 rounded bg-gray-50 p-3 text-sm">
              <div>
                <p className="font-medium text-gray-800">
                  {session.user.displayName} ({session.user.username})
                </p>
                <p className="text-xs text-gray-500">User agent: {session.userAgent ?? 'Unknown'}</p>
              </div>
              <div className="text-right text-xs text-gray-500">
                <p>Login: {session.loginAt.toLocaleString()}</p>
                <p>Logout: {session.logoutAt ? session.logoutAt.toLocaleString() : 'Active'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
