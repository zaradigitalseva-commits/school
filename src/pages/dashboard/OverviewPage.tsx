import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Megaphone,
  CalendarDays,
  Users,
  BookOpen,
} from 'lucide-react';

import {
  fetchAnnouncements,
  fetchEvents,
  fetchTeachers,
  formatDate,
} from '@/firebase/firestore';

import type {
  Announcement,
  SchoolEvent,
  Teacher,
} from '@/firebase/types';

import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function OverviewPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchAnnouncements().catch(() => [] as Announcement[]),
      fetchEvents().catch(() => [] as SchoolEvent[]),
      fetchTeachers().catch(() => [] as Teacher[]),
    ])
      .then(([a, e, t]) => {
        setAnnouncements(a);
        setEvents(e);
        setTeachers(t);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading dashboard..." />;
  }

  const stats = [
    {
      label: 'Announcements',
      value: announcements.length,
      icon: Megaphone,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Events',
      value: events.length,
      icon: CalendarDays,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Teachers',
      value: teachers.length,
      icon: Users,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Recent Notices',
      value: announcements.slice(0, 5).length,
      icon: BookOpen,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-blue-600" />
          Dashboard Overview
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          A quick snapshot of your school's activity.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-5 card-shadow"
            >
              <div
                className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}
              >
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>

              <p className="text-2xl font-bold text-gray-900">
                {stat.value}
              </p>

              <p className="text-xs text-gray-500 mt-0.5">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 card-shadow">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
            Recent Announcements
          </h3>

          {announcements.length === 0 ? (
            <p className="text-sm text-gray-400">
              No announcements yet.
            </p>
          ) : (
            <div className="space-y-3">
              {announcements.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3"
                >
                  <Megaphone className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.title}
                    </p>

                    <p className="text-xs text-gray-400">
                      {formatDate(item.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 card-shadow">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
            Upcoming Events
          </h3>

          {events.length === 0 ? (
            <p className="text-sm text-gray-400">
              No events yet.
            </p>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3"
                >
                  <CalendarDays className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.title}
                    </p>

                    <p className="text-xs text-gray-400">
                      {formatDate(item.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
