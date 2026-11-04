import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Skeleton from "./ui/Skeleton";

const ProtectedRoute = ({ role, children }) => {
  const { user, isAuthenticated, isLoading } = useContext(AuthContext);
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "var(--bg-canvas, #f8fafc)",
          gap: "16px",
          padding: "24px",
        }}
      >
        <div style={{ width: "240px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <Skeleton height="32px" borderRadius="8px" />
          <Skeleton height="16px" borderRadius="4px" />
          <Skeleton height="16px" borderRadius="4px" width="70%" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to='/' replace />;
  }

  // Role-based access control: strictly keep unauthorized users out of admin/server areas
  if (user.role !== role) {
    // Redirect to their own role-authorized portal
    const authorizedPath = user.role === "staff" ? "/staff" : "/student";
    return <Navigate to={authorizedPath} replace />;
  }

  // Profile completion check for Google sign-ins or incomplete accounts
  const needsProfileCompletion = user.profileCompleted === false;
  if (needsProfileCompletion && location.pathname !== "/complete-profile") {
    return <Navigate to='/complete-profile' replace />;
  }

  return children;
};

export default ProtectedRoute;
