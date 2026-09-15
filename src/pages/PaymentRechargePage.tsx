import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  BILLING_PACKAGES,
  createRechargeRequest,
  fetchMyRechargeRequests,
  fetchPaymentSettings,
} from '@/firebase/payment';
import type {
  PaymentSettings,
  RechargeRequest,
} from '@/firebase/payment';

export default function PaymentRechargePage() {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const schoolId = searchParams.get('schoolId') || '';

  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [requests, setRequests] = useState<RechargeRequest[]>([]);
  const [selectedPackage, setSelectedPackage] = useState(
    BILLING_PACKAGES[1]
  );

  const [utr, setUtr] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [note, setNote] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const paymentSettings = await fetchPaymentSettings();
        setSettings(paymentSettings);

        if (user) {
          const history = await fetchMyRechargeRequests();
          setRequests(history);
        }
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load payment information.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setMessage('');
    setError('');

    if (!user) {
      await signInWithGoogle();
      return;
    }

    if (!schoolId) {
      setError('School ID is missing.');
      return;
    }

    if (!utr.trim()) {
      setError('Please enter the UTR / transaction number.');
      return;
    }

    try {
      setSubmitting(true);

      await createRechargeRequest({
        schoolId,
        uid: user.uid,
        amount: selectedPackage.amount,
        days: selectedPackage.days,
        utr,
        proofUrl: proofUrl.trim() || undefined,
        note: note.trim() || undefined,
      });

      setMessage(
        'Payment submitted successfully. It will become active after Platform Admin approval.'
      );

      setUtr('');
      setProofUrl('');
      setNote('');

      const history = await fetchMyRechargeRequests();
      setRequests(history);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to submit payment.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-4">
        <div className="rounded-3xl bg-white p-10 text-center shadow-2xl">
          <div className="text-5xl">💳</div>

          <p className="mt-4 text-xl font-extrabold text-gray-800">
            Loading payment...
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
          <div className="text-5xl">💳</div>

          <h1 className="mt-3 text-3xl font-black md:text-5xl">
            School Subscription
          </h1>

          <p className="mt-2 text-white/90">
            Pay using UPI and submit your UTR for approval
          </p>
        </div>

        {!user && (
          <div className="mb-6 rounded-3xl bg-white p-6 text-center shadow-2xl">
            <h2 className="text-xl font-extrabold text-gray-900">
              Google Login Required
            </h2>

            <p className="mt-2 text-gray-600">
              Please sign in with Google before submitting your payment.
            </p>

            <button
              type="button"
              onClick={signInWithGoogle}
              className="mt-5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-7 py-3 font-extrabold text-white shadow-[0_5px_0_rgb(67,56,202)] active:translate-y-1 active:shadow-none"
            >
              🔐 Sign in with Google
            </button>
          </div>
        )}

        {/* Packages */}
        <div className="rounded-3xl bg-white p-5 shadow-2xl md:p-8">
          <h2 className="text-2xl font-black text-gray-900">
            Choose Subscription
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {BILLING_PACKAGES.map((pkg) => {
              const selected =
                selectedPackage.amount === pkg.amount;

              return (
                <button
                  key={pkg.amount}
                  type="button"
                  onClick={() => setSelectedPackage(pkg)}
                  className={`rounded-2xl p-5 text-center font-bold transition ${
                    selected
                      ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-[0_6px_0_rgb(67,56,202)]'
                      : 'bg-gray-100 text-gray-800 shadow-[0_5px_0_rgb(156,163,175)] hover:bg-gray-200'
                  }`}
                >
                  <div className="text-3xl font-black">
                    ₹{pkg.amount}
                  </div>

                  <div className="mt-2">
                    {pkg.days} Days
                  </div>
                </button>
              );
            })}
          </div>

          {/* UPI Information */}
          <div className="mt-8 rounded-3xl bg-gradient-to-br from-green-50 to-blue-50 p-6">

            <h2 className="text-xl font-black text-gray-900">
              📲 Make UPI Payment
            </h2>

            {settings?.upiId && (
              <div className="mt-4 rounded-2xl bg-white p-4 shadow">
                <p className="text-sm font-semibold text-gray-500">
                  UPI ID
                </p>

                <p className="mt-1 break-all text-xl font-black text-blue-700">
                  {settings.upiId}
                </p>
              </div>
            )}

            {settings?.qrImageUrl && (
              <div className="mt-5 text-center">
                <img
                  src={settings.qrImageUrl}
                  alt="UPI QR Code"
                  className="mx-auto max-h-72 rounded-2xl border-4 border-white object-contain shadow-xl"
                />
              </div>
            )}

            {settings?.instructions && (
              <div className="mt-5 whitespace-pre-line rounded-2xl bg-white p-4 text-gray-700 shadow">
                {settings.instructions}
              </div>
            )}

            <p className="mt-5 font-bold text-gray-800">
              Amount to pay: ₹{selectedPackage.amount}
            </p>

            <p className="mt-1 text-gray-600">
              Subscription period: {selectedPackage.days} days
            </p>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">

            <div>
              <label className="mb-2 block font-bold text-gray-800">
                UTR / Transaction Number *
              </label>

              <input
                value={utr}
                onChange={(event) =>
                  setUtr(event.target.value)
                }
                placeholder="Enter UTR / transaction number"
                className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block font-bold text-gray-800">
                Payment Proof URL (optional)
              </label>

              <input
                value={proofUrl}
                onChange={(event) =>
                  setProofUrl(event.target.value)
                }
                placeholder="Optional image/proof URL"
                className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block font-bold text-gray-800">
                Note (optional)
              </label>

              <textarea
                value={note}
                onChange={(event) =>
                  setNote(event.target.value)
                }
                rows={3}
                placeholder="Optional payment note"
                className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            {error && (
              <div className="rounded-2xl bg-red-50 p-4 font-semibold text-red-700">
                ❌ {error}
              </div>
            )}

            {message && (
              <div className="rounded-2xl bg-green-50 p-4 font-semibold text-green-700">
                ✅ {message}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 text-lg font-black text-white shadow-[0_6px_0_rgb(4,120,87)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 active:translate-y-1 active:shadow-none"
            >
              {submitting
                ? '⏳ Submitting...'
                : `💰 Submit ₹${selectedPackage.amount} Payment`}
            </button>

          </form>
        </div>

        {/* History */}
        {user && (
          <div className="mt-6 rounded-3xl bg-white p-6 shadow-2xl">

            <h2 className="text-2xl font-black text-gray-900">
              Payment History
            </h2>

            {requests.length === 0 ? (
              <p className="mt-4 text-gray-600">
                No payment requests yet.
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
                          ₹{request.amount} • {request.days} days
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          UTR: {request.utr}
                        </p>
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
