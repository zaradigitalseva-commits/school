import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

import { db } from './config';

import type {
  SchoolInfo,
  Teacher,
  Announcement,
  SchoolEvent,
  AppUser,
  UserRole,
  School,
  SchoolMembership,
  SchoolRegistrationInput,
} from './types';


/* =========================================================
   PLATFORM ADMIN
========================================================= */

export const PLATFORM_ADMIN_EMAIL = 'ngogrant454@gmail.com';

export function isPlatformAdminEmail(
  email: string | null | undefined
): boolean {
  return (
    !!email &&
    email.toLowerCase() === PLATFORM_ADMIN_EMAIL.toLowerCase()
  );
}


/*
 * Old function name kept for compatibility with existing
 * components.
 */
export function isAdminEmail(
  email: string | null | undefined
): boolean {
  return isPlatformAdminEmail(email);
}


/* =========================================================
   USER ROLE
========================================================= */

export async function fetchCurrentMemberships(
  uid: string
): Promise<SchoolMembership[]> {
  const q = query(
    collection(db, 'schoolMemberships'),
    where('uid', '==', uid),
    where('status', '==', 'ACTIVE')
  );

  const snap = await getDocs(q);

  return snap.docs.map(
    (item) =>
      ({
        id: item.id,
        ...item.data(),
      }) as SchoolMembership
  );
}


export async function fetchUserRole(
  uid: string,
  email: string | null
): Promise<UserRole> {
  /*
   * Platform Admin has highest priority.
   */
  if (isPlatformAdminEmail(email)) {
    return 'platform_admin';
  }

  /*
   * Find all active school memberships.
   */
  const memberships = await fetchCurrentMemberships(uid);

  /*
   * School Admin has priority over Teacher.
   */
  if (
    memberships.some(
      (membership) => membership.role === 'school_admin'
    )
  ) {
    return 'school_admin';
  }

  if (
    memberships.some(
      (membership) => membership.role === 'teacher'
    )
  ) {
    return 'teacher';
  }

  /*
   * No management membership means normal user.
   */
  return 'user';
}


/* =========================================================
   USER RECORD
========================================================= */

export async function ensureUserRecord(
  uid: string,
  email: string | null,
  displayName: string | null,
  photoURL: string | null
): Promise<AppUser> {
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);

  const now = new Date().toISOString();

  /*
   * New user
   */
  if (!userDoc.exists()) {
    const newRecord: AppUser = {
      uid,
      email: email ?? '',
      displayName: displayName ?? '',
      photoURL: photoURL ?? '',
      role: isPlatformAdminEmail(email)
        ? 'platform_admin'
        : 'user',
      lastLoginAt: now,
      createdAt: now,
    };

    await setDoc(userRef, newRecord);

    return newRecord;
  }

  /*
   * Existing user.
   *
   * Do not blindly overwrite the role here.
   * The real role is resolved from memberships.
   */
  const data = userDoc.data() as AppUser;

  const updatedRecord: AppUser = {
    ...data,
    uid,
    email: email ?? data.email ?? '',
    displayName: displayName ?? data.displayName ?? '',
    photoURL: photoURL ?? data.photoURL ?? '',
    role: isPlatformAdminEmail(email)
      ? 'platform_admin'
      : data.role ?? 'user',
    lastLoginAt: now,
  };

  await updateDoc(userRef, {
    email: updatedRecord.email,
    displayName: updatedRecord.displayName,
    photoURL: updatedRecord.photoURL,
    role: updatedRecord.role,
    lastLoginAt: now,
  });

  return updatedRecord;
}


/* =========================================================
   USERS
========================================================= */

export async function fetchAllUsers(): Promise<AppUser[]> {
  const snap = await getDocs(
    collection(db, 'users')
  );

  return snap.docs.map(
    (item) => item.data() as AppUser
  );
}


/* =========================================================
   SCHOOL REGISTRATION
========================================================= */

export async function registerSchool(
  uid: string,
  input: SchoolRegistrationInput
): Promise<School> {
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();
  const ownerEmail = input.ownerEmail.trim().toLowerCase();

  if (!name) {
    throw new Error('School name is required.');
  }

  if (!slug) {
    throw new Error('School slug is required.');
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(
      'School slug can contain only lowercase letters, numbers and hyphens.'
    );
  }

  if (!uid) {
    throw new Error('You must be signed in to register a school.');
  }

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

  const now = new Date().toISOString();

  const school: School = {
    id: schoolRef.id,
    name,
    slug,
    ownerUid: uid,
    ownerEmail,
    status: 'PENDING_PAYMENT',
    createdAt: now,
    updatedAt: now,
    tagline: input.tagline?.trim() ?? '',
    description: input.description?.trim() ?? '',
  };

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

  await runTransaction(db, async (transaction) => {
    /*
     * Check slug reservation atomically.
     */
    const slugDoc = await transaction.get(slugRef);

    if (slugDoc.exists()) {
      throw new Error(
        'This school URL/slug is already registered. Please choose another.'
      );
    }

    /*
     * Create school.
     */
    transaction.set(schoolRef, school);

    /*
     * Reserve slug.
     */
    transaction.set(slugRef, {
      slug,
      schoolId: schoolRef.id,
      createdAt: serverTimestamp(),
    });

    /*
     * Owner membership starts as PENDING.
     *
     * It becomes ACTIVE only after Platform Admin
     * approves the payment.
     */
    transaction.set(membershipRef, membership);
  });

  return school;
}


/* =========================================================
   SCHOOL LOOKUPS
========================================================= */

export async function fetchSchoolById(
  schoolId: string
): Promise<School | null> {
  const snap = await getDoc(
    doc(db, 'schools', schoolId)
  );

  if (!snap.exists()) {
    return null;
  }

  return {
    id: snap.id,
    ...snap.data(),
  } as School;
}


export async function fetchSchoolBySlug(
  slug: string
): Promise<School | null> {
  const normalizedSlug = slug.trim().toLowerCase();

  const q = query(
    collection(db, 'schools'),
    where('slug', '==', normalizedSlug),
    where('status', '==', 'LIVE'),
    limit(1)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    return null;
  }

  const item = snap.docs[0];

  return {
    id: item.id,
    ...item.data(),
  } as School;
}


export async function fetchAllSchools(): Promise<School[]> {
  const q = query(
    collection(db, 'schools'),
    orderBy('createdAt', 'desc')
  );

  const snap = await getDocs(q);

  return snap.docs.map(
    (item) =>
      ({
        id: item.id,
        ...item.data(),
      }) as School
  );
}


export async function fetchPublicSchools(): Promise<School[]> {
  const q = query(
    collection(db, 'schools'),
    where('status', '==', 'LIVE'),
    orderBy('name', 'asc')
  );

  const snap = await getDocs(q);

  return snap.docs.map(
    (item) =>
      ({
        id: item.id,
        ...item.data(),
      }) as School
  );
}


export async function fetchMySchools(
  uid: string
): Promise<School[]> {
  const q = query(
    collection(db, 'schools'),
    where('ownerUid', '==', uid),
    orderBy('createdAt', 'desc')
  );

  const snap = await getDocs(q);

  return snap.docs.map(
    (item) =>
      ({
        id: item.id,
        ...item.data(),
      }) as School
  );
}


/* =========================================================
   SCHOOL MEMBERSHIPS
========================================================= */

export async function fetchSchoolMemberships(
  schoolId: string
): Promise<SchoolMembership[]> {
  const q = query(
    collection(db, 'schoolMemberships'),
    where('schoolId', '==', schoolId)
  );

  const snap = await getDocs(q);

  return snap.docs.map(
    (item) =>
      ({
        id: item.id,
        ...item.data(),
      }) as SchoolMembership
  );
}


export async function fetchMyMembership(
  uid: string,
  schoolId: string
): Promise<SchoolMembership | null> {
  const membershipRef = doc(
    db,
    'schoolMemberships',
    `${uid}_${schoolId}`
  );

  const snap = await getDoc(membershipRef);

  if (!snap.exists()) {
    return null;
  }

  return {
    id: snap.id,
    ...snap.data(),
  } as SchoolMembership;
}


export async function updateSchoolMembership(
  membershipId: string,
  data: Partial<SchoolMembership>
): Promise<void> {
  await updateDoc(
    doc(db, 'schoolMemberships', membershipId),
    {
      ...data,
      updatedAt: new Date().toISOString(),
    }
  );
}


/* =========================================================
   LEGACY SCHOOL INFO
   Kept for existing public/dashboard components
========================================================= */

export async function fetchSchoolInfo(): Promise<SchoolInfo | null> {
  const snap = await getDoc(
    doc(db, 'school', 'info')
  );

  return snap.exists()
    ? (snap.data() as SchoolInfo)
    : null;
}


export async function saveSchoolInfo(
  info: SchoolInfo
): Promise<void> {
  await setDoc(
    doc(db, 'school', 'info'),
    info,
    { merge: true }
  );
}


/* =========================================================
   LEGACY TEACHERS
========================================================= */

export async function fetchTeachers(): Promise<Teacher[]> {
  const q = query(
    collection(db, 'teachers'),
    orderBy('order', 'asc')
  );

  const snap = await getDocs(q);

  return snap.docs.map(
    (item) =>
      ({
        id: item.id,
        ...item.data(),
      }) as Teacher
  );
}


export async function addTeacher(
  data: Omit<Teacher, 'id'>
): Promise<string> {
  const ref = await addDoc(
    collection(db, 'teachers'),
    data
  );

  return ref.id;
}


export async function updateTeacher(
  id: string,
  data: Partial<Teacher>
): Promise<void> {
  await updateDoc(
    doc(db, 'teachers', id),
    data
  );
}


export async function deleteTeacher(
  id: string
): Promise<void> {
  await deleteDoc(
    doc(db, 'teachers', id)
  );
}


/* =========================================================
   LEGACY ANNOUNCEMENTS
========================================================= */

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const q = query(
    collection(db, 'announcements'),
    orderBy('date', 'desc')
  );

  const snap = await getDocs(q);

  return snap.docs.map(
    (item) =>
      ({
        id: item.id,
        ...item.data(),
      }) as Announcement
  );
}


export async function addAnnouncement(
  data: Omit<Announcement, 'id'>
): Promise<string> {
  const ref = await addDoc(
    collection(db, 'announcements'),
    data
  );

  return ref.id;
}


export async function updateAnnouncement(
  id: string,
  data: Partial<Announcement>
): Promise<void> {
  await updateDoc(
    doc(db, 'announcements', id),
    data
  );
}


export async function deleteAnnouncement(
  id: string
): Promise<void> {
  await deleteDoc(
    doc(db, 'announcements', id)
  );
}


/* =========================================================
   LEGACY EVENTS
========================================================= */

export async function fetchEvents(): Promise<SchoolEvent[]> {
  const q = query(
    collection(db, 'events'),
    orderBy('date', 'desc')
  );

  const snap = await getDocs(q);

  return snap.docs.map(
    (item) =>
      ({
        id: item.id,
        ...item.data(),
      }) as SchoolEvent
  );
}


export async function addEvent(
  data: Omit<SchoolEvent, 'id'>
): Promise<string> {
  const ref = await addDoc(
    collection(db, 'events'),
    data
  );

  return ref.id;
}


export async function updateEvent(
  id: string,
  data: Partial<SchoolEvent>
): Promise<void> {
  await updateDoc(
    doc(db, 'events', id),
    data
  );
}


export async function deleteEvent(
  id: string
): Promise<void> {
  await deleteDoc(
    doc(db, 'events', id)
  );
}


/* =========================================================
   OLD AUTHORIZED ADMIN
   Kept for old components only
========================================================= */

export async function fetchAuthorizedAdmins(): Promise<AppUser[]> {
  const snap = await getDocs(
    collection(db, 'authorizedAdmins')
  );

  return snap.docs.map(
    (item) => ({
      uid: item.id,
      ...(item.data() as Omit<AppUser, 'uid'>),
    })
  );
}


export async function addAuthorizedAdmin(
  uid: string,
  email: string
): Promise<void> {
  await setDoc(
    doc(db, 'authorizedAdmins', uid),
    {
      uid,
      email,
      role: 'admin',
      addedAt: serverTimestamp(),
    }
  );
}


export async function removeAuthorizedAdmin(
  uid: string
): Promise<void> {
  await deleteDoc(
    doc(db, 'authorizedAdmins', uid)
  );
}


/* =========================================================
   OLD AUTHORIZED FACULTY
   Kept for old components only
========================================================= */

export async function fetchAuthorizedFaculty(): Promise<AppUser[]> {
  const snap = await getDocs(
    collection(db, 'authorizedFaculty')
  );

  return snap.docs.map(
    (item) => ({
      uid: item.id,
      ...(item.data() as Omit<AppUser, 'uid'>),
    })
  );
}


export async function addAuthorizedFaculty(
  uid: string,
  email: string
): Promise<void> {
  await setDoc(
    doc(db, 'authorizedFaculty', uid),
    {
      uid,
      email,
      role: 'faculty',
      addedAt: serverTimestamp(),
    }
  );
}


export async function removeAuthorizedFaculty(
  uid: string
): Promise<void> {
  await deleteDoc(
    doc(db, 'authorizedFaculty', uid)
  );
}


/* =========================================================
   DATE FORMATTER
========================================================= */

export function formatDate(ts: unknown): string {
  if (!ts) {
    return '';
  }

  if (ts instanceof Timestamp) {
    return ts
      .toDate()
      .toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
  }

  if (typeof ts === 'string') {
    const date = new Date(ts);

    if (Number.isNaN(date.getTime())) {
      return ts;
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return String(ts);
}
