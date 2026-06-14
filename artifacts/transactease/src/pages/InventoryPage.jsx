import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, Grid2X2, List, Loader2, Package2, PackageCheck, Save, Search, X } from 'lucide-react';
import Layout from '../components/Common/Layout';
import ProductList from '../components/Inventory/ProductList';
import { productService } from '../services/productService';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/helpers';

const RestockModal = ({ product, onClose, onSave, saving }) => {
  const [formState, setFormState] = React.useState({
    stockQuantity: product.stockQuantity,
    minimumStockThreshold: product.minimumStockThreshold,
  });

  React.useEffect(() => {
    setFormState({
      stockQuantity: product.stockQuantity,
      minimumStockThreshold: product.minimumStockThreshold,
    });
  }, [product]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave({
      stockQuantity: Number(formState.stockQuantity),
      minimumStockThreshold: Number(formState.minimumStockThreshold),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-3xl border border-[#f0d9a7] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#f0d9a7] px-6 py-4">
          <div>
            <h2 className="text-lg font-extrabold text-[#4f1717]">{product.name}</h2>
            <p className="text-sm text-[#8a5a2b]">{product.category || 'Uncategorized'} · {formatCurrency(product.price || 0)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#a16207] transition hover:bg-[#fef9c3]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-3 rounded-2xl bg-[#fef9f0] p-4 text-center text-sm">
            <div>
              <p className="font-bold uppercase tracking-wide text-[#8a5a2b] text-xs">Current Stock</p>
              <p className="mt-1 text-xl font-extrabold text-[#4f1717]">{product.stockQuantity}</p>
            </div>
            <div>
              <p className="font-bold uppercase tracking-wide text-[#8a5a2b] text-xs">Threshold</p>
              <p className="mt-1 text-xl font-extrabold text-[#4f1717]">{product.minimumStockThreshold}</p>
            </div>
            <div>
              <p className="font-bold uppercase tracking-wide text-amber-700 text-xs">Suggested</p>
              <p className="mt-1 text-xl font-extrabold text-amber-700">{product.suggestedRestockQuantity}</p>
            </div>
          </div>

          <label className="block">
            <span className="login-label mb-2 block">New Stock Quantity</span>
            <input
              type="number"
              min="0"
              value={formState.stockQuantity}
              onChange={(e) => setFormState((s) => ({ ...s, stockQuantity: e.target.value }))}
              className="admin-input"
              autoFocus
            />
          </label>

          <label className="block">
            <span className="login-label mb-2 block">Minimum Stock Threshold</span>
            <input
              type="number"
              min="0"
              value={formState.minimumStockThreshold}
              onChange={(e) => setFormState((s) => ({ ...s, minimumStockThreshold: e.target.value }))}
              className="admin-input"
            />
          </label>

          {product.lowStock && (
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800">
                Low stock detected. Suggested reorder: <strong>{product.suggestedRestockQuantity} items</strong>.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 inline-flex items-center justify-center gap-2 py-3 text-sm disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-5 py-3 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InventoryPage = () => {
  const { currentUser, userRole } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortMode, setSortMode] = useState('stock-asc');
  const [viewMode, setViewMode] = useState('list');

  const loadInventoryReport = useCallback(async () => {
    try {
      const inventoryReport = await productService.getInventoryReport();
      setProducts(inventoryReport);
    } catch (error) {
      toast.error('Unable to load inventory report: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventoryReport();
    const unsubscribe = productService.subscribeToProducts(() => {
      loadInventoryReport();
    });
    return () => unsubscribe();
  }, [loadInventoryReport]);

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleSaveProduct = async (updates) => {
    if (!selectedProduct) return;
    setSaving(true);
    const actor = { uid: currentUser?.uid, email: currentUser?.email, role: userRole };
    try {
      await productService.updateProduct(selectedProduct.id, updates, actor);
      toast.success('Inventory updated successfully.');
      setModalOpen(false);
      setSelectedProduct(null);
      await loadInventoryReport();
    } catch (error) {
      toast.error('Failed to update product: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
  };

  const lowStockItems = products.filter((p) => p.lowStock);
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  const filteredProducts = products.filter((product) => {
    const searchableText = `${product.name || ''} ${product.sku || ''} ${product.category || ''}`.toLowerCase();
    const matchesSearch = !searchTerm.trim() || searchableText.includes(searchTerm.trim().toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'low' && product.lowStock) ||
      (statusFilter === 'healthy' && !product.lowStock);
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  }).sort((a, b) => {
    if (sortMode === 'name') return a.name.localeCompare(b.name);
    if (sortMode === 'stock-desc') return b.stockQuantity - a.stockQuantity;
    if (sortMode === 'restock') return b.suggestedRestockQuantity - a.suggestedRestockQuantity;
    return a.stockQuantity - b.stockQuantity;
  });


  return (
    <Layout
      title="Inventory Management"
      subtitle="Review stock health, update reorder thresholds, and manage product readiness."
    >
      {modalOpen && selectedProduct && (
        <RestockModal
          product={selectedProduct}
          onClose={handleCloseModal}
          onSave={handleSaveProduct}
          saving={saving}
        />
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <article className="section-card p-5">
          <PackageCheck className="h-5 w-5 text-[#c62828]" />
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8a5a2b]">Products Tracked</p>
          <p className="mt-4 text-3xl font-bold text-[#7a1f1f]">{products.length}</p>
        </article>
        <article className="section-card bg-red-50 p-5">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">Low Stock Items</p>
          <p className="mt-4 text-3xl font-bold text-red-700">{lowStockItems.length}</p>
        </article>
        <article className="section-card bg-amber-50 p-5">
          <Package2 className="h-5 w-5 text-amber-700" />
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Suggested Reorder Total</p>
          <p className="mt-4 text-3xl font-bold text-amber-800">
            {lowStockItems.reduce((total, p) => total + p.suggestedRestockQuantity, 0)} items
          </p>
        </article>
      </section>

      <div className="section-card p-6 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="pos-section-title">Products Management</h2>
            <p className="mt-1 text-sm text-[#8a5a2b]">
              Click any product row to open the restock window.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 lg:w-auto">
            <div className="staff-search min-h-[46px] flex-1 lg:w-80">
              <Search className="h-5 w-5 text-[#c62828]" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[#b08968]"
                placeholder="Search inventory"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-input min-h-[46px]">
                <option value="all">All Status</option>
                <option value="low">Low Stock</option>
                <option value="healthy">Healthy</option>
              </select>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="admin-input min-h-[46px]">
                <option value="all">All Categories</option>
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <select value={sortMode} onChange={(e) => setSortMode(e.target.value)} className="admin-input min-h-[46px]">
                <option value="stock-asc">Stock: Low to High</option>
                <option value="stock-desc">Stock: High to Low</option>
                <option value="restock">Restock Priority</option>
                <option value="name">Name</option>
              </select>
            </div>
            <div className="inline-flex rounded-2xl border border-[#f0d9a7] bg-white p-1">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inventory-view-toggle ${viewMode === 'list' ? 'inventory-view-toggle-active' : ''}`}
              >
                <List className="h-4 w-4" />
                List
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inventory-view-toggle ${viewMode === 'grid' ? 'inventory-view-toggle-active' : ''}`}
              >
                <Grid2X2 className="h-4 w-4" />
                Grid
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="section-card p-10 text-center text-[#8a5a2b]">Loading inventory report…</div>
      ) : viewMode === 'list' ? (
        <ProductList
          products={filteredProducts}
          selectedProductId={selectedProduct?.id}
          onSelect={handleSelectProduct}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleSelectProduct(product)}
              className="inventory-product-card text-left"
            >
              <div className="inventory-thumb">
                <PackageCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-extrabold text-[#4f1717]">{product.name}</p>
                    <p className="text-sm text-[#8a5a2b]">{product.category || 'Uncategorized'}</p>
                  </div>
                  <span className={`status-badge ${product.lowStock ? 'status-badge-danger' : 'status-badge-success'}`}>
                    {product.statusLabel}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="font-bold text-[#8a5a2b]">Stock</p>
                    <p className="font-extrabold text-[#4f1717]">{product.stockQuantity}</p>
                  </div>
                  <div>
                    <p className="font-bold text-[#8a5a2b]">Threshold</p>
                    <p className="font-extrabold text-[#4f1717]">{product.minimumStockThreshold}</p>
                  </div>
                  <div>
                    <p className="font-bold text-[#8a5a2b]">Restock</p>
                    <p className="font-extrabold text-[#991b1b]">{product.suggestedRestockQuantity}</p>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default InventoryPage;
