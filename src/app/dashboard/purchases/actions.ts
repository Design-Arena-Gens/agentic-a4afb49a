'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { PERMISSIONS, requirePermission } from '@/lib/auth/guards';
import type { PurchaseActionState } from './state';

const purchaseItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitCost: z.number().nonnegative(),
});

const purchaseSchema = z.object({
  supplierName: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
  items: z.array(purchaseItemSchema).min(1),
});

function generatePurchaseReference(): string {
  return `PUR-${Date.now()}`;
}

export async function createPurchaseAction(
  _prev: PurchaseActionState,
  formData: FormData
): Promise<PurchaseActionState> {
  const user = await requirePermission(PERMISSIONS.CREATE_PURCHASE);
  const rawItems = formData.get('items');

  let parsedPayload: z.infer<typeof purchaseSchema>;

  try {
    parsedPayload = purchaseSchema.parse({
      supplierName: formData.get('supplierName') || undefined,
      notes: formData.get('notes') || undefined,
      items: JSON.parse(typeof rawItems === 'string' ? rawItems : '[]'),
    });
  } catch {
    return { success: false, message: 'Invalid purchase payload.' };
  }

  const productIds = parsedPayload.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== parsedPayload.items.length) {
    return { success: false, message: 'One or more selected products were not found.' };
  }

  const totalAmount = parsedPayload.items.reduce((acc, item) => acc + item.unitCost * item.quantity, 0);

  await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.create({
      data: {
        reference: generatePurchaseReference(),
        totalAmount,
        supplierName: parsedPayload.supplierName,
        notes: parsedPayload.notes,
        createdById: user.id,
        createdByName: user.displayName,
      },
    });

    for (const item of parsedPayload.items) {
      await tx.purchaseItem.create({
        data: {
          purchaseId: purchase.id,
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          total: item.unitCost * item.quantity,
        },
      });

      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
  });

  revalidatePath('/dashboard/purchases');
  revalidatePath('/dashboard/products');
  return { success: true, message: 'Purchase recorded successfully.' };
}
