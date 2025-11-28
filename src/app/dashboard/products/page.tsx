import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAnyPermission, PERMISSIONS } from '@/lib/auth/guards';
import { ProductEditor } from './product-editor';
import { NewProductForm } from './new-product-form';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const user = await requireAnyPermission([PERMISSIONS.VIEW_PRODUCTS, PERMISSIONS.MANAGE_PRODUCTS]);
  const canManage = user.permissions.includes(PERMISSIONS.MANAGE_PRODUCTS) || user.roles.includes('SUPER_USER');

  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' },
  });
  const productViewModels = products.map((product) => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    price: product.price instanceof Prisma.Decimal ? product.price.toNumber() : Number(product.price ?? 0),
    stock: product.stock,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Product Catalogue</h1>
        <p className="text-sm text-gray-500">
          Maintain high-quality inventory data. Cashiers have read-only access to ensure pricing and stock integrity.
        </p>
      </div>

      {canManage && (
        <div>
          <h2 className="mb-2 text-lg font-semibold text-gray-800">Create Product</h2>
          <NewProductForm />
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Inventory</h2>
        {productViewModels.length === 0 ? (
          <p className="text-sm text-gray-500">No products defined yet.</p>
        ) : (
          <div className="grid gap-4">
            {productViewModels.map((product) => (
              <ProductEditor key={product.id} product={product} canManage={canManage} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
