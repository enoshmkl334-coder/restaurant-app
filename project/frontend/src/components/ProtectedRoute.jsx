import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

function ProtectedRoute({ children, requiredRole, forbiddenRole }) {
  const { user, loading } = useUser(); // Add loading here

  // Show loading while checking auth
  if (loading) {
    return <div className="loading">Checking authentication...</div>;
  }

  // If no user is logged in, redirect to login
  if (!user) {
    console.log("ProtectedRoute: No user logged in, redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  console.log(
    `ProtectedRoute: User role = ${user.role}, requiredRole = ${requiredRole}, forbiddenRole = ${forbiddenRole}`
  );

  // Check if user has forbidden role (e.g., owner trying to access menu)
  if (forbiddenRole && user.role === forbiddenRole) {
    console.log(`ProtectedRoute: ${user.role} cannot access this page`);
    if (user.role === "owner") {
      return <Navigate to="/owner" replace />;
    } else {
      return <Navigate to="/menu" replace />;
    }
  }

  // Check if user has the required role
  if (requiredRole && user.role !== requiredRole) {
    console.log(
      `ProtectedRoute: Access denied! ${user.role} cannot access ${requiredRole} route`
    );

    // Redirect based on user's actual role
    if (user.role === "owner") {
      return <Navigate to="/owner" replace />;
    } else {
      return <Navigate to="/menu" replace />;
    }
  }

  // User has correct role, show the page
  console.log(`ProtectedRoute: Access granted for ${user.role}`);
  return children;
}

export default ProtectedRoute;
