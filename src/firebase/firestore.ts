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
  orderBy,
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
} from './types';

const ADMIN_EMAIL = 'ngogrant454@gmail.com';

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export async function fetchUserRole(
  uid: string,
  email: string | null
): Promise<UserRole> {
  if (isAdminEmail(email)) return 'admin';

  const facultyDoc = await getDoc(doc(db, 'authorizedFaculty', uid));
  if (facultyDoc.exists()) return 'faculty';

  const adminDoc = await getDoc(doc(db, 'authorizedAdmins', uid));
  if (adminDoc.exists()) return 'admin';

  return 'user';
}

export async function ensureUserRecord(
  uid: string,
  email: string | null,
  displayName: string | null,
  photoURL: string | null
): Promise<AppUser> {
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  const now = new Date().toISOString();

  if (!userDoc.exists()) {
    const newRecord: AppUser = {
      uid,
      email: email ?? '',
      displayName: displayName ?? '',
      photoURL: photoURL ?? '',
      role: isAdminEmail(email) ? 'admin' : 'user',
      lastLoginAt: now,
      createdAt: now,
    };
    await setDoc(userRef, newRecord);
    return newRecord;
  }

  const data = userDoc.data() as AppUser;
  await updateDoc(userRef, {
    lastLoginAt: now,
    email: email ?? data.email,
    displayName: displayName ?? data.displayName,
    photoURL: photoURL ?? data.photoURL,
  });
  return { ...data, lastLoginAt: now, email: email ?? data.email };
}

export async function fetchAllUsers(): Promise<AppUser[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => d.data() as AppUser);
}

export async function fetchSchoolInfo(): Promise<SchoolInfo | null> {
  const snap = await getDoc(doc(db, 'school', 'info'));
  return snap.exists() ? (snap.data() as SchoolInfo) : null;
}

export async function saveSchoolInfo(info: SchoolInfo): Promise<void> {
  await setDoc(doc(db, 'school', 'info'), info, { merge: true });
}

export async function fetchTeachers(): Promise<Teacher[]> {
  const q = query(collection(db, 'teachers'), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Teacher);
}

export async function addTeacher(data: Omit<Teacher, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'teachers'), data);
  return ref.id;
}

export async function updateTeacher(id: string, data: Partial<Teacher>): Promise<void> {
  await updateDoc(doc(db, 'teachers', id), data);
}

export async function deleteTeacher(id: string): Promise<void> {
  await deleteDoc(doc(db, 'teachers', id));
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const q = query(collection(db, 'announcements'), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Announcement);
}

export async function addAnnouncement(data: Omit<Announcement, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'announcements'), data);
  return ref.id;
}

export async function updateAnnouncement(id: string, data: Partial<Announcement>): Promise<void> {
  await updateDoc(doc(db, 'announcements', id), data);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await deleteDoc(doc(db, 'announcements', id));
}

export async function fetchEvents(): Promise<SchoolEvent[]> {
  const q = query(collection(db, 'events'), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SchoolEvent);
}

export async function addEvent(data: Omit<SchoolEvent, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'events'), data);
  return ref.id;
}

export async function updateEvent(id: string, data: Partial<SchoolEvent>): Promise<void> {
  await updateDoc(doc(db, 'events', id), data);
}

export async function deleteEvent(id: string): Promise<void> {
  await deleteDoc(doc(db, 'events', id));
}

export async function fetchAuthorizedAdmins(): Promise<AppUser[]> {
  const snap = await getDocs(collection(db, 'authorizedAdmins'));
  return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<AppUser, 'uid'>) }));
}

export async function addAuthorizedAdmin(uid: string, email: string): Promise<void> {
  await setDoc(doc(db, 'authorizedAdmins', uid), {
    uid,
    email,
    role: 'admin',
    addedAt: serverTimestamp(),
  });
}

export async function removeAuthorizedAdmin(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'authorizedAdmins', uid));
}

export async function fetchAuthorizedFaculty(): Promise<AppUser[]> {
  const snap = await getDocs(collection(db, 'authorizedFaculty'));
  return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<AppUser, 'uid'>) }));
}

export async function addAuthorizedFaculty(uid: string, email: string): Promise<void> {
  await setDoc(doc(db, 'authorizedFaculty', uid), {
    uid,
    email,
    role: 'faculty',
    addedAt: serverTimestamp(),
  });
}

export async function removeAuthorizedFaculty(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'authorizedFaculty', uid));
}

export function formatDate(ts: unknown): string {
  if (!ts) return '';
  if (ts instanceof Timestamp) return ts.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  if (typeof ts === 'string') return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return String(ts);
}
