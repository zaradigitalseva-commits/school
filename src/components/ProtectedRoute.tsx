import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { UserRole } from '@/firebase/types';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  adminOnly?: boolean;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  adminOnly,
}: ProtectedRouteProps) {
  const { user, loading, role } = useAuth();

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen
        label="Checking access..."
      />
    );
  }

  // Login नहीं है
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // New multi-school role system
  // adminOnly पुरानी compatibility के लिए रखा गया है
  const allowed =
    allowedRoles ??
    (adminOnly
      ? ['platform_admin']
      : ['platform_admin', 'school_admin', 'teacher']);

  // Role की अनुमति नहीं है
  if (!allowed.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
