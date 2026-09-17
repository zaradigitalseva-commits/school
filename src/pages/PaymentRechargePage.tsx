```tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';

import {
  fetchMyRechargeRequests,
} from '@/firebase/payment';

import type {
  RechargeRequest,
} from '@/firebase/payment';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';

import { db } from '@/firebase/config';

/* =========================================================
   BILLING PACKAGES
========================================================= */

const BILLING_PACKAGES = [
  { amount: 300, days: 28 },
  { amount: 600, days: 56 },
  { amount: 900, days: 84 },
  { amount: 1200, days: 112 },
  { amount: 3000, days: 280 },
] as const;

/* =========================================================
   HELPERS
========================================================= */

function getSchoolName(
  data: Record<string, unknown>
): string {
  const possibleNames = [
    data.name,
    data.schoolName,
    data.title,
  ];

  for (const value of possibleNames) {
    if (
      typeof value === 'string' &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return '';
}

/* =========================================================
   PAGE
========================================================= */

export default function PaymentRechargePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  /*
   * URL से School ID केवल Firebase lookup के लिए है।
   * इसे WhatsApp message में कभी नहीं भेजना है।
   */
  const urlSchoolId =
    searchParams.get('schoolId')?.trim() || '';

  /* =======================================================
     STATE
  ======================================================= */

  const [
    selectedPackage,
    setSelectedPackage,
  ] = useState(BILLING_PACKAGES[1]);

  const [
    schoolId,
    setSchoolId,
  ] = useState(urlSchoolId);

  const [
    schoolName,
    setSchoolName,
  ] = useState('');

  const [
    loadingSchool,
    setLoadingSchool,
  ] = useState(true);

  const [
    requests,
    setRequests,
  ] = useState<RechargeRequest[]>([]);

  const [
    error,
    setError,
  ] = useState('');

  /* =======================================================
     LOAD SCHOOL
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadSchoolData() {
      if (!user) {
        if (!cancelled) {
          setLoadingSchool(false);
          setSchoolId('');
          setSchoolName('');
          setError(
            'Please sign in with Google first.'
          );
        }

        return;
      }

      try {
        setLoadingSchool(true);
        setError('');

        let resolvedSchoolId = '';
        let resolvedSchoolName = '';

        /* =================================================
           STEP 1
           URL schoolId से school पढ़ें
        ================================================= */

        if (urlSchoolId) {
          try {
            const schoolRef = doc(
              db,
              'schools',
              urlSchoolId
            );

            const schoolSnap = await getDoc(
              schoolRef
            );

            if (schoolSnap.exists()) {
              const data =
                schoolSnap.data();

              const ownerUid =
                typeof data.ownerUid === 'string'
                  ? data.ownerUid.trim()
                  : '';

              /*
               * केवल current Google user की school स्वीकार करें।
               */
              if (
                ownerUid &&
                ownerUid === user.uid
              ) {
                resolvedSchoolId =
                  schoolSnap.id;

                resolvedSchoolName =
                  getSchoolName(data);
              } else {
                console.warn(
                  'School owner does not match current user.'
                );
              }
            } else {
              console.warn(
                'School document not found:',
                urlSchoolId
              );
            }
          } catch (schoolError) {
            console.error(
              'Unable to load school from URL schoolId:',
              schoolError
            );
          }
        }

        /* =================================================
           STEP 2
           URL से नहीं मिली तो ownerUid से खोजें
        ================================================= */

        if (!resolvedSchoolId) {
          try {
            const schoolsRef =
              collection(db, 'schools');

            const ownerQuery = query(
              schoolsRef,
              where(
                'ownerUid',
                '==',
                user.uid
              ),
              limit(20)
            );

            const ownerSnapshot =
              await getDocs(ownerQuery);

            if (!ownerSnapshot.empty) {
              const schools =
                ownerSnapshot.docs
                  .map((item) => ({
                    id: item.id,
                    ...item.data(),
                  }))
                  .sort((a, b) => {
                    const aCreated =
                      a.createdAt;

                    const bCreated =
                      b.createdAt;

                    const aTime =
                      typeof aCreated === 'string'
                        ? new Date(
                            aCreated
                          ).getTime()
                        : 0;

                    const bTime =
                      typeof bCreated === 'string'
                        ? new Date(
                            bCreated
                          ).getTime()
                        : 0;

                    return bTime - aTime;
                  });

              /*
               * PENDING_PAYMENT school को प्राथमिकता।
               */
              const pendingSchool =
                schools.find(
                  (item) =>
                    item.status ===
                    'PENDING_PAYMENT'
                );

              const selectedSchool =
                pendingSchool ||
                schools[0];

              if (selectedSchool) {
                resolvedSchoolId =
                  selectedSchool.id;

                resolvedSchoolName =
                  getSchoolName(
                    selectedSchool
                  );
              }
            }
          } catch (ownerError) {
            console.error(
              'Unable to find school by ownerUid:',
              ownerError
            );
          }
        }

        /* =================================================
           STEP 3
           अगर name खाली है तो slugReservations से लें
        ================================================= */

        if (
          resolvedSchoolId &&
          !resolvedSchoolName
        ) {
          try {
            const reservationQuery =
              query(
                collection(
                  db,
                  'slugReservations'
                ),
                where(
                  'schoolId',
                  '==',
                  resolvedSchoolId
                ),
                limit(1)
              );

            const reservationSnapshot =
              await getDocs(
                reservationQuery
              );

            if (
              !reservationSnapshot.empty
            ) {
              const reservationData =
                reservationSnapshot.docs[0]
                  .data();

              if (
                typeof reservationData.schoolName ===
                  'string' &&
                reservationData.schoolName.trim()
              ) {
                resolvedSchoolName =
                  reservationData.schoolName.trim();
              }

              if (
                !resolvedSchoolName &&
                typeof reservationData.name ===
                  'string' &&
                reservationData.name.trim()
              ) {
                resolvedSchoolName =
                  reservationData.name.trim();
              }
            }
          } catch (reservationError) {
            console.error(
              'Unable to load school name from slug reservation:',
              reservationError
            );
          }
        }

        /* =================================================
           STEP 4
           STATE UPDATE
        ================================================= */

        if (!cancelled) {
          setSchoolId(
            resolvedSchoolId
          );

          setSchoolName(
            resolvedSchoolName
          );

          if (!resolvedSchoolId) {
            setError(
              'Your school registration was not found. Please register your school again or contact support.'
            );
          } else if (!resolvedSchoolName) {
            setError(
              'School was found, but school name is missing in Firebase.'
            );
          } else {
            /*
             * School successfully loaded.
             * Error clear रखें।
             */
            setError('');
          }
        }

        /* =================================================
           STEP 5
           PAYMENT HISTORY
        ================================================= */

        try {
          const history =
            await fetchMyRechargeRequests(
              user.uid
            );

          if (!cancelled) {
            setRequests(history);
          }
        } catch (historyError) {
          console.error(
            'Unable to load payment history:',
            historyError
          );

          if (!cancelled) {
            setRequests([]);
          }
        }
      } catch (err) {
        console.error(
          'Unable to load school:',
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load school information.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingSchool(false);
        }
      }
    }

    loadSchoolData();

    return () => {
      cancelled = true;
    };
  }, [user, urlSchoolId]);

  /* =======================================================
     WHATSAPP PAYMENT REQUEST
  ======================================================= */

  const openWhatsApp = () => {
    setError('');

    if (!user) {
      setError(
        'Please sign in with Google first.'
      );
      return;
    }

    if (!schoolName) {
      setError(
        'School name is not available. Please refresh the page and try again.'
      );
      return;
    }

    /*
     * WhatsApp number
     */
    const phoneNumber =
      '919112170192';

    /*
     * IMPORTANT:
     * School ID यहाँ बिल्कुल नहीं है।
     */
    const message = [
      '🏫 SCHOOL WEBSITE PAYMENT REQUEST',
      '',
      `School Name: ${schoolName}`,
      `Admin Email: ${
        user.email || 'Not available'
      }`,
      '',
      `Selected Package: ₹${selectedPackage.amount}`,
      `Subscription: ${selectedPackage.days} Days`,
      '',
      'I want to make the payment for my school website.',
      'Please send me the UPI ID / UPI QR code for payment.',
      '',
      'Thank you.',
    ].join('\n');

    const whatsappUrl =
      `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
        message
      )}`;

    window.open(
      whatsappUrl,
      '_blank',
      'noopener,noreferrer'
    );
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loadingSchool) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-2xl">
          <div className="text-6xl">
            🏫
          </div>

          <p className="mt-4 text-xl font-extrabold text-gray-800">
            Loading payment page...
          </p>

          <div className="mx-auto mt-5 h-2 w-48 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-purple-600" />
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  const whatsappReady =
    Boolean(user && schoolName);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-4 py-8">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <div className="mb-8 text-center text-white">
          <div className="text-6xl">
            💳
          </div>

          <h1 className="mt-3 text-3xl font-black md:text-5xl">
            School Payment
          </h1>

          <p className="mt-2 text-sm font-semibold text-white/90 md:text-base">
            Registration submitted successfully
          </p>
        </div>

        {/* MAIN CARD */}
        <div className="rounded-3xl bg-white p-5 shadow-2xl md:p-8">

          {/* SUCCESS */}
          <div className="rounded-3xl border-2 border-green-200 bg-green-50 p-5">
            <div className="text-4xl">
              ✅
            </div>

            <h2 className="mt-2 text-2xl font-black text-green-900">
              School Registration Submitted
            </h2>

            <p className="mt-2 text-sm leading-6 text-green-800">
              आपकी school registration Firebase में submit हो गई है।
              अब नीचे से अपना subscription package चुनें और payment
              के लिए WhatsApp पर संपर्क करें।
            </p>

            {schoolName && (
              <div className="mt-4 rounded-2xl bg-white p-4 shadow">
                <p className="text-xs font-bold uppercase text-gray-500">
                  School Name
                </p>

                <p className="mt-1 break-words text-xl font-black text-gray-900">
                  {schoolName}
                </p>
              </div>
            )}
          </div>

          {/* STATUS */}
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

          {/* PACKAGES */}
          <div className="mt-8">
            <h2 className="text-2xl font-black text-gray-900">
              📦 Choose Subscription Package
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              अपना पसंदीदा package select करें।
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {BILLING_PACKAGES.map(
                (pkg) => {
                  const selected =
                    selectedPackage.amount ===
                    pkg.amount;

                  return (
                    <button
                      key={`${pkg.amount}-${pkg.days}`}
                      type="button"
                      onClick={() =>
                        setSelectedPackage(pkg)
                      }
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
                }
              )}
            </div>
          </div>

          {/* SELECTED PACKAGE */}
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

          {/* WHATSAPP */}
          <div className="mt-8 rounded-3xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 text-center">

            <div className="text-6xl">
              📲
            </div>

            <h2 className="mt-3 text-2xl font-black text-green-900 md:text-3xl">
              Payment के लिए WhatsApp पर संपर्क करें
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-green-800 md:text-base">
              नीचे दिए गए button पर क्लिक करें। आपके school का नाम,
              admin email और selected package के साथ WhatsApp message
              अपने आप तैयार हो जाएगा।
            </p>

            <div className="mx-auto mt-5 max-w-md rounded-2xl bg-white p-4 shadow-lg">
              <p className="text-sm font-bold text-gray-500">
                WhatsApp Payment Number
              </p>

              <p className="mt-1 text-2xl font-black text-green-700">
                9112170192
              </p>
            </div>

            {/* DEBUG / STATUS */}
            {schoolName && (
              <div className="mx-auto mt-5 max-w-md rounded-2xl border-2 border-green-200 bg-green-100 p-3">
                <p className="text-sm font-bold text-green-800">
                  ✅ School Ready for Payment
                </p>

                <p className="mt-1 text-base font-black text-green-900">
                  {schoolName}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={openWhatsApp}
              disabled={!whatsappReady}
              className={`mt-6 w-full rounded-2xl px-6 py-5 text-xl font-black text-white transition ${
                whatsappReady
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-[0_8px_0_rgb(4,120,87)] hover:brightness-110 active:translate-y-2 active:shadow-none'
                  : 'cursor-not-allowed bg-gray-400 shadow-[0_8px_0_rgb(107,114,128)]'
              }`}
            >
              📲 WhatsApp पर Payment के लिए संपर्क करें
            </button>

            <p className="mt-4 text-xs font-semibold text-green-700">
              WhatsApp पर message भेजने के बाद आपको UPI ID / QR दिया जाएगा।
            </p>
          </div>

          {/* PAYMENT PROCESS */}
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

          {/* ERROR */}
          {error && (
            <div className="mt-6 rounded-2xl border-2 border-red-200 bg-red-50 p-4 font-semibold text-red-700">
              ❌ {error}
            </div>
          )}

        </div>

        {/* PAYMENT HISTORY */}
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
                {requests.map(
                  (request) => (
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

                          {request.schoolName && (
                            <p className="mt-1 text-sm font-semibold text-gray-500">
                              🏫 {request.schoolName}
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
                  )
                )}
              </div>
            )}

          </div>
        )}

        {/* NAVIGATION */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-center">

          <button
            type="button"
            onClick={() => navigate('/schools')}
            className="rounded-xl bg-white px-6 py-3 font-extrabold text-gray-800 shadow-[0_5px_0_rgb(156,163,175)] transition hover:bg-gray-100 active:translate-y-1 active:shadow-none"
          >
            🔎 Schools
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-xl bg-white px-6 py-3 font-extrabold text-gray-800 shadow-[0_5px_0_rgb(156,163,175)] transition hover:bg-gray-100 active:translate-y-1 active:shadow-none"
          >
            🏠 Home
          </button>

        </div>

      </div>
    </div>
  );
}
```
