// src/firebase/types.ts

// ============================================================
// USER ROLES
// ============================================================

export type UserRole =
  | 'platform_admin'
  | 'school_admin'
  | 'teacher'
  | 'user';

export type LegacyUserRole =
  | 'admin'
  | 'faculty'
  | 'user';


// ============================================================
// SCHOOL STATUS
// ============================================================

export type SchoolStatus =
  | 'PENDING_PAYMENT'
  | 'LIVE'
  | 'SUSPENDED'
  | 'ARCHIVED';


// ============================================================
// SCHOOL
// ============================================================

export interface School {
  id: string;

  name: string;
  slug: string;

  ownerUid: string;

  // Google Login email - automatically saved,
  // not entered manually in registration form.
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

  // Subscription / Payment
  subscriptionPlan?: string;
  subscriptionStatus?: string;

  paymentStatus?: string;
  paymentId?: string;
  paymentAmount?: number;
  paymentDate?: string;

  // Platform / Admin
  approvedByUid?: string;
  approvedAt?: string;

  suspendedAt?: string;
  archivedAt?: string;

  suspensionReason?: string;
}


// ============================================================
// SCHOOL REGISTRATION
// ============================================================

export interface SchoolRegistrationInput {
  name: string;
  slug: string;

  // Email is NOT entered in the form.
  // It is automatically taken from Google Login.
  phone: string;

  tagline?: string;
  description?: string;
}


// ============================================================
// APP USER
// ============================================================

export interface AppUser {
  uid: string;

  email: string;

  displayName?: string;
  photoURL?: string;

  role: UserRole;

  schoolId?: string;

  phone?: string;

  createdAt?: string;
  updatedAt?: string;

  // Last Google login time
  lastLoginAt?: string;

  active?: boolean;
}


// ============================================================
// SCHOOL MEMBERSHIP
// ============================================================

export type SchoolMembershipRole =
  | 'school_admin'
  | 'teacher';

export type SchoolMembershipStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'REVOKED';

export interface SchoolMembership {
  id: string;

  schoolId: string;
  uid: string;

  // Automatically taken from Google Login.
  email: string;

  displayName?: string;
  photoURL?: string;

  role: SchoolMembershipRole;

  status: SchoolMembershipStatus;

  // Teacher class assignments
  assignments?: string[];

  createdAt: string;
  updatedAt?: string;

  approvedByUid?: string;
  approvedAt?: string;

  revokedAt?: string;
}


// ============================================================
// SCHOOL INFO
// ============================================================

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


// ============================================================
// CLASS
// ============================================================

export interface SchoolClass {
  id: string;

  schoolId: string;

  name: string;
  className?: string;

  // 1, 2, 3 ... 12
  classNumber?: number;

  section?: string;

  description?: string;

  teacherIds?: string[];

  createdAt?: string;
  updatedAt?: string;

  active?: boolean;
}


// ============================================================
// STUDENT
// ============================================================

export interface Student {
  id: string;

  schoolId: string;

  admissionNumber?: string;
  rollNumber?: string;

  name: string;

  firstName?: string;
  middleName?: string;
  lastName?: string;

  gender?: string;

  dateOfBirth?: string;

  classId?: string;
  className?: string;
  section?: string;

  fatherName?: string;
  motherName?: string;
  guardianName?: string;

  phone?: string;
  email?: string;

  address?: string;

  photoUrl?: string;

  admissionDate?: string;

  createdAt?: string;
  updatedAt?: string;

  active?: boolean;
}


// ============================================================
// ACADEMIC SESSION
// ============================================================

export interface AcademicSession {
  id: string;

  schoolId: string;

  name: string;

  startDate?: string;
  endDate?: string;

  active?: boolean;

  createdAt?: string;
  updatedAt?: string;
}


// ============================================================
// SUBJECT
// ============================================================

export interface Subject {
  id: string;

  schoolId: string;

  name: string;

  code?: string;

  classId?: string;

  teacherIds?: string[];

  description?: string;

  createdAt?: string;
  updatedAt?: string;

  active?: boolean;
}


// ============================================================
// EXAM
// ============================================================

export interface Exam {
  id: string;

  schoolId: string;

  name: string;

  classId?: string;

  academicSessionId?: string;

  startDate?: string;
  endDate?: string;

  totalMarks?: number;

  description?: string;

  createdAt?: string;
  updatedAt?: string;
}


// ============================================================
// RESULT
// ============================================================

export interface Result {
  id: string;

  schoolId: string;

  studentId: string;

  studentName?: string;

  classId?: string;
  className?: string;

  subjectId?: string;
  subjectName?: string;

  examId?: string;
  examName?: string;

  marks?: number;
  maxMarks?: number;

  grade?: string;

  percentage?: number;

  remarks?: string;

  academicSessionId?: string;

  createdAt?: string;
  updatedAt?: string;
}


// ============================================================
// HOMEWORK
// ============================================================

export interface Homework {
  id: string;

  schoolId: string;

  title: string;

  description?: string;

  classId?: string;
  className?: string;

  subjectId?: string;
  subjectName?: string;

  teacherId?: string;
  teacherName?: string;

  assignedDate?: string;
  dueDate?: string;

  attachmentUrl?: string;

  createdAt?: string;
  updatedAt?: string;

  published?: boolean;
}


// ============================================================
// ATTENDANCE
// ============================================================

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'LEAVE';

export interface Attendance {
  id: string;

  schoolId: string;

  studentId: string;
  studentName?: string;

  classId?: string;
  className?: string;

  date: string;

  status: AttendanceStatus;

  remarks?: string;

  markedByUid?: string;
  markedByName?: string;

  createdAt?: string;
  updatedAt?: string;
}


// ============================================================
// NOTICE
// ============================================================

export type NoticePriority =
  | 'LOW'
  | 'NORMAL'
  | 'HIGH'
  | 'URGENT';

export interface Notice {
  id: string;

  schoolId: string;

  title: string;

  content: string;

  date: string;

  priority: NoticePriority;

  published?: boolean;

  createdByUid?: string;
  createdByName?: string;

  createdAt?: string;
  updatedAt?: string;
}


// ============================================================
// ANNOUNCEMENT
// ============================================================

export interface Announcement {
  id: string;

  title: string;

  content: string;

  date: string;

  priority: NoticePriority;

  schoolId?: string;

  published?: boolean;

  createdByUid?: string;

  createdAt?: string;
  updatedAt?: string;
}


// ============================================================
// SCHOOL EVENT
// ============================================================

export interface SchoolEvent {
  id: string;

  schoolId?: string;

  title: string;

  description?: string;

  date: string;

  startTime?: string;
  endTime?: string;

  location?: string;

  imageUrl?: string;

  createdByUid?: string;

  createdAt?: string;
  updatedAt?: string;

  published?: boolean;
}


// ============================================================
// GALLERY
// ============================================================

export interface GalleryItem {
  id: string;

  schoolId: string;

  title?: string;

  description?: string;

  imageUrl: string;

  category?: string;

  createdByUid?: string;

  createdAt?: string;
  updatedAt?: string;

  published?: boolean;
}


// ============================================================
// SCHOOL DOCUMENT
// ============================================================

export interface SchoolDocument {
  id: string;

  schoolId: string;

  title: string;

  description?: string;

  documentUrl: string;

  documentType?: string;

  uploadedByUid?: string;

  createdAt?: string;
  updatedAt?: string;

  published?: boolean;
}


// ============================================================
// TEACHER
// ============================================================

export interface Teacher {
  id: string;

  schoolId?: string;

  uid?: string;

  name: string;

  email?: string;

  phone?: string;

  photoUrl?: string;

  designation?: string;

  qualification?: string;

  experience?: string;

  subject?: string;

  classIds?: string[];

  assignedClasses?: string[];

  bio?: string;

  order?: number;

  createdAt?: string;
  updatedAt?: string;

  active?: boolean;
}


// ============================================================
// PLATFORM PAYMENT
// ============================================================

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'APPROVED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface Payment {
  id: string;

  schoolId: string;

  userId?: string;

  ownerUid?: string;

  amount: number;

  currency?: string;

  status: PaymentStatus;

  paymentId?: string;

  transactionId?: string;

  gateway?: string;

  plan?: string;

  description?: string;

  createdAt: string;
  updatedAt?: string;

  approvedByUid?: string;
  approvedAt?: string;
}


// ============================================================
// SCHOOL SUBSCRIPTION
// ============================================================

export type SubscriptionStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'SUSPENDED';

export interface SchoolSubscription {
  id: string;

  schoolId: string;

  planId?: string;
  planName?: string;

  status: SubscriptionStatus;

  amount?: number;

  startDate?: string;
  endDate?: string;

  paymentId?: string;

  createdAt?: string;
  updatedAt?: string;
}


// ============================================================
// SUBSCRIPTION PLAN
// ============================================================

export interface SubscriptionPlan {
  id: string;

  name: string;

  description?: string;

  amount: number;

  durationDays?: number;

  features?: string[];

  active?: boolean;

  createdAt?: string;
  updatedAt?: string;
}


// ============================================================
// SCHOOL WALLET
// ============================================================

export interface SchoolWallet {
  id: string;

  schoolId: string;

  balance: number;

  currency?: string;

  updatedAt?: string;
}


// ============================================================
// WALLET TRANSACTION
// ============================================================

export type WalletTransactionType =
  | 'CREDIT'
  | 'DEBIT';

export interface WalletTransaction {
  id: string;

  schoolId: string;

  type: WalletTransactionType;

  amount: number;

  balanceAfter?: number;

  description?: string;

  referenceId?: string;

  createdAt: string;

  createdByUid?: string;
}


// ============================================================
// PLATFORM SUPPORT TICKET
// ============================================================

export type SupportTicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED';

export interface SupportTicket {
  id: string;

  schoolId?: string;

  userId?: string;

  name?: string;

  email?: string;

  subject: string;

  message: string;

  status: SupportTicketStatus;

  adminReply?: string;

  createdAt: string;
  updatedAt?: string;

  resolvedAt?: string;
}


// ============================================================
// CONTACT MESSAGE
// ============================================================

export interface ContactMessage {
  id: string;

  schoolId?: string;

  name: string;

  email?: string;

  phone?: string;

  subject?: string;

  message: string;

  createdAt: string;

  read?: boolean;

  replied?: boolean;
}


// ============================================================
// SLUG RESERVATION
// ============================================================

export interface SlugReservation {
  slug: string;

  schoolId: string;

  schoolName: string;

  ownerUid: string;

  createdAt: string;
}


// ============================================================
// PLATFORM SETTINGS
// ============================================================

export interface PlatformSettings {
  id: string;

  platformName?: string;

  logoUrl?: string;

  supportEmail?: string;

  supportPhone?: string;

  defaultPlanId?: string;

  registrationEnabled?: boolean;

  maintenanceMode?: boolean;

  createdAt?: string;
  updatedAt?: string;
}


// ============================================================
// GENERAL SETTINGS
// ============================================================

export interface SchoolSettings {
  id: string;

  schoolId: string;

  schoolName?: string;

  logoUrl?: string;

  primaryColor?: string;

  secondaryColor?: string;

  theme?: string;

  showGallery?: boolean;

  showTeachers?: boolean;

  showEvents?: boolean;

  showNotices?: boolean;

  showResults?: boolean;

  showHomework?: boolean;

  showAttendance?: boolean;

  updatedAt?: string;
}


// ============================================================
// GENERIC API / OPERATION RESULT
// ============================================================

export interface OperationResult {
  success: boolean;

  message?: string;

  error?: string;

  id?: string;
}


// ============================================================
// PAGINATION
// ============================================================

export interface PaginationOptions {
  page?: number;

  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];

  page: number;

  pageSize: number;

  total?: number;

  hasMore?: boolean;
}
