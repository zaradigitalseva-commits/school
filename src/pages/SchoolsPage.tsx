import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { subscribeToPublicSchools } from '@/firebase/firestore';
import type { School } from '@/firebase/types';

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    const unsubscribe = subscribeToPublicSchools(
      (data) => {
        setSchools(data);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to subscribe to schools:', err);
        setError(err.message || 'Unable to load schools.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const filteredSchools = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return schools;
    }

    return schools.filter((school) => {
      return (
        school.name.toLowerCase().includes(term) ||
        school.slug.toLowerCase().includes(term) ||
        (school.tagline ?? '').toLowerCase().includes(term) ||
        (school.address ?? '').toLowerCase().includes(term)
      );
    });
  }, [schools, search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-4 py-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 text-center text-white">
          <div className="mb-3 text-5xl">🏫</div>

          <h1 className="text-3xl font-extrabold md:text-5xl">
            School Directory
          </h1>

          <p className="mt-2 text-sm text-white/90 md:text-base">
            Find and visit live school websites
          </p>
        </div>

        {/* Search */}
        <div className="mb-8 rounded-3xl bg-white p-4 shadow-2xl md:p-6">
          <label className="mb-2 block font-bold text-gray-800">
            🔎 Search School
          </label>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by school name, city, address or URL..."
            className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 outline-none transition focus:border-blue-500"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-3xl bg-white p-10 text-center shadow-2xl">
            <div className="text-4xl">⏳</div>

            <p className="mt-3 font-bold text-gray-700">
              Loading schools...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-3xl border-2 border-red-200 bg-red-50 p-6 text-center shadow-xl">
            <div className="text-4xl">❌</div>

            <p className="mt-3 font-bold text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-red-600 px-6 py-3 font-bold text-white shadow-[0_5px_0_rgb(153,27,27)] transition hover:brightness-110 active:translate-y-1 active:shadow-none"
            >
              🔄 Try Again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filteredSchools.length === 0 && (
          <div className="rounded-3xl bg-white p-10 text-center shadow-2xl">
            <div className="text-5xl">🏫</div>

            <h2 className="mt-4 text-2xl font-extrabold text-gray-800">
              {schools.length === 0
                ? 'No Live Schools Yet'
                : 'No School Found'}
            </h2>

            <p className="mt-2 text-gray-600">
              {schools.length === 0
                ? 'Live schools will appear here after Platform Admin approval.'
                : 'Try another school name or search term.'}
            </p>
          </div>
        )}

        {/* School Cards */}
        {!loading && !error && filteredSchools.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredSchools.map((school) => (
              <div
                key={school.id}
                className="overflow-hidden rounded-3xl bg-white shadow-2xl transition hover:-translate-y-1"
              >

                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
                  {school.heroImageUrl ? (
                    <img
                      src={school.heroImageUrl}
                      alt={school.name}
                      className="h-full w-full object-cover"
                    />
                  ) : school.logoUrl ? (
                    <div className="flex h-full items-center justify-center bg-gray-100 p-6">
                      <img
                        src={school.logoUrl}
                        alt={school.name}
                        className="h-32 w-32 rounded-2xl object-cover shadow-lg"
                      />
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-7xl">
                      🏫
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-5">
                  <h2 className="line-clamp-2 text-xl font-extrabold text-gray-900">
                    {school.name}
                  </h2>

                  {school.tagline && (
                    <p className="mt-2 line-clamp-2 text-sm font-semibold text-purple-600">
                      {school.tagline}
                    </p>
                  )}

                  {school.address && (
                    <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                      📍 {school.address}
                    </p>
                  )}

                  <Link
                    to={`/school/${school.slug}`}
                    className="mt-5 block w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-center font-extrabold text-white shadow-[0_5px_0_rgb(67,56,202)] transition hover:brightness-110 active:translate-y-1 active:shadow-none"
                  >
                    🌐 Visit School
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Buttons */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">

          <Link
            to="/register-school"
            className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 text-center font-extrabold text-white shadow-[0_5px_0_rgb(4,120,87)] transition hover:brightness-110 active:translate-y-1 active:shadow-none"
          >
            🏫 Register Your School
          </Link>

          <Link
            to="/"
            className="rounded-xl bg-white px-6 py-3 text-center font-extrabold text-gray-800 shadow-[0_5px_0_rgb(156,163,175)] transition hover:bg-gray-100 active:translate-y-1 active:shadow-none"
          >
            🏠 Home
          </Link>

        </div>
      </div>
    </div>
  );
}
