import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { PERMISSIONS, requireAnyPermission } from '@/lib/auth/guards';
import { userHasPermission } from '@/lib/auth/session';
import { SaleBuilder } from './sale-builder';
import { deleteSaleAction } from './actions';

export const dynamic = 'force-dynamic';

function decimalToNumber(value: Prisma.Decimal | number): number {
  return value instanceof Prisma.Decimal ? value.toNumber() : Number(value);
}

export default async function SalesPage() {
  const user = await requireAnyPermission([PERMISSIONS.VIEW_SALES, PERMISSIONS.CREATE_SALE]);
  const canCreate = userHasPermission(user, PERMISSIONS.CREATE_SALE);
  const canDelete = userHasPermission(user, PERMISSIONS.DELETE_SALE);

  const [products, sales] = await Promise.all([
    canCreate
      ? prisma.product.findMany({
          where: { stock: { gt: 0 } },
          orderBy: { name: 'asc' },
        })
      : Promise.resolve([]),
    prisma.sale.findMany({
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
    price: decimalToNumber(product.price),
    stock: product.stock,
  }));

  const saleViewModels = sales.map((sale) => ({
    id: sale.id,
    reference: sale.reference,
    totalAmount: decimalToNumber(sale.totalAmount),
    createdAt: sale.createdAt.toISOString(),
    createdByName: sale.createdByName,
    customerName: sale.customerName,
    notes: sale.notes,
    items: sale.items.map((item) => ({
      id: item.id,
      productName: item.product?.name ?? 'Deleted product',
      productSku: item.product?.sku ?? 'N/A',
      quantity: item.quantity,
      unitPrice: decimalToNumber(item.unitPrice),
      total: decimalToNumber(item.total),
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Sales Management</h1>
        <p className="text-sm text-gray-500">
          Record transactions with full audit trails. Each sale captures the responsible user and timestamp for compliance.
        </p>
      </div>

      {canCreate && productViewModels.length > 0 ? (
        <div>
          <h2 className="mb-2 text-lg font-semibold text-gray-800">New Sale</h2>
          <SaleBuilder products={productViewModels} />
        </div>
      ) : canCreate ? (
        <p className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Inventory is empty. Add products before recording sales transactions.
        </p>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Recorded Sales</h2>
        {saleViewModels.length === 0 ? (
          <p className="text-sm text-gray-500">No sales recorded yet.</p>
        ) : (
          <div className="space-y-4">
            {saleViewModels.map((sale) => (
              <div key={sale.id} className="rounded border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold text-gray-800">{sale.reference}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(sale.createdAt).toLocaleString()} — {sale.createdByName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-800">${sale.totalAmount.toFixed(2)}</span>
                    {canDelete && (
                      <form action={deleteSaleAction}>
                        <input type="hidden" name="id" value={sale.id} />
                        <button
                          type="submit"
                          className="rounded border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </form>
                    )}
                  </div>
                </div>
                {sale.customerName && (
                  <p className="mt-1 text-sm text-gray-600">Customer: {sale.customerName}</p>
                )}
                {sale.notes && (
                  <p className="text-xs text-gray-500">Notes: {sale.notes}</p>
                )}
                <div className="mt-3 divide-y divide-gray-200 border border-gray-200">
                  {sale.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-1 gap-2 bg-gray-50 p-2 sm:grid-cols-4">
                      <div>
                        <p className="font-medium text-gray-800">{item.productName}</p>
                        <p className="text-xs text-gray-500">SKU {item.productSku}</p>
                      </div>
                      <p className="text-sm text-gray-700">Qty {item.quantity}</p>
                      <p className="text-sm text-gray-700">Unit ${item.unitPrice.toFixed(2)}</p>
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
