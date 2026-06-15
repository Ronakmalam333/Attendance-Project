import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ role, children }) => {
  const { user, isAuthenticated, isLoading } = useContext(AuthContext);
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>; // Loading spinner
  }

  if (!isAuthenticated || !user || user.role !== role) {
    return <Navigate to='/' />;
  }

  // Only check profile completion for users who explicitly have profileCompleted: false
  // This ensures existing accounts (which don't have this field or have valid data) can login
  // Only Google Sign-In accounts with incomplete profiles will be redirected
  const needsProfileCompletion = user.profileCompleted === false;

  if (needsProfileCompletion && location.pathname !== "/complete-profile") {
    return <Navigate to='/complete-profile' />;
  }

  return children;
};

export default ProtectedRoute;
