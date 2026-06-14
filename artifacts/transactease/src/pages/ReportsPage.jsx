import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BadgePercent, Calendar, FileDown, Loader2, RefreshCw, ShoppingBag, TrendingUp, WalletCards,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import toast from 'react-hot-toast';
import Layout from '../components/Common/Layout';
import { transactionService } from '../services/transactionService';
import { formatCurrency } from '../utils/helpers';

const DATE_MODES = [
  { key: 'today',     label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7',     label: 'Last 7 Days' },
  { key: 'last30',    label: 'Last 30 Days' },
  { key: 'custom',    label: 'Custom Range' },
];

const getDateRange = (mode, customStart, customEnd) => {
  const now = new Date();
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfDay   = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

  switch (mode) {
    case 'today':     return { start: startOfDay(now), end: endOfDay(now) };
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { start: startOfDay(y), end: endOfDay(y) };
    }
    case 'last7': {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      return { start: startOfDay(s), end: endOfDay(now) };
    }
    case 'last30': {
      const s = new Date(now);
      s.setDate(s.getDate() - 29);
      return { start: startOfDay(s), end: endOfDay(now) };
    }
    case 'custom': {
      if (!customStart || !customEnd) return null;
      const s = new Date(customStart + 'T00:00:00');
      const e = new Date(customEnd + 'T00:00:00');
      e.setDate(e.getDate() + 1);
      return { start: s, end: e };
    }
    default: return { start: startOfDay(now), end: endOfDay(now) };
  }
};

const PAYMENT_COLORS = { Cash: '#dc2626', Card: '#2563eb', GCash: '#059669', Maya: '#7c3aed' };
const DISCOUNT_COLORS = ['#dc2626', '#f59e0b', '#059669', '#7c3aed', '#0284c7'];

const ReportsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [exporting, setExporting]       = useState(false);
  const [dateMode, setDateMode]         = useState('today');
  const [customStart, setCustomStart]   = useState('');
  const [customEnd, setCustomEnd]       = useState('');
  const [rangeLabel, setRangeLabel]     = useState('Today');

  const load = useCallback(async () => {
    const range = getDateRange(dateMode, customStart, customEnd);
    if (!range) return;
    setLoading(true);
    try {
      const txs = await transactionService.getTransactionsByDateRange(range.start, range.end);
      setTransactions(txs);
      const found = DATE_MODES.find((m) => m.key === dateMode);
      setRangeLabel(found?.label || 'Custom Range');
    } catch (err) {
      toast.error('Failed to load report: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [dateMode, customStart, customEnd]);

  useEffect(() => {
    if (dateMode === 'custom' && (!customStart || !customEnd)) return;
    load();
  }, [load, dateMode, customStart, customEnd]);

  /* ── Core metrics ── */
  const totalSales     = transactions.reduce((s, t) => s + (t.totalAmount || 0), 0);
  const totalOrders    = transactions.length;
  const discountOrders = transactions.filter((t) => Number(t.discountAmount || 0) > 0).length;
  const avgOrder       = totalOrders > 0 ? totalSales / totalOrders : 0;
  const totalDiscountSavings = transactions.reduce((s, t) => s + Number(t.discountAmount || 0), 0);

  const metrics = [
    { label: 'Total Revenue',       value: formatCurrency(totalSales), icon: TrendingUp,   color: 'text-[#dc2626] bg-red-50' },
    { label: 'Orders',              value: totalOrders,                icon: ShoppingBag,  color: 'text-amber-700 bg-amber-50' },
    { label: 'Average Order Value', value: formatCurrency(avgOrder),   icon: WalletCards,  color: 'text-emerald-700 bg-emerald-50' },
    { label: 'Discount Orders',     value: discountOrders,             icon: BadgePercent, color: 'text-blue-700 bg-blue-50' },
  ];

  /* ── Payment breakdown ── */
  const paymentBreakdown = ['cash', 'card', 'gcash', 'maya'].map((method) => ({
    method: method.charAt(0).toUpperCase() + method.slice(1),
    count:  transactions.filter((t) => t.paymentMethod === method).length,
    total:  transactions.filter((t) => t.paymentMethod === method).reduce((s, t) => s + (t.totalAmount || 0), 0),
  })).filter((m) => m.count > 0);

  /* ── Discount breakdown ── */
  const discountBreakdown = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      if (!Number(t.discountAmount || 0)) return;
      const type = t.discountType || 'Custom';
      if (!map[type]) map[type] = { type, count: 0, totalSaved: 0 };
      map[type].count      += 1;
      map[type].totalSaved += Number(t.discountAmount || 0);
    });
    return Object.values(map).sort((a, b) => b.totalSaved - a.totalSaved);
  }, [transactions]);

  /* ── Top items ── */
  const topItems = Object.values(
    transactions.flatMap((t) => t.items || []).reduce((map, item) => {
      const key = item.name;
      if (!map[key]) map[key] = { name: key, qty: 0, revenue: 0 };
      map[key].qty     += item.quantity || 1;
      map[key].revenue += (item.price || 0) * (item.quantity || 1);
      return map;
    }, {})
  ).sort((a, b) => b.qty - a.qty).slice(0, 5);

  /* ── Time-series chart ── */
  const isMultiDay = ['last7', 'last30', 'custom'].includes(dateMode);
  const chartData = isMultiDay
    ? (() => {
        const map = transactions.reduce((m, t) => {
          const d = t.timestamp?.seconds ? new Date(t.timestamp.seconds * 1000) : new Date(t.timestamp);
          const key = d.toISOString().slice(0, 10);
          m[key] = (m[key] || 0) + (t.totalAmount || 0);
          return m;
        }, {});
        return Object.entries(map)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, sales]) => ({
            time: new Date(date + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
            sales: parseFloat(sales.toFixed(2)),
          }));
      })()
    : Array.from({ length: 14 }, (_, i) => {
        const hour = i + 7;
        const label = `${hour <= 12 ? hour : hour - 12}${hour < 12 ? 'am' : 'pm'}`;
        const hourTxs = transactions.filter((tx) => {
          const d = tx.timestamp?.seconds ? new Date(tx.timestamp.seconds * 1000) : new Date(tx.timestamp);
          return d.getHours() === hour;
        });
        return { time: label, sales: parseFloat(hourTxs.reduce((s, t) => s + (t.totalAmount || 0), 0).toFixed(2)) };
      });

  const peakBucket = chartData.reduce((best, h) => h.sales > best.sales ? h : best, { time: '—', sales: 0 });

  /* ── EOD export ── */
  const handleExportEOD = () => {
    setExporting(true);
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-PH', { timeStyle: 'short' });

      const eodTopItems = Object.values(
        transactions.flatMap((t) => t.items || []).reduce((map, item) => {
          const key = item.name;
          if (!map[key]) map[key] = { name: key, qty: 0, revenue: 0 };
          map[key].qty     += item.quantity || 1;
          map[key].revenue += (item.price || 0) * (item.quantity || 1);
          return map;
        }, {})
      ).sort((a, b) => b.qty - a.qty);

      const lines = [
        `WIMPY'S MAGSAYSAY — SALES REPORT`,
        `Period: ${rangeLabel}`,
        `Generated: ${timeStr}`,
        ``,
        `====== SUMMARY ======`,
        `Gross Revenue     : ${formatCurrency(totalSales)}`,
        `Total Orders      : ${totalOrders}`,
        `Average Order     : ${formatCurrency(avgOrder)}`,
        `Discount Savings  : ${formatCurrency(totalDiscountSavings)}`,
        ``,
        `====== PAYMENT BREAKDOWN ======`,
        ...paymentBreakdown.map((p) => `${p.method.padEnd(18)}: ${p.count} orders — ${formatCurrency(p.total)}`),
        ``,
        `====== TOP SELLING ITEMS ======`,
        ...eodTopItems.slice(0, 10).map((item, i) =>
          `${String(i + 1).padStart(2)}. ${item.name.padEnd(35)} ${String(item.qty).padStart(3)} sold — ${formatCurrency(item.revenue)}`
        ),
        ``,
        `====== TRANSACTION LOG ======`,
        `Order #    Time                   Payment    Total`,
        ...transactions.map((tx) => {
          const ts = tx.timestamp?.seconds ? new Date(tx.timestamp.seconds * 1000) : new Date(tx.timestamp);
          return `#${tx.id.slice(0, 8).toUpperCase()}  ${ts.toLocaleString('en-PH', { dateStyle: 'short', timeStyle: 'short' }).padEnd(22)}  ${(tx.paymentMethod || '—').padEnd(10)} ${formatCurrency(tx.totalAmount)}`;
        }),
      ];

      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = `wimpy-report-${dateMode}-${now.toISOString().slice(0, 10)}.txt`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch (err) {
      toast.error('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout
      title="Reports"
      subtitle={`Sales performance · ${rangeLabel}`}
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={load}
            className="rounded-xl border border-[#fde68a] bg-white px-4 py-2 text-sm font-bold text-[#a16207] shadow-sm transition hover:bg-[#fefce8] inline-flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={handleExportEOD}
            disabled={exporting || loading}
            className="btn-secondary inline-flex items-center gap-2 py-2 px-4 text-sm disabled:opacity-60"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            {exporting ? 'Generating…' : 'Export Report'}
          </button>
        </div>
      }
    >
      {/* Date range controls */}
      <div className="section-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#a16207]">
            <Calendar className="h-4 w-4" />
            Period:
          </div>
          <div className="flex flex-wrap gap-2">
            {DATE_MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => setDateMode(m.key)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                  dateMode === m.key
                    ? 'bg-[#dc2626] text-white shadow-sm'
                    : 'border border-[#fde68a] bg-white text-[#a16207] hover:bg-[#fefce8]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {dateMode === 'custom' && (
            <div className="flex flex-wrap items-center gap-2 mt-2 w-full">
              <label className="text-xs font-bold text-[#a16207]">From:</label>
              <input
                type="date"
                value={customStart}
                max={customEnd || new Date().toISOString().slice(0, 10)}
                onChange={(e) => setCustomStart(e.target.value)}
                className="admin-input w-auto text-sm py-1.5 px-3"
              />
              <label className="text-xs font-bold text-[#a16207]">To:</label>
              <input
                type="date"
                value={customEnd}
                min={customStart}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="admin-input w-auto text-sm py-1.5 px-3"
              />
              {(!customStart || !customEnd) && (
                <p className="text-xs text-amber-600 font-semibold">Select both dates to load report.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#fde68a] border-t-[#dc2626]" />
        </div>
      ) : (
        <>
          {/* Metric cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-4 rounded-2xl border border-[#fde68a] bg-white px-5 py-4 shadow-sm">
                <div className={`rounded-xl p-3 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#a16207]">{label}</p>
                  <p className="mt-0.5 text-xl font-extrabold text-[#5f1717]">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Sales chart */}
          <div className="section-card">
            <div className="admin-card-header">
              <div>
                <h2 className="pos-section-title">{isMultiDay ? 'Daily Sales' : 'Hourly Sales'}</h2>
                <p className="pos-section-copy">Revenue per {isMultiDay ? 'day' : 'hour'} for {rangeLabel.toLowerCase()}.</p>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#a16207' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#a16207' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #fde68a', fontSize: 12 }}
                    formatter={(v) => [formatCurrency(v), 'Sales']}
                  />
                  <Bar dataKey="sales" fill="#dc2626" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary Report */}
          <div className="section-card p-6 space-y-5">
            <div>
              <h2 className="pos-section-title">Summary Report</h2>
              <p className="pos-section-copy mt-1">{rangeLabel} · {totalOrders} order{totalOrders !== 1 ? 's' : ''}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Gross Revenue',    value: formatCurrency(totalSales),           sub: `${totalOrders} orders` },
                { label: 'Average Order',    value: formatCurrency(avgOrder),             sub: 'per transaction' },
                { label: 'Discount Savings', value: formatCurrency(totalDiscountSavings), sub: `${discountOrders} discounted orders` },
                { label: peakBucket.sales > 0 ? (isMultiDay ? 'Best Day' : 'Peak Hour') : 'Peak',
                  value: peakBucket.sales > 0 ? peakBucket.time : '—',
                  sub: peakBucket.sales > 0 ? formatCurrency(peakBucket.sales) : 'No sales' },
              ].map(({ label, value, sub }) => (
                <div key={label} className="rounded-2xl border border-[#fde68a] bg-[#fefce8] p-4">
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#a16207]">{label}</p>
                  <p className="mt-1.5 text-2xl font-extrabold text-[#5f1717]">{value}</p>
                  <p className="mt-0.5 text-xs text-[#a16207]">{sub}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-[#a16207]">Top Selling Items</h3>
                {topItems.length === 0 ? (
                  <p className="text-sm text-[#a16207]">No items sold in this period.</p>
                ) : (
                  <div className="space-y-2">
                    {topItems.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-3 rounded-xl bg-[#fef9f0] px-4 py-3">
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#c62828] text-xs font-extrabold text-white">{i + 1}</span>
                        <span className="min-w-0 flex-1 truncate font-semibold text-[#5f1717]">{item.name}</span>
                        <span className="rounded-full bg-[#fde68a] px-2.5 py-0.5 text-xs font-extrabold text-[#a16207]">{item.qty} sold</span>
                        <span className="font-bold text-[#dc2626]">{formatCurrency(item.revenue)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-[#a16207]">Payment Breakdown</h3>
                {paymentBreakdown.length === 0 ? (
                  <p className="text-sm text-[#a16207]">No payments in this period.</p>
                ) : (
                  <div className="space-y-2">
                    {paymentBreakdown.map(({ method, count, total }) => (
                      <div key={method} className="flex items-center gap-3 rounded-xl bg-[#fef9f0] px-4 py-3">
                        <span className="flex-1 font-semibold capitalize text-[#5f1717]">{method}</span>
                        <span className="text-xs text-[#a16207]">{count} order{count !== 1 ? 's' : ''}</span>
                        <span className="font-bold text-[#dc2626]">{formatCurrency(total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Discount Analytics */}
          {discountBreakdown.length > 0 && (
            <div className="section-card">
              <div className="admin-card-header">
                <div>
                  <h2 className="pos-section-title">Discount Analytics</h2>
                  <p className="pos-section-copy">
                    {discountOrders} discounted order{discountOrders !== 1 ? 's' : ''} ·{' '}
                    {formatCurrency(totalDiscountSavings)} total savings — {rangeLabel.toLowerCase()}.
                  </p>
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-extrabold text-blue-700">
                  {totalOrders > 0
                    ? `${((discountOrders / totalOrders) * 100).toFixed(1)}% of orders`
                    : 'No discounts'}
                </span>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  {discountBreakdown.map(({ type, count, totalSaved }, idx) => (
                    <div key={type} className="flex items-center justify-between rounded-xl border border-[#fde68a] bg-[#fefce8] px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: DISCOUNT_COLORS[idx % DISCOUNT_COLORS.length] }} />
                        <div>
                          <p className="font-semibold text-[#5f1717]">{type}</p>
                          <p className="text-xs text-[#a16207]">{count} order{count !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#dc2626]">{formatCurrency(totalSaved)}</p>
                        <p className="text-xs text-[#a16207]">saved</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between rounded-xl border border-[#dc2626] bg-red-50 px-4 py-3">
                    <p className="font-extrabold text-[#7a1f1f]">Total Discounts Given</p>
                    <p className="font-extrabold text-[#dc2626]">{formatCurrency(totalDiscountSavings)}</p>
                  </div>
                </div>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={discountBreakdown} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" />
                      <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#a16207' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#a16207' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: '1px solid #fde68a', fontSize: 12 }}
                        formatter={(v) => [formatCurrency(v), 'Savings']}
                      />
                      <Bar dataKey="totalSaved" radius={[6, 6, 0, 0]}>
                        {discountBreakdown.map((_, idx) => (
                          <Cell key={idx} fill={DISCOUNT_COLORS[idx % DISCOUNT_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Log */}
          <div className="section-card overflow-hidden">
            <div className="admin-card-header">
              <div>
                <h2 className="pos-section-title">Transaction Log</h2>
                <p className="pos-section-copy">{totalOrders} order{totalOrders !== 1 ? 's' : ''} in {rangeLabel.toLowerCase()}.</p>
              </div>
            </div>
            {transactions.length === 0 ? (
              <p className="py-10 text-center text-sm text-[#a16207]">No transactions in this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Date / Time</th>
                      <th>Items</th>
                      <th>Staff</th>
                      <th>Payment</th>
                      <th>Discount</th>
                      <th>Status</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => {
                      const ts = tx.timestamp?.seconds ? new Date(tx.timestamp.seconds * 1000) : new Date(tx.timestamp);
                      return (
                        <tr key={tx.id}>
                          <td className="font-bold text-[#6b241d]">#{tx.id.slice(0, 8).toUpperCase()}</td>
                          <td className="text-[#a16207] text-xs">
                            <div>{ts.toLocaleDateString('en-PH', { dateStyle: 'short' })}</div>
                            <div className="font-semibold">{ts.toLocaleTimeString('en-PH', { timeStyle: 'short' })}</div>
                          </td>
                          <td className="text-[#a16207]">{tx.items?.length || 0}</td>
                          <td className="max-w-[130px] truncate text-xs text-[#a16207]">{tx.staffEmail || '—'}</td>
                          <td className="capitalize text-[#a16207]">{tx.paymentMethod || '—'}</td>
                          <td>
                            {Number(tx.discountAmount || 0) > 0 ? (
                              <span className="inline-flex flex-col text-xs">
                                <span className="font-semibold text-blue-700">{tx.discountType || 'Custom'}</span>
                                <span className="text-[#a16207]">−{formatCurrency(tx.discountAmount)}</span>
                              </span>
                            ) : (
                              <span className="text-xs text-[#a16207]">—</span>
                            )}
                          </td>
                          <td>
                            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                              {tx.orderStatus || 'Completed'}
                            </span>
                          </td>
                          <td className="text-right font-bold text-[#8f171b]">{formatCurrency(tx.totalAmount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
};

export default ReportsPage;
