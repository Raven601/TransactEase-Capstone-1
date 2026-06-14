import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, ShoppingBag, QrCode, BadgePercent, Package } from 'lucide-react';
import { productService } from '../services/productService';
import { transactionService } from '../services/transactionService';
import AppShell from '../components/Common/AppShell';
import ProductGrid from '../components/POS/ProductGrid';
import Cart from '../components/POS/Cart';
import { formatCurrency } from '../utils/helpers';

const OrdersPage = () => {
  const [productSearch, setProductSearch] = useState('');
  const [todayOrders, setTodayOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);

  const loadOrders = useCallback(async () => {
    const summary = await transactionService.getDailySalesSummary();
    setTodayOrders(summary.transactions || []);
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  useEffect(() => {
    const unsubscribe = productService.subscribeToLowStockProducts(setLowStockItems);
    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const discountCount = todayOrders.filter((t) => Number(t.discountAmount || 0) > 0).length;
    const totalSales = todayOrders.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    return [
      { label: 'Orders Today',  value: todayOrders.length,        icon: ShoppingBag,  color: 'text-[#dc2626] bg-red-50' },
      { label: 'Total Sales',   value: formatCurrency(totalSales), icon: QrCode,       color: 'text-amber-700 bg-amber-50' },
      { label: 'Discounts Used', value: discountCount,             icon: BadgePercent, color: 'text-emerald-700 bg-emerald-50' },
      { label: 'Low Stock',     value: lowStockItems.length,       icon: Package,      color: 'text-yellow-700 bg-yellow-50' },
    ];
  }, [todayOrders, lowStockItems]);

  return (
    <AppShell
      eyebrow="Staff"
      title="Orders"
      subtitle="Create new orders, manage items, and generate QR receipts for customers."
    >
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
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

      {/* Main workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="flex flex-col gap-5">
          <div className="pos-work-panel p-5 sm:p-6 lg:max-h-[calc(100vh-15rem)] lg:overflow-y-auto">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="pos-section-title">Menu Items</h2>
                <p className="pos-section-copy">Tap any item to add it to the current order.</p>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-[#fde68a] bg-white px-4 py-2.5 shadow-sm">
                <Search className="h-4 w-4 flex-shrink-0 text-[#dc2626]" />
                <input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search menu..."
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#5f1717] outline-none placeholder:font-normal placeholder:text-[#a16207]"
                />
              </div>
            </div>
            <ProductGrid searchTerm={productSearch} />
          </div>

          <div className="section-card overflow-hidden">
            <div className="admin-card-header">
              <div>
                <h2 className="pos-section-title">Today's Completed Orders</h2>
                <p className="pos-section-copy">
                  {todayOrders.length} order{todayOrders.length !== 1 ? 's' : ''} processed this shift.
                </p>
              </div>
              <button
                onClick={loadOrders}
                className="rounded-xl border border-[#fde68a] bg-white px-3 py-1.5 text-xs font-bold text-[#a16207] shadow-sm transition hover:bg-[#fefce8]"
              >
                Refresh
              </button>
            </div>

            {todayOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-[#a16207]">
                <ShoppingBag className="h-10 w-10 text-[#fde68a]" />
                <p className="mt-3 font-semibold text-[#6b241d]">No orders yet</p>
                <p className="mt-1 text-sm">Completed orders will appear here.</p>
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
                      <th>Discount</th>
                      <th>Status</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayOrders.map((tx) => {
                      const ts = tx.timestamp?.seconds
                        ? new Date(tx.timestamp.seconds * 1000)
                        : new Date(tx.timestamp);
                      return (
                        <tr key={tx.id}>
                          <td className="font-bold text-[#6b241d]">
                            #{tx.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="text-[#a16207]">
                            {ts.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="text-[#a16207]">{tx.items?.length || 0} item(s)</td>
                          <td className="capitalize text-[#a16207]">{tx.paymentMethod || '—'}</td>
                          <td>
                            {tx.discountType ? (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="sticky top-24 flex flex-col gap-4">
            <Cart onOrderComplete={loadOrders} />
            <div className="rounded-2xl border border-[#fde68a] bg-[#fefce8] px-5 py-4">
              <div className="flex items-start gap-3">
                <QrCode className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#dc2626]" />
                <div>
                  <p className="text-sm font-bold text-[#6b241d]">QR Receipt</p>
                  <p className="mt-0.5 text-xs leading-5 text-[#a16207]">
                    After checkout, a QR code is generated automatically. Hand it to the customer so they can track their order.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default OrdersPage;
