import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  fetchSchoolById,
  fetchMyMembership,
  fetchMyMemberships,
  fetchSchoolMemberships,
  updateSchoolMembership,
  saveSchoolInfo,

  fetchStudents,
  addStudent,
  updateStudent,
  deleteStudent,

  fetchClasses,
  addClass,
  updateClass,
  deleteClass,

  fetchResults,
  addResult,
  updateResult,
  deleteResult,

  fetchHomework,
  addHomework,
  updateHomework,
  deleteHomework,

  fetchAttendance,
  addAttendance,
  updateAttendance,
  deleteAttendance,

  fetchAnnouncements,
  addAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,

  fetchEvents,
  subscribeToSchool,
  subscribeToSchoolCollection,
  subscribeToSchoolMemberships,
  subscribeToTeachers,
  addEvent,
  updateEvent,
  deleteEvent,

  fetchGallery,
  addGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,

  fetchDocuments,
  addDocument,
  updateDocument,
  deleteDocument,

  fetchTeachers,
  addTeacher,
  updateTeacher,
  deleteTeacher,
  createTeacherInvite,
} from '@/firebase/firestore';

import type {
  School,
  SchoolMembership,
} from '@/firebase/types';

import type { CSSProperties } from 'react';

import { fetchSchoolRechargeHistory, subscribeToSchoolRechargeHistory } from '@/firebase/payment';


type AnyRecord = {
  id?: string;
  [key: string]: any;
};

const PLATFORM_ADMIN_WHATSAPP = '919112170192';

function getRemainingSubscriptionDays(school: School): number | null {
  if (!school.subscriptionExpiryDate) return null;
  const expiry = new Date(school.subscriptionExpiryDate).getTime();
  if (!Number.isFinite(expiry)) return null;
  return Math.ceil((expiry - Date.now()) / (24 * 60 * 60 * 1000));
}

function getSubscriptionReminderText(school: School): string | null {
  const days = getRemainingSubscriptionDays(school);
  if (days === null) return null;
  if (days <= 0) return '🔴 आपकी subscription समाप्त हो चुकी है। कृपया तुरंत recharge करें।';
  if (days <= 3) return '🚨 आपकी subscription ' + days + ' दिन में समाप्त होने वाली है। आज ही recharge करें।';
  if (days <= 7) return '⚠️ आपकी subscription ' + days + ' दिन में समाप्त होने वाली है। समय पर recharge करें।';
  return null;
}

function openPlatformAdminWhatsApp(school: School) {
  const days = getRemainingSubscriptionDays(school);
  const expiry = school.subscriptionExpiryDate ? new Date(school.subscriptionExpiryDate).toLocaleDateString('en-IN') : 'Not available';
  const totalAmount = Number(school.totalRechargeAmount ?? school.paymentAmount ?? 0);
  const totalDays = Number(school.totalRechargeDays ?? school.subscriptionDays ?? 0);
  const message = [
    'नमस्कार Platform Admin,',
    '',
    '🏫 School: ' + school.name,
    '📧 Owner: ' + school.ownerEmail,
    '⏳ Remaining: ' + (days === null ? 'N/A' : Math.max(days, 0) + ' days'),
    '📅 Expiry: ' + expiry,
    '💰 Total Recharge: ₹' + totalAmount,
    '📦 Total Recharge Days: ' + totalDays,
    '',
    'कृपया recharge/payment के लिए सहायता करें।'
  ].join('\n');
  window.open('https://wa.me/' + PLATFORM_ADMIN_WHATSAPP + '?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer');
}

export default function SchoolAdminPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [schoolId, setSchoolId] =
    useState<string | null>(null);

  const [myMemberships, setMyMemberships] =
    useState<SchoolMembership[]>([]);

  const [mySchoolOptions, setMySchoolOptions] =
    useState<Array<{ id: string; name: string }>>([]);

  const [school, setSchool] =
    useState<School | null>(null);

  const [memberships, setMemberships] =
    useState<SchoolMembership[]>([]);

  const [teacherRecords, setTeacherRecords] =
    useState<AnyRecord[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [activeSection, setActiveSection] =
    useState('dashboard');

  const [sectionLoading, setSectionLoading] =
    useState(false);

  const [items, setItems] =
    useState<AnyRecord[]>([]);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<AnyRecord>({});

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');


  /* =========================================================
     LOAD SCHOOL
  ========================================================= */

  const loadSchool = async (preferredSchoolId?: string) => {
    try {
      setLoading(true);
      setError('');

      const allMemberships =
        await fetchMyMemberships();

      const activeAdminMemberships =
        allMemberships.filter(
          (membership) =>
            membership.role === 'school_admin' &&
            membership.status === 'ACTIVE'
        );

      setMyMemberships(
        activeAdminMemberships
      );

      const schoolOptions = (
        await Promise.all(
          activeAdminMemberships.map(
            async (membership) => {
              const data =
                await fetchSchoolById(
                  membership.schoolId
                );

              return {
                id: membership.schoolId,
                name:
                  data?.name ||
                  membership.schoolId,
              };
            }
          )
        )
      );

      setMySchoolOptions(
        schoolOptions
      );

      const requestedSchoolId =
        preferredSchoolId ||
        searchParams.get('schoolId') ||
        '';

      const myMembership =
        await fetchMyMembership(
          requestedSchoolId || undefined
        );

      if (!myMembership) {
        setError(
          'Your school membership was not found. Please contact the platform administrator.'
        );
        return;
      }

      if (
        myMembership.role !==
        'school_admin'
      ) {
        setError(
          'You do not have School Admin access.'
        );
        return;
      }

      if (
        myMembership.status !==
        'ACTIVE'
      ) {
        setError(
          'Your School Admin access is ' +
            myMembership.status +
            '.'
        );
        return;
      }

      const currentSchoolId =
        myMembership.schoolId;

      if (!currentSchoolId) {
        setError(
          'Your school is not assigned to this account.'
        );
        return;
      }

      setSchoolId(currentSchoolId);

      if (
        searchParams.get('schoolId') !==
        currentSchoolId
      ) {
        setSearchParams(
          { schoolId: currentSchoolId },
          { replace: true }
        );
      }

      const schoolData =
        await fetchSchoolById(
          currentSchoolId
        );

      if (!schoolData) {
        setError(
          'Your school could not be found.'
        );
        return;
      }

      setSchool(schoolData);

      const membershipData =
        await fetchSchoolMemberships(
          currentSchoolId
        );

      setMemberships(
        membershipData
      );

      const teacherData = await fetchTeachers(
        currentSchoolId
      );

      setTeacherRecords(
        teacherData as AnyRecord[]
      );

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
    void loadSchool();
  }, []);

  /* =========================================================
     REALTIME SCHOOL ADMIN SYNC
  ========================================================= */
  useEffect(() => {
    if (!schoolId) return;

    const handleError = (error: Error) => {
      console.error('School Admin realtime listener error:', error);
    };

    const unsubSchool = subscribeToSchool(schoolId, (data) => {
      if (data) setSchool(data);
    }, handleError);

    const unsubMembers = subscribeToSchoolMemberships(schoolId, (data) => {
      setMemberships(data);
    }, handleError);

    const unsubTeachers = subscribeToTeachers(schoolId, (data) => {
      setTeacherRecords(data as AnyRecord[]);
    }, handleError);

    return () => {
      unsubSchool();
      unsubMembers();
      unsubTeachers();
    };
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId) return;

    const collectionMap: Record<string, string> = {
      students: 'students',
      classes: 'classes',
      results: 'results',
      homework: 'homework',
      attendance: 'attendance',
      notices: 'announcements',
      events: 'events',
      gallery: 'gallery',
      documents: 'documents',
    };

    const collectionName = collectionMap[activeSection];
    if (!collectionName) return;

    const unsubscribe = subscribeToSchoolCollection(
      schoolId,
      collectionName,
      (data) => setItems(data),
      (error) => console.error('Realtime section listener error:', error)
    );

    return unsubscribe;
  }, [schoolId, activeSection]);


  /* =========================================================
     LOAD SECTION DATA
  ========================================================= */

  const loadSection = async (
    section: string
  ) => {
    if (!schoolId) return;

    try {
      setSectionLoading(true);
      setMessage('');
      setItems([]);

      if (section === 'students') {
        setItems(
          await fetchStudents(
            schoolId
          )
        );
      }

      if (section === 'classes') {
        setItems(
          await fetchClasses(
            schoolId
          )
        );
      }

      if (section === 'results') {
        setItems(
          await fetchResults(
            schoolId
          )
        );
      }

      if (section === 'homework') {
        setItems(
          await fetchHomework(
            schoolId
          )
        );
      }

      if (section === 'attendance') {
        setItems(
          await fetchAttendance(
            schoolId
          )
        );
      }

      if (section === 'notices') {
        setItems(
          await fetchAnnouncements(
            schoolId
          )
        );
      }

      if (section === 'events') {
        setItems(
          await fetchEvents(
            schoolId
          )
        );
      }

      if (section === 'gallery') {
        setItems(
          await fetchGallery(
            schoolId
          )
        );
      }

      if (section === 'documents') {
        setItems(
          await fetchDocuments(
            schoolId
          )
        );
      }

    } catch (err) {
      console.error(err);

      setMessage(
        err instanceof Error
          ? err.message
          : 'Unable to load data.'
      );
    } finally {
      setSectionLoading(false);
    }
  };


  useEffect(() => {
    if (
      schoolId &&
      activeSection !== 'dashboard' &&
      activeSection !== 'school' &&
      activeSection !== 'teachers' &&
      activeSection !== 'members' &&
      activeSection !== 'subscription'
    ) {
      loadSection(
        activeSection
      );
    }
  }, [
    activeSection,
    schoolId,
  ]);


  /* =========================================================
     MENU CHANGE
  ========================================================= */

  const changeSection = (
    section: string
  ) => {
    setActiveSection(section);
    setEditingId(null);
    setForm({});
    setMessage('');
  };


  /* =========================================================
     STAFF
  ========================================================= */

  const schoolAdmins =
    memberships.filter(
      (item) =>
        item.role ===
          'school_admin' &&
        item.status ===
          'ACTIVE'
    );

  const teachers =
    memberships.filter(
      (item) =>
        item.role === 'teacher' &&
        item.status === 'ACTIVE'
    );

  const pendingTeachers =
    memberships.filter(
      (item) =>
        item.role === 'teacher' &&
        item.status === 'PENDING'
    );

  const pendingAdmins =
    memberships.filter(
      (item) =>
        item.role ===
          'school_admin' &&
        item.status === 'PENDING'
    );


  const activateMembership =
    async (
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
        alert(
          err instanceof Error
            ? err.message
            : 'Unable to update membership.'
        );
      }
    };


  const revokeMembership =
    async (
      membership: SchoolMembership
    ) => {
      const ok =
        window.confirm(
          'Are you sure you want to revoke access for ' +
            (membership.invitedByEmail ||
              membership.uid) +
            '?'
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
        alert(
          err instanceof Error
            ? err.message
            : 'Unable to revoke membership.'
        );
      }
    };


  /* =========================================================
     SAVE CURRENT MODULE
  ========================================================= */

  const saveItem = async () => {
    if (!schoolId) return;

    try {
      setSaving(true);
      setMessage('');

      let savedId =
        editingId;

      if (activeSection === 'students') {
        if (editingId) {
          await updateStudent(
            schoolId,
            editingId,
            form
          );
        } else {
          savedId =
            await addStudent(
              schoolId,
              form
            );
        }
      }

      if (activeSection === 'classes') {
        if (editingId) {
          await updateClass(
            schoolId,
            editingId,
            form
          );
        } else {
          savedId =
            await addClass(
              schoolId,
              form
            );
        }
      }

      if (activeSection === 'results') {
        if (editingId) {
          await updateResult(
            schoolId,
            editingId,
            form
          );
        } else {
          savedId =
            await addResult(
              schoolId,
              form
            );
        }
      }

      if (activeSection === 'homework') {
        if (editingId) {
          await updateHomework(
            schoolId,
            editingId,
            form
          );
        } else {
          savedId =
            await addHomework(
              schoolId,
              form
            );
        }
      }

      if (activeSection === 'attendance') {
        if (editingId) {
          await updateAttendance(
            schoolId,
            editingId,
            form
          );
        } else {
          savedId =
            await addAttendance(
              schoolId,
              form
            );
        }
      }

      if (activeSection === 'notices') {
        const noticeData = {
          ...form,
          schoolId,
        };

        if (editingId) {
          await updateAnnouncement(
            editingId,
            noticeData
          );
        } else {
          savedId =
            await addAnnouncement(
              noticeData
            );
        }
      }

      if (activeSection === 'events') {
        const eventData = {
          ...form,
          schoolId,
        };

        if (editingId) {
          await updateEvent(
            editingId,
            eventData
          );
        } else {
          savedId =
            await addEvent(
              eventData
            );
        }
      }

      if (activeSection === 'gallery') {
        if (editingId) {
          await updateGalleryItem(
            schoolId,
            editingId,
            form
          );
        } else {
          savedId =
            await addGalleryItem(
              schoolId,
              form
            );
        }
      }

      if (activeSection === 'documents') {
        if (editingId) {
          await updateDocument(
            schoolId,
            editingId,
            form
          );
        } else {
          savedId =
            await addDocument(
              schoolId,
              form
            );
        }
      }

      console.log(
        'Saved:',
        savedId
      );

      setMessage(
        editingId
          ? '✅ Data updated successfully.'
          : '✅ Data added successfully.'
      );

      setEditingId(null);
      setForm({});

      await loadSection(
        activeSection
      );

    } catch (err) {
      console.error(err);

      setMessage(
        err instanceof Error
          ? err.message
          : 'Unable to save data.'
      );
    } finally {
      setSaving(false);
    }
  };


  /* =========================================================
     DELETE CURRENT MODULE ITEM
  ========================================================= */

  const deleteItem = async (
    id: string
  ) => {
    if (!schoolId) return;

    const ok =
      window.confirm(
        'Are you sure you want to delete this record?'
      );

    if (!ok) return;

    try {
      setSaving(true);

      if (
        activeSection ===
        'students'
      ) {
        await deleteStudent(
          schoolId,
          id
        );
      }

      if (
        activeSection ===
        'classes'
      ) {
        await deleteClass(
          schoolId,
          id
        );
      }

      if (
        activeSection ===
        'results'
      ) {
        await deleteResult(
          schoolId,
          id
        );
      }

      if (
        activeSection ===
        'homework'
      ) {
        await deleteHomework(
          schoolId,
          id
        );
      }

      if (
        activeSection ===
        'attendance'
      ) {
        await deleteAttendance(
          schoolId,
          id
        );
      }

      if (
        activeSection ===
        'notices'
      ) {
        await deleteAnnouncement(
          id
        );
      }

      if (
        activeSection ===
        'events'
      ) {
        await deleteEvent(
          id
        );
      }

      if (
        activeSection ===
        'gallery'
      ) {
        await deleteGalleryItem(
          schoolId,
          id
        );
      }

      if (
        activeSection ===
        'documents'
      ) {
        await deleteDocument(
          schoolId,
          id
        );
      }

      await loadSection(
        activeSection
      );

      setMessage(
        '✅ Record deleted successfully.'
      );

    } catch (err) {
      console.error(err);

      setMessage(
        err instanceof Error
          ? err.message
          : 'Unable to delete record.'
      );
    } finally {
      setSaving(false);
    }
  };


  /* =========================================================
     SCHOOL INFO SAVE
  ========================================================= */

  const saveSchool = async () => {
    if (!school || !schoolId) return;

    try {
      setSaving(true);

      await saveSchoolInfo({
        ...school,
        schoolId,
      });

      const refreshed =
        await fetchSchoolById(
          schoolId
        );

      setSchool(
        refreshed
      );

      setMessage(
        '✅ School information updated.'
      );

    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : 'Unable to save school information.'
      );
    } finally {
      setSaving(false);
    }
  };


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div style={styles.fullPage}>
        <div style={styles.loadingCard}>
          <div style={styles.spinner}>
            ⏳
          </div>

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


  /* =========================================================
     ERROR
  ========================================================= */

  if (
    error ||
    !school ||
    !schoolId
  ) {
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
            {error ||
              'School not found.'}
          </p>

          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent:
                'center',
              flexWrap: 'wrap',
              marginTop: 20,
            }}
          >
            <button
              style={
                styles.primaryButton
              }
              onClick={
                loadSchool
              }
            >
              🔄 Try Again
            </button>

            <button
              style={
                styles.secondaryButton
              }
              onClick={() =>
                navigate('/')
              }
            >
              🏠 Home
            </button>
          </div>

        </div>
      </div>
    );
  }


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div style={styles.page}>

      {/* HEADER */}

      <header style={styles.header}>

        <div
          style={
            styles.headerLeft
          }
        >

          <div
            style={
              styles.logoBox
            }
          >
            {school.logoUrl ? (
              <img
                src={
                  school.logoUrl
                }
                alt={
                  school.name
                }
                style={
                  styles.logo
                }
              />
            ) : (
              <span
                style={
                  styles.logoText
                }
              >
                🏫
              </span>
            )}
          </div>

          <div
            style={{
              minWidth: 0,
            }}
          >
            <h1
              style={
                styles.schoolTitle
              }
            >
              {school.name}
            </h1>

            <div
              style={
                styles.schoolMeta
              }
            >
              <span>
                School Admin Panel
              </span>

              <span
                style={
                  styles.statusBadge
                }
              >
                {school.status}
              </span>
            </div>
          </div>

        </div>

        {myMemberships.length > 1 && (
          <select
            value={schoolId || ''}
            onChange={(event) => {
              void loadSchool(event.target.value);
            }}
            style={{
              maxWidth: 240,
              borderRadius: 12,
              border: '1px solid #cbd5e1',
              padding: '10px 12px',
              fontWeight: 800,
              background: '#fff',
              color: '#0f172a',
            }}
            aria-label="Select school"
          >
            {myMemberships.map((membership) => (
              <option
                key={membership.id}
                value={membership.schoolId}
              >
                {mySchoolOptions.find((schoolOption) => schoolOption.id === membership.schoolId)?.name || membership.schoolId}
              </option>
            ))}
          </select>
        )}

        <button
          style={
            styles.logoutButton
          }
          onClick={() =>
            navigate('/')
          }
        >
          🏠 Home
        </button>

      </header>


      {/* LAYOUT */}

      <div style={styles.layout}>

        {/* SIDEBAR */}

        <aside
          style={
            styles.sidebar
          }
        >

          <MenuButton
            active={
              activeSection ===
              'dashboard'
            }
            onClick={() =>
              changeSection(
                'dashboard'
              )
            }
          >
            📊 Dashboard
          </MenuButton>

          <MenuButton
            active={
              activeSection ===
              'teacher-board'
            }
            onClick={() =>
              changeSection(
                'teacher-board'
              )
            }
          >
            👨‍🏫 My Teacher Board
          </MenuButton>

          <MenuButton
            active={
              activeSection ===
              'school'
            }
            onClick={() =>
              changeSection(
                'school'
              )
            }
          >
            🏫 School Information
          </MenuButton>

          <MenuButton
            active={
              activeSection ===
              'classes'
            }
            onClick={() =>
              changeSection(
                'classes'
              )
            }
          >
            📚 Classes 1–12
          </MenuButton>

          <MenuButton
            active={
              activeSection ===
              'students'
            }
            onClick={() =>
              changeSection(
                'students'
              )
            }
          >
            👨‍🎓 Students
          </MenuButton>

          <MenuButton
            active={
              activeSection ===
              'teachers'
            }
            onClick={() =>
              changeSection(
                'teachers'
              )
            }
          >
            👨‍🏫 Teachers
          </MenuButton>

          <MenuButton
            active={
              activeSection ===
              'homework'
            }
            onClick={() =>
              changeSection(
                'homework'
              )
            }
          >
            📝 Homework
          </MenuButton>

          <MenuButton
            active={
              activeSection ===
              'results'
            }
            onClick={() =>
              changeSection(
                'results'
              )
            }
          >
            📊 Results
          </MenuButton>

          <MenuButton
            active={
              activeSection ===
              'attendance'
            }
            onClick={() =>
              changeSection(
                'attendance'
              )
            }
          >
            📅 Attendance
          </MenuButton>

          <MenuButton
            active={
              activeSection ===
              'notices'
            }
            onClick={() =>
              changeSection(
                'notices'
              )
            }
          >
            📢 Notices
          </MenuButton>

          <MenuButton
            active={
              activeSection ===
              'events'
            }
            onClick={() =>
              changeSection(
                'events'
              )
            }
          >
            🎉 Events
          </MenuButton>

          <MenuButton
            active={
              activeSection ===
              'gallery'
            }
            onClick={() =>
              changeSection(
                'gallery'
              )
            }
          >
            🖼️ Gallery
          </MenuButton>

          <MenuButton
            active={
              activeSection ===
              'documents'
            }
            onClick={() =>
              changeSection(
                'documents'
              )
            }
          >
            📄 Documents
          </MenuButton>

          <MenuButton
            active={
              activeSection ===
              'members'
            }
            onClick={() =>
              changeSection(
                'members'
              )
            }
          >
            🔐 Staff Access
          </MenuButton>

          <MenuButton
            active={
              activeSection ===
              'subscription'
            }
            onClick={() =>
              changeSection(
                'subscription'
              )
            }
          >
            💳 Subscription
          </MenuButton>

        </aside>


        {/* CONTENT */}

        <main
          style={
            styles.content
          }
        >

          {message && (
            <div
              style={
                styles.message
              }
            >
              {message}
            </div>
          )}


          {/* DASHBOARD */}

          {activeSection ===
            'dashboard' && (
            <Dashboard
              school={school}
              schoolId={schoolId}
              teachers={
                teachers
              }
              schoolAdmins={
                schoolAdmins
              }
              pendingTeachers={
                pendingTeachers
              }
              pendingAdmins={
                pendingAdmins
              }
            />
          )}


          {/* MY TEACHER BOARD */}

          {activeSection ===
            'teacher-board' && (
            <TeacherBoardSection
              school={school}
              schoolId={schoolId}
              assignments={myMemberships.find((membership) => membership.schoolId === schoolId)?.assignments || []}
              onOpenSection={changeSection}
            />
          )}

          {/* SCHOOL */}

          {activeSection ===
            'school' && (
            <SchoolInformation
              school={school}
              setSchool={
                setSchool
              }
              onSave={
                saveSchool
              }
              saving={
                saving
              }
            />
          )}


          {/* GENERIC CRUD MODULES */}

          {[
            'classes',
            'students',
            'homework',
            'results',
            'attendance',
            'notices',
            'events',
            'gallery',
            'documents',
          ].includes(
            activeSection
          ) && (
            <CrudModule
              section={
                activeSection
              }
              items={
                items
              }
              form={
                form
              }
              setForm={
                setForm
              }
              editingId={
                editingId
              }
              setEditingId={
                setEditingId
              }
              onSave={
                saveItem
              }
              onDelete={
                deleteItem
              }
              loading={
                sectionLoading ||
                saving
              }
            />
          )}


          {/* TEACHERS */}

          {activeSection ===
            'teachers' && (
            <TeachersSection
              schoolId={schoolId}
              teacherRecords={teacherRecords}
              setTeacherRecords={setTeacherRecords}
              teachers={
                teachers
              }
              pendingTeachers={
                pendingTeachers
              }
              onActivate={
                activateMembership
              }
              onRevoke={
                revokeMembership
              }
            />
          )}


          {/* STAFF */}

          {activeSection ===
            'members' && (
            <StaffSection
              schoolAdmins={
                schoolAdmins
              }
              teachers={
                teachers
              }
              pendingAdmins={
                pendingAdmins
              }
              onActivate={
                activateMembership
              }
              onRevoke={
                revokeMembership
              }
            />
          )}


          {/* SUBSCRIPTION */}

          {activeSection ===
            'subscription' && (
            <SubscriptionSection
              school={school}
              schoolId={schoolId}
            />
          )}

        </main>

      </div>
    </div>
  );
}


/* =========================================================
   MENU BUTTON
========================================================= */

function MenuButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      style={
        active
          ? styles.activeMenu
          : styles.menuButton
      }
      onClick={onClick}
    >
      {children}
    </button>
  );
}


/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({
  school,
  schoolId,
  teachers,
  schoolAdmins,
  pendingTeachers,
  pendingAdmins,
}: {
  school: School;
  schoolId: string;
  teachers: SchoolMembership[];
  schoolAdmins: SchoolMembership[];
  pendingTeachers: SchoolMembership[];
  pendingAdmins: SchoolMembership[];
}) {
  const navigate = useNavigate();

  return (
    <>
      <h2
        style={
          styles.pageHeading
        }
      >
        📊 School Dashboard
      </h2>

      <p
        style={
          styles.description
        }
      >
        Manage your school from this
        dashboard.
      </p>

      {getSubscriptionReminderText(school) && (
        <div
          style={{
            marginBottom: 18,
            borderRadius: 18,
            padding: 18,
            background: '#fff7ed',
            border: '2px solid #fb923c',
            color: '#9a3412',
            fontWeight: 900,
          }}
        >
          <div style={{ fontSize: 18 }}>
            {getSubscriptionReminderText(school)}
          </div>
          <div style={{ marginTop: 8, fontSize: 14 }}>
            Expiry: {school.subscriptionExpiryDate ? new Date(school.subscriptionExpiryDate).toLocaleDateString('en-IN') : 'Not available'}
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              style={styles.primaryButton}
              onClick={() => navigate('/payment/recharge?schoolId=' + encodeURIComponent(schoolId))}
            >
              💳 Recharge Now
            </button>
            <button
              style={styles.secondaryButton}
              onClick={() => openPlatformAdminWhatsApp(school)}
            >
              📲 Admin को Message
            </button>
          </div>
        </div>
      )}

      <div
        style={
          styles.cardGrid
        }
      >

        <StatCard
          icon="🏫"
          title="School Status"
          value={
            school.status
          }
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

      <div
        style={
          styles.infoCard
        }
      >
        <h3>
          🏫 School Information
        </h3>

        <InfoRow
          label="School Name"
          value={
            school.name
          }
        />

        <InfoRow
          label="School ID"
          value={
            schoolId
          }
        />

        <InfoRow
          label="School URL"
          value={
            school.slug
          }
        />

        <InfoRow
          label="Owner Email"
          value={
            school.ownerEmail
          }
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
          label="Subscription"
          value={
            school.subscriptionStatus ||
            'Not available'
          }
        />
      </div>
    </>
  );
}


/* =========================================================
   SCHOOL INFORMATION
========================================================= */

function SchoolInformation({
  school,
  setSchool,
  onSave,
  saving,
}: {
  school: School;
  setSchool: React.Dispatch<
    React.SetStateAction<School | null>
  >;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <>
      <h2
        style={
          styles.pageHeading
        }
      >
        🏫 School Information
      </h2>

      <div
        style={
          styles.formCard
        }
      >

        <Input
          label="School Name"
          value={
            school.name || ''
          }
          onChange={(value) =>
            setSchool({
              ...school,
              name: value,
            })
          }
        />

        <Input
          label="Tagline"
          value={
            school.tagline || ''
          }
          onChange={(value) =>
            setSchool({
              ...school,
              tagline: value,
            })
          }
        />

        <Input
          label="Address"
          value={
            school.address || ''
          }
          onChange={(value) =>
            setSchool({
              ...school,
              address: value,
            })
          }
        />

        <Input
          label="Phone"
          value={
            school.phone || ''
          }
          onChange={(value) =>
            setSchool({
              ...school,
              phone: value,
            })
          }
        />

        <Input
          label="Logo URL"
          value={
            school.logoUrl || ''
          }
          onChange={(value) =>
            setSchool({
              ...school,
              logoUrl: value,
            })
          }
        />

        <Input
          label="Description"
          textarea
          value={
            school.description ||
            ''
          }
          onChange={(value) =>
            setSchool({
              ...school,
              description: value,
            })
          }
        />

        <button
          style={
            styles.primaryButton
          }
          onClick={onSave}
          disabled={saving}
        >
          {saving
            ? 'Saving...'
            : '💾 Save School Information'}
        </button>

      </div>
    </>
  );
}


/* =========================================================
   CRUD MODULE
========================================================= */

function CrudModule({
  section,
  items,
  form,
  setForm,
  editingId,
  setEditingId,
  onSave,
  onDelete,
  loading,
}: {
  section: string;
  items: AnyRecord[];
  form: AnyRecord;
  setForm: React.Dispatch<
    React.SetStateAction<AnyRecord>
  >;
  editingId: string | null;
  setEditingId: (
    value: string | null
  ) => void;
  onSave: () => void;
  onDelete: (
    id: string
  ) => void;
  loading: boolean;
}) {
  const config =
    moduleConfig[section];

  if (!config) {
    return null;
  }

  const field = (
    key: string
  ) =>
    form[key] ?? '';

  const setField = (
    key: string,
    value: any
  ) => {
    setForm((old) => ({
      ...old,
      [key]: value,
    }));
  };

  return (
    <>
      <h2
        style={
          styles.pageHeading
        }
      >
        {config.icon}{' '}
        {config.title}
      </h2>

      <div
        style={
          styles.formCard
        }
      >

        <h3>
          {editingId
            ? '✏️ Edit Record'
            : '➕ Add New Record'}
        </h3>

        {config.fields.map(
          (fieldConfig) => (
            <Input
              key={
                fieldConfig.key
              }
              label={
                fieldConfig.label
              }
              type={
                fieldConfig.type ||
                'text'
              }
              textarea={
                fieldConfig.type ===
                'textarea'
              }
              value={field(
                fieldConfig.key
              )}
              onChange={(value) =>
                setField(
                  fieldConfig.key,
                  value
                )
              }
              options={
                fieldConfig.options
              }
            />
          )
        )}

        <div
          style={
            styles.formButtons
          }
        >
          <button
            style={
              styles.primaryButton
            }
            onClick={
              onSave
            }
            disabled={loading}
          >
            {loading
              ? 'Saving...'
              : editingId
              ? '💾 Update'
              : '➕ Add'}
          </button>

          {editingId && (
            <button
              style={
                styles.secondaryButton
              }
              onClick={() => {
                setEditingId(
                  null
                );
                setForm({});
              }}
            >
              Cancel
            </button>
          )}
        </div>

      </div>


      {/* RECORDS */}

      <div
        style={
          styles.infoCard
        }
      >

        <div
          style={
            styles.listHeader
          }
        >
          <h3>
            {config.title} List
          </h3>

          <span
            style={
              styles.countBadge
            }
          >
            {items.length}
          </span>
        </div>

        {loading ? (
          <EmptyState
            text="Loading..."
          />
        ) : items.length ===
          0 ? (
          <EmptyState
            text={
              `No ${config.title.toLowerCase()} found.`
            }
          />
        ) : (
          items.map(
            (item) => (
              <RecordRow
                key={
                  item.id
                }
                item={
                  item
                }
                section={
                  section
                }
                onEdit={() => {
                  setEditingId(
                    item.id || null
                  );

                  setForm({
                    ...item,
                  });

                  window.scrollTo({
                    top: 0,
                    behavior:
                      'smooth',
                  });
                }}
                onDelete={() =>
                  item.id &&
                  onDelete(
                    item.id
                  )
                }
              />
            )
          )
        )}

      </div>
    </>
  );
}


/* =========================================================
   SUBSCRIPTION
========================================================= */

function SubscriptionSection({
  school,
  schoolId,
}: {
  school: School;
  schoolId: string;
}) {
  const navigate = useNavigate();
  const [history, setHistory] = useState<Awaited<ReturnType<typeof fetchSchoolRechargeHistory>>>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    setLoadingHistory(true);
    setHistoryError('');
    const unsubscribe = subscribeToSchoolRechargeHistory(
      schoolId,
      (items) => { setHistory(items); setLoadingHistory(false); },
      (error) => { setHistoryError(error.message); setLoadingHistory(false); }
    );
    return unsubscribe;
  }, [schoolId]);

  const remainingDays = getRemainingSubscriptionDays(school);
  const totalAmount = Number(school.totalRechargeAmount ?? school.paymentAmount ?? history.reduce((sum, item) => sum + Number(item.amount || 0), 0));
  const totalDays = Number(school.totalRechargeDays ?? school.subscriptionDays ?? history.reduce((sum, item) => sum + Number(item.days || 0), 0));
  const expiryText = school.subscriptionExpiryDate ? new Date(school.subscriptionExpiryDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not available';

  return (
    <>
      <h2 style={styles.pageHeading}>💳 Subscription & Recharge</h2>

      {getSubscriptionReminderText(school) && (
        <div style={{ marginBottom: 18, borderRadius: 18, padding: 18, background: '#fff7ed', border: '2px solid #fb923c', color: '#9a3412', fontWeight: 900 }}>
          {getSubscriptionReminderText(school)}
        </div>
      )}

      <div style={styles.cardGrid}>
        <StatCard icon="💰" title="Total Recharge" value={'₹' + totalAmount} />
        <StatCard icon="📅" title="Total Recharge Days" value={String(totalDays)} />
        <StatCard icon="⏳" title="Remaining Days" value={remainingDays === null ? 'N/A' : String(Math.max(remainingDays, 0))} />
        <StatCard icon="📆" title="Expiry" value={school.subscriptionExpiryDate ? new Date(school.subscriptionExpiryDate).toLocaleDateString('en-IN') : 'N/A'} />
      </div>

      <div style={{ ...styles.infoCard, marginTop: 18 }}>
        <div style={styles.listHeader}>
          <div>
            <h3>💳 Current Subscription</h3>
            <div style={styles.smallText}>{school.subscriptionStatus || 'PENDING'}</div>
          </div>
          <button style={styles.primaryButton} onClick={() => navigate('/payment/recharge?schoolId=' + encodeURIComponent(schoolId))}>🔄 Recharge Now</button>
        </div>
        <InfoRow label="Expiry" value={expiryText} />
        <InfoRow label="Total Amount" value={'₹' + totalAmount} />
        <InfoRow label="Total Days" value={String(totalDays)} />
        <InfoRow label="Recharge Count" value={String(history.length)} />
        <button style={{ ...styles.secondaryButton, marginTop: 14 }} onClick={() => openPlatformAdminWhatsApp(school)}>📲 Admin को Recharge Reminder भेजें</button>
      </div>

      <div style={{ ...styles.infoCard, marginTop: 18 }}>
        <div style={styles.listHeader}>
          <h3>📜 पूरी Recharge History</h3>
          <span style={styles.countBadge}>{history.length}</span>
        </div>
        {historyError && <div style={{ color: '#b91c1c', fontWeight: 800 }}>{historyError}</div>}
        {loadingHistory ? <EmptyState text="Recharge history loading..." /> : history.length === 0 ? <EmptyState text="अभी कोई recharge transaction नहीं है।" /> : history.map((item, index) => (
          <div key={item.id} style={{ ...styles.memberRow, display: 'block', marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <strong>#{history.length - index} • ₹{Number(item.amount || 0)}</strong>
              <span style={styles.smallText}>{item.createdAt && typeof item.createdAt === 'object' && item.createdAt !== null && 'toDate' in item.createdAt && typeof (item.createdAt as { toDate?: unknown }).toDate === 'function' ? (item.createdAt as { toDate: () => Date }).toDate().toLocaleString('en-IN') : item.createdAt ? String(item.createdAt) : 'Date pending'}</span>
            </div>
            <div style={styles.smallText}>📅 {Number(item.days || 0)} days • {item.source || item.type || 'RECHARGE'}{item.utr ? ' • UTR: ' + item.utr : ''}</div>
          </div>
        ))}
      </div>
    </>
  );
}

/* =========================================================
   MODULE CONFIG
========================================================= */

const moduleConfig: Record<
  string,
  {
    title: string;
    icon: string;
    fields: {
      key: string;
      label: string;
      type?: string;
      options?: string[];
    }[];
  }
> = {

  classes: {
    title: 'Classes 1–12',
    icon: '📚',
    fields: [
      {
        key: 'className',
        label: 'Class',
        type: 'select',
        options: [
          'Class 1',
          'Class 2',
          'Class 3',
          'Class 4',
          'Class 5',
          'Class 6',
          'Class 7',
          'Class 8',
          'Class 9',
          'Class 10',
          'Class 11',
          'Class 12',
        ],
      },
      {
        key: 'section',
        label: 'Section',
      },
      {
        key: 'teacherName',
        label: 'Class Teacher',
      },
      {
        key: 'room',
        label: 'Room',
      },
    ],
  },


  students: {
    title: 'Students',
    icon: '👨‍🎓',
    fields: [
      {
        key: 'name',
        label: 'Student Name',
      },
      {
        key: 'rollNumber',
        label: 'Roll Number',
      },
      {
        key: 'className',
        label: 'Class',
        type: 'select',
        options: [
          'Class 1',
          'Class 2',
          'Class 3',
          'Class 4',
          'Class 5',
          'Class 6',
          'Class 7',
          'Class 8',
          'Class 9',
          'Class 10',
          'Class 11',
          'Class 12',
        ],
      },
      {
        key: 'section',
        label: 'Section',
      },
      {
        key: 'parentName',
        label: 'Parent / Guardian Name',
      },
      {
        key: 'phone',
        label: 'Parent Phone',
        type: 'tel',
      },
      {
        key: 'address',
        label: 'Address',
        type: 'textarea',
      },
    ],
  },


  homework: {
    title: 'Homework',
    icon: '📝',
    fields: [
      {
        key: 'title',
        label: 'Homework Title',
      },
      {
        key: 'className',
        label: 'Class',
        type: 'select',
        options: [
          'Class 1',
          'Class 2',
          'Class 3',
          'Class 4',
          'Class 5',
          'Class 6',
          'Class 7',
          'Class 8',
          'Class 9',
          'Class 10',
          'Class 11',
          'Class 12',
        ],
      },
      {
        key: 'subject',
        label: 'Subject',
      },
      {
        key: 'description',
        label: 'Homework Details',
        type: 'textarea',
      },
      {
        key: 'dueDate',
        label: 'Due Date',
        type: 'date',
      },
    ],
  },


  results: {
    title: 'Results',
    icon: '📊',
    fields: [
      {
        key: 'studentName',
        label: 'Student Name',
      },
      {
        key: 'rollNumber',
        label: 'Roll Number',
      },
      {
        key: 'className',
        label: 'Class',
        type: 'select',
        options: [
          'Class 1',
          'Class 2',
          'Class 3',
          'Class 4',
          'Class 5',
          'Class 6',
          'Class 7',
          'Class 8',
          'Class 9',
          'Class 10',
          'Class 11',
          'Class 12',
        ],
      },
      {
        key: 'exam',
        label: 'Exam',
      },
      {
        key: 'subject',
        label: 'Subject',
      },
      {
        key: 'marks',
        label: 'Marks',
        type: 'number',
      },
      {
        key: 'maxMarks',
        label: 'Maximum Marks',
        type: 'number',
      },
      {
        key: 'grade',
        label: 'Grade',
      },
    ],
  },


  attendance: {
    title: 'Attendance',
    icon: '📅',
    fields: [
      {
        key: 'studentName',
        label: 'Student Name',
      },
      {
        key: 'rollNumber',
        label: 'Roll Number',
      },
      {
        key: 'className',
        label: 'Class',
        type: 'select',
        options: [
          'Class 1',
          'Class 2',
          'Class 3',
          'Class 4',
          'Class 5',
          'Class 6',
          'Class 7',
          'Class 8',
          'Class 9',
          'Class 10',
          'Class 11',
          'Class 12',
        ],
      },
      {
        key: 'date',
        label: 'Date',
        type: 'date',
      },
      {
        key: 'status',
        label: 'Attendance Status',
        type: 'select',
        options: [
          'Present',
          'Absent',
          'Late',
          'Leave',
        ],
      },
    ],
  },


  notices: {
    title: 'Notices',
    icon: '📢',
    fields: [
      {
        key: 'title',
        label: 'Notice Title',
      },
      {
        key: 'description',
        label: 'Notice',
        type: 'textarea',
      },
      {
        key: 'date',
        label: 'Date',
        type: 'date',
      },
    ],
  },


  events: {
    title: 'Events',
    icon: '🎉',
    fields: [
      {
        key: 'title',
        label: 'Event Title',
      },
      {
        key: 'description',
        label: 'Event Description',
        type: 'textarea',
      },
      {
        key: 'date',
        label: 'Event Date',
        type: 'date',
      },
      {
        key: 'location',
        label: 'Location',
      },
    ],
  },


  gallery: {
    title: 'Gallery',
    icon: '🖼️',
    fields: [
      {
        key: 'title',
        label: 'Image Title',
      },
      {
        key: 'imageUrl',
        label: 'Image URL',
      },
      {
        key: 'description',
        label: 'Description',
        type: 'textarea',
      },
    ],
  },


  documents: {
    title: 'Documents',
    icon: '📄',
    fields: [
      {
        key: 'title',
        label: 'Document Title',
      },
      {
        key: 'documentUrl',
        label: 'Document URL',
      },
      {
        key: 'description',
        label: 'Description',
        type: 'textarea',
      },
    ],
  },
};



/* =========================================================
   TEACHER PHOTO UPLOAD
   Free: image is resized/compressed in the browser and
   stored directly in the teacher Firestore document.
========================================================= */

async function compressTeacherPhoto(
  file: File
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file.');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Photo must be smaller than 5 MB.');
  }

  const sourceUrl = URL.createObjectURL(file);

  try {
    const image = new Image();

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(new Error('Unable to read this photo.'));
      image.src = sourceUrl;
    });

    const maxSize = 600;
    const scale = Math.min(
      1,
      maxSize / Math.max(image.naturalWidth, image.naturalHeight)
    );

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(
      1,
      Math.round(image.naturalWidth * scale)
    );
    canvas.height = Math.max(
      1,
      Math.round(image.naturalHeight * scale)
    );

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Photo processing is not supported in this browser.');
    }

    context.drawImage(
      image,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const dataUrl = canvas.toDataURL('image/jpeg', 0.72);

    if (dataUrl.length > 450000) {
      throw new Error(
        'Photo is still too large after compression. Please choose a smaller photo.'
      );
    }

    return dataUrl;
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

function TeacherPhotoUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const choosePhoto = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);
      setError('');

      const dataUrl = await compressTeacherPhoto(file);
      onChange(dataUrl);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to upload photo.'
      );
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gap: 12,
        marginBottom: 16,
      }}
    >
      <span
        style={{
          fontWeight: 800,
          color: '#334155',
        }}
      >
        Teacher Photo
      </span>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        {value ? (
          <img
            src={value}
            alt="Teacher preview"
            style={{
              width: 96,
              height: 96,
              borderRadius: 20,
              objectFit: 'cover',
              border: '2px solid #cbd5e1',
            }}
          />
        ) : (
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#eff6ff',
              border: '2px dashed #93c5fd',
              fontSize: 38,
            }}
          >
            👨‍🏫
          </div>
        )}

        <label
          style={{
            ...styles.primaryButton,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: uploading ? 'wait' : 'pointer',
          }}
        >
          {uploading ? '⏳ Processing...' : '📷 Upload Photo'}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={choosePhoto}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>

        {value && (
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => onChange('')}
            disabled={uploading}
          >
            Remove Photo
          </button>
        )}
      </div>

      <small style={styles.smallText}>
        JPG/PNG/WebP • Max 5 MB selected • automatically compressed before saving
      </small>

      {error && (
        <div
          style={{
            color: '#b91c1c',
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   INPUT
========================================================= */

function Input({
  label,
  value,
  onChange,
  type = 'text',
  textarea = false,
  options,
}: {
  label: string;
  value: any;
  onChange: (
    value: string
  ) => void;
  type?: string;
  textarea?: boolean;
  options?: string[];
}) {
  return (
    <label
      style={
        styles.fieldLabel
      }
    >
      <span>
        {label}
      </span>

      {options ? (
        <select
          value={
            value || ''
          }
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
          style={
            styles.input
          }
        >
          <option value="">
            Select...
          </option>

          {options.map(
            (option) => (
              <option
                key={
                  option
                }
                value={
                  option
                }
              >
                {option}
              </option>
            )
          )}
        </select>
      ) : textarea ? (
        <textarea
          value={
            value || ''
          }
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
          style={{
            ...styles.input,
            minHeight: 110,
            resize:
              'vertical',
          }}
        />
      ) : (
        <input
          type={type}
          value={
            value || ''
          }
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
          style={
            styles.input
          }
        />
      )}
    </label>
  );
}


/* =========================================================
   RECORD ROW
========================================================= */

function RecordRow({
  item,
  section,
  onEdit,
  onDelete,
}: {
  item: AnyRecord;
  section: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const title =
    item.name ||
    item.studentName ||
    item.title ||
    item.className ||
    'Record';

  const subtitle =
    item.rollNumber
      ? `Roll No: ${item.rollNumber}`
      : item.subject
      ? `Subject: ${item.subject}`
      : item.date
      ? `Date: ${item.date}`
      : item.description
      ? item.description
      : '';

  return (
    <div
      style={
        styles.memberRow
      }
    >

      <div
        style={{
          minWidth: 0,
          flex: 1,
        }}
      >
        <strong>
          {title}
        </strong>

        {subtitle && (
          <div
            style={
              styles.smallText
            }
          >
            {subtitle}
          </div>
        )}

        {section ===
          'results' && (
          <div
            style={
              styles.smallText
            }
          >
            Marks:{' '}
            {item.marks ??
              '-'}
            {' / '}
            {item.maxMarks ??
              '-'}
            {' • '}
            Grade:{' '}
            {item.grade ||
              '-'}
          </div>
        )}

        {section ===
          'attendance' && (
          <div
            style={
              styles.smallText
            }
          >
            Status:{' '}
            {item.status ||
              '-'}
          </div>
        )}

        {section ===
          'gallery' &&
          item.imageUrl && (
            <img
              src={
                item.imageUrl
              }
              alt={
                item.title ||
                'Gallery'
              }
              style={
                styles.thumbnail
              }
            />
          )}
      </div>

      <div
        style={
          styles.rowButtons
        }
      >
        <button
          style={
            styles.editButton
          }
          onClick={
            onEdit
          }
        >
          ✏️ Edit
        </button>

        <button
          style={
            styles.dangerButton
          }
          onClick={
            onDelete
          }
        >
          🗑️ Delete
        </button>
      </div>

    </div>
  );
}


/* =========================================================
   TEACHERS
========================================================= */


function TeachersSection({
  schoolId,
  teacherRecords,
  setTeacherRecords,
  teachers,
  pendingTeachers,
  onActivate,
  onRevoke,
}: {
  schoolId: string;
  teacherRecords: AnyRecord[];
  setTeacherRecords: React.Dispatch<React.SetStateAction<AnyRecord[]>>;
  teachers: SchoolMembership[];
  pendingTeachers: SchoolMembership[];
  onActivate: (member: SchoolMembership) => void;
  onRevoke: (member: SchoolMembership) => void;
}) {
  const [form, setForm] = useState<AnyRecord>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingTeacher, setSavingTeacher] = useState(false);
  const [teacherMessage, setTeacherMessage] = useState('');

  const field = (key: string) => form[key] ?? '';

  const setField = (key: string, value: any) => {
    setForm((old) => ({
      ...old,
      [key]: value,
    }));
  };

  const saveTeacherRecord = async () => {
    if (!schoolId) return;

    if (!String(field('name')).trim()) {
      setTeacherMessage('Teacher name is required.');
      return;
    }

    if (!String(field('email')).trim()) {
      setTeacherMessage('Google Email is required.');
      return;
    }

    if (!String(field('subject')).trim()) {
      setTeacherMessage('Subject is required.');
      return;
    }

    if (!String(field('assignedClass')).trim()) {
      setTeacherMessage('Assigned Class is required.');
      return;
    }

    try {
      setSavingTeacher(true);
      setTeacherMessage('');

      const data = {
        schoolId,
        name: String(field('name')).trim(),
        email: String(field('email')).trim().toLowerCase(),
        subject: String(field('subject')).trim(),
        assignedClass: String(field('assignedClass')).trim(),
        section: String(field('section')).trim(),
        photoDataUrl: String(field('photoDataUrl') || ''),
      };

      if (editingId) {
        await updateTeacher(editingId, data);
        await createTeacherInvite({ schoolId, teacherId: editingId, email: data.email, assignedClass: data.assignedClass, section: data.section, subject: data.subject });
      } else {
        const teacherId = await addTeacher(data);
        await createTeacherInvite({ schoolId, teacherId, email: data.email, assignedClass: data.assignedClass, section: data.section, subject: data.subject });
      }

      const refreshed = await fetchTeachers(schoolId);
      setTeacherRecords(refreshed as AnyRecord[]);
      setForm({});
      setEditingId(null);
      setTeacherMessage(
        editingId
          ? '✅ Teacher profile updated.'
          : '✅ Teacher profile added.'
      );
    } catch (error) {
      setTeacherMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save teacher profile.'
      );
    } finally {
      setSavingTeacher(false);
    }
  };

  const removeTeacherRecord = async (id: string) => {
    if (!window.confirm('Delete this teacher profile?')) return;

    try {
      setSavingTeacher(true);
      await deleteTeacher(id);
      setTeacherRecords((old) =>
        old.filter((item) => item.id !== id)
      );
      if (editingId === id) {
        setEditingId(null);
        setForm({});
      }
      setTeacherMessage('✅ Teacher profile deleted.');
    } catch (error) {
      setTeacherMessage(
        error instanceof Error
          ? error.message
          : 'Unable to delete teacher profile.'
      );
    } finally {
      setSavingTeacher(false);
    }
  };

  return (
    <>
      <h2 style={styles.pageHeading}>👨‍🏫 Teachers</h2>

      <div style={styles.formCard}>
        <h3>{editingId ? '✏️ Edit Teacher' : '➕ Add Teacher'}</h3>

        <TeacherPhotoUpload
          value={field('photoDataUrl')}
          onChange={(value) => setField('photoDataUrl', value)}
        />

        <Input
          label="Teacher Name *"
          value={field('name')}
          onChange={(value) => setField('name', value)}
        />

        <Input
          label="Google Email *"
          type="email"
          value={field('email')}
          onChange={(value) => setField('email', value)}
        />

        <Input
          label="Subject *"
          value={field('subject')}
          onChange={(value) => setField('subject', value)}
        />

        <Input
          label="Assigned Class *"
          options={[
            'Class 1',
            'Class 2',
            'Class 3',
            'Class 4',
            'Class 5',
            'Class 6',
            'Class 7',
            'Class 8',
            'Class 9',
            'Class 10',
            'Class 11',
            'Class 12',
          ]}
          value={field('assignedClass')}
          onChange={(value) => setField('assignedClass', value)}
        />

        <Input
          label="Section"
          value={field('section')}
          onChange={(value) => setField('section', value)}
        />

        {teacherMessage && (
          <div style={styles.message}>{teacherMessage}</div>
        )}

        <div style={styles.formButtons}>
          <button
            style={styles.primaryButton}
            onClick={saveTeacherRecord}
            disabled={savingTeacher}
          >
            {savingTeacher
              ? 'Saving...'
              : editingId
              ? '💾 Update Teacher'
              : '➕ Save Teacher'}
          </button>

          {editingId && (
            <button
              style={styles.secondaryButton}
              onClick={() => {
                setEditingId(null);
                setForm({});
                setTeacherMessage('');
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div style={styles.infoCard}>
        <div style={styles.listHeader}>
          <h3>Teacher Profiles</h3>
          <span style={styles.countBadge}>{teacherRecords.length}</span>
        </div>

        {teacherRecords.length === 0 ? (
          <EmptyState text="No teacher profiles added yet." />
        ) : (
          teacherRecords.map((teacher) => (
            <div key={teacher.id} style={styles.memberRow}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                {teacher.photoDataUrl ? (
                  <img
                    src={teacher.photoDataUrl}
                    alt={teacher.name || 'Teacher'}
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 16,
                      objectFit: 'cover',
                      border: '2px solid #e2e8f0',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#eff6ff',
                      fontSize: 28,
                      flexShrink: 0,
                    }}
                  >
                    👨‍🏫
                  </div>
                )}

                <div style={{ minWidth: 0 }}>
                  <strong>{teacher.name || 'Teacher'}</strong>
                  <div style={styles.smallText}>
                    {teacher.subject || 'Subject not added'}
                    {' • '}
                    {teacher.assignedClass || 'Class not assigned'}
                    {teacher.section ? ' - ' + teacher.section : ''}
                  </div>
                  {teacher.email && (
                    <div style={styles.smallText}>{teacher.email}</div>
                  )}
                </div>
              </div>

              <div style={styles.rowButtons}>
                <button
                  style={styles.editButton}
                  onClick={() => {
                    setEditingId(teacher.id || null);
                    setForm({ ...teacher });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  ✏️ Edit
                </button>

                <button
                  style={styles.dangerButton}
                  onClick={() =>
                    teacher.id && removeTeacherRecord(teacher.id)
                  }
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={styles.infoCard}>
        <h3>🔐 Teacher Login Access</h3>

        {teachers.length === 0 ? (
          <EmptyState text="No active teacher login memberships." />
        ) : (
          teachers.map((teacher) => (
            <MemberRow
              key={teacher.id}
              member={teacher}
              onRevoke={() => onRevoke(teacher)}
            />
          ))
        )}

        {pendingTeachers.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <h4 style={{ marginBottom: 10 }}>⏳ Pending Teacher Access</h4>
            {pendingTeachers.map((teacher) => (
              <div key={teacher.id} style={styles.memberRow}>
                <div>
                  <strong>{teacher.email || teacher.uid}</strong>
                  <div style={styles.smallText}>Waiting for activation</div>
                </div>
                <button
                  style={styles.successButton}
                  onClick={() => onActivate(teacher)}
                >
                  Activate
                </button>
              </div>
            ))}
          </div>
        )}

        <p style={{ ...styles.smallText, marginTop: 12 }}>
          Teacher profile/photo and Teacher Login Access are separate.
          Adding a profile does not automatically create a Google login
          membership.
        </p>
      </div>
    </>
  );
}

/* =========================================================
   MY TEACHER BOARD
========================================================= */

function TeacherBoardSection({
  school,
  schoolId,
  assignments,
  onOpenSection,
}: {
  school: School;
  schoolId: string;
  assignments: string[];
  onOpenSection: (section: string) => void;
}) {
  const [counts, setCounts] = useState({
    students: 0,
    homework: 0,
    results: 0,
    attendance: 0,
  });

  const [loadingCounts, setLoadingCounts] = useState(true);

  useEffect(() => {
    let active = true;

    const loadTeacherCounts = async () => {
      try {
        setLoadingCounts(true);

        const [
          students,
          homework,
          results,
          attendance,
        ] = await Promise.all([
          fetchStudents(schoolId),
          fetchHomework(schoolId),
          fetchResults(schoolId),
          fetchAttendance(schoolId),
        ]);

        if (!active) return;

        setCounts({
          students: students.length,
          homework: homework.length,
          results: results.length,
          attendance: attendance.length,
        });
      } catch (error) {
        console.error('Teacher Board count loading error:', error);
      } finally {
        if (active) {
          setLoadingCounts(false);
        }
      }
    };

    void loadTeacherCounts();

    return () => {
      active = false;
    };
  }, [schoolId]);

  const assignedText = assignments.length
    ? assignments.join(', ')
    : 'All classes (School Admin access)';

  const countText = (value: number) =>
    loadingCounts ? 'Loading…' : String(value);

  return (
    <>
      <h2 style={styles.pageHeading}>
        👨‍🏫 My Teacher Board
      </h2>

      <p style={styles.description}>
        यह उसी Gmail के लिए पूरा Teacher Work Area है। इसी school में
        आप School Admin और Teacher दोनों काम कर सकते हैं।
      </p>

      <div style={styles.cardGrid}>
        <StatCard
          icon="🏫"
          title="School"
          value={school.name}
        />

        <StatCard
          icon="📚"
          title="My Classes"
          value={assignedText}
        />

        <StatCard
          icon="👨‍🎓"
          title="Students"
          value={countText(counts.students)}
        />

        <StatCard
          icon="📝"
          title="Homework"
          value={countText(counts.homework)}
        />

        <StatCard
          icon="📊"
          title="Results"
          value={countText(counts.results)}
        />

        <StatCard
          icon="📅"
          title="Attendance"
          value={countText(counts.attendance)}
        />
      </div>

      <div style={styles.infoCard}>
        <h3>👨‍🏫 Teacher Work</h3>

        <p style={styles.smallText}>
          {assignments.length
            ? 'आपको केवल assigned classes पर teacher work करना चाहिए: ' + assignedText + '।'
            : 'यह account School Admin भी है, इसलिए इसी school की सभी classes पर access है।'}
        </p>

        <div style={styles.formButtons}>
          <button
            style={styles.primaryButton}
            onClick={() => onOpenSection('homework')}
          >
            📝 Homework खोलें
          </button>

          <button
            style={styles.primaryButton}
            onClick={() => onOpenSection('results')}
          >
            📊 Results खोलें
          </button>

          <button
            style={styles.primaryButton}
            onClick={() => onOpenSection('attendance')}
          >
            📅 Attendance खोलें
          </button>

          <button
            style={styles.primaryButton}
            onClick={() => onOpenSection('students')}
          >
            👨‍🎓 Students खोलें
          </button>

          <button
            style={styles.secondaryButton}
            onClick={() => onOpenSection('classes')}
          >
            📚 Classes खोलें
          </button>
        </div>
      </div>

      <div style={styles.infoCard}>
        <h3>🔒 School Isolation</h3>

        <InfoRow
          label="School"
          value={school.name}
        />

        <InfoRow
          label="School ID"
          value={schoolId}
        />

        <InfoRow
          label="Teacher Classes"
          value={assignedText}
        />

        <p style={{ ...styles.smallText, marginTop: 14 }}>
          Teacher Board में खुलने वाला हर module इसी school ID
          <strong> {schoolId}</strong> के साथ काम करता है। दूसरे school
          का data यहाँ नहीं लाया जाता।
        </p>
      </div>
    </>
  );
}

/* =========================================================
   STAFF
========================================================= */

function StaffSection({
  schoolAdmins,
  teachers,
  pendingAdmins,
  onActivate,
  onRevoke,
}: {
  schoolAdmins: SchoolMembership[];
  teachers: SchoolMembership[];
  pendingAdmins: SchoolMembership[];
  onActivate: (
    member: SchoolMembership
  ) => void;
  onRevoke: (
    member: SchoolMembership
  ) => void;
}) {
  return (
    <>
      <h2
        style={
          styles.pageHeading
        }
      >
        🔐 Staff Access
      </h2>

      <div
        style={
          styles.infoCard
        }
      >
        <h3>
          👨‍💼 School Administrators
        </h3>

        {schoolAdmins.length ===
        0 ? (
          <EmptyState
            text="No active school administrators."
          />
        ) : (
          schoolAdmins.map(
            (member) => (
              <MemberRow
                key={
                  member.id
                }
                member={
                  member
                }
                onRevoke={() =>
                  onRevoke(
                    member
                  )
                }
              />
            )
          )
        )}
      </div>

      <div
        style={
          styles.infoCard
        }
      >
        <h3>
          👨‍🏫 Active Teachers
        </h3>

        {teachers.length ===
        0 ? (
          <EmptyState
            text="No active teachers."
          />
        ) : (
          teachers.map(
            (member) => (
              <MemberRow
                key={
                  member.id
                }
                member={
                  member
                }
                onRevoke={() =>
                  onRevoke(
                    member
                  )
                }
              />
            )
          )
        )}
      </div>

      {pendingAdmins.length >
        0 && (
        <div
          style={
            styles.infoCard
          }
        >
          <h3>
            ⏳ Pending Administrators
          </h3>

          {pendingAdmins.map(
            (member) => (
              <div
                key={
                  member.id
                }
                style={
                  styles.memberRow
                }
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
                    onActivate(
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
  );
}


/* =========================================================
   SUBSCRIPTION
========================================================= */

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
    <div
      style={
        styles.statCard
      }
    >
      <div
        style={
          styles.statIcon
        }
      >
        {icon}
      </div>

      <div>
        <div
          style={
            styles.statTitle
          }
        >
          {title}
        </div>

        <div
          style={
            styles.statValue
          }
        >
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
    <div
      style={
        styles.infoRow
      }
    >
      <span
        style={
          styles.infoLabel
        }
      >
        {label}
      </span>

      <span
        style={
          styles.infoValue
        }
      >
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
    <div
      style={
        styles.memberRow
      }
    >
      <div>
        <strong>
          {member.invitedByEmail ||
            member.uid}
        </strong>

        <div
          style={
            styles.smallText
          }
        >
          Role: {member.role}
        </div>

        {member.role ===
          'teacher' && (
          <div
            style={
              styles.smallText
            }
          >
            Classes:{' '}
            {member.assignments
              ?.length
              ? member.assignments.join(
                  ', '
                )
              : 'None'}
          </div>
        )}
      </div>

      <button
        style={
          styles.dangerButton
        }
        onClick={
          onRevoke
        }
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
    <div
      style={
        styles.empty
      }
    >
      {text}
    </div>
  );
}


/* =========================================================
   STYLES
========================================================= */

const styles: Record<
  string,
  CSSProperties
> = {

  page: {
    minHeight:
      '100vh',
    background:
      'linear-gradient(135deg, #eef2ff, #f8fafc)',
    color: '#172033',
  },

  fullPage: {
    minHeight:
      '100vh',
    display: 'flex',
    alignItems:
      'center',
    justifyContent:
      'center',
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
    padding:
      '14px 22px',
    display: 'flex',
    alignItems:
      'center',
    justifyContent:
      'space-between',
    gap: 15,
    background:
      'linear-gradient(90deg, #4f46e5, #7c3aed, #db2777)',
    color: '#fff',
    boxShadow:
      '0 5px 18px rgba(0,0,0,0.2)',
  },

  headerLeft: {
    display: 'flex',
    alignItems:
      'center',
    gap: 14,
    minWidth: 0,
  },

  logoBox: {
    width: 55,
    height: 55,
    borderRadius: 16,
    background: '#fff',
    display: 'flex',
    alignItems:
      'center',
    justifyContent:
      'center',
    boxShadow:
      '0 5px 0 rgba(0,0,0,0.2)',
    flexShrink: 0,
    overflow:
      'hidden',
  },

  logo: {
    width: '100%',
    height: '100%',
    objectFit:
      'cover',
  },

  logoText: {
    fontSize: 30,
  },

  schoolTitle: {
    margin: 0,
    fontSize: 22,
    lineHeight: 1.2,
    overflow:
      'hidden',
    textOverflow:
      'ellipsis',
    whiteSpace:
      'nowrap',
  },

  schoolMeta: {
    display: 'flex',
    gap: 10,
    alignItems:
      'center',
    marginTop: 5,
    fontSize: 12,
    opacity: 0.95,
    flexWrap:
      'wrap',
  },

  statusBadge: {
    padding:
      '3px 8px',
    borderRadius: 20,
    background:
      '#fff',
    color:
      '#4f46e5',
    fontWeight: 800,
  },

  logoutButton: {
    border: 'none',
    borderRadius: 12,
    padding:
      '12px 18px',
    background:
      '#fff',
    color:
      '#4f46e5',
    fontWeight: 800,
    cursor:
      'pointer',
    boxShadow:
      '0 5px 0 rgba(0,0,0,0.2)',
    flexShrink: 0,
  },

  layout: {
    display:
      'flex',
    minHeight:
      'calc(100vh - 83px)',
  },

  sidebar: {
    width: 250,
    padding: 16,
    background:
      '#111827',
    display:
      'flex',
    flexDirection:
      'column',
    gap: 9,
    flexShrink: 0,
    overflowY:
      'auto',
  },

  menuButton: {
    width: '100%',
    textAlign:
      'left',
    border: 'none',
    borderRadius: 12,
    padding:
      '12px 14px',
    background:
      '#1f2937',
    color:
      '#e5e7eb',
    fontWeight: 700,
    cursor:
      'pointer',
    boxShadow:
      '0 4px 0 #080d16',
  },

  activeMenu: {
    width: '100%',
    textAlign:
      'left',
    border: 'none',
    borderRadius: 12,
    padding:
      '12px 14px',
    background:
      'linear-gradient(90deg, #06b6d4, #3b82f6)',
    color:
      '#fff',
    fontWeight: 800,
    cursor:
      'pointer',
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
    color:
      '#64748b',
    marginTop: 0,
    marginBottom: 24,
  },

  message: {
    background:
      '#ecfdf5',
    color:
      '#047857',
    border:
      '1px solid #a7f3d0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    fontWeight: 700,
  },

  cardGrid: {
    display:
      'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(190px, 1fr))',
    gap: 18,
    marginBottom: 24,
  },

  statCard: {
    background:
      '#fff',
    borderRadius: 20,
    padding: 20,
    display:
      'flex',
    alignItems:
      'center',
    gap: 15,
    boxShadow:
      '0 8px 0 #cbd5e1, 0 12px 25px rgba(0,0,0,0.08)',
  },

  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    display:
      'flex',
    alignItems:
      'center',
    justifyContent:
      'center',
    background:
      '#eef2ff',
    fontSize: 25,
  },

  statTitle: {
    fontSize: 13,
    color:
      '#64748b',
    fontWeight: 700,
  },

  statValue: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: 900,
  },

  infoCard: {
    background:
      '#fff',
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
    boxShadow:
      '0 7px 0 #dbeafe, 0 12px 25px rgba(0,0,0,0.07)',
  },

  formCard: {
    background:
      '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    boxShadow:
      '0 7px 0 #dbeafe, 0 12px 25px rgba(0,0,0,0.07)',
  },

  fieldLabel: {
    display:
      'flex',
    flexDirection:
      'column',
    gap: 7,
    marginBottom: 16,
    fontWeight: 800,
    color:
      '#334155',
  },

  input: {
    width: '100%',
    boxSizing:
      'border-box',
    border:
      '1px solid #cbd5e1',
    borderRadius: 12,
    padding:
      '12px 14px',
    fontSize: 15,
    outline:
      'none',
    background:
      '#f8fafc',
  },

  formButtons: {
    display:
      'flex',
    gap: 12,
    flexWrap:
      'wrap',
    marginTop: 10,
  },

  infoRow: {
    display:
      'flex',
    justifyContent:
      'space-between',
    gap: 20,
    padding:
      '13px 0',
    borderBottom:
      '1px solid #e5e7eb',
    flexWrap:
      'wrap',
  },

  infoLabel: {
    color:
      '#64748b',
    fontWeight: 700,
  },

  infoValue: {
    fontWeight: 700,
    textAlign:
      'right',
    wordBreak:
      'break-word',
  },

  memberRow: {
    display:
      'flex',
    alignItems:
      'center',
    justifyContent:
      'space-between',
    gap: 15,
    padding: 15,
    marginTop: 10,
    borderRadius: 14,
    background:
      '#f8fafc',
    border:
      '1px solid #e2e8f0',
  },

  rowButtons: {
    display:
      'flex',
    gap: 8,
    flexWrap:
      'wrap',
  },

  editButton: {
    border:
      'none',
    borderRadius: 10,
    padding:
      '10px 14px',
    background:
      'linear-gradient(90deg, #f59e0b, #d97706)',
    color:
      '#fff',
    fontWeight: 800,
    cursor:
      'pointer',
  },

  smallText: {
    marginTop: 4,
    color:
      '#64748b',
    fontSize: 13,
  },

  primaryButton: {
    border:
      'none',
    borderRadius: 12,
    padding:
      '12px 20px',
    background:
      'linear-gradient(90deg, #2563eb, #7c3aed)',
    color:
      '#fff',
    fontWeight: 800,
    cursor:
      'pointer',
    boxShadow:
      '0 5px 0 #1e3a8a',
  },

  secondaryButton: {
    border:
      'none',
    borderRadius: 12,
    padding:
      '12px 20px',
    background:
      '#64748b',
    color:
      '#fff',
    fontWeight: 800,
    cursor:
      'pointer',
    boxShadow:
      '0 5px 0 #334155',
  },

  successButton: {
    border:
      'none',
    borderRadius: 10,
    padding:
      '10px 15px',
    background:
      'linear-gradient(90deg, #10b981, #059669)',
    color:
      '#fff',
    fontWeight: 800,
    cursor:
      'pointer',
    boxShadow:
      '0 4px 0 #047857',
  },

  dangerButton: {
    border:
      'none',
    borderRadius: 10,
    padding:
      '10px 15px',
    background:
      'linear-gradient(90deg, #ef4444, #dc2626)',
    color:
      '#fff',
    fontWeight: 800,
    cursor:
      'pointer',
    boxShadow:
      '0 4px 0 #991b1b',
    flexShrink: 0,
  },

  empty: {
    padding: 25,
    textAlign:
      'center',
    color:
      '#64748b',
    background:
      '#f8fafc',
    borderRadius: 12,
  },

  listHeader: {
    display:
      'flex',
    alignItems:
      'center',
    justifyContent:
      'space-between',
    gap: 15,
    marginBottom: 15,
  },

  countBadge: {
    minWidth: 35,
    height: 35,
    borderRadius: 20,
    display:
      'flex',
    alignItems:
      'center',
    justifyContent:
      'center',
    background:
      '#eef2ff',
    color:
      '#4f46e5',
    fontWeight: 900,
  },

  thumbnail: {
    width: 90,
    height: 70,
    objectFit:
      'cover',
    borderRadius: 10,
    marginTop: 10,
    display:
      'block',
  },
};
