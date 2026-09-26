import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import {
  fetchMyMemberships,
  isPlatformAdminEmail,
} from '@/firebase/firestore';

export default function DashboardRedirect() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [checkingRoles, setCheckingRoles] = useState(true);
  const [hasSchoolAdminRole, setHasSchoolAdminRole] = useState(false);
  const [hasTeacherRole, setHasTeacherRole] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkRoles() {
      if (!user) {
        if (!cancelled) setCheckingRoles(false);
        return;
      }

      try {
        const memberships = await fetchMyMemberships();
        const active = memberships.filter(
          (membership) => membership.status === 'ACTIVE'
        );

        if (!cancelled) {
          setHasSchoolAdminRole(
            active.some((membership) => membership.role === 'school_admin')
          );
          setHasTeacherRole(
            active.some((membership) => membership.role === 'teacher')
          );
        }
      } catch (error) {
        console.error('Dashboard role check failed:', error);
      } finally {
        if (!cancelled) setCheckingRoles(false);
      }
    }

    checkRoles();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading || checkingRoles) {
    return <LoadingSpinner fullScreen label="Opening dashboard..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isPlatformAdminEmail(user.email) || role === 'platform_admin') {
    return <Navigate to="/admin" replace />;
  }

  const bothRoles =
    hasSchoolAdminRole && hasTeacherRole;

  if (bothRoles) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          background:
            'linear-gradient(135deg, #eef2ff 0%, #fdf2f8 50%, #ecfeff 100%)',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 560,
            padding: 28,
            borderRadius: 24,
            background: '#fff',
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎓</div>
          <h1 style={{ margin: 0, fontSize: 28 }}>
            Select Dashboard
          </h1>
          <p style={{ color: '#64748b', margin: '10px 0 24px' }}>
            इस Google account में School Admin और Teacher दोनों access हैं।
            आप जिस dashboard में जाना चाहते हैं, उसे चुनें।
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: 16,
            }}
          >
            <button
              type="button"
              onClick={() => navigate('/school-admin')}
              style={{
                padding: '18px 16px',
                border: 0,
                borderRadius: 18,
                background: 'linear-gradient(135deg,#2563eb,#4f46e5)',
                color: '#fff',
                fontSize: 17,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🏫 School Admin
              <div style={{ fontSize: 12, fontWeight: 400, marginTop: 5 }}>
                School management
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard/teacher')}
              style={{
                padding: '18px 16px',
                border: 0,
                borderRadius: 18,
                background: 'linear-gradient(135deg,#059669,#0d9488)',
                color: '#fff',
                fontSize: 17,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              👨‍🏫 Teacher Dashboard
              <div style={{ fontSize: 12, fontWeight: 400, marginTop: 5 }}>
                Teacher work
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (role === 'school_admin' || hasSchoolAdminRole) {
    return <Navigate to="/school-admin" replace />;
  }

  if (role === 'teacher' || hasTeacherRole) {
    return <Navigate to="/dashboard/teacher" replace />;
  }

  return <Navigate to="/" replace />;
}
