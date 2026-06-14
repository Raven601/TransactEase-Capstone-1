import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowRight, BadgePercent, BarChart2, Clock, Package,
  ShoppingBag, TrendingUp, X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { productService } from '../services/productService';
import { transactionService } from '../services/transactionService';
import AppShell from '../components/Common/AppShell';
import { formatCurrency } from '../utils/helpers';

const ShiftSummaryModal = ({ summary, onClose }) => {
  const { totalSales, totalOrders, avgOrder, discountsApplied, totalDiscountSaved,
          paymentBreakdown, topItems, transactions } = summary;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#fde68a] px-6 py-5">
          <div>
            <h2 className="text-lg font-extrabold text-[#7a1f1f]">Shift Summary</h2>
            <p className="text-xs text-[#a16207]">
              {new Date().toLocaleDateString('en-PH', { dateStyle: 'full' })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#a16207] transition hover:bg-[#fefce8]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Core metrics */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Sales',    value: formatCurrency(totalSales),   icon: TrendingUp,   bg: 'bg-red-50 text-[#dc2626]' },
              { label: 'Total Orders',   value: totalOrders,                  icon: ShoppingBag,  bg: 'bg-amber-50 text-amber-700' },
              { label: 'Average Order',  value: formatCurrency(avgOrder),     icon: BarChart2,    bg: 'bg-emerald-50 text-emerald-700' },
              { label: 'Discounts Used', value: discountsApplied,             icon: BadgePercent, bg: 'bg-blue-50 text-blue-700' },
            ].map(({ label, value, icon: Icon, bg }) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border border-[#fde68a] bg-[#fefce8] px-4 py-3">
                <div className={`rounded-xl p-2 ${bg}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-[#a16207]">{label}</p>
                  <p className="mt-0.5 text-lg font-extrabold text-[#5f1717]">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Discounts */}
          {discountsApplied > 0 && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
              <p className="font-semibold text-blue-800">
                <BadgePercent className="inline h-4 w-4 mr-1" />
                Total discount savings given: <span className="font-extrabold">{formatCurrency(totalDiscountSaved)}</span>
              </p>
            </div>
          )}

          {/* Payment methods */}
          {paymentBreakdown.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-extrabold uppercase tracking-widest text-[#a16207]">Payment Methods</h3>
              <div className="space-y-2">
                {paymentBreakdown.map(({ method, count, total }) => (
                  <div key={method} className="flex items-center justify-between rounded-xl bg-[#fefce8] px-4 py-2.5">
                    <div>
                      <p className="text-sm font-semibold capitalize text-[#5f1717]">{method}</p>
                      <p className="text-xs text-[#a16207]">{count} order{count !== 1 ? 's' : ''}</p>
                    </div>
                    <p className="font-bold text-[#dc2626]">{formatCurrency(total)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top items */}
          {topItems.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-extrabold uppercase tracking-widest text-[#a16207]">Top Items Sold Today</h3>
              <div className="space-y-2">
                {topItems.map(({ name, qty, revenue }, idx) => (
                  <div key={name} className="flex items-center gap-3 rounded-xl bg-[#fefce8] px-4 py-2.5">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#dc2626] text-xs font-extrabold text-white">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#5f1717]">{name}</p>
                      <p className="text-xs text-[#a16207]">{qty} sold</p>
                    </div>
                    <p className="font-bold text-[#dc2626]">{formatCurrency(revenue)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalOrders === 0 && (
            <p className="py-4 text-center text-sm text-[#a16207]">No orders have been processed this shift yet.</p>
          )}

          <button
            onClick={onClose}
            className="w-full btn-primary py-3 text-sm font-bold"
          >
            Close Summary
          </button>
        </div>
      </div>
    </div>
  );
};

const POSPage = () => {
  const [lowStockItems, setLowStockItems]   = useState([]);
  const [salesSummary, setSalesSummary]     = useState({ totalSales: 0, totalOrders: 0, transactions: [] });
  const [showShiftSummary, setShowShiftSummary] = useState(false);

  useEffect(() => {
    const unsubscribe = productService.subscribeToLowStockProducts(setLowStockItems);
    return () => unsubscribe();
  }, []);

  const loadSalesSummary = useCallback(async () => {
    const summary = await transactionService.getDailySalesSummary();
    setSalesSummary(summary);
  }, []);

  useEffect(() => { loadSalesSummary(); }, [loadSalesSummary]);

  const discountsApplied = useMemo(
    () => salesSummary.transactions?.filter((t) => Number(t.discountAmount || 0) > 0).length || 0,
    [salesSummary.transactions],
  );

  const shiftSummaryData = useMemo(() => {
    const txs = salesSummary.transactions || [];
    const totalSales     = txs.reduce((s, t) => s + (t.totalAmount || 0), 0);
    const totalOrders    = txs.length;
    const avgOrder       = totalOrders > 0 ? totalSales / totalOrders : 0;
    const totalDiscountSaved = txs.reduce((s, t) => s + Number(t.discountAmount || 0), 0);

    const paymentMap = {};
    txs.forEach((t) => {
      const m = t.paymentMethod || 'cash';
      if (!paymentMap[m]) paymentMap[m] = { method: m, count: 0, total: 0 };
      paymentMap[m].count += 1;
      paymentMap[m].total += t.totalAmount || 0;
    });

    const itemMap = {};
    txs.forEach((t) => {
      t.items?.forEach((item) => {
        const key = item.productId || item.id || item.name;
        if (!itemMap[key]) itemMap[key] = { name: item.name, qty: 0, revenue: 0 };
        itemMap[key].qty     += Number(item.quantity || 0);
        itemMap[key].revenue += Number(item.price || 0) * Number(item.quantity || 0);
      });
    });

    return {
      totalSales,
      totalOrders,
      avgOrder,
      discountsApplied,
      totalDiscountSaved,
      paymentBreakdown: Object.values(paymentMap),
      topItems: Object.values(itemMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      transactions: txs,
    };
  }, [salesSummary.transactions, discountsApplied]);

  const stats = [
    { label: 'Total Sales Today', value: formatCurrency(salesSummary.totalSales), icon: TrendingUp,    tone: 'pos-stat-red' },
    { label: 'Orders Today',      value: salesSummary.totalOrders,                icon: ShoppingBag,   tone: 'pos-stat-orange' },
    { label: 'Low Stock Alerts',  value: lowStockItems.length,                    icon: AlertTriangle, tone: 'pos-stat-gold' },
    { label: 'Discounts Applied', value: discountsApplied,                        icon: BadgePercent,  tone: 'pos-stat-emerald' },
  ];

  const recentTransactions = salesSummary.transactions?.slice(0, 8) || [];

  return (
    <>
      <AppShell
        eyebrow="Staff"
        title="Dashboard"
        subtitle="Your shift summary — sales performance, alerts, and recent orders at a glance."
      >
        {/* Hero */}
        <section className="staff-hero">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-sm font-bold text-[#9a3412] shadow-sm">
              <Clock className="h-4 w-4" />
              Live overview
            </div>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight text-[#5f1717] md:text-4xl">
              Good day, cashier
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7c4a21] md:text-base">
              Here's your shift summary. Head to <strong>Orders</strong> in the top bar to create and manage customer orders.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 self-start">
            <button
              onClick={() => setShowShiftSummary(true)}
              className="btn-secondary inline-flex items-center gap-2 px-5 py-3 text-sm font-bold"
            >
              <BarChart2 className="h-4 w-4" />
              View Shift Summary
            </button>
            <Link
              to="/orders"
              className="btn-primary inline-flex items-center gap-2 px-5 py-3 text-sm font-bold"
            >
              Go to Orders
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, tone }) => (
            <article key={label} className={`pos-stat-card ${tone}`}>
              <div className="pos-stat-icon">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#8a5a2b]">{label}</p>
                <p className="mt-2 text-2xl font-extrabold text-[#5f1717]">{value}</p>
              </div>
            </article>
          ))}
        </section>

        {lowStockItems.length > 0 && (
          <div className="rounded-[18px] border border-red-200 bg-red-50 px-5 py-4 text-red-700 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Low stock alert</p>
                <p className="text-sm">
                  {lowStockItems.map((p) => p.name).join(', ')}{' '}
                  {lowStockItems.length === 1 ? 'is' : 'are'} at or below the minimum threshold. Please notify your admin.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recent orders */}
        <section className="section-card overflow-hidden">
          <div className="admin-card-header">
            <div>
              <h2 className="pos-section-title">Recent Orders Today</h2>
              <p className="pos-section-copy">Last {recentTransactions.length} completed transactions this shift.</p>
            </div>
            <span className="rounded-full bg-[#fef9c3] px-3 py-1 text-sm font-extrabold text-[#dc2626]">
              {salesSummary.totalOrders} total
            </span>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center text-[#a16207]">
              <Package className="h-12 w-12 text-[#fde68a]" />
              <p className="mt-4 font-semibold text-[#6b241d]">No orders yet today</p>
              <p className="mt-1 text-sm">Completed orders will appear here once processed.</p>
              <Link
                to="/orders"
                className="btn-primary mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold"
              >
                Create First Order
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Time</th>
                    <th>Items</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx) => {
                    const ts = tx.timestamp?.seconds
                      ? new Date(tx.timestamp.seconds * 1000)
                      : new Date(tx.timestamp);
                    return (
                      <tr key={tx.id}>
                        <td className="font-bold text-[#6b241d]">#{tx.id.slice(0, 8).toUpperCase()}</td>
                        <td className="text-[#a16207]">
                          {ts.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="text-[#a16207]">{tx.items?.length || 0} item(s)</td>
                        <td className="capitalize text-[#a16207]">{tx.paymentMethod || '—'}</td>
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
        </section>
      </AppShell>

      {showShiftSummary && (
        <ShiftSummaryModal
          summary={shiftSummaryData}
          onClose={() => setShowShiftSummary(false)}
        />
      )}
    </>
  );
};

export default POSPage;
