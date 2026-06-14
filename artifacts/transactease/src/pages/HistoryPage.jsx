import React, { useCallback, useEffect, useState } from 'react';
import { Clock, Search, ShoppingBag } from 'lucide-react';
import { transactionService } from '../services/transactionService';
import AppShell from '../components/Common/AppShell';
import { formatCurrency } from '../utils/helpers';

const HistoryPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const txs = await transactionService.getTodaysTransactions();
      setTransactions(txs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const formatTs = (timestamp) => {
    if (!timestamp) return '—';
    const d = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    return d.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const filtered = transactions.filter((tx) => {
    const q = search.toLowerCase();
    return (
      tx.id.toLowerCase().includes(q) ||
      (tx.paymentMethod || '').toLowerCase().includes(q) ||
      (tx.staffEmail || '').toLowerCase().includes(q) ||
      (tx.orderStatus || '').toLowerCase().includes(q)
    );
  });

  const totalSales = filtered.reduce((s, t) => s + (t.totalAmount || 0), 0);

  return (
    <AppShell
      eyebrow="Staff"
      title="Order History"
      subtitle="All completed transactions for today's shift."
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 rounded-2xl border border-[#fde68a] bg-white px-4 py-2.5 shadow-sm">
          <Search className="h-4 w-4 flex-shrink-0 text-[#dc2626]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, payment, staff..."
            className="w-56 bg-transparent text-sm font-semibold text-[#5f1717] outline-none placeholder:font-normal placeholder:text-[#a16207]"
          />
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-[#a16207]">Orders</p>
            <p className="text-xl font-extrabold text-[#7a1f1f]">{filtered.length}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-[#a16207]">Total Sales</p>
            <p className="text-xl font-extrabold text-[#dc2626]">{formatCurrency(totalSales)}</p>
          </div>
          <button
            onClick={load}
            className="rounded-xl border border-[#fde68a] bg-white px-3 py-1.5 text-xs font-bold text-[#a16207] shadow-sm transition hover:bg-[#fefce8]"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="section-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#fde68a] border-t-[#dc2626]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <ShoppingBag className="h-12 w-12 text-[#fde68a]" />
            <p className="mt-4 font-semibold text-[#6b241d]">No orders found</p>
            <p className="mt-1 text-sm text-[#a16207]">
              {search ? 'Try a different search term.' : 'No orders have been processed today yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date & Time</th>
                  <th>Items</th>
                  <th>Staff</th>
                  <th>Payment</th>
                  <th>Discount</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <tr key={tx.id}>
                    <td className="font-bold text-[#6b241d]">
                      #{tx.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="text-[#a16207]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                        {formatTs(tx.timestamp)}
                      </div>
                    </td>
                    <td className="text-[#a16207]">{tx.items?.length || 0} item(s)</td>
                    <td className="max-w-[160px] truncate text-xs text-[#a16207]">
                      {tx.staffEmail || '—'}
                    </td>
                    <td className="capitalize text-[#a16207]">{tx.paymentMethod || '—'}</td>
                    <td>
                      {tx.discountType ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                          {tx.discountType}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                        {tx.orderStatus || 'Completed'}
                      </span>
                    </td>
                    <td className="text-right font-bold text-[#8f171b]">
                      {formatCurrency(tx.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default HistoryPage;
