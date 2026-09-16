import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { fetchMyRechargeRequests } from '@/firebase/payment';
import type { RechargeRequest } from '@/firebase/payment';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

const BILLING_PACKAGES = [
  { amount: 300, days: 28 },
  { amount: 600, days: 56 },
  { amount: 900, days: 84 },
  { amount: 1200, days: 112 },
  { amount: 3000, days: 280 },
];

export default function PaymentRechargePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const schoolId = searchParams.get('schoolId') || '';

  const [selectedPackage, setSelectedPackage] = useState(
    BILLING_PACKAGES[1]
  );

  const [schoolName, setSchoolName] = useState('');
  const [loadingSchool, setLoadingSchool] = useState(true);
  const [requests, setRequests] = useState<RechargeRequest[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSchoolData() {
      if (!schoolId) {
        setError('School ID is missing.');
        setLoadingSchool(false);
        return;
      }

      try {
        setLoadingSchool(true);
        setError('');

        const schoolRef = doc(db, 'schools', schoolId);
        const schoolSnap = await getDoc(schoolRef);

        if (!schoolSnap.exists()) {
          setError('School registration was not found.');
          return;
        }

        const data = schoolSnap.data();

        setSchoolName(data.name || '');

        if (user) {
          try {
            const history = await fetchMyRechargeRequests();
            setRequests(history);
          } catch (historyError) {
            console.error(
              'Unable to load payment history:',
              historyError
            );
          }
        }
      } catch (err) {
        console.error('Unable to load school:', err);

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load school information.'
        );
      } finally {
        setLoadingSchool(false);
      }
    }

    loadSchoolData();
  }, [schoolId, user]);

  const openWhatsApp = () => {
    if (!user) {
      setError('Please sign in with Google first.');
      return;
    }

    if (!schoolId) {
      setError('School ID is missing.');
      return;
    }

    const phoneNumber = '919112170192';

    const message = [
      '🏫 SCHOOL WEBSITE PAYMENT REQUEST',
      '',
      `School Name: ${schoolName || 'Not available'}`,
    
      `Admin Email: ${user.email || 'Not available'}`,
      '',
      `Selected Package: ₹${selectedPackage.amount}`,
      `Subscription: ${selectedPackage.days} Days`,
      '',
      'I want to make the payment for my school website.',
      'Please send me the UPI ID / UPI QR code for payment.',
      '',
      'Thank you.',
    ].join('\n');

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  if (loadingSchool) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-4">
        <div className="rounded-3xl bg-white p-10 text-center shadow-2xl">
          <div className="text-5xl">🏫</div>

          <p className="mt-4 text-xl font-extrabold text-gray-800">
            Loading payment page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-4 py-8">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8 text-center text-white">
          <div className="text-6xl">💳</div>

          <h1 className="mt-3 text-3xl font-black md:text-5xl">
            School Payment
          </h1>

          <p className="mt-2 text-sm font-semibold text-white/90 md:text-base">
            Registration submitted successfully
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-3xl bg-white p-5 shadow-2xl md:p-8">

          {/* Success Information */}
          <div className="rounded-3xl border-2 border-green-200 bg-green-50 p-5">
            <div className="text-4xl">✅</div>

            <h2 className="mt-2 text-2xl font-black text-green-900">
              School Registration Submitted
            </h2>

            <p className="mt-2 text-sm leading-6 text-green-800">
              आपकी school registration Firebase में submit हो गई है।
              अब नीचे से अपना subscription package चुनें और payment के
              लिए WhatsApp पर संपर्क करें।
            </p>

            {schoolName && (
              <div className="mt-4 rounded-2xl bg-white p-4 shadow">
                <p className="text-xs font-bold uppercase text-gray-500">
                  School Name
                </p>

                <p className="mt-1 text-xl font-black text-gray-900">
                  {schoolName}
                </p>
              </div>
            )}
          </div>

          {/* Pending Status */}
          <div className="mt-6 rounded-3xl border-2 border-yellow-200 bg-yellow-50 p-5">
            <h2 className="text-xl font-black text-yellow-900">
              🟡 Payment Approval Required
            </h2>

            <p className="mt-2 text-sm leading-6 text-yellow-800">
              Payment करने के बाद Platform Admin payment verify करेगा।
              Admin approval मिलने के बाद ही आपका school LIVE होगा और
              school management features unlock होंगे।
            </p>
          </div>

          {/* Packages */}
          <div className="mt-8">
            <h2 className="text-2xl font-black text-gray-900">
              📦 Choose Subscription Package
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              अपना पसंदीदा package select करें।
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {BILLING_PACKAGES.map((pkg) => {
                const selected =
                  selectedPackage.amount === pkg.amount;

                return (
                  <button
                    key={pkg.amount}
                    type="button"
                    onClick={() => setSelectedPackage(pkg)}
                    className={`rounded-2xl p-5 text-center transition active:translate-y-1 ${
                      selected
                        ? 'bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white shadow-[0_7px_0_rgb(67,56,202)]'
                        : 'bg-gray-100 text-gray-800 shadow-[0_6px_0_rgb(156,163,175)] hover:bg-gray-200'
                    }`}
                  >
                    <div className="text-3xl font-black">
                      ₹{pkg.amount}
                    </div>

                    <div className="mt-2 text-lg font-extrabold">
                      {pkg.days} Days
                    </div>

                    {selected && (
                      <div className="mt-3 rounded-full bg-white/20 px-3 py-1 text-sm font-black">
                        ✓ Selected
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Package */}
          <div className="mt-8 rounded-3xl bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 p-6 text-center">
            <p className="text-sm font-bold text-gray-600">
              Selected Package
            </p>

            <p className="mt-2 text-4xl font-black text-purple-700">
              ₹{selectedPackage.amount}
            </p>

            <p className="mt-1 text-lg font-extrabold text-gray-800">
              {selectedPackage.days} Days Subscription
            </p>
          </div>

          {/* WhatsApp Payment Section */}
          <div className="mt-8 rounded-3xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 text-center">

            <div className="text-6xl">📲</div>

            <h2 className="mt-3 text-2xl font-black text-green-900 md:text-3xl">
              Payment के लिए WhatsApp पर संपर्क करें
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-green-800 md:text-base">
              नीचे दिए गए button पर क्लिक करें। आपके school की details
              और selected package के साथ WhatsApp message अपने आप तैयार
              हो जाएगा।
            </p>

            <div className="mx-auto mt-5 max-w-md rounded-2xl bg-white p-4 shadow-lg">
              <p className="text-sm font-bold text-gray-500">
                WhatsApp Payment Number
              </p>

              <p className="mt-1 text-2xl font-black text-green-700">
                9112170192
              </p>
            </div>

            <button
              type="button"
              onClick={openWhatsApp}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5 text-xl font-black text-white shadow-[0_8px_0_rgb(4,120,87)] transition hover:brightness-110 active:translate-y-2 active:shadow-none"
            >
              📲 WhatsApp पर Payment के लिए संपर्क करें
            </button>

            <p className="mt-4 text-xs font-semibold text-green-700">
              WhatsApp पर message भेजने के बाद आपको UPI ID / QR दिया जाएगा।
            </p>
          </div>

          {/* Payment Steps */}
          <div className="mt-8 rounded-3xl bg-gray-50 p-6">
            <h2 className="text-2xl font-black text-gray-900">
              📝 Payment Process
            </h2>

            <div className="mt-5 space-y-4">

              <div className="flex gap-4 rounded-2xl bg-white p-4 shadow">
                <div className="text-3xl">1️⃣</div>
                <div>
                  <p className="font-black text-gray-900">
                    Package Select करें
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    ऊपर से अपना subscription package चुनें।
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-2xl bg-white p-4 shadow">
                <div className="text-3xl">2️⃣</div>
                <div>
                  <p className="font-black text-gray-900">
                    WhatsApp पर Contact करें
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    WhatsApp button दबाकर payment request भेजें।
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-2xl bg-white p-4 shadow">
                <div className="text-3xl">3️⃣</div>
                <div>
                  <p className="font-black text-gray-900">
                    UPI QR से Payment करें
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    आपको WhatsApp पर UPI ID या QR code दिया जाएगा।
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-2xl bg-white p-4 shadow">
                <div className="text-3xl">4️⃣</div>
                <div>
                  <p className="font-black text-gray-900">
                    Admin Verification
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Payment verify होने के बाद Admin approval करेगा।
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-2xl bg-green-50 p-4 shadow">
                <div className="text-3xl">5️⃣</div>
                <div>
                  <p className="font-black text-green-900">
                    School LIVE
                  </p>
                  <p className="mt-1 text-sm text-green-700">
                    Approval के बाद school LIVE हो जाएगा।
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 rounded-2xl border-2 border-red-200 bg-red-50 p-4 font-semibold text-red-700">
              ❌ {error}
            </div>
          )}

        </div>

        {/* Payment History */}
        {user && (
          <div className="mt-6 rounded-3xl bg-white p-6 shadow-2xl">

            <h2 className="text-2xl font-black text-gray-900">
              📜 Payment History
            </h2>

            {requests.length === 0 ? (
              <p className="mt-4 text-gray-600">
                अभी कोई payment request नहीं है।
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-2xl border-2 border-gray-100 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                      <div>
                        <p className="font-black text-gray-900">
                          ₹{request.amount} • {request.days} Days
                        </p>

                        {request.utr && (
                          <p className="mt-1 text-sm text-gray-500">
                            UTR: {request.utr}
                          </p>
                        )}
                      </div>

                      <span
                        className={`rounded-full px-4 py-2 text-sm font-black ${
                          request.status === 'APPROVED'
                            ? 'bg-green-100 text-green-700'
                            : request.status === 'REJECTED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {request.status}
                      </span>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-center">

          <button
            type="button"
            onClick={() => navigate('/schools')}
            className="rounded-xl bg-white px-6 py-3 font-extrabold text-gray-800 shadow-[0_5px_0_rgb(156,163,175)] active:translate-y-1 active:shadow-none"
          >
            🔎 Schools
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-xl bg-white px-6 py-3 font-extrabold text-gray-800 shadow-[0_5px_0_rgb(156,163,175)] active:translate-y-1 active:shadow-none"
          >
            🏠 Home
          </button>

        </div>

      </div>
    </div>
  );
}
