export type UserRole =
  | 'platform_admin'
  | 'school_admin'
  | 'teacher'
  | 'user';

/*
 * Old roles kept only for compatibility with any old component
 * that may still reference them.
 */
export type LegacyUserRole =
  | 'admin'
  | 'faculty'
  | 'user';

/* ================================
   SCHOOL
================================ */

export type SchoolStatus =
  | 'PENDING_PAYMENT'
  | 'LIVE'
  | 'SUSPENDED'
  | 'ARCHIVED';

export interface School {
  id: string;
  name: string;
  slug: string;

  ownerUid: string;
  ownerEmail: string;

  status: SchoolStatus;

  createdAt: string;
  updatedAt: string;

  logoUrl?: string;
  heroImageUrl?: string;

  tagline?: string;
  description?: string;

  address?: string;
  phone?: string;
  email?: string;

  principalName?: string;
  principalMessage?: string;
  principalImageUrl?: string;

  foundedYear?: string;

  totalStudents?: number;
  totalTeachers?: number;

  customDomain?: string;
  customDomainStatus?: 'NONE' | 'PENDING' | 'VERIFIED';
}


/* ================================
   SCHOOL MEMBERSHIP
================================ */

export type MembershipStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'REVOKED';

export interface SchoolMembership {
  id: string;

  uid: string;
  schoolId: string;

  role: 'school_admin' | 'teacher';

  status: MembershipStatus;

  /*
   * For teachers this contains assigned class IDs.
   * Example:
   * ['class-1-a', 'class-5-a']
   */
  assignments: string[];

  createdAt: string;
  updatedAt?: string;

  invitedByUid?: string;
  invitedByEmail?: string;
}


/* ================================
   SCHOOL REGISTRATION
================================ */

export interface SchoolRegistrationInput {
  name: string;
  slug: string;

  ownerEmail: string;

  tagline?: string;
  description?: string;
}


/* ================================
   USER
================================ */

export interface AppUser {
  uid: string;

  email: string;
  displayName: string;

  photoURL?: string;

  role: UserRole;

  createdAt: string;
  updatedAt?: string;

  lastLoginAt?: string;
}


/* ================================
   CLASSES
================================ */

export interface SchoolClass {
  id: string;

  schoolId: string;

  name: string;
  classNumber: number;

  /*
   * Example:
   * A, B, C
   */
  division?: string;

  academicSessionId?: string;

  classTeacherUid?: string;

  createdAt: string;
  updatedAt?: string;
}


/* ================================
   STUDENTS
================================ */

export interface Student {
  id: string;

  schoolId: string;

  admissionNumber: string;

  rollNumber?: number;

  name: string;

  dateOfBirth?: string;

  gender?: 'male' | 'female' | 'other';

  classId?: string;
  className?: string;
  division?: string;

  fatherName?: string;
  motherName?: string;

  parentName?: string;

  phone?: string;
  email?: string;

  address?: string;

  photoURL?: string;

  admissionDate?: string;

  status?: 'active' | 'inactive' | 'transferred' | 'left';

  createdAt: string;
  updatedAt?: string;
}


/* ================================
   ACADEMIC SESSION
================================ */

export interface AcademicSession {
  id: string;

  schoolId: string;

  name: string;

  /*
   * Example:
   * 2026-27
   */
  startDate: string;
  endDate: string;

  isActive: boolean;

  createdAt: string;
}


/* ================================
   SUBJECT
================================ */

export interface Subject {
  id: string;

  schoolId: string;

  name: string;

  code?: string;

  classIds?: string[];

  maxMarks?: number;

  passingMarks?: number;

  createdAt: string;
}


/* ================================
   EXAM
================================ */

export interface Exam {
  id: string;

  schoolId: string;

  academicSessionId: string;

  name: string;

  startDate?: string;
  endDate?: string;

  status?: 'draft' | 'active' | 'completed';

  createdAt: string;
}


/* ================================
   RESULT
================================ */

export type ResultStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'REVIEW'
  | 'PUBLISHED';

export interface Result {
  id: string;

  schoolId: string;

  studentId: string;

  classId: string;

  academicSessionId: string;

  examId: string;

  subjectId: string;

  marksObtained: number;

  maxMarks: number;

  grade?: string;

  remarks?: string;

  status: ResultStatus;

  enteredByUid: string;

  reviewedByUid?: string;

  publishedAt?: string;

  createdAt: string;
  updatedAt?: string;
}


/* ================================
   HOMEWORK
================================ */

export interface Homework {
  id: string;

  schoolId: string;

  classId: string;

  subjectId?: string;

  teacherUid: string;

  title: string;

  description: string;

  assignedDate: string;

  dueDate?: string;

  attachmentUrl?: string;

  status?: 'active' | 'completed' | 'archived';

  createdAt: string;
  updatedAt?: string;
}


/* ================================
   ATTENDANCE
================================ */

export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'late'
  | 'leave';

export interface Attendance {
  id: string;

  schoolId: string;

  studentId: string;

  classId: string;

  date: string;

  status: AttendanceStatus;

  markedByUid: string;

  remarks?: string;

  createdAt: string;
}


/* ================================
   NOTICE
================================ */

export type NoticePriority =
  | 'high'
  | 'medium'
  | 'low';

export interface Notice {
  id: string;

  schoolId: string;

  title: string;

  content: string;

  priority: NoticePriority;

  published: boolean;

  publishedAt?: string;

  createdByUid: string;

  createdAt: string;
  updatedAt?: string;
}


/* ================================
   EVENT
================================ */

export interface SchoolEvent {
  id: string;

  schoolId: string;

  title: string;

  description: string;

  date: string;

  endDate?: string;

  location?: string;

  imageUrl?: string;

  published?: boolean;

  createdByUid: string;

  createdAt: string;
  updatedAt?: string;
}


/* ================================
   GALLERY
================================ */

export interface GalleryItem {
  id: string;

  schoolId: string;

  title?: string;

  imageUrl: string;

  description?: string;

  published?: boolean;

  createdByUid: string;

  createdAt: string;
}


/* ================================
   DOCUMENT
================================ */

export interface SchoolDocument {
  id: string;

  schoolId: string;

  title: string;

  description?: string;

  fileUrl: string;

  fileType?: string;

  uploadedByUid: string;

  createdAt: string;
}


/* ================================
   TEACHER
================================ */

export interface Teacher {
  id: string;

  schoolId?: string;

  uid?: string;

  name: string;

  email: string;

  designation: string;

  subject: string;

  qualification: string;

  bio: string;

  imageUrl: string;

  phone: string;

  /*
   * Assigned class IDs.
   * A teacher can have multiple assigned classes.
   */
  assignedClassIds?: string[];

  status?: 'active' | 'inactive';

  order?: number;

  createdAt?: string;
  updatedAt?: string;
}


/* ================================
   WALLET
================================ */

export interface Wallet {
  schoolId: string;

  balance: number;

  currency: 'INR';

  updatedAt: string;
}


/* ================================
   WALLET TRANSACTION
================================ */

export type WalletTransactionType =
  | 'RECHARGE'
  | 'SUBSCRIPTION'
  | 'REFUND'
  | 'ADJUSTMENT';

export interface WalletTransaction {
  id: string;

  schoolId: string;

  type: WalletTransactionType;

  amount: number;

  balanceBefore: number;

  balanceAfter: number;

  description: string;

  referenceId?: string;

  createdAt: string;

  createdByUid: string;
}


/* ================================
   SUBSCRIPTION
================================ */

export interface Subscription {
  schoolId: string;

  status:
    | 'ACTIVE'
    | 'EXPIRED'
    | 'SUSPENDED';

  startAt: string;

  expiresAt: string;

  lastPaymentId?: string;

  totalDaysPurchased?: number;

  updatedAt: string;
}


/* ================================
   BILLING CYCLE
================================ */

export interface BillingCycle {
  id: string;

  schoolId: string;

  subscriptionId?: string;

  periodStart: string;

  periodEnd: string;

  amount: number;

  days: number;

  status:
    | 'PENDING'
    | 'PAID'
    | 'FAILED'
    | 'CANCELLED';

  createdAt: string;

  processedAt?: string;
}


/* ================================
   RECHARGE / PAYMENT
================================ */

export type RechargeStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export interface RechargeRequest {
  id: string;

  schoolId: string;

  uid: string;

  amount: number;

  days: number;

  utr: string;

  utrNormalized: string;

  proofUrl?: string;

  note?: string;

  status: RechargeStatus;

  createdAt: string;

  reviewedAt?: string;

  reviewedByUid?: string;

  rejectionReason?: string;
}


/* ================================
   PAYMENT PACKAGES
================================ */

export interface BillingPackage {
  amount: number;
  days: number;
}


/* ================================
   PAYMENT SETTINGS
================================ */

export interface PaymentSettings {
  upiId: string;

  qrImageUrl?: string;

  supportPhone?: string;

  instructions?: string;

  updatedAt?: string;
}


/* ================================
   PLATFORM ADS
================================ */

export interface PlatformAd {
  id: string;

  title: string;

  content?: string;

  imageUrl?: string;

  linkUrl?: string;

  active: boolean;

  startAt?: string;

  endAt?: string;

  createdAt: string;
}


/* ================================
   PLATFORM ANNOUNCEMENT
================================ */

export interface PlatformAnnouncement {
  id: string;

  title: string;

  content: string;

  active: boolean;

  createdAt: string;

  updatedAt?: string;
}


/* ================================
   AUDIT LOG
================================ */

export interface AuditLog {
  id: string;

  schoolId?: string;

  actorUid: string;

  actorEmail?: string;

  action: string;

  collection?: string;

  documentId?: string;

  description?: string;

  createdAt: string;
}


/* ================================
   SUPPORT REQUEST
================================ */

export interface SupportRequest {
  id: string;

  schoolId?: string;

  uid: string;

  subject: string;

  message: string;

  status:
    | 'OPEN'
    | 'IN_PROGRESS'
    | 'RESOLVED'
    | 'CLOSED';

  createdAt: string;

  updatedAt?: string;
}


/* ================================
   OLD SINGLE-SCHOOL COMPATIBILITY
================================ */

/*
 * These interfaces keep existing public pages working
 * while the application is being migrated to the new
 * multi-school architecture.
 */

export interface SchoolInfo {
  name: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
  heroImageUrl: string;
  campusImages: string[];
  principalName: string;
  principalMessage: string;
  principalImageUrl: string;
  foundedYear: string;
  totalStudents: string;
  totalTeachers: string;
  totalCourses: string;
}


export interface Announcement {
  id: string;

  title: string;

  content: string;

  date: string;

  priority: NoticePriority;

  schoolId?: string;

  published?: boolean;

  createdByUid?: string;
}
