import { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NewBookingPopup from '../components/NewBookingPopup';
import { notificationAPI } from '../services/api';
import {
  FiGrid, FiCalendar, FiUsers, FiTruck, FiTool,
  FiUserCheck, FiSettings, FiLogOut, FiMenu, FiX, FiBell
} from 'react-icons/fi';

const navItems = [
  { to: '/', icon: FiGrid, label: 'Dashboard', end: true },
  { to: '/bookings', icon: FiCalendar, label: 'Bookings' },
  { to: '/customers', icon: FiUsers, label: 'Customers' },
  { to: '/vehicles', icon: FiTruck, label: 'Vehicles' },
  { to: '/services', icon: FiTool, label: 'Services' },
  { to: '/staff', icon: FiUserCheck, label: 'Staff' },
  { to: '/settings', icon: FiSettings, label: 'Settings' },
  { to: '/notifications', icon: FiBell, label: 'Notifications' },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async (silent = true) => {
    try {
      const res = await notificationAPI.getAll({ limit: 1 });
      setUnreadCount(res.data.data.unreadCount || 0);
    } catch (e) {}
  }, []);

  useEffect(() => { fetchUnread(false); }, [fetchUnread]);
  useEffect(() => { const i = setInterval(fetchUnread, 10000); return () => clearInterval(i); }, [fetchUnread]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-layout">
      <NewBookingPopup />
      <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={closeSidebar} />
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div>
            <h2>QuickWash</h2>
            <span>Admin Panel</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={closeSidebar}>
              <item.icon />
              {item.label}
              {item.to === '/notifications' && unreadCount > 0 && (
                <span style={{
                  marginLeft: 'auto', background: '#ea4335', color: '#fff',
                  fontSize: '10px', fontWeight: '700', borderRadius: '10px',
                  padding: '2px 7px', minWidth: '18px', textAlign: 'center',
                }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-name">{user?.fullName}</div>
          <button className="btn btn-secondary btn-full" onClick={handleLogout}>
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <header className="header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
          <div className="header-title">QuickWash</div>
          <NavLink to="/notifications" style={{ position: 'relative', fontSize: '20px', color: 'var(--text-primary)' }}>
            <FiBell />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-6px', right: '-8px',
                background: '#ea4335', color: '#fff',
                fontSize: '9px', fontWeight: '700', borderRadius: '8px',
                padding: '1px 5px', minWidth: '16px', textAlign: 'center',
              }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </NavLink>
          <div className="header-spacer" />
        </header>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
