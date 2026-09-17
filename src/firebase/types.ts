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

  // ============================================================
  // SUBSCRIPTION / PAYMENT
  // ============================================================

  subscriptionPlan?: string;
  subscriptionStatus?: string;

  // Subscription validity
  subscriptionStartDate?: string;
  subscriptionExpiryDate?: string;
  subscriptionDays?: number;

  // Payment information
  paymentStatus?: string;
  paymentId?: string;
  paymentAmount?: number;
  paymentDate?: string;

  // How the subscription was approved
  // PAID   = payment approved
  // WAIVED = free/test approval by Platform Admin
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
