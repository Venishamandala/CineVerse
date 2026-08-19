import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('cineverse-token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.user);
        } else {
          localStorage.removeItem('cineverse-token');
        }
      } catch (err) {
        console.error('Session restoration failed:', err.message);
        localStorage.removeItem('cineverse-token');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Register user
  const register = async (name, email, password, confirmPassword) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        confirmPassword
      });

      if (response.data.success) {
        localStorage.setItem('cineverse-token', response.data.token);
        setUser(response.data.user);
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Registration failed. Please check inputs.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        localStorage.setItem('cineverse-token', response.data.token);
        setUser(response.data.user);
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Invalid email or password.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Backend logout response error:', err.message);
    } finally {
      localStorage.removeItem('cineverse-token');
      setUser(null);
    }
  };

  // Update preferred languages & favorite genres
  const savePreferences = async (preferredLanguages, favoriteGenres) => {
    setLoading(true);
    try {
      const response = await api.post('/users/preferences', {
        preferredLanguages,
        favoriteGenres
      });
      if (response.data.success) {
        // Sync preferences with user state locally
        setUser(prev => ({
          ...prev,
          preferredLanguages,
          favoriteGenres
        }));
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to update preferences.';
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register,
        login,
        logout,
        savePreferences,
        isAuthenticated: !!user
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
