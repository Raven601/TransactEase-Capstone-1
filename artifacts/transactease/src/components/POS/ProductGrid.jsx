import React, { useEffect, useState } from 'react';
import { AlertTriangle, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext';
import { productService } from '../../services/productService';
import { CATEGORIES } from '../../utils/constants';
import { formatCurrency } from '../../utils/helpers';

const ProductGrid = ({ searchTerm = '' }) => {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES.COMBO_MEALS);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [loading, setLoading] = useState(true);
  const { addToCart, items } = useCart();

  useEffect(() => {
    const unsubscribe = productService.subscribeToProducts((snapshot) => {
      const productsData =
        snapshot.products ||
        snapshot.docs.map((snapshotDoc) => ({
          id: snapshotDoc.id,
          ...snapshotDoc.data(),
        }));

      setProducts(productsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredProducts = products.filter((product) => {
    const matchesCategory = product.category === selectedCategory;
    const searchableText = `${product.name || ''} ${product.sku || ''} ${product.category || ''}`.toLowerCase();
    const matchesSearch = !normalizedSearchTerm || searchableText.includes(normalizedSearchTerm);
    const isAvailable = (product.isAvailable ?? product.is_available ?? true) !== false;
    const inStock = (product.stockQuantity ?? 0) > 0;
    return matchesCategory && matchesSearch && isAvailable && inStock;
  });

  const getSelectedVariant = (product) => {
    if (!product.variants?.length) {
      return null;
    }

    const selectedVariantId = selectedVariants[product.id] || product.variants[0].id;
    return product.variants.find((variant) => variant.id === selectedVariantId) || product.variants[0];
  };

  const getProductCartQuantity = (productId) =>
    items
      .filter((item) => (item.productId || item.id) === productId)
      .reduce((total, item) => total + item.quantity, 0);

  const handleAddToCart = (product) => {
    if (product.stockQuantity <= 0) {
      toast.error('Product out of stock');
      return;
    }

    const currentProductCartQuantity = getProductCartQuantity(product.id);
    if (currentProductCartQuantity >= product.stockQuantity) {
      toast.error(`Only ${product.stockQuantity} ${product.name} item(s) are available.`);
      return;
    }

    const selectedVariant = getSelectedVariant(product);
    const cartItem = selectedVariant
      ? {
          ...product,
          id: `${product.id}::${selectedVariant.id}`,
          productId: product.id,
          name: `${product.name} (${selectedVariant.name})`,
          price: selectedVariant.price,
          selectedVariant,
        }
      : {
          ...product,
          productId: product.id,
        };

    addToCart(cartItem);
    toast.success(`${cartItem.name} added to cart`);
  };

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="pos-product-skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="category-scroll">
        {Object.values(CATEGORIES).map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`pos-filter-tab ${
              selectedCategory === category
                ? 'pos-filter-tab-active'
                : ''
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredProducts.map((product) => {
          const selectedVariant = getSelectedVariant(product);
          const displayPrice = selectedVariant?.price || product.price;
          const productCartQuantity = getProductCartQuantity(product.id);
          const availableStock = Math.max(0, product.stockQuantity - productCartQuantity);

          return (
          <div key={product.id} className="pos-product-card group">
            <div className="pos-product-media">
              <div className="flex items-center justify-center h-full w-full bg-[#fff3e0] rounded-t-2xl px-4 py-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#c62828]">{product.category}</span>
              </div>
            </div>

            <div className="p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-extrabold text-[#5f1717]">{product.name}</h3>
                </div>
                <span
                  className={`stock-badge ${
                    availableStock > product.minimumStockThreshold
                      ? 'stock-badge-ok'
                      : availableStock > 0
                        ? 'stock-badge-warn'
                        : 'stock-badge-danger'
                  }`}
                >
                  {availableStock > 0 ? `${availableStock} left` : 'Out'}
                </span>
              </div>

              {product.variants?.length > 0 && (
                <div className="mb-4">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#8a5a2b]">
                    Variant
                  </label>
                  <select
                    value={selectedVariant?.id}
                    onChange={(event) =>
                      setSelectedVariants((currentVariants) => ({
                        ...currentVariants,
                        [product.id]: event.target.value,
                      }))
                    }
                    className="admin-input py-2 text-sm"
                  >
                    {product.variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.name} - {formatCurrency(variant.price)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#fff8e1] px-3 py-1 text-xs font-bold text-[#9a3412]">
                  {product.category}
                </span>
                {product.lowStock && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Low Stock
                  </span>
                )}
              </div>

              {product.lowStock && (
                <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                  Suggested restock: {product.suggestedRestockQuantity} items
                </p>
              )}

              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#b08968]">Price</p>
                  <p className="text-xl font-extrabold text-[#c62828]">{formatCurrency(displayPrice)}</p>
                </div>
                {productCartQuantity > 0 && (
                  <span className="rounded-full bg-[#f57c00] px-3 py-1 text-xs font-bold text-white shadow-sm">
                    {productCartQuantity} in cart
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleAddToCart(product)}
                disabled={product.stockQuantity <= 0}
                className="mt-4 w-full rounded-xl bg-[#c62828] px-4 py-3 text-sm font-extrabold text-white shadow-[0_14px_24px_rgba(198,40,40,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#ad1f1f] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {product.stockQuantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="empty-state py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff8e1] text-[#c62828]">
            <Search className="h-8 w-8" />
          </div>
          <p className="mt-4 text-lg font-bold text-[#5f1717]">No products found</p>
          <p className="mt-2 text-sm text-[#8a5a2b]">Try another keyword or choose a different category.</p>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
