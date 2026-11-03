import { useState, useEffect, useCallback } from 'react';
import { notificationAPI } from '../services/api';
import { FiBell, FiCheck } from 'react-icons/fi';

const STATUS_CONFIG = {
  Confirmed: { icon: '✅', color: '#34a853', bg: '#e6f4ea', border: '#34a853' },
  Cancelled: { icon: '❌', color: '#ea4335', bg: '#fce8e6', border: '#ea4335' },
  Default: { icon: '🔔', color: '#1a73e8', bg: '#e8f0fe', border: '#1a73e8' },
};

const getConfig = (notif) => {
  const s = (notif.data?.status || '').toLowerCase();
  const t = (notif.title || '').toLowerCase();
  if (s === 'confirmed' || t.includes('confirm')) return STATUS_CONFIG.Confirmed;
  if (s === 'cancelled' || t.includes('cancel')) return STATUS_CONFIG.Cancelled;
  return STATUS_CONFIG.Default;
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await notificationAPI.getAll({ limit: 50 });
      const all = res.data.data.notifications || [];
      const filtered = all.filter(n => {
        const t = n.title.toLowerCase();
        return t.includes('confirmed') || t.includes('cancelled');
      });
      setNotifications(filtered);
      setUnreadCount(filtered.filter(n => !n.read).length);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);
  useEffect(() => { const i = setInterval(() => fetchNotifications(true), 10000); return () => clearInterval(i); }, [fetchNotifications]);

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const markOneRead = async (id) => {
    try {
      await notificationAPI.markOneRead(id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const getTimeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Notifications {unreadCount > 0 && <span style={{ fontSize: '14px', color: '#ea4335', fontWeight: '600' }}>({unreadCount} unread)</span>}</h2>
        {unreadCount > 0 && (
          <button className="btn btn-sm btn-primary" onClick={markAllRead}><FiCheck /> Mark all read</button>
        )}
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : notifications.length === 0 ? (
        <div className="card empty-state"><FiBell /><h3>No notifications yet</h3></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notifications.map((n) => {
            const config = getConfig(n);
            return (
              <div
                key={n._id}
                onClick={() => !n.read && markOneRead(n._id)}
                style={{
                  background: n.read ? '#fff' : config.bg,
                  border: `1px solid ${n.read ? 'var(--border)' : config.border + '40'}`,
                  borderLeft: `3px solid ${config.border}`,
                  borderRadius: '12px',
                  padding: '14px 16px',
                  cursor: n.read ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }}>{config.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: n.read ? '500' : '700', fontSize: '14px', color: config.color, marginBottom: '2px' }}>{n.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{n.body}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '4px' }}>{getTimeAgo(n.createdAt)}</div>
                </div>
                {!n.read && <div style={{ width: 8, height: 8, borderRadius: 4, background: config.color, flexShrink: 0, marginTop: '6px' }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
