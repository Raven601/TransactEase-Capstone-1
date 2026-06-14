import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

const ProductForm = ({ product, onSave, saving }) => {
  const [formState, setFormState] = useState({
    stockQuantity: 0,
    minimumStockThreshold: 5,
  });

  useEffect(() => {
    if (!product) {
      return;
    }

    setFormState({
      stockQuantity: product.stockQuantity,
      minimumStockThreshold: product.minimumStockThreshold,
    });
  }, [product]);

  if (!product) {
    return (
      <div className="section-card p-6">
        <h2 className="pos-section-title">Product Details</h2>
        <p className="mt-3 text-sm text-[#8a5a2b]">
          Select a product from the report to inspect stock levels and update its reorder settings.
        </p>
      </div>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSave({
      stockQuantity: Number(formState.stockQuantity),
      minimumStockThreshold: Number(formState.minimumStockThreshold),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="section-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="pos-section-title">{product.name}</h2>
          <p className="mt-1 text-sm text-[#8a5a2b]">{product.category || 'Uncategorized'}</p>
        </div>
        <div className="text-right">
          <span className="rounded-full bg-[#fff7db] px-3 py-1 text-sm font-semibold text-[#8a5200]">
            {formatCurrency(product.price || 0)}
          </span>
          {product.variants?.length > 0 && (
            <p className="mt-2 max-w-xs text-xs text-[#8a5a2b]">
              {product.variants.map((variant) => `${variant.name} ${formatCurrency(variant.price)}`).join(', ')}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <label className="block">
          <span className="login-label mb-2 block">Current Stock Quantity</span>
          <input
            type="number"
            min="0"
            value={formState.stockQuantity}
            onChange={(event) => setFormState((current) => ({
              ...current,
              stockQuantity: event.target.value,
            }))}
            className="admin-input"
          />
        </label>

        <label className="block">
          <span className="login-label mb-2 block">Minimum Stock Threshold</span>
          <input
            type="number"
            min="0"
            value={formState.minimumStockThreshold}
            onChange={(event) => setFormState((current) => ({
              ...current,
              minimumStockThreshold: event.target.value,
            }))}
            className="admin-input"
          />
        </label>
      </div>

      <div className="mt-6 rounded-2xl bg-amber-50 p-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Restock Guidance</p>
        <p className="mt-2 text-sm text-amber-900">
          {product.lowStock
            ? `Low stock detected. Suggested reorder: ${product.suggestedRestockQuantity} items.`
            : `Stock looks healthy. Current buffer is ${product.stockQuantity - product.minimumStockThreshold} items above the minimum threshold.`}
        </p>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="btn-primary mt-6 inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        {saving ? 'Saving Changes...' : 'Save Inventory Settings'}
      </button>
    </form>
  );
};

export default ProductForm;
