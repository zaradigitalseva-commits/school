import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly }: ProtectedRouteProps) {
  const { user, loading, isAdmin, isFaculty } = useAuth();

  if (loading) return <LoadingSpinner fullScreen label="Checking access..." />;

  if (!user) return <Navigate to="/login" replace />;

  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;

  if (!isAdmin && !isFaculty) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
