```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchSchoolById,
  fetchMyMembership,
  fetchSchoolMemberships,
  updateSchoolMembership,
} from '@/firebase/firestore';

import type {
  School,
  SchoolMembership,
} from '@/firebase/types';

export default function SchoolAdminPage() {
  const navigate = useNavigate();

  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [memberships, setMemberships] = useState<SchoolMembership[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeSection, setActiveSection] = useState('dashboard');

  /*
   * IMPORTANT:
   * School Admin का schoolId URL से नहीं लिया जाएगा।
   *
   * Current logged-in user की ACTIVE membership से
   * schoolId automatically मिलेगा।
   */

  const loadSchool = async () => {
    try {
      setLoading(true);
      setError('');

      // ------------------------------------------
      // 1. Current logged-in School Admin की membership
      // ------------------------------------------
      const myMembership = await fetchMyMembership();

      if (!myMembership) {
        setError(
          'Your school membership was not found. Please contact the platform administrator.'
        );
        return;
      }

      // ------------------------------------------
      // 2. Security check
      // ------------------------------------------
      if (myMembership.role !== 'school_admin') {
        setError(
          'You do not have School Admin access.'
        );
        return;
      }

      if (myMembership.status !== 'ACTIVE') {
        setError(
          `Your School Admin access is ${myMembership.status}.`
        );
        return;
      }

      // ------------------------------------------
      // 3. Get schoolId from membership
      // ------------------------------------------
      const currentSchoolId = myMembership.schoolId;

      if (!currentSchoolId) {
        setError(
          'Your school is not assigned to this account.'
        );
        return;
      }

      setSchoolId(currentSchoolId);

      // ------------------------------------------
      // 4. Load ONLY this school
      // ------------------------------------------
      const schoolData =
        await fetchSchoolById(currentSchoolId);

      if (!schoolData) {
        setError('Your school could not be found.');
        return;
      }

      // ------------------------------------------
      // 5. Verify ownership
      // ------------------------------------------
      if (
        schoolData.id &&
        schoolData.id !== currentSchoolId
      ) {
        setError(
          'School verification failed.'
        );
        return;
      }

      setSchool(schoolData);

      // ------------------------------------------
      // 6. Load memberships ONLY for this school
      // ------------------------------------------
      const membershipData =
        await fetchSchoolMemberships(currentSchoolId);

      setMemberships(membershipData);

    } catch (err) {
      console.error(
        'School Admin loading error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load School Admin Panel.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchool();
  }, []);

  // ------------------------------------------
  // ACTIVE / PENDING STAFF
  // ------------------------------------------

  const schoolAdmins = memberships.filter(
    (item) =>
      item.role === 'school_admin' &&
      item.status === 'ACTIVE'
  );

  const teachers = memberships.filter(
    (item) =>
      item.role === 'teacher' &&
      item.status === 'ACTIVE'
  );

  const pendingTeachers = memberships.filter(
    (item) =>
      item.role === 'teacher' &&
      item.status === 'PENDING'
  );

  const pendingAdmins = memberships.filter(
    (item) =>
      item.role === 'school_admin' &&
      item.status === 'PENDING'
  );

  // ------------------------------------------
  // ACTIVATE MEMBERSHIP
  // ------------------------------------------

  const activateMembership = async (
    membership: SchoolMembership
  ) => {
    try {
      await updateSchoolMembership(
        membership.id,
        {
          status: 'ACTIVE',
        }
      );

      await loadSchool();

    } catch (err) {
      console.error(err);

      alert(
        err instanceof Error
          ? err.message
          : 'Unable to update membership.'
      );
    }
  };

  // ------------------------------------------
  // REVOKE MEMBERSHIP
  // ------------------------------------------

  const revokeMembership = async (
    membership: SchoolMembership
  ) => {
    const ok = window.confirm(
      `Are you sure you want to revoke access for ${
        membership.invitedByEmail ||
        membership.uid
      }?`
    );

    if (!ok) return;

    try {
      await updateSchoolMembership(
        membership.id,
        {
          status: 'REVOKED',
        }
      );

      await loadSchool();

    } catch (err) {
      console.error(err);

      alert(
        err instanceof Error
          ? err.message
          : 'Unable to revoke membership.'
      );
    }
  };

  // ------------------------------------------
  // LOADING
  // ------------------------------------------

  if (loading) {
    return (
      <div style={styles.fullPage}>
        <div style={styles.loadingCard}>
          <div style={styles.spinner}>⏳</div>

          <h2>
            Loading School Admin Panel...
          </h2>

          <p>
            Finding your school...
          </p>
        </div>
      </div>
    );
  }

  // ------------------------------------------
  // ERROR
  // ------------------------------------------

  if (error || !school || !schoolId) {
    return (
      <div style={styles.fullPage}>
        <div style={styles.errorCard}>

          <div style={styles.errorIcon}>
            ⚠️
          </div>

          <h2>
            Unable to open School Admin Panel
          </h2>

          <p>
            {error || 'School not found.'}
          </p>

          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: 20,
            }}
          >
            <button
              style={styles.primaryButton}
              onClick={() => loadSchool()}
            >
              🔄 Try Again
            </button>

            <button
              style={styles.secondaryButton}
              onClick={() => navigate('/')}
            >
              🏠 Home
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>

      {/* =========================================
          HEADER
      ========================================== */}

      <header style={styles.header}>

        <div style={styles.headerLeft}>

          <div style={styles.logoBox}>
            {school.logoUrl ? (
              <img
                src={school.logoUrl}
                alt={school.name}
                style={styles.logo}
              />
            ) : (
              <span style={styles.logoText}>
                🏫
              </span>
            )}
          </div>

          <div style={{ minWidth: 0 }}>

            <h1 style={styles.schoolTitle}>
              {school.name}
            </h1>

            <div style={styles.schoolMeta}>

              <span>
                School Admin Panel
              </span>

              <span style={styles.statusBadge}>
                {school.status}
              </span>

            </div>

          </div>

        </div>

        <button
          style={styles.logoutButton}
          onClick={() => navigate('/')}
        >
          🏠 Home
        </button>

      </header>

      {/* =========================================
          MAIN LAYOUT
      ========================================== */}

      <div style={styles.layout}>

        {/* =======================================
            SIDEBAR
        ======================================== */}

        <aside style={styles.sidebar}>

          <button
            style={
              activeSection === 'dashboard'
                ? styles.activeMenu
                : styles.menuButton
            }
            onClick={() =>
              setActiveSection('dashboard')
            }
          >
            📊 Dashboard
          </button>

          <button
            style={
              activeSection === 'school'
                ? styles.activeMenu
                : styles.menuButton
            }
            onClick={() =>
              setActiveSection('school')
            }
          >
            🏫 School Information
          </button>

          <button
            style={
              activeSection === 'classes'
                ? styles.activeMenu
                : styles.menuButton
            }
            onClick={() =>
              setActiveSection('classes')
            }
          >
            📚 Classes 1–12
          </button>

          <button
            style={
              activeSection === 'students'
                ? styles.activeMenu
                : styles.menuButton
            }
            onClick={() =>
              setActiveSection('students')
            }
          >
            👨‍🎓 Students
          </button>

          <button
            style={
              activeSection === 'teachers'
                ? styles.activeMenu
                : styles.menuButton
            }
            onClick={() =>
              setActiveSection('teachers')
            }
          >
            👨‍🏫 Teachers
          </button>

          <button
            style={
              activeSection === 'homework'
                ? styles.activeMenu
                : styles.menuButton
            }
            onClick={() =>
              setActiveSection('homework')
            }
          >
            📝 Homework
          </button>

          <button
            style={
              activeSection === 'results'
                ? styles.activeMenu
                : styles.menuButton
            }
            onClick={() =>
              setActiveSection('results')
            }
          >
            📊 Results
          </button>

          <button
            style={
              activeSection === 'attendance'
                ? styles.activeMenu
                : styles.menuButton
            }
            onClick={() =>
              setActiveSection('attendance')
            }
          >
            📅 Attendance
          </button>

          <button
            style={
              activeSection === 'notices'
                ? styles.activeMenu
                : styles.menuButton
            }
            onClick={() =>
              setActiveSection('notices')
            }
          >
            📢 Notices
          </button>

          <button
            style={
              activeSection === 'events'
                ? styles.activeMenu
                : styles.menuButton
            }
            onClick={() =>
              setActiveSection('events')
            }
          >
            🎉 Events
          </button>

          <button
            style={
              activeSection === 'gallery'
                ? styles.activeMenu
                : styles.menuButton
            }
            onClick={() =>
              setActiveSection('gallery')
            }
          >
            🖼️ Gallery
          </button>

          <button
            style={
              activeSection === 'documents'
                ? styles.activeMenu
                : styles.menuButton
            }
            onClick={() =>
              setActiveSection('documents')
            }
          >
            📄 Documents
          </button>

          <button
            style={
              activeSection === 'members'
                ? styles.activeMenu
                : styles.menuButton
            }
            onClick={() =>
              setActiveSection('members')
            }
          >
            🔐 Staff Access
          </button>

          <button
            style={
              activeSection === 'subscription'
                ? styles.activeMenu
                : styles.menuButton
            }
            onClick={() =>
              setActiveSection('subscription')
            }
          >
            💳 Subscription
          </button>

        </aside>

        {/* =======================================
            CONTENT
        ======================================== */}

        <main style={styles.content}>

          {/* =====================================
              DASHBOARD
          ====================================== */}

          {activeSection === 'dashboard' && (
            <>
              <h2 style={styles.pageHeading}>
                📊 School Dashboard
              </h2>

              <p style={styles.description}>
                Manage your school's information,
                teachers, classes and other school
                services from this panel.
              </p>

              <div style={styles.cardGrid}>

                <StatCard
                  icon="🏫"
                  title="School Status"
                  value={school.status}
                />

                <StatCard
                  icon="👨‍🏫"
                  title="Active Teachers"
                  value={String(
                    teachers.length
                  )}
                />

                <StatCard
                  icon="👨‍💼"
                  title="School Admins"
                  value={String(
                    schoolAdmins.length
                  )}
                />

                <StatCard
                  icon="⏳"
                  title="Pending Staff"
                  value={String(
                    pendingTeachers.length +
                    pendingAdmins.length
                  )}
                />

              </div>

              <div style={styles.infoCard}>

                <h3>
                  🏫 School Information
                </h3>

                <InfoRow
                  label="School Name"
                  value={school.name}
                />

                <InfoRow
                  label="School ID"
                  value={schoolId}
                />

                <InfoRow
                  label="School URL Slug"
                  value={school.slug}
                />

                <InfoRow
                  label="Owner Email"
                  value={school.ownerEmail}
                />

                <InfoRow
                  label="Address"
                  value={
                    school.address ||
                    'Not added'
                  }
                />

                <InfoRow
                  label="Phone"
                  value={
                    school.phone ||
                    'Not added'
                  }
                />

                <InfoRow
                  label="Email"
                  value={
                    school.email ||
                    'Not added'
                  }
                />

              </div>
            </>
          )}

          {/* =====================================
              SCHOOL
          ====================================== */}

          {activeSection === 'school' && (
            <SectionPlaceholder
              icon="🏫"
              title="School Information"
              text="School profile editing will be connected to the multi-school Firestore content system."
            />
          )}

          {/* =====================================
              CLASSES
          ====================================== */}

          {activeSection === 'classes' && (
            <SectionPlaceholder
              icon="📚"
              title="Classes 1–12"
              text="Classes 1–12 management will be connected to the SchoolClass Firestore collection."
            />
          )}

          {/* =====================================
              STUDENTS
          ====================================== */}

          {activeSection === 'students' && (
            <SectionPlaceholder
              icon="👨‍🎓"
              title="Students"
              text="Student management will be connected to the students collection."
            />
          )}

          {/* =====================================
              TEACHERS
          ====================================== */}

          {activeSection === 'teachers' && (
            <>
              <h2 style={styles.pageHeading}>
                👨‍🏫 Teachers
              </h2>

              <p style={styles.description}>
                Active teachers and their assigned
                school access are shown here.
              </p>

              <div style={styles.infoCard}>

                {teachers.length === 0 ? (
                  <EmptyState
                    text="No active teachers found."
                  />
                ) : (
                  teachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      style={styles.memberRow}
                    >

                      <div>
                        <strong>
                          {teacher.invitedByEmail ||
                            teacher.uid}
                        </strong>

                        <div style={styles.smallText}>
                          Role: Teacher
                        </div>

                        <div style={styles.smallText}>
                          Assigned Classes:{' '}
                          {teacher.assignments.length
                            ? teacher.assignments.join(', ')
                            : 'None'}
                        </div>
                      </div>

                      <button
                        style={styles.dangerButton}
                        onClick={() =>
                          revokeMembership(
                            teacher
                          )
                        }
                      >
                        Revoke
                      </button>

                    </div>
                  ))
                )}

              </div>

              {pendingTeachers.length > 0 && (
                <div style={styles.infoCard}>

                  <h3>
                    ⏳ Pending Teacher Access
                  </h3>

                  {pendingTeachers.map(
                    (teacher) => (
                      <div
                        key={teacher.id}
                        style={styles.memberRow}
                      >

                        <div>
                          <strong>
                            {teacher.invitedByEmail ||
                              teacher.uid}
                          </strong>

                          <div
                            style={styles.smallText}
                          >
                            Waiting for activation
                          </div>
                        </div>

                        <button
                          style={
                            styles.successButton
                          }
                          onClick={() =>
                            activateMembership(
                              teacher
                            )
                          }
                        >
                          Activate
                        </button>

                      </div>
                    )
                  )}

                </div>
              )}

            </>
          )}

          {/* =====================================
              HOMEWORK
          ====================================== */}

          {activeSection === 'homework' && (
            <SectionPlaceholder
              icon="📝"
              title="Homework"
              text="Homework management will be connected to the homework collection."
            />
          )}

          {/* =====================================
              RESULTS
          ====================================== */}

          {activeSection === 'results' && (
            <SectionPlaceholder
              icon="📊"
              title="Results"
              text="Student results, marksheets and examinations will be connected to the results system."
            />
          )}

          {/* =====================================
              ATTENDANCE
          ====================================== */}

          {activeSection === 'attendance' && (
            <SectionPlaceholder
              icon="📅"
              title="Attendance"
              text="Daily student attendance will be connected to the attendance collection."
            />
          )}

          {/* =====================================
              NOTICES
          ====================================== */}

          {activeSection === 'notices' && (
            <SectionPlaceholder
              icon="📢"
              title="Notices"
              text="School notices will be connected to the schoolContent/notice system."
            />
          )}

          {/* =====================================
              EVENTS
          ====================================== */}

          {activeSection === 'events' && (
            <SectionPlaceholder
              icon="🎉"
              title="Events"
              text="School events will be connected to the school event system."
            />
          )}

          {/* =====================================
              GALLERY
          ====================================== */}

          {activeSection === 'gallery' && (
            <SectionPlaceholder
              icon="🖼️"
              title="Gallery"
              text="School gallery management will be connected to the gallery collection."
            />
          )}

          {/* =====================================
              DOCUMENTS
          ====================================== */}

          {activeSection === 'documents' && (
            <SectionPlaceholder
              icon="📄"
              title="Documents"
              text="School documents will be connected to the documents collection."
            />
          )}

          {/* =====================================
              STAFF ACCESS
          ====================================== */}

          {activeSection === 'members' && (
            <>
              <h2 style={styles.pageHeading}>
                🔐 Staff Access
              </h2>

              <p style={styles.description}>
                Manage school administrator and
                teacher memberships.
              </p>

              <div style={styles.infoCard}>

                <h3>
                  👨‍💼 School Administrators
                </h3>

                {schoolAdmins.length === 0 ? (
                  <EmptyState
                    text="No active school administrators."
                  />
                ) : (
                  schoolAdmins.map((member) => (
                    <MemberRow
                      key={member.id}
                      member={member}
                      onRevoke={() =>
                        revokeMembership(member)
                      }
                    />
                  ))
                )}

              </div>

              <div style={styles.infoCard}>

                <h3>
                  👨‍🏫 Active Teachers
                </h3>

                {teachers.length === 0 ? (
                  <EmptyState
                    text="No active teachers."
                  />
                ) : (
                  teachers.map((member) => (
                    <MemberRow
                      key={member.id}
                      member={member}
                      onRevoke={() =>
                        revokeMembership(member)
                      }
                    />
                  ))
                )}

              </div>

              {pendingAdmins.length > 0 && (
                <div style={styles.infoCard}>

                  <h3>
                    ⏳ Pending Administrators
                  </h3>

                  {pendingAdmins.map(
                    (member) => (
                      <div
                        key={member.id}
                        style={styles.memberRow}
                      >

                        <div>
                          <strong>
                            {member.invitedByEmail ||
                              member.uid}
                          </strong>
                        </div>

                        <button
                          style={
                            styles.successButton
                          }
                          onClick={() =>
                            activateMembership(
                              member
                            )
                          }
                        >
                          Activate
                        </button>

                      </div>
                    )
                  )}

                </div>
              )}

            </>
          )}

          {/* =====================================
              SUBSCRIPTION
          ====================================== */}

          {activeSection === 'subscription' && (
            <SectionPlaceholder
              icon="💳"
              title="Subscription & Wallet"
              text="Subscription and wallet information will be connected to the billing system."
            />
          )}

        </main>

      </div>

    </div>
  );
}


/* =========================================================
   SMALL COMPONENTS
========================================================= */

function StatCard({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: string;
}) {
  return (
    <div style={styles.statCard}>

      <div style={styles.statIcon}>
        {icon}
      </div>

      <div>

        <div style={styles.statTitle}>
          {title}
        </div>

        <div style={styles.statValue}>
          {value}
        </div>

      </div>

    </div>
  );
}


function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={styles.infoRow}>

      <span style={styles.infoLabel}>
        {label}
      </span>

      <span style={styles.infoValue}>
        {value}
      </span>

    </div>
  );
}


function MemberRow({
  member,
  onRevoke,
}: {
  member: SchoolMembership;
  onRevoke: () => void;
}) {
  return (
    <div style={styles.memberRow}>

      <div>

        <strong>
          {member.invitedByEmail ||
            member.uid}
        </strong>

        <div style={styles.smallText}>
          Role: {member.role}
        </div>

        {member.role === 'teacher' && (
          <div style={styles.smallText}>
            Classes:{' '}
            {member.assignments.length
              ? member.assignments.join(', ')
              : 'None'}
          </div>
        )}

      </div>

      <button
        style={styles.dangerButton}
        onClick={onRevoke}
      >
        Revoke
      </button>

    </div>
  );
}


function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div style={styles.empty}>
      {text}
    </div>
  );
}


function SectionPlaceholder({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <>
      <h2 style={styles.pageHeading}>
        {icon} {title}
      </h2>

      <div style={styles.placeholderCard}>

        <div style={styles.placeholderIcon}>
          {icon}
        </div>

        <h3>{title}</h3>

        <p>{text}</p>

        <div style={styles.comingSoon}>
          Module Setup — Next Step
        </div>

      </div>
    </>
  );
}


/* =========================================================
   STYLES
========================================================= */

const styles: Record<
  string,
  React.CSSProperties
> = {

  page: {
    minHeight: '100vh',
    background:
      'linear-gradient(135deg, #eef2ff, #f8fafc)',
    color: '#172033',
  },

  fullPage: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      'linear-gradient(135deg, #e0f2fe, #f8fafc)',
    padding: 20,
  },

  loadingCard: {
    width: '100%',
    maxWidth: 450,
    background: '#fff',
    borderRadius: 24,
    padding: 40,
    textAlign: 'center',
    boxShadow:
      '0 15px 35px rgba(0,0,0,0.15)',
  },

  errorCard: {
    width: '100%',
    maxWidth: 500,
    background: '#fff',
    borderRadius: 24,
    padding: 40,
    textAlign: 'center',
    boxShadow:
      '0 15px 35px rgba(0,0,0,0.15)',
  },

  spinner: {
    fontSize: 45,
  },

  errorIcon: {
    fontSize: 50,
  },

  header: {
    minHeight: 80,
    padding: '14px 22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
    background:
      'linear-gradient(90deg, #4f46e5, #7c3aed, #db2777)',
    color: '#fff',
    boxShadow:
      '0 5px 18px rgba(0,0,0,0.2)',
  },

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    minWidth: 0,
  },

  logoBox: {
    width: 55,
    height: 55,
    borderRadius: 16,
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow:
      '0 5px 0 rgba(0,0,0,0.2)',
    flexShrink: 0,
    overflow: 'hidden',
  },

  logo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  logoText: {
    fontSize: 30,
  },

  schoolTitle: {
    margin: 0,
    fontSize: 22,
    lineHeight: 1.2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  schoolMeta: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    marginTop: 5,
    fontSize: 12,
    opacity: 0.95,
    flexWrap: 'wrap',
  },

  statusBadge: {
    padding: '3px 8px',
    borderRadius: 20,
    background: '#fff',
    color: '#4f46e5',
    fontWeight: 800,
  },

  logoutButton: {
    border: 'none',
    borderRadius: 12,
    padding: '12px 18px',
    background: '#fff',
    color: '#4f46e5',
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow:
      '0 5px 0 rgba(0,0,0,0.2)',
    flexShrink: 0,
  },

  secondaryButton: {
    border: 'none',
    borderRadius: 12,
    padding: '12px 20px',
    background: '#64748b',
    color: '#fff',
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow:
      '0 5px 0 #334155',
  },

  layout: {
    display: 'flex',
    minHeight:
      'calc(100vh - 83px)',
  },

  sidebar: {
    width: 250,
    padding: 16,
    background: '#111827',
    display: 'flex',
    flexDirection: 'column',
    gap: 9,
    flexShrink: 0,
    overflowY: 'auto',
  },

  menuButton: {
    width: '100%',
    textAlign: 'left',
    border: 'none',
    borderRadius: 12,
    padding: '12px 14px',
    background: '#1f2937',
    color: '#e5e7eb',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow:
      '0 4px 0 #080d16',
  },

  activeMenu: {
    width: '100%',
    textAlign: 'left',
    border: 'none',
    borderRadius: 12,
    padding: '12px 14px',
    background:
      'linear-gradient(90deg, #06b6d4, #3b82f6)',
    color: '#fff',
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow:
      '0 4px 0 #1e3a8a',
  },

  content: {
    flex: 1,
    padding: 28,
    minWidth: 0,
  },

  pageHeading: {
    marginTop: 0,
    marginBottom: 8,
    fontSize: 28,
  },

  description: {
    color: '#64748b',
    marginTop: 0,
    marginBottom: 24,
  },

  cardGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(190px, 1fr))',
    gap: 18,
    marginBottom: 24,
  },

  statCard: {
    background: '#fff',
    borderRadius: 20,
    padding: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 15,
    boxShadow:
      '0 8px 0 #cbd5e1, 0 12px 25px rgba(0,0,0,0.08)',
  },

  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#eef2ff',
    fontSize: 25,
  },

  statTitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: 700,
  },

  statValue: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: 900,
  },

  infoCard: {
    background: '#fff',
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
    boxShadow:
      '0 7px 0 #dbeafe, 0 12px 25px rgba(0,0,0,0.07)',
  },

  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 20,
    padding: '13px 0',
    borderBottom:
      '1px solid #e5e7eb',
    flexWrap: 'wrap',
  },

  infoLabel: {
    color: '#64748b',
    fontWeight: 700,
  },

  infoValue: {
    fontWeight: 700,
    textAlign: 'right',
    wordBreak: 'break-word',
  },

  memberRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
    padding: 15,
    marginTop: 10,
    borderRadius: 14,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
  },

  smallText: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 13,
  },

  primaryButton: {
    border: 'none',
    borderRadius: 12,
    padding: '12px 20px',
    background:
      'linear-gradient(90deg, #2563eb, #7c3aed)',
    color: '#fff',
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow:
      '0 5px 0 #1e3a8a',
  },

  successButton: {
    border: 'none',
    borderRadius: 10,
    padding: '10px 15px',
    background:
      'linear-gradient(90deg, #10b981, #059669)',
    color: '#fff',
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow:
      '0 4px 0 #047857',
  },

  dangerButton: {
    border: 'none',
    borderRadius: 10,
    padding: '10px 15px',
    background:
      'linear-gradient(90deg, #ef4444, #dc2626)',
    color: '#fff',
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow:
      '0 4px 0 #991b1b',
    flexShrink: 0,
  },

  empty: {
    padding: 25,
    textAlign: 'center',
    color: '#64748b',
    background: '#f8fafc',
    borderRadius: 12,
  },

  placeholderCard: {
    maxWidth: 700,
    margin: '30px auto',
    background: '#fff',
    borderRadius: 24,
    padding: 40,
    textAlign: 'center',
    boxShadow:
      '0 8px 0 #dbeafe, 0 15px 30px rgba(0,0,0,0.08)',
  },

  placeholderIcon: {
    fontSize: 60,
  },

  comingSoon: {
    display: 'inline-block',
    marginTop: 15,
    padding: '10px 18px',
    borderRadius: 20,
    background: '#eef2ff',
    color: '#4f46e5',
    fontWeight: 800,
  },
};
```
