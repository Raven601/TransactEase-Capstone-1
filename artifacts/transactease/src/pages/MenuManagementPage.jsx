import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Database, Loader2, Package, Pencil, Plus, Search, Trash2, X, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Common/Layout';
import { productService } from '../services/productService';
import { menuSeedService } from '../services/menuSeedService';
import { useAuth } from '../context/AuthContext';
import { CATEGORY_LIST } from '../utils/constants';
import { formatCurrency } from '../utils/helpers';

const EMPTY_FORM = { name: '', category: CATEGORY_LIST[0], price: '', is_available: true };

const MenuFormModal = ({ editingId, form, setForm, onSave, onClose, saving }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full max-w-lg rounded-3xl border border-[#fde68a] bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-[#fde68a] px-6 py-4">
        <h2 className="text-lg font-extrabold text-[#5f1717]">
          {editingId ? 'Edit Menu Item' : 'Add New Menu Item'}
        </h2>
        <button onClick={onClose} className="rounded-full p-2 text-[#a16207] transition hover:bg-[#fef9c3]">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={onSave} className="p-6 space-y-4">
        <div>
          <label className="login-label mb-1 block">Product Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="login-input"
            placeholder="e.g. Chicken Dinner (Combo)"
            required
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="login-label mb-1 block">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="login-input"
            >
              {CATEGORY_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="login-label mb-1 block">Price (₱)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="login-input"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div className="rounded-2xl bg-[#fefce8] border border-[#fde68a] px-4 py-3">
          <p className="text-xs font-bold text-[#a16207]">
            Stock quantity is managed separately in <strong>Inventory Management</strong>.
          </p>
        </div>

        <div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#5f1717]">
            <input
              type="checkbox"
              checked={form.is_available}
              onChange={(e) => setForm((f) => ({ ...f, is_available: e.target.checked }))}
              className="h-4 w-4 accent-[#dc2626]"
            />
            Available on menu
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex-1 inline-flex items-center justify-center gap-2 py-3 text-sm disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Product'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary px-5 py-3 text-sm">
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
);

const MenuManagementPage = () => {
  const { currentUser, userRole } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortField, setSortField] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const unsubscribe = productService.subscribeToProducts((snapshot) => {
      setProducts(snapshot.products || []);
      setLoading(false);
    });
    return () => unsubscribe?.();
  }, []);

  const categories = ['All', ...CATEGORY_LIST];

  const filtered = products
    .filter((p) => {
      const q = search.toLowerCase();
      const matchSearch = p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
      const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      let av = a[sortField] ?? '';
      let bv = b[sortField] ?? '';
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });

  const handleSort = (field) => {
    if (sortField === field) setSortAsc((v) => !v);
    else { setSortField(field); setSortAsc(true); }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || '',
      category: product.category || CATEGORY_LIST[0],
      price: product.price ?? '',
      is_available: product.isAvailable ?? product.is_available ?? true,
    });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); };

  const actor = { uid: currentUser?.uid, email: currentUser?.email, role: userRole };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.price || isNaN(Number(form.price))) { toast.error('Valid price is required'); return; }
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        category: form.category,
        price: Number(form.price),
        is_available: form.is_available,
        updated_at: new Date(),
      };
      if (editingId) {
        await productService.updateProduct(editingId, data, actor);
        toast.success('Product updated');
      } else {
        await productService.addProduct({ ...data, created_at: new Date() }, actor);
        toast.success('Product added');
      }
      closeForm();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      await productService.deleteProduct(product.id, actor);
      toast.success(`${product.name} deleted`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggleAvailable = async (product) => {
    try {
      await productService.updateProduct(product.id, { is_available: !(product.isAvailable ?? product.is_available) }, actor);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSeedMenu = async () => {
    const already = await menuSeedService.isAlreadySeeded();
    if (already) {
      if (!window.confirm('Products already exist. Seed again and add more items?')) return;
    }
    setSeeding(true);
    try {
      const count = await menuSeedService.seedMenu();
      toast.success(`Seeded ${count} menu items!`);
    } catch (err) {
      toast.error('Seed failed: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="ml-1 text-[#c9a66b] opacity-40">↕</span>;
    return sortAsc
      ? <ChevronUp className="ml-1 inline h-3.5 w-3.5 text-[#dc2626]" />
      : <ChevronDown className="ml-1 inline h-3.5 w-3.5 text-[#dc2626]" />;
  };

  return (
    <Layout
      title="Menu Management"
      subtitle={`${products.length} products across ${CATEGORY_LIST.length} categories`}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleSeedMenu}
            disabled={seeding}
            className="btn-secondary inline-flex items-center gap-2 py-2.5 text-sm disabled:opacity-60"
          >
            <Database className="h-4 w-4" />
            {seeding ? 'Seeding…' : 'Seed Menu'}
          </button>
          <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2 py-2.5">
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>
      }
    >
      {showForm && (
        <MenuFormModal
          editingId={editingId}
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onClose={closeForm}
          saving={saving}
        />
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-2xl border border-[#fde68a] bg-white px-4 py-2.5 shadow-sm">
          <Search className="h-4 w-4 flex-shrink-0 text-[#dc2626]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-48 bg-transparent text-sm font-semibold text-[#5f1717] outline-none placeholder:font-normal placeholder:text-[#a16207]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-[#a16207] hover:text-[#dc2626]">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
                categoryFilter === cat
                  ? 'border-[#dc2626] bg-[#dc2626] text-white'
                  : 'border-[#fde68a] bg-white text-[#a16207] hover:bg-[#fefce8]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs font-semibold text-[#a16207]">{filtered.length} items</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#fde68a] border-t-[#dc2626]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-12 w-12 text-[#fde68a]" />
          <p className="mt-4 font-semibold text-[#6b241d]">No items found</p>
          <p className="mt-1 text-sm text-[#a16207]">Try a different search or category, or seed the menu.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#fde68a] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#fde68a] bg-[#fefce8] text-left text-xs font-extrabold uppercase tracking-wider text-[#a16207]">
                  <th className="cursor-pointer px-4 py-3 hover:text-[#dc2626]" onClick={() => handleSort('name')}>
                    Name <SortIcon field="name" />
                  </th>
                  <th className="cursor-pointer px-4 py-3 hover:text-[#dc2626]" onClick={() => handleSort('category')}>
                    Category <SortIcon field="category" />
                  </th>
                  <th className="cursor-pointer px-4 py-3 hover:text-[#dc2626]" onClick={() => handleSort('price')}>
                    Price <SortIcon field="price" />
                  </th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#fef9c3]">
                {filtered.map((product) => {
                  const available = product.isAvailable ?? product.is_available ?? true;
                  const stock = product.stockQuantity ?? product.stock_quantity ?? 0;
                  const isOut = stock === 0;
                  return (
                    <tr key={product.id} className="group transition hover:bg-[#fffbeb]">
                      <td className="px-4 py-3 font-semibold text-[#5f1717]">{product.name}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-[#fef9c3] px-2 py-0.5 text-xs font-bold text-[#a16207]">
                          {product.category || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-[#dc2626]">{formatCurrency(product.price)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleAvailable(product)}
                          title="Toggle availability"
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition hover:opacity-80 ${
                            available && !isOut
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {available && !isOut ? (
                            <><CheckCircle2 className="h-3.5 w-3.5" /> Available</>
                          ) : (
                            <><XCircle className="h-3.5 w-3.5" /> {isOut ? 'Out of Stock' : 'Unavailable'}</>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(product)}
                            className="action-button action-button-edit"
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="action-button action-button-delete"
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MenuManagementPage;
