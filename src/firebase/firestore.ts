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
  Teacher,
  Announcement,
  SchoolEvent,
} from './types';


/* =========================================================
   PLATFORM ADMIN
========================================================= */

export const PLATFORM_ADMIN_EMAIL =
  'ngogrant454@gmail.com';

export function isPlatformAdminEmail(
  email?: string | null
): boolean {
  if (!email) {
    return false;
  }

  return (
    email.trim().toLowerCase() ===
    PLATFORM_ADMIN_EMAIL.toLowerCase()
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

  const userRef =
    doc(
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
        role: isPlatformAdminEmail(
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

  const userRef =
    doc(
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
   FETCH TEACHERS
========================================================= */

export async function fetchTeachers(
  schoolId?: string
): Promise<Teacher[]> {
  if (!schoolId) {
    return [];
  }

  const teachersRef =
    collection(
      db,
      'teachers'
    );

  const teachersQuery =
    query(
      teachersRef,
      where(
        'schoolId',
        '==',
        schoolId
      )
    );

  const snapshot =
    await getDocs(
      teachersQuery
    );

  return snapshot.docs.map(
    (teacherDoc) => ({
      id: teacherDoc.id,
      ...teacherDoc.data(),
    } as Teacher)
  );
}


/* =========================================================
   FETCH ANNOUNCEMENTS / NOTICES
========================================================= */

export async function fetchAnnouncements(
  schoolId?: string
): Promise<Announcement[]> {
  if (!schoolId) {
    return [];
  }

  const announcementsRef =
    collection(
      db,
      'announcements'
    );

  const announcementsQuery =
    query(
      announcementsRef,
      where(
        'schoolId',
        '==',
        schoolId
      )
    );

  const snapshot =
    await getDocs(
      announcementsQuery
    );

  return snapshot.docs.map(
    (announcementDoc) => ({
      id: announcementDoc.id,
      ...announcementDoc.data(),
    } as Announcement)
  );
}


/* =========================================================
   FETCH EVENTS
========================================================= */

export async function fetchEvents(
  schoolId?: string
): Promise<SchoolEvent[]> {
  if (!schoolId) {
    return [];
  }

  const eventsRef =
    collection(
      db,
      'events'
    );

  const eventsQuery =
    query(
      eventsRef,
      where(
        'schoolId',
        '==',
        schoolId
      )
    );

  const snapshot =
    await getDocs(
      eventsQuery
    );

  return snapshot.docs.map(
    (eventDoc) => ({
      id: eventDoc.id,
      ...eventDoc.data(),
    } as SchoolEvent)
  );
}


/* =========================================================
   FORMAT DATE
========================================================= */

export function formatDate(
  value: unknown
): string {
  if (!value) {
    return '';
  }

  try {
    if (
      typeof value === 'object' &&
      value !== null &&
      'toDate' in value &&
      typeof (
        value as {
          toDate: () => Date;
        }
      ).toDate === 'function'
    ) {
      return (
        value as {
          toDate: () => Date;
        }
      )
        .toDate()
        .toLocaleDateString('en-IN');
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number'
    ) {
      const date =
        new Date(value);

      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString(
          'en-IN'
        );
      }
    }

    return '';
  } catch {
    return '';
  }
}


/* =========================================================
   REGISTER SCHOOL
========================================================= */

export async function registerSchool(
  ownerUid: string,
  input: SchoolRegistrationInput,
  ownerEmail: string
): Promise<School> {

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

  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
      cleanSlug
    )
  ) {
    throw new Error(
      'School URL can contain only lowercase letters, numbers and hyphens.'
    );
  }

  if (!cleanEmail) {
    throw new Error(
      'Google account email is required.'
    );
  }

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

  if (
    input.whatsappVerified !== true
  ) {
    throw new Error(
      'Please confirm that the WhatsApp number is correct.'
    );
  }

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

  const schoolRef =
    doc(
      collection(
        db,
        'schools'
      )
    );

  const schoolId =
    schoolRef.id;

  const membershipId =
    ownerUid + '_' + schoolId;

  const membershipRef =
    doc(
      db,
      'schoolMemberships',
      membershipId
    );

  const now =
    new Date().toISOString();

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

  const batch =
    writeBatch(db);

  batch.set(
    schoolRef,
    school
  );

  batch.set(
    membershipRef,
    membership
  );

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

  await batch.commit();

  return school;
}
```
