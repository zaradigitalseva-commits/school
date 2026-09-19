import {
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { registerSchool } from '@/firebase/firestore';

/* =========================================================
   REGISTER SCHOOL PAGE
   Only essential information is collected here.
   Other school details can be completed later from
   School Admin -> School Info.
========================================================= */

export default function RegisterSchoolPage() {
  const navigate = useNavigate();

  const {
    user,
    loading: authLoading,
    signInWithGoogle,
  } = useAuth();

  const [schoolName, setSchoolName] = useState('');
  const [address, setAddress] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [principalName, setPrincipalName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappVerified, setWhatsappVerified] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isValidIndianMobile = (value: string) =>
    /^[6-9][0-9]{9}$/.test(value);

  const createSlug = (value: string) => {
    const slug = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return slug || `school-${Date.now()}`;
  };

  const handleWhatsappChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value
      .replace(/\D/g, '')
      .slice(0, 10);

    setWhatsappNumber(value);
    setWhatsappVerified(false);
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
    } catch (err) {
      console.error('Google login error:', err);
      setError('Google Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      setError(
        'Please login with Google before registering your school.'
      );
      return;
    }

    const cleanSchoolName = schoolName.trim();
    const cleanAddress = address.trim();
    const cleanSchoolEmail = schoolEmail.trim().toLowerCase();
    const cleanCity = city.trim();
    const cleanState = state.trim();
    const cleanPrincipalName = principalName.trim();
    const cleanWhatsappNumber = whatsappNumber.trim();

    if (!cleanSchoolName) {
      setError('Please enter school name.');
      return;
    }

    if (!cleanAddress) {
      setError('Please enter school address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanSchoolEmail)) {
      setError('Please enter a valid school contact email.');
      return;
    }

    if (!cleanCity) {
      setError('Please enter school city.');
      return;
    }

    if (!cleanState) {
      setError('Please enter school state.');
      return;
    }

    if (!cleanPrincipalName) {
      setError('Please enter principal/head name.');
      return;
    }

    if (!isValidIndianMobile(cleanWhatsappNumber)) {
      setError(
        'Please enter a valid 10-digit Indian WhatsApp number.'
      );
      return;
    }

    if (!whatsappVerified) {
      setError(
        'Please confirm that this WhatsApp number is correct.'
      );
      return;
    }

    try {
      setLoading(true);

      const registeredSchool = await registerSchool(
        user.uid,
        {
          name: cleanSchoolName,
          slug: createSlug(cleanSchoolName),
          address: cleanAddress,
          email: cleanSchoolEmail,
          city: cleanCity,
          state: cleanState,
          principalName: cleanPrincipalName,
          phone: cleanWhatsappNumber,
          whatsappNumber: cleanWhatsappNumber,
          whatsappVerified: true,
        },
        user.email || ''
      );

      console.log('School registered:', registeredSchool);

      setSuccess(
        'School registered successfully. Please complete payment.'
      );

      setTimeout(() => {
        navigate('/payment/recharge', { replace: true });
      }, 800);
    } catch (err) {
      console.error('School registration error:', err);

      const message =
        err instanceof Error
          ? err.message
          : 'School registration failed. Please try again.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="text-4xl mb-4">🏫</div>
          <h2 className="text-xl font-bold text-gray-800">
            Loading...
          </h2>
          <p className="text-gray-500 mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-center">
          <div className="text-6xl mb-4">🏫</div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Register Your School
          </h1>

          <p className="text-gray-600 mt-3">
            Please login with your Google account to register your school.
          </p>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full mt-6 py-4 px-5 rounded-2xl font-bold text-white text-lg
              bg-gradient-to-r from-red-500 via-orange-500 to-pink-500
              shadow-[0_7px_0_#b91c1c]
              active:translate-y-1
              active:shadow-[0_3px_0_#b91c1c]
              transition-all disabled:opacity-60"
          >
            {loading ? 'Logging in...' : '🔐 Continue with Google'}
          </button>

          {error && (
            <div className="mt-5 rounded-2xl bg-red-50 border border-red-200 text-red-700 p-4 text-sm font-medium">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-4 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 p-6 sm:p-8 text-white text-center">
            <div className="text-5xl mb-3">🏫</div>

            <h1 className="text-2xl sm:text-3xl font-extrabold">
              Register Your School
            </h1>

            <p className="mt-2 text-white/90">
              Create your school's website
            </p>

            <div className="mt-4 bg-white/15 rounded-2xl p-3 text-sm">
              <div>Logged in with Google:</div>
              <strong>{user.email}</strong>
            </div>

            <div className="mt-3 bg-yellow-300/20 border border-white/30 rounded-2xl p-3 text-sm">
              🔒 <strong>1 Google account = 1 school</strong>
              <br />
              This Google account can register only one school.
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-5 sm:p-8 space-y-5"
          >
            <div>
              <label className="block font-bold text-gray-800 mb-2">
                🏫 School Name *
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Enter school name"
                required
                className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                Your school website link will be created automatically from this name.
              </p>
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-2">
                📍 School Address *
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter complete school address"
                rows={3}
                required
                className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block font-bold text-gray-800 mb-2">
                  ✉️ School Contact Email *
                </label>
                <input
                  type="email"
                  value={schoolEmail}
                  onChange={(e) => setSchoolEmail(e.target.value)}
                  placeholder="school@example.com"
                  required
                  className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  This is the school's public contact email. It can be different from your Google login email.
                </p>
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-2">
                  🏙️ City *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter city"
                  required
                  className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-2">
                  🗺️ State *
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Enter state"
                  required
                  className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-2">
                  👨‍💼 Principal / Head Name *
                </label>
                <input
                  type="text"
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  placeholder="Enter principal/head name"
                  required
                  className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-4">
              <label className="block font-bold text-gray-800 mb-2">
                📱 School WhatsApp Number *
              </label>

              <div className="flex">
                <span className="flex items-center px-4 bg-gray-100 border-2 border-r-0 border-gray-200 rounded-l-2xl font-bold text-gray-700">
                  +91
                </span>

                <input
                  type="tel"
                  inputMode="numeric"
                  value={whatsappNumber}
                  onChange={handleWhatsappChange}
                  placeholder="10 digit mobile number"
                  maxLength={10}
                  required
                  className="w-full rounded-r-2xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-green-500"
                />
              </div>

              <label className="flex items-start gap-3 mt-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappVerified}
                  onChange={(e) => setWhatsappVerified(e.target.checked)}
                  className="mt-1 h-5 w-5"
                />

                <span className="text-sm text-gray-700">
                  I confirm that this is the school's correct WhatsApp number.
                </span>
              </label>

              <p className="text-xs text-gray-500 mt-2">
                This is only your confirmation. No OTP is sent.
              </p>
            </div>

            {error && (
              <div className="rounded-2xl bg-red-50 border-2 border-red-200 text-red-700 p-4 font-medium">
                ❌ {error}
              </div>
            )}

            {success && (
              <div className="rounded-2xl bg-green-50 border-2 border-green-200 text-green-700 p-4 font-medium">
                ✅ {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-5 rounded-2xl font-extrabold text-white text-lg
                bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500
                shadow-[0_8px_0_#047857]
                active:translate-y-1
                active:shadow-[0_4px_0_#047857]
                transition-all disabled:opacity-60"
            >
              {loading ? '⏳ Registering School...' : '🏫 Register School'}
            </button>

            <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
              <strong>ℹ️ Registration Process</strong>

              <div className="mt-2 space-y-1">
                <div>1️⃣ Google Login</div>
                <div>2️⃣ Fill essential school details</div>
                <div>3️⃣ Register School</div>
                <div>4️⃣ Payment / Recharge</div>
                <div>5️⃣ Platform Admin Approval</div>
                <div>6️⃣ School Website Goes LIVE</div>
              </div>

              <p className="mt-3 text-xs text-blue-700">
                Logo, photos, tagline, description, founded year and other details can be added later from School Admin → School Info.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
