import { Navigate } from 'react-router-dom';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { isPlatformAdminEmail } from '@/firebase/firestore';

export default function DashboardRedirect() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen label="Opening dashboard..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isPlatformAdminEmail(user.email) || role === 'platform_admin') {
    return <Navigate to="/admin" replace />;
  }

  if (role === 'school_admin') {
    return <Navigate to="/school-admin" replace />;
  }

  if (role === 'teacher') {
    return <Navigate to="/dashboard/teacher" replace />;
  }

  return <Navigate to="/" replace />;
}
