import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle,
  ChevronDown,
  Download,
  Filter,
  Loader2,
  LogIn,
  LogOut,
  Package,
  QrCode,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Common/Layout';
import { auditLogService, AUDIT_ACTIONS } from '../services/auditLogService';

const ACTION_META = {
  [AUDIT_ACTIONS.LOGIN]:                { label: 'Login',               icon: LogIn,       color: 'bg-emerald-100 text-emerald-700' },
  [AUDIT_ACTIONS.LOGOUT]:               { label: 'Logout',              icon: LogOut,      color: 'bg-slate-100 text-slate-600' },
  [AUDIT_ACTIONS.PRODUCT_CREATED]:      { label: 'Product Created',     icon: Package,     color: 'bg-blue-100 text-blue-700' },
  [AUDIT_ACTIONS.PRODUCT_UPDATED]:      { label: 'Product Updated',     icon: Package,     color: 'bg-amber-100 text-amber-700' },
  [AUDIT_ACTIONS.PRODUCT_DELETED]:      { label: 'Product Deleted',     icon: Package,     color: 'bg-red-100 text-red-700' },
  [AUDIT_ACTIONS.STOCK_RESTOCKED]:      { label: 'Restocked',           icon: Package,     color: 'bg-purple-100 text-purple-700' },
  [AUDIT_ACTIONS.TRANSACTION_COMPLETED]:{ label: 'Transaction',         icon: ShoppingBag, color: 'bg-green-100 text-green-700' },
  [AUDIT_ACTIONS.QR_SCANNED]:           { label: 'QR Scanned',          icon: QrCode,      color: 'bg-cyan-100 text-cyan-700' },
  [AUDIT_ACTIONS.FORECAST_RUN]:         { label: 'Forecast Run',        icon: TrendingUp,  color: 'bg-pink-100 text-pink-700' },
  [AUDIT_ACTIONS.DISCOUNT_APPLIED]:     { label: 'Discount Applied',    icon: CheckCircle, color: 'bg-orange-100 text-orange-700' },
};

const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('ALL');
  const [filterOpen, setFilterOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await auditLogService.getRecentLogs(200);
      setLogs(data);
    } catch (err) {
      toast.error('Failed to load audit logs: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filterAction === 'ALL'
    ? logs
    : logs.filter((l) => l.action === filterAction);

  const handleExport = () => {
    const rows = [
      ['Timestamp', 'Action', 'User', 'Role', 'Details'],
      ...filtered.map((l) => {
        const ts = l.timestamp?.seconds
          ? new Date(l.timestamp.seconds * 1000)
          : new Date(l.timestamp);
        return [
          ts.toLocaleString('en-PH'),
          l.action,
          l.userEmail || '—',
          l.userRole || '—',
          JSON.stringify(l.details || {}),
        ];
      }),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Audit log exported');
  };

  const actionCounts = Object.values(AUDIT_ACTIONS).reduce((m, a) => {
    m[a] = logs.filter((l) => l.action === a).length;
    return m;
  }, {});

  return (
    <Layout
      title="Audit Logs"
      subtitle="Full traceability of user actions, stock changes, and system events."
      actions={
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="rounded-xl border border-[#fde68a] bg-white px-4 py-2 text-sm font-bold text-[#a16207] shadow-sm transition hover:bg-[#fefce8] inline-flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="btn-secondary inline-flex items-center gap-2 py-2 px-4 text-sm"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      }
    >
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Events',    value: logs.length,                              icon: Activity,    color: 'text-[#dc2626] bg-red-50' },
          { label: 'Logins',          value: actionCounts[AUDIT_ACTIONS.LOGIN] || 0,   icon: LogIn,       color: 'text-emerald-700 bg-emerald-50' },
          { label: 'Transactions',    value: actionCounts[AUDIT_ACTIONS.TRANSACTION_COMPLETED] || 0, icon: ShoppingBag, color: 'text-amber-700 bg-amber-50' },
          { label: 'Stock Changes',   value: (actionCounts[AUDIT_ACTIONS.STOCK_RESTOCKED] || 0) + (actionCounts[AUDIT_ACTIONS.PRODUCT_UPDATED] || 0), icon: Package, color: 'text-blue-700 bg-blue-50' },
        ].map(({ label, value, icon: Icon, color }) => (
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

      {/* Filter + table */}
      <div className="section-card overflow-hidden">
        <div className="admin-card-header">
          <div>
            <h2 className="pos-section-title">Event Log</h2>
            <p className="pos-section-copy">{filtered.length} event{filtered.length !== 1 ? 's' : ''} recorded.</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-[#fde68a] bg-white px-4 py-2 text-sm font-bold text-[#a16207] shadow-sm hover:bg-[#fefce8]"
            >
              <Filter className="h-4 w-4" />
              {filterAction === 'ALL' ? 'All Events' : (ACTION_META[filterAction]?.label || filterAction)}
              <ChevronDown className="h-4 w-4" />
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-[#fde68a] bg-white p-2 shadow-xl">
                {[{ value: 'ALL', label: 'All Events' }, ...Object.values(AUDIT_ACTIONS).map((a) => ({ value: a, label: ACTION_META[a]?.label || a }))].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => { setFilterAction(value); setFilterOpen(false); }}
                    className={`w-full rounded-xl px-4 py-2 text-left text-sm font-semibold transition-colors ${filterAction === value ? 'bg-[#fde68a] text-[#5f1717]' : 'text-[#a16207] hover:bg-[#fefce8]'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-14">
            <Loader2 className="h-8 w-8 animate-spin text-[#dc2626]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center text-sm text-[#a16207]">
            No audit events found. Events are recorded automatically as the system is used.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Event</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => {
                  const ts = log.timestamp?.seconds
                    ? new Date(log.timestamp.seconds * 1000)
                    : new Date(log.timestamp);
                  const meta = ACTION_META[log.action] || { label: log.action, icon: Activity, color: 'bg-gray-100 text-gray-600' };
                  const Icon = meta.icon;
                  return (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap text-xs text-[#a16207]">
                        <div>{ts.toLocaleDateString('en-PH')}</div>
                        <div className="font-semibold">{ts.toLocaleTimeString('en-PH', { timeStyle: 'short' })}</div>
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${meta.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                          {meta.label}
                        </span>
                      </td>
                      <td className="max-w-[160px] truncate text-xs text-[#a16207]">{log.userEmail || '—'}</td>
                      <td>
                        <span className="rounded-full bg-[#fef9c3] px-2.5 py-0.5 text-xs font-bold capitalize text-[#a16207]">
                          {log.userRole || '—'}
                        </span>
                      </td>
                      <td className="max-w-[240px] truncate text-xs text-[#a16207]">
                        {log.details ? Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(' · ') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AuditLogPage;
