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

  const cleanName =
    input.name?.trim();

  const cleanSlug =
    input.slug
      ?.trim()
      .toLowerCase();

  const cleanPhone =
    input.phone?.trim() || '';

  const cleanWhatsappNumber =
    input.whatsappNumber?.trim();

  const cleanEmail =
    ownerEmail
      ?.trim()
      .toLowerCase();

  /* =======================================================
     BASIC VALIDATION
  ======================================================= */

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

  if (!cleanEmail) {
    throw new Error(
      'Google account email is required.'
    );
  }

  /* =======================================================
     WHATSAPP NUMBER
  ======================================================= */

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

  /*
   * This is owner confirmation only.
   * It is NOT OTP verification.
   */
  if (
    input.whatsappVerified !== true
  ) {
    throw new Error(
      'Please confirm that the WhatsApp number is correct.'
    );
  }

  /* =======================================================
     OPTIONAL PHONE VALIDATION
  ======================================================= */

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

  /* =======================================================
     CHECK SLUG
  ======================================================= */

  const slugRef = doc(
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

  /* =======================================================
     GENERATE SCHOOL ID
  ======================================================= */

  const schoolRef =
    doc(
      collection(
        db,
        'schools'
      )
    );

  const schoolId =
    schoolRef.id;

  /* =======================================================
     GENERATE MEMBERSHIP ID
  ======================================================= */

  const membershipId =
    `${ownerUid}_${schoolId}`;

  const membershipRef =
    doc(
      db,
      'schoolMemberships',
      membershipId
    );

  const now =
    new Date().toISOString();

  /* =======================================================
     SCHOOL DOCUMENT
  ======================================================= */

  const school: School = {
    id: schoolId,

    name: cleanName,

    slug: cleanSlug,

    ownerUid,

    ownerEmail: cleanEmail,

    /*
     * New school starts as pending payment.
     */
    status:
      'PENDING_PAYMENT',

    createdAt: now,

    updatedAt: now,

    /*
     * Normal phone is optional.
     */
    phone: cleanPhone,

    /*
     * IMPORTANT:
     * School's own WhatsApp number.
     */
    whatsappNumber:
      cleanWhatsappNumber,

    /*
     * Owner confirmed the number.
     * This is NOT OTP verification.
     */
    whatsappVerified: true,

    /*
     * School address.
     */
    address:
      input.address?.trim() || '',

    /*
     * Optional school information.
     */
    tagline:
      input.tagline?.trim() || '',

    description:
      input.description?.trim() || '',

    /*
     * Initial payment state.
     */
    paymentStatus:
      'PENDING',

    subscriptionStatus:
      'PENDING',
  };

  /* =======================================================
     SCHOOL ADMIN MEMBERSHIP
  ======================================================= */

  const membership:
    SchoolMembership = {
    id: membershipId,

    schoolId,

    uid: ownerUid,

    email: cleanEmail,

    role:
      'school_admin',

    status:
      'PENDING',

    assignments: [],

    createdAt: now,

    updatedAt: now,
  };

  /* =======================================================
     FIRESTORE BATCH
  ======================================================= */

  const batch =
    writeBatch(db);

  /* -------------------------------------------------------
     SCHOOL
  ------------------------------------------------------- */

  batch.set(
    schoolRef,
    school
  );

  /* -------------------------------------------------------
     SCHOOL ADMIN MEMBERSHIP
  ------------------------------------------------------- */

  batch.set(
    membershipRef,
    membership
  );

  /* -------------------------------------------------------
     SLUG RESERVATION
  ------------------------------------------------------- */

  batch.set(
    slugRef,
    {
      slug: cleanSlug,

      schoolId,

      schoolName: cleanName,

      ownerUid,

      createdAt:
        serverTimestamp(),
    }
  );

  /* =======================================================
     SAVE
  ======================================================= */

  await batch.commit();

  return school;
}
