import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPermission }) => {
  const { token, user, fetchProfile, hasPermission } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (token && !user) {
      fetchProfile();
    }
  }, [token, user, fetchProfile]);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Permission guard check (if specified)
  if (requiredPermission && user && !hasPermission(requiredPermission)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl font-bold">403</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Truy cập bị từ chối</h2>
        <p className="text-sm text-slate-500 max-w-md">
          Bạn không có quyền <code className="text-rose-600 font-mono bg-rose-50 px-1.5 py-0.5 rounded">{requiredPermission}</code> để truy cập trang này. Vui lòng liên hệ Quản trị viên hệ thống.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
