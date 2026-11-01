import { readFile } from 'node:fs/promises';
import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  Timestamp,
} from 'firebase/firestore';

const projectId = 'demo-schoolconnect';
let testEnv;

const schoolA = {
  schoolId: 'school-a',
  status: 'LIVE',
  ownerUid: 'school-admin-a',
};
const schoolB = {
  schoolId: 'school-b',
  status: 'LIVE',
  ownerUid: 'school-admin-b',
};

async function seedFixtures() {
  await testEnv.withSecurityRulesDisabled(async ({ firestore }) => {
    const docs = [
      ['schools/school-a', schoolA],
      ['schools/school-b', schoolB],
      ['schoolMemberships/school-admin-a_school-a', {
        uid: 'school-admin-a', schoolId: 'school-a', status: 'ACTIVE',
        role: 'school_admin', assignments: [],
      }],
      ['schoolOwnerRegistrations/school-admin-a', {
        ownerUid: 'school-admin-a', schoolId: 'school-a',
      }],
      ['schoolMemberships/school-admin-b_school-b', {
        uid: 'school-admin-b', schoolId: 'school-b', status: 'ACTIVE',
        role: 'school_admin', assignments: [],
      }],
      ['schoolOwnerRegistrations/school-admin-b', {
        ownerUid: 'school-admin-b', schoolId: 'school-b',
      }],
      ['schoolMemberships/teacher-a_school-a', {
        uid: 'teacher-a', schoolId: 'school-a', status: 'ACTIVE',
        role: 'teacher', assignments: ['Class 5'],
      }],
      ['students/student-a', {
        schoolId: 'school-a', studentName: 'Student A',
        className: 'Class 5', section: 'A',
      }],
      ['students/student-b', {
        schoolId: 'school-b', studentName: 'Student B',
        className: 'Class 5', section: 'A',
      }],
      ['results/result-a', {
        schoolId: 'school-a', studentName: 'Student A',
        rollNumber: '05', className: 'Class 5', section: 'A', marks: 80,
      }],
      ['results/result-b', {
        schoolId: 'school-b', studentName: 'Student B',
        rollNumber: '06', className: 'Class 5', section: 'A', marks: 90,
      }],
      ['publicResults/result-a', {
        schoolId: 'school-a', studentName: 'Student A',
        rollNumber: '05', className: 'Class 5', section: 'A', marks: 80,
      }],
      ['attendance/attendance-a', {
        schoolId: 'school-a', className: 'Class 5', section: 'A', status: 'PRESENT',
      }],
      ['homework/homework-a', {
        schoolId: 'school-a', className: 'Class 5', section: 'A', title: 'Homework',
      }],
      ['feePayments/fee-a', {
        schoolId: 'school-a', studentName: 'Student A', rollNumber: '05',
        className: 'Class 5', feeHead: 'Tuition Fee', amount: 500,
        paymentDate: '2026-11-01', receiptNumber: 'FEE-0001',
        remarks: '', paymentMode: 'CASH_OFFLINE', recordedByUid: 'school-admin-a',
        createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
      }],
    ];

    for (const [path, data] of docs) {
      await setDoc(doc(firestore, path), data);
    }
  });
}

before(async () => {
  const rules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seedFixtures();
});

after(async () => {
  await testEnv?.cleanup();
});

test('public visitors can read only the limited public result projection', async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(db, 'publicResults/result-a')));
  await assertFails(getDoc(doc(db, 'results/result-a')));
  await assertFails(getDoc(doc(db, 'students/student-a')));
});

test('a School Admin can read their own school records, not another school', async () => {
  const db = testEnv.authenticatedContext('school-admin-a', {
    email: 'school-admin-a@example.com',
  }).firestore();

  await assertSucceeds(getDoc(doc(db, 'students/student-a')));
  await assertSucceeds(getDoc(doc(db, 'results/result-a')));
  await assertSucceeds(getDoc(doc(db, 'feePayments/fee-a')));
  await assertFails(getDoc(doc(db, 'students/student-b')));
  await assertFails(getDoc(doc(db, 'results/result-b')));
});

test('an assigned Teacher can read assigned academic records but not fee receipts', async () => {
  const db = testEnv.authenticatedContext('teacher-a', {
    email: 'teacher-a@example.com',
  }).firestore();

  await assertSucceeds(getDoc(doc(db, 'students/student-a')));
  await assertSucceeds(getDoc(doc(db, 'results/result-a')));
  await assertSucceeds(getDoc(doc(db, 'attendance/attendance-a')));
  await assertSucceeds(getDoc(doc(db, 'homework/homework-a')));
  await assertFails(getDoc(doc(db, 'feePayments/fee-a')));
});

test('cash fee receipts can be created by the owning School Admin only', async () => {
  const db = testEnv.authenticatedContext('school-admin-a', {
    email: 'school-admin-a@example.com',
  }).firestore();

  const receipt = {
    schoolId: 'school-a',
    studentName: 'Student A',
    rollNumber: '05',
    className: 'Class 5',
    feeHead: 'Tuition Fee',
    amount: 750,
    paymentDate: '2026-11-01',
    receiptNumber: 'FEE-0002',
    remarks: '',
    paymentMode: 'CASH_OFFLINE',
    recordedByUid: 'school-admin-a',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await assertSucceeds(setDoc(doc(db, 'feePayments/fee-new'), receipt));
  await assertFails(setDoc(doc(db, 'feePayments/fee-online'), {
    ...receipt,
    paymentMode: 'ONLINE',
  }));
  await assertFails(setDoc(doc(db, 'feePayments/fee-other-school'), {
    ...receipt,
    schoolId: 'school-b',
  }));

  const teacherDb = testEnv.authenticatedContext('teacher-a').firestore();
  await assertFails(setDoc(doc(teacherDb, 'feePayments/fee-teacher'), {
    ...receipt,
    recordedByUid: 'teacher-a',
  }));
});

test('school-scoped collection queries are permitted only to that School Admin', async () => {
  const ownDb = testEnv.authenticatedContext('school-admin-a').firestore();
  const ownQuery = query(
    collection(ownDb, 'feePayments'),
    where('schoolId', '==', 'school-a'),
  );
  const ownSnapshot = await assertSucceeds(getDocs(ownQuery));
  assert.equal(ownSnapshot.size, 1);

  const otherDb = testEnv.authenticatedContext('school-admin-b').firestore();
  const otherQuery = query(
    collection(otherDb, 'feePayments'),
    where('schoolId', '==', 'school-a'),
  );
  await assertFails(getDocs(otherQuery));
});
