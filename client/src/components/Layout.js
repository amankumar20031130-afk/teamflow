import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInitials, getAvatarColor } from '../utils/helpers';
import './Layout.css';

const NavItem = ({ to, icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

const DashboardIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const ProjectIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
  </svg>
);

const TaskIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const AdminIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const MenuIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  const navLinks = [
    { to: '/dashboard', icon: <DashboardIcon />, label: 'Dashboard' },
    { to: '/projects', icon: <ProjectIcon />, label: 'Projects' },
    { to: '/my-tasks', icon: <TaskIcon />, label: 'My Tasks' },
  ];

  const adminLinks = user?.role === 'admin' ? [
    { to: '/admin', icon: <AdminIcon />, label: 'Admin Panel' },
  ] : [];

  return (
    <div className="layout">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
              <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="logo-text">TeamFlow</span>
          </div>
          <button className="sidebar-close btn btn-ghost btn-icon" onClick={closeSidebar}>
            <CloseIcon />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navLinks.map((link) => (
            <NavItem key={link.to} {...link} onClick={closeSidebar} />
          ))}
          {adminLinks.length > 0 && (
            <>
              <div className="nav-divider" />
              {adminLinks.map((link) => (
                <NavItem key={link.to} {...link} onClick={closeSidebar} />
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/profile" onClick={closeSidebar} className="user-info">
            <span
              className="avatar avatar-md"
              style={{ background: getAvatarColor(user?.name || '') }}
            >
              {getInitials(user?.name || '')}
            </span>
            <div className="user-details">
              <div className="user-name-row">
                <span className="user-name">{user?.name}</span>
                {user?.role === 'admin' && (
                  <span className="admin-badge-pill">Admin</span>
                )}
              </div>
              <span className="user-email">{user?.email}</span>
            </div>
          </NavLink>
          <button className="btn btn-ghost btn-icon logout-btn" onClick={handleLogout} title="Logout">
            <LogoutIcon />
          </button>
        </div>
      </aside>

      <div className="main-wrapper">
        <header className="topbar">
          <button
            className="btn btn-ghost btn-icon menu-btn"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon />
          </button>
          <div className="topbar-right">
            <NavLink to="/profile">
              <span
                className="avatar avatar-sm"
                style={{ background: getAvatarColor(user?.name || '') }}
              >
                {getInitials(user?.name || '')}
              </span>
            </NavLink>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
