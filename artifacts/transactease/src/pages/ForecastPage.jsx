import React, { useEffect, useState } from 'react';
import { BrainCircuit, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import AppShell from '../components/Common/AppShell';
import ForecastPanel from '../components/Admin/ForecastPanel';
import { productService } from '../services/productService';
import { transactionService } from '../services/transactionService';
import { forecastService } from '../services/forecastService';

const ForecastPage = () => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const runForecast = async () => {
    setLoading(true);
    try {
      const [products, transactions] = await Promise.all([
        productService.getInventoryReport(),
        transactionService.getRecentTransactions(200),
      ]);

      const result = await forecastService.getForecast({ transactions, products });
      setForecast(result);
      setLastRefreshed(new Date());
    } catch (error) {
      toast.error('Failed to run forecast: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runForecast();
  }, []);

  return (
    <AppShell
      eyebrow="Analytics"
      title="Sales Forecast"
      subtitle="AI-powered demand prediction to guide restocking and sales planning decisions."
      actions={
        <button
          type="button"
          onClick={runForecast}
          disabled={loading}
          className="btn-primary inline-flex items-center gap-2 py-2.5 px-4 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Running...' : 'Refresh Forecast'}
        </button>
      }
    >
      {lastRefreshed && !loading && (
        <div className="flex items-center gap-2 text-xs text-[#8a5a2b] mb-2">
          <BrainCircuit className="h-3.5 w-3.5" />
          Last updated: {lastRefreshed.toLocaleTimeString()}
        </div>
      )}

      <ForecastPanel forecast={forecast} loading={loading} />

      {!loading && forecast?.salesTrend?.length === 0 && (
        <div className="section-card p-8 text-center text-[#8a5a2b] mt-4">
          <BrainCircuit className="mx-auto h-12 w-12 text-[#d62828] mb-3" />
          <p className="font-bold text-[#6b241d]">Not enough sales data yet</p>
          <p className="mt-1 text-sm">
            Complete a few transactions first. The model needs at least 2 days of sales history to generate a meaningful forecast.
          </p>
        </div>
      )}
    </AppShell>
  );
};

export default ForecastPage;
