import { createContext, useEffect, useState } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const applyTeamAccent = (color) => {
  const root = document.documentElement;
  if (color) {
    root.style.setProperty('--team-accent', color);
  } else {
    root.style.setProperty('--team-accent', '#22d3ee');
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('kfc_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      localStorage.setItem('kfc_user', JSON.stringify(user));
      // Apply team accent if user belongs to an approved team or has a team color
      if (user.team && (user.team.status === 'approved' || user.team.color)) {
        applyTeamAccent(user.team.color);
      } else {
        applyTeamAccent(null);
      }
    } else {
      localStorage.removeItem('kfc_user');
      applyTeamAccent(null);
    }
  }, [user]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('kfc_token', data.token);
    setUser(data);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    if (data.token) {
      localStorage.setItem('kfc_token', data.token);
      setUser(data);
    }
    return data;
  };

  const verifyEmail = async (email, code) => {
    const { data } = await api.post('/auth/verify-email', { email, code });
    if (data.token) {
      localStorage.setItem('kfc_token', data.token);
      setUser(data);
    }
    return data;
  };

  const resendVerificationCode = async (email) => {
    const { data } = await api.post('/auth/resend-code', { email });
    return data;
  };

  const registerManager = async (payload) => {
    const { data } = await api.post('/auth/register-team', payload);
    localStorage.setItem('kfc_token', data.token);
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('kfc_token');
    localStorage.removeItem('kfc_user');
    setUser(null);
    applyTeamAccent(null);
  };

  const refreshMe = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch (error) {
      console.error(error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('kfc_token')) {
      refreshMe();
    } else {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        register,
        registerManager,
        verifyEmail,
        resendVerificationCode,
        refreshMe,
        applyTeamAccent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );

};
