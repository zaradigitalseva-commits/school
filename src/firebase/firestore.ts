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
  limit,
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

/* =========================================================
   PLATFORM ADMIN
========================================================= */

export const PLATFORM_ADMIN_EMAIL =
  'ngogrant454@gmail.com';

/* =========================================================
   USER RECORD
========================================================= */

export async function ensureUserRecord(
  uid: string,
  email: string,
  displayName?: string | null,
  photoURL?: string | null
): Promise<AppUser> {
  if (!uid) {
    throw new Error('User UID is required.');
  }

  const cleanEmail = email?.trim().toLowerCase() || '';

  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);

  const now = new Date().toISOString();

  if (!snapshot.exists()) {
    const role: UserRole =
      cleanEmail === PLATFORM_ADMIN_EMAIL
        ? 'platform_admin'
        : 'user';

    const newUser: AppUser = {
      uid,
      email: cleanEmail,
      displayName:
        displayName?.trim() || undefined,
      photoURL:
        photoURL?.trim() || undefined,
      role,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
      active: true,
    };

    await setDoc(userRef, newUser);

    return newUser;
  }

  const existingUser =
    snapshot.data() as AppUser;

  const updateData: Partial<AppUser> = {
    email: cleanEmail || existingUser.email,
    updatedAt: now,
    lastLoginAt: now,
    active: true,
  };

  if (displayName !== undefined) {
    updateData.displayName =
      displayName?.trim() || undefined;
  }

  if (photoURL !== undefined) {
    updateData.photoURL =
      photoURL?.trim() || undefined;
  }

  /*
   * Platform admin role is controlled by the
   * configured platform admin email.
   */
  if (cleanEmail === PLATFORM_ADMIN_EMAIL) {
    updateData.role = 'platform_admin';
  }

  await setDoc(
    userRef,
    updateData,
    { merge: true }
  );

  return {
    ...existingUser,
    ...updateData,
    uid,
  } as AppUser;
}

/* =========================================================
   FETCH USER ROLE
========================================================= */

export async function fetchUserRole(
  uid: string
): Promise<UserRole> {
  if (!uid) {
    return 'user';
  }

  try {
    const userRef = doc(
      db,
      'users',
      uid
    );

    const userSnapshot =
      await getDoc(userRef);

    /*
     * Only platform_admin from the user document
     * is treated as a global role.
     *
     * Normal "user" must NOT immediately return,
     * because the user may have an ACTIVE
     * school membership.
     */
    if (userSnapshot.exists()) {
      const user =
        userSnapshot.data() as AppUser;

      if (user.role === 'platform_admin') {
        return 'platform_admin';
      }
    }

    /*
     * Check active school membership.
     */
    const membershipsRef =
      collection(
        db,
        'schoolMemberships'
      );

    const membershipQuery =
      query(
        membershipsRef,
        where('uid', '==', uid),
        where('status', '==', 'ACTIVE'),
        limit(10)
      );

    const membershipSnapshot =
      await getDocs(
        membershipQuery
      );

    if (!membershipSnapshot.empty) {
      /*
       * Prefer school_admin if user has one.
       */
      for (
        const membershipDoc
        of membershipSnapshot.docs
      ) {
        const membership =
          membershipDoc.data() as SchoolMembership;

        if (
          membership.role ===
          'school_admin'
        ) {
          return 'school_admin';
        }
      }

      /*
       * Otherwise teacher.
       */
      for (
        const membershipDoc
        of membershipSnapshot.docs
      ) {
        const membership =
          membershipDoc.data() as SchoolMembership;

        if (
          membership.role ===
          'teacher'
        ) {
          return 'teacher';
        }
      }
    }

    return 'user';
  } catch (error) {
    console.error(
      'Failed to fetch user role:',
      error
    );

    return 'user';
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

  const cleanName =
    input.name?.trim();

  const cleanSlug =
    input.slug
      ?.trim()
      .toLowerCase();

  const cleanPhone =
    input.phone?.trim();

  const cleanEmail =
    ownerEmail
      ?.trim()
      .toLowerCase();

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

  if (!cleanPhone) {
    throw new Error(
      'Mobile number is required.'
    );
  }

  if (!cleanEmail) {
    throw new Error(
      'Google account email is required.'
    );
  }

  /*
   * Check whether slug already exists.
   */
  const slugRef = doc(
    db,
    'slugReservations',
    cleanSlug
  );

  const slugSnapshot =
    await getDoc(slugRef);

  if (slugSnapshot.exists()) {
    throw new Error(
      'This school URL is already registered. Please use a different school name.'
    );
  }

  /*
   * Generate IDs.
   */
  const schoolRef =
    doc(collection(db, 'schools'));

  const schoolId =
    schoolRef.id;

  const membershipId =
    `${ownerUid}_${schoolId}`;

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

    status: 'PENDING_PAYMENT',

    createdAt: now,
    updatedAt: now,

    phone: cleanPhone,

    tagline:
      input.tagline?.trim() || undefined,

    description:
      input.description?.trim() || undefined,

    paymentStatus: 'PENDING',
    subscriptionStatus: 'PENDING',
  };

  const membership:
    SchoolMembership = {
    id: membershipId,
    schoolId,
    uid: ownerUid,
    email: cleanEmail,
    role: 'school_admin',
    status: 'PENDING',
    assignments: [],
    createdAt: now,
    updatedAt: now,
  };

  const batch =
    writeBatch(db);

  /*
   * School
   */
  batch.set(
    schoolRef,
    school
  );

  /*
   * Owner membership
   */
  batch.set(
    membershipRef,
    membership
  );

  /*
   * Slug reservation
   */
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

/* =========================================================
   SCHOOL INFO
========================================================= */

export async function fetchSchoolInfo():
  Promise<SchoolInfo | null> {
  try {
    const infoRef =
      doc(
        db,
        'settings',
        'schoolInfo'
      );

    const snapshot =
      await getDoc(infoRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.data() as SchoolInfo;
  } catch (error) {
    console.error(
      'Failed to fetch school info:',
      error
    );

    return null;
  }
}

/* =========================================================
   ANNOUNCEMENTS
========================================================= */

export async function fetchAnnouncements():
  Promise<Announcement[]> {
  try {
    const announcementsRef =
      collection(
        db,
        'announcements'
      );

    const announcementsQuery =
      query(
        announcementsRef,
        orderBy(
          'createdAt',
          'desc'
        ),
        limit(50)
      );

    const snapshot =
      await getDocs(
        announcementsQuery
      );

    return snapshot.docs.map(
      (item) => ({
        id: item.id,
        ...item.data(),
      } as Announcement)
    );
  } catch (error) {
    console.error(
      'Failed to fetch announcements:',
      error
    );

    return [];
  }
}

/* =========================================================
   EVENTS
========================================================= */

export async function fetchEvents():
  Promise<SchoolEvent[]> {
  try {
    const eventsRef =
      collection(
        db,
        'events'
      );

    const eventsQuery =
      query(
        eventsRef,
        orderBy(
          'createdAt',
          'desc'
        ),
        limit(50)
      );

    const snapshot =
      await getDocs(
        eventsQuery
      );

    return snapshot.docs.map(
      (item) => ({
        id: item.id,
        ...item.data(),
      } as SchoolEvent)
    );
  } catch (error) {
    console.error(
      'Failed to fetch events:',
      error
    );

    return [];
  }
}

/* =========================================================
   TEACHERS
========================================================= */

export async function fetchTeachers():
  Promise<Teacher[]> {
  try {
    const teachersRef =
      collection(
        db,
        'teachers'
      );

    const teachersQuery =
      query(
        teachersRef,
        orderBy(
          'createdAt',
          'desc'
        ),
        limit(100)
      );

    const snapshot =
      await getDocs(
        teachersQuery
      );

    return snapshot.docs.map(
      (item) => ({
        id: item.id,
        ...item.data(),
      } as Teacher)
    );
  } catch (error) {
    console.error(
      'Failed to fetch teachers:',
      error
    );

    return [];
  }
}

/* =========================================================
   PUBLIC SCHOOLS
========================================================= */

export async function fetchPublicSchools():
  Promise<School[]> {
  try {
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

    const schools =
      snapshot.docs.map(
        (item) => ({
          id: item.id,
          ...item.data(),
        } as School)
      );

    schools.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

    return schools;
  } catch (error) {
    console.error(
      'Failed to fetch public schools:',
      error
    );

    return [];
  }
}

/* =========================================================
   ALL SCHOOLS
========================================================= */

export async function fetchAllSchools():
  Promise<School[]> {
  try {
    const schoolsRef =
      collection(
        db,
        'schools'
      );

    const schoolsQuery =
      query(
        schoolsRef,
        orderBy(
          'createdAt',
          'desc'
        )
      );

    const snapshot =
      await getDocs(
        schoolsQuery
      );

    return snapshot.docs.map(
      (item) => ({
        id: item.id,
        ...item.data(),
      } as School)
    );
  } catch (error) {
    console.error(
      'Failed to fetch all schools:',
      error
    );

    return [];
  }
}

/* =========================================================
   UPDATE SCHOOL STATUS
========================================================= */

export async function updateSchoolStatus(
  schoolId: string,
  status: School['status'],
  approvedByUid?: string,
  suspensionReason?: string
): Promise<void> {
  if (!schoolId) {
    throw new Error(
      'School ID is required.'
    );
  }

  const schoolRef =
    doc(
      db,
      'schools',
      schoolId
    );

  const schoolSnapshot =
    await getDoc(schoolRef);

  if (!schoolSnapshot.exists()) {
    throw new Error(
      'School not found.'
    );
  }

  const school =
    schoolSnapshot.data() as School;

  const now =
    new Date().toISOString();

  const schoolUpdates:
    Partial<School> = {
    status,
    updatedAt: now,
  };

  if (status === 'LIVE') {
    schoolUpdates.paymentStatus =
      'PAID';

    schoolUpdates.subscriptionStatus =
      'ACTIVE';

    if (approvedByUid) {
      schoolUpdates.approvedByUid =
        approvedByUid;

      schoolUpdates.approvedAt =
        now;
    }
  }

  if (status === 'SUSPENDED') {
    schoolUpdates.suspendedAt =
      now;

    if (suspensionReason) {
      schoolUpdates.suspensionReason =
        suspensionReason;
    }
  }

  if (status === 'ARCHIVED') {
    schoolUpdates.archivedAt =
      now;
  }

  const batch =
    writeBatch(db);

  batch.set(
    schoolRef,
    schoolUpdates,
    { merge: true }
  );

  /*
   * When a school becomes LIVE,
   * activate its school_admin membership(s).
   */
  if (status === 'LIVE') {
    const membershipsRef =
      collection(
        db,
        'schoolMemberships'
      );

    const membershipQuery =
      query(
        membershipsRef,
        where(
          'schoolId',
          '==',
          schoolId
        ),
        where(
          'role',
          '==',
          'school_admin'
        )
      );

    const membershipSnapshot =
      await getDocs(
        membershipQuery
      );

    for (
      const membershipDoc
      of membershipSnapshot.docs
    ) {
      batch.set(
        membershipDoc.ref,
        {
          status: 'ACTIVE',
          updatedAt: now,
          approvedByUid:
            approvedByUid || null,
          approvedAt: now,
        },
        { merge: true }
      );
    }
  }

  await batch.commit();

  /*
   * Keep TypeScript aware that school was
   * intentionally read before updating.
   */
  void school;
}

/* =========================================================
   SCHOOL BY SLUG
========================================================= */

export async function fetchSchoolBySlug(
  slug: string
): Promise<School | null> {
  const cleanSlug =
    slug?.trim().toLowerCase();

  if (!cleanSlug) {
    return null;
  }

  try {
    const schoolsRef =
      collection(
        db,
        'schools'
      );

    const schoolQuery =
      query(
        schoolsRef,
        where(
          'slug',
          '==',
          cleanSlug
        ),
        where(
          'status',
          '==',
          'LIVE'
        ),
        limit(1)
      );

    const snapshot =
      await getDocs(
        schoolQuery
      );

    if (snapshot.empty) {
      return null;
    }

    const item =
      snapshot.docs[0];

    return {
      id: item.id,
      ...item.data(),
    } as School;
  } catch (error) {
    console.error(
      'Failed to fetch school by slug:',
      error
    );

    return null;
  }
}

/* =========================================================
   SCHOOL BY ID
========================================================= */

export async function fetchSchoolById(
  schoolId: string
): Promise<School | null> {
  if (!schoolId) {
    return null;
  }

  try {
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

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as School;
  } catch (error) {
    console.error(
      'Failed to fetch school by ID:',
      error
    );

    return null;
  }
}

/* =========================================================
   MY MEMBERSHIP
========================================================= */

export async function fetchMyMembership(
  uid: string,
  schoolId: string
): Promise<SchoolMembership | null> {
  if (!uid || !schoolId) {
    return null;
  }

  try {
    const membershipId =
      `${uid}_${schoolId}`;

    const membershipRef =
      doc(
        db,
        'schoolMemberships',
        membershipId
      );

    const snapshot =
      await getDoc(
        membershipRef
      );

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as SchoolMembership;
  } catch (error) {
    console.error(
      'Failed to fetch membership:',
      error
    );

    return null;
  }
}

/* =========================================================
   SCHOOL MEMBERSHIPS
========================================================= */

export async function fetchSchoolMemberships(
  schoolId: string
): Promise<SchoolMembership[]> {
  if (!schoolId) {
    return [];
  }

  try {
    const membershipsRef =
      collection(
        db,
        'schoolMemberships'
      );

    const membershipsQuery =
      query(
        membershipsRef,
        where(
          'schoolId',
          '==',
          schoolId
        )
      );

    const snapshot =
      await getDocs(
        membershipsQuery
      );

    return snapshot.docs.map(
      (item) => ({
        id: item.id,
        ...item.data(),
      } as SchoolMembership)
    );
  } catch (error) {
    console.error(
      'Failed to fetch school memberships:',
      error
    );

    return [];
  }
}

/* =========================================================
   UPDATE SCHOOL MEMBERSHIP
   FIX FOR VERCEL BUILD ERROR
========================================================= */

export async function updateSchoolMembership(
  membershipId: string,
  updates: Partial<SchoolMembership>
): Promise<void> {
  if (!membershipId) {
    throw new Error(
      'Membership ID is required.'
    );
  }

  const membershipRef =
    doc(
      db,
      'schoolMemberships',
      membershipId
    );

  const snapshot =
    await getDoc(
      membershipRef
    );

  if (!snapshot.exists()) {
    throw new Error(
      'Membership not found.'
    );
  }

  /*
   * Do not allow these identity fields
   * to be changed through this helper.
   */
  const safeUpdates:
    Partial<SchoolMembership> = {
    ...updates,
  };

  delete safeUpdates.id;
  delete safeUpdates.schoolId;
  delete safeUpdates.uid;

  const now =
    new Date().toISOString();

  /*
   * Automatically maintain approval/revocation
   * timestamps when status changes.
   */
  if (
    safeUpdates.status ===
    'ACTIVE'
  ) {
    safeUpdates.approvedAt =
      safeUpdates.approvedAt ||
      now;

    safeUpdates.revokedAt =
      undefined;
  }

  if (
    safeUpdates.status ===
    'REVOKED'
  ) {
    safeUpdates.revokedAt =
      safeUpdates.revokedAt ||
      now;
  }

  safeUpdates.updatedAt =
    now;

  await setDoc(
    membershipRef,
    safeUpdates,
    {
      merge: true,
    }
  );
}

/* =========================================================
   FORMAT DATE
========================================================= */

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

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return '';
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
    return '';
  }
}
