import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './config';

export const BILLING_PACKAGES = [
  { amount: 300, days: 28 },
  { amount: 600, days: 56 },
  { amount: 900, days: 84 },
  { amount: 1200, days: 112 },
  { amount: 3000, days: 280 },
] as const;

export type BillingPackage = (typeof BILLING_PACKAGES)[number];

export interface PaymentSettings {
  upiId: string;
  qrImageUrl: string;
  supportPhone: string;
  instructions: string;
}

export interface RechargeRequest {
  id: string;
  schoolId: string;
  uid: string;
  amount: number;
  days: number;
  utr: string;
  utrNormalized: string;
  proofImageUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: unknown;
  approvedAt?: unknown;
  rejectedAt?: unknown;
  rejectionReason?: string;
}

function normalizeUTR(utr: string): string {
  return utr.trim().toUpperCase().replace(/\s+/g, '');
}

function getPackage(amount: number, days: number): BillingPackage {
  const found = BILLING_PACKAGES.find(
    (item) => item.amount === amount && item.days === days
  );

  if (!found) {
    throw new Error('Invalid recharge package.');
  }

  return found;
}

function timestampToMillis(value: unknown): number {
  if (!value) return 0;

  if (
    typeof value === 'object' &&
    value !== null &&
    'toMillis' in value &&
    typeof (value as { toMillis?: unknown }).toMillis === 'function'
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'number') {
    return value;
  }

  return 0;
}

/* ---------------- PAYMENT SETTINGS ---------------- */

export async function fetchPaymentSettings(): Promise<PaymentSettings> {
  const ref = doc(db, 'platformSettings', 'payment');

  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return {
      upiId: '',
      qrImageUrl: '',
      supportPhone: '',
      instructions:
        'Payment करने के बाद UTR Number जरूर दर्ज करें।',
    };
  }

  const data = snapshot.data();

  return {
    upiId: String(data.upiId || ''),
    qrImageUrl: String(data.qrImageUrl || ''),
    supportPhone: String(data.supportPhone || ''),
    instructions: String(data.instructions || ''),
  };
}

export async function savePaymentSettings(
  settings: PaymentSettings
): Promise<void> {
  const ref = doc(db, 'platformSettings', 'payment');

  await runTransaction(db, async (transaction) => {
    transaction.set(
      ref,
      {
        upiId: settings.upiId.trim(),
        qrImageUrl: settings.qrImageUrl.trim(),
        supportPhone: settings.supportPhone.trim(),
        instructions: settings.instructions.trim(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
}

/* ---------------- RECHARGE REQUESTS ---------------- */

export async function createRechargeRequest(params: {
  schoolId: string;
  uid: string;
  amount: number;
  days: number;
  utr: string;
  proofImageUrl?: string;
}): Promise<string> {
  const selectedPackage = getPackage(params.amount, params.days);

  const utrNormalized = normalizeUTR(params.utr);

  if (!utrNormalized) {
    throw new Error('UTR Number required.');
  }

  if (!params.schoolId || !params.uid) {
    throw new Error('School and user information missing.');
  }

  const rechargeRef = doc(collection(db, 'rechargeRequests'));
  const utrRef = doc(db, 'utrReservations', utrNormalized);

  await runTransaction(db, async (transaction) => {
    const existingUTR = await transaction.get(utrRef);

    if (existingUTR.exists()) {
      throw new Error('This UTR Number has already been submitted.');
    }

    transaction.set(utrRef, {
      utrNormalized,
      rechargeRequestId: rechargeRef.id,
      schoolId: params.schoolId,
      uid: params.uid,
      createdAt: serverTimestamp(),
    });

    transaction.set(rechargeRef, {
      schoolId: params.schoolId,
      uid: params.uid,
      amount: selectedPackage.amount,
      days: selectedPackage.days,
      utr: params.utr.trim(),
      utrNormalized,
      proofImageUrl: params.proofImageUrl?.trim() || '',
      status: 'PENDING',
      createdAt: serverTimestamp(),
    });
  });

  return rechargeRef.id;
}

export async function fetchMyRechargeRequests(
  uid: string
): Promise<RechargeRequest[]> {
  const q = query(
    collection(db, 'rechargeRequests'),
    where('uid', '==', uid)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((item) => ({
      id: item.id,
      ...(item.data() as Omit<RechargeRequest, 'id'>),
    }))
    .sort(
      (a, b) =>
        timestampToMillis(b.createdAt) -
        timestampToMillis(a.createdAt)
    );
}

export async function fetchPendingRecharges(): Promise<
  RechargeRequest[]
> {
  const q = query(
    collection(db, 'rechargeRequests'),
    where('status', '==', 'PENDING')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((item) => ({
      id: item.id,
      ...(item.data() as Omit<RechargeRequest, 'id'>),
    }))
    .sort(
      (a, b) =>
        timestampToMillis(a.createdAt) -
        timestampToMillis(b.createdAt)
    );
}

/* ---------------- APPROVE RECHARGE ---------------- */

export async function approveRecharge(
  rechargeId: string
): Promise<void> {
  const rechargeRef = doc(db, 'rechargeRequests', rechargeId);

  await runTransaction(db, async (transaction) => {
    const rechargeSnap = await transaction.get(rechargeRef);

    if (!rechargeSnap.exists()) {
      throw new Error('Recharge request not found.');
    }

    const recharge = rechargeSnap.data();

    if (recharge.status === 'APPROVED') {
      return;
    }

    if (recharge.status !== 'PENDING') {
      throw new Error('This recharge is no longer pending.');
    }

    const schoolId = String(recharge.schoolId);
    const uid = String(recharge.uid);
    const amount = Number(recharge.amount);
    const days = Number(recharge.days);

    getPackage(amount, days);

    const schoolRef = doc(db, 'schools', schoolId);
    const walletRef = doc(db, 'wallets', schoolId);
    const subscriptionRef = doc(
      db,
      'subscriptions',
      schoolId
    );

    const membershipRef = doc(
      db,
      'schoolMemberships',
      `${uid}_${schoolId}`
    );

    const walletTransactionRef = doc(
      collection(db, 'walletTransactions')
    );

    const [
      schoolSnap,
      walletSnap,
      subscriptionSnap,
      membershipSnap,
    ] = await Promise.all([
      transaction.get(schoolRef),
      transaction.get(walletRef),
      transaction.get(subscriptionRef),
      transaction.get(membershipRef),
    ]);

    if (!schoolSnap.exists()) {
      throw new Error('School not found.');
    }

    /* Wallet */

    const oldWalletBalance = walletSnap.exists()
      ? Number(walletSnap.data().balance || 0)
      : 0;

    const newWalletBalance = oldWalletBalance + amount;

    transaction.set(
      walletRef,
      {
        schoolId,
        balance: newWalletBalance,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    /* Immutable wallet transaction */

    transaction.set(walletTransactionRef, {
      schoolId,
      type: 'CREDIT',
      amount,
      balanceAfter: newWalletBalance,
      source: 'RECHARGE',
      rechargeRequestId: rechargeId,
      utr: recharge.utr || '',
      createdAt: serverTimestamp(),
    });

    /* Subscription */

    const existingSubscription = subscriptionSnap.exists()
      ? subscriptionSnap.data()
      : {};

    const oldExpiry = timestampToMillis(
      existingSubscription.expiresAt
    );

    const baseTime = Math.max(Date.now(), oldExpiry);

    const newExpiry = new Date(
      baseTime + days * 24 * 60 * 60 * 1000
    );

    transaction.set(
      subscriptionRef,
      {
        schoolId,
        status: 'ACTIVE',
        planAmount: amount,
        planDays: days,
        startedAt:
          existingSubscription.startedAt ||
          serverTimestamp(),
        expiresAt: newExpiry,
        lastRechargeId: rechargeId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    /* School LIVE */

    transaction.update(schoolRef, {
      status: 'LIVE',
      updatedAt: serverTimestamp(),
    });

    /* School Admin membership */

    if (!membershipSnap.exists()) {
      transaction.set(membershipRef, {
        uid,
        schoolId,
        role: 'school_admin',
        status: 'ACTIVE',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      transaction.update(membershipRef, {
        role: 'school_admin',
        status: 'ACTIVE',
        updatedAt: serverTimestamp(),
      });
    }

    /* Recharge approved */

    transaction.update(rechargeRef, {
      status: 'APPROVED',
      approvedAt: serverTimestamp(),
    });
  });
}

/* ---------------- REJECT RECHARGE ---------------- */

export async function rejectRecharge(
  rechargeId: string,
  reason = 'Payment rejected by Platform Admin.'
): Promise<void> {
  const rechargeRef = doc(db, 'rechargeRequests', rechargeId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(rechargeRef);

    if (!snapshot.exists()) {
      throw new Error('Recharge request not found.');
    }

    const data = snapshot.data();

    if (data.status === 'APPROVED') {
      throw new Error(
        'Approved recharge cannot be rejected.'
      );
    }

    if (data.status === 'REJECTED') {
      return;
    }

    transaction.update(rechargeRef, {
      status: 'REJECTED',
      rejectionReason: reason.trim(),
      rejectedAt: serverTimestamp(),
    });
  });
}
