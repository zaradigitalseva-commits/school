// ============================================================
// USER ROLES
// ============================================================

export type UserRole =
  | 'user'
  | 'teacher'
  | 'school_admin'
  | 'platform_admin';

export interface AppUser {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  role?: UserRole;
  schoolId?: string;
  status?: string;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
}


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
  city?: string;
  state?: string;
  whatsappNumber?: string;
  whatsappVerified?: boolean;

  principalName?: string;
  principalMessage?: string;
  foundedYear?: string;
  principalImageUrl?: string;

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
  totalRechargeAmount?: number;
  totalRechargeDays?: number;

  paymentStatus?: string;
  paymentId?: string;
  paymentAmount?: number;
  paymentDate?: string;

  paymentApprovalType?: 'PAID' | 'WAIVED' | 'ADMIN_RECHARGE';

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

export interface SchoolInfo extends Partial<School> {
  name: string;
  schoolId?: string;
  campusImages: string[];
  totalCourses?: number | string;
}

// ============================================================
// SCHOOL MEMBERSHIP
// ============================================================

export interface SchoolMembership {
  id: string;

  schoolId: string;
  uid: string;
  email: string;
  invitedByEmail?: string;

  role: 'school_admin' | 'teacher';

  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REVOKED';

  assignments?: string[];
  subject?: string;

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
  email: string;
  city: string;
  state: string;
  principalName: string;
  foundedYear?: string;
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
  photoDataUrl?: string;

  subject?: string;
  designation?: string;
  bio?: string;
  imageUrl?: string;
  order?: number;
  assignedClass?: string;
  section?: string;
  qualification?: string;
  teacherId?: string;
  joiningDate?: string;

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
  date?: string;
  priority?: 'low' | 'medium' | 'high';

  createdAt?: string;
  updatedAt?: string;
}


// ============================================================
// HOMEPAGE POST
// ============================================================
export interface HomePost {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  schoolId?: string | null;
  schoolName?: string;
  authorUid: string;
  authorName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: any;
  updatedAt?: any;
  approvedAt?: any;
  approvedByUid?: string;
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
  date?: string;
  location?: string;
  imageUrl?: string;

  createdAt?: string;
  updatedAt?: string;
}
