import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  subscribeToMyMembership,
  subscribeToSchool,
} from '@/firebase/firestore';
import type { School, SchoolMembership } from '@/firebase/types';

export default function TeacherDashboardPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [membership, setMembership] = useState<SchoolMembership | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      navigate('/login', { replace: true });
      return;
    }

    setLoading(true);

    let unsubscribeSchool = () => {};

    const unsubscribeMembership = subscribeToMyMembership(
      user.uid,
      (current) => {
        if (!current || current.status !== 'ACTIVE' || current.role !== 'teacher') {
          setMembership(null);
          setSchool(null);
          setLoading(false);
          unsubscribeSchool();
          navigate('/', { replace: true });
          return;
        }

        setMembership(current);
        unsubscribeSchool = subscribeToSchool(
          current.schoolId,
          (schoolData) => {
            if (!schoolData || schoolData.status !== 'LIVE') {
              setSchool(null);
              setLoading(false);
              navigate('/', { replace: true });
              return;
            }
            setSchool(schoolData);
            setLoading(false);
          },
          (error) => {
            console.error('Live teacher school error:', error);
            setLoading(false);
          }
        );
      },
      (error) => {
        console.error('Live teacher membership error:', error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeMembership();
      unsubscribeSchool();
    };
  }, [navigate, user?.uid]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white">
        <div className="rounded-3xl bg-white/15 px-8 py-6 text-center shadow-2xl backdrop-blur">
          <div className="text-4xl">👨‍🏫</div>
          <p className="mt-3 font-black">Teacher dashboard loading...</p>
        </div>
      </div>
    );
  }

  if (!membership || !school) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="border-b bg-white/95 shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-2xl shadow-lg">
              👨‍🏫
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-black text-slate-900">
                {school.name}
              </h1>
              <p className="text-xs font-bold text-blue-600">
                Teacher Dashboard
              </p>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="rounded-xl bg-red-600 px-4 py-2 font-black text-white shadow-[0_4px_0_rgb(153,27,27)] active:translate-y-1 active:shadow-none"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-3xl bg-white p-6 shadow-xl">
          <h2 className="text-2xl font-black text-slate-900">
            Welcome, Teacher
          </h2>
          <p className="mt-2 text-slate-600">
            You can work only inside <strong>{school.name}</strong>.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-blue-50 p-5">
              <p className="text-sm font-bold text-blue-700">Assigned Classes</p>
              <p className="mt-2 text-lg font-black text-slate-900">
                {membership.assignments?.length
                  ? membership.assignments.join(', ')
                  : 'No class assigned'}
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-5">
              <p className="text-sm font-bold text-emerald-700">School</p>
              <p className="mt-2 text-lg font-black text-slate-900">
                {school.name}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={`/school/${school.slug}`}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 font-black text-white shadow-[0_5px_0_rgb(67,56,202)]"
            >
              View School Website
            </Link>
            <button
              onClick={() => navigate('/')}
              className="rounded-xl bg-slate-200 px-5 py-3 font-black text-slate-900"
            >
              Home
            </button>
          </div>

          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="font-black text-amber-900">
              🔒 Access control active
            </p>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              Teacher access is limited by Firestore to the assigned school
              and assigned classes for supported teacher-editable records.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
