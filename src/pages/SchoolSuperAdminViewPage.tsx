import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  fetchSchoolById,
  fetchSchoolInfo,
  fetchSchoolMemberships,
  fetchTeachers,
  fetchAnnouncements,
  fetchEvents,
} from '@/firebase/firestore';

type Tab =
  | 'info'
  | 'students'
  | 'teachers'
  | 'classes'
  | 'results'
  | 'homework'
  | 'attendance'
  | 'notices'
  | 'events'
  | 'gallery'
  | 'documents'
  | 'staff'
  | 'subscription';

export default function SchoolSuperAdminViewPage() {
  const { schoolId } = useParams();
  const navigate = useNavigate();

  const [school, setSchool] = useState<any>(null);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!schoolId) return;

    loadSchool();
  }, [schoolId]);

  async function loadSchool() {
    try {
      setLoading(true);
      setError('');

      if (!schoolId) {
        throw new Error('School ID missing');
      }

      const [
        schoolData,
        infoData,
        membershipData,
        teacherData,
        noticeData,
        eventData,
      ] = await Promise.all([
        fetchSchoolById(schoolId),
        fetchSchoolInfo(schoolId),
        fetchSchoolMemberships(schoolId),
        fetchTeachers(schoolId),
        fetchAnnouncements(schoolId),
        fetchEvents(schoolId),
      ]);

      setSchool(schoolData);
      setSchoolInfo(infoData);
      setMemberships(membershipData || []);
      setTeachers(teacherData || []);
      setAnnouncements(noticeData || []);
      setEvents(eventData || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'School data load नहीं हुआ');
    } finally {
      setLoading(false);
    }
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'info', label: 'School Info', icon: '🏫' },
    { id: 'students', label: 'Students', icon: '👨‍🎓' },
    { id: 'teachers', label: 'Teachers', icon: '👨‍🏫' },
    { id: 'classes', label: 'Classes 1–12', icon: '📚' },
    { id: 'results', label: 'Results', icon: '📝' },
    { id: 'homework', label: 'Homework', icon: '📖' },
    { id: 'attendance', label: 'Attendance', icon: '📅' },
    { id: 'notices', label: 'Notices', icon: '📢' },
    { id: 'events', label: 'Events', icon: '🎉' },
    { id: 'gallery', label: 'Gallery', icon: '🖼️' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'staff', label: 'Staff Access', icon: '👥' },
    { id: 'subscription', label: 'Subscription', icon: '💳' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-xl font-bold">School data loading...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <button
          onClick={() => navigate('/admin')}
          className="mb-6 rounded-xl bg-white/10 px-4 py-2"
        >
          ← Back to All Schools
        </button>

        <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-6">
          <h2 className="text-xl font-bold mb-2">Data Load Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <button
          onClick={() => navigate('/admin')}
          className="rounded-xl bg-white/10 px-4 py-2"
        >
          ← Back
        </button>

        <div className="mt-8">
          School नहीं मिला।
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* HEADER */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/admin')}
            className="mb-4 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2"
          >
            ← Back to All Schools
          </button>

          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {school.logo ? (
              <img
                src={school.logo}
                alt={school.name}
                className="w-16 h-16 rounded-2xl object-cover bg-white"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-3xl">
                🏫
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold">
                {school.name}
              </h1>

              <p className="text-slate-400">
                /school/{school.slug}
              </p>
            </div>

            <div
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                school.status === 'LIVE'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}
            >
              {school.status}
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="max-w-7xl mx-auto px-4 py-5">
        <div className="flex gap-2 overflow-x-auto pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-xl px-4 py-3 font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="mt-4">
          {activeTab === 'info' && (
            <InfoSection
              school={school}
              schoolInfo={schoolInfo}
            />
          )}

          {activeTab === 'students' && (
            <EmptySection
              icon="👨‍🎓"
              title="Students"
              text="इस school के Students data को यहाँ schoolId के अनुसार दिखाया जाएगा।"
            />
          )}

          {activeTab === 'teachers' && (
            <TeachersSection teachers={teachers} />
          )}

          {activeTab === 'classes' && (
            <ClassesSection />
          )}

          {activeTab === 'results' && (
            <EmptySection
              icon="📝"
              title="Results"
              text="इस school के Results / Marks data को यहाँ दिखाया जाएगा।"
            />
          )}

          {activeTab === 'homework' && (
            <EmptySection
              icon="📖"
              title="Homework"
              text="इस school का Homework data यहाँ दिखेगा।"
            />
          )}

          {activeTab === 'attendance' && (
            <EmptySection
              icon="📅"
              title="Attendance"
              text="इस school की Attendance यहाँ दिखेगी।"
            />
          )}

          {activeTab === 'notices' && (
            <NoticesSection announcements={announcements} />
          )}

          {activeTab === 'events' && (
            <EventsSection events={events} />
          )}

          {activeTab === 'gallery' && (
            <EmptySection
              icon="🖼️"
              title="Gallery"
              text="इस school की Gallery यहाँ दिखेगी।"
            />
          )}

          {activeTab === 'documents' && (
            <EmptySection
              icon="📄"
              title="Documents"
              text="इस school के Documents यहाँ दिखेंगे।"
            />
          )}

          {activeTab === 'staff' && (
            <StaffSection memberships={memberships} />
          )}

          {activeTab === 'subscription' && (
            <SubscriptionSection school={school} />
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================
   SCHOOL INFO
========================= */

function InfoSection({
  school,
  schoolInfo,
}: {
  school: any;
  schoolInfo: any;
}) {
  const data = schoolInfo || school;

  const fields = [
    ['School Name', data?.name || school?.name],
    ['Slug', school?.slug],
    ['Owner Email', school?.ownerEmail],
    ['Phone', data?.phone],
    ['Email', data?.email],
    ['Address', data?.address],
    ['City', data?.city],
    ['State', data?.state],
    ['Description', data?.description],
  ];

  return (
    <section className="rounded-2xl bg-white/5 border border-white/10 p-5">
      <h2 className="text-2xl font-bold mb-5">🏫 School Information</h2>

      <div className="grid md:grid-cols-2 gap-4">
        {fields.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl bg-black/20 border border-white/5 p-4"
          >
            <div className="text-sm text-slate-400">{label}</div>
            <div className="mt-1 font-semibold break-words">
              {value || '—'}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* =========================
   TEACHERS
========================= */

function TeachersSection({ teachers }: { teachers: any[] }) {
  return (
    <section className="rounded-2xl bg-white/5 border border-white/10 p-5">
      <h2 className="text-2xl font-bold mb-5">
        👨‍🏫 Teachers ({teachers.length})
      </h2>

      {teachers.length === 0 ? (
        <p className="text-slate-400">No teachers found.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((teacher, index) => (
            <div
              key={teacher.id || index}
              className="rounded-xl bg-black/20 border border-white/5 p-4"
            >
              <h3 className="font-bold">
                {teacher.name || teacher.displayName || 'Teacher'}
              </h3>

              <p className="text-sm text-slate-400 mt-2">
                {teacher.email || 'Email not available'}
              </p>

              <p className="text-sm text-slate-400">
                Class: {teacher.assignedClass || '—'}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* =========================
   CLASSES
========================= */

function ClassesSection() {
  const classes = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <section className="rounded-2xl bg-white/5 border border-white/10 p-5">
      <h2 className="text-2xl font-bold mb-5">📚 Classes 1–12</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {classes.map((classNo) => (
          <div
            key={classNo}
            className="rounded-2xl bg-blue-600/20 border border-blue-500/20 p-6 text-center"
          >
            <div className="text-3xl mb-2">📚</div>
            <div className="font-bold">Class {classNo}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* =========================
   NOTICES
========================= */

function NoticesSection({
  announcements,
}: {
  announcements: any[];
}) {
  return (
    <section className="rounded-2xl bg-white/5 border border-white/10 p-5">
      <h2 className="text-2xl font-bold mb-5">
        📢 Notices ({announcements.length})
      </h2>

      {announcements.length === 0 ? (
        <p className="text-slate-400">No notices found.</p>
      ) : (
        <div className="space-y-3">
          {announcements.map((notice, index) => (
            <div
              key={notice.id || index}
              className="rounded-xl bg-black/20 border border-white/5 p-4"
            >
              <h3 className="font-bold">
                {notice.title || 'Notice'}
              </h3>

              <p className="text-slate-300 mt-2 whitespace-pre-wrap">
                {notice.content || notice.message || ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* =========================
   EVENTS
========================= */

function EventsSection({ events }: { events: any[] }) {
  return (
    <section className="rounded-2xl bg-white/5 border border-white/10 p-5">
      <h2 className="text-2xl font-bold mb-5">
        🎉 Events ({events.length})
      </h2>

      {events.length === 0 ? (
        <p className="text-slate-400">No events found.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {events.map((event, index) => (
            <div
              key={event.id || index}
              className="rounded-xl bg-black/20 border border-white/5 p-4"
            >
              <h3 className="font-bold">
                {event.title || 'Event'}
              </h3>

              <p className="text-slate-400 mt-2">
                {event.description || ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* =========================
   STAFF
========================= */

function StaffSection({
  memberships,
}: {
  memberships: any[];
}) {
  return (
    <section className="rounded-2xl bg-white/5 border border-white/10 p-5">
      <h2 className="text-2xl font-bold mb-5">
        👥 Staff Access ({memberships.length})
      </h2>

      {memberships.length === 0 ? (
        <p className="text-slate-400">No staff found.</p>
      ) : (
        <div className="space-y-3">
          {memberships.map((member, index) => (
            <div
              key={member.id || index}
              className="rounded-xl bg-black/20 border border-white/5 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
            >
              <div>
                <div className="font-bold">
                  {member.email || member.uid || 'User'}
                </div>
                <div className="text-sm text-slate-400">
                  Role: {member.role || '—'}
                </div>
              </div>

              <div
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  member.status === 'ACTIVE'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {member.status || 'UNKNOWN'}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* =========================
   SUBSCRIPTION
========================= */

function SubscriptionSection({ school }: { school: any }) {
  return (
    <section className="rounded-2xl bg-white/5 border border-white/10 p-5">
      <h2 className="text-2xl font-bold mb-5">
        💳 Subscription & Payment
      </h2>

      <div className="grid md:grid-cols-2 gap-4">
        <DataBox label="Status" value={school.subscriptionStatus} />
        <DataBox label="Payment Status" value={school.paymentStatus} />
        <DataBox label="Approval Type" value={school.approvalType} />
        <DataBox label="Amount" value={`₹${school.subscriptionAmount || 0}`} />
        <DataBox label="Days" value={school.subscriptionDays} />
        <DataBox label="Start" value={formatDateValue(school.subscriptionStart)} />
        <DataBox label="Expiry" value={formatDateValue(school.subscriptionExpiry)} />
      </div>
    </section>
  );
}

function DataBox({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div className="rounded-xl bg-black/20 border border-white/5 p-4">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="font-bold mt-1">{value || '—'}</div>
    </div>
  );
}

/* =========================
   EMPTY / PLACEHOLDER
========================= */

function EmptySection({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <section className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h2 className="text-2xl font-bold mb-3">{title}</h2>
      <p className="text-slate-400">{text}</p>
    </section>
  );
}

function formatDateValue(value: any) {
  if (!value) return '—';

  if (typeof value?.toDate === 'function') {
    return value.toDate().toLocaleString('en-IN');
  }

  if (value instanceof Date) {
    return value.toLocaleString('en-IN');
  }

  return String(value);
}
