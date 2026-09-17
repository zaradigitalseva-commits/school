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
  deleteDoc,
  updateDoc,
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

/**
 * Checks whether a given email belongs to the platform admin.
 * Case-insensitive and whitespace-tolerant.
 */
export function isPlatformAdminEmail(
  email?: string | null
): boolean {
  if (!email) return false;

  return (
    email.trim().toLowerCase() ===
    PLATFORM_ADMIN_EMAIL.toLowerCase()
  );
}

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

  const cleanEmail =
    email?.trim().toLowerCase() || '';

  const userRef = doc(
    db,
    'users',
    uid
  );

  const snapshot =
    await getDoc(userRef);

  const now =
    new Date().toISOString();

  if (!snapshot.exists()) {
    const role: UserRole =
      isPlatformAdminEmail(cleanEmail)
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

    await setDoc(
      userRef,
      newUser
    );

    return newUser;
  }

  const existingUser =
    snapshot.data() as AppUser;

  const updateData:
    Partial<AppUser> = {
    email:
      cleanEmail ||
      existingUser.email,
    updatedAt: now,
    lastLoginAt: now,
    active: true,
  };

  if (displayName !== undefined) {
    updateData.displayName =
      displayName?.trim() ||
      undefined;
  }

  if (photoURL !== undefined) {
    updateData.photoURL =
      photoURL?.trim() ||
      undefined;
  }

  /*
   * Platform admin role is controlled by
   * the configured platform admin email.
   */
  if (
    isPlatformAdminEmail(
      cleanEmail
    )
  ) {
    updateData.role =
      'platform_admin';
  }

  await setDoc(
    userRef,
    updateData,
    {
      merge: true,
    }
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
  uid: string,
  email?: string | null
): Promise<UserRole> {
  if (!uid) {
    return 'user';
  }

  /*
   * Direct platform admin check.
   */
  if (
    email &&
    isPlatformAdminEmail(email)
  ) {
    return 'platform_admin';
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

      if (
        user.role ===
        'platform_admin'
      ) {
        return 'platform_admin';
      }

      if (
        isPlatformAdminEmail(
          user.email
        )
      ) {
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
        where(
          'uid',
          '==',
          uid
        ),
        where(
          'status',
          '==',
          'ACTIVE'
        ),
        limit(10)
      );

    const membershipSnapshot =
      await getDocs(
        membershipQuery
      );

    if (
      !membershipSnapshot.empty
    ) {
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
    doc(
      collection(
        db,
        'schools'
      )
    );

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

    /*
     * New school first goes to
     * pending payment.
     */
    status: 'PENDING_PAYMENT',

    createdAt: now,
    updatedAt: now,

    phone: cleanPhone,

    tagline:
      input.tagline?.trim() || '',

    description:
      input.description?.trim() || '',

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

/*
 * Save school information.
 */
export async function saveSchoolInfo(
  info: SchoolInfo
): Promise<void> {
  if (!info) {
    throw new Error(
      'School information is required.'
    );
  }

  await setDoc(
    doc(
      db,
      'settings',
      'schoolInfo'
    ),
    {
      ...info,
      updatedAt:
        new Date().toISOString(),
    },
    {
      merge: true,
    }
  );
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

/*
 * Add announcement.
 */
export async function addAnnouncement(
  data: Partial<Announcement>
): Promise<void> {
  const ref =
    doc(
      collection(
        db,
        'announcements'
      )
    );

  await setDoc(
    ref,
    {
      ...data,
      id: ref.id,
      createdAt:
        new Date().toISOString(),
      updatedAt:
        new Date().toISOString(),
    }
  );
}

/*
 * Update announcement.
 */
export async function updateAnnouncement(
  id: string,
  data: Partial<Announcement>
): Promise<void> {
  if (!id) {
    throw new Error(
      'Announcement ID is required.'
    );
  }

  await updateDoc(
    doc(
      db,
      'announcements',
      id
    ),
    {
      ...data,
      updatedAt:
        new Date().toISOString(),
    }
  );
}

/*
 * Delete announcement.
 */
export async function deleteAnnouncement(
  id: string
): Promise<void> {
  if (!id) {
    throw new Error(
      'Announcement ID is required.'
    );
  }

  await deleteDoc(
    doc(
      db,
      'announcements',
      id
    )
  );
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

/*
 * Add event.
 */
export async function addEvent(
  data: Partial<SchoolEvent>
): Promise<void> {
  const ref =
    doc(
      collection(
        db,
        'events'
      )
    );

  await setDoc(
    ref,
    {
      ...data,
      id: ref.id,
      createdAt:
        new Date().toISOString(),
      updatedAt:
        new Date().toISOString(),
    }
  );
}

/*
 * Update event.
 */
export async function updateEvent(
  id: string,
  data: Partial<SchoolEvent>
): Promise<void> {
  if (!id) {
    throw new Error(
      'Event ID is required.'
    );
  }

  await updateDoc(
    doc(
      db,
      'events',
      id
    ),
    {
      ...data,
      updatedAt:
        new Date().toISOString(),
    }
  );
}

/*
 * Delete event.
 */
export async function deleteEvent(
  id: string
): Promise<void> {
  if (!id) {
    throw new Error(
      'Event ID is required.'
    );
  }

  await deleteDoc(
    doc(
      db,
      'events',
      id
    )
  );
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

/*
 * Add teacher.
 */
export async function addTeacher(
  data: Partial<Teacher>
): Promise<void> {
  const ref =
    doc(
      collection(
        db,
        'teachers'
      )
    );

  await setDoc(
    ref,
    {
      ...data,
      id: ref.id,
      createdAt:
        new Date().toISOString(),
      updatedAt:
        new Date().toISOString(),
    }
  );
}

/*
 * Update teacher.
 */
export async function updateTeacher(
  id: string,
  data: Partial<Teacher>
): Promise<void> {
  if (!id) {
    throw new Error(
      'Teacher ID is required.'
    );
  }

  await updateDoc(
    doc(
      db,
      'teachers',
      id
    ),
    {
      ...data,
      updatedAt:
        new Date().toISOString(),
    }
  );
}

/*
 * Delete teacher.
 */
export async function deleteTeacher(
  id: string
): Promise<void> {
  if (!id) {
    throw new Error(
      'Teacher ID is required.'
    );
  }

  await deleteDoc(
    doc(
      db,
      'teachers',
      id
    )
  );
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
        new Date(
          b.createdAt
        ).getTime() -
        new Date(
          a.createdAt
        ).getTime()
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
    await getDoc(
      schoolRef
    );

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

  /*
   * When school becomes LIVE,
   * payment and subscription become active.
   */
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

  /*
   * When school is suspended.
   */
  if (status === 'SUSPENDED') {
    schoolUpdates.suspendedAt =
      now;

    if (suspensionReason) {
      schoolUpdates.suspensionReason =
        suspensionReason;
    }
  }

  /*
   * When school is archived.
   */
  if (status === 'ARCHIVED') {
    schoolUpdates.archivedAt =
      now;
  }

  const batch =
    writeBatch(db);

  batch.set(
    schoolRef,
    schoolUpdates,
    {
      merge: true,
    }
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
        {
          merge: true,
        }
      );
    }
  }

  await batch.commit();

  void school;
}

/* =========================================================
   REJECT / ARCHIVE SCHOOL REGISTRATION
========================================================= */

export async function archiveSchoolRegistration(
  schoolId: string,
  reason?: string
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
    await getDoc(
      schoolRef
    );

  if (!schoolSnapshot.exists()) {
    throw new Error(
      'School not found.'
    );
  }

  const school =
    schoolSnapshot.data() as School;

  /*
   * Only pending school registrations
   * can be rejected.
   */
  if (
    school.status !==
    'PENDING_PAYMENT'
  ) {
    throw new Error(
      'Only pending school registrations can be rejected.'
    );
  }

  const now =
    new Date().toISOString();

  const batch =
    writeBatch(db);

  /*
   * Archive the school registration.
   */
  batch.set(
    schoolRef,
    {
      status: 'ARCHIVED',
      updatedAt: now,
      archivedAt: now,

      /*
       * School type currently does not have
       * a separate rejectionReason field.
       */
      suspensionReason:
        reason?.trim() ||
        'School registration rejected by Platform Admin.',
    },
    {
      merge: true,
    }
  );

  /*
   * Revoke school admin membership.
   */
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
        status: 'REVOKED',
        updatedAt: now,
        revokedAt: now,
      },
      {
        merge: true,
      }
    );
  }

  await batch.commit();
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
   FETCH ALL USERS
========================================================= */

export async function fetchAllUsers():
  Promise<AppUser[]> {
  try {
    const usersRef =
      collection(
        db,
        'users'
      );

    const snapshot =
      await getDocs(
        usersRef
      );

    return snapshot.docs.map(
      (item) => ({
        ...item.data(),
        uid: item.id,
      } as AppUser)
    );
  } catch (error) {
    console.error(
      'Failed to fetch all users:',
      error
    );

    return [];
  }
}

/* =========================================================
   IS ADMIN EMAIL
========================================================= */

export function isAdminEmail(
  email?: string | null
): boolean {
  return isPlatformAdminEmail(
    email
  );
}

/* =========================================================
   AUTHORIZED ADMINS
========================================================= */

export async function fetchAuthorizedAdmins():
  Promise<AppUser[]> {
  try {
    const ref =
      collection(
        db,
        'authorizedAdmins'
      );

    const snapshot =
      await getDocs(ref);

    return snapshot.docs.map(
      (item) => ({
        ...item.data(),
        uid: item.id,
      } as AppUser)
    );
  } catch (error) {
    console.error(
      'Failed to fetch authorized admins:',
      error
    );

    return [];
  }
}

export async function addAuthorizedAdmin(
  uid: string,
  email: string
): Promise<void> {
  if (!uid) {
    throw new Error(
      'Admin UID is required.'
    );
  }

  if (!email?.trim()) {
    throw new Error(
      'Admin email is required.'
    );
  }

  await setDoc(
    doc(
      db,
      'authorizedAdmins',
      uid
    ),
    {
      uid,
      email:
        email.trim().toLowerCase(),
      role: 'admin',
      createdAt:
        new Date().toISOString(),
    }
  );
}

export async function removeAuthorizedAdmin(
  uid: string
): Promise<void> {
  if (!uid) {
    throw new Error(
      'Admin UID is required.'
    );
  }

  await deleteDoc(
    doc(
      db,
      'authorizedAdmins',
      uid
    )
  );
}

/* =========================================================
   AUTHORIZED FACULTY
========================================================= */

export async function fetchAuthorizedFaculty():
  Promise<AppUser[]> {
  try {
    const ref =
      collection(
        db,
        'authorizedFaculty'
      );

    const snapshot =
      await getDocs(ref);

    return snapshot.docs.map(
      (item) => ({
        ...item.data(),
        uid: item.id,
      } as AppUser)
    );
  } catch (error) {
    console.error(
      'Failed to fetch authorized faculty:',
      error
    );

    return [];
  }
}

export async function addAuthorizedFaculty(
  uid: string,
  email: string
): Promise<void> {
  if (!uid) {
    throw new Error(
      'Faculty UID is required.'
    );
  }

  if (!email?.trim()) {
    throw new Error(
      'Faculty email is required.'
    );
  }

  await setDoc(
    doc(
      db,
      'authorizedFaculty',
      uid
    ),
    {
      uid,
      email:
        email.trim().toLowerCase(),
      role: 'faculty',
      createdAt:
        new Date().toISOString(),
    }
  );
}

export async function removeAuthorizedFaculty(
  uid: string
): Promise<void> {
  if (!uid) {
    throw new Error(
      'Faculty UID is required.'
    );
  }

  await deleteDoc(
    doc(
      db,
      'authorizedFaculty',
      uid
    )
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
