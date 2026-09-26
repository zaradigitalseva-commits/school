import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { fetchMyMemberships, fetchMyTeacherSchools, fetchMyAdminSchools, fetchSchoolById, fetchMyTeacherProfile, createTeacherInvite, claimTeacherInvite, isPlatformAdminEmail } from '@/firebase/firestore';
import type { SchoolMembership } from '@/firebase/types';

type SchoolAccess = {
  schoolId: string;
  schoolName: string;
  isAdmin: boolean;
  isTeacher: boolean;
};

export default function DashboardRedirect() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [access, setAccess] = useState<SchoolAccess[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function checkRoles() {
      if (!user) {
        if (!cancelled) setChecking(false);
        return;
      }

      try {
        // Read each role source independently. If one Firestore query is
        // denied, it must not hide the other valid dashboard role.
        const [membershipsResult, teacherSchoolsResult, adminSchoolsResult] =
          await Promise.allSettled([
            fetchMyMemberships(),
            fetchMyTeacherSchools(user.email || ''),
            fetchMyAdminSchools(user.uid),
          ]);

        const memberships =
          membershipsResult.status === 'fulfilled'
            ? membershipsResult.value
            : [];
        const teacherSchools =
          teacherSchoolsResult.status === 'fulfilled'
            ? teacherSchoolsResult.value
            : [];
        const adminSchools =
          adminSchoolsResult.status === 'fulfilled'
            ? adminSchoolsResult.value
            : [];

        const active = memberships.filter((m) => m.status === 'ACTIVE');
        const bySchool = new Map<string, SchoolAccess>();

        active.forEach((m: SchoolMembership) => {
          if (m.role !== 'school_admin' && m.role !== 'teacher') return;
          const current = bySchool.get(m.schoolId) || {
            schoolId: m.schoolId,
            schoolName: m.schoolId,
            isAdmin: false,
            isTeacher: false,
          };
          if (m.role === 'school_admin') current.isAdmin = true;
          if (m.role === 'teacher') current.isTeacher = true;
          bySchool.set(m.schoolId, current);
        });

        // School owners are School Admins even if the membership document
        // has not been created yet.
        for (const schoolId of adminSchools) {
          const current = bySchool.get(schoolId) || {
            schoolId,
            schoolName: schoolId,
            isAdmin: false,
            isTeacher: false,
          };
          current.isAdmin = true;
          bySchool.set(schoolId, current);
        }

        for (const schoolId of teacherSchools) {
          // If this same Google account is also the School Admin, repair the
          // old profile-only teacher access by creating/claiming a separate
          // teacher membership. This keeps Admin and Teacher roles independent.
          if (adminSchools.includes(schoolId)) {
            try {
              const teacher = await fetchMyTeacherProfile(schoolId, user.email || '');
              if (teacher?.assignedClass) {
                await createTeacherInvite({
                  schoolId,
                  teacherId: String(teacher.id || ''),
                  email: String(teacher.email || user.email || ''),
                  assignedClass: String(teacher.assignedClass),
                  section: String(teacher.section || ''),
                  subject: String(teacher.subject || ''),
                });
                await claimTeacherInvite(user.uid, user.email || '');
              }
            } catch (repairError) {
              console.error('Dual-role teacher access repair failed:', repairError);
            }
          }

          const current = bySchool.get(schoolId) || {
            schoolId,
            schoolName: schoolId,
            isAdmin: false,
            isTeacher: false,
          };
          current.isTeacher = true;
          bySchool.set(schoolId, current);
        }

        const rows = await Promise.all(
          Array.from(bySchool.values()).map(async (item) => {
            const school = await fetchSchoolById(item.schoolId);
            return { ...item, schoolName: school?.name || item.schoolId };
          })
        );

        if (!cancelled) setAccess(rows);
      } catch (error) {
        console.error('Dashboard role check failed:', error);
        if (!cancelled) setAccess([]);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    void checkRoles();
    return () => { cancelled = true; };
  }, [user]);

  if (loading || checking) {
    return <LoadingSpinner fullScreen label="Opening dashboard..." />;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (isPlatformAdminEmail(user.email) || role === 'platform_admin') {
    return <Navigate to="/admin" replace />;
  }

  if (access.length === 1) {
    const a = access[0];
    if (a.isAdmin && a.isTeacher) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-pink-50 to-cyan-50 p-4 sm:p-6">
          <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-xl items-center justify-center">
            <div className="w-full rounded-3xl bg-white p-5 text-center shadow-2xl sm:p-8">
              <div className="mb-2 text-5xl">🎓</div>
              <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Choose Your Dashboard</h1>
              <p className="mt-2 mb-6 text-sm font-semibold text-slate-500">
                {a.schoolName} में आपके पास School Admin और Teacher दोनों access हैं।
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button onClick={() => navigate('/school-admin?schoolId=' + encodeURIComponent(a.schoolId))}
                  className="min-h-28 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-4 text-left font-black text-white shadow-lg">
                  🏫 School Admin
                  <span className="mt-1 block text-xs font-semibold opacity-90">इसी school का Admin</span>
                </button>
                <button onClick={() => navigate('/dashboard/teacher?schoolId=' + encodeURIComponent(a.schoolId))}
                  className="min-h-28 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 p-4 text-left font-black text-white shadow-lg">
                  👨‍🏫 Teacher Dashboard
                  <span className="mt-1 block text-xs font-semibold opacity-90">इसी school की Teacher access</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    if (a.isAdmin) return <Navigate to={'/school-admin?schoolId=' + encodeURIComponent(a.schoolId)} replace />;
    if (a.isTeacher) return <Navigate to={'/dashboard/teacher?schoolId=' + encodeURIComponent(a.schoolId)} replace />;
  }

  if (access.length > 1) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-2 text-2xl font-black text-slate-900">Select School</h1>
          <p className="mb-5 text-sm font-semibold text-slate-500">हर school के लिए केवल उसी school के active roles दिखाए गए हैं।</p>
          <div className="grid gap-4">
            {access.map((a) => (
              <div key={a.schoolId} className="rounded-2xl bg-white p-4 shadow-lg">
                <h2 className="font-black text-slate-900">{a.schoolName}</h2>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {a.isAdmin && <button onClick={() => navigate('/school-admin?schoolId=' + encodeURIComponent(a.schoolId))}
                    className="rounded-xl bg-blue-600 px-4 py-3 font-black text-white">🏫 School Admin</button>}
                  {a.isTeacher && <button onClick={() => navigate('/dashboard/teacher?schoolId=' + encodeURIComponent(a.schoolId))}
                    className="rounded-xl bg-emerald-600 px-4 py-3 font-black text-white">👨‍🏫 Teacher Dashboard</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <Navigate to="/" replace />;
}
