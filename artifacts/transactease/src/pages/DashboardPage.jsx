import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowUpRight,
  BadgePercent,
  BrainCircuit,
  CalendarDays,
  Clock,
  Loader2,
  Package2,
  ShoppingBag,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import toast from 'react-hot-toast';
import Layout from '../components/Common/Layout';
import TransactionsList from '../components/Admin/TransactionsList';
import { productService } from '../services/productService';
import { transactionService } from '../services/transactionService';
import { forecastService } from '../services/forecastService';
import { formatCurrency } from '../utils/helpers';

const cardMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28 },
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [inventoryReport, setInventoryReport] = useState([]);
  const [salesSummary, setSalesSummary] = useState({ totalSales: 0, totalOrders: 0 });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forecastLoading, setForecastLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      const [inventory, dailySalesSummary, latestTransactions, forecastTransactions] = await Promise.all([
        productService.getInventoryReport(),
        transactionService.getDailySalesSummary(),
        transactionService.getRecentTransactions(5),
        transactionService.getRecentTransactions(50),
      ]);

      setInventoryReport(inventory);
      setSalesSummary(dailySalesSummary);
      setRecentTransactions(latestTransactions);
      setForecastLoading(true);
      const forecastResult = await forecastService.getForecast({
        transactions: forecastTransactions,
        products: inventory,
      });
      setForecast(forecastResult);
    } catch (error) {
      toast.error('Unable to load dashboard data: ' + error.message);
    } finally {
      setLoading(false);
      setForecastLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    const unsubscribe = productService.subscribeToProducts(() => {
      loadDashboard();
    });

    return () => unsubscribe();
  }, [loadDashboard]);

  const lowStockItems = inventoryReport.filter((product) => product.lowStock);
  const outOfStockItems = inventoryReport.filter((product) => product.outOfStock);
  const topProducts = inventoryReport.slice(0, 5);
  const monthlyRevenue = salesSummary.totalSales * 26;
  const discountsApplied = salesSummary.transactions?.filter((transaction) => Number(transaction.discountAmount || 0) > 0).length || 0;

  const currentDate = new Intl.DateTimeFormat('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const categoryChartData = useMemo(() => {
    const categoryMap = inventoryReport.reduce((map, product) => {
      const category = product.category || 'Uncategorized';
      map[category] = (map[category] || 0) + 1;
      return map;
    }, {});

    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .slice(0, 6);
  }, [inventoryReport]);

  const weeklySalesData = useMemo(() => {
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const salesMap = (forecast?.salesTrend || []).reduce((m, { date, sales }) => {
      m[date] = sales;
      return m;
    }, {});
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      return {
        date: dayLabels[d.getDay()],
        sales: salesMap[key] || 0,
      };
    });
  }, [forecast]);

  const metricCards = [
    {
      label: 'Total Sales',
      value: formatCurrency(salesSummary.totalSales),
      icon: TrendingUp,
      trend: '+12.4%',
      helper: 'Today revenue',
      tone: 'admin-metric-red',
    },
    {
      label: 'Orders Today',
      value: salesSummary.totalOrders,
      icon: ShoppingBag,
      trend: '+8.2%',
      helper: 'Completed POS orders',
      tone: 'admin-metric-orange',
    },
    {
      label: 'Monthly Revenue',
      value: formatCurrency(monthlyRevenue),
      icon: WalletCards,
      trend: '+15.1%',
      helper: 'Projected from current run rate',
      tone: 'admin-metric-gold',
    },
    {
      label: 'Inventory Status',
      value: `${inventoryReport.length} items`,
      icon: Package2,
      trend: `${lowStockItems.length} watch`,
      helper: 'Tracked products',
      tone: 'admin-metric-green',
    },
    {
      label: 'Low Stock Alerts',
      value: lowStockItems.length,
      icon: AlertTriangle,
      trend: lowStockItems.length ? 'Needs action' : 'Clear',
      helper: 'At or below threshold',
      tone: 'admin-metric-danger',
    },
    {
      label: 'Out of Stock',
      value: outOfStockItems.length,
      icon: Package2,
      trend: outOfStockItems.length ? 'Critical' : 'Stable',
      helper: 'Unavailable products',
      tone: 'admin-metric-warning',
    },
    {
      label: 'Active Discounts',
      value: discountsApplied,
      icon: BadgePercent,
      trend: 'Live promos',
      helper: 'Discounted orders today',
      tone: 'admin-metric-orange',
    },
    {
      label: 'Fast Sellers',
      value: forecast?.bestSellingProducts?.[0]?.name || topProducts[0]?.name || 'No sales yet',
      icon: BrainCircuit,
      trend: 'AI signal',
      helper: 'Predicted demand leader',
      tone: 'admin-metric-red',
    },
  ];

  return (
    <Layout
      title="Admin Dashboard"
      subtitle="Sales analytics, inventory insights, and AI forecasting for Wimpy's Burger & Ice Cream House."
    >
      <motion.section {...cardMotion} className="admin-welcome-panel">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-sm font-bold text-[#991b1b] shadow-sm">
            <CalendarDays className="h-4 w-4" />
            {currentDate}
          </div>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight text-[#4f1717] md:text-4xl">
            Welcome back, Admin
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#7c4a21] md:text-base">
            Monitor sales velocity, product availability, QR receipt validation, and AI restock recommendations from one command center.
          </p>
        </div>
        <div className="admin-welcome-summary">
          <Clock className="h-5 w-5 text-[#f57c00]" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a5a2b]">Quick Overview</p>
            <p className="mt-1 text-sm font-bold text-[#4f1717]">
              {salesSummary.totalOrders} orders today, {lowStockItems.length} inventory alerts, {recentTransactions.length} recent activities.
            </p>
          </div>
        </div>
      </motion.section>

      {(outOfStockItems.length > 0 || lowStockItems.length > 0) && (
        <motion.div {...cardMotion} className="flex items-center gap-3 rounded-2xl border border-[#fcd34d] bg-[#fffbeb] px-5 py-4">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-[#d97706]" />
          <p className="text-sm font-semibold text-[#78350f]">
            {outOfStockItems.length > 0 && (
              <span><strong>{outOfStockItems.length} item{outOfStockItems.length > 1 ? 's' : ''} out of stock</strong> — hidden from staff POS.{outOfStockItems.length > 0 && lowStockItems.length > 0 ? ' ' : ''}</span>
            )}
            {lowStockItems.length > 0 && (
              <span><strong>{lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} running low</strong> — restock soon to avoid disruption.</span>
            )}
          </p>
        </motion.div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(({ label, value, icon: Icon, trend, helper, tone }, index) => (
          <motion.article
            key={label}
            {...cardMotion}
            transition={{ duration: 0.25, delay: index * 0.03 }}
            className={`admin-metric-card ${tone}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="admin-metric-icon">
                <Icon className="h-5 w-5" />
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-xs font-extrabold text-[#166534]">
                <ArrowUpRight className="h-3.5 w-3.5" />
                {trend}
              </span>
            </div>
            <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.16em] text-[#8a5a2b]">{label}</p>
            <p className="mt-2 truncate text-2xl font-extrabold text-[#4f1717]">{value}</p>
            <p className="mt-1 text-sm font-semibold text-[#9a6a3a]">{helper}</p>
          </motion.article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <article className="admin-chart-card">
          <div className="admin-card-header">
            <div>
              <h2 className="pos-section-title">Weekly Sales Trend</h2>
              <p className="pos-section-copy">Revenue movement based on recent sales and transaction data.</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklySalesData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#991b1b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#991b1b" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0d9a7" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(value) => `₱${value}`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area type="monotone" dataKey="sales" stroke="#991b1b" strokeWidth={3} fill="url(#salesGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="admin-chart-card">
          <div className="admin-card-header">
            <div>
              <h2 className="pos-section-title">Product Categories</h2>
              <p className="pos-section-copy">Menu distribution across inventory groups.</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryChartData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={104} paddingAngle={4}>
                  {categoryChartData.map((entry, index) => (
                    <Cell key={entry.name} fill={['#991b1b', '#f57c00', '#facc15', '#22c55e', '#ef4444', '#ffe0b2'][index % 6]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <article className="section-card overflow-hidden">
        <div className="admin-card-header border-b border-[#f0d9a7]">
          <div>
            <h2 className="pos-section-title">Recent Orders</h2>
            <p className="pos-section-copy">Latest transaction activity with QR receipt access.</p>
          </div>
        </div>
        {recentTransactions.length > 0 ? (
          <TransactionsList transactions={recentTransactions} />
        ) : (
          <div className="px-6 py-8 text-sm text-[#8a5a2b]">No transactions recorded yet today.</div>
        )}
      </article>

      <article className="admin-chart-card">
        <h2 className="pos-section-title">AI Recommendation Center</h2>
        <p className="pos-section-copy">Smart restock and demand insights for admin decision-making.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(forecast?.restockRecommendations || []).slice(0, 4).map((item) => (
            <div key={item.productId} className="rounded-2xl border border-[#f0d9a7] bg-[#fff8f0] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold text-[#4f1717]">{item.name}</p>
                <span className="status-badge status-badge-warning">{item.risk}</span>
              </div>
              <p className="mt-2 text-sm text-[#8a5a2b]">
                Predicted demand: {item.predictedDemand}. Recommended restock: {item.recommendedRestock}.
              </p>
            </div>
          ))}
          {!forecast?.restockRecommendations?.length && (
            <div className="col-span-full rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              Inventory predictions are stable. No urgent AI recommendations at the moment.
            </div>
          )}
        </div>
      </article>
    </Layout>
  );
};

export default DashboardPage;
