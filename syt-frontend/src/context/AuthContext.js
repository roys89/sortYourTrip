import React, { createContext, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { checkAuthStatus, login, logout, register } from '../redux/slices/authSlice';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, error, isAuthenticated, initialized } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  const handleLogin = async (credentials, options = {}) => {
    try {
      await dispatch(login(credentials)).unwrap();
      const destination = location.state?.from || '/';
      if (options.redirect !== false) {
        navigate(destination);
      }
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleRegister = async (userData, options = {}) => {
    try {
      await dispatch(register(userData)).unwrap();
      const destination = location.state?.from || '/';
      if (options.redirect !== false) {
        navigate(destination);
      }
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    initialized,
    login: handleLogin,
    logout: handleLogout,
    register: handleRegister
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};