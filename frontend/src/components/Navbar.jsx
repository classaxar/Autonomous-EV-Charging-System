import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  // Poll notifications every 10s per A-12
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    async function fetchNotifications() {
      try {
        const res = await client.get('/api/notifications');
        if (isMounted && res.data && res.data.success) {
          const list = res.data.data || [];
          setNotifications(list);
          setUnreadCount(list.filter((n) => !n.read).length);
        }
      } catch (err) {
        // Non-fatal if notification-service is starting up
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const markAsRead = async (id) => {
    try {
      await client.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/ev', label: 'My EVs' },
    { to: '/recommend', label: 'Find Charger' },
    { to: '/booking', label: 'Bookings' },
    { to: '/history', label: 'History' }
  ];

  if (user && (user.role === 'SYSTEM_ADMIN' || user.role === 'STATION_ADMIN')) {
    navLinks.push({ to: '/admin', label: 'Admin' });
  }

  return (
    <nav style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link to="/dashboard" style={{ textDecoration: 'none', color: '#38bdf8', fontWeight: 'bold', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ⚡ <span>Autonomous EV</span>
        </Link>
        {user && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            {navLinks.map((link) => {
              const active = location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    textDecoration: 'none',
                    color: active ? '#38bdf8' : '#94a3b8',
                    fontWeight: active ? '600' : '400',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '0.375rem',
                    background: active ? '#1e293b' : 'transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Notification Bell with Badge */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', position: 'relative', color: '#94a3b8' }}
              title="Notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '-6px', right: '-8px', background: '#ef4444', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', borderRadius: '9999px', padding: '2px 6px' }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {showDropdown && (
              <div style={{ position: 'absolute', right: 0, top: '2.2rem', width: '320px', background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)', zIndex: 50, padding: '0.5rem 0' }}>
                <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: '#f8fafc', fontSize: '0.9rem' }}>Notifications</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{notifications.length} total</span>
                </div>
                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <p style={{ padding: '1rem', color: '#64748b', fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>No notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.notificationId}
                        onClick={() => markAsRead(n.notificationId)}
                        style={{ padding: '0.65rem 1rem', borderBottom: '1px solid #334155', background: n.read ? 'transparent' : '#0f172a', cursor: 'pointer', transition: 'background 0.15s' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#38bdf8' }}>{n.type}</span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: n.read ? '#94a3b8' : '#f8fafc' }}>{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#e2e8f0', background: '#1e293b', padding: '0.25rem 0.6rem', borderRadius: '0.375rem', border: '1px solid #334155' }}>
              👤 {user.name} <span style={{ color: '#38bdf8', fontSize: '0.75rem' }}>({user.role})</span>
            </span>
            <button
              onClick={handleLogout}
              style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }}
            >
              Logout
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/login" style={{ textDecoration: 'none', color: '#e2e8f0', padding: '0.35rem 0.85rem', borderRadius: '0.375rem', border: '1px solid #334155', fontSize: '0.85rem' }}>
            Login
          </Link>
          <Link to="/register" style={{ textDecoration: 'none', color: '#fff', background: '#0284c7', padding: '0.35rem 0.85rem', borderRadius: '0.375rem', fontSize: '0.85rem', fontWeight: '500' }}>
            Register
          </Link>
        </div>
      )}
    </nav>
  );
}
