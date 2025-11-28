'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePermission, PERMISSIONS } from '@/lib/auth/guards';
import type { ProductActionState } from './state';

const productSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(2).max(50),
  name: z.string().min(3).max(120),
  description: z.string().max(500).optional(),
  price: z.coerce.number().nonnegative(),
  stock: z.coerce.number().int().nonnegative(),
});

export async function createProductAction(prev: ProductActionState, formData: FormData): Promise<ProductActionState> {
  await requirePermission(PERMISSIONS.MANAGE_PRODUCTS);

  const parsed = productSchema.safeParse({
    sku: formData.get('sku'),
    name: formData.get('name'),
    description: formData.get('description'),
    price: formData.get('price'),
    stock: formData.get('stock'),
  });

  if (!parsed.success) {
    return { success: false, message: 'Please review the product details and try again.' };
  }

  const data = parsed.data;

  try {
    await prisma.product.create({
      data: {
        sku: data.sku.trim().toUpperCase(),
        name: data.name.trim(),
        description: data.description?.trim(),
        price: data.price,
        stock: data.stock,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { success: false, message: 'SKU already exists. Please use a different SKU.' };
    }
    throw error;
  }

  revalidatePath('/dashboard/products');
  return { success: true, message: 'Product created successfully.' };
}

export async function updateProductAction(
  prev: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  await requirePermission(PERMISSIONS.MANAGE_PRODUCTS);

  const parsed = productSchema.safeParse({
    id: formData.get('id'),
    sku: formData.get('sku'),
    name: formData.get('name'),
    description: formData.get('description'),
    price: formData.get('price'),
    stock: formData.get('stock'),
  });

  if (!parsed.success || !parsed.data.id) {
    return { success: false, message: 'Unable to validate product payload.' };
  }

  const data = parsed.data;

  await prisma.product.update({
    where: { id: data.id },
    data: {
      sku: data.sku.trim().toUpperCase(),
      name: data.name.trim(),
      description: data.description?.trim(),
      price: data.price,
      stock: data.stock,
    },
  });

  revalidatePath('/dashboard/products');
  return { success: true, message: 'Product updated successfully.' };
}

export async function deleteProductAction(data: FormData) {
  await requirePermission(PERMISSIONS.MANAGE_PRODUCTS);
  const productId = data.get('id');
  if (!productId || typeof productId !== 'string') {
    return;
  }
  await prisma.product.delete({ where: { id: productId } });
  revalidatePath('/dashboard/products');
}
