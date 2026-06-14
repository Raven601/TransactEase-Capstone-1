import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Login from './components/Auth/Login';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import ForecastPage from './pages/ForecastPage';
import QRScannerPage from './pages/QRScannerPage';
import QRReceiptPage from './pages/QRReceiptPage';
import POSPage from './pages/POSPage';
import OrdersPage from './pages/OrdersPage';
import HistoryPage from './pages/HistoryPage';
import ReportsPage from './pages/ReportsPage';
import MenuManagementPage from './pages/MenuManagementPage';
import SetupPage from './pages/SetupPage';
import StaffManagementPage from './pages/StaffManagementPage';
import DiscountManagementPage from './pages/DiscountManagementPage';
import AuditLogPage from './pages/AuditLogPage';
import { USER_ROLES } from './utils/constants';

const ADMIN_MANAGER = [USER_ROLES.ADMIN, USER_ROLES.MANAGER];
const ADMIN_ONLY    = [USER_ROLES.ADMIN];

const AppRoutes = () => {
  const { currentUser, userRole } = useAuth();

  const defaultPath =
    userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.MANAGER
      ? '/dashboard'
      : '/pos';

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/qr-receipt/:transactionId" element={<QRReceiptPage />} />

      {!currentUser ? (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          <Route path="/" element={<Navigate to={defaultPath} replace />} />

          {/* Admin + Manager routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={ADMIN_MANAGER}><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/inventory" element={
            <ProtectedRoute allowedRoles={ADMIN_MANAGER}><InventoryPage /></ProtectedRoute>
          } />
          <Route path="/menu-management" element={
            <ProtectedRoute allowedRoles={ADMIN_MANAGER}><MenuManagementPage /></ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={ADMIN_MANAGER}><ReportsPage /></ProtectedRoute>
          } />
          <Route path="/discount-management" element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}><DiscountManagementPage /></ProtectedRoute>
          } />
          <Route path="/forecast" element={
            <ProtectedRoute allowedRoles={ADMIN_MANAGER}><ForecastPage /></ProtectedRoute>
          } />
          <Route path="/audit-logs" element={
            <ProtectedRoute allowedRoles={ADMIN_MANAGER}><AuditLogPage /></ProtectedRoute>
          } />

          {/* Admin only */}
          <Route path="/staff-management" element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}><StaffManagementPage /></ProtectedRoute>
          } />

          {/* Staff routes */}
          <Route path="/pos" element={
            <ProtectedRoute><POSPage /></ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute><OrdersPage /></ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute><HistoryPage /></ProtectedRoute>
          } />
          <Route path="/qr-scanner" element={
            <ProtectedRoute><QRScannerPage /></ProtectedRoute>
          } />

          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route
            path="/unauthorized"
            element={
              <div className="flex min-h-screen items-center justify-center">
                <div className="rounded-2xl border border-red-200 bg-red-50 px-8 py-10 text-center">
                  <p className="text-xl font-bold text-red-700">Unauthorized Access</p>
                  <p className="mt-2 text-sm text-red-600">You don't have permission to view this page.</p>
                </div>
              </div>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="App">
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: { background: '#363636', color: '#fff' },
              }}
            />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
