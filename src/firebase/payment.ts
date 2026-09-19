import {
  collection,
  deleteDoc,
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

/* =========================================================
   GET BILLING PACKAGE
========================================================= */

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

/* =========================================================
   TIMESTAMP HELPER
========================================================= */

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

  if (typeof value === 'string') {
    const time =
      new Date(value).getTime();

    return Number.isNaN(time)
      ? 0
      : time;
  }

  return 0;
}

/* =========================================================
   DEFAULT QR
========================================================= */

/*
 * अगर Admin Firebase में QR Image URL नहीं डालता,
 * तो यह local QR image इस्तेमाल होगी:
 *
 * public/payment-qr.jpeg
 */

const DEFAULT_QR_IMAGE =
  '/payment-qr.jpeg';

/* =========================================================
   DEFAULT PAYMENT INSTRUCTIONS
========================================================= */

const DEFAULT_PAYMENT_INSTRUCTIONS =
  '1. QR Code scan करके payment करें.\n' +
  '2. Payment के बाद UTR Number जरूर दर्ज करें.\n' +
  '3. Submit Payment दबाएँ.';

/* =========================================================
   PAYMENT SETTINGS
========================================================= */

/*
 * Firebase path:
 *
 * platformSettings/payment
 */

export async function fetchPaymentSettings():
  Promise<PaymentSettings> {

  const ref = doc(
    db,
    'platformSettings',
    'payment'
  );

  const snapshot =
    await getDoc(ref);

  /*
   * Settings document मौजूद नहीं है
   */

  if (!snapshot.exists()) {
    return {
      upiId: '',

      qrImageUrl:
        DEFAULT_QR_IMAGE,

      supportPhone: '',

      instructions:
        DEFAULT_PAYMENT_INSTRUCTIONS,
    };
  }

  const data =
    snapshot.data();

  return {
    upiId:
      String(
        data.upiId || ''
      ).trim(),

    qrImageUrl:
      String(
        data.qrImageUrl || ''
      ).trim() ||
      DEFAULT_QR_IMAGE,

    supportPhone:
      String(
        data.supportPhone || ''
      ).trim(),

    instructions:
      String(
        data.instructions || ''
      ).trim() ||
      DEFAULT_PAYMENT_INSTRUCTIONS,
  };
}

/* =========================================================
   SAVE / EDIT PAYMENT SETTINGS
========================================================= */

/*
 * Platform Admin इस function से:
 *
 * - UPI ID
 * - QR Image URL
 * - Support Phone
 * - Instructions
 *
 * Save/Edit कर सकता है.
 */

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
            settings.upiId?.trim() ||
            '',

          qrImageUrl:
            settings.qrImageUrl?.trim() ||
            DEFAULT_QR_IMAGE,

          supportPhone:
            settings.supportPhone?.trim() ||
            '',

          instructions:
            settings.instructions?.trim() ||
            DEFAULT_PAYMENT_INSTRUCTIONS,

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
   DELETE PAYMENT SETTINGS
========================================================= */

/*
 * Platform Admin Payment Settings delete कर सकता है.
 *
 * Delete होने के बाद fetchPaymentSettings()
 * default values लौटाएगा.
 *
 * UPI ID खाली हो जाएगी.
 */

export async function deletePaymentSettings():
  Promise<void> {

  const ref = doc(
    db,
    'platformSettings',
    'payment'
  );

  await deleteDoc(ref);
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

  /*
   * Package verify
   */

  const selectedPackage =
    getPackage(
      params.amount,
      params.days
    );

  /*
   * Normalize UTR
   */

  const utrNormalized =
    normalizeUTR(params.utr);

  if (!utrNormalized) {
    throw new Error(
      'UTR Number required.'
    );
  }

  /* =======================================================
     VERIFY SCHOOL
  ======================================================= */

  const schoolRef =
    doc(
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
   * केवल school owner payment request
   * बना सकता है.
   */

  if (
    String(
      schoolData.ownerUid || ''
    ) !== params.uid
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

  /* =======================================================
     REFERENCES
  ======================================================= */

  const rechargeRef =
    doc(
      collection(
        db,
        'rechargeRequests'
      )
    );

  /*
   * UTR को document ID बनाया गया है.
   *
   * इससे same UTR दोबारा submit नहीं होगा.
   */

  const utrRef =
    doc(
      db,
      'utrReservations',
      utrNormalized
    );

  /* =======================================================
     ATOMIC PAYMENT REQUEST + UTR RESERVATION
  ======================================================= */

  /*
   * IMPORTANT:
   * Firestore Web SDK Transaction/WriteBatch में create() method
   * उपलब्ध नहीं है. इसी वजह से पहले वाला h.create error आ रहा था.
   *
   * यहाँ runTransaction + get() + set() इस्तेमाल किया गया है.
   * UTR पहले से मौजूद हो तो request reject होगी और duplicate UTR
   * कभी overwrite नहीं होगा.
   */
  await runTransaction(db, async (transaction) => {
    const existingUtrSnapshot = await transaction.get(utrRef);

    if (existingUtrSnapshot.exists()) {
      throw new Error(
        'UTR Number has already been submitted.'
      );
    }

    transaction.set(utrRef, {
      utrNormalized,
      rechargeRequestId: rechargeRef.id,
      schoolId: params.schoolId,
      schoolName,
      uid: params.uid,
      createdAt: serverTimestamp(),
    });

    transaction.set(rechargeRef, {
      schoolId: params.schoolId,
      schoolName,
      uid: params.uid,
      amount: selectedPackage.amount,
      days: selectedPackage.days,
      utr: params.utr.trim(),
      utrNormalized,
      status: 'PENDING',
      createdAt: serverTimestamp(),
    });
  });

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

  const q =
    query(
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
   SCHOOL RECHARGE HISTORY
========================================================= */

export interface SchoolRechargeHistoryItem {
  id: string;
  schoolId: string;
  amount: number;
  days?: number;
  type?: string;
  source?: string;
  utr?: string;
  rechargeRequestId?: string;
  createdAt?: unknown;
  balanceAfter?: number;
}

export async function fetchSchoolRechargeHistory(
  schoolId: string
): Promise<SchoolRechargeHistoryItem[]> {
  if (!schoolId) return [];

  const q = query(
    collection(db, 'walletTransactions'),
    where('schoolId', '==', schoolId)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((item) => ({
      id: item.id,
      ...item.data(),
    } as SchoolRechargeHistoryItem))
    .sort(
      (a, b) =>
        timestampToMillis(b.createdAt) -
        timestampToMillis(a.createdAt)
    );
}

/* =========================================================
   PENDING RECHARGES
========================================================= */

export async function fetchPendingRecharges():
  Promise<RechargeRequest[]> {

  const q =
    query(
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

  const rechargeRef =
    doc(
      db,
      'rechargeRequests',
      rechargeId
    );

  await runTransaction(
    db,
    async (transaction) => {

      /* ===================================================
         RECHARGE REQUEST
      =================================================== */

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
       * Already approved
       */

      if (
        recharge.status ===
        'APPROVED'
      ) {
        return;
      }

      /*
       * Only PENDING
       */

      if (
        recharge.status !==
        'PENDING'
      ) {
        throw new Error(
          'This recharge is no longer pending.'
        );
      }

      /* ===================================================
         BASIC DATA
      =================================================== */

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
       * Verify package
       */

      getPackage(
        amount,
        days
      );

      /* ===================================================
         REFERENCES
      =================================================== */

      const schoolRef =
        doc(
          db,
          'schools',
          schoolId
        );

      const walletRef =
        doc(
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

      /* ===================================================
         ALL READS FIRST
      =================================================== */

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

      /* ===================================================
         SECURITY CHECK
      =================================================== */

      if (
        String(
          school.ownerUid || ''
        ) !== uid
      ) {
        throw new Error(
          'Recharge owner does not match school owner.'
        );
      }

      /* ===================================================
         WALLET
      =================================================== */

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

      /* ===================================================
         WALLET TRANSACTION
      =================================================== */

      transaction.set(
        walletTransactionRef,
        {
          schoolId,

          type:
            'CREDIT',

          amount,

          balanceAfter:
            newWalletBalance,

          source:
            'RECHARGE',

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

      /* ===================================================
         SUBSCRIPTION
      =================================================== */

      const existingSubscription =
        subscriptionSnap.exists()
          ? subscriptionSnap.data()
          : {};

      const oldExpiry =
        timestampToMillis(
          existingSubscription.expiresAt
        );

      const oldTotalAmount =
        Number(
          existingSubscription.totalRechargeAmount ??
            existingSubscription.planAmount ??
            school.paymentAmount ??
            0
        );

      const oldTotalDays =
        Number(
          existingSubscription.totalRechargeDays ??
            existingSubscription.planDays ??
            school.subscriptionDays ??
            0
        );

      const totalRechargeAmount =
        oldTotalAmount + amount;

      const totalRechargeDays =
        oldTotalDays + days;

      /*
       * अगर पुरानी subscription अभी active है
       * तो नई validity old expiry के बाद लगेगी.
       *
       * अगर पुरानी subscription expire हो चुकी है
       * तो नई validity approval के समय से शुरू होगी.
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

      /* ===================================================
         SUBSCRIPTION WRITE
      =================================================== */

      transaction.set(
        subscriptionRef,
        {
          schoolId,

          status:
            'ACTIVE',

          planAmount:
            amount,

          planDays:
            days,

          totalRechargeAmount,

          totalRechargeDays,

          /*
           * इस recharge period का start
           */

          startedAt:
            new Date(
              baseTime
            ),

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

      /* ===================================================
         SCHOOL UPDATE
      =================================================== */

      transaction.update(
        schoolRef,
        {
          status:
            'LIVE',

          paymentStatus:
            'PAID',

          subscriptionStatus:
            'ACTIVE',

          /*
           * नया recharge period
           */

          subscriptionStartDate:
            new Date(
              baseTime
            ).toISOString(),

          subscriptionExpiryDate:
            newExpiry.toISOString(),

          subscriptionDays:
            totalRechargeDays,

          totalRechargeAmount,

          paymentApprovalType:
            'PAID',

          paymentAmount:
            totalRechargeAmount,

          paymentId:
            rechargeId,

          paymentDate:
            new Date().toISOString(),

          updatedAt:
            serverTimestamp(),
        }
      );

      /* ===================================================
         SCHOOL ADMIN MEMBERSHIP
      =================================================== */

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

      /* ===================================================
         APPROVE RECHARGE REQUEST
      =================================================== */

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
   PLATFORM ADMIN DIRECT RECHARGE
========================================================= */

export async function adminRechargeSchool(
  schoolId: string,
  amount: number,
  days: number
): Promise<void> {
  if (!schoolId) {
    throw new Error('School ID is required.');
  }

  const selectedPackage = getPackage(amount, days);

  const schoolRef = doc(db, 'schools', schoolId);
  const walletRef = doc(db, 'wallets', schoolId);
  const subscriptionRef = doc(db, 'subscriptions', schoolId);

  await runTransaction(db, async (transaction) => {
    const schoolSnap = await transaction.get(schoolRef);
    const walletSnap = await transaction.get(walletRef);
    const subscriptionSnap = await transaction.get(subscriptionRef);

    if (!schoolSnap.exists()) {
      throw new Error('School not found.');
    }

    const school = schoolSnap.data();
    const ownerUid = String(school.ownerUid || '').trim();
    const ownerEmail = String(school.ownerEmail || '').trim();

    if (!ownerUid) {
      throw new Error('School owner UID is missing.');
    }

    const oldWalletBalance = walletSnap.exists()
      ? Number(walletSnap.data().balance || 0)
      : 0;

    const existingSubscription = subscriptionSnap.exists()
      ? subscriptionSnap.data()
      : {};

    const oldExpiry = timestampToMillis(existingSubscription.expiresAt);

    const oldTotalAmount = Number(
      existingSubscription.totalRechargeAmount ??
        existingSubscription.planAmount ??
        school.paymentAmount ??
        0
    );

    const oldTotalDays = Number(
      existingSubscription.totalRechargeDays ??
        existingSubscription.planDays ??
        school.subscriptionDays ??
        0
    );

    const totalRechargeAmount =
      oldTotalAmount + selectedPackage.amount;

    const totalRechargeDays =
      oldTotalDays + selectedPackage.days;

    const baseTime = Math.max(Date.now(), oldExpiry);

    const newExpiry = new Date(
      baseTime + selectedPackage.days * 24 * 60 * 60 * 1000
    );

    const walletTransactionRef = doc(
      collection(db, 'walletTransactions')
    );

    const membershipRef = doc(
      db,
      'schoolMemberships',
      `${ownerUid}_${schoolId}`
    );

    transaction.set(
      walletRef,
      {
        schoolId,
        balance: oldWalletBalance + selectedPackage.amount,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    transaction.set(walletTransactionRef, {
      schoolId,
      type: 'CREDIT',
      amount: selectedPackage.amount,
      balanceAfter: oldWalletBalance + selectedPackage.amount,
      source: 'ADMIN_RECHARGE',
      createdAt: serverTimestamp(),
    });

    transaction.set(
      subscriptionRef,
      {
        schoolId,
        status: 'ACTIVE',
        planAmount: selectedPackage.amount,
        planDays: selectedPackage.days,
        totalRechargeAmount,
        totalRechargeDays,
        startedAt: new Date(baseTime),
        expiresAt: newExpiry,
        lastRechargeId: walletTransactionRef.id,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    transaction.update(schoolRef, {
      status: 'LIVE',
      paymentStatus: 'PAID',
      subscriptionStatus: 'ACTIVE',
      subscriptionStartDate: new Date(baseTime).toISOString(),
      subscriptionExpiryDate: newExpiry.toISOString(),
      subscriptionDays: totalRechargeDays,
      totalRechargeAmount,
      paymentApprovalType: 'ADMIN_RECHARGE',
      paymentAmount: totalRechargeAmount,
      paymentId: walletTransactionRef.id,
      paymentDate: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    });

    transaction.set(
      membershipRef,
      {
        uid: ownerUid,
        schoolId,
        email: ownerEmail,
        role: 'school_admin',
        status: 'ACTIVE',
        assignments: [],
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
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

  const rechargeRef =
    doc(
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

      /*
       * Approved payment को reject
       * नहीं किया जा सकता.
       */

      if (
        data.status ===
        'APPROVED'
      ) {
        throw new Error(
          'Approved recharge cannot be rejected.'
        );
      }

      /*
       * Already rejected
       */

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


/* =========================================================
   REALTIME PAYMENT LISTENERS
========================================================= */
export function subscribeToPaymentSettings(
  onData: (settings: PaymentSettings) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    doc(db, 'platformSettings', 'payment'),
    (snapshot) => onData((snapshot.exists() ? snapshot.data() : {}) as PaymentSettings),
    (error) => onError?.(error)
  );
}

export function subscribeToPendingRecharges(
  onData: (requests: RechargeRequest[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(collection(db, 'rechargeRequests'), where('status', '==', 'PENDING'));
  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as RechargeRequest))),
    (error) => onError?.(error)
  );
}

export function subscribeToSchoolRechargeHistory(
  schoolId: string,
  onData: (items: any[]) => void,
  onError?: (error: Error) => void
): () => void {
  if (!schoolId) return () => {};
  const q = query(collection(db, 'walletTransactions'), where('schoolId', '==', schoolId));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a: any, b: any) => {
        const at = a.createdAt?.toMillis?.() ?? (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const bt = b.createdAt?.toMillis?.() ?? (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return bt - at;
      });
      onData(items);
    },
    (error) => onError?.(error)
  );
}
