import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BadgePercent,
  BrainCircuit,
  ClipboardList,
  LayoutDashboard,
  Package,
  QrCode,
  ShoppingBag,
  UtensilsCrossed,
  BarChart2,
  UserCircle,
  X,
} from 'lucide-react';
import { USER_ROLES } from '../../utils/constants';

const roleNavItems = {
  [USER_ROLES.ADMIN]: [
    { to: '/dashboard',           label: 'Dashboard',       icon: LayoutDashboard, end: true },
    { to: '/inventory',           label: 'Inventory',       icon: Package },
    { to: '/discount-management', label: 'Discounts',       icon: BadgePercent },
    { to: '/menu-management',     label: 'Menu Management', icon: UtensilsCrossed },
    { to: '/reports',             label: 'Reports',         icon: BarChart2 },
    { to: '/forecast',            label: 'ML Forecast',     icon: BrainCircuit },
    { to: '/audit-logs',          label: 'Audit Logs',      icon: ClipboardList },
  ],
  [USER_ROLES.MANAGER]: [
    { to: '/dashboard',        label: 'Dashboard',        icon: LayoutDashboard, end: true },
    { to: '/inventory',        label: 'Inventory',        icon: Package },
    { to: '/menu-management',  label: 'Menu Management',  icon: UtensilsCrossed },
    { to: '/reports',          label: 'Reports',          icon: BarChart2 },
    { to: '/forecast',         label: 'Forecast',         icon: BrainCircuit },
    { to: '/audit-logs',       label: 'Audit Logs',       icon: ClipboardList },
  ],
  [USER_ROLES.STAFF]: [
    { to: '/pos',         label: 'Dashboard',   icon: LayoutDashboard, end: true },
    { to: '/orders',      label: 'Orders',      icon: ShoppingBag },
    { to: '/qr-scanner',  label: 'QR Scanner',  icon: QrCode },
  ],
};

const ROLE_LABELS = {
  [USER_ROLES.ADMIN]:   { panel: 'Admin Panel',   profile: 'Admin User' },
  [USER_ROLES.MANAGER]: { panel: 'Manager Panel',  profile: 'Manager' },
  [USER_ROLES.STAFF]:   { panel: 'Staff Panel',    profile: 'Staff Cashier' },
};

const Sidebar = ({ role, currentUser, isOpen, collapsed, onClose }) => {
  const navItems = roleNavItems[role] || [];
  const labels = ROLE_LABELS[role] || { panel: 'Panel', profile: 'User' };

  return (
    <>
      <div
        className={`sidebar-backdrop ${isOpen ? 'sidebar-backdrop-visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`app-sidebar ${isOpen ? 'app-sidebar-open' : ''} ${collapsed ? 'app-sidebar-collapsed' : ''}`}
      >
        <div className="sidebar-header">
          <div className="sidebar-brand-copy">
            <p className="sidebar-kicker">TransactEase</p>
            <h2 className="sidebar-title">{labels.panel}</h2>
          </div>

          <button
            type="button"
            className="sidebar-close-button"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label={`${role || 'Main'} navigation`}>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
              }
            >
              <Icon className="sidebar-link-icon" />
              <span className="sidebar-link-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-profile">
          <div className="sidebar-profile-avatar">
            <UserCircle className="h-6 w-6" />
          </div>
          <div className="sidebar-profile-copy">
            <p className="text-sm font-bold text-[#6b241d]">{labels.profile}</p>
            <p className="truncate text-xs text-[#8a5a2b]">
              {currentUser?.email || 'team@wimpy.com'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
