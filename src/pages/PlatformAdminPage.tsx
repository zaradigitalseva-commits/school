import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  approveRecharge,
  fetchPendingRecharges,
  fetchPaymentSettings,
  rejectRecharge,
  savePaymentSettings,
} from '@/firebase/payment';

import {
  fetchAllSchools,
  updateSchoolStatus,
} from '@/firebase/firestore';

import type {
  RechargeRequest,
  PaymentSettings,
} from '@/firebase/payment';

import type { School } from '@/firebase/types';

/*
 * =========================================================
 * PLATFORM ADMIN WHATSAPP NUMBER
 * =========================================================
 *
 * WhatsApp number international format में रखें।
 * India = 91
 */
const ADMIN_WHATSAPP_NUMBER = '919112170192';

/*
 * =========================================================
 * SUBSCRIPTION STATE
 * =========================================================
 */

function getSchoolSubscriptionState(
  school: School
): 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'NO_EXPIRY' {
  if (!school.subscriptionExpiryDate) {
    return 'NO_EXPIRY';
  }

  const expiry = new Date(
    school.subscriptionExpiryDate
  ).getTime();

  if (!Number.isFinite(expiry)) {
    return 'NO_EXPIRY';
  }

  const now = Date.now();
  const remainingMs = expiry - now;

  if (remainingMs <= 0) {
    return 'EXPIRED';
  }

  const remainingDays = Math.ceil(
    remainingMs /
      (24 * 60 * 60 * 1000)
  );

  if (remainingDays <= 3) {
    return 'EXPIRING_SOON';
  }

  return 'ACTIVE';
}

/*
 * =========================================================
 * WHATSAPP REMINDER
 * =========================================================
 */

function openSchoolWhatsApp(
  school: School
) {
  const state =
    getSchoolSubscriptionState(
      school
    );

  const expiryText =
    school.subscriptionExpiryDate
      ? new Date(
          school.subscriptionExpiryDate
        ).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : 'Not available';

  let message = '';

  if (state === 'EXPIRED') {
    message =
      `नमस्कार,\n\n` +
      `🏫 School: ${school.name}\n\n` +
      `🔴 आपके school website subscription की अवधि समाप्त हो गई है।\n` +
      `📅 Expiry: ${expiryText}\n\n` +
      `कृपया website service जारी रखने के लिए recharge करें।\n\n` +
      `धन्यवाद।`;
  } else if (
    state === 'EXPIRING_SOON'
  ) {
    message =
      `नमस्कार,\n\n` +
      `🏫 School: ${school.name}\n\n` +
      `⚠️ आपके school website subscription की अवधि जल्द समाप्त होने वाली है।\n` +
      `📅 Expiry: ${expiryText}\n\n` +
      `कृपया समय पर recharge करें ताकि website service बंद न हो।\n\n` +
      `धन्यवाद।`;
  } else if (
    state === 'ACTIVE'
  ) {
    message =
      `नमस्कार,\n\n` +
      `🏫 School: ${school.name}\n\n` +
      `📅 Current subscription expiry: ${expiryText}\n\n` +
      `यह आपके school website subscription का reminder है।\n` +
      `कृपया expiry से पहले recharge कर लें।\n\n` +
      `धन्यवाद।`;
  } else {
    message =
      `नमस्कार,\n\n` +
      `🏫 School: ${school.name}\n\n` +
      `आपके school website account के संबंध में आपसे संपर्क करना है।\n\n` +
      `कृपया WhatsApp पर reply करें।\n\n` +
      `धन्यवाद।`;
  }

  const whatsappUrl =
    `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(
      message
    )}`;

  window.open(
    whatsappUrl,
    '_blank',
    'noopener,noreferrer'
  );
}

/*
 * =========================================================
 * RECHARGE WHATSAPP
 * =========================================================
 */

function openSchoolRechargeWhatsApp(
  school: School
) {
  const message =
    `नमस्कार,\n\n` +
    `🏫 School: ${school.name}\n\n` +
    `💳 School website subscription recharge करना है।\n\n` +
    `कृपया recharge/payment details भेजें।\n\n` +
    `धन्यवाद।`;

  const whatsappUrl =
    `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(
      message
    )}`;

  window.open(
    whatsappUrl,
    '_blank',
    'noopener,noreferrer'
  );
}

/*
 * =========================================================
 * PLATFORM ADMIN PAGE
 * =========================================================
 */

export default function PlatformAdminPage() {
  const navigate =
    useNavigate();

  const [schools, setSchools] =
    useState<School[]>([]);

  const [requests, setRequests] =
    useState<RechargeRequest[]>([]);

  const [settings, setSettings] =
    useState<PaymentSettings>({
      upiId: '',
      qrImageUrl: '',
      supportPhone: '',
      instructions: '',
    });

  const [freeDays, setFreeDays] =
    useState<Record<string, string>>(
      {}
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [processingSchool, setProcessingSchool] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState('');

  const [error, setError] =
    useState('');

  /*
   * =======================================================
   * LOAD DATA
   * =======================================================
   */

  async function loadData() {
    try {
      setLoading(true);
      setError('');

      const [
        schoolData,
        rechargeData,
        paymentSettings,
      ] = await Promise.all([
        fetchAllSchools(),
        fetchPendingRecharges(),
        fetchPaymentSettings(),
      ]);

      setSchools(
        schoolData
      );

      setRequests(
        rechargeData
      );

      setSettings({
        upiId:
          paymentSettings?.upiId ||
          '',

        qrImageUrl:
          paymentSettings?.qrImageUrl ||
          '',

        supportPhone:
          paymentSettings?.supportPhone ||
          '',

        instructions:
          paymentSettings?.instructions ||
          '',
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

  /*
   * =======================================================
   * SAVE PAYMENT SETTINGS
   * =======================================================
   */

  async function handleSaveSettings(
    event: React.FormEvent
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage('');
      setError('');

      await savePaymentSettings(
        settings
      );

      setMessage(
        'Payment settings saved successfully.'
      );
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

  /*
   * =======================================================
   * APPROVE PAID RECHARGE
   * =======================================================
   */

  async function handleApprove(
    requestId: string
  ) {
    if (
      !window.confirm(
        'Approve this payment? The exact recharge amount and days will be activated for the school.'
      )
    ) {
      return;
    }

    try {
      setError('');
      setMessage('');

      setProcessingSchool(
        requestId
      );

      await approveRecharge(
        requestId
      );

      setMessage(
        '✅ Payment approved. The exact recharge has been activated for the school.'
      );

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to approve payment.'
      );
    } finally {
      setProcessingSchool(null);
    }
  }

  /*
   * =======================================================
   * REJECT PAYMENT
   * =======================================================
   */

  async function handleReject(
    requestId: string
  ) {
    const reason =
      window.prompt(
        'Enter rejection reason:',
        'Payment could not be verified.'
      ) ||
      'Payment rejected by Platform Admin.';

    try {
      setError('');
      setMessage('');

      setProcessingSchool(
        requestId
      );

      await rejectRecharge(
        requestId,
        reason
      );

      setMessage(
        'Payment request rejected.'
      );

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to reject payment.'
      );
    } finally {
      setProcessingSchool(null);
    }
  }

  /*
   * =======================================================
   * FREE APPROVAL
   * =======================================================
   */

  async function handleFreeApproval(
    school: School
  ) {
    const rawDays =
      freeDays[school.id]?.trim() ||
      '';

    if (
      !/^[1-9]\d*$/.test(
        rawDays
      )
    ) {
      setError(
        `Please enter a valid number of days for ${school.name}. Minimum is 1 day.`
      );

      setMessage('');

      return;
    }

    const days =
      Number(rawDays);

    if (
      !Number.isSafeInteger(
        days
      ) ||
      days < 1
    ) {
      setError(
        `Invalid subscription days for ${school.name}.`
      );

      setMessage('');

      return;
    }

    const confirmed =
      window.confirm(
        `Free approval for "${school.name}"?\n\n` +
        `Days: ${days}\n` +
        `Amount: ₹0\n\n` +
        `The subscription will activate from the approval date/time.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setMessage('');

      setProcessingSchool(
        school.id
      );

      await updateSchoolStatus(
        school.id,
        'LIVE',
        undefined,
        undefined,
        'WAIVED',
        days
      );

      setMessage(
        `🆓 ${school.name} has been activated free for ${days} days.`
      );

      setFreeDays(
        (current) => {
          const next = {
            ...current,
          };

          delete next[
            school.id
          ];

          return next;
        }
      );

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to approve school for free.'
      );
    } finally {
      setProcessingSchool(null);
    }
  }

  /*
   * =======================================================
   * SUSPEND / RESTORE
   * =======================================================
   */

  async function handleSchoolStatus(
    schoolId: string,
    status:
      | 'LIVE'
      | 'SUSPENDED'
  ) {
    const action =
      status === 'LIVE'
        ? 'restore'
        : 'suspend';

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

      setProcessingSchool(
        schoolId
      );

      await updateSchoolStatus(
        schoolId,
        status
      );

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
    } finally {
      setProcessingSchool(null);
    }
  }

  /*
   * =======================================================
   * HELPERS
   * =======================================================
   */

  function getSchoolById(
    schoolId: string
  ) {
    return schools.find(
      (school) =>
        school.id ===
        schoolId
    );
  }

  function formatDate(
    value?: string
  ) {
    if (!value) {
      return '—';
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return '—';
    }

    return date.toLocaleString(
      'en-IN',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
      }
    );
  }

  function getSubscriptionLabel(
    school: School
  ) {
    if (
      school.status ===
        'LIVE' &&
      school.subscriptionExpiryDate
    ) {
      const expiry =
        new Date(
          school.subscriptionExpiryDate
        ).getTime();

      if (
        Number.isFinite(
          expiry
        ) &&
        expiry > Date.now()
      ) {
        return 'ACTIVE';
      }

      return 'EXPIRED';
    }

    return (
      school.subscriptionStatus ||
      'PENDING'
    );
  }

  /*
   * =======================================================
   * LOADING
   * =======================================================
   */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-4">
        <div className="rounded-3xl bg-white p-10 text-center shadow-2xl">
          <div className="text-5xl">
            ⚙️
          </div>

          <p className="mt-4 text-xl font-extrabold text-gray-800">
            Loading Platform Admin...
          </p>
        </div>
      </div>
    );
  }

  /*
   * =======================================================
   * SCHOOL COUNTS
   * =======================================================
   */

  const liveSchools =
    schools.filter(
      (school) =>
        school.status ===
        'LIVE'
    );

  const pendingSchools =
    schools.filter(
      (school) =>
        school.status ===
        'PENDING_PAYMENT'
    );

  const suspendedSchools =
    schools.filter(
      (school) =>
        school.status ===
        'SUSPENDED'
    );

  /*
   * =======================================================
   * PAGE
   * =======================================================
   */

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-4 py-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-8 text-center text-white">
          <div className="text-6xl">
            👨‍💼
          </div>

          <h1 className="mt-3 text-3xl font-black md:text-5xl">
            Platform Admin
          </h1>

          <p className="mt-2 text-white/90">
            Manage all schools, payments and platform settings
          </p>
        </div>

        {/* MESSAGES */}

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

        {/* STATISTICS */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-3xl bg-white p-6 shadow-2xl">
            <div className="text-4xl">
              🏫
            </div>

            <p className="mt-3 text-sm font-bold text-gray-500">
              Total Schools
            </p>

            <p className="text-3xl font-black text-gray-900">
              {schools.length}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-2xl">
            <div className="text-4xl">
              🟢
            </div>

            <p className="mt-3 text-sm font-bold text-gray-500">
              Live Schools
            </p>

            <p className="text-3xl font-black text-green-600">
              {liveSchools.length}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-2xl">
            <div className="text-4xl">
              ⏳
            </div>

            <p className="mt-3 text-sm font-bold text-gray-500">
              Pending Payment
            </p>

            <p className="text-3xl font-black text-yellow-600">
              {pendingSchools.length}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-2xl">
            <div className="text-4xl">
              💳
            </div>

            <p className="mt-3 text-sm font-bold text-gray-500">
              Pending Requests
            </p>

            <p className="text-3xl font-black text-blue-600">
              {requests.length}
            </p>
          </div>

        </div>

        {/* PAYMENT SETTINGS */}

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-2xl md:p-8">

          <h2 className="text-2xl font-black text-gray-900">
            💳 Payment Settings
          </h2>

          <p className="mt-1 text-gray-600">
            These details are shown to schools on the payment page.
          </p>

          <form
            onSubmit={
              handleSaveSettings
            }
            className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2"
          >

            <div>
              <label className="mb-2 block font-bold text-gray-800">
                UPI ID
              </label>

              <input
                value={
                  settings.upiId
                }
                onChange={(
                  event
                ) =>
                  setSettings({
                    ...settings,
                    upiId:
                      event.target.value,
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
                value={
                  settings.qrImageUrl
                }
                onChange={(
                  event
                ) =>
                  setSettings({
                    ...settings,
                    qrImageUrl:
                      event.target.value,
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
                value={
                  settings.supportPhone
                }
                onChange={(
                  event
                ) =>
                  setSettings({
                    ...settings,
                    supportPhone:
                      event.target.value,
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
                value={
                  settings.instructions
                }
                onChange={(
                  event
                ) =>
                  setSettings({
                    ...settings,
                    instructions:
                      event.target.value,
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

        {/* PENDING PAYMENT REQUESTS */}

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-2xl md:p-8">

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="text-2xl font-black text-gray-900">
                💰 Pending Payment Requests
              </h2>

              <p className="mt-1 text-gray-600">
                Approve करने पर request में दिए गए exact amount और days activate होंगे।
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 px-5 py-3 text-center">
              <p className="text-xs font-bold text-blue-600">
                PENDING
              </p>

              <p className="text-2xl font-black text-blue-700">
                {requests.length}
              </p>
            </div>

          </div>

          {requests.length === 0 ? (
            <div className="mt-5 rounded-2xl bg-gray-50 p-6 text-center text-gray-600">
              No pending payment requests.
            </div>
          ) : (
            <div className="mt-5 space-y-4">

              {requests.map(
                (request) => {
                  const school =
                    getSchoolById(
                      request.schoolId
                    );

                  const busy =
                    processingSchool ===
                    request.id;

                  return (
                    <div
                      key={
                        request.id
                      }
                      className="rounded-3xl border-2 border-blue-100 bg-gradient-to-br from-white to-blue-50 p-5 shadow-lg"
                    >

                      <div className="mb-5 rounded-2xl bg-white p-4 shadow">

                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                          School
                        </p>

                        <p className="mt-1 text-xl font-black text-gray-900">
                          {school?.name ||
                            'School not found'}
                        </p>

                        {school && (
                          <p className="mt-1 break-all text-sm text-gray-500">
                            /school/
                            {
                              school.slug
                            }
                          </p>
                        )}

                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                        <div className="rounded-2xl bg-green-50 p-4">
                          <p className="text-sm font-bold text-gray-500">
                            Recharge Amount
                          </p>

                          <p className="mt-1 text-2xl font-black text-green-600">
                            ₹
                            {
                              request.amount
                            }
                          </p>
                        </div>

                        <div className="rounded-2xl bg-purple-50 p-4">
                          <p className="text-sm font-bold text-gray-500">
                            Subscription
                          </p>

                          <p className="mt-1 text-2xl font-black text-purple-700">
                            {
                              request.days
                            }{' '}
                            days
                          </p>
                        </div>

                        <div className="rounded-2xl bg-blue-50 p-4">
                          <p className="text-sm font-bold text-gray-500">
                            UTR
                          </p>

                          <p className="mt-1 break-all font-black text-blue-700">
                            {
                              request.utr ||
                              '—'
                            }
                          </p>
                        </div>

                        <div className="rounded-2xl bg-yellow-50 p-4">
                          <p className="text-sm font-bold text-gray-500">
                            Request Date
                          </p>

                          <p className="mt-1 text-sm font-black text-gray-800">
                            {
                              formatDate(
                                request.createdAt as
                                  | string
                                  | undefined
                              )
                            }
                          </p>
                        </div>

                      </div>

                      {(
                        request as RechargeRequest & {
                          note?: string;
                        }
                      ).note && (
                        <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                          <p className="text-sm font-bold text-gray-500">
                            Note
                          </p>

                          <p className="mt-1 text-gray-700">
                            {
                              (
                                request as RechargeRequest & {
                                  note?: string;
                                }
                              ).note
                            }
                          </p>
                        </div>
                      )}

                      {(
                        request as RechargeRequest & {
                          proofUrl?: string;
                        }
                      ).proofUrl && (
                        <div className="mt-4">
                          <a
                            href={
                              (
                                request as RechargeRequest & {
                                  proofUrl?: string;
                                }
                              ).proofUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex rounded-xl bg-blue-100 px-4 py-3 font-black text-blue-700 hover:bg-blue-200"
                          >
                            🔗 Open Payment Proof
                          </a>
                        </div>
                      )}

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row">

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            handleApprove(
                              request.id
                            )
                          }
                          className="flex-1 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-3 font-black text-white shadow-[0_5px_0_rgb(4,120,87)] disabled:cursor-not-allowed disabled:opacity-60 active:translate-y-1 active:shadow-none"
                        >
                          {busy
                            ? '⏳ Processing...'
                            : `✅ Approve ₹${request.amount} / ${request.days} Days`}
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            handleReject(
                              request.id
                            )
                          }
                          className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-5 py-3 font-black text-white shadow-[0_5px_0_rgb(159,18,57)] disabled:cursor-not-allowed disabled:opacity-60 active:translate-y-1 active:shadow-none"
                        >
                          ❌ Reject Payment
                        </button>

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

        {/* =================================================
            ALL SCHOOLS
        ================================================== */}

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-2xl md:p-8">

          <div>
            <h2 className="text-2xl font-black text-gray-900">
              🏫 All Schools
            </h2>

            <p className="mt-1 text-gray-600">
              यहाँ से हर school का पूरा data, recharge, WhatsApp और status manage करें।
            </p>
          </div>

          <div className="mt-5 space-y-5">

            {schools.map(
              (school) => {
                const busy =
                  processingSchool ===
                  school.id;

                const currentFreeDays =
                  freeDays[
                    school.id
                  ] || '';

                const subscriptionLabel =
                  getSubscriptionLabel(
                    school
                  );

                const whatsappState =
                  getSchoolSubscriptionState(
                    school
                  );

                return (
                  <div
                    key={
                      school.id
                    }
                    className="rounded-3xl border-2 border-gray-100 bg-gradient-to-br from-white to-gray-50 p-5 shadow-lg"
                  >

                    <div className="flex flex-col gap-5">

                      {/* SCHOOL DETAILS */}

                      <div>

                        <div className="flex flex-wrap items-center gap-3">

                          <h3 className="text-xl font-black text-gray-900">
                            {
                              school.name
                            }
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              school.status ===
                              'LIVE'
                                ? 'bg-green-100 text-green-700'
                                : school.status ===
                                    'SUSPENDED'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {
                              school.status
                            }
                          </span>

                        </div>

                        <p className="mt-1 break-all text-sm text-gray-500">
                          /school/
                          {
                            school.slug
                          }
                        </p>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

                          <div className="rounded-2xl bg-white p-3 shadow-sm">
                            <p className="text-xs font-bold text-gray-500">
                              Subscription
                            </p>

                            <p
                              className={`mt-1 font-black ${
                                subscriptionLabel ===
                                'ACTIVE'
                                  ? 'text-green-600'
                                  : subscriptionLabel ===
                                      'EXPIRED'
                                    ? 'text-red-600'
                                    : 'text-yellow-600'
                              }`}
                            >
                              {
                                subscriptionLabel
                              }
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-3 shadow-sm">
                            <p className="text-xs font-bold text-gray-500">
                              Approval Type
                            </p>

                            <p className="mt-1 font-black text-gray-800">
                              {
                                school.paymentApprovalType ||
                                '—'
                              }
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-3 shadow-sm">
                            <p className="text-xs font-bold text-gray-500">
                              Days
                            </p>

                            <p className="mt-1 font-black text-gray-800">
                              {
                                school.subscriptionDays
                                  ? `${school.subscriptionDays} days`
                                  : '—'
                              }
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-3 shadow-sm">
                            <p className="text-xs font-bold text-gray-500">
                              Amount
                            </p>

                            <p className="mt-1 font-black text-gray-800">
                              {
                                school.paymentAmount !==
                                undefined
                                  ? `₹${school.paymentAmount}`
                                  : '—'
                              }
                            </p>
                          </div>

                        </div>

                        {/* DATES */}

                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">

                          <div className="rounded-2xl bg-blue-50 p-3">
                            <p className="text-xs font-bold text-blue-600">
                              Subscription Start
                            </p>

                            <p className="mt-1 text-sm font-black text-blue-900">
                              {
                                formatDate(
                                  school.subscriptionStartDate
                                )
                              }
                            </p>
                          </div>

                          <div
                            className={`rounded-2xl p-3 ${
                              whatsappState ===
                              'EXPIRED'
                                ? 'bg-red-50'
                                : whatsappState ===
                                    'EXPIRING_SOON'
                                  ? 'bg-yellow-50'
                                  : 'bg-orange-50'
                            }`}
                          >
                            <p
                              className={`text-xs font-bold ${
                                whatsappState ===
                                'EXPIRED'
                                  ? 'text-red-600'
                                  : whatsappState ===
                                      'EXPIRING_SOON'
                                    ? 'text-yellow-700'
                                    : 'text-orange-600'
                              }`}
                            >
                              Subscription Expiry
                            </p>

                            <p
                              className={`mt-1 text-sm font-black ${
                                whatsappState ===
                                'EXPIRED'
                                  ? 'text-red-900'
                                  : whatsappState ===
                                      'EXPIRING_SOON'
                                    ? 'text-yellow-900'
                                    : 'text-orange-900'
                              }`}
                            >
                              {
                                formatDate(
                                  school.subscriptionExpiryDate
                                )
                              }
                            </p>
                          </div>

                        </div>

                      </div>

                      {/* ACTION AREA */}

                      <div className="border-t-2 border-gray-100 pt-5">

                        {/* FREE APPROVAL */}

                        {school.status !==
                          'LIVE' && (
                          <div className="rounded-3xl border-2 border-emerald-100 bg-emerald-50 p-4">

                            <div className="mb-3">

                              <h4 className="text-lg font-black text-emerald-800">
                                🆓 Free / Waived Approval
                              </h4>

                              <p className="mt-1 text-sm text-emerald-700">
                                बिना recharge के school को activate करें। Approval के समय से subscription शुरू होगा।
                              </p>

                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">

                              <div className="flex-1">

                                <label className="mb-2 block text-sm font-black text-gray-700">
                                  Days
                                </label>

                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  inputMode="numeric"
                                  value={
                                    currentFreeDays
                                  }
                                  onChange={(
                                    event
                                  ) => {
                                    const value =
                                      event
                                        .target
                                        .value;

                                    if (
                                      value ===
                                        '' ||
                                      /^\d+$/.test(
                                        value
                                      )
                                    ) {
                                      setFreeDays(
                                        (
                                          current
                                        ) => ({
                                          ...current,
                                          [school.id]:
                                            value,
                                        })
                                      );
                                    }
                                  }}
                                  placeholder="जैसे 30, 60, 365"
                                  className="w-full rounded-2xl border-2 border-emerald-200 bg-white px-4 py-3 font-black outline-none focus:border-emerald-500"
                                />

                              </div>

                              <div className="flex items-end sm:w-64">

                                <button
                                  type="button"
                                  disabled={
                                    busy ||
                                    !currentFreeDays
                                  }
                                  onClick={() =>
                                    handleFreeApproval(
                                      school
                                    )
                                  }
                                  className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-3 font-black text-white shadow-[0_5px_0_rgb(21,128,61)] disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-1 active:shadow-none"
                                >
                                  {busy
                                    ? '⏳ Processing...'
                                    : '🆓 Free Approve'}
                                </button>

                              </div>

                            </div>

                            <p className="mt-3 text-xs font-bold text-emerald-700">
                              Minimum 1 day • कोई fixed maximum नहीं • Amount ₹0
                            </p>

                          </div>
                        )}

                        {/* =================================================
                            SCHOOL ACTION BUTTONS
                        ================================================== */}

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

                          {/* FULL DATA */}

                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/admin/school/${school.id}`
                              )
                            }
                            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-3 font-black text-white shadow-[0_5px_0_rgb(49,46,129)] active:translate-y-1 active:shadow-none"
                          >
                            👁️ पूरा Data
                          </button>

                          {/* RECHARGE */}

                          <button
                            type="button"
                            onClick={() =>
                              openSchoolRechargeWhatsApp(
                                school
                              )
                            }
                            className="rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-3 font-black text-white shadow-[0_5px_0_rgb(126,34,206)] active:translate-y-1 active:shadow-none"
                          >
                            💳 Recharge
                          </button>

                          {/* WHATSAPP */}

                          <button
                            type="button"
                            onClick={() =>
                              openSchoolWhatsApp(
                                school
                              )
                            }
                            className={`rounded-xl px-5 py-3 font-black text-white shadow-[0_5px_0] active:translate-y-1 active:shadow-none ${
                              whatsappState ===
                              'EXPIRED'
                                ? 'bg-gradient-to-r from-red-600 to-rose-700 shadow-red-900'
                                : whatsappState ===
                                    'EXPIRING_SOON'
                                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 shadow-orange-800'
                                  : 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-emerald-800'
                            }`}
                          >
                            {whatsappState ===
                            'EXPIRED'
                              ? '🔴 Recharge Expired – WhatsApp'
                              : whatsappState ===
                                  'EXPIRING_SOON'
                                ? '⚠️ Expiry Reminder – WhatsApp'
                                : '📲 WhatsApp Reminder'}
                          </button>

                          {/* SUSPEND / RESTORE */}

                          {school.status ===
                          'SUSPENDED' ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                handleSchoolStatus(
                                  school.id,
                                  'LIVE'
                                )
                              }
                              className="rounded-xl bg-green-600 px-5 py-3 font-black text-white shadow-[0_5px_0_rgb(21,128,61)] disabled:opacity-60 active:translate-y-1 active:shadow-none"
                            >
                              🟢 Restore
                            </button>
                          ) : school.status ===
                            'LIVE' ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                handleSchoolStatus(
                                  school.id,
                                  'SUSPENDED'
                                )
                              }
                              className="rounded-xl bg-red-600 px-5 py-3 font-black text-white shadow-[0_5px_0_rgb(185,28,28)] disabled:opacity-60 active:translate-y-1 active:shadow-none"
                            >
                              ⛔ Suspend
                            </button>
                          ) : null}

                        </div>

                        {/* STATUS INFO */}

                        <div className="mt-3">

                          {whatsappState ===
                            'EXPIRED' && (
                            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                              🔴 Subscription expired. Recharge reminder WhatsApp भेज सकते हैं।
                            </p>
                          )}

                          {whatsappState ===
                            'EXPIRING_SOON' && (
                            <p className="rounded-xl bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
                              ⚠️ Subscription अगले 3 दिनों में expire होने वाला है।
                            </p>
                          )}

                          {whatsappState ===
                            'ACTIVE' && (
                            <p className="rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
                              🟢 Subscription active है।
                            </p>
                          )}

                          {whatsappState ===
                            'NO_EXPIRY' && (
                            <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm font-bold text-gray-600">
                              ℹ️ Subscription expiry date उपलब्ध नहीं है।
                            </p>
                          )}

                        </div>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

            {schools.length ===
              0 && (
              <div className="rounded-2xl bg-gray-50 p-6 text-center text-gray-600">
                No schools registered yet.
              </div>
            )}

          </div>
        </section>

        {/* SUSPENDED SUMMARY */}

        {suspendedSchools.length >
          0 && (
          <div className="mt-6 rounded-3xl bg-white p-6 text-center shadow-2xl">

            <p className="text-sm font-bold text-gray-500">
              Suspended Schools
            </p>

            <p className="mt-1 text-3xl font-black text-red-600">
              {
                suspendedSchools.length
              }
            </p>

          </div>
        )}

      </div>
    </div>
  );
}
