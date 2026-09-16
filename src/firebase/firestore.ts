import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  setDoc,
  writeBatch,
  orderBy,
} from 'firebase/firestore';

import { db } from '@/firebase/config';

import type {
  AppUser,
  School,
  SchoolMembership,
  SchoolRegistrationInput,
  UserRole,
  SchoolInfo,
  Announcement,
  SchoolEvent,
  Teacher,
} from '@/firebase/types';

/*
|--------------------------------------------------------------------------
| PLATFORM ADMIN
|--------------------------------------------------------------------------
*/

export const PLATFORM_ADMIN_EMAIL = 'ngogrant454@gmail.com';

export function isPlatformAdminEmail(
  email?: string | null
): boolean {
  if (!email) return false;

  return (
    email.trim().toLowerCase() ===
    PLATFORM_ADMIN_EMAIL.toLowerCase()
  );
}

/*
|--------------------------------------------------------------------------
| ENSURE USER RECORD
|--------------------------------------------------------------------------
*/

export async function ensureUserRecord(
  uid: string,
  email?: string | null,
  displayName?: string | null,
  photoURL?: string | null
): Promise<AppUser> {
  if (!uid) {
    throw new Error('User ID is required.');
  }

  const normalizedEmail =
    (email ?? '').trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error('User email is required.');
  }

  const userRef = doc(db, 'users', uid);

  const existingSnapshot =
    await getDoc(userRef);

  const existingUser =
    existingSnapshot.exists()
      ? (existingSnapshot.data() as Partial<AppUser>)
      : null;

  const now = new Date().toISOString();

  let role: UserRole = 'user';

  if (isPlatformAdminEmail(normalizedEmail)) {
    role = 'platform_admin';
  } else if (existingUser?.role === 'school_admin') {
    role = 'school_admin';
  } else if (existingUser?.role === 'teacher') {
    role = 'teacher';
  }

  const user: AppUser = {
    uid,

    email: normalizedEmail,

    displayName:
      displayName?.trim() ||
      existingUser?.displayName ||
      normalizedEmail.split('@')[0],

    ...(photoURL || existingUser?.photoURL
      ? {
          photoURL:
            photoURL ??
            existingUser?.photoURL,
        }
      : {}),

    role,

    createdAt:
      existingUser?.createdAt ??
      now,

    updatedAt: now,

    lastLoginAt: now,
  };

  await setDoc(
    userRef,
    user,
    {
      merge: true,
    }
  );

  return user;
}

/*
|--------------------------------------------------------------------------
| FETCH USER ROLE
|--------------------------------------------------------------------------
*/

export async function fetchUserRole(
  uid: string,
  email?: string | null
): Promise<UserRole> {
  if (!uid) {
    return 'user';
  }

  if (isPlatformAdminEmail(email)) {
    return 'platform_admin';
  }

  const membershipQuery = query(
    collection(db, 'schoolMemberships'),
    where('uid', '==', uid),
    where('status', '==', 'ACTIVE')
  );

  const membershipSnapshot =
    await getDocs(membershipQuery);

  if (membershipSnapshot.empty) {
    return 'user';
  }

  for (
    const membershipDoc of
    membershipSnapshot.docs
  ) {
    const membership =
      membershipDoc.data() as SchoolMembership;

    if (
      membership.role === 'school_admin'
    ) {
      return 'school_admin';
    }
  }

  for (
    const membershipDoc of
    membershipSnapshot.docs
  ) {
    const membership =
      membershipDoc.data() as SchoolMembership;

    if (
      membership.role === 'teacher'
    ) {
      return 'teacher';
    }
  }

  return 'user';
}

/*
|--------------------------------------------------------------------------
| REGISTER SCHOOL
|--------------------------------------------------------------------------
*/

export async function registerSchool(
  uid: string,
  input: SchoolRegistrationInput
): Promise<School> {
  if (!uid) {
    throw new Error(
      'You must be signed in to register a school.'
    );
  }

  const name =
    input.name?.trim() ?? '';

  const slug =
    input.slug?.trim().toLowerCase() ?? '';

  const ownerEmail =
    input.ownerEmail?.trim().toLowerCase() ?? '';

  const phone =
    input.phone?.trim() ?? '';

  /*
   * School name
   */

  if (!name) {
    throw new Error(
      'School name is required.'
    );
  }

  /*
   * School URL slug
   */

  if (!slug) {
    throw new Error(
      'School URL/slug could not be created from the school name.'
    );
  }

  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
      slug
    )
  ) {
    throw new Error(
      'School URL/slug can contain only lowercase letters, numbers and hyphens.'
    );
  }

  /*
   * Google account email
   */

  if (!ownerEmail) {
    throw new Error(
      'Google account email is required.'
    );
  }

  /*
   * Mobile number
   */

  if (!phone) {
    throw new Error(
      'School mobile number is required.'
    );
  }

  if (
    !/^[0-9+()\-\s]{10,18}$/.test(
      phone
    )
  ) {
    throw new Error(
      'Please enter a valid school mobile number.'
    );
  }

  /*
   * References
   */

  const schoolRef = doc(
    collection(db, 'schools')
  );

  const slugRef = doc(
    db,
    'slugReservations',
    slug
  );

  const membershipRef = doc(
    db,
    'schoolMemberships',
    `${uid}_${schoolRef.id}`
  );

  /*
   * Check duplicate slug
   */

  const existingSlug =
    await getDoc(slugRef);

  if (existingSlug.exists()) {
    throw new Error(
      'This school URL/slug is already registered. Please use a different school name.'
    );
  }

  const now =
    new Date().toISOString();

  /*
   * School document
   */

  const school: School = {
    id: schoolRef.id,

    name,

    slug,

    ownerUid: uid,

    ownerEmail,

    status: 'PENDING_PAYMENT',

    createdAt: now,

    updatedAt: now,

    phone,

    tagline:
      input.tagline?.trim() ?? '',

    description:
      input.description?.trim() ?? '',
  };

  /*
   * School admin membership
   */

  const membership: SchoolMembership = {
    id: membershipRef.id,

    uid,

    schoolId: schoolRef.id,

    role: 'school_admin',

    status: 'PENDING',

    assignments: [],

    createdAt: now,

    updatedAt: now,
  };

  /*
   * Atomic batch
   */

  const batch =
    writeBatch(db);

  batch.set(
    schoolRef,
    school
  );

  batch.set(
    slugRef,
    {
      slug,

      schoolId:
        schoolRef.id,

      ownerUid: uid,

      createdAt:
        serverTimestamp(),
    }
  );

  batch.set(
    membershipRef,
    membership
  );

  await batch.commit();

  return school;
}

/*
|--------------------------------------------------------------------------
| FETCH SCHOOL INFO
|--------------------------------------------------------------------------
|
| Compatibility with the existing public HomePage.
| useSchoolInfo() calls this without an argument.
|
| Data is read from:
| settings/schoolInfo
|
*/

export async function fetchSchoolInfo(): Promise<SchoolInfo | null> {
  const schoolInfoRef = doc(
    db,
    'settings',
    'schoolInfo'
  );

  const snapshot =
    await getDoc(schoolInfoRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as SchoolInfo;
}

/*
|--------------------------------------------------------------------------
| FETCH ANNOUNCEMENTS
|--------------------------------------------------------------------------
*/

export async function fetchAnnouncements(): Promise<
  Announcement[]
> {
  try {
    const announcementsRef =
      collection(
        db,
        'announcements'
      );

    const q = query(
      announcementsRef,
      orderBy('date', 'desc')
    );

    const snapshot =
      await getDocs(q);

    return snapshot.docs.map(
      (item) => ({
        id: item.id,
        ...(item.data() as Omit<
          Announcement,
          'id'
        >),
      })
    );
  } catch (error) {
    console.error(
      'Failed to fetch announcements:',
      error
    );

    return [];
  }
}

/*
|--------------------------------------------------------------------------
| FETCH EVENTS
|--------------------------------------------------------------------------
*/

export async function fetchEvents(): Promise<
  SchoolEvent[]
> {
  try {
    const eventsRef =
      collection(
        db,
        'events'
      );

    const q = query(
      eventsRef,
      orderBy('date', 'asc')
    );

    const snapshot =
      await getDocs(q);

    return snapshot.docs.map(
      (item) => ({
        id: item.id,
        ...(item.data() as Omit<
          SchoolEvent,
          'id'
        >),
      })
    );
  } catch (error) {
    console.error(
      'Failed to fetch events:',
      error
    );

    return [];
  }
}

/*
|--------------------------------------------------------------------------
| FETCH TEACHERS
|--------------------------------------------------------------------------
*/

export async function fetchTeachers(): Promise<
  Teacher[]
> {
  try {
    const teachersRef =
      collection(
        db,
        'teachers'
      );

    const q = query(
      teachersRef,
      orderBy('order', 'asc')
    );

    const snapshot =
      await getDocs(q);

    return snapshot.docs.map(
      (item) => ({
        id: item.id,
        ...(item.data() as Omit<
          Teacher,
          'id'
        >),
      })
    );
  } catch (error) {
    console.error(
      'Failed to fetch teachers:',
      error
    );

    return [];
  }
}

/*
|--------------------------------------------------------------------------
| FORMAT DATE
|--------------------------------------------------------------------------
*/

export function formatDate(
  value?: string | Date | null
): string {
  if (!value) {
    return '';
  }

  try {
    const date =
      value instanceof Date
        ? value
        : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );
  } catch {
    return String(value);
  }
}
