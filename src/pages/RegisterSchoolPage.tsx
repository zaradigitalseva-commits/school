import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { registerSchool } from '@/firebase/firestore';

export default function RegisterSchoolPage() {
  const navigate = useNavigate();
  const { user, signInWithGoogle, signOut } = useAuth();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /*
   * Convert school name into a safe URL slug.
   *
   * IMPORTANT:
   * A full website URL is NOT accepted as a school slug.
   */
  const makeSlug = (value: string) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\.vercel\.app.*$/i, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (value: string) => {
    setName(value);

    /*
     * Only automatically create slug if the user
     * has not manually entered one.
     */
    if (!slug) {
      setSlug(makeSlug(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlug(makeSlug(value));
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!user) {
      setError('Please sign in with Google first.');
      return;
    }

    const cleanName = name.trim();
    const cleanSlug = makeSlug(slug);

    if (!cleanName) {
      setError('Please enter school name.');
      return;
    }

    if (!cleanSlug) {
      setError('Please enter a valid school URL/slug.');
      return;
    }

    /*
     * Only simple URL slugs are allowed.
     *
     * Example:
     * sunrise-public-school
     */
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)) {
      setError(
        'School URL can contain only lowercase letters, numbers and hyphens.'
      );
      return;
    }

    try {
      setLoading(true);

      const school = await registerSchool(user.uid, {
        name: cleanName,
        slug: cleanSlug,
        ownerEmail: user.email ?? '',
        tagline: tagline.trim(),
        description: description.trim(),
      });

      navigate(`/payment/recharge?schoolId=${school.id}`, {
        replace: true,
      });
    } catch (err) {
      console.error('School registration failed:', err);

      const message =
        err instanceof Error
          ? err.message
          : 'School registration failed. Please try again.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');

    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign-in failed:', err);

      const message =
        err instanceof Error
          ? err.message
          : 'Google sign-in failed. Please try again.';

      setError(message);
    }
  };

  const handleLogout = async () => {
    try {
      setError('');
      setLoading(true);

      await signOut();

      setName('');
      setSlug('');
      setTagline('');
      setDescription('');
    } catch (err) {
      console.error('Logout failed:', err);

      const message =
        err instanceof Error
          ? err.message
          : 'Logout failed. Please try again.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-4 py-8">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="mb-6 text-center text-white">
          <div className="mb-3 text-5xl">🏫</div>

          <h1 className="text-3xl font-extrabold md:text-4xl">
            Register Your School
          </h1>

          <p className="mt-2 text-sm text-white/90 md:text-base">
            Create your school website and management account
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-3xl bg-white p-5 shadow-2xl md:p-8">

          {/* NOT LOGGED IN */}
          {!user && (
            <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-6 text-center">

              <div className="text-5xl">🔐</div>

              <h2 className="mt-3 text-2xl font-black text-orange-900">
                Google Login Required
              </h2>

              <p className="mt-2 text-sm text-orange-700">
                Please sign in with your Google account before registering
                your school.
              </p>

              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                  ❌ {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-red-500 to-orange-500 px-5 py-4 font-extrabold text-white shadow-[0_6px_0_rgb(154,52,18)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 active:translate-y-1 active:shadow-none"
              >
                {loading
                  ? '⏳ Signing in...'
                  : '🔐 Continue with Google'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/schools')}
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-gray-100 px-5 py-3 font-bold text-gray-700 shadow-[0_4px_0_rgb(156,163,175)] transition hover:bg-gray-200 disabled:opacity-60 active:translate-y-1 active:shadow-none"
              >
                ← Back to Schools
              </button>
            </div>
          )}

          {/* LOGGED IN */}
          {user && (
            <>
              {/* Login Status */}
              <div className="mb-6 rounded-2xl border-2 border-green-200 bg-green-50 p-4">

                <div className="font-bold text-green-800">
                  ✅ Google Account Connected
                </div>

                <div className="mt-1 break-all text-sm text-green-700">
                  {user.email}
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loading}
                  className="mt-4 w-full rounded-xl bg-gradient-to-r from-gray-700 to-gray-900 px-5 py-3 font-extrabold text-white shadow-[0_5px_0_rgb(31,41,55)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 active:translate-y-1 active:shadow-none"
                >
                  {loading ? '⏳ Logging out...' : '🔓 Logout'}
                </button>
              </div>

              {/* Registration Information */}
              <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">

                <h2 className="font-bold text-blue-900">
                  📌 Registration Information
                </h2>

                <ul className="mt-2 space-y-1 text-sm text-blue-800">
                  <li>
                    • No school recognition document is required.
                  </li>

                  <li>
                    • Registration first creates a pending school.
                  </li>

                  <li>
                    • Payment/recharge comes after registration.
                  </li>

                  <li>
                    • School becomes LIVE only after payment approval.
                  </li>

                  <li>
                    • Management features unlock after approval.
                  </li>
                </ul>
              </div>

              {/* Registration Form */}
              <form
                onSubmit={handleRegister}
                className="space-y-5"
              >

                {/* School Name */}
                <div>
                  <label className="mb-2 block font-bold text-gray-800">
                    School Name *
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      handleNameChange(e.target.value)
                    }
                    placeholder="Example: Sunrise Public School"
                    disabled={loading}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                  />
                </div>

                {/* School URL */}
                <div>
                  <label className="mb-2 block font-bold text-gray-800">
                    School Website URL *
                  </label>

                  <input
                    type="text"
                    value={slug}
                    onChange={(e) =>
                      handleSlugChange(e.target.value)
                    }
                    placeholder="sunrise-public-school"
                    disabled={loading}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    required
                  />

                  <p className="mt-2 text-xs text-gray-500">
                    Your school page:
                  </p>

                  <p className="mt-1 break-all rounded-lg bg-gray-50 p-2 text-xs font-semibold text-blue-700">
                    /school/{slug || 'your-school'}
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    केवल school का नाम/slug डालें, जैसे:
                    <span className="font-bold text-gray-700">
                      sunrise-public-school
                    </span>
                  </p>
                </div>

                {/* Tagline */}
                <div>
                  <label className="mb-2 block font-bold text-gray-800">
                    School Tagline
                  </label>

                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) =>
                      setTagline(e.target.value)
                    }
                    placeholder="Education • Discipline • Excellence"
                    disabled={loading}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 outline-none transition focus:border-blue-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-2 block font-bold text-gray-800">
                    School Description
                  </label>

                  <textarea
                    value={description}
                    onChange={(e) =>
                      setDescription(e.target.value)
                    }
                    placeholder="Enter a short description about your school..."
                    rows={5}
                    disabled={loading}
                    className="w-full resize-none rounded-xl border-2 border-gray-200 px-4 py-3 outline-none transition focus:border-blue-500"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                    ❌ {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 px-5 py-4 text-lg font-extrabold text-white shadow-[0_6px_0_rgb(67,56,202)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-1 active:shadow-none"
                >
                  {loading
                    ? '⏳ Creating School...'
                    : '🏫 Register School & Continue to Payment'}
                </button>
              </form>

              {/* Back */}
              <button
                type="button"
                onClick={() => navigate('/schools')}
                disabled={loading}
                className="mt-5 w-full rounded-xl bg-gray-100 px-5 py-3 font-bold text-gray-700 shadow-[0_4px_0_rgb(156,163,175)] transition hover:bg-gray-200 disabled:opacity-60 active:translate-y-1 active:shadow-none"
              >
                ← Back to Schools
              </button>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-white/80">
          School registration • Google Login • Secure Firebase Database
        </p>
      </div>
    </div>
  );
}
