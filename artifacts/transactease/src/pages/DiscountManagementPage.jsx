import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BadgePercent, CheckCircle2, Edit2, Info, Loader2, Save, TrendingDown, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Common/Layout';
import { discountService } from '../services/discountService';
import { transactionService } from '../services/transactionService';
import { formatCurrency } from '../utils/helpers';

const RANGE_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

const getDateRange = (key) => {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (key === 'today') return { start, end: new Date(start.getTime() + 86400000) };
  if (key === 'week') {
    const ws = new Date(start);
    ws.setDate(start.getDate() - start.getDay());
    return { start: ws, end: new Date(ws.getTime() + 7 * 86400000) };
  }
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end:   new Date(now.getFullYear(), now.getMonth() + 1, 1),
  };
};

const EditModal = ({ discount, onSave, onClose }) => {
  const [name,       setName]       = useState(discount.name);
  const [pct,        setPct]        = useState(discount.percentage);
  const [desc,       setDesc]       = useState(discount.description || '');
  const [saving,     setSaving]     = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name is required.'); return; }
    if (discount.id !== 'promo' && (Number(pct) <= 0 || Number(pct) > 100)) {
      toast.error('Percentage must be between 1 and 100.'); return;
    }
    setSaving(true);
    try {
      await onSave(discount.id, { name: name.trim(), percentage: Number(pct), description: desc.trim() });
      toast.success(`${name.trim()} updated.`);
      onClose();
    } catch {
      toast.error('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#fde68a] px-6 py-5">
          <h3 className="font-extrabold text-[#7a1f1f]">Edit Discount Type</h3>
          <button onClick={onClose} className="rounded-full p-2 text-[#a16207] hover:bg-[#fefce8]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <label className="login-label mb-1.5 block">Display Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="login-input"
              placeholder="e.g. Senior Citizen"
              disabled={discount.isFixed}
            />
            {discount.isFixed && (
              <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                <Info className="h-3 w-3" /> Name locked — required by law.
              </p>
            )}
          </div>

          {discount.id !== 'promo' && (
            <div>
              <label className="login-label mb-1.5 block">Discount Percentage (%)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={pct}
                onChange={(e) => setPct(e.target.value)}
                className="login-input"
                disabled={discount.isFixed}
              />
              {discount.isFixed && (
                <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                  <Info className="h-3 w-3" /> Rate locked — set by Philippine law.
                </p>
              )}
            </div>
          )}

          {discount.id === 'promo' && (
            <p className="rounded-xl border border-[#fde68a] bg-[#fefce8] px-4 py-3 text-sm text-[#a16207]">
              Promo discount allows a custom percentage set by the cashier at checkout.
            </p>
          )}

          <div>
            <label className="login-label mb-1.5 block">Description (optional)</label>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="login-input"
              placeholder="e.g. Staff / crew benefit"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 btn-secondary py-3 text-sm" disabled={saving}>
              Cancel
            </button>
            <button onClick={handleSave} className="flex-1 btn-primary py-3 text-sm font-bold disabled:opacity-60" disabled={saving}>
              {saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : (
                <span className="flex items-center justify-center gap-2">
                  <Save className="h-4 w-4" /> Save Changes
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DiscountManagementPage = () => {
  const [discounts,     setDiscounts]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [transactions,  setTransactions]  = useState([]);
  const [txLoading,     setTxLoading]     = useState(true);
  const [range,         setRange]         = useState('today');
  const [editTarget,    setEditTarget]    = useState(null);
  const [toggling,      setToggling]      = useState(null);

  useEffect(() => {
    const unsub = discountService.subscribeToDiscounts((list) => {
      setDiscounts(list.sort((a, b) => {
        const order = ['senior_citizen', 'pwd', 'employee', 'promo'];
        return (order.indexOf(a.id) ?? 99) - (order.indexOf(b.id) ?? 99);
      }));
      setLoading(false);
    });
    return unsub;
  }, []);

  const loadTransactions = useCallback(async (r) => {
    setTxLoading(true);
    try {
      const { start, end } = getDateRange(r);
      const txs = await transactionService.getTransactionsByDateRange(start, end);
      setTransactions(txs);
    } finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => { loadTransactions(range); }, [loadTransactions, range]);

  const usageStats = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      if (!Number(t.discountAmount || 0)) return;
      const rawType  = (t.discountType || 'Promo').toLowerCase().replace(/\s+/g, '_');
      const matched  = discounts.find((d) => d.name === t.discountType || d.id === rawType);
      const key      = matched?.id || rawType;
      const label    = matched?.name || t.discountType || 'Promo';
      if (!map[key]) map[key] = { key, label, count: 0, totalSaved: 0, totalRevenue: 0 };
      map[key].count       += 1;
      map[key].totalSaved  += Number(t.discountAmount || 0);
      map[key].totalRevenue += Number(t.totalAmount || 0);
    });
    return map;
  }, [transactions, discounts]);

  const overallDiscounted   = transactions.filter((t) => Number(t.discountAmount || 0) > 0).length;
  const overallSaved        = transactions.reduce((s, t) => s + Number(t.discountAmount || 0), 0);
  const overallRevenue      = transactions.reduce((s, t) => s + Number(t.totalAmount || 0), 0);

  const handleToggle = async (discount) => {
    if (discount.isFixed && discount.isActive) {
      toast.error(`${discount.name} is mandatory and cannot be disabled.`);
      return;
    }
    setToggling(discount.id);
    try {
      await discountService.updateDiscount(discount.id, { isActive: !discount.isActive });
      toast.success(`${discount.name} ${!discount.isActive ? 'enabled' : 'disabled'}.`);
    } catch {
      toast.error('Failed to update discount.');
    } finally {
      setToggling(null);
    }
  };

  const handleSaveEdit = async (id, updates) => {
    await discountService.updateDiscount(id, updates);
  };

  const rangeLabel = RANGE_OPTIONS.find((r) => r.key === range)?.label;

  return (
    <Layout
      title="Discount Management"
      subtitle="Configure discount types, rates, and view usage analytics."
    >
      {/* Summary strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Active Discount Types', value: discounts.filter((d) => d.isActive).length, sub: `of ${discounts.length} configured` },
          { label: 'Discounted Orders',     value: overallDiscounted,  sub: rangeLabel },
          { label: 'Total Savings Given',   value: formatCurrency(overallSaved), sub: rangeLabel },
        ].map(({ label, value, sub }) => (
          <div key={label} className="flex flex-col gap-1 rounded-2xl border border-[#fde68a] bg-white px-6 py-5 shadow-sm">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#a16207]">{label}</p>
            <p className="mt-1 text-3xl font-extrabold text-[#7a1f1f]">{value}</p>
            <p className="text-xs text-[#a16207]">{sub}</p>
          </div>
        ))}
      </div>

      {/* Discount type cards */}
      <div className="section-card">
        <div className="admin-card-header">
          <div>
            <h2 className="pos-section-title">Discount Types</h2>
            <p className="pos-section-copy">Enable/disable discount types and adjust rates.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-14">
            <Loader2 className="h-8 w-8 animate-spin text-[#a16207]" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {discounts.map((d) => {
              const stats = usageStats[d.id];
              const isToggling = toggling === d.id;
              return (
                <div
                  key={d.id}
                  className={`rounded-2xl border p-5 transition ${
                    d.isActive
                      ? 'border-[#fde68a] bg-white shadow-sm'
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`rounded-xl p-2 ${d.isActive ? 'bg-red-50 text-[#dc2626]' : 'bg-gray-100 text-gray-400'}`}>
                        <BadgePercent className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-extrabold text-[#5f1717]">{d.name}</p>
                        <p className="text-xs text-[#a16207]">{d.description || '—'}</p>
                      </div>
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => setEditTarget(d)}
                        title="Edit"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[#a16207] transition hover:bg-[#fefce8]"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggle(d)}
                        disabled={isToggling}
                        title={d.isActive ? 'Disable' : 'Enable'}
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                          d.isFixed && d.isActive
                            ? 'cursor-not-allowed text-gray-300'
                            : d.isActive
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        {isToggling
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <CheckCircle2 className="h-4 w-4" />
                        }
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-extrabold text-[#dc2626]">
                        {d.id === 'promo' ? 'Custom' : `${d.percentage}%`}
                      </p>
                      <p className="text-xs text-[#a16207]">
                        {d.isFixed ? 'Rate fixed by law' : 'Admin configurable'}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      d.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {d.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  {stats && (
                    <div className="mt-4 flex gap-3 border-t border-[#fde68a] pt-4">
                      <div className="flex-1 text-center">
                        <p className="text-xs font-extrabold uppercase tracking-wide text-[#a16207]">Used</p>
                        <p className="mt-0.5 text-lg font-extrabold text-[#5f1717]">{stats.count}×</p>
                      </div>
                      <div className="flex-1 border-l border-[#fde68a] text-center">
                        <p className="text-xs font-extrabold uppercase tracking-wide text-[#a16207]">Saved</p>
                        <p className="mt-0.5 text-lg font-extrabold text-[#dc2626]">{formatCurrency(stats.totalSaved)}</p>
                      </div>
                      <div className="flex-1 border-l border-[#fde68a] text-center">
                        <p className="text-xs font-extrabold uppercase tracking-wide text-[#a16207]">Revenue</p>
                        <p className="mt-0.5 text-lg font-extrabold text-[#5f1717]">{formatCurrency(stats.totalRevenue)}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Usage analytics */}
      <div className="section-card overflow-hidden">
        <div className="admin-card-header">
          <div>
            <h2 className="pos-section-title">Usage Analytics</h2>
            <p className="pos-section-copy">How discounts affected revenue — {rangeLabel?.toLowerCase()}.</p>
          </div>
          <div className="flex items-center gap-1 rounded-2xl border border-[#fde68a] bg-[#fefce8] p-1">
            {RANGE_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setRange(key)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  range === key ? 'bg-[#dc2626] text-white shadow-sm' : 'text-[#a16207] hover:bg-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {txLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#a16207]" />
          </div>
        ) : Object.keys(usageStats).length === 0 ? (
          <p className="py-12 text-center text-sm text-[#a16207]">No discounts applied {rangeLabel?.toLowerCase()}.</p>
        ) : (
          <>
            {/* Impact summary */}
            {overallRevenue > 0 && (
              <div className="mx-6 mb-4 flex items-center gap-3 rounded-2xl border border-[#fde68a] bg-[#fefce8] px-5 py-4">
                <TrendingDown className="h-5 w-5 flex-shrink-0 text-[#dc2626]" />
                <p className="text-sm text-[#7a1f1f]">
                  Discounts reduced gross revenue by{' '}
                  <strong>{formatCurrency(overallSaved)}</strong>
                  {' '}({((overallSaved / (overallRevenue + overallSaved)) * 100).toFixed(1)}% of pre-discount total).
                </p>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Discount Type</th>
                    <th>Times Used</th>
                    <th>% of All Orders</th>
                    <th>Total Saved</th>
                    <th className="text-right">Net Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(usageStats).sort((a, b) => b.count - a.count).map((s) => (
                    <tr key={s.key}>
                      <td className="font-semibold text-[#6b241d]">{s.label}</td>
                      <td className="text-[#a16207]">{s.count}</td>
                      <td className="text-[#a16207]">
                        {transactions.length > 0
                          ? `${((s.count / transactions.length) * 100).toFixed(1)}%`
                          : '—'}
                      </td>
                      <td className="font-semibold text-blue-700">
                        {formatCurrency(s.totalSaved)}
                      </td>
                      <td className="text-right font-bold text-[#8f171b]">
                        {formatCurrency(s.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-[#fde68a] bg-[#fefce8] font-extrabold">
                    <td className="text-[#7a1f1f]">Total</td>
                    <td className="text-[#7a1f1f]">{overallDiscounted}</td>
                    <td className="text-[#7a1f1f]">
                      {transactions.length > 0
                        ? `${((overallDiscounted / transactions.length) * 100).toFixed(1)}%`
                        : '—'}
                    </td>
                    <td className="text-blue-700">{formatCurrency(overallSaved)}</td>
                    <td className="text-right text-[#8f171b]">{formatCurrency(overallRevenue)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {editTarget && (
        <EditModal
          discount={editTarget}
          onSave={handleSaveEdit}
          onClose={() => setEditTarget(null)}
        />
      )}
    </Layout>
  );
};

export default DiscountManagementPage;
