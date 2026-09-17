import {
  FormEvent,
  useState,
  ChangeEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';
import { registerSchool } from '@/firebase/firestore';

export default function RegisterSchoolPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [schoolName, setSchoolName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] =
    useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] =
    useState('');

  const [whatsappVerified, setWhatsappVerified] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /* =========================================================
     INDIAN MOBILE NUMBER VALIDATION
  ========================================================= */

  const isValidIndianMobile = (
    value: string
  ): boolean => {
    return /^[6-9][0-9]{9}$/.test(value);
  };

  /* =========================================================
     CREATE SCHOOL SLUG
  ========================================================= */

  const createSlug = (
    name: string
  ): string => {
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    /*
     * If school name contains only Hindi/other
     * non-English characters, create a safe fallback slug.
     */
    if (!slug) {
      return `school-${Date.now()}`;
    }

    return slug;
  };

  /* =========================================================
     WHATSAPP NUMBER
  ========================================================= */

  const handleWhatsappChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value
      .replace(/\D/g, '')
      .slice(0, 10);

    setWhatsappNumber(value);

    /*
     * Number बदलने पर confirmation reset होगा.
     */
    setWhatsappVerified(false);

    setError('');
  };

  /* =========================================================
     PHONE NUMBER
  ========================================================= */

  const handlePhoneChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value
      .replace(/\D/g, '')
      .slice(0, 10);

    setPhone(value);

    setError('');
  };

  /* =========================================================
     REGISTER SCHOOL
  ========================================================= */

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    /*
     * User must be logged in.
     */
    if (!user) {
      setError(
        'कृपया पहले Google Login करें।'
      );
      return;
    }

    const cleanSchoolName =
      schoolName.trim();

    const cleanAddress =
      address.trim();

    const cleanPhone =
      phone.trim();

    const cleanWhatsappNumber =
      whatsappNumber.trim();

    const cleanTagline =
      tagline.trim();

    const cleanDescription =
      description.trim();

    /* =======================================================
       SCHOOL NAME
    ======================================================= */

    if (!cleanSchoolName) {
      setError(
        'School Name डालना जरूरी है।'
      );
      return;
    }

    /* =======================================================
       ADDRESS
    ======================================================= */

    if (!cleanAddress) {
      setError(
        'School Address डालना जरूरी है।'
      );
      return;
    }

    /* =======================================================
       WHATSAPP NUMBER
    ======================================================= */

    if (!cleanWhatsappNumber) {
      setError(
        'WhatsApp Number डालना जरूरी है।'
      );
      return;
    }

    if (
      !isValidIndianMobile(
        cleanWhatsappNumber
      )
    ) {
      setError(
        'सही 10 अंकों का WhatsApp Number डालें। Number 6, 7, 8 या 9 से शुरू होना चाहिए।'
      );
      return;
    }

    /* =======================================================
       OPTIONAL PHONE
    ======================================================= */

    if (
      cleanPhone &&
      !isValidIndianMobile(
        cleanPhone
      )
    ) {
      setError(
        'Phone Number सही 10 अंकों का होना चाहिए और 6, 7, 8 या 9 से शुरू होना चाहिए।'
      );
      return;
    }

    /* =======================================================
       FREE WHATSAPP CONFIRMATION
    ======================================================= */

    if (!whatsappVerified) {
      setError(
        'कृपया पुष्टि करें कि दिया गया WhatsApp Number आपका सही और चालू नंबर है।'
      );
      return;
    }

    try {
      setLoading(true);

      /*
       * Automatically create school URL slug.
       */
      const slug =
        createSlug(
          cleanSchoolName
        );

      /*
       * IMPORTANT:
       *
       * Your current firestore.ts function is:
       *
       * registerSchool(
       *   ownerUid,
       *   input,
       *   ownerEmail
       * )
       *
       * इसलिए arguments इसी order में भेजे जा रहे हैं।
       */
      await registerSchool(
        user.uid,
        {
          name:
            cleanSchoolName,

          slug,

          address:
            cleanAddress,

          /*
           * Phone optional.
           */
          phone:
            cleanPhone || '',

          tagline:
            cleanTagline,

          description:
            cleanDescription,

          /*
           * School's own WhatsApp number.
           */
          whatsappNumber:
            cleanWhatsappNumber,

          /*
           * ₹0 owner confirmation.
           *
           * यह OTP verification नहीं है।
           */
          whatsappVerified:
            true,
        },
        user.email || ''
      );

      setSuccess(
        '✅ School Registration सफल हो गया। अब Payment/Approval प्रक्रिया पूरी करें।'
      );

      /*
       * Registration के बाद recharge page.
       */
      setTimeout(() => {
        navigate(
          '/payment/recharge'
        );
      }, 1200);
    } catch (err) {
      console.error(
        'School registration error:',
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : 'School Registration में समस्या हुई। कृपया दोबारा कोशिश करें।';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     LOGIN REQUIRED
  ========================================================= */

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-100 px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">

          <div className="mb-5 text-5xl">
            🏫
          </div>

          <h1 className="text-2xl font-bold text-gray-800">
            Register Your School
          </h1>

          <p className="mt-3 text-gray-600">
            School register करने के लिए पहले
            Google Login करें।
          </p>

          <button
            type="button"
            onClick={() =>
              navigate('/login')
            }
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-bold text-white shadow-[0_5px_0_#3730a3] transition hover:brightness-110 active:translate-y-1 active:shadow-[0_2px_0_#3730a3]"
          >
            🔐 Google Login
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     REGISTRATION FORM
  ========================================================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-100 px-4 py-8">

      <div className="mx-auto w-full max-w-2xl">

        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 px-6 py-8 text-center text-white">

            <div className="text-5xl">
              🏫
            </div>

            <h1 className="mt-3 text-3xl font-extrabold">
              Register Your School
            </h1>

            <p className="mt-2 text-sm text-white/90">
              अपना School Website बनाने के लिए
              Registration करें
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 p-6 md:p-8"
          >

            {/* =================================================
                GOOGLE ACCOUNT
            ================================================= */}

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Google Account
              </p>

              <p className="mt-1 break-all font-semibold text-gray-800">
                {user.email ||
                  'Google Account'}
              </p>

            </div>

            {/* =================================================
                SCHOOL NAME
            ================================================= */}

            <div>

              <label className="mb-2 block font-bold text-gray-700">
                School Name{' '}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <input
                type="text"
                value={schoolName}
                onChange={(e) =>
                  setSchoolName(
                    e.target.value
                  )
                }
                placeholder="उदाहरण: Zara Public School"
                required
                disabled={loading}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />

            </div>

            {/* =================================================
                ADDRESS
            ================================================= */}

            <div>

              <label className="mb-2 block font-bold text-gray-700">
                School Address{' '}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <textarea
                value={address}
                onChange={(e) =>
                  setAddress(
                    e.target.value
                  )
                }
                placeholder="School का पूरा Address"
                required
                disabled={loading}
                rows={3}
                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />

            </div>

            {/* =================================================
                WHATSAPP NUMBER
            ================================================= */}

            <div>

              <label className="mb-2 block font-bold text-gray-700">
                WhatsApp Number{' '}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <div className="flex overflow-hidden rounded-xl border border-gray-300 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200">

                <div className="flex items-center bg-gray-100 px-3 font-bold text-gray-700">
                  +91
                </div>

                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={whatsappNumber}
                  onChange={
                    handleWhatsappChange
                  }
                  placeholder="10 digit mobile number"
                  maxLength={10}
                  required
                  disabled={loading}
                  className="min-w-0 flex-1 px-4 py-3 outline-none"
                />

              </div>

              <p className="mt-2 text-xs text-gray-500">
                केवल 10 अंक डालें। Number 6,
                7, 8 या 9 से शुरू होना चाहिए।
              </p>

              {/* =================================================
                  LIVE VALIDATION
              ================================================= */}

              {whatsappNumber.length > 0 && (
                <div className="mt-2">

                  {isValidIndianMobile(
                    whatsappNumber
                  ) ? (
                    <p className="font-semibold text-green-600">
                      ✓ Number का format सही है
                    </p>
                  ) : (
                    <p className="font-semibold text-red-500">
                      ✗ सही 10 अंकों का mobile
                      number डालें
                    </p>
                  )}

                </div>
              )}

              {/* =================================================
                  FREE CONFIRMATION
              ================================================= */}

              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">

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
                  disabled={
                    loading ||
                    !isValidIndianMobile(
                      whatsappNumber
                    )
                  }
                  className="mt-1 h-5 w-5 accent-green-600"
                />

                <span className="text-sm text-gray-700">

                  <span className="font-bold text-green-700">
                    मैं पुष्टि करता/करती हूँ
                  </span>{' '}

                  कि ऊपर दिया गया WhatsApp
                  Number मेरा सही और चालू
                  नंबर है। इस नंबर पर school
                  website से संबंधित
                  recharge/reminder messages
                  भेजे जा सकते हैं।

                </span>

              </label>

              {/* =================================================
                  CONFIRMED
              ================================================= */}

              {whatsappVerified && (
                <div className="mt-2 rounded-lg bg-green-100 px-3 py-2 text-sm font-bold text-green-700">
                  ✓ WhatsApp Number Confirmed
                </div>
              )}

            </div>

            {/* =================================================
                OPTIONAL PHONE
            ================================================= */}

            <div>

              <label className="mb-2 block font-bold text-gray-700">
                Phone Number{' '}

                <span className="font-normal text-gray-400">
                  (Optional)
                </span>
              </label>

              <div className="flex overflow-hidden rounded-xl border border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200">

                <div className="flex items-center bg-gray-100 px-3 font-bold text-gray-700">
                  +91
                </div>

                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={
                    handlePhoneChange
                  }
                  placeholder="10 digit phone number"
                  maxLength={10}
                  disabled={loading}
                  className="min-w-0 flex-1 px-4 py-3 outline-none"
                />

              </div>

            </div>

            {/* =================================================
                TAGLINE
            ================================================= */}

            <div>

              <label className="mb-2 block font-bold text-gray-700">
                School Tagline{' '}

                <span className="font-normal text-gray-400">
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
                placeholder="उदाहरण: ज्ञान, अनुशासन और संस्कार"
                disabled={loading}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />

            </div>

            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <div>

              <label className="mb-2 block font-bold text-gray-700">
                School Description{' '}

                <span className="font-normal text-gray-400">
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
                placeholder="School के बारे में थोड़ी जानकारी"
                rows={4}
                disabled={loading}
                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                ❌ {error}
              </div>
            )}

            {/* =================================================
                SUCCESS
            ================================================= */}

            {success && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
                {success}
              </div>
            )}

            {/* =================================================
                REGISTER BUTTON
            ================================================= */}

            <button
              type="submit"
              disabled={
                loading ||
                !isValidIndianMobile(
                  whatsappNumber
                ) ||
                !whatsappVerified
              }
              className="w-full rounded-xl bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 px-6 py-4 text-lg font-extrabold text-white shadow-[0_6px_0_#047857] transition hover:brightness-110 active:translate-y-1 active:shadow-[0_2px_0_#047857] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {loading
                ? '⏳ Registration हो रहा है...'
                : '🏫 Register School'}
            </button>

            {/* =================================================
                BACK BUTTON
            ================================================= */}

            <button
              type="button"
              onClick={() =>
                navigate('/')
              }
              disabled={loading}
              className="w-full rounded-xl bg-gray-100 px-6 py-3 font-bold text-gray-700 shadow-[0_4px_0_#9ca3af] transition hover:bg-gray-200 active:translate-y-1 active:shadow-[0_1px_0_#9ca3af]"
            >
              ← Back to Home
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
