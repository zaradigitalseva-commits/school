```ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { db } from '@/firebase/config';

import type {
  AppUser,
  School,
  SchoolMembership,
  SchoolRegistrationInput,
  UserRole,
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

  /*
   * Platform Admin is controlled by the fixed email.
   *
   * Other management roles are preserved here,
   * but actual school access is verified through
   * active school membership in fetchUserRole().
   */
  let role: UserRole = 'user';

  if (isPlatformAdminEmail(normalizedEmail)) {
    role = 'platform_admin';
  } else if (
    existingUser?.role === 'school_admin'
  ) {
    role = 'school_admin';
  } else if (
    existingUser?.role === 'teacher'
  ) {
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

  /*
   * Create or update the user's basic record.
   */
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

  /*
   * Platform Admin has highest priority.
   */
  if (isPlatformAdminEmail(email)) {
    return 'platform_admin';
  }

  /*
   * Find ACTIVE school memberships.
   */
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

  /*
   * School Admin gets priority over Teacher
   * if the same Google account has both roles.
   */
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

  /*
   * Otherwise check for Teacher.
   */
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
  const name =
    input.name.trim();

  const slug =
    input.slug.trim().toLowerCase();

  const ownerEmail =
    input.ownerEmail.trim().toLowerCase();

  /*
   * Validation
   */
  if (!name) {
    throw new Error(
      'School name is required.'
    );
  }

  if (!slug) {
    throw new Error(
      'School slug is required.'
    );
  }

  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
      slug
    )
  ) {
    throw new Error(
      'School slug can contain only lowercase letters, numbers and hyphens.'
    );
  }

  if (!uid) {
    throw new Error(
      'You must be signed in to register a school.'
    );
  }

  if (!ownerEmail) {
    throw new Error(
      'Google account email is required.'
    );
  }

  /*
   * Create new School document reference.
   */
  const schoolRef = doc(
    collection(db, 'schools')
  );

  /*
   * Unique URL slug reservation.
   */
  const slugRef = doc(
    db,
    'slugReservations',
    slug
  );

  /*
   * School Admin membership.
   */
  const membershipRef = doc(
    db,
    'schoolMemberships',
    `${uid}_${schoolRef.id}`
  );

  const now =
    new Date().toISOString();

  /*
   * School record.
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

    tagline:
      input.tagline?.trim() ?? '',

    description:
      input.description?.trim() ?? '',
  };

  /*
   * School Admin membership.
   *
   * It remains PENDING until the Platform Admin
   * approves the school's payment.
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
   * Atomic transaction:
   *
   * 1. Check slug
   * 2. Create school
   * 3. Reserve slug
   * 4. Create school-admin membership
   */
  await runTransaction(
    db,
    async (transaction) => {
      const slugDoc =
        await transaction.get(
          slugRef
        );

      /*
       * Stop duplicate school URLs.
       */
      if (slugDoc.exists()) {
        throw new Error(
          'This school URL/slug is already registered. Please choose another.'
        );
      }

      /*
       * 1. Create pending school.
       */
      transaction.set(
        schoolRef,
        {
          ...school,
        }
      );

      /*
       * 2. Reserve unique slug.
       */
      transaction.set(
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

      /*
       * 3. Create pending School Admin membership.
       */
      transaction.set(
        membershipRef,
        {
          ...membership,
        }
      );
    }
  );

  return school;
}
```
