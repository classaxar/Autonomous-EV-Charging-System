import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ev_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserProfile() {
      if (token) {
        try {
          const res = await client.get('/api/auth/profile');
          if (res.data && res.data.success) {
            setUser(res.data.data);
          }
        } catch (err) {
          console.error('[Auth] Failed to load profile:', err.message);
          localStorage.removeItem('ev_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadUserProfile();
  }, [token]);

  const login = async (email, password) => {
    const res = await client.post('/api/auth/login', { email, password });
    if (res.data && res.data.success) {
      const { user: userData, token: jwtToken } = res.data.data;
      localStorage.setItem('ev_token', jwtToken);
      localStorage.setItem('token', jwtToken);
      setToken(jwtToken);
      setUser(userData);
      return userData;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const register = async (name, email, password) => {
    const res = await client.post('/api/auth/register', { name, email, password });
    if (res.data && res.data.success) {
      const { user: userData, token: jwtToken } = res.data.data;
      localStorage.setItem('ev_token', jwtToken);
      localStorage.setItem('token', jwtToken);
      setToken(jwtToken);
      setUser(userData);
      return userData;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('ev_token');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
