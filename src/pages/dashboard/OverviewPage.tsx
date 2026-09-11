import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Megaphone,
  CalendarDays,
  Users,
  School,
  TrendingUp,
  ShieldCheck,
  UserCog,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  fetchAnnouncements,
  fetchEvents,
  fetchTeachers,
  fetchAllUsers,
  fetchAuthorizedAdmins,
  fetchAuthorizedFaculty,
} from '@/firebase/firestore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function OverviewPage() {
  const { isAdmin, isFaculty, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    announcements: 0,
    events: 0,
    teachers: 0,
    users: 0,
    admins: 0,
    faculty: 0,
  });

  useEffect(() => {
    Promise.all([
      fetchAnnouncements(),
      fetchEvents(),
      fetchTeachers(),
      fetchAllUsers().catch(() => []),
      fetchAuthorizedAdmins().catch(() => []),
      fetchAuthorizedFaculty().catch(() => []),
    ])
      .then(([a, e, t, u, ad, f]) => {
        setStats({
          announcements: a.length,
          events: e.length,
          teachers: t.length,
          users: u.length,
          admins: ad.length,
          faculty: f.length,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner label="Loading dashboard..." />;

  const cards = [
    { icon: Megaphone, label: 'Announcements', value: stats.announcements, to: '/dashboard/announcements', color: 'blue' },
    { icon: CalendarDays, label: 'Events', value: stats.events, to: '/dashboard/events', color: 'emerald' },
    { icon: Users, label: 'Teachers', value: stats.teachers, to: '/dashboard/teachers', color: 'amber' },
    ...(isAdmin
      ? [
          { icon: School, label: 'School Info', value: 'Edit', to: '/dashboard/school', color: 'rose' },
          { icon: TrendingUp, label: 'Registered Users', value: stats.users, to: '/dashboard/users', color: 'blue' },
          { icon: ShieldCheck, label: 'Admin Access', value: stats.admins, to: '/dashboard/admins', color: 'emerald' },
          { icon: UserCog, label: 'Faculty Access', value: stats.faculty, to: '/dashboard/faculty', color: 'amber' },
        ]
      : []),
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.displayName?.split(' ')[0] ?? 'User'}!
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isAdmin ? 'You have full administrator access.' : 'You have faculty access. Manage announcements, events, and teachers.'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => (
          <Link
            key={i}
            to={card.to}
            className="bg-white rounded-2xl p-5 card-shadow card-shadow-hover"
          >
            <div className={`w-11 h-11 rounded-xl bg-${card.color}-50 flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 text-${card.color}-600`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 card-shadow">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          Quick Actions
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { to: '/dashboard/announcements', label: 'Manage Announcements', icon: Megaphone, color: 'blue' },
            { to: '/dashboard/events', label: 'Manage Events', icon: CalendarDays, color: 'emerald' },
            { to: '/dashboard/teachers', label: 'Manage Teachers', icon: Users, color: 'amber' },
            ...(isAdmin
              ? [
                  { to: '/dashboard/school', label: 'Edit School Info', icon: School, color: 'rose' },
                  { to: '/dashboard/faculty', label: 'Manage Faculty', icon: UserCog, color: 'amber' },
                  { to: '/dashboard/admins', label: 'Manage Admins', icon: ShieldCheck, color: 'emerald' },
                ]
              : []),
          ].map((action, i) => (
            <Link
              key={i}
              to={action.to}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
            >
              <div className={`w-9 h-9 rounded-lg bg-${action.color}-50 flex items-center justify-center group-hover:scale-105 transition-transform`}>
                <action.icon className={`w-4 h-4 text-${action.color}-600`} />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
