'use client';

import { useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createSaleAction } from './actions';
import { initialSaleState } from './state';

export type SaleBuilderProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
};

type DraftItem = {
  productId: string;
  quantity: number;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
    >
      {pending ? 'Processing...' : 'Finalize Sale'}
    </button>
  );
}

export function SaleBuilder({ products }: { products: SaleBuilderProduct[] }) {
  const [state, action] = useFormState(createSaleAction, initialSaleState);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  const productLookup = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const total = items.reduce((acc, item) => {
    const product = productLookup.get(item.productId);
    if (!product) return acc;
    return acc + product.price * item.quantity;
  }, 0);

  function addItem() {
    if (!selectedProduct) return;
    const product = productLookup.get(selectedProduct);
    if (!product) return;
    if (quantity <= 0 || quantity > product.stock) return;

    setItems((prev) => {
      const existing = prev.find((item) => item.productId === selectedProduct);
      if (existing) {
        return prev.map((item) =>
          item.productId === selectedProduct ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) } : item
        );
      }
      return [...prev, { productId: selectedProduct, quantity }];
    });
    setQuantity(1);
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }

  return (
    <form action={action} className="space-y-4 rounded border border-gray-200 bg-gray-50 p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-sm font-medium text-gray-700">
          Customer Name
          <input
            name="customerName"
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="Walk-in customer"
          />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Notes
          <input
            name="notes"
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="Optional remarks"
          />
        </label>
      </div>

      <div className="rounded border border-dashed border-blue-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-blue-700">Add items</h3>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <label className="text-sm font-medium text-gray-700">
            Product
            <select
              value={selectedProduct}
              onChange={(event) => setSelectedProduct(event.target.value)}
              className="mt-1 w-64 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku}) — ${product.price.toFixed(2)} · Stock {product.stock}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700">
            Quantity
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className="mt-1 w-32 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </label>
          <button
            type="button"
            onClick={addItem}
            className="mt-6 rounded bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200"
          >
            Add Item
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {items.length === 0 ? (
            <p className="text-sm text-gray-500">No items added yet. Select a product and quantity to build the sale.</p>
          ) : (
            items.map((item) => {
              const product = productLookup.get(item.productId)!;
              return (
                <div key={item.productId} className="flex flex-wrap items-center justify-between rounded bg-gray-100 p-2 text-sm">
                  <div>
                    <p className="font-medium text-gray-800">{product.name}</p>
                    <p className="text-xs text-gray-500">SKU {product.sku}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-700">
                    <span>Qty {item.quantity}</span>
                    <span>${(product.price * item.quantity).toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="rounded border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>

      {state.message && <p className="text-sm text-blue-700">{state.message}</p>}
      <SubmitButton />
    </form>
  );
}
