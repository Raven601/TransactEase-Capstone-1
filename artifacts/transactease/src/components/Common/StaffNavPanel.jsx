import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, QrCode, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/pos',         label: 'Dashboard',  icon: LayoutDashboard, end: true },
  { to: '/orders',      label: 'Orders',      icon: ShoppingBag },
  { to: '/qr-scanner',  label: 'QR Scanner',  icon: QrCode },
];

const StaffNavPanel = () => {
  const { currentUser, logout } = useAuth();

  return (
    <aside className="staff-nav-panel">
      <div className="staff-nav-brand">
        <p className="staff-nav-kicker">TransactEase</p>
        <p className="staff-nav-role">Staff Panel</p>
      </div>

      <nav className="staff-nav-links">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `staff-nav-link ${isActive ? 'staff-nav-link-active' : ''}`
            }
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="staff-nav-footer">
        <div className="staff-nav-profile">
          <UserCircle className="h-5 w-5 flex-shrink-0 text-[#c62828]" />
          <p className="truncate text-xs font-semibold text-[#6b241d]">
            {currentUser?.email || 'staff@wimpy.com'}
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="staff-nav-logout"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default StaffNavPanel;
