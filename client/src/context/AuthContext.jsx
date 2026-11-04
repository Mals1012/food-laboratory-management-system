import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('foodlab_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('foodlab_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('foodlab_token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('foodlab_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.error('[Auth Error] Session invalid:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    const res = await authService.login({ username, password });
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('foodlab_token', res.token);
      localStorage.setItem('foodlab_user', JSON.stringify(res.user));
    }
    return res;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('foodlab_token');
    localStorage.removeItem('foodlab_user');
  };

  // RBAC Permission Helpers
  const hasRole = (...allowedRoles) => {
    if (!user) return false;
    if (user.role === 'Admin') return true; // Admin has super-privilege
    return allowedRoles.includes(user.role);
  };

  const isRole = (role) => {
    return user?.role === role;
  };

  const canManageBatches = () => hasRole('Admin', 'Lab Manager', 'Production Staff');
  const canPerformTests = () => hasRole('Admin', 'Lab Manager', 'Lab Analyst');
  const canReviewQA = () => hasRole('Admin', 'Quality Manager');
  const canGenerateCOA = () => hasRole('Admin', 'Quality Manager');
  const canManageUsers = () => hasRole('Admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        logout,
        hasRole,
        isRole,
        canManageBatches,
        canPerformTests,
        canReviewQA,
        canGenerateCOA,
        canManageUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
