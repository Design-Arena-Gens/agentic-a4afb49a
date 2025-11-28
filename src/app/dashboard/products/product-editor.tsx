'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { clsx } from 'clsx';
import { deleteProductAction, updateProductAction } from './actions';
import { initialProductState } from './state';

interface ProductEditorProps {
  product: {
    id: string;
    sku: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    createdAt: string;
    updatedAt: string;
  };
  canManage: boolean;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
    >
      {pending ? 'Saving...' : label}
    </button>
  );
}

export function ProductEditor({ product, canManage }: ProductEditorProps) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useFormState(updateProductAction, initialProductState);

  if (!canManage) {
    return (
      <div className="grid gap-1 rounded border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold text-gray-800">{product.name}</p>
          <span className="text-sm font-mono text-gray-500">SKU {product.sku}</span>
        </div>
        <p className="text-sm text-gray-600">{product.description ?? 'No description provided'}</p>
        <div className="flex flex-wrap gap-4 text-sm text-gray-700">
          <span>Price: ${product.price.toFixed(2)}</span>
          <span>Stock: {product.stock}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('rounded border p-4', editing ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white')}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-gray-800">{product.name}</p>
          <p className="text-xs text-gray-500">SKU {product.sku}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing((prev) => !prev)}
          className="rounded border border-blue-200 px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-100"
        >
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>
      <p className="mt-2 text-sm text-gray-600">{product.description ?? 'No description provided'}</p>
      <div className="mt-3 flex flex-wrap gap-6 text-sm">
        <span className="font-medium text-gray-800">Price: ${product.price.toFixed(2)}</span>
        <span className="font-medium text-gray-800">Stock: {product.stock}</span>
      </div>

      {editing && (
        <form action={formAction} className="mt-4 space-y-4">
          <input type="hidden" name="id" value={product.id} />
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              SKU
              <input
                name="sku"
                defaultValue={product.sku}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Name
              <input
                name="name"
                defaultValue={product.name}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </label>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              Price
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product.price}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Stock
              <input
                name="stock"
                type="number"
                min="0"
                defaultValue={product.stock}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </label>
          </div>
          <label className="block text-sm font-medium text-gray-700">
            Description
            <textarea
              name="description"
              defaultValue={product.description ?? ''}
              rows={3}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </label>
          {state.message && <p className="text-sm text-blue-700">{state.message}</p>}
          <div className="flex items-center justify-between">
            <SubmitButton label="Save changes" />
            <button
              type="submit"
              formAction={deleteProductAction}
              className="rounded border border-red-200 px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-100"
            >
              Delete
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
