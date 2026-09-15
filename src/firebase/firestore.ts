export async function registerSchool(
  uid: string,
  input: SchoolRegistrationInput
): Promise<School> {
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();
  const ownerEmail = input.ownerEmail.trim().toLowerCase();

  if (!name) {
    throw new Error('School name is required.');
  }

  if (!slug) {
    throw new Error('School slug is required.');
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(
      'School slug can contain only lowercase letters, numbers and hyphens.'
    );
  }

  if (!uid) {
    throw new Error('You must be signed in to register a school.');
  }

  if (!ownerEmail) {
    throw new Error('Google account email is required.');
  }

  const schoolRef = doc(collection(db, 'schools'));

  const slugRef = doc(
    db,
    'slugReservations',
    slug
  );

  const membershipRef = doc(
    db,
    'schoolMemberships',
    `${uid}_${schoolRef.id}`
  );

  const now = new Date().toISOString();

  const school: School = {
    id: schoolRef.id,
    name,
    slug,
    ownerUid: uid,
    ownerEmail,
    status: 'PENDING_PAYMENT',
    createdAt: now,
    updatedAt: now,
    tagline: input.tagline?.trim() ?? '',
    description: input.description?.trim() ?? '',
  };

  const membership: SchoolMembership = {
    id: membershipRef.id,
    uid,
    schoolId: schoolRef.id,
    role: 'school_admin',
    status: 'PENDING',
    assignments: [],
    createdAt: now,
    updatedAt: now,
  };

  await runTransaction(db, async (transaction) => {
    const slugDoc = await transaction.get(slugRef);

    if (slugDoc.exists()) {
      throw new Error(
        'This school URL/slug is already registered. Please choose another.'
      );
    }

    /*
     * 1. Create pending school
     */
    transaction.set(schoolRef, {
      ...school,
    });

    /*
     * 2. Reserve unique slug
     */
    transaction.set(slugRef, {
      slug,
      schoolId: schoolRef.id,
      ownerUid: uid,
      createdAt: serverTimestamp(),
    });

    /*
     * 3. Create pending school-admin membership
     */
    transaction.set(membershipRef, {
      ...membership,
    });
  });

  return school;
}
