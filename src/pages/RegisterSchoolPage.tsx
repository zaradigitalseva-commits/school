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
========================================================= */

export default function RegisterSchoolPage() {
  const navigate = useNavigate();

  const {
    user,
    loading: authLoading,
    signInWithGoogle,
  } = useAuth();

  const [schoolName, setSchoolName] =
    useState('');

  const [address, setAddress] =
    useState('');

  const [phone, setPhone] =
    useState('');

  const [schoolEmail, setSchoolEmail] =
    useState('');

  const [city, setCity] =
    useState('');

  const [state, setState] =
    useState('');

  const [principalName, setPrincipalName] =
    useState('');

  const [foundedYear, setFoundedYear] =
    useState('');

  const [whatsappNumber, setWhatsappNumber] =
    useState('');

  const [tagline, setTagline] =
    useState('');

  const [description, setDescription] =
    useState('');

  const [whatsappVerified, setWhatsappVerified] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  /* =======================================================
     INDIAN MOBILE VALIDATION
  ======================================================= */

  const isValidIndianMobile = (
    value: string
  ) => {
    return /^[6-9][0-9]{9}$/.test(value);
  };

  /* =======================================================
     CREATE SCHOOL SLUG
  ======================================================= */

  const createSlug = (
    value: string
  ) => {
    const slug = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return (
      slug ||
      `school-${Date.now()}`
    );
  };

  /* =======================================================
     PHONE CHANGE
  ======================================================= */

  const handlePhoneChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value
      .replace(/\D/g, '')
      .slice(0, 10);

    setPhone(value);
  };

  /* =======================================================
     WHATSAPP CHANGE
  ======================================================= */

  const handleWhatsappChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value
      .replace(/\D/g, '')
      .slice(0, 10);

    setWhatsappNumber(value);

    /*
     * Number changed, so confirmation
     * must be checked again.
     */
    setWhatsappVerified(false);
  };

  /* =======================================================
     GOOGLE LOGIN
  ======================================================= */

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);

      await signInWithGoogle();
    } catch (err) {
      console.error(
        'Google login error:',
        err
      );

      setError(
        'Google Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     SUBMIT REGISTRATION
  ======================================================= */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    /* -------------------------------------------------------
       LOGIN CHECK
    ------------------------------------------------------- */

    if (!user) {
      setError(
        'Please login with Google before registering your school.'
      );
      return;
    }

    /* -------------------------------------------------------
       SCHOOL NAME
    ------------------------------------------------------- */

    const cleanSchoolName =
      schoolName.trim();

    if (!cleanSchoolName) {
      setError(
        'Please enter school name.'
      );
      return;
    }

    /* -------------------------------------------------------
       ADDRESS
    ------------------------------------------------------- */

    const cleanAddress =
      address.trim();

    if (!cleanAddress) {
      setError(
        'Please enter school address.'
      );
      return;
    }

    /* -------------------------------------------------------
       WHATSAPP
    ------------------------------------------------------- */

    const cleanSchoolEmail =
      schoolEmail.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanSchoolEmail)) {
      setError('Please enter a valid school email address.');
      return;
    }

    const cleanCity = city.trim();
    if (!cleanCity) {
      setError('Please enter school city.');
      return;
    }

    const cleanState = state.trim();
    if (!cleanState) {
      setError('Please enter school state.');
      return;
    }

    const cleanPrincipalName = principalName.trim();
    if (!cleanPrincipalName) {
      setError('Please enter principal/head name.');
      return;
    }

    const cleanFoundedYear = foundedYear.trim();

    const cleanWhatsappNumber =
      whatsappNumber.trim();

    if (!cleanWhatsappNumber) {
      setError(
        'Please enter WhatsApp number.'
      );
      return;
    }

    if (
      !isValidIndianMobile(
        cleanWhatsappNumber
      )
    ) {
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

    /* -------------------------------------------------------
       OPTIONAL PHONE
    ------------------------------------------------------- */

    const cleanPhone =
      phone.trim();

    if (
      cleanPhone &&
      !isValidIndianMobile(
        cleanPhone
      )
    ) {
      setError(
        'Please enter a valid 10-digit phone number.'
      );
      return;
    }

    /* -------------------------------------------------------
       OPTIONAL INFORMATION
    ------------------------------------------------------- */

    const cleanTagline =
      tagline.trim();

    const cleanDescription =
      description.trim();

    /* -------------------------------------------------------
       SLUG
    ------------------------------------------------------- */

    const slug =
      createSlug(
        cleanSchoolName
      );

    /* -------------------------------------------------------
       SAVE
    ------------------------------------------------------- */

    try {
      setLoading(true);

      const registeredSchool =
        await registerSchool(
          user.uid,
          {
            name: cleanSchoolName,

            slug,

            address:
              cleanAddress,

            phone:
              cleanPhone,

            email:
              cleanSchoolEmail,

            city:
              cleanCity,

            state:
              cleanState,

            principalName:
              cleanPrincipalName,

            foundedYear:
              cleanFoundedYear,

            tagline:
              cleanTagline,

            description:
              cleanDescription,

            whatsappNumber:
              cleanWhatsappNumber,

            whatsappVerified:
              true,
          },
          user.email || ''
        );

      console.log(
        'School registered:',
        registeredSchool
      );

      setSuccess(
        'School registered successfully. Please complete payment.'
      );

      /*
       * Registration creates the school as
       * PENDING_PAYMENT.
       *
       * Go to recharge/payment page.
       */
      setTimeout(() => {
        navigate(
          '/payment/recharge',
          {
            replace: true,
          }
        );
      }, 800);
    } catch (err) {
      console.error(
        'School registration error:',
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : 'School registration failed. Please try again.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     AUTH LOADING
  ======================================================= */

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="text-4xl mb-4">
            🏫
          </div>

          <h2 className="text-xl font-bold text-gray-800">
            Loading...
          </h2>

          <p className="text-gray-500 mt-2">
            Please wait
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     LOGIN REQUIRED
  ======================================================= */

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-center">

          <div className="text-6xl mb-4">
            🏫
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Register Your School
          </h1>

          <p className="text-gray-600 mt-3">
            Please login with your Google account
            to register your school.
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
            {loading
              ? 'Logging in...'
              : '🔐 Continue with Google'}
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

  /* =======================================================
     REGISTRATION FORM
  ======================================================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-4 py-8 sm:py-12">

      <div className="max-w-3xl mx-auto">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 p-6 sm:p-8 text-white text-center">

            <div className="text-5xl mb-3">
              🏫
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold">
              Register Your School
            </h1>

            <p className="mt-2 text-white/90">
              Create your school's website
            </p>

            <div className="mt-4 bg-white/15 rounded-2xl p-3 text-sm">
              Logged in as:
              <br />
              <strong>
                {user.email}
              </strong>
            </div>
          </div>

          {/* =================================================
              FORM
          ================================================= */}

          <form
            onSubmit={handleSubmit}
            className="p-5 sm:p-8 space-y-5"
          >

            {/* SCHOOL NAME */}

            <div>
              <label className="block font-bold text-gray-800 mb-2">
                🏫 School Name *
              </label>

              <input
                type="text"
                value={schoolName}
                onChange={(e) =>
                  setSchoolName(
                    e.target.value
                  )
                }
                placeholder="Enter school name"
                required
                className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            {/* ADDRESS */}

            <div>
              <label className="block font-bold text-gray-800 mb-2">
                📍 School Address *
              </label>

              <textarea
                value={address}
                onChange={(e) =>
                  setAddress(
                    e.target.value
                  )
                }
                placeholder="Enter complete school address"
                rows={3}
                required
                className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* SCHOOL CONTACT / LOCATION */}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block font-bold text-gray-800 mb-2">
                  ✉️ School Email *
                </label>
                <input
                  type="email"
                  value={schoolEmail}
                  onChange={(e) => setSchoolEmail(e.target.value)}
                  placeholder="school@example.com"
                  required
                  className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
                />
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

              <div>
                <label className="block font-bold text-gray-800 mb-2">
                  📅 Founded Year
                  <span className="font-normal text-gray-500"> (Optional)</span>
                </label>
                <input
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={foundedYear}
                  onChange={(e) => setFoundedYear(e.target.value)}
                  placeholder="Example: 2005"
                  className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* WHATSAPP */}

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
                  onChange={
                    handleWhatsappChange
                  }
                  placeholder="10 digit mobile number"
                  maxLength={10}
                  required
                  className="w-full rounded-r-2xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-green-500"
                />

              </div>

              <label className="flex items-start gap-3 mt-4 cursor-pointer">

                <input
                  type="checkbox"
                  checked={
                    whatsappVerified
                  }
                  onChange={(e) =>
                    setWhatsappVerified(
                      e.target.checked
                    )
                  }
                  className="mt-1 h-5 w-5"
                />

                <span className="text-sm text-gray-700">
                  I confirm that this is the
                  school's correct WhatsApp
                  number.
                </span>

              </label>

              <p className="text-xs text-gray-500 mt-2">
                ₹0 verification means owner
                confirmation only. No OTP is
                sent.
              </p>
            </div>

            {/* OPTIONAL PHONE */}

            <div>
              <label className="block font-bold text-gray-800 mb-2">
                ☎️ Phone Number
                <span className="font-normal text-gray-500">
                  {' '}
                  (Optional)
                </span>
              </label>

              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={
                  handlePhoneChange
                }
                placeholder="10 digit phone number"
                maxLength={10}
                className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            {/* TAGLINE */}

            <div>
              <label className="block font-bold text-gray-800 mb-2">
                ✨ School Tagline
                <span className="font-normal text-gray-500">
                  {' '}
                  (Optional)
                </span>
              </label>

              <input
                type="text"
                value={tagline}
                onChange={(e) =>
                  setTagline(
                    e.target.value
                  )
                }
                placeholder="Example: Knowledge • Discipline • Success"
                className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            {/* DESCRIPTION */}

            <div>
              <label className="block font-bold text-gray-800 mb-2">
                📝 School Description
                <span className="font-normal text-gray-500">
                  {' '}
                  (Optional)
                </span>
              </label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                placeholder="Short description about your school"
                rows={4}
                className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* ERROR */}

            {error && (
              <div className="rounded-2xl bg-red-50 border-2 border-red-200 text-red-700 p-4 font-medium">
                ❌ {error}
              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div className="rounded-2xl bg-green-50 border-2 border-green-200 text-green-700 p-4 font-medium">
                ✅ {success}
              </div>
            )}

            {/* SUBMIT */}

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
              {loading
                ? '⏳ Registering School...'
                : '🏫 Register School'}
            </button>

            {/* PAYMENT INFO */}

            <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
              <strong>
                ℹ️ Registration Process
              </strong>

              <div className="mt-2 space-y-1">
                <div>
                  1️⃣ Google Login
                </div>
                <div>
                  2️⃣ School Registration
                </div>
                <div>
                  3️⃣ Payment / Recharge
                </div>
                <div>
                  4️⃣ Platform Admin Approval
                </div>
                <div>
                  5️⃣ School Website Goes LIVE
                </div>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
