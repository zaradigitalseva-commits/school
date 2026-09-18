```ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
  writeBatch,
  query,
  where,
} from 'firebase/firestore';

import { db } from './config';

import type {
  School,
  SchoolInfo,
  SchoolMembership,
  SchoolRegistrationInput,
} from './types';

/* =========================================================
   PLATFORM ADMIN
========================================================= */

export function isPlatformAdminEmail(
  email?: string | null
): boolean {
  if (!email) return false;

  const platformAdminEmails = [
    'zaradigitalseva@gmail.com',
  ];

  const normalizedEmail =
    email.trim().toLowerCase();

  return platformAdminEmails.includes(
    normalizedEmail
  );
}

/* =========================================================
   ENSURE USER RECORD
========================================================= */

export async function ensureUserRecord(
  uid: string,
  email: string
): Promise<void> {
  if (!uid) {
    throw new Error(
      'User UID is required.'
    );
  }

  const cleanEmail =
    email?.trim().toLowerCase() || '';

  if (!cleanEmail) {
    throw new Error(
      'User email is required.'
    );
  }

  const userRef = doc(
    db,
    'users',
    uid
  );

  const userSnapshot =
    await getDoc(userRef);

  if (!userSnapshot.exists()) {
    await setDoc(
      userRef,
      {
        uid,
        email: cleanEmail,
        role:
          isPlatformAdminEmail(
            cleanEmail
          )
            ? 'platform_admin'
            : 'user',
        createdAt:
          serverTimestamp(),
        updatedAt:
          serverTimestamp(),
      }
    );
  }
}

/* =========================================================
   FETCH USER ROLE
========================================================= */

export async function fetchUserRole(
  uid: string
): Promise<string | null> {
  if (!uid) {
    return null;
  }

  const userRef = doc(
    db,
    'users',
    uid
  );

  const userSnapshot =
    await getDoc(userRef);

  if (!userSnapshot.exists()) {
    return null;
  }

  const data =
    userSnapshot.data();

  return typeof data.role === 'string'
    ? data.role
    : null;
}

/* =========================================================
   FETCH PUBLIC SCHOOLS
   Only LIVE schools are shown publicly.
========================================================= */

export async function fetchPublicSchools(): Promise<
  School[]
> {
  const schoolsRef =
    collection(
      db,
      'schools'
    );

  const schoolsQuery =
    query(
      schoolsRef,
      where(
        'status',
        '==',
        'LIVE'
      )
    );

  const snapshot =
    await getDocs(
      schoolsQuery
    );

  return snapshot.docs.map(
    (schoolDoc) => ({
      id: schoolDoc.id,
      ...schoolDoc.data(),
    } as School)
  );
}

/* =========================================================
   FETCH SCHOOL INFO
========================================================= */

export async function fetchSchoolInfo(
  schoolId: string
): Promise<SchoolInfo | null> {
  if (!schoolId) {
    return null;
  }

  const schoolRef =
    doc(
      db,
      'schools',
      schoolId
    );

  const snapshot =
    await getDoc(
      schoolRef
    );

  if (!snapshot.exists()) {
    return null;
  }

  const data =
    snapshot.data();

  return {
    ...data,
    id: snapshot.id,
  } as SchoolInfo;
}

/* =========================================================
   REGISTER SCHOOL
========================================================= */

export async function registerSchool(
  ownerUid: string,
  input: SchoolRegistrationInput,
  ownerEmail: string
): Promise<School> {

  /* =======================================================
     BASIC INPUT
  ======================================================= */

  if (!ownerUid) {
    throw new Error(
      'Owner UID is required.'
    );
  }

  if (!input) {
    throw new Error(
      'School registration data is required.'
    );
  }

  /* =======================================================
     CLEAN DATA
  ======================================================= */

  const cleanName =
    input.name?.trim() || '';

  const cleanSlug =
    input.slug
      ?.trim()
      .toLowerCase() || '';

  const cleanPhone =
    input.phone?.trim() || '';

  const cleanWhatsappNumber =
    input.whatsappNumber
      ?.trim() || '';

  const cleanEmail =
    ownerEmail
      ?.trim()
      .toLowerCase() || '';

  /* =======================================================
     BASIC VALIDATION
  ======================================================= */

  if (!cleanName) {
    throw new Error(
      'School name is required.'
    );
  }

  if (!cleanSlug) {
    throw new Error(
      'School URL/slug is required.'
    );
  }

  /* =======================================================
     SLUG VALIDATION
  ======================================================= */

  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
      cleanSlug
    )
  ) {
    throw new Error(
      'School URL can contain only lowercase letters, numbers and hyphens.'
    );
  }

  /* =======================================================
     EMAIL VALIDATION
  ======================================================= */

  if (!cleanEmail) {
    throw new Error(
      'Google account email is required.'
    );
  }

  /* =======================================================
     WHATSAPP NUMBER
  ======================================================= */

  if (!cleanWhatsappNumber) {
    throw new Error(
      'WhatsApp number is required.'
    );
  }

  if (
    !/^[6-9][0-9]{9}$/.test(
      cleanWhatsappNumber
    )
  ) {
    throw new Error(
      'WhatsApp number must be a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9.'
    );
  }

  /* =======================================================
     WHATSAPP CONFIRMATION
     This is owner confirmation, not OTP verification.
========================================================= */

  if (
    input.whatsappVerified !== true
  ) {
    throw new Error(
      'Please confirm that the WhatsApp number is correct.'
    );
  }

  /* =======================================================
     OPTIONAL PHONE VALIDATION
========================================================= */

  if (
    cleanPhone &&
    !/^[6-9][0-9]{9}$/.test(
      cleanPhone
    )
  ) {
    throw new Error(
      'Phone number must be a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9.'
    );
  }

  /* =======================================================
     CHECK SCHOOL URL / SLUG
========================================================= */

  const slugRef =
    doc(
      db,
      'slugReservations',
      cleanSlug
    );

  const slugSnapshot =
    await getDoc(
      slugRef
    );

  if (slugSnapshot.exists()) {
    throw new Error(
      'This school URL is already registered. Please use a different school name.'
    );
  }

  /* =======================================================
     GENERATE SCHOOL ID
========================================================= */

  const schoolRef =
    doc(
      collection(
        db,
        'schools'
      )
    );

  const schoolId =
    schoolRef.id;

  /* =======================================================
     GENERATE MEMBERSHIP ID
========================================================= */

  const membershipId =
    ownerUid + '_' + schoolId;

  const membershipRef =
    doc(
      db,
      'schoolMemberships',
      membershipId
    );

  /* =======================================================
     TIMESTAMP
========================================================= */

  const now =
    new Date().toISOString();

  /* =======================================================
     SCHOOL DOCUMENT
========================================================= */

  const school: School = {
    id: schoolId,

    name: cleanName,

    slug: cleanSlug,

    ownerUid,

    ownerEmail: cleanEmail,

    status:
      'PENDING_PAYMENT',

    createdAt: now,

    updatedAt: now,

    phone: cleanPhone,

    whatsappNumber:
      cleanWhatsappNumber,

    whatsappVerified: true,

    address:
      input.address?.trim() || '',

    tagline:
      input.tagline?.trim() || '',

    description:
      input.description?.trim() || '',

    paymentStatus:
      'PENDING',

    subscriptionStatus:
      'PENDING',
  };

  /* =======================================================
     SCHOOL ADMIN MEMBERSHIP
========================================================= */

  const membership:
    SchoolMembership = {

    id: membershipId,

    schoolId,

    uid: ownerUid,

    email: cleanEmail,

    role:
      'school_admin',

    status:
      'PENDING',

    assignments: [],

    createdAt: now,

    updatedAt: now,
  };

  /* =======================================================
     FIRESTORE BATCH
========================================================= */

  const batch =
    writeBatch(db);

  /* =======================================================
     SCHOOL
========================================================= */

  batch.set(
    schoolRef,
    school
  );

  /* =======================================================
     SCHOOL ADMIN MEMBERSHIP
========================================================= */

  batch.set(
    membershipRef,
    membership
  );

  /* =======================================================
     SLUG RESERVATION
========================================================= */

  batch.set(
    slugRef,
    {
      slug: cleanSlug,

      schoolId,

      schoolName: cleanName,

      ownerUid,

      createdAt:
        serverTimestamp(),
    }
  );

  /* =======================================================
     SAVE
========================================================= */

  await batch.commit();

  return school;
}
```
