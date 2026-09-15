import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchSchoolBySlug } from '@/firebase/firestore';
import type { School } from '@/firebase/types';

export default function SchoolPublicPage() {
  const { slug } = useParams<{ slug: string }>();

  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadSchool() {
      if (!slug) {
        setError('School URL is missing.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const data = await fetchSchoolBySlug(slug);

        if (!mounted) return;

        if (!data) {
          setSchool(null);
          setError('School not found or school is not currently live.');
        } else {
          setSchool(data);
        }
      } catch (err) {
        console.error('Failed to load school:', err);

        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load school.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSchool();

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-4">
        <div className="rounded-3xl bg-white p-10 text-center shadow-2xl">
          <div className="text-5xl">🏫</div>

          <p className="mt-4 text-xl font-extrabold text-gray-800">
            Loading School...
          </p>
        </div>
      </div>
    );
  }

  if (error || !school) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-4">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-2xl">
          <div className="text-6xl">🏫</div>

          <h1 className="mt-4 text-2xl font-extrabold text-gray-900">
            School Not Available
          </h1>

          <p className="mt-3 text-gray-600">
            {error || 'This school could not be found.'}
          </p>

          <Link
            to="/schools"
            className="mt-6 inline-block rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-7 py-3 font-extrabold text-white shadow-[0_5px_0_rgb(67,56,202)] transition hover:brightness-110 active:translate-y-1 active:shadow-none"
          >
            🔎 View Schools
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">

      {/* Hero */}
      <section className="relative min-h-[55vh] overflow-hidden">

        {school.heroImageUrl ? (
          <img
            src={school.heroImageUrl}
            alt={school.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-purple-700 to-pink-600" />
        )}

        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 flex min-h-[55vh] flex-col items-center justify-center px-5 py-12 text-center text-white">

          {school.logoUrl && (
            <img
              src={school.logoUrl}
              alt={`${school.name} logo`}
              className="mb-5 h-28 w-28 rounded-2xl border-4 border-white object-cover shadow-2xl"
            />
          )}

          {!school.logoUrl && (
            <div className="mb-5 text-7xl">
              🏫
            </div>
          )}

          <h1 className="max-w-4xl text-3xl font-black drop-shadow-lg md:text-5xl lg:text-6xl">
            {school.name}
          </h1>

          {school.tagline && (
            <p className="mt-4 max-w-2xl text-lg font-bold text-white/95 md:text-2xl">
              {school.tagline}
            </p>
          )}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">

            <Link
              to="/schools"
              className="rounded-xl bg-white px-6 py-3 font-extrabold text-gray-900 shadow-[0_5px_0_rgb(156,163,175)] transition hover:bg-gray-100 active:translate-y-1 active:shadow-none"
            >
              🔎 All Schools
            </Link>

            <Link
              to="/"
              className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 font-extrabold text-white shadow-[0_5px_0_rgb(4,120,87)] transition hover:brightness-110 active:translate-y-1 active:shadow-none"
            >
              🏠 Home
            </Link>

          </div>
        </div>
      </section>

      {/* School Information */}
      <main className="mx-auto max-w-5xl px-4 py-8">

        <div className="rounded-3xl bg-white p-6 shadow-2xl md:p-10">

          <div className="mb-6 flex items-center gap-3">
            <div className="text-4xl">🏫</div>

            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 md:text-3xl">
                About Our School
              </h2>

              <div className="mt-1 h-1 w-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600" />
            </div>
          </div>

          {school.description && (
            <p className="whitespace-pre-line text-base leading-7 text-gray-700">
              {school.description}
            </p>
          )}

          {school.address && (
            <div className="mt-7 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 p-5">
              <h3 className="font-extrabold text-gray-900">
                📍 School Address
              </h3>

              <p className="mt-2 text-gray-700">
                {school.address}
              </p>
            </div>
          )}

          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div className="rounded-2xl bg-blue-50 p-5">
              <div className="text-3xl">🌐</div>

              <p className="mt-2 text-sm font-semibold text-gray-500">
                School URL
              </p>

              <p className="mt-1 break-all font-bold text-blue-700">
                /school/{school.slug}
              </p>
            </div>

            <div className="rounded-2xl bg-green-50 p-5">
              <div className="text-3xl">✅</div>

              <p className="mt-2 text-sm font-semibold text-gray-500">
                School Status
              </p>

              <p className="mt-1 font-bold text-green-700">
                LIVE
              </p>
            </div>

          </div>
        </div>

        {/* Coming Soon */}
        <div className="mt-6 rounded-3xl bg-white p-6 text-center shadow-2xl">

          <div className="text-4xl">📚</div>

          <h2 className="mt-3 text-xl font-extrabold text-gray-900">
            School Management Features
          </h2>

          <p className="mt-2 text-gray-600">
            Classes, teachers, students, homework, results,
            attendance, notices, events and gallery will be
            available through the school's management system.
          </p>

        </div>

      </main>
    </div>
  );
}
