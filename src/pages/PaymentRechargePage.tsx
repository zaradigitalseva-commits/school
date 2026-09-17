import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

import {
  createRechargeRequest,
  fetchMyRechargeRequests,
  fetchPaymentSettings,
} from '@/firebase/payment';

import type {
  PaymentSettings,
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

const PACKAGES = [
  { amount: 300, days: 28 },
  { amount: 600, days: 56 },
  { amount: 900, days: 84 },
  { amount: 1200, days: 112 },
  { amount: 3000, days: 280 },
];

const WHATSAPP_NUMBER = '919112170192';

interface SchoolData {
  id: string;
  name?: string;
  schoolName?: string;
  ownerUid?: string;
}

function getSchoolName(school: SchoolData | null) {
  if (!school) return 'School';
  return school.schoolName || school.name || 'School';
}

function formatDate(value: any) {
  if (!value) return '-';

  try {
    if (typeof value?.toDate === 'function') {
      return value.toDate().toLocaleString('en-IN');
    }

    if (value instanceof Date) {
      return value.toLocaleString('en-IN');
    }

    if (typeof value === 'number') {
      return new Date(value).toLocaleString('en-IN');
    }

    return new Date(value).toLocaleString('en-IN');
  } catch {
    return '-';
  }
}

function getStatusClass(status: RechargeRequest['status']) {
  switch (status) {
    case 'APPROVED':
      return 'bg-green-100 text-green-700 border-green-300';

    case 'REJECTED':
      return 'bg-red-100 text-red-700 border-red-300';

    default:
      return 'bg-yellow-100 text-yellow-700 border-yellow-300';
  }
}

export default function PaymentRechargePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { user } = useAuth();

  const [schoolId, setSchoolId] = useState('');
  const [schoolName, setSchoolName] = useState('');

  const [selectedPackage, setSelectedPackage] = useState(PACKAGES[1]);

  const [paymentSettings, setPaymentSettings] =
    useState<PaymentSettings | null>(null);

  const [utr, setUtr] = useState('');
  const [proofImageUrl, setProofImageUrl] = useState('');

  const [history, setHistory] = useState<RechargeRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /*
   * Load school + payment settings + payment history
   */
  useEffect(() => {
    if (!user?.uid) return;

    loadPage();
  }, [user?.uid]);

  const loadPage = async () => {
    if (!user?.uid) return;

    setLoading(true);
    setError('');

    try {
      let foundSchool: SchoolData | null = null;

      /*
       * 1. First try schoolId from URL
       */
      const urlSchoolId = searchParams.get('schoolId');

      if (urlSchoolId) {
        const schoolRef = doc(db, 'schools', urlSchoolId);
        const schoolSnap = await getDoc(schoolRef);

        if (schoolSnap.exists()) {
          const data = schoolSnap.data();

          if (data.ownerUid === user.uid) {
            foundSchool = {
              id: schoolSnap.id,
              ...data,
            } as SchoolData;
          }
        }
      }

      /*
       * 2. If schoolId was not found,
       * find school by ownerUid.
       */
      if (!foundSchool) {
        const q = query(
          collection(db, 'schools'),
          where('ownerUid', '==', user.uid),
          limit(1)
        );

        const snap = await getDocs(q);

        if (!snap.empty) {
          const first = snap.docs[0];

          foundSchool = {
            id: first.id,
            ...first.data(),
          } as SchoolData;
        }
      }

      /*
       * 3. Set school information
       */
      if (foundSchool) {
        setSchoolId(foundSchool.id);
        setSchoolName(getSchoolName(foundSchool));
      } else {
        setError(
          'आपके account से कोई School नहीं मिली। कृपया पहले School Registration पूरा करें।'
        );
      }

      /*
       * 4. Payment settings
       */
      const settings = await fetchPaymentSettings();
      setPaymentSettings(settings);

      /*
       * 5. Payment history
       */
      const paymentHistory =
        await fetchMyRechargeRequests(user.uid);

      setHistory(paymentHistory);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          'Payment page load नहीं हो सका। कृपया दोबारा कोशिश करें।'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Open the user's installed UPI app.
   * The receiver UPI ID is kept out of the visible UI.
   */
  const handleUPIPayment = () => {
    if (!schoolId) {
      setError('School information नहीं मिली।');
      return;
    }

    const upiId = '8806940156@okbizaxis';

    const params = new URLSearchParams({
      pa: upiId,
      pn: schoolName || 'School Website',
      am: String(selectedPackage.amount),
      cu: 'INR',
    });

    window.location.href = `upi://pay?${params.toString()}`;
  };

  /*
   * Submit UPI payment request
   */
  const handleSubmitPayment = async () => {
    setError('');
    setSuccess('');

    if (!user?.uid) {
      setError('कृपया पहले Google Login करें।');
      return;
    }

    if (!schoolId) {
      setError('School information नहीं मिली।');
      return;
    }

    const cleanUTR = utr
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '');

    if (!cleanUTR) {
      setError('कृपया UTR Number डालें।');
      return;
    }

    /*
     * Basic UTR validation
     */
    if (cleanUTR.length < 6) {
      setError('कृपया सही UTR Number डालें।');
      return;
    }

    setSubmitting(true);

    try {
      /*
       * Backend transaction also checks whether
       * this UTR has already been used.
       */
      await createRechargeRequest({
        schoolId,
        uid: user.uid,
        amount: selectedPackage.amount,
        days: selectedPackage.days,
        utr: cleanUTR,
        proofImageUrl: proofImageUrl.trim(),
      });

      /*
       * SUCCESS
       */
      setUtr('');
      setProofImageUrl('');

      await loadPage();

      setSuccess(
        '✅ Payment Request सफलतापूर्वक Submit हो गई है। Admin Payment verify करने के बाद Subscription Activate करेगा।'
      );

      /*
       * Open WhatsApp only AFTER the payment request has been
       * successfully saved. The message contains the complete
       * payment/request details.
       */
      const whatsappMessage = `
💳 SCHOOL WEBSITE PAYMENT REQUEST

👤 Name: ${user?.displayName || 'Not available'}
📧 Email: ${user?.email || 'Not available'}

🏫 School Name: ${schoolName || 'Not available'}

📦 Package: ₹${selectedPackage.amount}
📅 Validity: ${selectedPackage.days} Days
💰 Amount: ₹${selectedPackage.amount}

🔢 UTR Number: ${cleanUTR}

🖼️ Screenshot:
${proofImageUrl.trim() || 'Not provided'}

🕐 Submitted: ${new Date().toLocaleString('en-IN')}

✅ Payment request successfully submitted.
Please verify the payment and approve/reject it from the Admin Panel.
      `.trim();

      const whatsappUrl =
        `https://wa.me/${WHATSAPP_NUMBER}` +
        `?text=${encodeURIComponent(whatsappMessage)}`;

      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      const message = String(err?.message || '');

      /*
       * DUPLICATE UTR
       */
      if (
        message.includes('already been submitted') ||
        message.includes('UTR Number has already') ||
        message.toLowerCase().includes('duplicate utr') ||
        message.toLowerCase().includes('utr already')
      ) {
        /*
         * Old UTR clear कर दें ताकि user
         * नया UTR डाल सके.
         */
        setUtr('');

        setError(
          '⚠️ यह UTR Number पहले ही इस्तेमाल हो चुका है। यह UTR दोबारा स्वीकार नहीं किया जाएगा। कृपया नया UPI Payment करें और नया UTR Number डालकर फिर Submit करें।'
        );

        return;
      }

      setError(
        message ||
          '❌ Payment Request Submit नहीं हो सकी। कृपया दोबारा कोशिश करें।'
      );
    } finally {
      setSubmitting(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100 p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="text-5xl mb-4 animate-pulse">
            💳
          </div>

          <h2 className="text-xl font-bold text-gray-800">
            Payment Page Loading...
          </h2>

          <p className="text-gray-500 mt-2">
            कृपया प्रतीक्षा करें
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-100 p-3 sm:p-6">

      {/* Header */}
      <div className="max-w-6xl mx-auto mb-5">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-5 text-white">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div>
              <h1 className="text-2xl sm:text-3xl font-black">
                💳 School Website Payment
              </h1>

              <p className="mt-1 opacity-90">
                {schoolName || 'School'}
              </p>
            </div>

            <button
              onClick={() => navigate(-1)}
              className="bg-white text-purple-700 px-5 py-3 rounded-2xl font-bold shadow-[0_5px_0_#c4b5fd] active:shadow-[0_2px_0_#c4b5fd] active:translate-y-[3px] transition"
            >
              ← Back
            </button>

          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-5">

        {/* LEFT SIDE */}
        <div className="space-y-5">

          {/* Packages */}
          <div className="bg-white rounded-3xl shadow-xl p-5">

            <h2 className="text-xl font-black text-gray-800 mb-4">
              📦 Select Package
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

              {PACKAGES.map((pkg) => {
                const selected =
                  selectedPackage.amount === pkg.amount &&
                  selectedPackage.days === pkg.days;

                return (
                  <button
                    key={`${pkg.amount}-${pkg.days}`}
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setError('');
                      setSuccess('');
                    }}
                    className={`
                      rounded-2xl p-4 font-bold
                      border-2 transition
                      shadow-[0_5px_0_rgba(0,0,0,0.18)]
                      active:shadow-[0_2px_0_rgba(0,0,0,0.18)]
                      active:translate-y-[3px]
                      ${
                        selected
                          ? 'bg-gradient-to-br from-green-400 to-emerald-600 text-white border-green-700'
                          : 'bg-gradient-to-br from-yellow-100 to-orange-200 text-gray-800 border-orange-300'
                      }
                    `}
                  >
                    <div className="text-xl">
                      ₹{pkg.amount}
                    </div>

                    <div className="text-sm mt-1">
                      {pkg.days} Days
                    </div>

                    {selected && (
                      <div className="text-xs mt-2">
                        ✓ Selected
                      </div>
                    )}
                  </button>
                );
              })}

            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-3xl shadow-xl p-5">

            <h2 className="text-xl font-black text-gray-800 mb-4">
              💰 Make UPI Payment
            </h2>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">

              <div className="text-sm text-gray-500">
                Selected Package
              </div>

              <div className="text-2xl font-black text-blue-700">
                ₹{selectedPackage.amount}
              </div>

              <div className="text-gray-600">
                Validity: {selectedPackage.days} Days
              </div>

            </div>

            {/* Direct UPI Payment */}
            <button
              type="button"
              onClick={handleUPIPayment}
              disabled={!schoolId}
              className="
                w-full
                mb-5
                py-4
                rounded-2xl
                bg-gradient-to-r
                from-blue-600
                via-purple-600
                to-pink-600
                text-white
                text-lg
                font-black
                shadow-[0_6px_0_#312e81]
                active:shadow-[0_2px_0_#312e81]
                active:translate-y-[4px]
                disabled:opacity-50
                disabled:cursor-not-allowed
                transition
              "
            >
              💳 Pay ₹{selectedPackage.amount} Now
            </button>

            <div className="text-center text-sm text-gray-500 mb-5">
              📱 Button दबाने पर आपके mobile का UPI app खुलेगा।
            </div>

            {/* Instructions */}
            {paymentSettings?.instructions && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 mb-5">

                <div className="font-black text-yellow-800 mb-2">
                  📌 Payment Instructions
                </div>

                <div className="text-sm text-gray-700 whitespace-pre-line">
                  {paymentSettings.instructions}
                </div>

              </div>
            )}

            {/* UTR */}
            <div className="mb-4">

              <label className="block font-bold text-gray-700 mb-2">
                UTR / Transaction Number *
              </label>

              <input
                type="text"
                value={utr}
                onChange={(e) => {
                  setUtr(e.target.value);
                  setError('');
                  setSuccess('');
                }}
                placeholder="Payment के बाद UTR Number डालें"
                className="w-full border-2 border-gray-300 focus:border-blue-500 rounded-2xl px-4 py-4 text-lg font-semibold outline-none"
                autoComplete="off"
              />

              <p className="text-xs text-gray-500 mt-2">
                ⚠️ एक UTR Number केवल एक बार इस्तेमाल किया जा सकता है।
              </p>

            </div>

            {/* Proof URL */}
            <div className="mb-5">

              <label className="block font-bold text-gray-700 mb-2">
                Payment Screenshot URL
                <span className="text-gray-400 font-normal">
                  {' '}(Optional)
                </span>
              </label>

              <input
                type="url"
                value={proofImageUrl}
                onChange={(e) =>
                  setProofImageUrl(e.target.value)
                }
                placeholder="https://..."
                className="w-full border-2 border-gray-300 focus:border-blue-500 rounded-2xl px-4 py-3 outline-none"
              />

            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 bg-red-50 border-2 border-red-300 text-red-700 rounded-2xl p-4 font-semibold">

                <div className="font-black mb-1">
                  ⚠️ Payment Submit नहीं हुआ
                </div>

                <div>
                  {error}
                </div>

              </div>
            )}

            {/* Success */}
            {success && (
              <div className="mb-4 bg-green-50 border-2 border-green-300 text-green-700 rounded-2xl p-4 font-semibold">

                {success}

              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmitPayment}
              disabled={
                submitting ||
                !utr.trim() ||
                !schoolId
              }
              className="
                w-full
                py-4
                rounded-2xl
                bg-gradient-to-r
                from-green-500
                via-emerald-500
                to-teal-600
                text-white
                text-lg
                font-black
                shadow-[0_6px_0_#047857]
                active:shadow-[0_2px_0_#047857]
                active:translate-y-[4px]
                disabled:opacity-50
                disabled:cursor-not-allowed
                transition
              "
            >
              {submitting
                ? '⏳ Submitting...'
                : '✅ Submit Payment'}
            </button>

          </div>


        </div>

        {/* RIGHT SIDE */}
        <div className="bg-white rounded-3xl shadow-xl p-5 h-fit">

          <h2 className="text-xl font-black text-gray-800 mb-4">
            📜 Payment History
          </h2>

          {history.length === 0 ? (
            <div className="text-center py-12 text-gray-500">

              <div className="text-5xl mb-3">
                💳
              </div>

              <p className="font-semibold">
                अभी कोई Payment Request नहीं है।
              </p>

            </div>
          ) : (
            <div className="space-y-4">

              {history.map((item) => (
                <div
                  key={item.id}
                  className="border-2 border-gray-100 rounded-2xl p-4 shadow-sm"
                >

                  <div className="flex justify-between items-start gap-3">

                    <div>
                      <div className="text-xl font-black text-blue-700">
                        ₹{item.amount}
                      </div>

                      <div className="text-sm text-gray-500">
                        {item.days} Days
                      </div>
                    </div>

                    <span
                      className={`
                        px-3
                        py-1
                        rounded-full
                        border
                        text-xs
                        font-black
                        ${getStatusClass(item.status)}
                      `}
                    >
                      {item.status}
                    </span>

                  </div>

                  <div className="mt-4 space-y-2 text-sm">

                    <div>
                      <span className="font-bold">
                        UTR:
                      </span>{' '}
                      <span className="font-mono break-all">
                        {item.utr}
                      </span>
                    </div>

                    <div>
                      <span className="font-bold">
                        Submitted:
                      </span>{' '}
                      {formatDate(item.createdAt)}
                    </div>

                    {item.rejectionReason && (
                      <div className="bg-red-50 text-red-700 rounded-xl p-3">
                        <span className="font-bold">
                          Rejection Reason:
                        </span>{' '}
                        {item.rejectionReason}
                      </div>
                    )}

                    {item.status === 'APPROVED' && (
                      <div className="bg-green-50 text-green-700 rounded-xl p-3 font-semibold">
                        ✅ Payment Approved
                      </div>
                    )}

                    {item.status === 'PENDING' && (
                      <div className="bg-yellow-50 text-yellow-700 rounded-xl p-3 font-semibold">
                        ⏳ Admin Payment verify कर रहा है।
                      </div>
                    )}

                    {item.status === 'REJECTED' && (
                      <div className="bg-red-50 text-red-700 rounded-xl p-3 font-semibold">
                        ❌ यह Payment Request Reject हो गई है।
                        <br />
                        कृपया नया Payment करें और नया UTR डालें।
                      </div>
                    )}

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

      </div>

      {/* Bottom information */}
      <div className="max-w-6xl mx-auto mt-5">

        <div className="bg-white/80 backdrop-blur rounded-3xl shadow-lg p-4 text-center text-sm text-gray-600">

          🔐 <strong>Important:</strong> एक UTR Number
          केवल एक बार इस्तेमाल किया जा सकता है। अगर कोई
          UTR पहले Submit हो चुका है, तो वह दोबारा स्वीकार
          नहीं किया जाएगा।

        </div>

      </div>

    </div>
  );
}
