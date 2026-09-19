import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  query,
  where,
} from 'firebase/firestore';

import { db, auth } from './config';

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
   LEGACY ADMIN EMAIL CHECK
========================================================= */

export function isAdminEmail(
  email?: string | null
): boolean {
  return isPlatformAdminEmail(email);
}


/* =========================================================
   COMMON HELPERS
========================================================= */

function cleanData(
  data: Record<string, any> | null | undefined
): Record<string, any> {
  if (!data) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(data).filter(
      ([, value]) => value !== undefined
    )
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
    throw new Error('User UID is required.');
  }

  const cleanEmail =
    email?.trim().toLowerCase() || '';

  if (!cleanEmail) {
    throw new Error('User email is required.');
  }

  const userRef =
    doc(db, 'users', uid);

  const userSnapshot =
    await getDoc(userRef);

  if (!userSnapshot.exists()) {
    await setDoc(userRef, {
      uid,
      email: cleanEmail,
      role: isPlatformAdminEmail(cleanEmail)
        ? 'platform_admin'
        : 'user',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else if (isPlatformAdminEmail(cleanEmail)) {
    await setDoc(
      userRef,
      {
        uid,
        email: cleanEmail,
        role: 'platform_admin',
        updatedAt: serverTimestamp(),
      },
      {
        merge: true,
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
    doc(db, 'users', uid);

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
   FETCH ALL USERS
========================================================= */

export async function fetchAllUsers(): Promise<any[]> {
  const snapshot =
    await getDocs(
      collection(db, 'users')
    );

  return snapshot.docs.map(
    (userDoc) => ({
      id: userDoc.id,
      ...userDoc.data(),
    })
  );
}


/* =========================================================
   PUBLIC SCHOOLS
   Only LIVE schools are public.
========================================================= */

export async function fetchPublicSchools(): Promise<School[]> {
  const schoolsRef =
    collection(db, 'schools');

  const schoolsQuery =
    query(
      schoolsRef,
      where('status', '==', 'LIVE')
    );

  const snapshot =
    await getDocs(schoolsQuery);

  return snapshot.docs.map(
    (schoolDoc) => ({
      id: schoolDoc.id,
      ...schoolDoc.data(),
    } as School)
  );
}


/* =========================================================
   FETCH ALL SCHOOLS
   Platform Admin
========================================================= */

export async function fetchAllSchools(): Promise<School[]> {
  const snapshot =
    await getDocs(
      collection(db, 'schools')
    );

  return snapshot.docs.map(
    (schoolDoc) => ({
      id: schoolDoc.id,
      ...schoolDoc.data(),
    } as School)
  );
}


/* =========================================================
   UPDATE SCHOOL STATUS
========================================================= */

export async function updateSchoolStatus(
  schoolId: string,
  status: string
): Promise<void> {
  if (!schoolId) {
    throw new Error('School ID is required.');
  }

  if (!status) {
    throw new Error('School status is required.');
  }

  const schoolRef =
    doc(db, 'schools', schoolId);

  const snapshot =
    await getDoc(schoolRef);

  if (!snapshot.exists()) {
    throw new Error('School not found.');
  }

  await setDoc(
    schoolRef,
    {
      status,
      updatedAt: serverTimestamp(),
    },
    {
      merge: true,
    }
  );
}


/* =========================================================
   FETCH SCHOOL BY ID
========================================================= */

export async function fetchSchoolById(
  schoolId: string
): Promise<School | null> {
  if (!schoolId) {
    return null;
  }

  const schoolRef =
    doc(db, 'schools', schoolId);

  const snapshot =
    await getDoc(schoolRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as School;
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
    doc(db, 'schools', schoolId);

  const snapshot =
    await getDoc(schoolRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    ...snapshot.data(),
    id: snapshot.id,
  } as SchoolInfo;
}


/* =========================================================
   SAVE SCHOOL INFO
========================================================= */

export async function saveSchoolInfo(
  info: any
): Promise<void> {
  if (!info) {
    throw new Error(
      'School information is required.'
    );
  }

  const schoolId =
    info.schoolId || info.id;

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

  const existing =
    snapshot.data();

  /*
    Prevent accidental schoolId changes.
  */
  const {
    schoolId: ignoredSchoolId,
    id: ignoredId,
    ...rawInfo
  } = info;

  const safeInfo =
    cleanData(rawInfo);

  /*
    Do not allow school admin to change
    ownerUid or ownerEmail accidentally.
  */
  delete safeInfo.ownerUid;
  delete safeInfo.ownerEmail;

  await setDoc(
    schoolRef,
    {
      ...safeInfo,
      id: schoolId,
      updatedAt: serverTimestamp(),
      ownerUid:
        existing.ownerUid,
      ownerEmail:
        existing.ownerEmail,
    },
    {
      merge: true,
    }
  );
}


/* =========================================================
   FETCH SCHOOL BY SLUG
========================================================= */

export async function fetchSchoolBySlug(
  slug: string
): Promise<School | null> {
  const cleanSlug =
    slug?.trim().toLowerCase() || '';

  if (!cleanSlug) {
    return null;
  }

  const schoolsRef =
    collection(db, 'schools');

  const schoolsQuery =
    query(
      schoolsRef,
      where('slug', '==', cleanSlug)
    );

  const snapshot =
    await getDocs(schoolsQuery);

  if (snapshot.empty) {
    return null;
  }

  const schoolDoc =
    snapshot.docs[0];

  return {
    id: schoolDoc.id,
    ...schoolDoc.data(),
  } as School;
}


/* =========================================================
   SCHOOL MEMBERSHIP
========================================================= */

export async function fetchMyMembership(): Promise<
  SchoolMembership | null
> {
  const uid =
    auth.currentUser?.uid;

  if (!uid) {
    return null;
  }

  const membershipsRef =
    collection(db, 'schoolMemberships');

  const membershipsQuery =
    query(
      membershipsRef,
      where('uid', '==', uid)
    );

  const snapshot =
    await getDocs(membershipsQuery);

  if (snapshot.empty) {
    return null;
  }

  /*
    Prefer ACTIVE school membership.
  */
  const activeDoc =
    snapshot.docs.find(
      (membershipDoc) =>
        membershipDoc.data().status === 'ACTIVE'
    );

  const membershipDoc =
    activeDoc || snapshot.docs[0];

  return {
    id: membershipDoc.id,
    ...membershipDoc.data(),
  } as SchoolMembership;
}


/* =========================================================
   FETCH SCHOOL MEMBERSHIPS
========================================================= */

export async function fetchSchoolMemberships(
  schoolId: string
): Promise<SchoolMembership[]> {
  if (!schoolId) {
    return [];
  }

  const membershipsRef =
    collection(db, 'schoolMemberships');

  const membershipsQuery =
    query(
      membershipsRef,
      where('schoolId', '==', schoolId)
    );

  const snapshot =
    await getDocs(membershipsQuery);

  return snapshot.docs.map(
    (membershipDoc) => ({
      id: membershipDoc.id,
      ...membershipDoc.data(),
    } as SchoolMembership)
  );
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
    await getDoc(membershipRef);

  if (!snapshot.exists()) {
    throw new Error(
      'School membership not found.'
    );
  }

  const {
    id: ignoredId,
    schoolId: ignoredSchoolId,
    uid: ignoredUid,
    ...safeUpdates
  } = updates as any;

  await updateDoc(
    membershipRef,
    {
      ...cleanData(safeUpdates),
      updatedAt: serverTimestamp(),
    }
  );
}


/* =========================================================
   GENERIC SCHOOL DOCUMENT HELPERS
========================================================= */

async function getSchoolDocument(
  collectionName: string,
  schoolId: string,
  documentId: string
): Promise<any | null> {
  if (
    !collectionName ||
    !schoolId ||
    !documentId
  ) {
    return null;
  }

  const ref =
    doc(
      db,
      collectionName,
      documentId
    );

  const snapshot =
    await getDoc(ref);

  if (!snapshot.exists()) {
    return null;
  }

  const data =
    snapshot.data();

  if (data.schoolId !== schoolId) {
    return null;
  }

  return {
    id: snapshot.id,
    ...data,
  };
}


/* =========================================================
   ADD SCHOOL DOCUMENT
========================================================= */

async function addSchoolDocument(
  collectionName: string,
  schoolId: string,
  data: any
): Promise<string> {
  if (!collectionName) {
    throw new Error(
      'Collection name is required.'
    );
  }

  if (!schoolId) {
    throw new Error(
      'School ID is required.'
    );
  }

  if (!data) {
    throw new Error(
      'Document data is required.'
    );
  }

  const {
    schoolId: ignoredSchoolId,
    id: ignoredId,
    createdAt: ignoredCreatedAt,
    updatedAt: ignoredUpdatedAt,
    ...rawData
  } = data;

  const safeData =
    cleanData(rawData);

  const ref =
    await addDoc(
      collection(
        db,
        collectionName
      ),
      {
        ...safeData,
        schoolId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

  return ref.id;
}


/* =========================================================
   UPDATE SCHOOL DOCUMENT
========================================================= */

async function updateSchoolDocument(
  collectionName: string,
  schoolId: string,
  documentId: string,
  data: any
): Promise<void> {
  if (!collectionName) {
    throw new Error(
      'Collection name is required.'
    );
  }

  if (!schoolId) {
    throw new Error(
      'School ID is required.'
    );
  }

  if (!documentId) {
    throw new Error(
      'Document ID is required.'
    );
  }

  const ref =
    doc(
      db,
      collectionName,
      documentId
    );

  const snapshot =
    await getDoc(ref);

  if (!snapshot.exists()) {
    throw new Error(
      'Document not found.'
    );
  }

  const existingData =
    snapshot.data();

  if (
    existingData.schoolId !== schoolId
  ) {
    throw new Error(
      'You are not allowed to modify this school data.'
    );
  }

  const {
    schoolId: ignoredSchoolId,
    id: ignoredId,
    createdAt: ignoredCreatedAt,
    updatedAt: ignoredUpdatedAt,
    ...rawData
  } = data || {};

  const safeData =
    cleanData(rawData);

  await updateDoc(
    ref,
    {
      ...safeData,
      schoolId,
      updatedAt: serverTimestamp(),
    }
  );
}


/* =========================================================
   DELETE SCHOOL DOCUMENT
========================================================= */

async function deleteSchoolDocument(
  collectionName: string,
  schoolId: string,
  documentId: string
): Promise<void> {
  if (!collectionName) {
    throw new Error(
      'Collection name is required.'
    );
  }

  if (!schoolId) {
    throw new Error(
      'School ID is required.'
    );
  }

  if (!documentId) {
    throw new Error(
      'Document ID is required.'
    );
  }

  const ref =
    doc(
      db,
      collectionName,
      documentId
    );

  const snapshot =
    await getDoc(ref);

  if (!snapshot.exists()) {
    throw new Error(
      'Document not found.'
    );
  }

  const existingData =
    snapshot.data();

  if (
    existingData.schoolId !== schoolId
  ) {
    throw new Error(
      'You are not allowed to delete this school data.'
    );
  }

  await deleteDoc(ref);
}


/* =========================================================
   TEACHERS
========================================================= */

export async function fetchTeachers(
  schoolId?: string
): Promise<Teacher[]> {
  const teachersRef =
    collection(db, 'teachers');

  if (!schoolId) {
    const snapshot =
      await getDocs(teachersRef);

    return snapshot.docs.map(
      (teacherDoc) => ({
        id: teacherDoc.id,
        ...teacherDoc.data(),
      } as Teacher)
    );
  }

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
    await getDocs(teachersQuery);

  return snapshot.docs.map(
    (teacherDoc) => ({
      id: teacherDoc.id,
      ...teacherDoc.data(),
    } as Teacher)
  );
}


export async function addTeacher(
  data: any
): Promise<string> {
  const schoolId =
    data?.schoolId;

  if (!schoolId) {
    throw new Error(
      'School ID is required for teacher.'
    );
  }

  return addSchoolDocument(
    'teachers',
    schoolId,
    data
  );
}


export async function updateTeacher(
  id: string,
  data: any
): Promise<void> {
  if (!id) {
    throw new Error(
      'Teacher ID is required.'
    );
  }

  const schoolId =
    data?.schoolId;

  if (!schoolId) {
    throw new Error(
      'School ID is required for teacher update.'
    );
  }

  await updateSchoolDocument(
    'teachers',
    schoolId,
    id,
    data
  );
}


export async function deleteTeacher(
  id: string
): Promise<void> {
  if (!id) {
    throw new Error(
      'Teacher ID is required.'
    );
  }

  const ref =
    doc(
      db,
      'teachers',
      id
    );

  const snapshot =
    await getDoc(ref);

  if (!snapshot.exists()) {
    throw new Error(
      'Teacher not found.'
    );
  }

  const data =
    snapshot.data();

  const currentUid =
    auth.currentUser?.uid;

  if (!currentUid) {
    throw new Error(
      'You must be logged in.'
    );
  }

  /*
    Teacher records are normally controlled
    through school memberships.
    Only platform admin can delete without
    knowing a school ownership context.
  */
  if (
    !isPlatformAdminEmail(
      auth.currentUser?.email
    )
  ) {
    if (!data.schoolId) {
      throw new Error(
        'Teacher school information is missing.'
      );
    }

    const membershipId =
      `${currentUid}_${data.schoolId}`;

    const membershipRef =
      doc(
        db,
        'schoolMemberships',
        membershipId
      );

    const membershipSnapshot =
      await getDoc(membershipRef);

    if (
      !membershipSnapshot.exists() ||
      membershipSnapshot.data().role !==
        'school_admin' ||
      membershipSnapshot.data().status !==
        'ACTIVE'
    ) {
      throw new Error(
        'You are not allowed to delete this teacher.'
      );
    }
  }

  await deleteDoc(ref);
}


/* =========================================================
   ANNOUNCEMENTS / NOTICES
========================================================= */

export async function fetchAnnouncements(
  schoolId?: string
): Promise<Announcement[]> {
  const announcementsRef =
    collection(db, 'announcements');

  if (!schoolId) {
    const snapshot =
      await getDocs(
        announcementsRef
      );

    return snapshot.docs.map(
      (announcementDoc) => ({
        id: announcementDoc.id,
        ...announcementDoc.data(),
      } as Announcement)
    );
  }

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


export async function addAnnouncement(
  data: any
): Promise<string> {
  const schoolId =
    data?.schoolId;

  if (!schoolId) {
    throw new Error(
      'School ID is required for notice.'
    );
  }

  return addSchoolDocument(
    'announcements',
    schoolId,
    data
  );
}


export async function updateAnnouncement(
  id: string,
  data: any
): Promise<void> {
  if (!id) {
    throw new Error(
      'Announcement ID is required.'
    );
  }

  const schoolId =
    data?.schoolId;

  if (!schoolId) {
    throw new Error(
      'School ID is required for notice update.'
    );
  }

  await updateSchoolDocument(
    'announcements',
    schoolId,
    id,
    data
  );
}


export async function deleteAnnouncement(
  id: string
): Promise<void> {
  if (!id) {
    throw new Error(
      'Announcement ID is required.'
    );
  }

  const ref =
    doc(
      db,
      'announcements',
      id
    );

  const snapshot =
    await getDoc(ref);

  if (!snapshot.exists()) {
    throw new Error(
      'Announcement not found.'
    );
  }

  const data =
    snapshot.data();

  const currentUid =
    auth.currentUser?.uid;

  if (!currentUid) {
    throw new Error(
      'You must be logged in.'
    );
  }

  if (
    isPlatformAdminEmail(
      auth.currentUser?.email
    )
  ) {
    await deleteDoc(ref);
    return;
  }

  const schoolId =
    data.schoolId;

  if (!schoolId) {
    throw new Error(
      'Announcement school information is missing.'
    );
  }

  const membershipRef =
    doc(
      db,
      'schoolMemberships',
      `${currentUid}_${schoolId}`
    );

  const membershipSnapshot =
    await getDoc(membershipRef);

  if (
    !membershipSnapshot.exists() ||
    membershipSnapshot.data().role !==
      'school_admin' ||
    membershipSnapshot.data().status !==
      'ACTIVE'
  ) {
    throw new Error(
      'You are not allowed to delete this notice.'
    );
  }

  await deleteDoc(ref);
}


/* =========================================================
   EVENTS
========================================================= */

export async function fetchEvents(
  schoolId?: string
): Promise<SchoolEvent[]> {
  const eventsRef =
    collection(db, 'events');

  if (!schoolId) {
    const snapshot =
      await getDocs(eventsRef);

    return snapshot.docs.map(
      (eventDoc) => ({
        id: eventDoc.id,
        ...eventDoc.data(),
      } as SchoolEvent)
    );
  }

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
    await getDocs(eventsQuery);

  return snapshot.docs.map(
    (eventDoc) => ({
      id: eventDoc.id,
      ...eventDoc.data(),
    } as SchoolEvent)
  );
}


export async function addEvent(
  data: any
): Promise<string> {
  const schoolId =
    data?.schoolId;

  if (!schoolId) {
    throw new Error(
      'School ID is required for event.'
    );
  }

  return addSchoolDocument(
    'events',
    schoolId,
    data
  );
}


export async function updateEvent(
  id: string,
  data: any
): Promise<void> {
  if (!id) {
    throw new Error(
      'Event ID is required.'
    );
  }

  const schoolId =
    data?.schoolId;

  if (!schoolId) {
    throw new Error(
      'School ID is required for event update.'
    );
  }

  await updateSchoolDocument(
    'events',
    schoolId,
    id,
    data
  );
}


export async function deleteEvent(
  id: string
): Promise<void> {
  if (!id) {
    throw new Error(
      'Event ID is required.'
    );
  }

  const ref =
    doc(
      db,
      'events',
      id
    );

  const snapshot =
    await getDoc(ref);

  if (!snapshot.exists()) {
    throw new Error(
      'Event not found.'
    );
  }

  const data =
    snapshot.data();

  const currentUid =
    auth.currentUser?.uid;

  if (!currentUid) {
    throw new Error(
      'You must be logged in.'
    );
  }

  if (
    isPlatformAdminEmail(
      auth.currentUser?.email
    )
  ) {
    await deleteDoc(ref);
    return;
  }

  const schoolId =
    data.schoolId;

  if (!schoolId) {
    throw new Error(
      'Event school information is missing.'
    );
  }

  const membershipRef =
    doc(
      db,
      'schoolMemberships',
      `${currentUid}_${schoolId}`
    );

  const membershipSnapshot =
    await getDoc(membershipRef);

  if (
    !membershipSnapshot.exists() ||
    membershipSnapshot.data().role !==
      'school_admin' ||
    membershipSnapshot.data().status !==
      'ACTIVE'
  ) {
    throw new Error(
      'You are not allowed to delete this event.'
    );
  }

  await deleteDoc(ref);
}


/* =========================================================
   STUDENTS
========================================================= */

export async function fetchStudents(
  schoolId: string
): Promise<any[]> {
  return fetchSchoolCollection(
    schoolId,
    'students'
  );
}


export async function addStudent(
  schoolId: string,
  data: any
): Promise<string> {
  return addSchoolDocument(
    'students',
    schoolId,
    data
  );
}


export async function updateStudent(
  schoolId: string,
  id: string,
  data: any
): Promise<void> {
  return updateSchoolDocument(
    'students',
    schoolId,
    id,
    data
  );
}


export async function deleteStudent(
  schoolId: string,
  id: string
): Promise<void> {
  return deleteSchoolDocument(
    'students',
    schoolId,
    id
  );
}


/* =========================================================
   CLASSES 1 - 12
========================================================= */

export async function fetchClasses(
  schoolId: string
): Promise<any[]> {
  return fetchSchoolCollection(
    schoolId,
    'classes'
  );
}


export async function addClass(
  schoolId: string,
  data: any
): Promise<string> {
  return addSchoolDocument(
    'classes',
    schoolId,
    data
  );
}


export async function updateClass(
  schoolId: string,
  id: string,
  data: any
): Promise<void> {
  return updateSchoolDocument(
    'classes',
    schoolId,
    id,
    data
  );
}


export async function deleteClass(
  schoolId: string,
  id: string
): Promise<void> {
  return deleteSchoolDocument(
    'classes',
    schoolId,
    id
  );
}


/* =========================================================
   RESULTS
========================================================= */

export async function fetchResults(
  schoolId: string
): Promise<any[]> {
  return fetchSchoolCollection(
    schoolId,
    'results'
  );
}


export async function addResult(
  schoolId: string,
  data: any
): Promise<string> {
  return addSchoolDocument(
    'results',
    schoolId,
    data
  );
}


export async function updateResult(
  schoolId: string,
  id: string,
  data: any
): Promise<void> {
  return updateSchoolDocument(
    'results',
    schoolId,
    id,
    data
  );
}


export async function deleteResult(
  schoolId: string,
  id: string
): Promise<void> {
  return deleteSchoolDocument(
    'results',
    schoolId,
    id
  );
}


/* =========================================================
   HOMEWORK
========================================================= */

export async function fetchHomework(
  schoolId: string
): Promise<any[]> {
  return fetchSchoolCollection(
    schoolId,
    'homework'
  );
}


export async function addHomework(
  schoolId: string,
  data: any
): Promise<string> {
  return addSchoolDocument(
    'homework',
    schoolId,
    data
  );
}


export async function updateHomework(
  schoolId: string,
  id: string,
  data: any
): Promise<void> {
  return updateSchoolDocument(
    'homework',
    schoolId,
    id,
    data
  );
}


export async function deleteHomework(
  schoolId: string,
  id: string
): Promise<void> {
  return deleteSchoolDocument(
    'homework',
    schoolId,
    id
  );
}


/* =========================================================
   ATTENDANCE
========================================================= */

export async function fetchAttendance(
  schoolId: string
): Promise<any[]> {
  return fetchSchoolCollection(
    schoolId,
    'attendance'
  );
}


export async function addAttendance(
  schoolId: string,
  data: any
): Promise<string> {
  return addSchoolDocument(
    'attendance',
    schoolId,
    data
  );
}


export async function updateAttendance(
  schoolId: string,
  id: string,
  data: any
): Promise<void> {
  return updateSchoolDocument(
    'attendance',
    schoolId,
    id,
    data
  );
}


export async function deleteAttendance(
  schoolId: string,
  id: string
): Promise<void> {
  return deleteSchoolDocument(
    'attendance',
    schoolId,
    id
  );
}


/* =========================================================
   GALLERY
========================================================= */

export async function fetchGallery(
  schoolId: string
): Promise<any[]> {
  return fetchSchoolCollection(
    schoolId,
    'gallery'
  );
}


export async function addGalleryItem(
  schoolId: string,
  data: any
): Promise<string> {
  return addSchoolDocument(
    'gallery',
    schoolId,
    data
  );
}


export async function updateGalleryItem(
  schoolId: string,
  id: string,
  data: any
): Promise<void> {
  return updateSchoolDocument(
    'gallery',
    schoolId,
    id,
    data
  );
}


export async function deleteGalleryItem(
  schoolId: string,
  id: string
): Promise<void> {
  return deleteSchoolDocument(
    'gallery',
    schoolId,
    id
  );
}


/* =========================================================
   DOCUMENTS
========================================================= */

export async function fetchDocuments(
  schoolId: string
): Promise<any[]> {
  return fetchSchoolCollection(
    schoolId,
    'documents'
  );
}


export async function addDocument(
  schoolId: string,
  data: any
): Promise<string> {
  return addSchoolDocument(
    'documents',
    schoolId,
    data
  );
}


export async function updateDocument(
  schoolId: string,
  id: string,
  data: any
): Promise<void> {
  return updateSchoolDocument(
    'documents',
    schoolId,
    id,
    data
  );
}


export async function deleteDocument(
  schoolId: string,
  id: string
): Promise<void> {
  return deleteSchoolDocument(
    'documents',
    schoolId,
    id
  );
}


/* =========================================================
   FETCH SCHOOL COLLECTION
========================================================= */

export async function fetchSchoolCollection(
  schoolId: string,
  collectionName: string
): Promise<any[]> {
  if (!schoolId || !collectionName) {
    return [];
  }

  try {
    const collectionRef =
      collection(
        db,
        collectionName
      );

    const collectionQuery =
      query(
        collectionRef,
        where(
          'schoolId',
          '==',
          schoolId
        )
      );

    const snapshot =
      await getDocs(
        collectionQuery
      );

    return snapshot.docs.map(
      (item) => ({
        id: item.id,
        ...item.data(),
      })
    );
  } catch (error) {
    console.error(
      `Error fetching school collection "${collectionName}" for school "${schoolId}":`,
      error
    );

    return [];
  }
}


/* =========================================================
   AUTHORIZED ADMINS
========================================================= */

export async function fetchAuthorizedAdmins(): Promise<any[]> {
  const snapshot =
    await getDocs(
      collection(
        db,
        'authorizedAdmins'
      )
    );

  return snapshot.docs.map(
    (adminDoc) => ({
      uid: adminDoc.id,
      ...adminDoc.data(),
    })
  );
}


export async function addAuthorizedAdmin(
  uid: string,
  email: string
): Promise<void> {
  if (!uid || !email) {
    throw new Error(
      'UID and email are required.'
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
      addedAt:
        serverTimestamp(),
    }
  );
}


export async function removeAuthorizedAdmin(
  uid: string
): Promise<void> {
  if (!uid) {
    throw new Error(
      'UID is required.'
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

export async function fetchAuthorizedFaculty(): Promise<any[]> {
  const snapshot =
    await getDocs(
      collection(
        db,
        'authorizedFaculty'
      )
    );

  return snapshot.docs.map(
    (facultyDoc) => ({
      uid: facultyDoc.id,
      ...facultyDoc.data(),
    })
  );
}


export async function addAuthorizedFaculty(
  uid: string,
  email: string
): Promise<void> {
  if (!uid || !email) {
    throw new Error(
      'UID and email are required.'
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
      addedAt:
        serverTimestamp(),
    }
  );
}


export async function removeAuthorizedFaculty(
  uid: string
): Promise<void> {
  if (!uid) {
    throw new Error(
      'UID is required.'
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

      if (
        !isNaN(
          date.getTime()
        )
      ) {
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
    await getDoc(slugRef);

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
    ownerUid +
    '_' +
    schoolId;

  const membershipRef =
    doc(
      db,
      'schoolMemberships',
      membershipId
    );

  /*
    Prevent duplicate membership
    from being silently overwritten.
  */
  const existingMembership =
    await getDoc(membershipRef);

  if (existingMembership.exists()) {
    throw new Error(
      'This school registration already exists.'
    );
  }

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

    whatsappNumber:
      cleanWhatsappNumber,

    whatsappVerified: true,

    address:
      input.address?.trim() || '',

    tagline:
      input.tagline?.trim() || '',

    description:
      input.description?.trim() || '',

    paymentStatus: 'PENDING',

    subscriptionStatus:
      'PENDING',
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

      schoolName:
        cleanName,

      ownerUid,

      createdAt:
        serverTimestamp(),
    }
  );

  await batch.commit();

  return school;
}
