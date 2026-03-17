import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const toastStyles = {
  position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
  zIndex: 99999, padding: '16px 28px', borderRadius: '12px', color: '#fff',
  fontSize: '15px', fontWeight: 600, textAlign: 'center', maxWidth: '90vw',
  boxShadow: '0 8px 30px rgba(0,0,0,0.18)', animation: 'authToastIn 0.4s ease',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');

    if (storedUser && accessToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signup = async (userData) => {
    const res = await api.post('/auth/signup', userData);
    return res.data;
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user: userData } = res.data.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    showToast(`Welcome back, ${userData.name || 'friend'}! It's great to have you here.`);

    return res.data;
  };

  const logout = async () => {
    showToast('Thank you for visiting. If there was any inconvenience from our side, we\'ll make sure to take care of it.', 'logout');

    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken });
    } catch (error) {
      // Logout even if API call fails
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {toast && (
        <div style={{
          ...toastStyles,
          background: toast.type === 'logout'
            ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
            : 'linear-gradient(135deg, #22c55e, #16a34a)',
        }}>
          {toast.message}
        </div>
      )}
      <style>{`@keyframes authToastIn { from { opacity:0; transform:translateX(-50%) translateY(-20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
    </AuthContext.Provider>
  );
};
