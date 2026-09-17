import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { fetchMyRechargeRequests } from '@/firebase/payment';
import type { RechargeRequest } from '@/firebase/payment';

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

type PackageType = {
  amount: number;
  days: number;
};

type SchoolData = {
  id: string;
  name?: string;
  schoolName?: string;
  title?: string;
  ownerUid?: string;
  ownerEmail?: string;
  phone?: string;
  slug?: string;
  status?: string;
  paymentStatus?: string;
  subscriptionStatus?: string;
  createdAt?: string;
};

const PACKAGES: PackageType[] = [
  { amount: 300, days: 28 },
  { amount: 600, days: 56 },
  { amount: 900, days: 84 },
  { amount: 1200, days: 112 },
  { amount: 3000, days: 280 },
];

const WHATSAPP_NUMBER = '919112170192';

function getSchoolName(data: SchoolData | null): string {
  if (!data) return '';

  return (
    data.name?.trim() ||
    data.schoolName?.trim() ||
    data.title?.trim() ||
    ''
  );
}

function formatDate(value: unknown): string {
  if (!value) return '-';

  try {
    if (
      typeof value === 'object' &&
      value !== null &&
      'toDate' in value &&
      typeof (value as { toDate?: unknown }).toDate === 'function'
    ) {
      return (value as { toDate: () => Date }).toDate().toLocaleString(
        'en-IN'
      );
    }

    const date = new Date(String(value));

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString('en-IN');
  } catch {
    return String(value);
  }
}

export default function PaymentRechargePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [schoolId, setSchoolId] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<PackageType>(
    PACKAGES[1]
  );

  const [history, setHistory] = useState<RechargeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadSchool() {
      if (!user) {
        if (mounted) {
          setLoading(false);
          setError('Please login with your Google account first.');
        }
        return;
      }

      try {
        setLoading(true);
        setError('');

        let selectedSchool: SchoolData | null = null;

        // ---------------------------------------------------------
        // 1. Try schoolId from URL
        // ---------------------------------------------------------
        const urlSchoolId = searchParams.get('schoolId');

        if (urlSchoolId) {
          const schoolRef = doc(db, 'schools', urlSchoolId);
          const schoolSnap = await getDoc(schoolRef);

          if (schoolSnap.exists()) {
            const data = schoolSnap.data() as Omit<SchoolData, 'id'>;

            if (data.ownerUid === user.uid) {
              selectedSchool = {
                id: schoolSnap.id,
                ...data,
              };
            }
          }
        }

        // ---------------------------------------------------------
        // 2. If URL schoolId is not found, find owner's school
        // ---------------------------------------------------------
        if (!selectedSchool) {
          const schoolsRef = collection(db, 'schools');

          const ownerQuery = query(
            schoolsRef,
            where('ownerUid', '==', user.uid),
            limit(20)
          );

          const ownerSnapshot = await getDocs(ownerQuery);

          const schools: SchoolData[] = ownerSnapshot.docs.map((item) => {
            const data = item.data() as Omit<SchoolData, 'id'>;

            return {
              id: item.id,
              ...data,
            };
          });

          if (schools.length > 0) {
            // Prefer pending payment school
            selectedSchool =
              schools.find(
                (item) =>
                  item.status === 'PENDING_PAYMENT' ||
                  item.paymentStatus === 'PENDING'
              ) || schools[0];
          }
        }

        // ---------------------------------------------------------
        // 3. Extra fallback through slugReservations
        // ---------------------------------------------------------
        if (selectedSchool && !getSchoolName(selectedSchool)) {
          try {
            const reservationQuery = query(
              collection(db, 'slugReservations'),
              where('schoolId', '==', selectedSchool.id),
              limit(1)
            );

            const reservationSnapshot = await getDocs(reservationQuery);

            if (!reservationSnapshot.empty) {
              const reservationData =
                reservationSnapshot.docs[0].data() as Record<string, unknown>;

              const reservedName =
                typeof reservationData.schoolName === 'string'
                  ? reservationData.schoolName
                  : typeof reservationData.name === 'string'
                    ? reservationData.name
                    : '';

              if (reservedName) {
                selectedSchool = {
                  ...selectedSchool,
                  name: reservedName,
                };
              }
            }
          } catch {
            // This fallback is optional.
          }
        }

        if (!selectedSchool) {
          if (mounted) {
            setError(
              'School record was not found for this Google account.'
            );
          }
          return;
        }

        const finalName = getSchoolName(selectedSchool);

        if (!finalName) {
          if (mounted) {
            setError('School name was not found.');
          }
          return;
        }

        if (mounted) {
          setSchoolId(selectedSchool.id);
          setSchoolName(finalName);
        }

        // ---------------------------------------------------------
        // 4. Load payment history
        // ---------------------------------------------------------
        try {
          const requests = await fetchMyRechargeRequests(user.uid);

          if (mounted) {
            setHistory(requests || []);
          }
        } catch (historyError) {
          console.error('Payment history error:', historyError);

          if (mounted) {
            setHistory([]);
          }
        }
      } catch (err) {
        console.error('Payment page error:', err);

        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load school information.'
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
  }, [user, searchParams]);

  // ---------------------------------------------------------------
  // WhatsApp Payment Request
  // ---------------------------------------------------------------
  const handleWhatsAppPayment = () => {
    if (!schoolName || !schoolId || !user) {
      return;
    }

    setSending(true);

    const message = [
      '🏫 SCHOOL WEBSITE PAYMENT REQUEST',
      '',
      `School Name: ${schoolName}`,
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

    const whatsappUrl =
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    window.open(
      whatsappUrl,
      '_blank',
      'noopener,noreferrer'
    );

    setTimeout(() => {
      setSending(false);
    }, 700);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl bg-white/95 p-8 text-center shadow-2xl border border-white">
          <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

          <h1 className="text-2xl font-extrabold text-gray-800">
            Loading School...
          </h1>

          <p className="mt-2 text-gray-600">
            Please wait while we load your school information.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 via-orange-100 to-yellow-100 p-5">
        <div className="mx-auto max-w-xl pt-10">
          <div className="rounded-3xl bg-white p-7 shadow-2xl border border-red-100">
            <div className="mb-5 text-center">
              <div className="text-5xl">⚠️</div>

              <h1 className="mt-3 text-2xl font-extrabold text-red-700">
                School Information Not Found
              </h1>
            </div>

            <div className="rounded-2xl bg-red-50 p-4 text-red-700">
              {error}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 px-5 py-4 font-extrabold text-white shadow-[0_7px_0_#b91c1c] transition-all hover:-translate-y-1 active:translate-y-1 active:shadow-[0_3px_0_#b91c1c]"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={handleHome}
                className="rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 px-5 py-4 font-extrabold text-white shadow-[0_7px_0_#3730a3] transition-all hover:-translate-y-1 active:translate-y-1 active:shadow-[0_3px_0_#3730a3]"
              >
                🏠 Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-6 rounded-3xl bg-white/95 p-5 shadow-2xl border border-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-bold uppercase tracking-wider text-blue-600">
                School Website
              </div>

              <h1 className="mt-1 text-2xl font-extrabold text-gray-900 sm:text-3xl">
                Recharge / Subscription
              </h1>

              <p className="mt-1 text-gray-600">
                Complete your payment to activate the school website.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 px-5 py-3 font-extrabold text-white shadow-[0_6px_0_#b91c1c] transition-all hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_#b91c1c]"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={handleHome}
                className="rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 px-5 py-3 font-extrabold text-white shadow-[0_6px_0_#1d4ed8] transition-all hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_#1d4ed8]"
              >
                🏠 Home
              </button>
            </div>
          </div>
        </div>

        {/* School Information */}
        <div className="mb-6 rounded-3xl bg-white p-6 shadow-2xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-2xl shadow-lg">
              🏫
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-gray-900">
                {schoolName}
              </h2>

              <p className="text-sm text-gray-500">
                School Registration
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-blue-50 p-4">
              <div className="text-xs font-bold uppercase text-blue-500">
                Admin Email
              </div>

              <div className="mt-1 break-all font-bold text-gray-800">
                {user?.email || '-'}
              </div>
            </div>

            <div className="rounded-2xl bg-purple-50 p-4">
              <div className="text-xs font-bold uppercase text-purple-500">
                Payment Status
              </div>

              <div className="mt-1 font-bold text-orange-600">
                PENDING PAYMENT
              </div>
            </div>
          </div>
        </div>

        {/* Packages */}
        <div className="mb-6 rounded-3xl bg-white p-6 shadow-2xl">
          <h2 className="mb-2 text-2xl font-extrabold text-gray-900">
            Select Subscription
          </h2>

          <p className="mb-5 text-gray-600">
            Choose your website subscription package.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PACKAGES.map((item) => {
              const selected =
                selectedPackage.amount === item.amount &&
                selectedPackage.days === item.days;

              return (
                <button
                  key={`${item.amount}-${item.days}`}
                  type="button"
                  onClick={() => setSelectedPackage(item)}
                  className={
                    selected
                      ? 'rounded-3xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 p-5 text-left text-white shadow-[0_8px_0_#6d28d9] transition-all hover:-translate-y-1 active:translate-y-1 active:shadow-[0_3px_0_#6d28d9]'
                      : 'rounded-3xl bg-gradient-to-br from-cyan-50 to-blue-100 p-5 text-left text-blue-950 shadow-[0_8px_0_#0e7490] transition-all hover:-translate-y-1 active:translate-y-1 active:shadow-[0_3px_0_#0e7490]'
                  }
                >
                  <div className="text-sm font-bold uppercase tracking-wide opacity-80">
                    {selected ? '✓ Selected' : 'Select Package'}
                  </div>

                  <div className="mt-2 text-3xl font-black">
                    ₹{item.amount}
                  </div>

                  <div className="mt-1 text-lg font-extrabold">
                    {item.days} Days
                  </div>

                  <div className="mt-3 text-sm font-semibold opacity-80">
                    School Website Subscription
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Package */}
        <div className="mb-6 rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 text-white shadow-2xl">
          <div className="text-sm font-bold uppercase tracking-widest opacity-80">
            Selected Package
          </div>

          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="text-4xl font-black">
                ₹{selectedPackage.amount}
              </div>

              <div className="mt-1 text-lg font-bold">
                {selectedPackage.days} Days Subscription
              </div>
            </div>

            <div className="rounded-2xl bg-white/20 px-5 py-4 text-center backdrop-blur">
              <div className="text-sm font-semibold">
                School
              </div>

              <div className="font-black">
                {schoolName}
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Payment */}
        <div className="mb-6 rounded-3xl bg-white p-6 shadow-2xl">
          <div className="text-center">
            <div className="text-5xl">💳</div>

            <h2 className="mt-3 text-2xl font-extrabold text-gray-900">
              Payment Request
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-gray-600">
              WhatsApp पर payment request भेजें। आपको UPI ID या UPI QR code
              भेज दिया जाएगा।
            </p>

            <button
              type="button"
              onClick={handleWhatsAppPayment}
              disabled={sending || !schoolName || !schoolId}
              className="mt-6 w-full rounded-3xl bg-gradient-to-br from-green-400 via-emerald-500 to-green-700 px-6 py-5 text-lg font-black text-white shadow-[0_9px_0_#166534] transition-all hover:-translate-y-1 active:translate-y-1 active:shadow-[0_4px_0_#166534] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto sm:min-w-[380px]"
            >
              {sending
                ? '⏳ Opening WhatsApp...'
                : '📲 Send Payment Request on WhatsApp'}
            </button>

            <p className="mt-4 text-xs text-gray-500">
              School ID WhatsApp message में नहीं भेजा जाएगा।
            </p>
          </div>
        </div>

        {/* Payment History */}
        <div className="rounded-3xl bg-white p-6 shadow-2xl">
          <div className="mb-5">
            <h2 className="text-2xl font-extrabold text-gray-900">
              Payment History
            </h2>

            <p className="mt-1 text-gray-600">
              आपके payment/recharge requests यहाँ दिखाई देंगे।
            </p>
          </div>

          {history.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 p-8 text-center">
              <div className="text-4xl">📄</div>

              <p className="mt-3 font-bold text-gray-700">
                No payment request found.
              </p>

              <p className="mt-1 text-sm text-gray-500">
                WhatsApp से payment request भेजने के बाद admin approval
                process शुरू होगा।
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((request, index) => {
                const item = request as RechargeRequest & {
                  amount?: number;
                  days?: number;
                  status?: string;
                  createdAt?: unknown;
                };

                return (
                  <div
                    key={
                      'id' in item && item.id
                        ? String(item.id)
                        : `${index}-${item.amount}-${item.days}`
                    }
                    className="rounded-2xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-5 shadow-md"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-2xl font-black text-blue-700">
                          ₹{item.amount ?? '-'}
                        </div>

                        <div className="font-bold text-gray-800">
                          {item.days ?? '-'} Days
                        </div>

                        <div className="mt-1 text-sm text-gray-500">
                          {formatDate(item.createdAt)}
                        </div>
                      </div>

                      <div>
                        <span
                          className={
                            item.status === 'APPROVED'
                              ? 'inline-flex rounded-full bg-green-100 px-4 py-2 text-sm font-black text-green-700'
                              : item.status === 'REJECTED'
                                ? 'inline-flex rounded-full bg-red-100 px-4 py-2 text-sm font-black text-red-700'
                                : 'inline-flex rounded-full bg-orange-100 px-4 py-2 text-sm font-black text-orange-700'
                          }
                        >
                          {item.status || 'PENDING'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="py-8 text-center text-sm font-semibold text-gray-500">
          School Website Management System
        </div>
      </div>
    </div>
  );
}
