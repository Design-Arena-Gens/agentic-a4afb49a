'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { PERMISSIONS, requirePermission } from '@/lib/auth/guards';
import type { SaleActionState } from './state';

const saleItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

const saleSchema = z.object({
  customerName: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
  items: z.array(saleItemSchema).min(1),
});

function generateSaleReference(): string {
  return `SAL-${Date.now()}`;
}

export async function createSaleAction(_prev: SaleActionState, formData: FormData): Promise<SaleActionState> {
  const user = await requirePermission(PERMISSIONS.CREATE_SALE);
  const rawItems = formData.get('items');

  let parsedPayload: z.infer<typeof saleSchema> | null = null;

  try {
    parsedPayload = saleSchema.parse({
      customerName: formData.get('customerName') || undefined,
      notes: formData.get('notes') || undefined,
      items: JSON.parse(typeof rawItems === 'string' ? rawItems : '[]'),
    });
  } catch {
    return { success: false, message: 'Invalid sale payload.' };
  }

  const items = parsedPayload.items;

  const products = await prisma.product.findMany({
    where: {
      id: { in: items.map((item) => item.productId) },
    },
  });

  if (products.length !== items.length) {
    return { success: false, message: 'One or more products no longer exist.' };
  }

  const productMap = new Map(products.map((product) => [product.id, product]));

  let totalAmount = 0;
  for (const item of items) {
    const product = productMap.get(item.productId)!;
    const unitPrice =
      product.price instanceof Prisma.Decimal ? product.price.toNumber() : Number(product.price ?? 0);
    const remaining = product.stock - item.quantity;
    if (remaining < 0) {
      return { success: false, message: `Insufficient inventory for ${product.name}.` };
    }
    totalAmount += unitPrice * item.quantity;
  }

  await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        reference: generateSaleReference(),
        totalAmount,
        customerName: parsedPayload?.customerName,
        notes: parsedPayload?.notes,
        createdById: user.id,
        createdByName: user.displayName,
      },
    });

    for (const item of items) {
      const product = productMap.get(item.productId)!;
      const unitPrice =
        product.price instanceof Prisma.Decimal ? product.price.toNumber() : Number(product.price ?? 0);

      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          productId: product.id,
          quantity: item.quantity,
          unitPrice,
          total: unitPrice * item.quantity,
        },
      });

      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: item.quantity } },
      });
    }
  });

  revalidatePath('/dashboard/sales');
  revalidatePath('/dashboard/products');
  return { success: true, message: 'Sale recorded successfully.' };
}

export async function deleteSaleAction(formData: FormData) {
  await requirePermission(PERMISSIONS.DELETE_SALE);

  const saleId = formData.get('id');
  if (!saleId || typeof saleId !== 'string') {
    return;
  }

  await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({
      where: { id: saleId },
      include: { items: true },
    });

    if (!sale) {
      return;
    }

    for (const item of sale.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    await tx.saleItem.deleteMany({ where: { saleId: sale.id } });
    await tx.sale.delete({ where: { id: sale.id } });
  });

  revalidatePath('/dashboard/sales');
  revalidatePath('/dashboard/products');
}
