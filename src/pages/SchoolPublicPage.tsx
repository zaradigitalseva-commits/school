import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  Trophy,
  Users,
  ArrowRight,
  CalendarDays,
  Megaphone,
  Award,
  Heart,
  Lightbulb,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Home,
  Images,
} from 'lucide-react';

import {
  subscribeToSchoolBySlug,
  subscribeToSchoolPublicCollection,
  subscribeToPublicResults,
  formatDate,
} from '@/firebase/firestore';

import type {
  School,
  Announcement,
  SchoolEvent,
  Teacher,
} from '@/firebase/types';

import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function SchoolPublicPage() {
  const { slug } = useParams<{ slug: string }>();

  const [school, setSchool] = useState<School | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rollNumber, setRollNumber] = useState('');
  const [resultSearchLoading, setResultSearchLoading] = useState(false);
  const [publicResults, setPublicResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) {
      setError('School URL is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setContentLoading(true);
    setError('');

    let schoolId = '';
    let unsubAnnouncements = () => {};
    let unsubEvents = () => {};
    let unsubTeachers = () => {};

    const unsubscribeSchool = subscribeToSchoolBySlug(
      slug,
      (schoolData) => {
        if (!schoolData) {
          setSchool(null);
          setError('School not found or school is not currently live.');
          setLoading(false);
          setContentLoading(false);
          unsubAnnouncements();
          unsubEvents();
          unsubTeachers();
          return;
        }

        schoolId = schoolData.id;
        setSchool(schoolData);
        setLoading(false);
        setContentLoading(false);

        unsubAnnouncements();
        unsubEvents();
        unsubTeachers();

        unsubAnnouncements = subscribeToSchoolPublicCollection(
          schoolId,
          'announcements',
          (rows) => setAnnouncements((rows as Announcement[]).slice(0, 3)),
          (err) => console.error('Live notices error:', err)
        );

        unsubEvents = subscribeToSchoolPublicCollection(
          schoolId,
          'events',
          (rows) => setEvents((rows as SchoolEvent[]).slice(0, 3)),
          (err) => console.error('Live events error:', err)
        );

        unsubTeachers = subscribeToSchoolPublicCollection(
          schoolId,
          'teachers',
          (rows) => setTeachers((rows as Teacher[]).slice(0, 4)),
          (err) => console.error('Live teachers error:', err)
        );
      },
      (err) => {
        console.error('Live school error:', err);
        setError(err.message || 'Unable to load school website.');
        setLoading(false);
        setContentLoading(false);
      }
    );

    return () => {
      unsubscribeSchool();
      unsubAnnouncements();
      unsubEvents();
      unsubTeachers();
    };
  }, [slug]);

  const [searchedRollNumber, setSearchedRollNumber] = useState('');

  if (loading) {
    return <LoadingSpinner fullScreen label="Loading school website..." />;
  }

  if (error || !school) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-4">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-2xl">
          <div className="text-6xl">🏫</div>

          <h1 className="mt-4 text-2xl font-black text-gray-900">
            School Not Available
          </h1>

          <p className="mt-3 text-gray-600">
            {error || 'This school could not be found.'}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/schools"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-7 py-3 font-black text-white shadow-[0_5px_0_rgb(67,56,202)] transition hover:brightness-110 active:translate-y-1 active:shadow-none"
            >
              🔎 View Schools
            </Link>

            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-7 py-3 font-black text-white shadow-[0_5px_0_rgb(4,120,87)] transition hover:brightness-110 active:translate-y-1 active:shadow-none"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const heroImage =
    school.heroImageUrl ||
    'https://images.pexels.com/photos/207692/pexels-photo-207692.jpeg?auto=compress&cs=tinysrgb&w=1600';

  useEffect(() => {
    if (!school?.id || !searchedRollNumber.trim()) {
      setPublicResults([]);
      setResultSearchLoading(false);
      return;
    }

    setResultSearchLoading(true);

    const unsubscribe = subscribeToPublicResults(
      school.id,
      searchedRollNumber,
      (rows) => {
        setPublicResults(rows);
        setResultSearchLoading(false);
      },
      (err) => {
        console.error('Live public result lookup failed:', err);
        setPublicResults([]);
        setResultSearchLoading(false);
      }
    );

    return unsubscribe;
  }, [school?.id, searchedRollNumber]);

  function searchPublicResults() {
    const cleanRoll = rollNumber.trim();
    setSearchedRollNumber(cleanRoll);
  }

  const campusImages =
    (
      school as School & {
        campusImages?: string[];
      }
    ).campusImages || [];

  const totalStudents = school.totalStudents ?? 0;
  const totalTeachers = school.totalTeachers ?? 0;
  const foundedYear = school.foundedYear || '—';

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* =========================================================
          SCHOOL HEADER
      ========================================================== */}
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/95 shadow-lg backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            to={`/school/${school.slug}`}
            className="flex min-w-0 items-center gap-3"
          >
            {school.logoUrl ? (
              <img
                src={school.logoUrl}
                alt={`${school.name} logo`}
                className="h-12 w-12 rounded-xl border-2 border-blue-100 object-cover shadow-md"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-2xl shadow-[0_4px_0_rgb(67,56,202)]">
                🏫
              </div>
            )}

            <div className="min-w-0">
              <h1 className="truncate text-base font-black text-gray-900 sm:text-lg">
                {school.name}
              </h1>

              {school.tagline && (
                <p className="truncate text-xs font-medium text-blue-600">
                  {school.tagline}
                </p>
              )}
            </div>
          </Link>

          <Link
            to="/schools"
            className="hidden items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-black text-white shadow-[0_4px_0_rgb(67,56,202)] transition hover:brightness-110 active:translate-y-1 active:shadow-none sm:inline-flex"
          >
            <GraduationCap className="h-4 w-4" />
            All Schools
          </Link>
        </div>

        {/* Mobile / Desktop menu */}
        <div className="border-t border-gray-100 bg-white">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2 sm:px-6">
            <a
              href="#home"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50"
            >
              Home
            </a>

            <a
              href="#about"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-700"
            >
              About
            </a>

            <a
              href="#principal"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-700"
            >
              Principal
            </a>

            <a
              href="#notices"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-700"
            >
              Notices
            </a>

            <a
              href="#events"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-700"
            >
              Events
            </a>

            <a
              href="#teachers"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-700"
            >
              Teachers
            </a>

            <a
              href="#results"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-700"
            >
              Results
            </a>

            <a
              href="#gallery"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-700"
            >
              Gallery
            </a>

            <a
              href="#contact"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-700"
            >
              Contact
            </a>
          </div>
        </div>
      </header>

      {/* =========================================================
          HERO
      ========================================================== */}
      <section
        id="home"
        className="relative flex min-h-[650px] items-center justify-center overflow-hidden"
      >
        <img
          src={heroImage}
          alt={school.name}
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/90 via-purple-900/70 to-black/75" />

        <div className="relative z-10 mx-auto w-full max-w-5xl px-5 py-20 text-center text-white">
          {school.logoUrl ? (
            <img
              src={school.logoUrl}
              alt={`${school.name} logo`}
              className="mx-auto mb-7 h-28 w-28 rounded-3xl border-4 border-white object-cover shadow-2xl sm:h-36 sm:w-36"
            />
          ) : (
            <div className="mx-auto mb-7 flex h-28 w-28 items-center justify-center rounded-3xl bg-white/15 text-7xl shadow-2xl backdrop-blur-md">
              🏫
            </div>
          )}

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2 text-sm font-bold shadow-xl backdrop-blur-md">
            <GraduationCap className="h-4 w-4" />
            Welcome to {school.name}
          </div>

          <h2 className="text-4xl font-black leading-tight drop-shadow-2xl sm:text-5xl lg:text-6xl">
            {school.tagline || `Welcome to ${school.name}`}
          </h2>

          {school.description && (
            <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-blue-50 sm:text-lg">
              {school.description.slice(0, 220)}
              {school.description.length > 220 ? '...' : ''}
            </p>
          )}

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="#about"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 font-black text-blue-700 shadow-[0_6px_0_rgb(156,163,175)] transition hover:bg-blue-50 active:translate-y-1 active:shadow-none"
            >
              Learn More
              <ArrowRight className="h-5 w-5" />
            </a>

            <a
              href="#contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-7 py-3.5 font-black text-white shadow-[0_6px_0_rgb(67,56,202)] transition hover:brightness-110 active:translate-y-1 active:shadow-none"
            >
              Contact School
            </a>
          </div>
        </div>
      </section>

      {/* =========================================================
          STATS
      ========================================================== */}
      <section className="relative -mt-8 z-20 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              {
                icon: Users,
                label: 'Students',
                value: totalStudents,
                box: 'bg-blue-50',
                iconColor: 'text-blue-600',
              },
              {
                icon: GraduationCap,
                label: 'Teachers',
                value: totalTeachers,
                box: 'bg-emerald-50',
                iconColor: 'text-emerald-600',
              },
              {
                icon: BookOpen,
                label: 'Learning',
                value: '12+',
                box: 'bg-amber-50',
                iconColor: 'text-amber-600',
              },
              {
                icon: Award,
                label: 'Founded',
                value: foundedYear,
                box: 'bg-rose-50',
                iconColor: 'text-rose-600',
              },
            ].map((stat, index) => {
              const Icon = stat.icon;

              return (
                <div
                  key={index}
                  className="rounded-2xl bg-white p-5 text-center shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div
                    className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${stat.box}`}
                  >
                    <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>

                  <p className="text-2xl font-black text-gray-900">
                    {stat.value}
                  </p>

                  <p className="text-sm font-medium text-gray-500">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          ABOUT
      ========================================================== */}
      <section id="about" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="text-sm font-black uppercase tracking-wider text-blue-600">
                About Our School
              </span>

              <h2 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">
                A Place Where Education Meets Excellence
              </h2>

              <div className="mt-4 h-1.5 w-24 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500" />

              <p className="mt-6 whitespace-pre-line text-base leading-8 text-gray-600">
                {school.description ||
                  `${school.name} is committed to providing quality education and creating a positive learning environment for students.`}
              </p>

              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {[
                  {
                    icon: Heart,
                    title: 'Caring Environment',
                    desc: 'Supportive school community',
                  },
                  {
                    icon: Lightbulb,
                    title: 'Innovative Learning',
                    desc: 'Modern teaching methods',
                  },
                  {
                    icon: ShieldCheck,
                    title: 'Safe Campus',
                    desc: 'Secure and welcoming',
                  },
                  {
                    icon: Trophy,
                    title: 'Student Excellence',
                    desc: 'Focus on achievement',
                  },
                ].map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={index}
                      className="flex gap-3 rounded-2xl bg-white p-4 shadow-md"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>

                      <div>
                        <h3 className="text-sm font-black text-gray-900">
                          {item.title}
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              {campusImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {campusImages.slice(0, 4).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${school.name} campus ${index + 1}`}
                      className={`w-full rounded-2xl object-cover shadow-xl ${
                        index % 2 === 0 ? 'mt-8 h-52' : 'h-60'
                      }`}
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden rounded-3xl shadow-2xl">
                  <img
                    src={heroImage}
                    alt={`${school.name} campus`}
                    className="h-[420px] w-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PRINCIPAL
      ========================================================== */}
      {(school.principalName || school.principalMessage) && (
        <section id="principal" className="bg-white py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-7 shadow-2xl sm:p-12">
              <div className="grid items-center gap-8 sm:grid-cols-3">
                <div>
                  {school.principalImageUrl ? (
                    <img
                      src={school.principalImageUrl}
                      alt={school.principalName || 'Principal'}
                      className="mx-auto h-48 w-48 rounded-3xl object-cover shadow-xl"
                    />
                  ) : (
                    <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 text-7xl shadow-xl">
                      👨‍🏫
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <span className="text-sm font-black uppercase tracking-wider text-blue-600">
                    Principal's Message
                  </span>

                  <h2 className="mt-2 text-2xl font-black text-gray-900 sm:text-3xl">
                    {school.principalName || 'School Principal'}
                  </h2>

                  {school.principalMessage && (
                    <p className="mt-5 text-base leading-8 text-gray-600 italic">
                      "{school.principalMessage}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================
          ANNOUNCEMENTS
      ========================================================== */}
      <section id="notices" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10">
            <span className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-blue-600">
              <Megaphone className="h-4 w-4" />
              Latest News
            </span>

            <h2 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">
              School Notices & Announcements
            </h2>
          </div>

          {contentLoading ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-lg">
              <p className="font-bold text-gray-500">
                Loading notices...
              </p>
            </div>
          ) : announcements.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="rounded-2xl bg-white p-6 shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div
                    className={`mb-4 inline-block rounded-full px-3 py-1 text-xs font-black ${
                      announcement.priority === 'high'
                        ? 'bg-red-50 text-red-600'
                        : announcement.priority === 'medium'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {announcement.priority} priority
                  </div>

                  <h3 className="text-lg font-black text-gray-900">
                    {announcement.title}
                  </h3>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-500">
                    {announcement.content}
                  </p>

                  <p className="mt-4 text-xs font-semibold text-gray-400">
                    {formatDate(announcement.date)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-10 text-center shadow-lg">
              <Megaphone className="mx-auto h-10 w-10 text-blue-400" />

              <p className="mt-3 font-bold text-gray-600">
                No announcements available.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================
          EVENTS
      ========================================================== */}
      <section id="events" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10">
            <span className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-purple-600">
              <CalendarDays className="h-4 w-4" />
              What's Happening
            </span>

            <h2 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">
              Upcoming School Events
            </h2>
          </div>

          {events.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-gray-100 transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
                >
                  {event.imageUrl && (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="h-44 w-full object-cover"
                    />
                  )}

                  <div className="p-6">
                    <h3 className="font-black text-gray-900">
                      {event.title}
                    </h3>

                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-500">
                      {event.description}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-gray-400">
                      <CalendarDays className="h-4 w-4" />
                      {formatDate(event.date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-gray-50 p-10 text-center">
              <CalendarDays className="mx-auto h-10 w-10 text-purple-400" />

              <p className="mt-3 font-bold text-gray-600">
                No upcoming events available.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================
          RESULT CHECK
      ========================================================== */}
      <section id="results" className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-3xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 shadow-2xl sm:p-10">
            <div className="text-center">
              <span className="text-sm font-black uppercase tracking-wider text-blue-600">
                Student Results
              </span>
              <h2 className="mt-2 text-3xl font-black text-gray-900">
                Check Result
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {school.name} का Roll Number डालकर result देखें।
              </p>
            </div>

            <form
              className="mt-6 flex flex-col gap-3 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                void searchPublicResults();
              }}
            >
              <input
                value={rollNumber}
                onChange={(event) => setRollNumber(event.target.value)}
                placeholder="Enter Roll Number"
                className="min-w-0 flex-1 rounded-xl border-2 border-blue-100 bg-white px-4 py-3 font-bold outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={resultSearchLoading || !rollNumber.trim()}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-black text-white shadow-[0_5px_0_rgb(67,56,202)] disabled:opacity-50"
              >
                {resultSearchLoading ? 'Searching...' : '🔎 Check Result'}
              </button>
            </form>

            {publicResults.length > 0 && (
              <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-lg">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 font-black">Student</th>
                      <th className="px-4 py-3 font-black">Class</th>
                      <th className="px-4 py-3 font-black">Exam</th>
                      <th className="px-4 py-3 font-black">Subject</th>
                      <th className="px-4 py-3 font-black">Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {publicResults.map((result) => (
                      <tr key={result.id} className="border-t">
                        <td className="px-4 py-3 font-bold">{result.studentName || '-'}</td>
                        <td className="px-4 py-3">{result.className || '-'}</td>
                        <td className="px-4 py-3">{result.exam || '-'}</td>
                        <td className="px-4 py-3">{result.subject || '-'}</td>
                        <td className="px-4 py-3 font-black">{result.marks ?? result.score ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!resultSearchLoading &&
              rollNumber.trim() &&
              publicResults.length === 0 && (
                <p className="mt-5 rounded-xl bg-white p-4 text-center font-bold text-gray-500">
                  इस Roll Number का result नहीं मिला।
                </p>
              )}
          </div>
        </div>
      </section>

      {/* =========================================================
          TEACHERS
      ========================================================== */}
      <section id="teachers" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10">
            <span className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-emerald-600">
              <Users className="h-4 w-4" />
              Our Team
            </span>

            <h2 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">
              Meet Our Teachers
            </h2>
          </div>

          {teachers.length > 0 ? (
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {teachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="overflow-hidden rounded-2xl bg-white text-center shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
                >
                  <img
                    src={
                      teacher.imageUrl ||
                      'https://images.pexels.com/photos/8423069/pexels-photo-8423069.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
                    }
                    alt={teacher.name}
                    className="h-48 w-full object-cover"
                  />

                  <div className="p-4">
                    <h3 className="text-sm font-black text-gray-900">
                      {teacher.name}
                    </h3>

                    <p className="mt-1 text-xs font-bold text-blue-600">
                      {teacher.designation}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {teacher.subject}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-10 text-center shadow-lg">
              <Users className="mx-auto h-10 w-10 text-emerald-400" />

              <p className="mt-3 font-bold text-gray-600">
                Teacher information will appear here.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================
          GALLERY
      ========================================================== */}
      <section id="gallery" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10">
            <span className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-pink-600">
              <Images className="h-4 w-4" />
              School Gallery
            </span>

            <h2 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">
              Campus & Activities
            </h2>
          </div>

          {campusImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {campusImages.slice(0, 8).map((image, index) => (
                <div
                  key={index}
                  className="group overflow-hidden rounded-2xl shadow-lg"
                >
                  <img
                    src={image}
                    alt={`${school.name} gallery ${index + 1}`}
                    className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl bg-gradient-to-br from-pink-50 to-purple-50 p-12 text-center">
              <Images className="mx-auto h-12 w-12 text-pink-400" />

              <p className="mt-4 font-bold text-gray-600">
                School gallery images will appear here.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================
          CONTACT
      ========================================================== */}
      <section id="contact" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <span className="text-sm font-black uppercase tracking-wider text-blue-600">
              Get In Touch
            </span>

            <h2 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">
              Contact {school.name}
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 text-center shadow-lg">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>

              <h3 className="mt-4 font-black text-gray-900">
                Address
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                {school.address || 'School address not added yet.'}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 text-center shadow-lg">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
                <Phone className="h-6 w-6 text-green-600" />
              </div>

              <h3 className="mt-4 font-black text-gray-900">
                Phone
              </h3>

              {school.phone ? (
                <a
                  href={`tel:${school.phone}`}
                  className="mt-2 block text-sm font-bold text-green-600"
                >
                  {school.phone}
                </a>
              ) : (
                <p className="mt-2 text-sm text-gray-500">
                  Phone not added yet.
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-white p-6 text-center shadow-lg">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50">
                <Mail className="h-6 w-6 text-purple-600" />
              </div>

              <h3 className="mt-4 font-black text-gray-900">
                Email
              </h3>

              {school.email ? (
                <a
                  href={`mailto:${school.email}`}
                  className="mt-2 block break-all text-sm font-bold text-purple-600"
                >
                  {school.email}
                </a>
              ) : (
                <p className="mt-2 text-sm text-gray-500">
                  Email not added yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CTA
      ========================================================== */}
      <section className="bg-gradient-to-br from-blue-700 via-purple-700 to-pink-600 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="text-5xl">🎓</div>

          <h2 className="mt-5 text-3xl font-black text-white sm:text-4xl">
            Welcome to {school.name}
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-blue-50">
            Explore our school, discover our programs, meet our teachers,
            and stay updated with the latest school activities.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="#contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 font-black text-blue-700 shadow-[0_6px_0_rgb(156,163,175)] transition hover:bg-blue-50 active:translate-y-1 active:shadow-none"
            >
              Contact School
              <ArrowRight className="h-5 w-5" />
            </a>

            <Link
              to="/schools"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-7 py-3.5 font-black text-white shadow-[0_6px_0_rgb(4,120,87)] transition hover:brightness-110 active:translate-y-1 active:shadow-none"
            >
              🔎 Other Schools
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================== */}
      <footer className="bg-gray-950 py-12 text-gray-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-3">
                {school.logoUrl ? (
                  <img
                    src={school.logoUrl}
                    alt={school.name}
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-2xl">
                    🏫
                  </div>
                )}

                <h3 className="text-lg font-black text-white">
                  {school.name}
                </h3>
              </div>

              <p className="mt-4 text-sm leading-6 text-gray-400">
                {school.tagline ||
                  'Quality education, strong values and a brighter future.'}
              </p>
            </div>

            <div>
              <h3 className="font-black text-white">
                Quick Links
              </h3>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <a href="#home" className="hover:text-white">
                  Home
                </a>

                <a href="#about" className="hover:text-white">
                  About
                </a>

                <a href="#notices" className="hover:text-white">
                  Notices
                </a>

                <a href="#events" className="hover:text-white">
                  Events
                </a>

                <a href="#teachers" className="hover:text-white">
                  Teachers
                </a>

                <a href="#gallery" className="hover:text-white">
                  Gallery
                </a>

                <a href="#contact" className="hover:text-white">
                  Contact
                </a>

                <Link to="/schools" className="hover:text-white">
                  All Schools
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-black text-white">
                School Contact
              </h3>

              <div className="mt-4 space-y-3 text-sm text-gray-400">
                {school.address && (
                  <p className="flex gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    {school.address}
                  </p>
                )}

                {school.phone && (
                  <p className="flex gap-2">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                    {school.phone}
                  </p>
                )}

                {school.email && (
                  <p className="flex gap-2 break-all">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                    {school.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} {school.name}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
