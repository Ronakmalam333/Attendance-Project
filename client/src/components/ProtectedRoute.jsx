import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ role, children }) => {
  const { user, isLoading } = useContext(AuthContext);
  console.log("ProtectedRoute user:", user, isLoading, role);
  if (isLoading) {
    return null; // Or your loading spinner here
  }

  if (!user || user.role !== role) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;