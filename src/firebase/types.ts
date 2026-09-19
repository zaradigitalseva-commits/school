// ============================================================
// USER ROLES
// ============================================================

export type UserRole =
  | 'user'
  | 'teacher'
  | 'school_admin'
  | 'platform_admin';


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
  whatsappNumber?: string;
  whatsappVerified?: boolean;

  principalName?: string;
  principalMessage?: string;
  principalImageUrl?: string;

  foundedYear?: string;

  totalStudents?: number;
  totalTeachers?: number;

  customDomain?: string;
  customDomainStatus?: 'NONE' | 'PENDING' | 'VERIFIED';

  // ============================================================
  // SUBSCRIPTION / PAYMENT
  // ============================================================

  subscriptionPlan?: string;
  subscriptionStatus?: string;

  subscriptionStartDate?: string;
  subscriptionExpiryDate?: string;
  subscriptionDays?: number;

  paymentStatus?: string;
  paymentId?: string;
  paymentAmount?: number;
  paymentDate?: string;

  paymentApprovalType?: 'PAID' | 'WAIVED';

  // ============================================================
  // PLATFORM / ADMIN
  // ============================================================

  approvedByUid?: string;
  approvedAt?: string;

  suspendedAt?: string;
  archivedAt?: string;

  suspensionReason?: string;
}


// ============================================================
// SCHOOL INFO
// ============================================================

export interface SchoolInfo extends School {
  schoolId?: string;
}


// ============================================================
// SCHOOL MEMBERSHIP
// ============================================================

export interface SchoolMembership {
  id: string;

  schoolId: string;
  uid: string;
  email: string;

  role: 'school_admin' | 'teacher';

  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';

  assignments?: string[];

  createdAt: string;
  updatedAt: string;
}


// ============================================================
// SCHOOL REGISTRATION
// ============================================================

export interface SchoolRegistrationInput {
  name: string;
  slug: string;

  phone?: string;
  whatsappNumber: string;
  whatsappVerified: boolean;

  address?: string;
  tagline?: string;
  description?: string;

  logoUrl?: string;
  heroImageUrl?: string;
}


// ============================================================
// TEACHER
// ============================================================

export interface Teacher {
  id: string;

  schoolId: string;

  uid?: string;
  email?: string;

  name: string;
  phone?: string;

  subject?: string;
  assignedClass?: string;

  status?: 'ACTIVE' | 'INACTIVE';

  createdAt?: string;
  updatedAt?: string;
}


// ============================================================
// ANNOUNCEMENT / NOTICE
// ============================================================

export interface Announcement {
  id: string;

  schoolId: string;

  title: string;
  content?: string;

  createdAt?: string;
  updatedAt?: string;
}


// ============================================================
// SCHOOL EVENT
// ============================================================

export interface SchoolEvent {
  id: string;

  schoolId: string;

  title: string;
  description?: string;

  eventDate?: string;
  imageUrl?: string;

  createdAt?: string;
  updatedAt?: string;
}
