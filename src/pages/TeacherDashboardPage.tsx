import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  subscribeToMyMembership,
  subscribeToSchool,
  subscribeToSchoolCollection,
} from '@/firebase/firestore';
import type { School, SchoolMembership } from '@/firebase/types';

type SchoolRow = Record<string, any>;

function getClassName(row: SchoolRow): string {
  return String(
    row.className ??
      row.class ??
      row.assignedClass ??
      row.classId ??
      row.standard ??
      ''
  ).trim();
}

function matchesAssignedClass(row: SchoolRow, assignments: string[]): boolean {
  if (!assignments.length) return true;
  const rowClass = getClassName(row).toLowerCase();
  if (!rowClass) return false;

  return assignments.some((assignment) => {
    const wanted = String(assignment).trim().toLowerCase();
    return (
      rowClass === wanted ||
      rowClass.includes(wanted) ||
      wanted.includes(rowClass)
    );
  });
}

function formatDate(value: unknown): string {
  if (!value) return '';
  try {
    if (
      typeof value === 'object' &&
      value !== null &&
      'toDate' in value &&
      typeof (value as { toDate?: unknown }).toDate === 'function'
    ) {
      return (value as { toDate: () => Date }).toDate().toLocaleDateString('en-IN');
    }
    const date = new Date(value as string | number);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-IN');
  } catch {
    return '';
  }
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
      <div className="text-3xl">{icon}</div>
      <p className="mt-3 text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-1 break-words text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function DataList({
  title,
  icon,
  rows,
  emptyText,
  renderRow,
}: {
  title: string;
  icon: string;
  rows: SchoolRow[];
  emptyText: string;
  renderRow: (row: SchoolRow) => React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-slate-900">
          {icon} {title}
        </h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
          {rows.length}
        </span>
      </div>

      {rows.length ? (
        <div className="space-y-3">
          {rows.slice(0, 8).map((row) => (
            <div key={String(row.id)} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              {renderRow(row)}
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
          {emptyText}
        </p>
      )}
    </section>
  );
}

export default function TeacherDashboardPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [membership, setMembership] = useState<SchoolMembership | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [students, setStudents] = useState<SchoolRow[]>([]);
  const [homework, setHomework] = useState<SchoolRow[]>([]);
  const [results, setResults] = useState<SchoolRow[]>([]);
  const [attendance, setAttendance] = useState<SchoolRow[]>([]);
  const [notices, setNotices] = useState<SchoolRow[]>([]);
  const [events, setEvents] = useState<SchoolRow[]>([]);
  const [gallery, setGallery] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.uid) {
      navigate('/login', { replace: true });
      return;
    }

    setLoading(true);
    setError('');

    let unsubscribeSchool = () => {};
    const collectionUnsubscribers: Array<() => void> = [];

    const unsubscribeMembership = subscribeToMyMembership(
      user.uid,
      (current) => {
        if (!current || current.status !== 'ACTIVE' || current.role !== 'teacher') {
          setMembership(null);
          setSchool(null);
          setLoading(false);
          unsubscribeSchool();
          collectionUnsubscribers.forEach((unsubscribe) => unsubscribe());
          navigate('/', { replace: true });
          return;
        }

        setMembership(current);

        unsubscribeSchool();
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
          (listenerError) => {
            console.error('Teacher school listener error:', listenerError);
            setError('School information load nahi ho paayi.');
            setLoading(false);
          }
        );

        collectionUnsubscribers.forEach((unsubscribe) => unsubscribe());
        collectionUnsubscribers.length = 0;

        const subscribe = (
          collectionName: string,
          setter: (rows: SchoolRow[]) => void
        ) => {
          collectionUnsubscribers.push(
            subscribeToSchoolCollection(
              current.schoolId,
              collectionName,
              setter,
              (listenerError) => {
                console.error(`Teacher ${collectionName} listener error:`, listenerError);
              }
            )
          );
        };

        subscribe('students', setStudents);
        subscribe('homework', setHomework);
        subscribe('results', setResults);
        subscribe('attendance', setAttendance);
        subscribe('announcements', setNotices);
        subscribe('events', setEvents);
        subscribe('gallery', setGallery);
      },
      (listenerError) => {
        console.error('Live teacher membership error:', listenerError);
        setError('Teacher membership load nahi ho paayi.');
        setLoading(false);
      }
    );

    return () => {
      unsubscribeMembership();
      unsubscribeSchool();
      collectionUnsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [navigate, user?.uid]);

  const assignments = membership?.assignments ?? [];

  const myStudents = useMemo(
    () => students.filter((row) => matchesAssignedClass(row, assignments)),
    [students, assignments]
  );

  const myHomework = useMemo(
    () => homework.filter((row) => matchesAssignedClass(row, assignments)),
    [homework, assignments]
  );

  const myResults = useMemo(
    () => results.filter((row) => matchesAssignedClass(row, assignments)),
    [results, assignments]
  );

  const myAttendance = useMemo(
    () => attendance.filter((row) => matchesAssignedClass(row, assignments)),
    [attendance, assignments]
  );

  const assignedText = assignments.length ? assignments.join(', ') : 'No class assigned';

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
              <h1 className="truncate text-lg font-black text-slate-900">{school.name}</h1>
              <p className="text-xs font-bold text-blue-600">Teacher Dashboard</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signOut()}
            className="rounded-xl bg-red-600 px-4 py-2 font-black text-white shadow-[0_4px_0_rgb(153,27,27)] active:translate-y-1 active:shadow-none"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <section className="rounded-3xl bg-white p-6 shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-blue-600">
                👨‍🏫 Teacher Work Area
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">
                Welcome, Teacher
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Aap sirf <strong>{school.name}</strong> ke assigned class data par kaam karte hain.
              </p>
            </div>

            <Link
              to={`/school/${school.slug}`}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 text-center font-black text-white shadow-[0_5px_0_rgb(67,56,202)]"
            >
              🌐 View School Website
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-blue-50 p-5">
              <p className="text-sm font-bold text-blue-700">📚 My Assigned Classes</p>
              <p className="mt-2 break-words text-lg font-black text-slate-900">{assignedText}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-5">
              <p className="text-sm font-bold text-emerald-700">🏫 School</p>
              <p className="mt-2 text-lg font-black text-slate-900">{school.name}</p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon="👨‍🎓" label="My Students" value={myStudents.length} />
          <StatCard icon="📝" label="My Homework" value={myHomework.length} />
          <StatCard icon="📊" label="My Results" value={myResults.length} />
          <StatCard icon="📅" label="My Attendance" value={myAttendance.length} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <DataList
            title="My Students"
            icon="👨‍🎓"
            rows={myStudents}
            emptyText="Assigned class ke students abhi nahi mile."
            renderRow={(row) => (
              <div>
                <p className="font-black text-slate-900">
                  {row.name || row.studentName || 'Student'}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Class: {getClassName(row) || '—'} {row.rollNumber ? ` • Roll: ${row.rollNumber}` : ''}
                </p>
              </div>
            )}
          />

          <DataList
            title="My Homework"
            icon="📝"
            rows={myHomework}
            emptyText="Assigned class ka homework abhi nahi hai."
            renderRow={(row) => (
              <div>
                <p className="font-black text-slate-900">
                  {row.title || row.subject || 'Homework'}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                  {row.description || row.content || 'No description'}
                </p>
                <p className="mt-2 text-xs font-bold text-slate-500">
                  Class: {getClassName(row) || '—'} {formatDate(row.date || row.createdAt) ? ` • ${formatDate(row.date || row.createdAt)}` : ''}
                </p>
              </div>
            )}
          />

          <DataList
            title="My Results"
            icon="📊"
            rows={myResults}
            emptyText="Assigned class ke results abhi nahi hain."
            renderRow={(row) => (
              <div>
                <p className="font-black text-slate-900">
                  {row.studentName || row.name || 'Result'}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {row.subject ? `Subject: ${row.subject}` : ''}
                  {row.marks !== undefined ? ` • Marks: ${row.marks}` : ''}
                </p>
                <p className="mt-2 text-xs font-bold text-slate-500">
                  Class: {getClassName(row) || '—'}
                </p>
              </div>
            )}
          />

          <DataList
            title="My Attendance"
            icon="📅"
            rows={myAttendance}
            emptyText="Assigned class ki attendance abhi nahi hai."
            renderRow={(row) => (
              <div>
                <p className="font-black text-slate-900">
                  {row.studentName || row.name || 'Attendance'}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Status: {row.status || row.attendanceStatus || '—'}
                </p>
                <p className="mt-2 text-xs font-bold text-slate-500">
                  Class: {getClassName(row) || '—'} {formatDate(row.date || row.createdAt) ? ` • ${formatDate(row.date || row.createdAt)}` : ''}
                </p>
              </div>
            )}
          />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <DataList
            title="School Notices"
            icon="📢"
            rows={notices}
            emptyText="No notices found."
            renderRow={(row) => (
              <div>
                <p className="font-black text-slate-900">{row.title || 'Notice'}</p>
                <p className="mt-1 text-sm text-slate-600">{row.content || row.description || ''}</p>
              </div>
            )}
          />

          <DataList
            title="School Events"
            icon="🎉"
            rows={events}
            emptyText="No events found."
            renderRow={(row) => (
              <div>
                <p className="font-black text-slate-900">{row.title || 'Event'}</p>
                <p className="mt-1 text-sm text-slate-600">{row.description || ''}</p>
                {row.eventDate ? (
                  <p className="mt-2 text-xs font-bold text-slate-500">{formatDate(row.eventDate)}</p>
                ) : null}
              </div>
            )}
          />

          <DataList
            title="School Gallery"
            icon="🖼️"
            rows={gallery}
            emptyText="No gallery items found."
            renderRow={(row) => (
              <div>
                <p className="font-black text-slate-900">{row.title || row.caption || 'Gallery'}</p>
                {row.imageUrl ? (
                  <img
                    src={row.imageUrl}
                    alt={row.title || 'School gallery'}
                    className="mt-3 h-32 w-full rounded-xl object-cover"
                  />
                ) : null}
              </div>
            )}
          />
        </section>

        <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="font-black text-amber-900">🔒 Teacher Access</h3>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            Teacher ko School Information, Teachers, Staff Access, Subscription,
            school settings aur doosre schools ka admin panel nahi dikhaya jaata.
            Is dashboard ka school ID active teacher membership se liya jaata hai.
          </p>
        </section>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-xl bg-slate-200 px-5 py-3 font-black text-slate-900"
          >
            🏠 Home
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard/teacher')}
            className="rounded-xl bg-slate-900 px-5 py-3 font-black text-white"
          >
            🔄 Refresh Board
          </button>
        </div>
      </main>
    </div>
  );
}
