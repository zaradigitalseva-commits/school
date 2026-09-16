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
  email?: string | null,
  displayName?: string | null,
  photoURL?: string | null
): Promise<AppUser | null> {
  if (!uid) {
    return null;
  }

  try {
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);

    const now = new Date().toISOString();

    if (!snapshot.exists()) {
      const role: UserRole = isPlatformAdminEmail(email)
        ? 'platform_admin'
        : 'user';

      const userData: AppUser = {
        uid,
        email: email ?? '',
        displayName: displayName ?? '',
        photoURL: photoURL ?? '',
        role,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      };

      await setDoc(userRef, userData);

      return userData;
    }

    const existingData =
      snapshot.data() as Omit<AppUser, 'uid'>;

    const updatedData: Partial<AppUser> = {
      updatedAt: now,
      lastLoginAt: now,
    };

    if (email && !existingData.email) {
      updatedData.email = email;
    }

    if (displayName && !existingData.displayName) {
      updatedData.displayName = displayName;
    }

    if (photoURL && !existingData.photoURL) {
      updatedData.photoURL = photoURL;
    }

    if (
      isPlatformAdminEmail(email) &&
      existingData.role !== 'platform_admin'
    ) {
      updatedData.role = 'platform_admin';
    }

    await setDoc(
      userRef,
      updatedData,
      { merge: true }
    );

    return {
      uid: snapshot.id,
      ...existingData,
      ...updatedData,
    } as AppUser;
  } catch (error) {
    console.error(
      'Failed to ensure user record:',
      error
    );

    return null;
  }
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
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
      const data = snapshot.data() as AppUser;

      if (data.role) {
        return data.role;
      }
    }

    const membershipsRef =
      collection(db, 'schoolMemberships');

    const membershipQuery = query(
      membershipsRef,
      where('uid', '==', uid),
      where('status', '==', 'ACTIVE'),
      limit(1)
    );

    const membershipSnapshot =
      await getDocs(membershipQuery);

    if (!membershipSnapshot.empty) {
      const membership =
        membershipSnapshot.docs[0].data() as SchoolMembership;

      if (membership.role === 'school_admin') {
        return 'school_admin';
      }

      if (membership.role === 'teacher') {
        return 'teacher';
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
  input: SchoolRegistrationInput
): Promise<School> {
  if (!ownerUid) {
    throw new Error(
      'Google login is required.'
    );
  }

  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();
  const ownerEmail = input.ownerEmail.trim();
  const phone = input.phone.trim();

  if (!name) {
    throw new Error(
      'School name is required.'
    );
  }

  if (!slug) {
    throw new Error(
      'School URL slug is required.'
    );
  }

  if (!ownerEmail) {
    throw new Error(
      'Owner email is required.'
    );
  }

  if (!phone) {
    throw new Error(
      'Mobile number is required.'
    );
  }

  try {
    const slugRef = doc(
      db,
      'slugReservations',
      slug
    );

    const slugSnapshot =
      await getDoc(slugRef);

    if (slugSnapshot.exists()) {
      throw new Error(
        'This school URL is already in use. Please choose another school name.'
      );
    }

    const schoolRef =
      doc(collection(db, 'schools'));

    const schoolId = schoolRef.id;

    const now = new Date().toISOString();

    const schoolData: School = {
      id: schoolId,
      name,
      slug,
      ownerUid,
      ownerEmail,
      phone,
      status: 'PENDING_PAYMENT',
      createdAt: now,
      updatedAt: now,
      tagline: input.tagline?.trim() ?? '',
      description:
        input.description?.trim() ?? '',
      paymentStatus: 'PENDING',
      subscriptionStatus: 'PENDING',
    };

    const membershipRef = doc(
      db,
      'schoolMemberships',
      `${ownerUid}_${schoolId}`
    );

    const membershipData: SchoolMembership = {
      id: `${ownerUid}_${schoolId}`,
      uid: ownerUid,
      schoolId,
      role: 'school_admin',
      status: 'PENDING',
      assignments: [],
      createdAt: now,
      updatedAt: now,
    };

    const batch = writeBatch(db);

    batch.set(
      schoolRef,
      schoolData
    );

    batch.set(
      membershipRef,
      membershipData
    );

    batch.set(
      slugRef,
      {
        slug,
        schoolId,
        schoolName: name,
        ownerUid,
        createdAt: serverTimestamp(),
      }
    );

    await batch.commit();

    return schoolData;
  } catch (error) {
    console.error(
      'Failed to register school:',
      error
    );

    if (
      error instanceof Error &&
      error.message
    ) {
      throw error;
    }

    throw new Error(
      'School registration failed. Please try again.'
    );
  }
}

/* =========================================================
   SCHOOL INFO - LEGACY / HOME PAGE
========================================================= */

export async function fetchSchoolInfo(): Promise<
  Partial<SchoolInfo> | null
> {
  try {
    const infoRef = doc(
      db,
      'settings',
      'schoolInfo'
    );

    const snapshot =
      await getDoc(infoRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.data() as Partial<SchoolInfo>;
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

export async function fetchAnnouncements(): Promise<
  Announcement[]
> {
  try {
    const announcementsRef =
      collection(db, 'announcements');

    const q = query(
      announcementsRef,
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const snapshot =
      await getDocs(q);

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...(item.data() as Omit<
        Announcement,
        'id'
      >),
    }));
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

export async function fetchEvents(): Promise<
  SchoolEvent[]
> {
  try {
    const eventsRef =
      collection(db, 'events');

    const q = query(
      eventsRef,
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const snapshot =
      await getDocs(q);

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...(item.data() as Omit<
        SchoolEvent,
        'id'
      >),
    }));
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

export async function fetchTeachers(): Promise<
  Teacher[]
> {
  try {
    const teachersRef =
      collection(db, 'teachers');

    const q = query(
      teachersRef,
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const snapshot =
      await getDocs(q);

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...(item.data() as Omit<
        Teacher,
        'id'
      >),
    }));
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
   ONLY LIVE SCHOOLS
========================================================= */

export async function fetchPublicSchools(): Promise<
  School[]
> {
  try {
    const schoolsRef =
      collection(db, 'schools');

    const q = query(
      schoolsRef,
      where('status', '==', 'LIVE')
    );

    const snapshot =
      await getDocs(q);

    const schools = snapshot.docs.map(
      (item) => ({
        id: item.id,
        ...(item.data() as Omit<
          School,
          'id'
        >),
      })
    );

    schools.sort((a, b) =>
      String(b.createdAt ?? '').localeCompare(
        String(a.createdAt ?? '')
      )
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
   PLATFORM ADMIN
========================================================= */

export async function fetchAllSchools(): Promise<
  School[]
> {
  try {
    const schoolsRef =
      collection(db, 'schools');

    const q = query(
      schoolsRef,
      orderBy('createdAt', 'desc')
    );

    const snapshot =
      await getDocs(q);

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...(item.data() as Omit<
        School,
        'id'
      >),
    }));
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
  extraData?: Partial<School>
): Promise<void> {
  if (!schoolId) {
    throw new Error(
      'School ID is required.'
    );
  }

  const schoolRef =
    doc(db, 'schools', schoolId);

  const snapshot =
    await getDoc(schoolRef);

  if (!snapshot.exists()) {
    throw new Error(
      'School not found.'
    );
  }

  const now =
    new Date().toISOString();

  const updateData: Partial<School> = {
    status,
    updatedAt: now,
    ...(extraData ?? {}),
  };

  if (
    status === 'LIVE' &&
    !updateData.approvedAt
  ) {
    updateData.approvedAt = now;
  }

  if (
    status === 'SUSPENDED' &&
    !updateData.suspendedAt
  ) {
    updateData.suspendedAt = now;
  }

  if (
    status === 'ARCHIVED' &&
    !updateData.archivedAt
  ) {
    updateData.archivedAt = now;
  }

  if (status === 'LIVE') {
    updateData.paymentStatus =
      updateData.paymentStatus ??
      'PAID';

    updateData.subscriptionStatus =
      updateData.subscriptionStatus ??
      'ACTIVE';
  }

  await setDoc(
    schoolRef,
    updateData,
    {
      merge: true,
    }
  );

  /*
   * When school becomes LIVE, activate
   * the school administrator membership.
   */

  if (status === 'LIVE') {
    const membershipsRef =
      collection(db, 'schoolMemberships');

    const membershipQuery = query(
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
      await getDocs(membershipQuery);

    if (!membershipSnapshot.empty) {
      const batch = writeBatch(db);

      membershipSnapshot.docs.forEach(
        (membershipDoc) => {
          batch.set(
            membershipDoc.ref,
            {
              status: 'ACTIVE',
              updatedAt: now,
            },
            { merge: true }
          );
        }
      );

      await batch.commit();
    }
  }
}

/* =========================================================
   SCHOOL BY SLUG
   ONLY LIVE SCHOOL
========================================================= */

export async function fetchSchoolBySlug(
  slug: string
): Promise<School | null> {
  try {
    const cleanSlug =
      slug.trim().toLowerCase();

    if (!cleanSlug) {
      return null;
    }

    const schoolsRef =
      collection(db, 'schools');

    const q = query(
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
      await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const schoolDoc =
      snapshot.docs[0];

    return {
      id: schoolDoc.id,
      ...(schoolDoc.data() as Omit<
        School,
        'id'
      >),
    };
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
  try {
    const cleanSchoolId =
      schoolId.trim();

    if (!cleanSchoolId) {
      return null;
    }

    const schoolRef =
      doc(db, 'schools', cleanSchoolId);

    const snapshot =
      await getDoc(schoolRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...(snapshot.data() as Omit<
        School,
        'id'
      >),
    };
  } catch (error) {
    console.error(
      'Failed to fetch school by ID:',
      error
    );

    return null;
  }
}

/* =========================================================
   MY SCHOOL MEMBERSHIP
========================================================= */

export async function fetchMyMembership(
  uid: string,
  schoolId: string
): Promise<SchoolMembership | null> {
  try {
    if (!uid || !schoolId) {
      return null;
    }

    const membershipId =
      `${uid}_${schoolId}`;

    const membershipRef =
      doc(
        db,
        'schoolMemberships',
        membershipId
      );

    const snapshot =
      await getDoc(membershipRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...(snapshot.data() as Omit<
        SchoolMembership,
        'id'
      >),
    };
  } catch (error) {
    console.error(
      'Failed to fetch my membership:',
      error
    );

    return null;
  }
}

/* =========================================================
   ALL SCHOOL MEMBERSHIPS
========================================================= */

export async function fetchSchoolMemberships(
  schoolId: string
): Promise<SchoolMembership[]> {
  try {
    if (!schoolId) {
      return [];
    }

    const membershipsRef =
      collection(
        db,
        'schoolMemberships'
      );

    const q = query(
      membershipsRef,
      where(
        'schoolId',
        '==',
        schoolId
      )
    );

    const snapshot =
      await getDocs(q);

    return snapshot.docs.map(
      (item) => ({
        id: item.id,
        ...(item.data() as Omit<
          SchoolMembership,
          'id'
        >),
      })
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
   FORMAT DATE
========================================================= */

export function formatDate(
  value?: string | null
): string {
  if (!value) {
    return '';
  }

  try {
    const date =
      new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
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
    return value;
  }
}
