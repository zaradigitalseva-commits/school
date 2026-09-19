import { FormEvent, useEffect, useMemo, useState } from 'react';
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

import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';

const BILLING_PACKAGES = [
  { amount: 300, days: 28 },
  { amount: 600, days: 56 },
  { amount: 900, days: 84 },
  { amount: 1200, days: 112 },
  { amount: 3000, days: 280 },
] as const;

const WHATSAPP_NUMBER = '919112170192';

function formatDate(value: unknown): string {
  if (!value) return '-';

  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toLocaleString(
      'en-IN',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
      }
    );
  }

  if (value instanceof Date) {
    return value.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    }
  }

  return '-';
}

export default function PaymentRechargePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [schoolId, setSchoolId] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [ownedSchools, setOwnedSchools] = useState<Array<{ id: string; name: string }>>([]);

  const [selectedPackage, setSelectedPackage] = useState(
    BILLING_PACKAGES[1]
  );

  const [utr, setUtr] = useState('');

  const [paymentSettings, setPaymentSettings] =
    useState<PaymentSettings | null>(null);

  const [history, setHistory] = useState<RechargeRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  /*
   * ---------------------------------------------------------
   * LOAD SCHOOL + PAYMENT SETTINGS + HISTORY
   * ---------------------------------------------------------
   */
  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);
        setError('');

        if (!user?.uid) {
          setError('Please login first.');
          return;
        }

        const requestedSchoolId =
          searchParams.get('schoolId')?.trim() || '';

        let currentSchoolId = requestedSchoolId;
        let currentSchoolName = '';

        let schools: Array<{ id: string; name: string }> = [];

        /*
         * If schoolId is supplied, read that exact school document.
         * This avoids a collection query being rejected by Firestore
         * rules because the query cannot prove every possible result
         * is readable.
         */
        if (requestedSchoolId) {
          const selectedRef = doc(
            db,
            'schools',
            requestedSchoolId
          );

          const selectedSnapshot = await getDoc(selectedRef);

          if (!selectedSnapshot.exists()) {
            throw new Error('School not found.');
          }

          const selectedData = selectedSnapshot.data();

          if (String(selectedData.ownerUid || '') !== user.uid) {
            throw new Error(
              'You are not authorized to access this school payment page.'
            );
          }

          const selectedSchool = {
            id: selectedSnapshot.id,
            name: String(
              selectedData.name ||
                selectedData.schoolName ||
                'Unnamed School'
            ).trim(),
          };

          schools = [selectedSchool];
          currentSchoolId = selectedSchool.id;
          currentSchoolName = selectedSchool.name;
        } else {
          /*
           * No schoolId supplied: load schools owned by this account.
           */
          const ownedQuery = query(
            collection(db, 'schools'),
            where('ownerUid', '==', user.uid)
          );

          const ownedSnapshot = await getDocs(ownedQuery);

          schools = ownedSnapshot.docs.map((schoolDoc) => {
            const data = schoolDoc.data();
            return {
              id: schoolDoc.id,
              name: String(
                data.name ||
                  data.schoolName ||
                  'Unnamed School'
              ).trim(),
            };
          });

          if (schools.length === 1) {
            currentSchoolId = schools[0].id;
            currentSchoolName = schools[0].name;
          } else if (schools.length === 0) {
            throw new Error(
              'आपके account से कोई school नहीं मिला।'
            );
          }
        }

        setOwnedSchools(schools);
        setSchoolId(currentSchoolId);
        setSchoolName(currentSchoolName);

        /*
         * Payment settings/history are independent of the school
         * document. Load them separately so one optional read does
         * not blank the entire payment page.
         */
        try {
          const settings = await fetchPaymentSettings();
          setPaymentSettings(settings);
        } catch (settingsError) {
          console.error('Payment settings load failed:', settingsError);
          setPaymentSettings(null);
        }

        try {
          const requests = await fetchMyRechargeRequests(user.uid);
          setHistory(requests);
        } catch (historyError) {
          console.error('Payment history load failed:', historyError);
          setHistory([]);
        }
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : 'Payment page load नहीं हो सका।'
        );
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [user?.uid, searchParams]);

  /*
   * ---------------------------------------------------------
   * UPI PAYMENT URL
   * ---------------------------------------------------------
   *
   * UPI ID कभी hardcode नहीं होगी.
   * Admin Payment Settings से आएगी.
   */
  const buildUpiPaymentUrl = () => {
    const upiId = paymentSettings?.upiId?.trim();

    if (!upiId) {
      return '';
    }

    const params = new URLSearchParams({
      pa: upiId,
      pn: 'School Website',
      am: String(selectedPackage.amount),
      cu: 'INR',
    });

    return `upi://pay?${params.toString()}`;
  };

  /*
   * ---------------------------------------------------------
   * PAY NOW
   * ---------------------------------------------------------
   */
  const handleUPIPayment = () => {
    setError('');
    setMessage('');

    if (!schoolId) {
      setError('School information नहीं मिली।');
      return;
    }

    if (!paymentSettings?.upiId?.trim()) {
      setError(
        'Payment सुविधा अभी Admin द्वारा configure नहीं की गई है। कृपया Admin से संपर्क करें।'
      );
      return;
    }

    const paymentUrl = buildUpiPaymentUrl();

    if (!paymentUrl) {
      setError('UPI Payment Link नहीं बन सका।');
      return;
    }

    /*
     * Mobile में installed UPI app open होगी.
     */
    window.location.href = paymentUrl;
  };

  /*
   * ---------------------------------------------------------
   * DYNAMIC QR
   * ---------------------------------------------------------
   *
   * QR तभी दिखेगा जब Admin ने UPI ID configure की हो.
   */
  const upiPaymentUrl = useMemo(
    () => buildUpiPaymentUrl(),
    [
      paymentSettings?.upiId,
      selectedPackage.amount,
    ]
  );

  const dynamicQrUrl = useMemo(() => {
    if (!upiPaymentUrl) {
      return '';
    }

    return (
      'https://api.qrserver.com/v1/create-qr-code/' +
      '?size=280x280&margin=10&data=' +
      encodeURIComponent(upiPaymentUrl)
    );
  }, [upiPaymentUrl]);

  /*
   * ---------------------------------------------------------
   * SUBMIT PAYMENT REQUEST
   * ---------------------------------------------------------
   */
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError('');
    setMessage('');

    if (!user?.uid) {
      setError('Please login first.');
      return;
    }

    if (!schoolId) {
      setError('School information नहीं मिली।');
      return;
    }

    const cleanUtr = utr.trim();

    if (!cleanUtr) {
      setError('UTR Number दर्ज करें।');
      return;
    }

    if (cleanUtr.length < 4) {
      setError('Valid UTR Number दर्ज करें।');
      return;
    }

    try {
      setSubmitting(true);

      /*
       * createRechargeRequest()
       * Firebase transaction के अंदर UTR को
       * utrReservations collection में reserve करता है.
       *
       * इसलिए एक UTR सिर्फ एक बार पूरे system में
       * submit हो सकता है.
       */
      await createRechargeRequest({
        schoolId,
        uid: user.uid,
        amount: selectedPackage.amount,
        days: selectedPackage.days,
        utr: cleanUtr,
      });

      setMessage(
        '✅ Payment request सफलतापूर्वक submit हो गई है। Admin approval का इंतजार करें।'
      );

      setUtr('');

      /*
       * Refresh history
       */
      const updatedHistory =
        await fetchMyRechargeRequests(user.uid);

      setHistory(updatedHistory);

      /*
       * WhatsApp message
       *
       * School ID intentionally नहीं भेजा जा रहा.
       */
      const whatsappMessage =
        `SCHOOL WEBSITE PAYMENT REQUEST\n\n` +
        `School Name: ${schoolName || 'Not available'}\n` +
        `Admin Email: ${user.email || 'Not available'}\n\n` +
        `Selected Package: ₹${selectedPackage.amount}\n` +
        `Subscription: ${selectedPackage.days} Days\n` +
        `Amount: ₹${selectedPackage.amount}\n` +
        `UTR Number: ${cleanUtr}\n` +
        `Submitted Time: ${new Date().toLocaleString(
          'en-IN'
        )}\n\n` +
        `Please verify my payment and approve the subscription.\n\n` +
        `Thank you.`;

      const whatsappUrl =
        `https://wa.me/${WHATSAPP_NUMBER}` +
        `?text=${encodeURIComponent(whatsappMessage)}`;

      window.open(
        whatsappUrl,
        '_blank',
        'noopener,noreferrer'
      );
    } catch (err) {
      console.error(err);

      const errorText =
        err instanceof Error
          ? err.message
          : 'Payment request submit नहीं हो सकी।';

      /*
       * Duplicate UTR के लिए साफ message.
       */
      if (
        errorText
          .toLowerCase()
          .includes('utr number has already been submitted')
      ) {
        setError(
          '❌ यह UTR Number पहले ही submit हो चुका है। कृपया दूसरा valid UTR डालें।'
        );
      } else {
        setError(errorText);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
        <div className="rounded-3xl bg-white px-8 py-6 text-center shadow-2xl">
          <div className="text-3xl">⏳</div>
          <div className="mt-2 font-black text-slate-800">
            Payment Page Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/10 p-5 text-white shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-bold text-blue-200">
              SCHOOL WEBSITE
            </div>

            <h1 className="mt-1 text-2xl font-black md:text-3xl">
              💳 Recharge / Payment
            </h1>

            <p className="mt-1 text-sm text-slate-300">
              {schoolName || 'School'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="
              rounded-2xl
              bg-gradient-to-r from-slate-200 to-white
              px-5 py-3
              font-black text-slate-900
              shadow-[0_5px_0_rgb(100,116,139)]
              transition
              active:translate-y-1
              active:shadow-none
            "
          >
            ← Back
          </button>
        </div>

        {/* SCHOOL SELECTOR */}
        {ownedSchools.length > 1 && (
          <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-lg">
            <label className="mb-2 block text-sm font-black text-blue-900">
              🏫 Select School for Payment
            </label>
            <select
              value={schoolId}
              onChange={(event) => {
                const id = event.target.value;
                const selected = ownedSchools.find(
                  (item) => item.id === id
                );
                setSchoolId(id);
                setSchoolName(selected?.name || '');
                setMessage('');
                setError('');
              }}
              className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a school...</option>
              {ownedSchools.map((schoolOption) => (
                <option key={schoolOption.id} value={schoolOption.id}>
                  {schoolOption.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ALERTS */}
        {error && (
          <div className="mb-5 rounded-2xl border border-red-300 bg-red-50 px-5 py-4 font-bold text-red-700 shadow-lg">
            ❌ {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-2xl border border-green-300 bg-green-50 px-5 py-4 font-bold text-green-700 shadow-lg">
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* LEFT - PACKAGE + PAYMENT */}
          <div className="space-y-6">
            {/* PACKAGES */}
            <section className="rounded-3xl bg-white p-5 shadow-2xl md:p-6">
              <h2 className="text-xl font-black text-slate-900">
                📦 Select Package
              </h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {BILLING_PACKAGES.map((item) => {
                  const selected =
                    selectedPackage.amount === item.amount &&
                    selectedPackage.days === item.days;

                  return (
                    <button
                      key={`${item.amount}-${item.days}`}
                      type="button"
                      onClick={() => {
                        setSelectedPackage(item);
                        setError('');
                        setMessage('');
                      }}
                      className={`
                        rounded-2xl
                        border-2
                        p-4
                        text-left
                        transition
                        ${
                          selected
                            ? 'border-blue-600 bg-blue-50 shadow-[0_5px_0_rgb(37,99,235)]'
                            : 'border-slate-200 bg-white shadow-[0_4px_0_rgb(203,213,225)]'
                        }
                        active:translate-y-1
                        active:shadow-none
                      `}
                    >
                      <div className="text-2xl font-black text-slate-900">
                        ₹{item.amount}
                      </div>

                      <div className="mt-1 font-bold text-slate-600">
                        {item.days} Days
                      </div>

                      {selected && (
                        <div className="mt-2 text-sm font-black text-blue-600">
                          ✓ Selected
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* PAYMENT */}
            <section className="rounded-3xl bg-white p-5 shadow-2xl md:p-6">
              <h2 className="text-xl font-black text-slate-900">
                💰 Make Payment
              </h2>

              <div className="mt-4 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 p-5 text-center">
                <div className="text-sm font-bold text-slate-500">
                  Selected Amount
                </div>

                <div className="mt-1 text-4xl font-black text-slate-900">
                  ₹{selectedPackage.amount}
                </div>

                <div className="mt-1 font-bold text-slate-600">
                  {selectedPackage.days} Days Subscription
                </div>
              </div>

              {paymentSettings?.upiId?.trim() ? (
                <>
                  {/* QR */}
                  {dynamicQrUrl && (
                    <div className="mt-5 flex justify-center">
                      <div className="rounded-3xl bg-white p-4 shadow-[0_6px_0_rgb(203,213,225)]">
                        <img
                          src={dynamicQrUrl}
                          alt="UPI Payment QR"
                          className="h-64 w-64 rounded-2xl object-contain"
                        />
                      </div>
                    </div>
                  )}

                  <p className="mt-4 text-center text-sm font-bold text-slate-500">
                    QR scan करके payment करें या नीचे Pay Now दबाएँ।
                  </p>

                  {/* PAY NOW */}
                  <button
                    type="button"
                    onClick={handleUPIPayment}
                    disabled={
                      !schoolId ||
                      !paymentSettings?.upiId?.trim()
                    }
                    className="
                      mt-5
                      w-full
                      rounded-2xl
                      bg-gradient-to-r
                      from-green-500
                      via-emerald-500
                      to-teal-500
                      px-6 py-4
                      text-lg
                      font-black
                      text-white
                      shadow-[0_7px_0_rgb(4,120,87)]
                      transition
                      hover:brightness-105
                      active:translate-y-1
                      active:shadow-none
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    💳 Pay ₹{selectedPackage.amount} Now
                  </button>

                  <p className="mt-3 text-center text-xs font-bold text-slate-400">
                    Pay Now दबाने पर आपके mobile में available UPI
                    payment app खुल जाएगी।
                  </p>
                </>
              ) : (
                <div className="mt-5 rounded-2xl border-2 border-orange-200 bg-orange-50 p-5 text-center">
                  <div className="text-3xl">⚠️</div>

                  <div className="mt-2 font-black text-orange-700">
                    Payment अभी configure नहीं है
                  </div>

                  <p className="mt-1 text-sm font-semibold text-orange-600">
                    कृपया Platform Admin से payment setup करने के लिए
                    संपर्क करें।
                  </p>
                </div>
              )}

              {/* SUPPORT */}
              {paymentSettings?.supportPhone?.trim() && (
                <div className="mt-5 rounded-2xl bg-slate-100 p-4 text-center">
                  <div className="text-sm font-bold text-slate-500">
                    Payment Help
                  </div>

                  <a
                    href={`tel:${paymentSettings.supportPhone.trim()}`}
                    className="mt-1 inline-block font-black text-blue-600"
                  >
                    📞 {paymentSettings.supportPhone.trim()}
                  </a>
                </div>
              )}

              {/* INSTRUCTIONS */}
              {paymentSettings?.instructions?.trim() && (
                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <h3 className="font-black text-slate-900">
                    📋 Payment Instructions
                  </h3>

                  <div className="mt-3 whitespace-pre-line text-sm font-semibold leading-6 text-slate-600">
                    {paymentSettings.instructions}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* RIGHT - FORM + HISTORY */}
          <div className="space-y-6">
            {/* SUBMIT FORM */}
            <section className="rounded-3xl bg-white p-5 shadow-2xl md:p-6">
              <h2 className="text-xl font-black text-slate-900">
                🧾 Submit Payment Details
              </h2>

              <form
                onSubmit={handleSubmit}
                className="mt-5 space-y-5"
              >
                {/* UTR */}
                <div>
                  <label className="mb-2 block font-black text-slate-700">
                    UTR Number *
                  </label>

                  <input
                    type="text"
                    value={utr}
                    onChange={(event) =>
                      setUtr(event.target.value)
                    }
                    placeholder="Payment का UTR Number डालें"
                    autoComplete="off"
                    spellCheck={false}
                    className="
                      w-full
                      rounded-2xl
                      border-2
                      border-slate-200
                      bg-white
                      px-4 py-4
                      font-bold
                      text-slate-900
                      outline-none
                      transition
                      focus:border-blue-500
                      focus:ring-4
                      focus:ring-blue-100
                    "
                  />

                  <p className="mt-2 text-xs font-bold text-slate-400">
                    ⚠️ एक UTR Number केवल एक बार submit किया जा सकता है।
                  </p>
                </div>

                {/* SUMMARY */}
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="font-bold text-slate-500">
                      School
                    </span>

                    <span className="max-w-[60%] text-right font-black text-slate-900">
                      {schoolName || '-'}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="font-bold text-slate-500">
                      Package
                    </span>

                    <span className="font-black text-slate-900">
                      ₹{selectedPackage.amount}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-bold text-slate-500">
                      Validity
                    </span>

                    <span className="font-black text-slate-900">
                      {selectedPackage.days} Days
                    </span>
                  </div>
                </div>

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={submitting || !schoolId}
                  className="
                    w-full
                    rounded-2xl
                    bg-gradient-to-r
                    from-blue-600
                    via-purple-600
                    to-pink-600
                    px-6 py-4
                    text-lg
                    font-black
                    text-white
                    shadow-[0_7px_0_rgb(67,56,202)]
                    transition
                    hover:brightness-105
                    active:translate-y-1
                    active:shadow-none
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {submitting
                    ? '⏳ Submitting...'
                    : '✅ Submit Payment Request'}
                </button>
              </form>
            </section>

            {/* HISTORY */}
            <section className="rounded-3xl bg-white p-5 shadow-2xl md:p-6">
              <h2 className="text-xl font-black text-slate-900">
                📜 Payment History
              </h2>

              {history.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-center">
                  <div className="text-3xl">📭</div>

                  <div className="mt-2 font-black text-slate-700">
                    अभी कोई payment request नहीं है।
                  </div>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {history.map((item) => {
                    const status = String(
                      item.status || ''
                    ).toUpperCase();

                    const statusClass =
                      status === 'APPROVED'
                        ? 'bg-green-100 text-green-700'
                        : status === 'REJECTED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-orange-100 text-orange-700';

                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl border-2 border-slate-100 bg-slate-50 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="text-lg font-black text-slate-900">
                              ₹{item.amount}
                            </div>

                            <div className="text-sm font-bold text-slate-500">
                              {item.days} Days
                            </div>
                          </div>

                          <span
                            className={`
                              inline-flex
                              w-fit
                              rounded-full
                              px-3 py-1
                              text-xs
                              font-black
                              ${statusClass}
                            `}
                          >
                            {status}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-2 text-sm">
                          <div className="flex justify-between gap-4">
                            <span className="font-bold text-slate-400">
                              UTR
                            </span>

                            <span className="break-all text-right font-black text-slate-700">
                              {item.utr || '-'}
                            </span>
                          </div>

                          <div className="flex justify-between gap-4">
                            <span className="font-bold text-slate-400">
                              Submitted
                            </span>

                            <span className="text-right font-bold text-slate-700">
                              {formatDate(item.createdAt)}
                            </span>
                          </div>

                          {item.approvedAt && (
                            <div className="flex justify-between gap-4">
                              <span className="font-bold text-slate-400">
                                Approved
                              </span>

                              <span className="text-right font-bold text-green-700">
                                {formatDate(item.approvedAt)}
                              </span>
                            </div>
                          )}

                          {item.rejectionReason && (
                            <div className="mt-2 rounded-xl bg-red-50 p-3">
                              <div className="font-black text-red-700">
                                Rejection Reason
                              </div>

                              <div className="mt-1 text-sm font-semibold text-red-600">
                                {item.rejectionReason}
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
