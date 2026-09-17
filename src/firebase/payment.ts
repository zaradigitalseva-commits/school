import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';

import { db } from './config';

/* =========================================================
   BILLING PACKAGES
========================================================= */

export const BILLING_PACKAGES = [
  { amount: 300, days: 28 },
  { amount: 600, days: 56 },
  { amount: 900, days: 84 },
  { amount: 1200, days: 112 },
  { amount: 3000, days: 280 },
] as const;

export type BillingPackage =
  (typeof BILLING_PACKAGES)[number];

/* =========================================================
   PAYMENT SETTINGS
========================================================= */

export interface PaymentSettings {
  upiId: string;
  qrImageUrl: string;
  supportPhone: string;
  instructions: string;
}

/* =========================================================
   RECHARGE REQUEST
========================================================= */

export interface RechargeRequest {
  id: string;

  schoolId: string;
  schoolName?: string;

  uid: string;

  amount: number;
  days: number;

  utr: string;
  utrNormalized: string;

  proofImageUrl?: string;

  status:
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED';

  createdAt?: unknown;
  approvedAt?: unknown;
  rejectedAt?: unknown;

  rejectionReason?: string;
}

/* =========================================================
   HELPERS
========================================================= */

function normalizeUTR(
  utr: string
): string {
  return utr
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

function getPackage(
  amount: number,
  days: number
): BillingPackage {
  const found =
    BILLING_PACKAGES.find(
      (item) =>
        item.amount === amount &&
        item.days === days
    );

  if (!found) {
    throw new Error(
      'Invalid recharge package.'
    );
  }

  return found;
}

function timestampToMillis(
  value: unknown
): number {
  if (!value) {
    return 0;
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'toMillis' in value &&
    typeof (
      value as {
        toMillis?: unknown;
      }
    ).toMillis === 'function'
  ) {
    return (
      value as {
        toMillis: () => number;
      }
    ).toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'number') {
    return value;
  }

  if (
    typeof value === 'string'
  ) {
    const time =
      new Date(value).getTime();

    return Number.isNaN(time)
      ? 0
      : time;
  }

  return 0;
}

/* =========================================================
   PAYMENT SETTINGS
========================================================= */

export async function fetchPaymentSettings():
  Promise<PaymentSettings> {
  const ref = doc(
    db,
    'platformSettings',
    'payment'
  );

  const snapshot =
    await getDoc(ref);

  if (!snapshot.exists()) {
    return {
      upiId: '',
      qrImageUrl: '',
      supportPhone: '',
      instructions:
        'Payment करने के बाद UTR Number जरूर दर्ज करें।',
    };
  }

  const data =
    snapshot.data();

  return {
    upiId: String(
      data.upiId || ''
    ),

    qrImageUrl: String(
      data.qrImageUrl || ''
    ),

    supportPhone: String(
      data.supportPhone || ''
    ),

    instructions: String(
      data.instructions || ''
    ),
  };
}

/* =========================================================
   SAVE PAYMENT SETTINGS
========================================================= */

export async function savePaymentSettings(
  settings: PaymentSettings
): Promise<void> {
  const ref = doc(
    db,
    'platformSettings',
    'payment'
  );

  await runTransaction(
    db,
    async (transaction) => {
      transaction.set(
        ref,
        {
          upiId:
            settings.upiId?.trim() || '',

          qrImageUrl:
            settings.qrImageUrl?.trim() || '',

          supportPhone:
            settings.supportPhone?.trim() || '',

          instructions:
            settings.instructions?.trim() || '',

          updatedAt:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );
    }
  );
}

/* =========================================================
   CREATE RECHARGE REQUEST
========================================================= */

export async function createRechargeRequest(
  params: {
    schoolId: string;
    uid: string;
    amount: number;
    days: number;
    utr: string;
    proofImageUrl?: string;
  }
): Promise<string> {
  if (!params.schoolId) {
    throw new Error(
      'School information missing.'
    );
  }

  if (!params.uid) {
    throw new Error(
      'User information missing.'
    );
  }

  const selectedPackage =
    getPackage(
      params.amount,
      params.days
    );

  const utrNormalized =
    normalizeUTR(params.utr);

  if (!utrNormalized) {
    throw new Error(
      'UTR Number required.'
    );
  }

  /*
   * Verify school exists.
   */
  const schoolRef = doc(
    db,
    'schools',
    params.schoolId
  );

  const schoolSnapshot =
    await getDoc(schoolRef);

  if (!schoolSnapshot.exists()) {
    throw new Error(
      'School not found.'
    );
  }

  const schoolData =
    schoolSnapshot.data();

  /*
   * IMPORTANT:
   * Only the owner of the school can
   * create its recharge request.
   */
  if (
    String(schoolData.ownerUid || '') !==
    params.uid
  ) {
    throw new Error(
      'You are not authorized to make payment for this school.'
    );
  }

  const schoolName =
    String(
      schoolData.name ||
        schoolData.schoolName ||
        ''
    ).trim();

  if (!schoolName) {
    throw new Error(
      'School name not found.'
    );
  }

  const rechargeRef = doc(
    collection(
      db,
      'rechargeRequests'
    )
  );

  const utrRef = doc(
    db,
    'utrReservations',
    utrNormalized
  );

  await runTransaction(
    db,
    async (transaction) => {
      /*
       * Check UTR duplication.
       */
      const existingUTR =
        await transaction.get(
          utrRef
        );

      if (existingUTR.exists()) {
        throw new Error(
          'This UTR Number has already been submitted.'
        );
      }

      /*
       * Reserve UTR.
       */
      transaction.set(
        utrRef,
        {
          utrNormalized,
          rechargeRequestId:
            rechargeRef.id,

          schoolId:
            params.schoolId,

          schoolName,

          uid: params.uid,

          createdAt:
            serverTimestamp(),
        }
      );

      /*
       * Create recharge request.
       */
      transaction.set(
        rechargeRef,
        {
          schoolId:
            params.schoolId,

          schoolName,

          uid: params.uid,

          amount:
            selectedPackage.amount,

          days:
            selectedPackage.days,

          utr:
            params.utr.trim(),

          utrNormalized,

          proofImageUrl:
            params.proofImageUrl?.trim() || '',

          status: 'PENDING',

          createdAt:
            serverTimestamp(),
        }
      );
    }
  );

  return rechargeRef.id;
}

/* =========================================================
   MY RECHARGE REQUESTS
========================================================= */

export async function fetchMyRechargeRequests(
  uid: string
): Promise<RechargeRequest[]> {
  if (!uid) {
    return [];
  }

  const q = query(
    collection(
      db,
      'rechargeRequests'
    ),
    where(
      'uid',
      '==',
      uid
    )
  );

  const snapshot =
    await getDocs(q);

  return snapshot.docs
    .map(
      (item) =>
        ({
          id: item.id,
          ...item.data(),
        } as RechargeRequest)
    )
    .sort(
      (a, b) =>
        timestampToMillis(
          b.createdAt
        ) -
        timestampToMillis(
          a.createdAt
        )
    );
}

/* =========================================================
   PENDING RECHARGES
========================================================= */

export async function fetchPendingRecharges():
  Promise<RechargeRequest[]> {
  const q = query(
    collection(
      db,
      'rechargeRequests'
    ),
    where(
      'status',
      '==',
      'PENDING'
    )
  );

  const snapshot =
    await getDocs(q);

  return snapshot.docs
    .map(
      (item) =>
        ({
          id: item.id,
          ...item.data(),
        } as RechargeRequest)
    )
    .sort(
      (a, b) =>
        timestampToMillis(
          a.createdAt
        ) -
        timestampToMillis(
          b.createdAt
        )
    );
}

/* =========================================================
   APPROVE RECHARGE
========================================================= */

export async function approveRecharge(
  rechargeId: string
): Promise<void> {
  if (!rechargeId) {
    throw new Error(
      'Recharge ID is required.'
    );
  }

  const rechargeRef = doc(
    db,
    'rechargeRequests',
    rechargeId
  );

  await runTransaction(
    db,
    async (transaction) => {
      /*
       * Get recharge request.
       */
      const rechargeSnap =
        await transaction.get(
          rechargeRef
        );

      if (!rechargeSnap.exists()) {
        throw new Error(
          'Recharge request not found.'
        );
      }

      const recharge =
        rechargeSnap.data();

      /*
       * Already approved.
       */
      if (
        recharge.status ===
        'APPROVED'
      ) {
        return;
      }

      /*
       * Only PENDING can be approved.
       */
      if (
        recharge.status !==
        'PENDING'
      ) {
        throw new Error(
          'This recharge is no longer pending.'
        );
      }

      const schoolId =
        String(
          recharge.schoolId || ''
        );

      const uid =
        String(
          recharge.uid || ''
        );

      const amount =
        Number(
          recharge.amount
        );

      const days =
        Number(
          recharge.days
        );

      if (!schoolId) {
        throw new Error(
          'School ID missing in recharge request.'
        );
      }

      if (!uid) {
        throw new Error(
          'User ID missing in recharge request.'
        );
      }

      /*
       * Verify package.
       */
      getPackage(
        amount,
        days
      );

      /* -----------------------------------------
         FIRESTORE REFERENCES
      ----------------------------------------- */

      const schoolRef = doc(
        db,
        'schools',
        schoolId
      );

      const walletRef = doc(
        db,
        'wallets',
        schoolId
      );

      const subscriptionRef =
        doc(
          db,
          'subscriptions',
          schoolId
        );

      const membershipRef =
        doc(
          db,
          'schoolMemberships',
          `${uid}_${schoolId}`
        );

      const walletTransactionRef =
        doc(
          collection(
            db,
            'walletTransactions'
          )
        );

      /*
       * ALL READS BEFORE WRITES.
       */
      const schoolSnap =
        await transaction.get(
          schoolRef
        );

      const walletSnap =
        await transaction.get(
          walletRef
        );

      const subscriptionSnap =
        await transaction.get(
          subscriptionRef
        );

      const membershipSnap =
        await transaction.get(
          membershipRef
        );

      if (!schoolSnap.exists()) {
        throw new Error(
          'School not found.'
        );
      }

      const school =
        schoolSnap.data();

      /*
       * Security check:
       * recharge UID must be school owner.
       */
      if (
        String(
          school.ownerUid || ''
        ) !== uid
      ) {
        throw new Error(
          'Recharge owner does not match school owner.'
        );
      }

      /* -----------------------------------------
         WALLET
      ----------------------------------------- */

      const oldWalletBalance =
        walletSnap.exists()
          ? Number(
              walletSnap.data()
                .balance || 0
            )
          : 0;

      const newWalletBalance =
        oldWalletBalance +
        amount;

      transaction.set(
        walletRef,
        {
          schoolId,

          balance:
            newWalletBalance,

          updatedAt:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      /* -----------------------------------------
         IMMUTABLE WALLET TRANSACTION
      ----------------------------------------- */

      transaction.set(
        walletTransactionRef,
        {
          schoolId,

          type: 'CREDIT',

          amount,

          balanceAfter:
            newWalletBalance,

          source: 'RECHARGE',

          rechargeRequestId:
            rechargeId,

          utr:
            String(
              recharge.utr || ''
            ),

          createdAt:
            serverTimestamp(),
        }
      );

      /* -----------------------------------------
         SUBSCRIPTION
      ----------------------------------------- */

      const existingSubscription =
        subscriptionSnap.exists()
          ? subscriptionSnap.data()
          : {};

      const oldExpiry =
        timestampToMillis(
          existingSubscription.expiresAt
        );

      /*
       * If old subscription is still active,
       * extend from old expiry.
       *
       * Otherwise start from now.
       */
      const baseTime =
        Math.max(
          Date.now(),
          oldExpiry
        );

      const newExpiry =
        new Date(
          baseTime +
            days *
              24 *
              60 *
              60 *
              1000
        );

      transaction.set(
        subscriptionRef,
        {
          schoolId,

          status: 'ACTIVE',

          planAmount:
            amount,

          planDays:
            days,

          startedAt:
            existingSubscription.startedAt ||
            serverTimestamp(),

          expiresAt:
            newExpiry,

          lastRechargeId:
            rechargeId,

          updatedAt:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      /* -----------------------------------------
         SCHOOL LIVE
      ----------------------------------------- */

      transaction.update(
        schoolRef,
        {
          status: 'LIVE',

          paymentStatus:
            'PAID',

          subscriptionStatus:
            'ACTIVE',

          updatedAt:
            serverTimestamp(),
        }
      );

      /* -----------------------------------------
         SCHOOL ADMIN MEMBERSHIP
      ----------------------------------------- */

      if (
        !membershipSnap.exists()
      ) {
        transaction.set(
          membershipRef,
          {
            uid,

            schoolId,

            email:
              String(
                school.ownerEmail ||
                  ''
              ),

            role:
              'school_admin',

            status:
              'ACTIVE',

            assignments: [],

            approvedAt:
              serverTimestamp(),

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          }
        );
      } else {
        transaction.update(
          membershipRef,
          {
            role:
              'school_admin',

            status:
              'ACTIVE',

            approvedAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          }
        );
      }

      /* -----------------------------------------
         RECHARGE APPROVED
      ----------------------------------------- */

      transaction.update(
        rechargeRef,
        {
          status:
            'APPROVED',

          approvedAt:
            serverTimestamp(),
        }
      );
    }
  );
}

/* =========================================================
   REJECT RECHARGE
========================================================= */

export async function rejectRecharge(
  rechargeId: string,
  reason =
    'Payment rejected by Platform Admin.'
): Promise<void> {
  if (!rechargeId) {
    throw new Error(
      'Recharge ID is required.'
    );
  }

  const rechargeRef = doc(
    db,
    'rechargeRequests',
    rechargeId
  );

  await runTransaction(
    db,
    async (transaction) => {
      const snapshot =
        await transaction.get(
          rechargeRef
        );

      if (!snapshot.exists()) {
        throw new Error(
          'Recharge request not found.'
        );
      }

      const data =
        snapshot.data();

      if (
        data.status ===
        'APPROVED'
      ) {
        throw new Error(
          'Approved recharge cannot be rejected.'
        );
      }

      if (
        data.status ===
        'REJECTED'
      ) {
        return;
      }

      const cleanReason =
        reason?.trim() ||
        'Payment rejected by Platform Admin.';

      transaction.update(
        rechargeRef,
        {
          status:
            'REJECTED',

          rejectionReason:
            cleanReason,

          rejectedAt:
            serverTimestamp(),
        }
      );
    }
  );
}
