import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../utils/constants';

const STAFF_LINKS = [
  { to: '/pos',     label: 'Dashboard', end: true },
  { to: '/orders',  label: 'Orders' },
  { to: '/history', label: 'History' },
];

const ADMIN_LINKS = [
  { to: '/dashboard',         label: 'Dashboard', end: true },
  { to: '/inventory',         label: 'Inventory' },
  { to: '/menu-management',   label: 'Menu Management' },
  { to: '/reports',           label: 'Reports' },
  { to: '/forecast',          label: 'Forecast' },
  { to: '/staff-management',  label: 'Staff' },
];

const TopNavbar = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = userRole === USER_ROLES.ADMIN;
  const navLinks = isAdmin ? ADMIN_LINKS : STAFF_LINKS;

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    }
    navigate('/login');
  };

  return (
    <header className="top-navbar">
      <div className="top-navbar-inner">
        <div className="top-navbar-brand">
          <UtensilsCrossed className="h-5 w-5 text-[#dc2626]" />
          <div>
            <p className="top-navbar-title">Wimpy's</p>
            <p className="top-navbar-sub">Burger & Ice Cream House</p>
          </div>
        </div>

        <nav className="top-navbar-links">
          {navLinks.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `top-nav-link${isActive ? ' top-nav-link-active' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="top-navbar-user">
          <span className="top-navbar-email" title={currentUser?.email}>
            {currentUser?.email}
          </span>
          <span className="top-navbar-role-badge">{isAdmin ? 'Admin' : 'Staff'}</span>
          <button type="button" onClick={handleLogout} className="top-navbar-logout">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
