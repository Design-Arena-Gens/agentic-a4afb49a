'use client';

import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createProductAction } from './actions';
import { initialProductState } from './state';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
    >
      {pending ? 'Creating...' : 'Add Product'}
    </button>
  );
}

export function NewProductForm() {
  const [state, action] = useFormState(createProductAction, initialProductState);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={action} className="grid gap-4 rounded border border-gray-200 bg-gray-50 p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-sm font-medium text-gray-700">
          SKU
          <input
            name="sku"
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="e.g. PROD-001"
          />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Name
          <input
            name="name"
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="Product name"
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
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Stock
          <input
            name="stock"
            type="number"
            min="0"
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </label>
      </div>
      <label className="text-sm font-medium text-gray-700">
        Description
        <textarea
          name="description"
          rows={3}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="Optional details"
        />
      </label>
      {state.message && <p className="text-sm text-blue-700">{state.message}</p>}
      <SubmitButton />
    </form>
  );
}
