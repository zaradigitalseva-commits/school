import { useEffect, useState } from 'react';
import {
  approveRecharge,
  fetchPendingRecharges,
  fetchPaymentSettings,
  rejectRecharge,
  savePaymentSettings,
} from '@/firebase/payment';
import { fetchAllSchools, updateSchoolStatus } from '@/firebase/firestore';
import type { RechargeRequest, PaymentSettings } from '@/firebase/payment';
import type { School } from '@/firebase/types';

export default function PlatformAdminPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [requests, setRequests] = useState<RechargeRequest[]>([]);
  const [settings, setSettings] = useState<PaymentSettings>({
    upiId: '',
    qrImageUrl: '',
    supportPhone: '',
    instructions: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      setError('');

      const [schoolData, rechargeData, paymentSettings] =
        await Promise.all([
          fetchAllSchools(),
          fetchPendingRecharges(),
          fetchPaymentSettings(),
        ]);

      setSchools(schoolData);
      setRequests(rechargeData);

      setSettings({
        upiId: paymentSettings?.upiId || '',
        qrImageUrl: paymentSettings?.qrImageUrl || '',
        supportPhone: paymentSettings?.supportPhone || '',
        instructions: paymentSettings?.instructions || '',
      });
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load admin data.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSaveSettings(
    event: React.FormEvent
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage('');
      setError('');

      await savePaymentSettings(settings);

      setMessage('Payment settings saved successfully.');
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save settings.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove(requestId: string) {
    if (
      !window.confirm(
        'Approve this payment? This will activate the school subscription.'
      )
    ) {
      return;
    }

    try {
      setError('');
      setMessage('');

      await approveRecharge(requestId);

      setMessage(
        'Payment approved. School subscription has been activated.'
      );

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to approve payment.'
      );
    }
  }

  async function handleReject(requestId: string) {
    const reason =
      window.prompt(
        'Enter rejection reason:',
        'Payment could not be verified.'
      ) || 'Payment rejected by Platform Admin.';

    try {
      setError('');
      setMessage('');

      await rejectRecharge(requestId, reason);

      setMessage('Payment request rejected.');

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to reject payment.'
      );
    }
  }

  async function handleSchoolStatus(
    schoolId: string,
    status: 'LIVE' | 'SUSPENDED'
  ) {
    const action =
      status === 'LIVE' ? 'restore' : 'suspend';

    if (
      !window.confirm(
        `Are you sure you want to ${action} this school?`
      )
    ) {
      return;
    }

    try {
      setError('');
      setMessage('');

      await updateSchoolStatus(schoolId, status);

      setMessage(
        status === 'LIVE'
          ? 'School restored successfully.'
          : 'School suspended successfully.'
      );

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update school status.'
      );
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-4">
        <div className="rounded-3xl bg-white p-10 text-center shadow-2xl">
          <div className="text-5xl">⚙️</div>

          <p className="mt-4 text-xl font-extrabold text-gray-800">
            Loading Platform Admin...
          </p>
        </div>
      </div>
    );
  }

  const liveSchools = schools.filter(
    (school) => school.status === 'LIVE'
  );

  const pendingSchools = schools.filter(
    (school) => school.status === 'PENDING_PAYMENT'
  );

  const suspendedSchools = schools.filter(
    (school) => school.status === 'SUSPENDED'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-4 py-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 text-center text-white">
          <div className="text-6xl">👨‍💼</div>

          <h1 className="mt-3 text-3xl font-black md:text-5xl">
            Platform Admin
          </h1>

          <p className="mt-2 text-white/90">
            Manage all schools, payments and platform settings
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-5 rounded-2xl bg-red-50 p-4 font-bold text-red-700 shadow-lg">
            ❌ {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-2xl bg-green-50 p-4 font-bold text-green-700 shadow-lg">
            ✅ {message}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-3xl bg-white p-6 shadow-2xl">
            <div className="text-4xl">🏫</div>
            <p className="mt-3 text-sm font-bold text-gray-500">
              Total Schools
            </p>
            <p className="text-3xl font-black text-gray-900">
              {schools.length}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-2xl">
            <div className="text-4xl">🟢</div>
            <p className="mt-3 text-sm font-bold text-gray-500">
              Live Schools
            </p>
            <p className="text-3xl font-black text-green-600">
              {liveSchools.length}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-2xl">
            <div className="text-4xl">⏳</div>
            <p className="mt-3 text-sm font-bold text-gray-500">
              Pending Payment
            </p>
            <p className="text-3xl font-black text-yellow-600">
              {pendingSchools.length}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-2xl">
            <div className="text-4xl">💳</div>
            <p className="mt-3 text-sm font-bold text-gray-500">
              Pending Requests
            </p>
            <p className="text-3xl font-black text-blue-600">
              {requests.length}
            </p>
          </div>

        </div>

        {/* Payment Settings */}
        <section className="mt-6 rounded-3xl bg-white p-6 shadow-2xl md:p-8">

          <h2 className="text-2xl font-black text-gray-900">
            💳 Payment Settings
          </h2>

          <p className="mt-1 text-gray-600">
            These details are shown to schools on the payment page.
          </p>

          <form
            onSubmit={handleSaveSettings}
            className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2"
          >

            <div>
              <label className="mb-2 block font-bold text-gray-800">
                UPI ID
              </label>

              <input
                value={settings.upiId}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    upiId: event.target.value,
                  })
                }
                placeholder="example@upi"
                className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block font-bold text-gray-800">
                QR Image URL
              </label>

              <input
                value={settings.qrImageUrl}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    qrImageUrl: event.target.value,
                  })
                }
                placeholder="https://..."
                className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block font-bold text-gray-800">
                Support Phone
              </label>

              <input
                value={settings.supportPhone}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    supportPhone: event.target.value,
                  })
                }
                placeholder="Support phone number"
                className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block font-bold text-gray-800">
                Instructions
              </label>

              <textarea
                value={settings.instructions}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    instructions: event.target.value,
                  })
                }
                rows={3}
                placeholder="Payment instructions"
                className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 font-black text-white shadow-[0_6px_0_rgb(67,56,202)] disabled:opacity-60 active:translate-y-1 active:shadow-none"
              >
                {saving
                  ? '⏳ Saving...'
                  : '💾 Save Payment Settings'}
              </button>
            </div>

          </form>
        </section>

        {/* Pending Recharge Requests */}
        <section className="mt-6 rounded-3xl bg-white p-6 shadow-2xl md:p-8">

          <h2 className="text-2xl font-black text-gray-900">
            💰 Pending Payment Requests
          </h2>

          {requests.length === 0 ? (
            <div className="mt-5 rounded-2xl bg-gray-50 p-6 text-center text-gray-600">
              No pending payment requests.
            </div>
          ) : (
            <div className="mt-5 space-y-4">

              {requests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-3xl border-2 border-gray-100 p-5"
                >

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

                    <div>
                      <p className="text-sm font-bold text-gray-500">
                        Amount
                      </p>

                      <p className="text-2xl font-black text-green-600">
                        ₹{request.amount}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-bold text-gray-500">
                        Subscription
                      </p>

                      <p className="font-black text-gray-900">
                        {request.days} days
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-bold text-gray-500">
                        UTR
                      </p>

                      <p className="break-all font-black text-blue-700">
                        {request.utr}
                      </p>
                    </div>

                  </div>

                  {request.note && (
                    <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                      <p className="text-sm font-bold text-gray-500">
                        Note
                      </p>

                      <p className="mt-1 text-gray-700">
                        {request.note}
                      </p>
                    </div>
                  )}

                  {request.proofUrl && (
                    <div className="mt-4">
                      <a
                        href={request.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-blue-600 underline"
                      >
                        🔗 Open Payment Proof
                      </a>
                    </div>
                  )}

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">

                    <button
                      type="button"
                      onClick={() =>
                        handleApprove(request.id)
                      }
                      className="flex-1 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-3 font-black text-white shadow-[0_5px_0_rgb(4,120,87)] active:translate-y-1 active:shadow-none"
                    >
                      ✅ Approve Payment
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleReject(request.id)
                      }
                      className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-5 py-3 font-black text-white shadow-[0_5px_0_rgb(159,18,57)] active:translate-y-1 active:shadow-none"
                    >
                      ❌ Reject Payment
                    </button>

                  </div>

                </div>
              ))}

            </div>
          )}

        </section>

        {/* Schools */}
        <section className="mt-6 rounded-3xl bg-white p-6 shadow-2xl md:p-8">

          <h2 className="text-2xl font-black text-gray-900">
            🏫 All Schools
          </h2>

          <div className="mt-5 space-y-4">

            {schools.map((school) => (
              <div
                key={school.id}
                className="rounded-3xl border-2 border-gray-100 p-5"
              >

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                  <div>
                    <h3 className="text-xl font-black text-gray-900">
                      {school.name}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      /school/{school.slug}
                    </p>

                    <p className="mt-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          school.status === 'LIVE'
                            ? 'bg-green-100 text-green-700'
                            : school.status === 'SUSPENDED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {school.status}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">

                    {school.status === 'SUSPENDED' ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleSchoolStatus(
                            school.id,
                            'LIVE'
                          )
                        }
                        className="rounded-xl bg-green-600 px-5 py-3 font-black text-white shadow-[0_5px_0_rgb(21,128,61)] active:translate-y-1 active:shadow-none"
                      >
                        🟢 Restore
                      </button>
                    ) : school.status === 'LIVE' ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleSchoolStatus(
                            school.id,
                            'SUSPENDED'
                          )
                        }
                        className="rounded-xl bg-red-600 px-5 py-3 font-black text-white shadow-[0_5px_0_rgb(185,28,28)] active:translate-y-1 active:shadow-none"
                      >
                        ⛔ Suspend
                      </button>
                    ) : null}

                  </div>

                </div>

              </div>
            ))}

            {schools.length === 0 && (
              <div className="rounded-2xl bg-gray-50 p-6 text-center text-gray-600">
                No schools registered yet.
              </div>
            )}

          </div>
        </section>

      </div>
    </div>
  );
}
