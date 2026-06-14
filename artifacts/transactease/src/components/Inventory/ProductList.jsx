import React from 'react';
import { AlertTriangle, PackageCheck } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

const ProductList = ({ products, selectedProductId, onSelect }) => {
  return (
    <div className="overflow-hidden rounded-[18px] border border-[#f0d9a7] bg-white shadow-[0_18px_40px_rgba(122,31,31,0.08)]">
      <div className="overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Min Threshold</th>
              <th>Restock Suggestion</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const isSelected = product.id === selectedProductId;

              return (
                <tr
                  key={product.id}
                  onClick={() => onSelect(product)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#fff0dd]' : ''
                  }`}
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold text-[#6b241d]">{product.name}</p>
                        <p className="text-sm text-[#8a5a2b]">{product.category || 'Uncategorized'}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="space-y-1">
                      <p>{formatCurrency(product.price || 0)}</p>
                      {product.variants?.length > 0 && (
                        <p className="text-xs text-[#8a5a2b]">
                          {product.variants.map((variant) => `${variant.name} ${formatCurrency(variant.price)}`).join(', ')}
                        </p>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="rounded-full bg-[#fff7db] px-3 py-1 text-sm font-semibold text-[#8a5200]">
                      {product.stockQuantity} items
                    </span>
                  </td>
                  <td>{product.minimumStockThreshold}</td>
                  <td className="font-semibold text-amber-700">
                    Restock {product.suggestedRestockQuantity} items
                  </td>
                  <td>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                        product.lowStock
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {product.lowStock ? (
                        <AlertTriangle className="h-3.5 w-3.5" />
                      ) : (
                        <PackageCheck className="h-3.5 w-3.5" />
                      )}
                      {product.statusLabel}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductList;
