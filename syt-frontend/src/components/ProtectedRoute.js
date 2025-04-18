import { Box, CircularProgress } from '@mui/material';
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  console.log('=== ProtectedRoute Component ===');
  const { isAuthenticated, loading, initialized } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute State:', {
    isAuthenticated,
    loading,
    initialized,
    pathname: location.pathname
  });

  if (!initialized || loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/auth/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;