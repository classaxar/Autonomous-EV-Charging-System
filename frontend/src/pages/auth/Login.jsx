import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-intro">
        <div className="eyebrow">Intelligent charging, simplified</div>
        <h1>Your route to a smarter charge.</h1>
        <p>VoltPath connects your vehicle to the right charger at the right time, balancing availability, price, speed, and distance automatically.</p>
      </div>
      <div className="surface auth-card">
        <div className="eyebrow">Driver portal</div>
        <h2 style={{ margin: '8px 0 6px' }}>Welcome back</h2>
        <p className="muted" style={{ marginBottom: '24px', fontSize: '0.88rem' }}>Sign in to manage your charging journey.</p>

        {error && (
          <div style={{ background: 'rgba(251, 113, 133, 0.1)', border: '1px solid rgba(251, 113, 133, 0.35)', color: '#fda4af', padding: '0.7rem 0.85rem', borderRadius: '9px', marginBottom: '1rem', fontSize: '0.82rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@ev.com"
              required
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.82rem', color: '#9aacc0' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#49d5ff', textDecoration: 'none', fontWeight: '600' }}>
            Register here
          </Link>
        </div>

        <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: 'rgba(148, 163, 184, 0.06)', borderRadius: '9px', fontSize: '0.72rem', color: '#71859b', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
          <strong>Demo Credentials:</strong><br />
          User: <code>user@ev.com</code> / <code>User@123</code><br />
          Admin: <code>admin@ev.com</code> / <code>Admin@123</code>
        </div>
      </div>
    </div>
  );
}
