import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  GraduationCap,
  Search,
  MapPin,
  ArrowRight,
  School as SchoolIcon,
  UserPlus,
  LogIn,
  LogOut,
  ShieldCheck,
  RefreshCw,
  Building2,
  Info,
  Megaphone,
  Phone,
  FileText,
  X,
} from 'lucide-react';

import {
  subscribeToPublicSchools,
  subscribeToActivePlatformAds,
  isPlatformAdminEmail,
  type PlatformAd,
} from '@/firebase/firestore';
import type { School } from '@/firebase/types';

import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function HomePage() {
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();

  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [platformAds, setPlatformAds] = useState<PlatformAd[]>([]);

  /* =========================================================
     REALTIME LIVE SCHOOLS + PLATFORM ADS
  ========================================================= */

  useEffect(() => {
    setLoading(true);
    setError('');

    const unsubscribeSchools = subscribeToPublicSchools(
      (data) => {
        setSchools(data);
        setLoading(false);
      },
      (err) => {
        console.error('Live schools error:', err);
        setError('Schools load nahi ho pa rahe hain.');
        setLoading(false);
      }
    );

    const unsubscribeAds = subscribeToActivePlatformAds(
      (ads) => setPlatformAds(ads),
      (err) => console.error('Live platform ads error:', err)
    );

    return () => {
      unsubscribeSchools();
      unsubscribeAds();
    };
  }, []);

  const loadSchools = () => {
    setError('');
    setLoading(true);
    window.location.reload();
  };

  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredSchools = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return schools;
    }

    return schools.filter((school) => {
      const name = school.name?.toLowerCase() || '';
      const slug = school.slug?.toLowerCase() || '';
      const tagline = school.tagline?.toLowerCase() || '';
      const address = school.address?.toLowerCase() || '';
      const description = school.description?.toLowerCase() || '';
      const phone = school.phone?.toLowerCase() || '';
      const email = school.email?.toLowerCase() || '';

      return (
        name.includes(query) ||
        slug.includes(query) ||
        tagline.includes(query) ||
        address.includes(query) ||
        description.includes(query) ||
        phone.includes(query) ||
        email.includes(query)
      );
    });
  }, [schools, search]);

  /* =========================================================
     DASHBOARD ROUTE
  ========================================================= */

  const openDashboard = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Always send the platform owner's exact email to the Platform Admin dashboard.
    if (isPlatformAdminEmail(user.email)) {
      navigate('/admin');
      return;
    }

    if (role === 'platform_admin') {
      navigate('/admin');
      return;
    }

    // All school management roles go through the universal dashboard.
    // DashboardRedirect checks the active school memberships and, when the
    // same email has both roles, shows both Admin and Teacher options.
    if (role === 'school_admin' || role === 'teacher') {
      navigate('/dashboard');
      return;
    }

    // A normal user has no management dashboard.
    navigate('/');
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen
        label="Schools load ho rahe hain..."
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 animate-fade-in">
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-md">

        <div className="mx-auto max-w-7xl px-4 sm:px-6">

          <div className="flex min-h-[72px] items-center justify-between gap-4">

            {/* LOGO */}

            <Link
              to="/"
              className="flex min-w-0 items-center gap-3"
            >

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">

                <GraduationCap className="h-6 w-6 text-white" />

              </div>

              <div className="min-w-0">

                <h1 className="truncate text-lg font-extrabold text-gray-900 sm:text-xl">
                  SchoolConnect
                </h1>

                <p className="truncate text-[10px] text-gray-500 sm:text-xs">
                  Multi-School Platform
                </p>

              </div>

            </Link>

            {/* DESKTOP NAVIGATION */}

            <nav className="hidden items-center gap-5 lg:flex">

              <Link
                to="/"
                className="text-sm font-bold text-blue-600"
              >
                Home
              </Link>

              <Link
                to="/about"
                className="text-sm font-semibold text-gray-600 transition-colors hover:text-blue-600"
              >
                About
              </Link>

              <Link
                to="/schools"
                className="text-sm font-semibold text-gray-600 transition-colors hover:text-blue-600"
              >
                Schools
              </Link>

              <Link
                to="/notices"
                className="text-sm font-semibold text-gray-600 transition-colors hover:text-blue-600"
              >
                Notices
              </Link>

              <Link
                to="/contact"
                className="text-sm font-semibold text-gray-600 transition-colors hover:text-blue-600"
              >
                Contact
              </Link>

            </nav>

            {/* DESKTOP BUTTONS */}

            <div className="hidden items-center gap-2 md:flex">

              <Link
                to="/register-school"
                className="btn-3d inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 px-4 py-2.5 text-sm font-bold text-white"
              >
                <UserPlus className="h-4 w-4" />
                Register School
              </Link>

              {user ? (
                isPlatformAdminEmail(user.email) || role === 'platform_admin' ? (
                  <Link
                    to="/admin"
                    className="btn-3d inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 px-4 py-2.5 text-sm font-bold text-white"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Admin Panel
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={openDashboard}
                    className="btn-3d inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white"
                  >
                    <LogIn className="h-4 w-4" />
                    Dashboard
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="btn-3d inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 px-4 py-2.5 text-sm font-bold text-white"
                >
                  <LogIn className="h-4 w-4" />
                  Google Login
                </button>
              )}

              {user && (
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="btn-3d inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 px-4 py-2.5 text-sm font-bold text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              )}

            </div>

            {/* MOBILE BUTTONS */}

            <div className="flex items-center gap-2 md:hidden">

              <Link
                to="/register-school"
                title="Register School"
                className="btn-3d flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white"
              >
                <UserPlus className="h-5 w-5" />
              </Link>

              {user ? (
                isPlatformAdminEmail(user.email) || role === 'platform_admin' ? (
                  <Link
                    to="/admin"
                    title="Admin Panel"
                    className="btn-3d flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white"
                  >
                    <ShieldCheck className="h-5 w-5" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={openDashboard}
                    title="Dashboard"
                    className="btn-3d flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                  >
                    <LogIn className="h-5 w-5" />
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  title="Google Login"
                  className="btn-3d flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white"
                >
                  <LogIn className="h-5 w-5" />
                </button>
              )}

              {user && (
                <button
                  type="button"
                  onClick={() => void signOut()}
                  title="Logout"
                  aria-label="Logout"
                  className="btn-3d flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              )}

            </div>

          </div>

        </div>

      </header>

      {/* PLATFORM ADVERTISEMENTS */}
      {platformAds.some((ad) => ad.type === 'scrolling') && (
        <div className="overflow-hidden border-b border-orange-200 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white shadow-md">
          <div className="mx-auto flex max-w-7xl items-center">
            <div className="z-10 shrink-0 bg-black/20 px-4 py-3 text-sm font-black">
              📢 ADVERTISEMENT
            </div>
            <div className="relative min-w-0 flex-1 overflow-hidden py-3">
              <div className="flex min-w-max animate-[marquee_24s_linear_infinite] gap-12 whitespace-nowrap font-black">
                {platformAds
                  .filter((ad) => ad.type === 'scrolling')
                  .map((ad) => (
                    <span key={ad.id}>{ad.text}</span>
                  ))}
                {platformAds
                  .filter((ad) => ad.type === 'scrolling')
                  .map((ad) => (
                    <span key={ad.id + '-repeat'}>{ad.text}</span>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {platformAds.some((ad) => ad.type === 'slider') && (
        <section className="bg-slate-100 px-4 py-4">
          <div className="mx-auto max-w-7xl space-y-3">
            {platformAds
              .filter((ad) => ad.type === 'slider')
              .slice(0, 5)
              .map((ad) => {
                const image = (
                  <img
                    src={ad.imageUrl}
                    alt="Platform advertisement"
                    className="h-40 w-full rounded-2xl object-cover shadow-xl sm:h-56"
                  />
                );

                return ad.linkUrl ? (
                  <a
                    key={ad.id}
                    href={ad.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {image}
                  </a>
                ) : (
                  <div key={ad.id}>{image}</div>
                );
              })}
          </div>
        </section>
      )}

      {/* =====================================================
          MOBILE NAVIGATION
      ====================================================== */}

      <div className="border-b border-gray-100 bg-white lg:hidden">

        <div className="mx-auto max-w-7xl overflow-x-auto px-3 py-2">

          <div className="flex min-w-max items-center justify-center gap-2">

            <Link
              to="/"
              className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
            >
              Home
            </Link>

            <Link
              to="/about"
              className="rounded-lg px-3 py-2 text-xs font-semibold text-gray-600"
            >
              About
            </Link>

            <Link
              to="/schools"
              className="rounded-lg px-3 py-2 text-xs font-semibold text-gray-600"
            >
              Schools
            </Link>

            <Link
              to="/notices"
              className="rounded-lg px-3 py-2 text-xs font-semibold text-gray-600"
            >
              Notices
            </Link>

            <Link
              to="/contact"
              className="rounded-lg px-3 py-2 text-xs font-semibold text-gray-600"
            >
              Contact
            </Link>

          </div>

        </div>

      </div>

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden">

        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800" />

        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

        <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">

          <div className="mx-auto max-w-4xl text-center">

            {/* BADGE */}

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-white backdrop-blur-md">

              <GraduationCap className="h-4 w-4" />

              <span className="text-sm font-semibold">
                One Platform • Many Schools
              </span>

            </div>

            {/* TITLE */}

            <h2 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">

              Find Your

              <span className="block text-yellow-300">
                School
              </span>

            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-blue-100 sm:text-lg">
              Discover schools, visit their official pages,
              and access school information from one simple platform.
            </p>

            {/* =================================================
                SEARCH BOX
            ================================================== */}

            <div className="mx-auto mt-8 max-w-2xl">

              <div className="relative">

                <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    title="Clear Search"
                    className="absolute right-4 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="School name search karein..."
                  autoComplete="off"
                  className="h-14 w-full rounded-2xl bg-white pl-14 pr-14 text-sm font-semibold text-gray-900 shadow-2xl outline-none placeholder:text-gray-400 focus:ring-4 focus:ring-white/30 sm:h-16 sm:text-base"
                />

              </div>

              {/* SEARCH RESULT COUNT */}

              <div className="mt-3 text-sm font-semibold text-white/90">

                {search.trim() ? (
                  <>
                    <span className="text-yellow-300">
                      {filteredSchools.length}
                    </span>{' '}
                    school found for{' '}
                    <span className="font-black text-white">
                      "{search}"
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-yellow-300">
                      {schools.length}
                    </span>{' '}
                    LIVE school available
                  </>
                )}

              </div>

            </div>

            {/* HERO BUTTONS */}

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">

              <Link
                to="/register-school"
                className="btn-3d inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 px-6 py-3.5 font-extrabold text-gray-900"
              >
                <Building2 className="h-5 w-5" />
                Register Your School
              </Link>

              {!user && (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="btn-3d inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-extrabold text-blue-700"
                >
                  <LogIn className="h-5 w-5" />
                  Login with Google
                </button>
              )}

              {user && (
                <button
                  type="button"
                  onClick={openDashboard}
                  className="btn-3d inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-extrabold text-blue-700"
                >
                  <LogIn className="h-5 w-5" />
                  Open Dashboard
                </button>
              )}

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          LIVE SCHOOL LIST
      ====================================================== */}

      <section className="py-14 sm:py-16">

        <div className="mx-auto max-w-7xl px-4 sm:px-6">

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <div className="inline-flex items-center gap-2 text-sm font-bold text-blue-600">

                <SchoolIcon className="h-4 w-4" />

                LIVE SCHOOLS

              </div>

              <h2 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">
                Schools on Our Platform
              </h2>

              <p className="mt-2 text-gray-500">

                {search.trim() ? (
                  <>
                    Showing{' '}
                    <strong className="text-blue-600">
                      {filteredSchools.length}
                    </strong>{' '}
                    result
                    {filteredSchools.length !== 1 ? 's' : ''}
                  </>
                ) : (
                  <>
                    {schools.length} school
                    {schools.length !== 1 ? 's' : ''} available
                  </>
                )}

              </p>

            </div>

            <button
              type="button"
              onClick={loadSchools}
              className="btn-3d inline-flex self-start items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-bold text-gray-700 sm:self-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

          </div>

          {/* ERROR */}

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">

              <p className="font-semibold">
                {error}
              </p>

              <button
                type="button"
                onClick={loadSchools}
                className="btn-3d mt-3 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white"
              >
                Try Again
              </button>

            </div>
          )}

          {/* NO RESULT */}

          {!error && filteredSchools.length === 0 && (

            <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm sm:p-16">

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50">

                {search.trim() ? (
                  <Search className="h-10 w-10 text-blue-600" />
                ) : (
                  <SchoolIcon className="h-10 w-10 text-blue-600" />
                )}

              </div>

              {schools.length === 0 ? (
                <>
                  <h3 className="mt-6 text-2xl font-bold text-gray-900">
                    Abhi koi LIVE school nahi hai
                  </h3>

                  <p className="mx-auto mt-3 max-w-lg text-gray-500">
                    Sabse pehle apna school register karein.
                    Payment approval ke baad school yahan LIVE dikhega.
                  </p>

                  <Link
                    to="/register-school"
                    className="btn-3d mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-3 font-bold text-white"
                  >
                    <UserPlus className="h-5 w-5" />
                    Register Your School
                  </Link>
                </>
              ) : (
                <>
                  <h3 className="mt-6 text-2xl font-bold text-gray-900">
                    School nahi mila
                  </h3>

                  <p className="mt-3 text-gray-500">
                    "{search}" naam se koi LIVE school nahi mila.
                  </p>

                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="btn-3d mt-6 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-3 font-bold text-white"
                  >
                    Clear Search
                  </button>
                </>
              )}

            </div>

          )}

          {/* SCHOOL CARDS */}

          {filteredSchools.length > 0 && (

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

              {filteredSchools.map((school) => (
                <SchoolCard
                  key={school.id}
                  school={school}
                />
              ))}

            </div>

          )}

        </div>

      </section>

      {/* =====================================================
          ABOUT PLATFORM
      ====================================================== */}

      <section className="border-y border-gray-100 bg-white py-16">

        <div className="mx-auto max-w-7xl px-4 sm:px-6">

          <div className="grid items-center gap-10 lg:grid-cols-2">

            <div>

              <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-blue-600">

                <Info className="h-4 w-4" />

                About Platform

              </span>

              <h2 className="mt-3 text-3xl font-black text-gray-900 sm:text-4xl">
                One Platform for Multiple Schools
              </h2>

              <p className="mt-5 leading-relaxed text-gray-600">
                SchoolConnect ek multi-school platform hai jahan
                alag-alag schools apni online website aur school
                information manage kar sakte hain.
              </p>

              <p className="mt-4 leading-relaxed text-gray-600">
                Visitors school search karke uska official public
                page dekh sakte hain.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">

                <Link
                  to="/about"
                  className="btn-3d inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 px-5 py-3 font-bold text-white"
                >
                  About Us
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  to="/schools"
                  className="btn-3d inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 px-5 py-3 font-bold text-white"
                >
                  <SchoolIcon className="h-4 w-4" />
                  Browse Schools
                </Link>

              </div>

            </div>

            <div className="grid grid-cols-2 gap-4">

              <FeatureBox
                icon={SchoolIcon}
                title="Multiple Schools"
                text="Many schools on one platform"
              />

              <FeatureBox
                icon={ShieldCheck}
                title="School Management"
                text="Separate school admin access"
              />

              <FeatureBox
                icon={Megaphone}
                title="Notices"
                text="School and platform updates"
              />

              <FeatureBox
                icon={Phone}
                title="Contact"
                text="Easy communication"
              />

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          HOW IT WORKS
      ====================================================== */}

      <section className="bg-gray-50 py-16">

        <div className="mx-auto max-w-7xl px-4 sm:px-6">

          <div className="mx-auto mb-10 max-w-2xl text-center">

            <span className="text-sm font-bold uppercase tracking-wider text-blue-600">
              Simple Process
            </span>

            <h2 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">
              How It Works
            </h2>

            <p className="mt-3 text-gray-500">
              School owners aur visitors dono ke liye simple system.
            </p>

          </div>

          <div className="grid gap-6 md:grid-cols-3">

            <ProcessCard
              number="01"
              icon={Search}
              title="Find a School"
              description="School ka naam ya address search karke school find karein."
            />

            <ProcessCard
              number="02"
              icon={SchoolIcon}
              title="Visit School"
              description="School card par click karke uska official public website page dekhein."
            />

            <ProcessCard
              number="03"
              icon={ShieldCheck}
              title="School Management"
              description="Registered school owner login karke apne school ko manage kar sakta hai."
            />

          </div>

        </div>

      </section>

      {/* =====================================================
          REGISTER CTA
      ====================================================== */}

      <section className="bg-gradient-to-br from-indigo-700 via-blue-700 to-cyan-700 py-16 sm:py-20">

        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10">

            <GraduationCap className="h-8 w-8 text-white" />

          </div>

          <h2 className="mt-6 text-3xl font-black text-white sm:text-4xl">
            Apna School Is Platform Par Add Karein
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-blue-100">
            School register karein, payment complete karein aur
            approval ke baad apne school ka dedicated online page
            manage karein.
          </p>

          <Link
            to="/register-school"
            className="btn-3d mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-extrabold text-blue-700"
          >
            <UserPlus className="h-5 w-5" />
            Register Your School
            <ArrowRight className="h-5 w-5" />
          </Link>

        </div>

      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="bg-gray-950 text-gray-400">

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">

            {/* BRAND */}

            <div>

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600">

                  <GraduationCap className="h-5 w-5 text-white" />

                </div>

                <div>

                  <p className="font-bold text-white">
                    SchoolConnect
                  </p>

                  <p className="text-xs">
                    Multi-School Platform
                  </p>

                </div>

              </div>

              <p className="mt-4 text-sm leading-relaxed">
                A simple platform to discover and manage school websites.
              </p>

            </div>

            {/* QUICK LINKS */}

            <div>

              <h3 className="mb-4 font-bold text-white">
                Quick Links
              </h3>

              <div className="flex flex-col gap-3 text-sm">

                <Link
                  to="/"
                  className="transition-colors hover:text-white"
                >
                  Home
                </Link>

                <Link
                  to="/about"
                  className="transition-colors hover:text-white"
                >
                  About
                </Link>

                <Link
                  to="/schools"
                  className="transition-colors hover:text-white"
                >
                  Schools
                </Link>

                <Link
                  to="/notices"
                  className="transition-colors hover:text-white"
                >
                  Notices
                </Link>

              </div>

            </div>

            {/* SUPPORT */}

            <div>

              <h3 className="mb-4 font-bold text-white">
                Support
              </h3>

              <div className="flex flex-col gap-3 text-sm">

                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 transition-colors hover:text-white"
                >
                  <Phone className="h-4 w-4" />
                  Contact
                </Link>

                <Link
                  to="/privacy-policy"
                  className="inline-flex items-center gap-2 transition-colors hover:text-white"
                >
                  <FileText className="h-4 w-4" />
                  Privacy Policy
                </Link>

                <Link
                  to="/terms-conditions"
                  className="inline-flex items-center gap-2 transition-colors hover:text-white"
                >
                  <FileText className="h-4 w-4" />
                  Terms & Conditions
                </Link>

                <Link
                  to="/refund-cancellation"
                  className="inline-flex items-center gap-2 transition-colors hover:text-white"
                >
                  <FileText className="h-4 w-4" />
                  Refund & Cancellation
                </Link>

              </div>

            </div>

            {/* FOR SCHOOLS */}

            <div>

              <h3 className="mb-4 font-bold text-white">
                For Schools
              </h3>

              <p className="mb-4 text-sm leading-relaxed">
                Apne school ko platform par register karke
                dedicated school website manage karein.
              </p>

              <Link
                to="/register-school"
                className="btn-3d inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 px-4 py-2.5 text-sm font-bold text-white"
              >
                <UserPlus className="h-4 w-4" />
                Register School
              </Link>

            </div>

          </div>

          {/* COPYRIGHT */}

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-800 pt-6 text-xs sm:flex-row">

            <p>
              © {new Date().getFullYear()} SchoolConnect. All rights reserved.
            </p>

            <div className="flex items-center gap-4">

              <Link
                to="/privacy-policy"
                className="hover:text-white"
              >
                Privacy
              </Link>

              <Link
                to="/terms-conditions"
                className="hover:text-white"
              >
                Terms
              </Link>

              <Link
                to="/refund-cancellation"
                className="hover:text-white"
              >
                Refund
              </Link>

            </div>

          </div>

        </div>

      </footer>

    </div>
  );
}

/* =========================================================
   SCHOOL CARD
========================================================= */

function SchoolCard({
  school,
}: {
  school: School;
}) {
  /*
   * Hero image ko priority di gayi hai.
   * Agar hero image nahi hai to logo use hoga.
   * Dono nahi hain to fallback image.
   */

  const image =
    school.heroImageUrl ||
    school.logoUrl ||
    'https://images.pexels.com/photos/207692/pexels-photo-207692.jpeg?auto=compress&cs=tinysrgb&w=1200';

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={`Visit ${school.name}`}
      onClick={() => window.location.assign(`/school/${school.slug}`)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          window.location.assign(`/school/${school.slug}`);
        }
      }}
      className="group cursor-pointer overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm outline-none transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl focus:ring-4 focus:ring-blue-500/30"
    >

      {/* IMAGE */}

      <div className="relative h-52 overflow-hidden bg-gray-100">

        <img
          src={image}
          alt={school.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* LIVE */}

        <div className="absolute left-4 top-4">

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-extrabold text-white shadow-lg">

            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />

            LIVE

          </span>

        </div>

        {/* LOGO */}

        {school.logoUrl && (
          <div className="absolute bottom-4 left-4 h-16 w-16 rounded-2xl bg-white p-1.5 shadow-xl">

            <img
              src={school.logoUrl}
              alt={`${school.name} logo`}
              className="h-full w-full rounded-xl object-cover"
            />

          </div>
        )}

      </div>

      {/* CONTENT */}

      <div className="p-5">

        <h3 className="line-clamp-2 text-xl font-extrabold text-gray-900">
          {school.name}
        </h3>

        {school.tagline && (
          <p className="mt-1 line-clamp-2 text-sm font-semibold text-blue-600">
            {school.tagline}
          </p>
        )}

        {school.address && (
          <div className="mt-4 flex items-start gap-2 text-sm text-gray-500">

            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />

            <span className="line-clamp-2">
              {school.address}
            </span>

          </div>
        )}

        {school.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-500">
            {school.description}
          </p>
        )}

        {/* WHOLE CARD IS CLICKABLE */}

        <div className="mt-5 flex items-center justify-between rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 px-5 py-3 font-extrabold text-white shadow-[0_5px_0_rgb(49,46,129)]">
          <span>Open School Website</span>
          <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
        </div>

      </div>

    </article>
  );
}

/* =========================================================
   PROCESS CARD
========================================================= */

function ProcessCard({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: string;
  icon: typeof Search;
  title: string;
  description: string;
}) {
  return (
    <div className="relative rounded-3xl border border-gray-200 bg-white p-7 shadow-sm transition-shadow hover:shadow-xl">

      <div className="flex items-center justify-between">

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">

          <Icon className="h-7 w-7 text-white" />

        </div>

        <span className="text-4xl font-black text-gray-100">
          {number}
        </span>

      </div>

      <h3 className="mt-6 text-xl font-extrabold text-gray-900">
        {title}
      </h3>

      <p className="mt-2 leading-relaxed text-gray-500">
        {description}
      </p>

    </div>
  );
}

/* =========================================================
   FEATURE BOX
========================================================= */

function FeatureBox({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof SchoolIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 shadow-sm transition-shadow hover:shadow-lg">

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">

        <Icon className="h-5 w-5 text-blue-600" />

      </div>

      <h3 className="mt-4 font-bold text-gray-900">
        {title}
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        {text}
      </p>

    </div>
  );
}
