import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!user) return undefined;
    let mounted = true;
    async function fetchNotifications() {
      try {
        const res = await client.get('/api/notifications');
        if (mounted && res.data?.success) {
          const list = res.data.data || [];
          setNotifications(list);
          setUnreadCount(list.filter((item) => !item.read).length);
        }
      } catch (err) {
        // Notifications are optional for navigation.
      }
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => { mounted = false; clearInterval(interval); };
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await client.patch(`/api/notifications/${id}/read`);
      setNotifications((items) => items.map((item) => (item.notificationId === id ? { ...item, read: true } : item)));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const navLinks = [
    { to: '/dashboard', label: 'Overview' },
    { to: '/ev', label: 'Vehicles' },
    { to: '/recommend', label: 'Find a charger' },
    { to: '/booking', label: 'Bookings' },
    { to: '/history', label: 'Activity' }
  ];
  if (user && ['SYSTEM_ADMIN', 'STATION_ADMIN'].includes(user.role)) navLinks.push({ to: '/admin', label: 'Operations' });

  const logoutUser = () => { logout(); navigate('/login'); };

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/dashboard" className="brand" onClick={() => setMobileOpen(false)}>
          <span className="brand-mark">⚡</span>
          <span className="brand-name">VoltPath</span>
          <span className="brand-badge">EV NETWORK</span>
        </Link>
        {user && (
          <button className="mobile-menu" onClick={() => setMobileOpen((open) => !open)} aria-label="Toggle navigation">
            {mobileOpen ? '×' : '☰'}
          </button>
        )}
        {user ? (
          <div className={`nav-area ${mobileOpen ? 'nav-area-open' : ''}`}>
            <nav className="nav-links">
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className={`nav-link ${location.pathname.startsWith(link.to) ? 'nav-link-active' : ''}`}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="topbar-actions">
              <div className="notification-wrap">
                <button className="icon-button" onClick={() => setShowDropdown((open) => !open)} aria-label="Notifications">
                  ♢
                  {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
                </button>
                {showDropdown && (
                  <div className="notification-popover">
                    <div className="popover-heading"><strong>Notifications</strong><span>{notifications.length} total</span></div>
                    {notifications.length === 0 ? <p className="popover-empty">You are all caught up.</p> : notifications.map((item) => (
                      <button className={`notification-item ${item.read ? '' : 'notification-unread'}`} key={item.notificationId} onClick={() => markAsRead(item.notificationId)}>
                        <span><strong>{item.type}</strong><small>{item.message}</small></span>
                        <time>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="user-menu"><span className="avatar">{(user.name || 'D').charAt(0).toUpperCase()}</span><span className="user-name">{user.name}</span></div>
              <button className="logout-button" onClick={logoutUser}>Sign out</button>
            </div>
          </div>
        ) : (
          <div className="auth-actions"><Link to="/login" className="nav-login">Sign in</Link><Link to="/register" className="nav-register">Create account</Link></div>
        )}
      </div>
    </header>
  );
}
