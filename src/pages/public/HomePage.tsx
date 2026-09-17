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
  ShieldCheck,
  RefreshCw,
  Building2,
  Info,
  Megaphone,
  Phone,
  FileText,
  X,
} from 'lucide-react';

import { fetchPublicSchools } from '@/firebase/firestore';
import type { School } from '@/firebase/types';

import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const loadSchools = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await fetchPublicSchools();
      setSchools(data);
    } catch (err) {
      console.error('Failed to load schools:', err);
      setError('Schools load nahi ho pa rahe hain.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchools();
  }, []);

  const filteredSchools = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return schools;
    }

    return schools.filter((school) => {
      return (
        school.name?.toLowerCase().includes(query) ||
        school.tagline?.toLowerCase().includes(query) ||
        school.address?.toLowerCase().includes(query) ||
        school.description?.toLowerCase().includes(query)
      );
    });
  }, [schools, search]);

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

      {/* =====================================================
          HEADER
      ====================================================== */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="min-h-[72px] flex items-center justify-between gap-4">

            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-3 min-w-0"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shrink-0">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>

              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 truncate">
                  SchoolConnect
                </h1>

                <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                  Multi-School Platform
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-5">
              <Link
                to="/"
                className="text-sm font-bold text-blue-600"
              >
                Home
              </Link>

              <Link
                to="/about"
                className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors"
              >
                About
              </Link>

              <Link
                to="/schools"
                className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors"
              >
                Schools
              </Link>

              <Link
                to="/notices"
                className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors"
              >
                Notices
              </Link>

              <Link
                to="/contact"
                className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors"
              >
                Contact
              </Link>
            </nav>

            {/* Desktop Buttons */}
            <div className="hidden md:flex items-center gap-2">

              <Link
                to="/register-school"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white font-bold text-sm btn-3d inline-flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Register School
              </Link>

              {user ? (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm btn-3d inline-flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Dashboard
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white font-bold text-sm btn-3d inline-flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Google Login
                </button>
              )}
            </div>

            {/* Mobile Buttons */}
            <div className="flex md:hidden items-center gap-2">

              <Link
                to="/register-school"
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white btn-3d flex items-center justify-center"
                title="Register School"
              >
                <UserPlus className="w-5 h-5" />
              </Link>

              {user ? (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white btn-3d flex items-center justify-center"
                  title="Dashboard"
                >
                  <LogIn className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white btn-3d flex items-center justify-center"
                  title="Google Login"
                >
                  <LogIn className="w-5 h-5" />
                </button>
              )}

            </div>
          </div>
        </div>
      </header>

      {/* =====================================================
          MOBILE NAVIGATION
      ====================================================== */}
      <div className="lg:hidden bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-3 py-2 overflow-x-auto">
          <div className="flex items-center justify-center gap-2 min-w-max">

            <Link
              to="/"
              className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold"
            >
              Home
            </Link>

            <Link
              to="/about"
              className="px-3 py-2 rounded-lg text-gray-600 text-xs font-semibold"
            >
              About
            </Link>

            <Link
              to="/schools"
              className="px-3 py-2 rounded-lg text-gray-600 text-xs font-semibold"
            >
              Schools
            </Link>

            <Link
              to="/notices"
              className="px-3 py-2 rounded-lg text-gray-600 text-xs font-semibold"
            >
              Notices
            </Link>

            <Link
              to="/contact"
              className="px-3 py-2 rounded-lg text-gray-600 text-xs font-semibold"
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

        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />

        <div className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full bg-purple-400/20 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24">

          <div className="max-w-4xl mx-auto text-center">

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white mb-6">
              <GraduationCap className="w-4 h-4" />

              <span className="text-sm font-semibold">
                One Platform • Many Schools
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
              Find Your
              <span className="block text-yellow-300">
                School
              </span>
            </h2>

            <p className="mt-5 text-base sm:text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Discover schools, visit their official pages,
              and access school information from one simple platform.
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto mt-8">
              <div className="relative">

                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search school name, city, address..."
                  className="w-full h-14 sm:h-16 pl-14 pr-14 rounded-2xl bg-white text-gray-900 placeholder:text-gray-400 shadow-2xl outline-none focus:ring-4 focus:ring-white/30 text-sm sm:text-base"
                />

              </div>
            </div>

            {/* Hero Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">

              <Link
                to="/register-school"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900 font-extrabold btn-3d inline-flex items-center justify-center gap-2"
              >
                <Building2 className="w-5 h-5" />
                Register Your School
              </Link>

              {!user && (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="px-6 py-3.5 rounded-xl bg-white text-blue-700 font-extrabold btn-3d inline-flex items-center justify-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  Login with Google
                </button>
              )}

              {user && (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3.5 rounded-xl bg-white text-blue-700 font-extrabold btn-3d inline-flex items-center justify-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">

            <div>
              <div className="inline-flex items-center gap-2 text-blue-600 font-bold text-sm">
                <SchoolIcon className="w-4 h-4" />
                LIVE SCHOOLS
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-2">
                Schools on Our Platform
              </h2>

              <p className="text-gray-500 mt-2">
                {filteredSchools.length} school
                {filteredSchools.length !== 1 ? 's' : ''} available
              </p>
            </div>

            <button
              type="button"
              onClick={loadSchools}
              className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold btn-3d inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>

          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">

              <p className="font-semibold">
                {error}
              </p>

              <button
                type="button"
                onClick={loadSchools}
                className="mt-3 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold btn-3d"
              >
                Try Again
              </button>

            </div>
          )}

          {/* No Schools */}
          {!error && filteredSchools.length === 0 && (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-10 sm:p-16 text-center">

              <div className="w-20 h-20 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center">
                {search ? (
                  <Search className="w-10 h-10 text-blue-600" />
                ) : (
                  <SchoolIcon className="w-10 h-10 text-blue-600" />
                )}
              </div>

              {schools.length === 0 ? (
                <>
                  <h3 className="text-2xl font-bold text-gray-900 mt-6">
                    Abhi koi LIVE school nahi hai
                  </h3>

                  <p className="text-gray-500 max-w-lg mx-auto mt-3">
                    Sabse pehle apna school register karein.
                    Payment approval ke baad school yahan LIVE dikhega.
                  </p>

                  <Link
                    to="/register-school"
                    className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold btn-3d inline-flex items-center gap-2"
                  >
                    <UserPlus className="w-5 h-5" />
                    Register Your School
                  </Link>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-gray-900 mt-6">
                    School nahi mila
                  </h3>

                  <p className="text-gray-500 mt-3">
                    Search ka naam ya address check karke dobara try karein.
                  </p>

                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold btn-3d"
                  >
                    Clear Search
                  </button>
                </>
              )}

            </div>
          )}

          {/* School Cards */}
          {filteredSchools.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

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
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          <div className="grid lg:grid-cols-2 gap-10 items-center">

            <div>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 uppercase tracking-wider">
                <Info className="w-4 h-4" />
                About Platform
              </span>

              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-3">
                One Platform for Multiple Schools
              </h2>

              <p className="text-gray-600 leading-relaxed mt-5">
                SchoolConnect ek multi-school platform hai jahan
                alag-alag schools apni online website aur school
                information manage kar sakte hain.
              </p>

              <p className="text-gray-600 leading-relaxed mt-4">
                Visitors school search karke uska official public
                page dekh sakte hain.
              </p>

              <div className="flex flex-wrap gap-3 mt-7">

                <Link
                  to="/about"
                  className="px-5 py-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold btn-3d inline-flex items-center gap-2"
                >
                  About Us
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/schools"
                  className="px-5 py-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white font-bold btn-3d inline-flex items-center gap-2"
                >
                  <SchoolIcon className="w-4 h-4" />
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
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          <div className="text-center max-w-2xl mx-auto mb-10">

            <span className="text-sm font-bold text-blue-600 uppercase tracking-wider">
              Simple Process
            </span>

            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-2">
              How It Works
            </h2>

            <p className="text-gray-500 mt-3">
              School owners aur visitors dono ke liye simple system.
            </p>

          </div>

          <div className="grid md:grid-cols-3 gap-6">

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
      <section className="py-16 sm:py-20 bg-gradient-to-br from-indigo-700 via-blue-700 to-cyan-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">

          <div className="w-16 h-16 mx-auto rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white mt-6">
            Apna School Is Platform Par Add Karein
          </h2>

          <p className="text-blue-100 mt-4 max-w-2xl mx-auto">
            School register karein, payment complete karein aur
            approval ke baad apne school ka dedicated online page
            manage karein.
          </p>

          <Link
            to="/register-school"
            className="mt-8 px-7 py-3.5 rounded-xl bg-white text-blue-700 font-extrabold btn-3d inline-flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Register Your School
            <ArrowRight className="w-5 h-5" />
          </Link>

        </div>
      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}
      <footer className="bg-gray-950 text-gray-400">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* Brand */}
            <div>

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
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

              <p className="text-sm leading-relaxed mt-4">
                A simple platform to discover and manage school websites.
              </p>

            </div>

            {/* Quick Links */}
            <div>

              <h3 className="text-white font-bold mb-4">
                Quick Links
              </h3>

              <div className="flex flex-col gap-3 text-sm">

                <Link
                  to="/"
                  className="hover:text-white transition-colors"
                >
                  Home
                </Link>

                <Link
                  to="/about"
                  className="hover:text-white transition-colors"
                >
                  About
                </Link>

                <Link
                  to="/schools"
                  className="hover:text-white transition-colors"
                >
                  Schools
                </Link>

                <Link
                  to="/notices"
                  className="hover:text-white transition-colors"
                >
                  Notices
                </Link>

              </div>

            </div>

            {/* Support */}
            <div>

              <h3 className="text-white font-bold mb-4">
                Support
              </h3>

              <div className="flex flex-col gap-3 text-sm">

                <Link
                  to="/contact"
                  className="hover:text-white transition-colors inline-flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Contact
                </Link>

                <Link
                  to="/privacy-policy"
                  className="hover:text-white transition-colors inline-flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Privacy Policy
                </Link>

                <Link
                  to="/terms-conditions"
                  className="hover:text-white transition-colors inline-flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Terms & Conditions
                </Link>

              </div>

            </div>

            {/* Registration */}
            <div>

              <h3 className="text-white font-bold mb-4">
                For Schools
              </h3>

              <p className="text-sm leading-relaxed mb-4">
                Apne school ko platform par register karke
                dedicated school website manage karein.
              </p>

              <Link
                to="/register-school"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white font-bold text-sm btn-3d inline-flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Register School
              </Link>

            </div>

          </div>

          <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">

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
  const image =
    school.logoUrl ||
    school.heroImageUrl ||
    'https://images.pexels.com/photos/207692/pexels-photo-207692.jpeg?auto=compress&cs=tinysrgb&w=1200';

  return (
    <div className="group bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">

      {/* Image */}
      <div className="relative h-52 overflow-hidden bg-gray-100">

        <img
          src={image}
          alt={school.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* LIVE */}
        <div className="absolute top-4 left-4">

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-extrabold shadow-lg">

            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />

            LIVE

          </span>

        </div>

        {/* Logo */}
        {school.logoUrl && (
          <div className="absolute bottom-4 left-4 w-16 h-16 rounded-2xl bg-white p-1.5 shadow-xl">

            <img
              src={school.logoUrl}
              alt={`${school.name} logo`}
              className="w-full h-full rounded-xl object-cover"
            />

          </div>
        )}

      </div>

      {/* Content */}
      <div className="p-5">

        <h3 className="text-xl font-extrabold text-gray-900 line-clamp-2">
          {school.name}
        </h3>

        {school.tagline && (
          <p className="text-sm text-blue-600 font-semibold mt-1 line-clamp-2">
            {school.tagline}
          </p>
        )}

        {school.address && (
          <div className="flex items-start gap-2 mt-4 text-sm text-gray-500">

            <MapPin className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />

            <span className="line-clamp-2">
              {school.address}
            </span>

          </div>
        )}

        {school.description && (
          <p className="text-sm text-gray-500 leading-relaxed mt-3 line-clamp-2">
            {school.description}
          </p>
        )}

        {/* Visit School */}
        <Link
          to={`/school/${school.slug}`}
          className="mt-5 w-full px-5 py-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold btn-3d inline-flex items-center justify-center gap-2"
        >
          Visit School
          <ArrowRight className="w-5 h-5" />
        </Link>

      </div>

    </div>
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
    <div className="relative bg-white rounded-3xl border border-gray-200 p-7 shadow-sm hover:shadow-xl transition-shadow">

      <div className="flex items-center justify-between">

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">

          <Icon className="w-7 h-7 text-white" />

        </div>

        <span className="text-4xl font-black text-gray-100">
          {number}
        </span>

      </div>

      <h3 className="text-xl font-extrabold text-gray-900 mt-6">
        {title}
      </h3>

      <p className="text-gray-500 mt-2 leading-relaxed">
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
    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-shadow">

      <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>

      <h3 className="font-bold text-gray-900 mt-4">
        {title}
      </h3>

      <p className="text-sm text-gray-500 mt-1">
        {text}
      </p>

    </div>
  );
}
