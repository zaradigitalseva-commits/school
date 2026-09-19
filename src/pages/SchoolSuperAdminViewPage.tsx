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
  subscribeToSchool,
  subscribeToSchoolCollection,
  subscribeToSchoolMemberships,
  subscribeToTeachers,
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

type AnyRecord = Record<string, any>;

interface SchoolData {
  id?: string;
  name?: string;
  slug?: string;
  logoUrl?: string;
  imageUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  status?: string;
  paymentStatus?: string;
  subscriptionStatus?: string;
  subscriptionExpiry?: any;
  createdAt?: any;

  students?: AnyRecord[];
  classes?: AnyRecord[];
  results?: AnyRecord[];
  homework?: AnyRecord[];
  attendance?: AnyRecord[];
  gallery?: AnyRecord[];
  documents?: AnyRecord[];

  [key: string]: any;
}

interface Teacher {
  id?: string;
  uid?: string;
  name?: string;
  email?: string;
  phone?: string;
  assignedClass?: string;
  className?: string;
  role?: string;
  schoolId?: string;
  status?: string;
  [key: string]: any;
}

interface Membership {
  id?: string;
  uid?: string;
  email?: string;
  displayName?: string;
  name?: string;
  role?: string;
  status?: string;
  schoolId?: string;
  createdAt?: any;
  [key: string]: any;
}

interface Notice {
  id?: string;
  title?: string;
  message?: string;
  description?: string;
  date?: any;
  createdAt?: any;
  [key: string]: any;
}

interface SchoolEvent {
  id?: string;
  title?: string;
  description?: string;
  date?: any;
  eventDate?: any;
  createdAt?: any;
  [key: string]: any;
}

interface CollectionConfig {
  title: string;
  icon: string;
}

const collectionConfig: Record<
  'students' | 'classes' | 'results' | 'homework' | 'attendance' | 'gallery' | 'documents',
  CollectionConfig
> = {
  students: {
    title: 'Students',
    icon: '👨‍🎓',
  },
  classes: {
    title: 'Classes',
    icon: '🏫',
  },
  results: {
    title: 'Results',
    icon: '📊',
  },
  homework: {
    title: 'Homework',
    icon: '📝',
  },
  attendance: {
    title: 'Attendance',
    icon: '📅',
  },
  gallery: {
    title: 'Gallery',
    icon: '🖼️',
  },
  documents: {
    title: 'Documents',
    icon: '📄',
  },
};

function humanize(value: string) {
  return value
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function formatValue(value: any): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (value?.toDate instanceof Function) {
    try {
      return value.toDate().toLocaleString();
    } catch {
      return String(value);
    }
  }

  if (value instanceof Date) {
    return value.toLocaleString();
  }

  if (Array.isArray(value)) {
    if (!value.length) {
      return '—';
    }

    return value
      .map((item) =>
        typeof item === 'object'
          ? JSON.stringify(item)
          : String(item)
      )
      .join(', ');
  }

  if (typeof value === 'object') {
    if (value.seconds !== undefined) {
      try {
        return new Date(value.seconds * 1000).toLocaleString();
      } catch {
        return JSON.stringify(value);
      }
    }

    return JSON.stringify(value);
  }

  return String(value);
}

function getRecordTitle(record: AnyRecord, index: number) {
  return (
    record.name ||
    record.studentName ||
    record.teacherName ||
    record.title ||
    record.subject ||
    record.className ||
    record.fileName ||
    record.id ||
    `Record ${index + 1}`
  );
}

function getDisplayFields(record: AnyRecord) {
  const hidden = new Set([
    'id',
    'uid',
    'schoolId',
    'ownerUid',
    'ownerEmail',
  ]);

  return Object.entries(record).filter(
    ([key]) => !hidden.has(key)
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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="break-words text-sm font-medium text-slate-900">
        {formatValue(value)}
      </div>
    </div>
  );
}

function SummaryCards({
  schoolData,
  teachers,
  memberships,
}: {
  schoolData: SchoolData;
  teachers: Teacher[];
  memberships: Membership[];
}) {
  const cards = [
    {
      label: 'Students',
      value: schoolData.students?.length || 0,
      icon: '👨‍🎓',
    },
    {
      label: 'Teachers',
      value: teachers.length,
      icon: '👩‍🏫',
    },
    {
      label: 'Classes',
      value: schoolData.classes?.length || 0,
      icon: '🏫',
    },
    {
      label: 'Staff',
      value: memberships.length,
      icon: '👥',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md"
        >
          <div className="mb-2 text-3xl">{card.icon}</div>

          <div className="text-2xl font-bold text-slate-900">
            {card.value}
          </div>

          <div className="text-sm font-medium text-slate-500">
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}




function getSubscriptionExpiry(
  schoolData: SchoolData,
  schoolInfo: AnyRecord | null
) {
  return (
    schoolData.subscriptionExpiryDate ??
    schoolData.subscriptionExpiry ??
    schoolInfo?.subscriptionExpiryDate ??
    schoolInfo?.subscriptionExpiry ??
    null
  );
}

function InfoSection({
  schoolData,
  schoolInfo,
}: {
  schoolData: SchoolData;
  schoolInfo: AnyRecord | null;
}) {
  const info = schoolInfo || schoolData;
  const subscriptionExpiry = getSubscriptionExpiry(
    schoolData,
    schoolInfo
  );

  const fields = [
    ['School Name', info.name],
    ['Slug', info.slug],
    ['Owner Email', info.ownerEmail],
    ['School Email', info.email],
    ['Phone', info.phone],
    ['WhatsApp', info.whatsappNumber],
    ['Address', info.address],
    ['City', info.city],
    ['State', info.state],
    ['Status', info.status],
    ['Payment Status', info.paymentStatus],
    ['Subscription Status', info.subscriptionStatus],
    ['Subscription Plan', info.subscriptionPlan],
    ['Subscription Days', info.subscriptionDays],
    ['Subscription Start', info.subscriptionStartDate],
    ['Subscription Expiry', subscriptionExpiry],
    ['Payment Amount', info.paymentAmount !== undefined ? `₹${info.paymentAmount}` : undefined],
    ['Payment ID / UTR', info.paymentId],
    ['Payment Date', info.paymentDate],
    ['Approval Type', info.paymentApprovalType],
  ];

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          School Information
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Complete information of this school.
        </p>
      </div>

      {info.logoUrl && (
        <div className="flex justify-center">
          <img
            src={info.logoUrl}
            alt={info.name || 'School logo'}
            className="h-28 w-28 rounded-2xl object-cover shadow-lg"
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {fields.map(([label, value]) => (
          <DataBox
            key={label}
            label={label}
            value={value}
          />
        ))}
      </div>

      {info.description && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-2 font-bold text-slate-900">
            Description
          </h3>

          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
            {info.description}
          </p>
        </div>
      )}
    </section>
  );
}

function TeachersSection({
  teachers,
}: {
  teachers: Teacher[];
}) {
  if (!teachers.length) {
    return (
      <section>
        <h2 className="mb-4 text-2xl font-bold text-slate-900">
          Teachers
        </h2>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
          No teachers found.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Teachers
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Teachers registered in this school.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {teachers.map((teacher, index) => (
          <div
            key={teacher.id || teacher.uid || index}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md"
          >
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">
                👩‍🏫
              </div>

              <div className="min-w-0">
                <h3 className="truncate font-bold text-slate-900">
                  {teacher.name ||
                    teacher.displayName ||
                    'Teacher'}
                </h3>

                <p className="truncate text-sm text-slate-500">
                  {teacher.email || 'No email'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <DataBox
                label="Assigned Class"
                value={
                  teacher.assignedClass ||
                  teacher.className ||
                  'Not assigned'
                }
              />

              <DataBox
                label="Phone"
                value={teacher.phone}
              />

              <DataBox
                label="Role"
                value={teacher.role || 'teacher'}
              />

              <DataBox
                label="Status"
                value={teacher.status || 'ACTIVE'}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function NoticesSection({
  notices,
}: {
  notices: Notice[];
}) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Notices
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          School announcements and notices.
        </p>
      </div>

      {!notices.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
          No notices found.
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((notice, index) => (
            <div
              key={notice.id || index}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md"
            >
              <h3 className="text-lg font-bold text-slate-900">
                {notice.title || 'Notice'}
              </h3>

              {(notice.date || notice.createdAt) && (
                <p className="mt-1 text-xs text-slate-500">
                  {formatValue(
                    notice.date || notice.createdAt
                  )}
                </p>
              )}

              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {notice.message ||
                  notice.description ||
                  'No description'}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EventsSection({
  events,
}: {
  events: SchoolEvent[];
}) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Events
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          School events and activities.
        </p>
      </div>

      {!events.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
          No events found.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {events.map((event, index) => (
            <div
              key={event.id || index}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl">
                  📅
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    {event.title || 'Event'}
                  </h3>

                  {(event.date || event.eventDate) && (
                    <p className="text-xs text-slate-500">
                      {formatValue(
                        event.date || event.eventDate
                      )}
                    </p>
                  )}
                </div>
              </div>

              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {event.description ||
                  event.message ||
                  'No description'}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function StaffSection({
  memberships,
}: {
  memberships: Membership[];
}) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Staff Access
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Users and roles connected with this school.
        </p>
      </div>

      {!memberships.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
          No staff members found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-md">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-5 py-4 font-bold text-slate-700">
                  Name
                </th>

                <th className="px-5 py-4 font-bold text-slate-700">
                  Email
                </th>

                <th className="px-5 py-4 font-bold text-slate-700">
                  Role
                </th>

                <th className="px-5 py-4 font-bold text-slate-700">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {memberships.map((member, index) => (
                <tr
                  key={member.id || member.uid || index}
                  className="border-b last:border-b-0"
                >
                  <td className="px-5 py-4 font-medium text-slate-900">
                    {member.name ||
                      member.displayName ||
                      'User'}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {member.email || '—'}
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {member.role || '—'}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {member.status || 'ACTIVE'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SubscriptionSection({
  schoolData,
}: {
  schoolData: SchoolData;
}) {
  const expiry = getSubscriptionExpiry(
    schoolData,
    null
  );

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Subscription & Payment
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Current plan, payment and validity information.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DataBox label="School Status" value={schoolData.status} />
        <DataBox label="Payment Status" value={schoolData.paymentStatus} />
        <DataBox label="Subscription Status" value={schoolData.subscriptionStatus} />
        <DataBox label="Subscription Plan" value={schoolData.subscriptionPlan} />
        <DataBox
          label="Subscription Days"
          value={schoolData.subscriptionDays ? `${schoolData.subscriptionDays} days` : undefined}
        />
        <DataBox label="Subscription Start" value={schoolData.subscriptionStartDate} />
        <DataBox label="Subscription Expiry" value={expiry} />
        <DataBox
          label="Payment Amount"
          value={schoolData.paymentAmount !== undefined ? `₹${schoolData.paymentAmount}` : undefined}
        />
        <DataBox label="Payment ID / UTR" value={schoolData.paymentId} />
        <DataBox label="Payment Date" value={schoolData.paymentDate} />
        <DataBox label="Approval Type" value={schoolData.paymentApprovalType} />
        <DataBox label="Approved At" value={schoolData.approvedAt} />
      </div>
    </section>
  );
}

function CollectionSection({
  title,
  icon,
  rows,
}: {
  title: string;
  icon: string;
  rows: AnyRecord[];
}) {
  const [search, setSearch] = useState('');

  const filteredRows = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return rows;
    }

    return rows.filter((row) =>
      JSON.stringify(row)
        .toLowerCase()
        .includes(value)
    );
  }, [rows, search]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {icon} {title}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Total records: {rows.length}
          </p>
        </div>

        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder={`Search ${title.toLowerCase()}...`}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 md:w-72"
        />
      </div>

      {!filteredRows.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
          No {title.toLowerCase()} found.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {filteredRows.map((row, index) => (
            <div
              key={row.id || index}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md"
            >
              <h3 className="mb-4 text-lg font-bold text-slate-900">
                {getRecordTitle(row, index)}
              </h3>

              <div className="grid gap-3">
                {getDisplayFields(row).map(
                  ([key, value]) => (
                    <DataBox
                      key={key}
                      label={humanize(key)}
                      value={value}
                    />
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}






export default function SchoolSuperAdminViewPage() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] =
    useState<Tab>('info');

  const [schoolData, setSchoolData] =
    useState<SchoolData | null>(null);

  const [schoolInfo, setSchoolInfo] =
    useState<AnyRecord | null>(null);

  const [teachers, setTeachers] =
    useState<Teacher[]>([]);

  const [memberships, setMemberships] =
    useState<Membership[]>([]);

  const [notices, setNotices] =
    useState<Notice[]>([]);

  const [events, setEvents] =
    useState<SchoolEvent[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [collectionLoading, setCollectionLoading] =
    useState(false);

  useEffect(() => {
    if (!schoolId) {
      setError('School ID is missing.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadSchool() {
      try {
        setLoading(true);
        setError('');

        const [
          school,
          info,
          schoolMemberships,
          schoolTeachers,
          announcements,
          schoolEvents,
        ] = await Promise.all([
          fetchSchoolById(schoolId),
          fetchSchoolInfo(schoolId),
          fetchSchoolMemberships(schoolId),
          fetchTeachers(schoolId),
          fetchAnnouncements(schoolId),
          fetchEvents(schoolId),
        ]);

        if (cancelled) {
          return;
        }

        setSchoolData(
          (school || {
            id: schoolId,
          }) as SchoolData
        );

        setSchoolInfo(
          (info || null) as AnyRecord | null
        );

        setMemberships(
          Array.isArray(schoolMemberships)
            ? (schoolMemberships as Membership[])
            : []
        );

        setTeachers(
          Array.isArray(schoolTeachers)
            ? (schoolTeachers as Teacher[])
            : []
        );

        setNotices(
          Array.isArray(announcements)
            ? (announcements as Notice[])
            : []
        );

        setEvents(
          Array.isArray(schoolEvents)
            ? (schoolEvents as SchoolEvent[])
            : []
        );

        const collectionNames = [
          'students',
          'classes',
          'results',
          'homework',
          'attendance',
          'gallery',
          'documents',
        ] as const;

        const collectionResults =
          await Promise.all(
            collectionNames.map(async (name) => {
              try {
                const records =
                  await fetchSchoolCollection(
                    schoolId,
                    name
                  );

                return [
                  name,
                  Array.isArray(records)
                    ? records
                    : [],
                ] as const;
              } catch {
                return [name, []] as const;
              }
            })
          );

        if (cancelled) {
          return;
        }

        setSchoolData((previous) => {
          const next: SchoolData = {
            ...(previous || {}),
          };

          for (const [name, records] of collectionResults) {
            next[name] = records;
          }

          return next;
        });
      } catch (err: any) {
        if (cancelled) {
          return;
        }

        console.error(
          'SchoolSuperAdminViewPage load error:',
          err
        );

        setError(
          err?.message ||
            'Unable to load school information.'
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSchool();

    return () => {
      cancelled = true;
    };
  }, [schoolId]);

  /* =========================================================
     REALTIME SUPER ADMIN SCHOOL SYNC
  ========================================================= */
  useEffect(() => {
    if (!schoolId) return;
    const handleError = (error: Error) => console.error('Super Admin realtime error:', error);

    const unsubSchool = subscribeToSchool(schoolId, (data) => {
      if (data) setSchoolData(data as SchoolData);
    }, handleError);
    const unsubMembers = subscribeToSchoolMemberships(schoolId, (data) => {
      setMemberships(data as Membership[]);
    }, handleError);
    const unsubTeachers = subscribeToTeachers(schoolId, (data) => {
      setTeachers(data as Teacher[]);
    }, handleError);

    const collectionNames = ['students', 'classes', 'results', 'homework', 'attendance', 'gallery', 'documents', 'announcements', 'events'];
    const unsubs = collectionNames.map((name) =>
      subscribeToSchoolCollection(schoolId, name, (records) => {
        if (name === 'announcements') {
          setNotices(records as Notice[]);
        } else if (name === 'events') {
          setEvents(records as SchoolEvent[]);
        } else {
          setSchoolData((previous) => ({ ...(previous || { id: schoolId }), [name]: records } as SchoolData));
        }
      }, handleError)
    );

    return () => {
      unsubSchool();
      unsubMembers();
      unsubTeachers();
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, [schoolId]);

  useEffect(() => {
    if (
      !schoolId ||
      !collectionConfig[
        activeTab as keyof typeof collectionConfig
      ]
    ) {
      return;
    }

    let cancelled = false;

    async function reloadCollection() {
      try {
        setCollectionLoading(true);

        const records =
          await fetchSchoolCollection(
            schoolId,
            activeTab
          );

        if (cancelled) {
          return;
        }

        setSchoolData((previous) => ({
          ...(previous || {}),
          [activeTab]: Array.isArray(records)
            ? records
            : [],
        }));
      } catch (err) {
        console.error(
          'Collection loading error:',
          err
        );
      } finally {
        if (!cancelled) {
          setCollectionLoading(false);
        }
      }
    }

    reloadCollection();

    return () => {
      cancelled = true;
    };
  }, [activeTab, schoolId]);

  const tabs = useMemo(
    () => [
      {
        id: 'info' as Tab,
        label: 'School Info',
        icon: '🏫',
      },
      {
        id: 'students' as Tab,
        label: `Students (${schoolData?.students?.length || 0})`,
        icon: '👨‍🎓',
      },
      {
        id: 'teachers' as Tab,
        label: `Teachers (${teachers.length})`,
        icon: '👩‍🏫',
      },
      {
        id: 'classes' as Tab,
        label: `Classes (${schoolData?.classes?.length || 0})`,
        icon: '📚',
      },
      {
        id: 'results' as Tab,
        label: `Results (${schoolData?.results?.length || 0})`,
        icon: '📊',
      },
      {
        id: 'homework' as Tab,
        label: `Homework (${schoolData?.homework?.length || 0})`,
        icon: '📝',
      },
      {
        id: 'attendance' as Tab,
        label: `Attendance (${schoolData?.attendance?.length || 0})`,
        icon: '📅',
      },
      {
        id: 'notices' as Tab,
        label: `Notices (${notices.length})`,
        icon: '📢',
      },
      {
        id: 'events' as Tab,
        label: `Events (${events.length})`,
        icon: '🎉',
      },
      {
        id: 'gallery' as Tab,
        label: `Gallery (${schoolData?.gallery?.length || 0})`,
        icon: '🖼️',
      },
      {
        id: 'documents' as Tab,
        label: `Documents (${schoolData?.documents?.length || 0})`,
        icon: '📄',
      },
      {
        id: 'staff' as Tab,
        label: `Staff (${memberships.length})`,
        icon: '👥',
      },
      {
        id: 'subscription' as Tab,
        label: 'Subscription',
        icon: '💳',
      },
    ],
    [
      schoolData,
      teachers.length,
      notices.length,
      events.length,
      memberships.length,
    ]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-2xl bg-white px-8 py-10 text-center shadow-lg">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />

          <h2 className="text-lg font-bold text-slate-900">
            Loading School...
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Please wait.
          </p>
        </div>
      </div>
    );
  }

  if (error && !schoolData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg">
          <div className="mb-4 text-5xl">⚠️</div>

          <h2 className="text-xl font-bold text-slate-900">
            Unable to Load School
          </h2>

          <p className="mt-3 text-sm text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:scale-[1.02]"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!schoolData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="mb-3 text-5xl">🏫</div>

          <h2 className="text-xl font-bold text-slate-900">
            School Not Found
          </h2>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const collectionTab =
    collectionConfig[
      activeTab as keyof typeof collectionConfig
    ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {schoolData.logoUrl ? (
              <img
                src={schoolData.logoUrl}
                alt={schoolData.name || 'School'}
                className="h-12 w-12 rounded-xl object-cover shadow"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-2xl text-white">
                🏫
              </div>
            )}

            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-slate-900 md:text-xl">
                {schoolData.name || 'School'}
              </h1>

              <p className="truncate text-xs text-slate-500">
                School Super Admin View
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:scale-[1.02]"
          >
            ← Back
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {/* School heading */}
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-slate-300">
                School Dashboard
              </p>

              <h2 className="text-2xl font-extrabold md:text-3xl">
                {schoolData.name || 'School'}
              </h2>

              {schoolData.slug && (
                <a
                  href={`/school/${schoolData.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-slate-200 hover:bg-white/20 hover:text-white"
                >
                  🔗 /school/{schoolData.slug}
                </a>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {schoolData.status && (
                <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur">
                  Status: {schoolData.status}
                </span>
              )}

              {schoolData.subscriptionStatus && (
                <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur">
                  Subscription:{' '}
                  {schoolData.subscriptionStatus}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6">
          <SummaryCards
            schoolData={schoolData}
            teachers={teachers}
            memberships={memberships}
          />
        </div>

        {/* Tabs */}
        <div className="mb-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex min-w-max gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'rounded-xl px-4 py-3 text-sm font-bold transition',
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100',
                ].join(' ')}
              >
                <span className="mr-2">
                  {tab.icon}
                </span>

                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error notice */}
        {error && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="rounded-3xl border border-slate-200 bg-slate-50">
          {activeTab === 'info' && (
            <InfoSection
              schoolData={schoolData}
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
              notices={notices}
            />
          )}

          {activeTab === 'events' && (
            <EventsSection
              events={events}
            />
          )}

          {activeTab === 'staff' && (
            <StaffSection
              memberships={memberships}
            />
          )}

          {activeTab === 'subscription' && (
            <SubscriptionSection
              schoolData={schoolData}
            />
          )}

          {activeTab !== 'info' &&
            activeTab !== 'teachers' &&
            activeTab !== 'notices' &&
            activeTab !== 'events' &&
            activeTab !== 'staff' &&
            activeTab !== 'subscription' &&
            collectionTab && (
              <div className="relative">
                {collectionLoading && (
                  <div className="absolute right-5 top-5 z-10 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow">
                    Loading...
                  </div>
                )}

                <CollectionSection
                  title={collectionTab.title}
                  icon={collectionTab.icon}
                  rows={
                    schoolData[activeTab] || []
                  }
                />
              </div>
            )}
        </div>
      </main>
    </div>
  );
}


