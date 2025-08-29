import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ role, children }) => {
  const { user, isAuthenticated, isLoading } = useContext(AuthContext);
  
  if (isLoading) {
    return <div>Loading...</div>; // Loading spinner
  }

  if (!isAuthenticated || !user || user.role !== role) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;