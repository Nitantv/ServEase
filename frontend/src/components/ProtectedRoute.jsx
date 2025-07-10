// frontend/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Check if the user's info exists in localStorage from the login process.
  const userInfo = localStorage.getItem('userInfo');

  if (!userInfo) {
    // If no user info is found, redirect to the login page.
    return <Navigate to="/login" replace />;
  }

  // If user info exists, render the requested child component (e.g., DashboardPage).
  // The <Outlet /> is a placeholder provided by react-router-dom for the child route.
  return <Outlet />;
};

export default ProtectedRoute;