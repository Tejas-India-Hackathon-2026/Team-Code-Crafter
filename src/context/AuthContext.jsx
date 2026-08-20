import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('wc_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize and verify stored session
  useEffect(() => {
    async function checkAuth() {
      const storedToken = localStorage.getItem('wc_token');
      if (storedToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
            setToken(storedToken);
          } else {
            // Token expired or invalid
            logout();
          }
        } catch (err) {
          console.error('Failed to verify token:', err);
          // Don't log out immediately on temporary network issue
          const cachedUser = localStorage.getItem('wc_user');
          if (cachedUser) setUser(JSON.parse(cachedUser));
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  const saveSession = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('wc_token', newToken);
    localStorage.setItem('wc_user', JSON.stringify(newUser));
  };

  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }
      saveSession(data.token, data.user);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const registerCustomer = async (formData) => {
    try {
      const res = await fetch('/api/auth/register-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Registration failed');
      }
      saveSession(data.token, data.user);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const registerWorker = async (formData) => {
    try {
      const res = await fetch('/api/auth/register-worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Worker registration failed');
      }
      saveSession(data.token, data.user);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const forgotPassword = async (email) => {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return await res.json();
  };

  const resetPassword = async (data) => {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('wc_token');
    localStorage.removeItem('wc_user');
  };

  // Quick Demo Login for instant testing of all roles
  const quickDemoLogin = async (role) => {
    if (role === 'admin') {
      return await login('admin@workerconnect.com', 'admin123');
    } else if (role === 'worker') {
      return await login('rahul.electrician@example.com', 'worker123');
    } else if (role === 'worker_pending') {
      return await login('vikram.painter@example.com', 'worker123');
    } else if (role === 'customer') {
      return await login('priya.customer@example.com', 'customer123');
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('wc_user', JSON.stringify(data.user));
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        role: user?.role || null,
        isAuthenticated: !!user,
        isPendingWorker: user?.role === 'worker' && user?.status === 'pending_verification',
        login,
        registerCustomer,
        registerWorker,
        forgotPassword,
        resetPassword,
        logout,
        quickDemoLogin,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
