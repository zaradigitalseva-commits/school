import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { isPlatformAdminEmail } from '@/firebase/firestore';
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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const allowed =
    allowedRoles ??
    (adminOnly
      ? ['platform_admin']
      : ['platform_admin', 'school_admin', 'teacher']);

  // Platform admin is identified by the exact admin email.
  // This prevents a temporary role lookup failure from
  // redirecting the real platform admin away from admin pages.
  const isExactPlatformAdmin =
    isPlatformAdminEmail(user.email);

  if (
    !allowed.includes(role) &&
    !(isExactPlatformAdmin && allowed.includes('platform_admin'))
  ) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
