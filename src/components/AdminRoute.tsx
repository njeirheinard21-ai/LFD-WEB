import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Define logic for what makes an admin
  // 1. Role is exactly 'admin'
  // 2. Or explicit email override
  const isAdmin = user?.role === 'admin' || 
                  user?.email?.toLowerCase() === 'njeirheinard21@gmail.com' || 
                  user?.email?.toLowerCase() === 'obenmaxjr@gmail.com';

  if (!user || !isAdmin) {
    // If not logged in, go to admin-login
    if (!user) {
      return <Navigate to="/admin-login" state={{ from: location }} replace />;
    }
    // If logged in but not admin, go to home
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
