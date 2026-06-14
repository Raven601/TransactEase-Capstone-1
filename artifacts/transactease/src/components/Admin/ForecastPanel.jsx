import React from 'react';
import { AlertTriangle, BrainCircuit, PackagePlus, Target, TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '../../utils/helpers';

const ForecastPanel = ({ forecast, loading }) => {
  if (loading) {
    return (
      <article className="section-card p-6">
        <p className="text-sm font-semibold text-[#8a5a2b]">Loading sales forecast...</p>
      </article>
    );
  }

  if (!forecast) {
    return null;
  }

  return (
    <article className="section-card p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <BrainCircuit className="h-6 w-6 text-[#b71c1c]" />
            <h2 className="pos-section-title">Sales Forecast</h2>
          </div>
          <p className="pos-section-copy">AI-powered prediction using recent sales history and inventory data.</p>
        </div>
        <span className="rounded-full bg-[#fff0dd] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#8a5a2b]">
          AI Model
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="pos-surface p-4">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-[#8a5a2b]">Expected Daily Sales</p>
          <p className="mt-1 text-lg font-bold text-[#6b241d]">{forecast.summary.expectedDailySales}</p>
        </div>
        <div className="pos-surface p-4">
          <PackagePlus className="h-5 w-5 text-[#b71c1c]" />
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-[#8a5a2b]">Likely Best Seller</p>
          <p className="mt-1 text-lg font-bold text-[#6b241d]">{forecast.summary.topProduct}</p>
        </div>
        <div className="pos-surface p-4">
          <AlertTriangle className="h-5 w-5 text-amber-700" />
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-[#8a5a2b]">Low Stock Risk</p>
          <p className="mt-1 text-lg font-bold text-[#6b241d]">{forecast.summary.lowStockCount} item(s)</p>
        </div>
      </div>

      {forecast.accuracyMetrics && (
        <div className="mt-4 rounded-2xl border border-[#fde68a] bg-[#fffbeb] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-[#b45309]" />
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#b45309]">
              Forecast Accuracy vs Previous Run
            </p>
          </div>
          {forecast.accuracyMetrics.dataPoints === 0 ? (
            <p className="text-xs text-[#a16207]">Not enough historical data yet — accuracy metrics will appear after the second forecast run.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#92400e]">MAE</p>
                <p className="mt-0.5 text-sm font-extrabold text-[#5f1717]">
                  ₱{forecast.accuracyMetrics.mae?.toLocaleString() ?? '—'}
                </p>
                <p className="text-[10px] text-[#a16207]">Mean Absolute Error</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#92400e]">RMSE</p>
                <p className="mt-0.5 text-sm font-extrabold text-[#5f1717]">
                  ₱{forecast.accuracyMetrics.rmse?.toLocaleString() ?? '—'}
                </p>
                <p className="text-[10px] text-[#a16207]">Root Mean Squared Error</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#92400e]">MAPE</p>
                <p className="mt-0.5 text-sm font-extrabold text-[#5f1717]">
                  {forecast.accuracyMetrics.mape?.toFixed(1) ?? '—'}%
                </p>
                <p className="text-[10px] text-[#a16207]">Mean Abs. Percentage Error ({forecast.accuracyMetrics.dataPoints} day{forecast.accuracyMetrics.dataPoints !== 1 ? 's' : ''})</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="pos-surface p-4">
          <h3 className="font-bold text-[#6b241d]">7-Day Sales Forecast</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast.dailySalesForecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0d9a7" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(value) => `₱${value}`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line type="monotone" dataKey="predictedSales" stroke="#b71c1c" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="pos-surface p-4">
          <h3 className="font-bold text-[#6b241d]">Fast-Selling Products</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecast.bestSellingProducts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0d9a7" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="unitsSold" fill="#d62828" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </article>
  );
};

export default ForecastPanel;
