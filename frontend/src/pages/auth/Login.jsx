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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#1e293b', padding: '2rem', borderRadius: '0.75rem', border: '1px solid #334155', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}>
        <h2 style={{ color: '#f8fafc', margin: '0 0 0.5rem', textAlign: 'center' }}>Welcome Back</h2>
        <p style={{ color: '#94a3b8', margin: '0 0 1.5rem', fontSize: '0.875rem', textAlign: 'center' }}>Sign in to your EV Charging account</p>

        {error && (
          <div style={{ background: '#7f1d1d', border: '1px solid #b91c1c', color: '#fecaca', padding: '0.65rem 1rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.35rem' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@ev.com"
              required
              style={{ width: '100%', padding: '0.65rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '0.375rem', color: '#f8fafc', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.35rem' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: '100%', padding: '0.65rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '0.375rem', color: '#f8fafc', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem', background: loading ? '#0369a1' : '#0284c7', color: '#fff', border: 'none', borderRadius: '0.375rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '500' }}>
            Register here
          </Link>
        </div>

        <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: '#0f172a', borderRadius: '0.375rem', fontSize: '0.75rem', color: '#64748b', border: '1px solid #1e293b' }}>
          <strong>Demo Credentials:</strong><br />
          User: <code>user@ev.com</code> / <code>User@123</code><br />
          Admin: <code>admin@ev.com</code> / <code>Admin@123</code>
        </div>
      </div>
    </div>
  );
}
