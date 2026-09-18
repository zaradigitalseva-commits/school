```tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  fetchSchoolById,
  fetchSchoolInfo,
  fetchSchoolMemberships,
  fetchTeachers,
  fetchAnnouncements,
  fetchEvents,
  fetchSchoolCollection,
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

type RecordMap = Record<string, any>;

const collectionConfig: Record<
  Exclude<
    Tab,
    'info' |
    'teachers' |
    'notices' |
    'events' |
    'staff' |
    'subscription'
  >,
  {
    collection: string;
    icon: string;
    title: string;
  }
> = {
  students: {
    collection: 'students',
    icon: '👨‍🎓',
    title: 'Students',
  },
  classes: {
    collection: 'classes',
    icon: '📚',
    title: 'Classes',
  },
  results: {
    collection: 'results',
    icon: '📝',
    title: 'Results',
  },
  homework: {
    collection: 'homework',
    icon: '📖',
    title: 'Homework',
  },
  attendance: {
    collection: 'attendance',
    icon: '📅',
    title: 'Attendance',
  },
  gallery: {
    collection: 'gallery',
    icon: '🖼️',
    title: 'Gallery',
  },
  documents: {
    collection: 'documents',
    icon: '📄',
    title: 'Documents',
  },
};

export default function SchoolSuperAdminViewPage() {
  const { schoolId } = useParams();
  const navigate = useNavigate();

  const [school, setSchool] = useState<any>(null);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);

  const [memberships, setMemberships] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  const [schoolData, setSchoolData] = useState<
    Record<string, any[]>
  >({});

  const [activeTab, setActiveTab] =
    useState<Tab>('info');

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    if (schoolId) {
      loadSchool(schoolId);
    }
  }, [schoolId]);

  async function loadSchool(id: string) {
    try {
      setLoading(true);
      setError('');

      const genericCollections =
        Object.entries(collectionConfig);

      const [
        schoolDataResult,
        infoData,
        membershipData,
        teacherData,
        noticeData,
        eventData,
        ...genericResults
      ] = await Promise.all([
        fetchSchoolById(id),

        fetchSchoolInfo(id),

        fetchSchoolMemberships(id),

        fetchTeachers(id),

        fetchAnnouncements(id),

        fetchEvents(id),

        ...genericCollections.map(
          ([, config]) =>
            fetchSchoolCollection(
              config.collection,
              id
            )
        ),
      ]);

      if (!schoolDataResult) {
        throw new Error(
          'School not found.'
        );
      }

      const genericMap:
        Record<string, any[]> = {};

      genericCollections.forEach(
        ([tab], index) => {
          genericMap[tab] =
            genericResults[index] || [];
        }
      );

      setSchool(
        schoolDataResult
      );

      setSchoolInfo(
        infoData
      );

      setMemberships(
        membershipData || []
      );

      setTeachers(
        teacherData || []
      );

      setAnnouncements(
        noticeData || []
      );

      setEvents(
        eventData || []
      );

      setSchoolData(
        genericMap
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
        'School data load नहीं हुआ'
      );
    } finally {
      setLoading(false);
    }
  }

  const tabs: {
    id: Tab;
    label: string;
    icon: string;
  }[] = [
    {
      id: 'info',
      label: 'School Info',
      icon: '🏫',
    },
    {
      id: 'students',
      label: `Students (${schoolData.students?.length || 0})`,
      icon: '👨‍🎓',
    },
    {
      id: 'teachers',
      label: `Teachers (${teachers.length})`,
      icon: '👨‍🏫',
    },
    {
      id: 'classes',
      label: `Classes (${schoolData.classes?.length || 0})`,
      icon: '📚',
    },
    {
      id: 'results',
      label: `Results (${schoolData.results?.length || 0})`,
      icon: '📝',
    },
    {
      id: 'homework',
      label: `Homework (${schoolData.homework?.length || 0})`,
      icon: '📖',
    },
    {
      id: 'attendance',
      label: `Attendance (${schoolData.attendance?.length || 0})`,
      icon: '📅',
    },
    {
      id: 'notices',
      label: `Notices (${announcements.length})`,
      icon: '📢',
    },
    {
      id: 'events',
      label: `Events (${events.length})`,
      icon: '🎉',
    },
    {
      id: 'gallery',
      label: `Gallery (${schoolData.gallery?.length || 0})`,
      icon: '🖼️',
    },
    {
      id: 'documents',
      label: `Documents (${schoolData.documents?.length || 0})`,
      icon: '📄',
    },
    {
      id: 'staff',
      label: `Staff Access (${memberships.length})`,
      icon: '👥',
    },
    {
      id: 'subscription',
      label: 'Subscription',
      icon: '💳',
    },
  ];

  const counts = useMemo(
    () => ({
      students:
        schoolData.students?.length || 0,

      teachers:
        teachers.length,

      classes:
        schoolData.classes?.length || 0,

      results:
        schoolData.results?.length || 0,

      homework:
        schoolData.homework?.length || 0,

      attendance:
        schoolData.attendance?.length || 0,

      notices:
        announcements.length,

      events:
        events.length,

      gallery:
        schoolData.gallery?.length || 0,

      documents:
        schoolData.documents?.length || 0,

      staff:
        memberships.length,
    }),
    [
      schoolData,
      teachers,
      announcements,
      events,
      memberships,
    ]
  );

  if (loading) {
    return (
      <PageMessage
        icon="⏳"
        title="School data loading..."
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6">

        <button
          onClick={() =>
            navigate('/admin')
          }
          className="mb-6 rounded-xl bg-white/10 px-4 py-2 hover:bg-white/20"
        >
          ← Back to All Schools
        </button>

        <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-6">

          <h2 className="text-xl font-bold mb-2">
            Data Load Error
          </h2>

          <p>
            {error}
          </p>

        </div>
      </div>
    );
  }

  if (!school) {
    return (
      <PageMessage
        icon="🏫"
        title="School नहीं मिला।"
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* HEADER */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/95 backdrop-blur">

        <div className="max-w-7xl mx-auto px-4 py-4">

          <button
            onClick={() =>
              navigate('/admin')
            }
            className="mb-4 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2"
          >
            ← Back to All Schools
          </button>

          <div className="flex flex-col md:flex-row md:items-center gap-4">

            {school.logoUrl ||
            school.logo ? (

              <img
                src={
                  school.logoUrl ||
                  school.logo
                }
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

              <p className="text-xs text-slate-500 mt-1">
                School ID: {school.id}
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

      <div className="max-w-7xl mx-auto px-4 py-5">

        {/* SUMMARY */}
        <SummaryCards
          counts={counts}
        />

        {/* TABS */}
        <div className="flex gap-2 overflow-x-auto pb-3 mt-5">

          {tabs.map((tab) => (

            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id)
              }
              className={`whitespace-nowrap rounded-xl px-4 py-3 font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {tab.icon}{' '}
              {tab.label}
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

          {activeTab === 'teachers' && (
            <TeachersSection
              teachers={teachers}
            />
          )}

          {activeTab === 'notices' && (
            <NoticesSection
              announcements={
                announcements
              }
            />
          )}

          {activeTab === 'events' && (
            <EventsSection
              events={events}
            />
          )}

          {activeTab === 'staff' && (
            <StaffSection
              memberships={
                memberships
              }
            />
          )}

          {activeTab ===
            'subscription' && (
            <SubscriptionSection
              school={school}
            />
          )}

          {activeTab in
            collectionConfig && (
            <CollectionSection
              title={
                collectionConfig[
                  activeTab as keyof typeof collectionConfig
                ].title
              }
              icon={
                collectionConfig[
                  activeTab as keyof typeof collectionConfig
                ].icon
              }
              rows={
                schoolData[
                  activeTab
                ] || []
              }
            />
          )}

        </div>
      </div>
    </div>
  );
}

/* =========================================================
   LOADING / ERROR
========================================================= */

function PageMessage({
  icon,
  title,
}: {
  icon: string;
  title: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">

      <div className="text-center">

        <div className="text-5xl mb-4">
          {icon}
        </div>

        <h2 className="text-xl font-bold">
          {title}
        </h2>

      </div>
    </div>
  );
}

/* =========================================================
   SUMMARY CARDS
========================================================= */

function SummaryCards({
  counts,
}: {
  counts: Record<
    string,
    number
  >;
}) {

  const cards = [
    ['👨‍🎓', 'Students', counts.students],
    ['👨‍🏫', 'Teachers', counts.teachers],
    ['📚', 'Classes', counts.classes],
    ['📝', 'Results', counts.results],
    ['📖', 'Homework', counts.homework],
    ['📅', 'Attendance', counts.attendance],
    ['📢', 'Notices', counts.notices],
    ['🖼️', 'Gallery', counts.gallery],
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">

      {cards.map(
        ([icon, label, value]) => (

          <div
            key={String(label)}
            className="rounded-2xl bg-white/5 border border-white/10 p-4"
          >

            <div className="text-2xl">
              {icon}
            </div>

            <div className="text-2xl font-black mt-2">
              {value}
            </div>

            <div className="text-xs text-slate-400">
              {label}
            </div>

          </div>

        )
      )}

    </div>
  );
}

/* =========================================================
   SCHOOL INFORMATION
========================================================= */

function InfoSection({
  school,
  schoolInfo,
}: {
  school: any;
  schoolInfo: any;
}) {

  const data =
    schoolInfo || school;

  const fields =
    Object.entries(data || {})
      .filter(
        ([key]) =>
          key !== 'id'
      )
      .sort(
        ([a], [b]) =>
          a.localeCompare(b)
      );

  return (
    <section className="rounded-2xl bg-white/5 border border-white/10 p-5">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-5">

        <div>

          <h2 className="text-2xl font-bold">
            🏫 Complete School Information
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            School के Firebase document की सभी available जानकारी
          </p>

        </div>

        <span className="rounded-full bg-blue-500/10 text-blue-300 px-3 py-1 text-xs font-bold">
          {fields.length} FIELDS
        </span>

      </div>

      <div className="grid md:grid-cols-2 gap-4">

        {fields.map(
          ([label, value]) => (
            <DataBox
              key={label}
              label={humanize(label)}
              value={value}
            />
          )
        )}

      </div>

    </section>
  );
}

/* =========================================================
   TEACHERS
========================================================= */

function TeachersSection({
  teachers,
}: {
  teachers: any[];
}) {

  return (
    <CollectionSection
      title="Teachers"
      icon="👨‍🏫"
      rows={teachers}
      preferredFields={[
        'name',
        'displayName',
        'email',
        'phone',
        'assignedClass',
        'class',
        'subject',
        'status',
        'uid',
      ]}
    />
  );
}

/* =========================================================
   NOTICES
========================================================= */

function NoticesSection({
  announcements,
}: {
  announcements: any[];
}) {

  return (
    <CollectionSection
      title="Notices / Announcements"
      icon="📢"
      rows={announcements}
      preferredFields={[
        'title',
        'content',
        'message',
        'date',
        'status',
        'createdAt',
        'updatedAt',
      ]}
    />
  );
}

/* =========================================================
   EVENTS
========================================================= */

function EventsSection({
  events,
}: {
  events: any[];
}) {

  return (
    <CollectionSection
      title="Events"
      icon="🎉"
      rows={events}
      preferredFields={[
        'title',
        'description',
        'date',
        'startDate',
        'endDate',
        'location',
        'status',
        'createdAt',
      ]}
    />
  );
}

/* =========================================================
   STAFF
========================================================= */

function StaffSection({
  memberships,
}: {
  memberships: any[];
}) {

  return (
    <CollectionSection
      title="Staff Access"
      icon="👥"
      rows={memberships}
      preferredFields={[
        'email',
        'uid',
        'role',
        'status',
        'createdAt',
        'updatedAt',
      ]}
    />
  );
}

/* =========================================================
   GENERIC COLLECTION
========================================================= */

function CollectionSection({
  title,
  icon,
  rows,
  preferredFields = [],
}: {
  title: string;
  icon: string;
  rows: any[];
  preferredFields?: string[];
}) {

  const [
    expanded,
    setExpanded,
  ] =
    useState<string | null>(
      null
    );

  const [
    search,
    setSearch,
  ] =
    useState('');

  const filteredRows =
    useMemo(() => {

      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return rows;
      }

      return rows.filter(
        (row) =>
          JSON.stringify(
            row
          )
            .toLowerCase()
            .includes(term)
      );

    }, [rows, search]);

  if (!rows.length) {

    return (
      <section className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center">

        <div className="text-5xl mb-4">
          {icon}
        </div>

        <h2 className="text-2xl font-bold mb-2">
          {title}
        </h2>

        <p className="text-slate-400">
          इस school में अभी कोई data नहीं मिला।
        </p>

        <p className="text-xs text-slate-500 mt-2">
          Data selected school के schoolId के अनुसार खोजा गया है।
        </p>

      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white/5 border border-white/10 p-5">

      {/* TITLE */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">

        <div>

          <h2 className="text-2xl font-bold">
            {icon} {title}
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            Total records: {rows.length}
          </p>

        </div>

        <span className="rounded-full bg-green-500/10 text-green-400 px-3 py-1 text-xs font-bold">
          SCHOOL DATA ONLY
        </span>

      </div>

      {/* SEARCH */}
      <div className="mb-5">

        <input
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          placeholder={`🔎 Search ${title}...`}
          className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-blue-500"
        />

        {search && (
          <p className="text-xs text-slate-500 mt-2">
            Showing {filteredRows.length} of {rows.length} records
          </p>
        )}

      </div>

      {/* RECORDS */}
      <div className="space-y-3">

        {filteredRows.map(
          (row, index) => {

            const key =
              String(
                row.id ||
                index
              );

            const fields =
              getDisplayFields(
                row,
                preferredFields
              );

            const isOpen =
              expanded === key;

            return (
              <div
                key={key}
                className="rounded-xl bg-black/20 border border-white/10 overflow-hidden"
              >

                <button
                  onClick={() =>
                    setExpanded(
                      isOpen
                        ? null
                        : key
                    )
                  }
                  className="w-full text-left p-4 hover:bg-white/5"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div className="min-w-0 flex-1">

                      <div className="font-bold truncate">
                        {getRecordTitle(
                          row,
                          index
                        )}
                      </div>

                      <div className="text-xs text-slate-500 mt-1">
                        ID: {row.id || '—'}
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">

                        {fields
                          .slice(
                            0,
                            3
                          )
                          .map(
                            ([
                              label,
                              value,
                            ]) => (

                              <span
                                key={
                                  label
                                }
                                className="text-xs rounded-lg bg-white/5 px-2 py-1 text-slate-300"
                              >
                                {label}:{' '}
                                {formatValue(
                                  value
                                )}
                              </span>

                            )
                          )}

                      </div>

                    </div>

                    <span className="text-xl">
                      {isOpen
                        ? '🔼'
                        : '🔽'}
                    </span>

                  </div>

                </button>

                {isOpen && (

                  <div className="border-t border-white/10 p-4">

                    <div className="flex items-center justify-between mb-4">

                      <h3 className="font-bold text-lg">
                        Complete Record
                      </h3>

                      <span className="text-xs text-green-400">
                        All available fields
                      </span>

                    </div>

                    <div className="grid md:grid-cols-2 gap-3">

                      {fields.map(
                        ([
                          label,
                          value,
                        ]) => (

                          <DataBox
                            key={
                              label
                            }
                            label={
                              label
                            }
                            value={
                              value
                            }
                          />

                        )
                      )}

                    </div>

                  </div>

                )}

              </div>
            );
          }
        )}

        {!filteredRows.length && (

          <div className="text-center py-10 text-slate-400">
            🔎 कोई matching record नहीं मिला।
          </div>

        )}

      </div>

    </section>
  );
}

/* =========================================================
   FIELD DISPLAY
========================================================= */

function getDisplayFields(
  row: RecordMap,
  preferredFields: string[]
): [string, any][] {

  const entries =
    Object.entries(row)
      .filter(
        ([key]) =>
          key !== 'schoolId'
      );

  const preferred =
    preferredFields
      .filter(
        (field) =>
          Object.prototype.hasOwnProperty.call(
            row,
            field
          )
      )
      .map(
        (field) =>
          [
            humanize(field),
            row[field],
          ] as [
            string,
            any
          ]
      );

  const used =
    new Set(
      preferredFields
    );

  const rest =
    entries
      .filter(
        ([key]) =>
          !used.has(key)
      )
      .map(
        ([key, value]) =>
          [
            humanize(key),
            value,
          ] as [
            string,
            any
          ]
      );

  return [
    ...preferred,
    ...rest,
  ];
}

/* =========================================================
   RECORD TITLE
========================================================= */

function getRecordTitle(
  row: RecordMap,
  index: number
) {

  return (
    row.name ||
    row.title ||
    row.studentName ||
    row.teacherName ||
    row.displayName ||
    row.subject ||
    row.className ||
    row.class ||
    row.email ||
    `Record ${index + 1}`
  );
}

/* =========================================================
   HUMANIZE FIELD NAME
========================================================= */

function humanize(
  value: string
) {

  return value
    .replace(
      /([a-z])([A-Z])/g,
      '$1 $2'
    )
    .replace(
      /[_-]+/g,
      ' '
    )
    .replace(
      /\b\w/g,
      (c) =>
        c.toUpperCase()
    );
}

/* =========================================================
   DATA BOX
========================================================= */

function DataBox({
  label,
  value,
}: {
  label: string;
  value: any;
}) {

  return (
    <div className="rounded-xl bg-black/20 border border-white/5 p-4 min-w-0">

      <div className="text-sm text-slate-400">
        {label}
      </div>

      <div className="font-bold mt-1 break-words whitespace-pre-wrap">
        {formatValue(
          value
        )}
      </div>

    </div>
  );
}

/* =========================================================
   SUBSCRIPTION
========================================================= */

function SubscriptionSection({
  school,
}: {
  school: any;
}) {

  const values = [

    [
      'Subscription Status',
      school.subscriptionStatus,
    ],

    [
      'Payment Status',
      school.paymentStatus,
    ],

    [
      'Approval Type',
      school.paymentApprovalType ||
      school.approvalType,
    ],

    [
      'Plan',
      school.subscriptionPlan,
    ],

    [
      'Amount',
      school.paymentAmount ??
      school.subscriptionAmount,
    ],

    [
      'Days',
      school.subscriptionDays,
    ],

    [
      'Start',
      school.subscriptionStartDate ||
      school.subscriptionStart,
    ],

    [
      'Expiry',
      school.subscriptionExpiryDate ||
      school.subscriptionExpiry,
    ],

    [
      'Payment ID / UTR',
      school.paymentId,
    ],

    [
      'Payment Date',
      school.paymentDate,
    ],

    [
      'Approved By UID',
      school.approvedByUid,
    ],

    [
      'Approved At',
      school.approvedAt,
    ],

    [
      'Suspended At',
      school.suspendedAt,
    ],

    [
      'Suspension Reason',
      school.suspensionReason,
    ],

  ];

  return (
    <section className="rounded-2xl bg-white/5 border border-white/10 p-5">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">

        <div>

          <h2 className="text-2xl font-bold">
            💳 Complete Subscription & Payment
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            इस school की subscription और payment information
          </p>

        </div>

        <span className="rounded-full bg-purple-500/10 text-purple-300 px-3 py-1 text-xs font-bold">
          SUPER ADMIN
        </span>

      </div>

      <div className="grid md:grid-cols-2 gap-4">

        {values.map(
          ([
            label,
            value,
          ]) => (

            <DataBox
              key={label}
              label={label}
              value={value}
            />

          )
        )}

      </div>

    </section>
  );
}

/* =========================================================
   FORMAT VALUE
========================================================= */

function formatValue(
  value: any
): string {

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—';
  }

  if (
    typeof value?.toDate ===
    'function'
  ) {

    return value
      .toDate()
      .toLocaleString(
        'en-IN'
      );
  }

  if (
    value instanceof Date
  ) {

    return value.toLocaleString(
      'en-IN'
    );
  }

  if (
    Array.isArray(value)
  ) {

    return value
      .map(
        (item) =>
          formatValue(
            item
          )
      )
      .join(', ');
  }

  if (
    typeof value ===
    'object'
  ) {

    try {

      return JSON.stringify(
        value,
        null,
        2
      );

    } catch {

      return '[Object]';

    }
  }

  return String(value);
}
```
