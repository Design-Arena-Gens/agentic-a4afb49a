import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { PERMISSIONS, requireAnyPermission } from '@/lib/auth/guards';
import { userHasPermission } from '@/lib/auth/session';
import { PurchaseBuilder } from './purchase-builder';

export const dynamic = 'force-dynamic';

function decimalToNumber(value: Prisma.Decimal | number): number {
  return value instanceof Prisma.Decimal ? value.toNumber() : Number(value);
}

export default async function PurchasesPage() {
  const user = await requireAnyPermission([PERMISSIONS.VIEW_PURCHASES, PERMISSIONS.CREATE_PURCHASE]);
  const canCreate = userHasPermission(user, PERMISSIONS.CREATE_PURCHASE);

  const [products, purchases] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: 'asc' } }),
    prisma.purchase.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, sku: true },
            },
          },
        },
      },
    }),
  ]);

  const productViewModels = products.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
  }));

  const purchaseViewModels = purchases.map((purchase) => ({
    id: purchase.id,
    reference: purchase.reference,
    totalAmount: decimalToNumber(purchase.totalAmount),
    createdAt: purchase.createdAt.toISOString(),
    createdByName: purchase.createdByName,
    supplierName: purchase.supplierName,
    notes: purchase.notes,
    items: purchase.items.map((item) => ({
      id: item.id,
      productName: item.product?.name ?? 'Deleted product',
      productSku: item.product?.sku ?? 'N/A',
      quantity: item.quantity,
      unitCost: decimalToNumber(item.unitCost),
      total: decimalToNumber(item.total),
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Purchase Ledger</h1>
        <p className="text-sm text-gray-500">
          Track supplier receipts and automatically update inventory levels. User and timestamp data are captured for every transaction.
        </p>
      </div>

      {canCreate && (
        <div>
          <h2 className="mb-2 text-lg font-semibold text-gray-800">Record Purchase</h2>
          <PurchaseBuilder products={productViewModels} />
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Recent Purchases</h2>
        {purchaseViewModels.length === 0 ? (
          <p className="text-sm text-gray-500">No purchases recorded.</p>
        ) : (
          <div className="space-y-4">
            {purchaseViewModels.map((purchase) => (
              <div key={purchase.id} className="rounded border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold text-gray-800">{purchase.reference}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(purchase.createdAt).toLocaleString()} — {purchase.createdByName}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">${purchase.totalAmount.toFixed(2)}</span>
                </div>
                {purchase.supplierName && (
                  <p className="mt-1 text-sm text-gray-600">Supplier: {purchase.supplierName}</p>
                )}
                {purchase.notes && <p className="text-xs text-gray-500">Notes: {purchase.notes}</p>}
                <div className="mt-3 divide-y divide-gray-200 border border-gray-200">
                  {purchase.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-1 gap-2 bg-gray-50 p-2 sm:grid-cols-4">
                      <div>
                        <p className="font-medium text-gray-800">{item.productName}</p>
                        <p className="text-xs text-gray-500">SKU {item.productSku}</p>
                      </div>
                      <p className="text-sm text-gray-700">Qty {item.quantity}</p>
                      <p className="text-sm text-gray-700">Unit ${item.unitCost.toFixed(2)}</p>
                      <p className="text-sm font-semibold text-gray-800">Total ${item.total.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
