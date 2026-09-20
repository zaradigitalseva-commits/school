import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  subscribeToMyMembership,
  subscribeToMyTeacherProfile,
  subscribeToSchool,
  subscribeToSchoolCollection,
  subscribeToTeacherScopedCollection,
  addHomework,
  updateHomework,
  addResult,
  updateResult,
  addAttendance,
  updateAttendance,
} from '@/firebase/firestore';
import type { School, SchoolMembership } from '@/firebase/types';

type SchoolRow = Record<string, any>;

function getClassName(row: SchoolRow): string {
  return String(
    row.className ??
      row.class ??
      row.assignedClass ??
      row.classId ??
      row.standard ??
      ''
  ).trim();
}

function normalizeClassPart(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/^class\s*/i, '')
    .replace(/^standard\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getRowSection(row: SchoolRow): string {
  return String(
    row.section ??
      row.sectionName ??
      row.division ??
      row.divisionName ??
      ''
  ).trim().toLowerCase();
}

function getAssignmentParts(assignment: string): { className: string; section: string } {
  const raw = normalizeClassPart(assignment);

  // Supports values entered by the admin such as:
  // "Class 5", "Class 5 - A", "5-A", "5 A", "Class 5 A".
  const match = raw.match(/^(.*?)(?:\s*[-/]\s*|\s+)([a-z])$/i);

  if (match) {
    return {
      className: normalizeClassPart(match[1]),
      section: match[2].toLowerCase(),
    };
  }

  return {
    className: raw,
    section: '',
  };
}

function matchesAssignedClass(row: SchoolRow, assignments: string[]): boolean {
  if (!assignments.length) return false;

  const rowClass = normalizeClassPart(getClassName(row));
  const rowSection = getRowSection(row);

  if (!rowClass) return false;

  return assignments.some((assignment) => {
    const wanted = getAssignmentParts(String(assignment));
    if (!wanted.className) return false;

    const classMatches =
      rowClass === wanted.className ||
      rowClass.includes(wanted.className) ||
      wanted.className.includes(rowClass);

    if (!classMatches) return false;

    // If admin assigned a section (A/B/C), the row must have the same section.
    if (wanted.section) {
      return rowSection === wanted.section;
    }

    return true;
  });
}

function formatDate(value: unknown): string {
  if (!value) return '';
  try {
    if (
      typeof value === 'object' &&
      value !== null &&
      'toDate' in value &&
      typeof (value as { toDate?: unknown }).toDate === 'function'
    ) {
      return (value as { toDate: () => Date }).toDate().toLocaleDateString('en-IN');
    }
    const date = new Date(value as string | number);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-IN');
  } catch {
    return '';
  }
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
      <div className="text-3xl">{icon}</div>
      <p className="mt-3 text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-1 break-words text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function DataList({
  title,
  icon,
  rows,
  emptyText,
  renderRow,
}: {
  title: string;
  icon: string;
  rows: SchoolRow[];
  emptyText: string;
  renderRow: (row: SchoolRow) => ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-slate-900">
          {icon} {title}
        </h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
          {rows.length}
        </span>
      </div>

      {rows.length ? (
        <div className="space-y-3">
          {rows.slice(0, 8).map((row) => (
            <div key={String(row.id)} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              {renderRow(row)}
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
          {emptyText}
        </p>
      )}
    </section>
  );
}

function TeacherWorkPanel({
  schoolId,
  assignments,
  students,
  homework,
  results,
  attendance,
}: {
  schoolId: string;
  assignments: string[];
  students: SchoolRow[];
  homework: SchoolRow[];
  results: SchoolRow[];
  attendance: SchoolRow[];
}) {
  const [activeTab, setActiveTab] = useState<'homework' | 'results' | 'attendance'>('homework');
  const [editingId, setEditingId] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState<Record<string, string>>({});

  const classOptions = useMemo(() => {
    const base = Array.from({ length: 12 }, (_, index) => `Class ${index + 1}`);
    const assigned = assignments
      .map((value) => getAssignmentParts(String(value)).className)
      .filter(Boolean)
      .map((value) => /^\d+$/.test(value) ? `Class ${value}` : value);
    const fromStudents = students.map((row) => getClassName(row)).filter(Boolean);
    return Array.from(new Set([...assigned, ...fromStudents, ...base]));
  }, [assignments, students]);

  const assignmentOptions = useMemo(() => {
    if (assignments.length) {
      return assignments.map((value) => {
        const parts = getAssignmentParts(String(value));
        const className = /^\d+$/.test(parts.className) ? `Class ${parts.className}` : parts.className;
        return { value: String(value), className, section: parts.section.toUpperCase() };
      });
    }

    return classOptions.map((className) => ({ value: className, className, section: '' }));
  }, [assignments, classOptions]);

  const filteredStudents = useMemo(() => {
    const className = form.className || '';
    const section = (form.section || '').trim().toLowerCase();
    return students.filter((row) => {
      if (!className) return true;
      const rowClass = normalizeClassPart(getClassName(row));
      const wantedClass = normalizeClassPart(className);
      if (rowClass !== wantedClass && !rowClass.includes(wantedClass) && !wantedClass.includes(rowClass)) return false;
      if (!section) return true;
      return getRowSection(row) === section;
    });
  }, [students, form.className, form.section]);

  const resetForm = () => {
    setEditingId('');
    setForm({});
    setMessage('');
  };

  const startEdit = (type: 'homework' | 'results' | 'attendance', row: SchoolRow) => {
    setActiveTab(type);
    setEditingId(String(row.id || ''));
    setForm({
      title: String(row.title || ''),
      subject: String(row.subject || ''),
      description: String(row.description || row.content || ''),
      dueDate: String(row.dueDate || ''),
      studentName: String(row.studentName || row.name || ''),
      rollNumber: String(row.rollNumber || ''),
      className: String(row.className || ''),
      section: String(row.section || row.sectionName || row.division || ''),
      exam: String(row.exam || ''),
      marks: String(row.marks ?? ''),
      totalMarks: String(row.totalMarks ?? ''),
      grade: String(row.grade || ''),
      date: String(row.date || ''),
      status: String(row.status || row.attendanceStatus || ''),
    });
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applyAssignment = (value: string) => {
    const selected = assignmentOptions.find((item) => item.value === value);
    if (!selected) return;
    setForm((current) => ({
      ...current,
      className: selected.className,
      section: selected.section,
      studentName: '',
      rollNumber: '',
    }));
  };

  const selectStudent = (student: SchoolRow) => {
    setForm((current) => ({
      ...current,
      studentName: String(student.name || student.studentName || ''),
      rollNumber: String(student.rollNumber || ''),
      className: getClassName(student),
      section: getRowSection(student).toUpperCase(),
    }));
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const className = String(form.className || '').trim();
      const section = String(form.section || '').trim();
      if (!className) throw new Error('Class select karna zaroori hai.');

      const common = {
        schoolId,
        className,
        section,
        updatedAt: new Date().toISOString(),
      };

      if (activeTab === 'homework') {
        if (!String(form.title || '').trim()) throw new Error('Homework title bharna zaroori hai.');
        const data = {
          ...common,
          title: String(form.title || '').trim(),
          subject: String(form.subject || '').trim(),
          description: String(form.description || '').trim(),
          dueDate: String(form.dueDate || ''),
        };
        if (editingId) await updateHomework(schoolId, editingId, data);
        else await addHomework(schoolId, { ...data, createdAt: new Date().toISOString() });
      }

      if (activeTab === 'results') {
        if (!String(form.studentName || '').trim()) throw new Error('Student select karna zaroori hai.');
        const data = {
          ...common,
          studentName: String(form.studentName || '').trim(),
          rollNumber: String(form.rollNumber || '').trim(),
          exam: String(form.exam || '').trim(),
          subject: String(form.subject || '').trim(),
          marks: String(form.marks || '').trim(),
          totalMarks: String(form.totalMarks || '').trim(),
          grade: String(form.grade || '').trim(),
        };
        if (editingId) await updateResult(schoolId, editingId, data);
        else await addResult(schoolId, { ...data, createdAt: new Date().toISOString() });
      }

      if (activeTab === 'attendance') {
        if (!String(form.studentName || '').trim()) throw new Error('Student select karna zaroori hai.');
        if (!String(form.date || '').trim()) throw new Error('Attendance date bharna zaroori hai.');
        const data = {
          ...common,
          studentName: String(form.studentName || '').trim(),
          rollNumber: String(form.rollNumber || '').trim(),
          date: String(form.date || ''),
          status: String(form.status || 'Present'),
        };
        if (editingId) await updateAttendance(schoolId, editingId, data);
        else await addAttendance(schoolId, { ...data, createdAt: new Date().toISOString() });
      }

      setMessage(editingId ? '✅ Record update ho gaya.' : '✅ Record save ho gaya.');
      resetForm();
    } catch (error) {
      console.error('Teacher work save error:', error);
      setMessage(`❌ ${error instanceof Error ? error.message : 'Save nahi ho paaya.'}`);
    } finally {
      setSaving(false);
    }
  };

  const visibleRows =
    activeTab === 'homework'
      ? homework.filter((row) => matchesAssignedClass(row, assignments))
      : activeTab === 'results'
        ? results.filter((row) => matchesAssignedClass(row, assignments))
        : attendance.filter((row) => matchesAssignedClass(row, assignments));

  const selectClass = (
    <select
      value={form.className || ''}
      onChange={(event) => {
        const value = event.target.value;
        const option = assignmentOptions.find((item) => item.className === value && !item.section);
        setForm((current) => ({
          ...current,
          className: value,
          section: option?.section || current.section || '',
          studentName: '',
          rollNumber: '',
        }));
      }}
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold outline-none focus:border-blue-500"
      required
    >
      <option value="">Select Class</option>
      {classOptions.map((value) => <option key={value} value={value}>{value}</option>)}
    </select>
  );

  return (
    <section className="mt-6 rounded-3xl bg-white p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900">🧑‍🏫 Teacher Add / Edit Work</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {assignments.length ? `Sirf assigned class/section: ${assignments.join(', ')}` : 'School Admin account: school ki classes available hain.'}
          </p>
        </div>
        {editingId ? (
          <button type="button" onClick={resetForm} className="rounded-xl bg-slate-200 px-4 py-2 font-black text-slate-800">
            Cancel Edit
          </button>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {(['homework', 'results', 'attendance'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => { setActiveTab(tab); resetForm(); }}
            className={`rounded-xl px-4 py-3 font-black ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            {tab === 'homework' ? '📝 Homework' : tab === 'results' ? '📊 Results' : '📅 Attendance'}
          </button>
        ))}
      </div>

      <form onSubmit={save} className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-black text-slate-700">Assigned Class / Section</label>
          {assignments.length ? (
            <select
              value={form.className ? assignmentOptions.find((item) => item.className === form.className && item.section === String(form.section || '').toUpperCase())?.value || '' : ''}
              onChange={(event) => applyAssignment(event.target.value)}
              className="w-full rounded-xl border border-blue-300 bg-blue-50 px-4 py-3 font-black text-slate-900"
              required
            >
              <option value="">Select Assigned Class</option>
              {assignmentOptions.map((item) => <option key={item.value} value={item.value}>{item.value}</option>)}
            </select>
          ) : selectClass}
        </div>

        {!assignments.length && form.className ? (
          <input
            value={form.section || ''}
            onChange={(event) => setForm((current) => ({ ...current, section: event.target.value.toUpperCase() }))}
            placeholder="Section (A/B/C)"
            className="rounded-xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-blue-500"
          />
        ) : null}

        {activeTab === 'homework' ? (
          <>
            <input value={form.title || ''} onChange={(e) => setForm((x) => ({ ...x, title: e.target.value }))} placeholder="Homework Title" className="rounded-xl border border-slate-300 px-4 py-3 font-semibold" required />
            <input value={form.subject || ''} onChange={(e) => setForm((x) => ({ ...x, subject: e.target.value }))} placeholder="Subject" className="rounded-xl border border-slate-300 px-4 py-3 font-semibold" />
            <textarea value={form.description || ''} onChange={(e) => setForm((x) => ({ ...x, description: e.target.value }))} placeholder="Homework Details" className="min-h-28 rounded-xl border border-slate-300 px-4 py-3 font-semibold md:col-span-2" />
            <input type="date" value={form.dueDate || ''} onChange={(e) => setForm((x) => ({ ...x, dueDate: e.target.value }))} className="rounded-xl border border-slate-300 px-4 py-3 font-semibold" />
          </>
        ) : null}

        {activeTab === 'results' || activeTab === 'attendance' ? (
          <>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-black text-slate-700">Student</label>
              <select
                value={form.rollNumber || form.studentName || ''}
                onChange={(event) => {
                  const student = filteredStudents.find((row) => String(row.rollNumber || row.name || row.studentName || '') === event.target.value);
                  if (student) selectStudent(student);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold"
                required
              >
                <option value="">Select Student</option>
                {filteredStudents.map((student) => {
                  const key = String(student.rollNumber || student.name || student.studentName || student.id);
                  return <option key={String(student.id)} value={key}>{student.name || student.studentName || 'Student'}{student.rollNumber ? ` • Roll ${student.rollNumber}` : ''}</option>;
                })}
              </select>
            </div>
            <input value={form.studentName || ''} readOnly placeholder="Student Name" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold" />
            <input value={form.rollNumber || ''} readOnly placeholder="Roll Number" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold" />

            {activeTab === 'results' ? (
              <>
                <input value={form.exam || ''} onChange={(e) => setForm((x) => ({ ...x, exam: e.target.value }))} placeholder="Exam" className="rounded-xl border border-slate-300 px-4 py-3 font-semibold" />
                <input value={form.subject || ''} onChange={(e) => setForm((x) => ({ ...x, subject: e.target.value }))} placeholder="Subject" className="rounded-xl border border-slate-300 px-4 py-3 font-semibold" />
                <input value={form.marks || ''} onChange={(e) => setForm((x) => ({ ...x, marks: e.target.value }))} placeholder="Marks" inputMode="decimal" className="rounded-xl border border-slate-300 px-4 py-3 font-semibold" />
                <input value={form.totalMarks || ''} onChange={(e) => setForm((x) => ({ ...x, totalMarks: e.target.value }))} placeholder="Total Marks" inputMode="decimal" className="rounded-xl border border-slate-300 px-4 py-3 font-semibold" />
                <input value={form.grade || ''} onChange={(e) => setForm((x) => ({ ...x, grade: e.target.value }))} placeholder="Grade" className="rounded-xl border border-slate-300 px-4 py-3 font-semibold" />
              </>
            ) : (
              <>
                <input type="date" value={form.date || ''} onChange={(e) => setForm((x) => ({ ...x, date: e.target.value }))} className="rounded-xl border border-slate-300 px-4 py-3 font-semibold" required />
                <select value={form.status || 'Present'} onChange={(e) => setForm((x) => ({ ...x, status: e.target.value }))} className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold">
                  <option>Present</option>
                  <option>Absent</option>
                  <option>Late</option>
                  <option>Leave</option>
                </select>
              </>
            )}
          </>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-emerald-600 px-5 py-3 font-black text-white shadow-[0_4px_0_rgb(4,120,87)] disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
        >
          {saving ? 'Saving...' : editingId ? '💾 Update Record' : '➕ Add Record'}
        </button>

        {message ? <div className="rounded-xl bg-slate-100 p-3 text-sm font-bold text-slate-700 md:col-span-2">{message}</div> : null}
      </form>

      <div className="mt-6">
        <h3 className="mb-3 text-lg font-black text-slate-900">
          {activeTab === 'homework' ? '📝 My Homework' : activeTab === 'results' ? '📊 My Results' : '📅 My Attendance'}
        </h3>
        {visibleRows.length ? (
          <div className="space-y-3">
            {visibleRows.slice(0, 20).map((row) => (
              <div key={String(row.id)} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-black text-slate-900">
                    {activeTab === 'homework'
                      ? row.title || 'Homework'
                      : activeTab === 'results'
                        ? row.studentName || 'Result'
                        : row.studentName || 'Attendance'}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {getClassName(row)}{row.section ? ` - ${row.section}` : ''}
                    {row.subject ? ` • ${row.subject}` : ''}
                    {row.rollNumber ? ` • Roll ${row.rollNumber}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(activeTab, row)}
                  className="rounded-xl bg-amber-500 px-4 py-2 font-black text-white"
                >
                  ✏️ Edit
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
            Is assigned area mein abhi koi record nahi hai.
          </p>
        )}
      </div>
    </section>
  );
}

export default function TeacherDashboardPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [membership, setMembership] = useState<SchoolMembership | null>(null);\n  const [teacherProfile, setTeacherProfile] = useState<any | null>(null);\n  const [showProfile, setShowProfile] = useState(false);
  const [school, setSchool] = useState<School | null>(null);
  const [students, setStudents] = useState<SchoolRow[]>([]);
  const [homework, setHomework] = useState<SchoolRow[]>([]);
  const [results, setResults] = useState<SchoolRow[]>([]);
  const [attendance, setAttendance] = useState<SchoolRow[]>([]);
  const [notices, setNotices] = useState<SchoolRow[]>([]);
  const [events, setEvents] = useState<SchoolRow[]>([]);
  const [gallery, setGallery] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.uid) {
      navigate('/login', { replace: true });
      return;
    }

    setLoading(true);
    setError('');

    let unsubscribeSchool = () => {};
    const collectionUnsubscribers: Array<() => void> = [];

    const unsubscribeMembership = subscribeToMyMembership(
      user.uid,
      (current) => {
        if (!current || current.status !== 'ACTIVE' || current.role !== 'teacher') {
          setMembership(null);
          setSchool(null);
          setLoading(false);
          unsubscribeSchool();
          collectionUnsubscribers.forEach((unsubscribe) => unsubscribe());
          navigate('/', { replace: true });
          return;
        }

        setMembership(current);

        unsubscribeSchool();
        unsubscribeSchool = subscribeToSchool(
          current.schoolId,
          (schoolData) => {
            if (!schoolData || schoolData.status !== 'LIVE') {
              setSchool(null);
              setLoading(false);
              navigate('/', { replace: true });
              return;
            }

            setSchool(schoolData);
            setLoading(false);
          },
          (listenerError) => {
            console.error('Teacher school listener error:', listenerError);
            setError('School information load nahi ho paayi.');
            setLoading(false);
          }
        );

        collectionUnsubscribers.forEach((unsubscribe) => unsubscribe());
        collectionUnsubscribers.length = 0;

        const subscribe = (
          collectionName: string,
          setter: (rows: SchoolRow[]) => void
        ) => {
          // Teacher dashboard never loads the complete school collection.
          // It subscribes only to the class/section assignments in the active membership.
          collectionUnsubscribers.push(
            subscribeToTeacherScopedCollection(
              current.schoolId,
              collectionName,
              current.assignments || [],
              setter,
              (listenerError) => {
                console.error(`Teacher ${collectionName} scoped listener error:`, listenerError);
              }
            )
          );
        };

        subscribe('students', setStudents);
        subscribe('homework', setHomework);
        subscribe('results', setResults);
        subscribe('attendance', setAttendance);
        // Notices/events/gallery are school-wide information, so they remain visible to the teacher.
        collectionUnsubscribers.push(
          subscribeToSchoolCollection(current.schoolId, 'announcements', setNotices, (e) =>
            console.error('Teacher announcements listener error:', e)
          )
        );
        collectionUnsubscribers.push(
          subscribeToSchoolCollection(current.schoolId, 'events', setEvents, (e) =>
            console.error('Teacher events listener error:', e)
          )
        );
        collectionUnsubscribers.push(
          subscribeToSchoolCollection(current.schoolId, 'gallery', setGallery, (e) =>
            console.error('Teacher gallery listener error:', e)
          )
        );
      },
      (listenerError) => {
        console.error('Live teacher membership error:', listenerError);
        setError('Teacher membership load nahi ho paayi.');
        setLoading(false);
      }
    );

    return () => {
      unsubscribeMembership();
      unsubscribeSchool();
      collectionUnsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [navigate, user?.uid]);

  useEffect(() => {
    if (!membership?.schoolId || !user?.email) {
      setTeacherProfile(null);
      return;
    }

    const unsubscribe = subscribeToMyTeacherProfile(
      membership.schoolId,
      user.email,
      (profile) => setTeacherProfile(profile),
      (listenerError) => {
        console.error('Teacher profile listener error:', listenerError);
        setTeacherProfile(null);
      }
    );

    return () => unsubscribe();
  }, [membership?.schoolId, user?.email]);

  const assignments = membership?.assignments ?? [];

  const myStudents = useMemo(
    () => students.filter((row) => matchesAssignedClass(row, assignments)),
    [students, assignments]
  );

  const myHomework = useMemo(
    () => homework.filter((row) => matchesAssignedClass(row, assignments)),
    [homework, assignments]
  );

  const myResults = useMemo(
    () => results.filter((row) => matchesAssignedClass(row, assignments)),
    [results, assignments]
  );

  const myAttendance = useMemo(
    () => attendance.filter((row) => matchesAssignedClass(row, assignments)),
    [attendance, assignments]
  );

  const assignedText = assignments.length ? assignments.join(', ') : 'No class assigned';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white">
        <div className="rounded-3xl bg-white/15 px-8 py-6 text-center shadow-2xl backdrop-blur">
          <div className="text-4xl">👨‍🏫</div>
          <p className="mt-3 font-black">Teacher dashboard loading...</p>
        </div>
      </div>
    );
  }

  if (!membership || !school) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="border-b bg-white/95 shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
              {teacherProfile?.photoDataUrl ? (
                <img
                  src={teacherProfile.photoDataUrl}
                  alt={teacherProfile.name || 'Teacher'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl">👨‍🏫</div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-black text-slate-900">{school.name}</h1>
              <p className="text-xs font-bold text-blue-600">Teacher Dashboard</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signOut()}
            className="rounded-xl bg-red-600 px-4 py-2 font-black text-white shadow-[0_4px_0_rgb(153,27,27)] active:translate-y-1 active:shadow-none"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <section className="rounded-3xl bg-white p-6 shadow-xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-3xl bg-slate-100 shadow-md">
                {teacherProfile?.photoDataUrl ? (
                  <img
                    src={teacherProfile.photoDataUrl}
                    alt={teacherProfile.name || 'Teacher'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl">👨‍🏫</div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-wide text-blue-600">
                  👨‍🏫 Teacher Work Area
                </p>
                <h2 className="mt-1 break-words text-2xl font-black text-slate-900">
                  Welcome, {teacherProfile?.name || 'Teacher'}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Aap sirf <strong>{school.name}</strong> ke assigned class data par kaam karte hain.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowProfile(true)}
                className="rounded-xl bg-emerald-600 px-5 py-3 font-black text-white shadow-[0_5px_0_rgb(4,120,87)] active:translate-y-1 active:shadow-none"
              >
                👤 My Profile
              </button>
              <Link
                to={`/school/${school.slug}`}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 text-center font-black text-white shadow-[0_5px_0_rgb(67,56,202)]"
              >
                🌐 View School Website
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-blue-50 p-5">
              <p className="text-sm font-bold text-blue-700">📚 My Assigned Classes</p>
              <p className="mt-2 break-words text-lg font-black text-slate-900">{assignedText}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-5">
              <p className="text-sm font-bold text-emerald-700">🏫 School</p>
              <p className="mt-2 text-lg font-black text-slate-900">{school.name}</p>
            </div>
          </div>
        </section>

        {showProfile ? (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 p-4 backdrop-blur-sm">
            <div className="mx-auto mt-6 max-w-3xl rounded-3xl bg-white shadow-2xl">
              <div className="flex items-center justify-between gap-4 border-b p-5">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-emerald-600">
                    👤 My Profile
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-slate-900">
                    Teacher Profile
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Admin ne jo information add ki hai, wahi yahan read-only dikhegi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfile(false)}
                  className="rounded-xl bg-slate-200 px-4 py-2 font-black text-slate-800"
                >
                  ✕ Close
                </button>
              </div>

              {teacherProfile ? (
                <div className="p-5">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-slate-100 text-5xl shadow-inner">
                      {teacherProfile.photoDataUrl ? (
                        <img
                          src={teacherProfile.photoDataUrl}
                          alt={teacherProfile.name || 'Teacher'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        '👨‍🏫'
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="break-words text-2xl font-black text-slate-900">
                        {teacherProfile.name || 'Teacher'}
                      </h3>
                      <p className="mt-1 break-all text-sm font-bold text-blue-600">
                        {teacherProfile.email || user.email || '—'}
                      </p>
                      <span className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                        {String(teacherProfile.status || 'ACTIVE')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {[
                      ['📧 Google Email', teacherProfile.email || user.email],
                      ['📱 Phone', teacherProfile.phone],
                      ['🏠 Address', teacherProfile.address],
                      ['💰 Salary', teacherProfile.salary],
                      ['🎓 Qualification', teacherProfile.qualification],
                      ['📚 Subject', teacherProfile.subject],
                      ['🏫 Assigned Class', teacherProfile.assignedClass],
                      ['🔤 Section', teacherProfile.section],
                      ['📅 Joining Date', formatDate(teacherProfile.joiningDate) || teacherProfile.joiningDate],
                      ['✅ Profile Status', teacherProfile.status],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
                        <p className="mt-1 break-words text-base font-black text-slate-900">
                          {value || '—'}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-bold leading-6 text-amber-800">
                      🔒 Profile read-only hai. Teacher khud details edit nahi kar sakta. Changes sirf School Admin karega.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="font-black text-slate-700">Aapka teacher profile abhi load nahi hua.</p>
                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    School Admin se profile details check karne ko kahen.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}

        <TeacherWorkPanel
          schoolId={school.id}
          assignments={assignments}
          students={myStudents}
          homework={myHomework}
          results={myResults}
          attendance={myAttendance}
        />

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon="👨‍🎓" label="My Students" value={myStudents.length} />
          <StatCard icon="📝" label="My Homework" value={myHomework.length} />
          <StatCard icon="📊" label="My Results" value={myResults.length} />
          <StatCard icon="📅" label="My Attendance" value={myAttendance.length} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <DataList
            title="My Students"
            icon="👨‍🎓"
            rows={myStudents}
            emptyText="Assigned class ke students abhi nahi mile."
            renderRow={(row) => (
              <div>
                <p className="font-black text-slate-900">
                  {row.name || row.studentName || 'Student'}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Class: {getClassName(row) || '—'} {row.rollNumber ? ` • Roll: ${row.rollNumber}` : ''}
                </p>
              </div>
            )}
          />

          <DataList
            title="My Homework"
            icon="📝"
            rows={myHomework}
            emptyText="Assigned class ka homework abhi nahi hai."
            renderRow={(row) => (
              <div>
                <p className="font-black text-slate-900">
                  {row.title || row.subject || 'Homework'}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                  {row.description || row.content || 'No description'}
                </p>
                <p className="mt-2 text-xs font-bold text-slate-500">
                  Class: {getClassName(row) || '—'} {formatDate(row.date || row.createdAt) ? ` • ${formatDate(row.date || row.createdAt)}` : ''}
                </p>
              </div>
            )}
          />

          <DataList
            title="My Results"
            icon="📊"
            rows={myResults}
            emptyText="Assigned class ke results abhi nahi hain."
            renderRow={(row) => (
              <div>
                <p className="font-black text-slate-900">
                  {row.studentName || row.name || 'Result'}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {row.subject ? `Subject: ${row.subject}` : ''}
                  {row.marks !== undefined ? ` • Marks: ${row.marks}` : ''}
                </p>
                <p className="mt-2 text-xs font-bold text-slate-500">
                  Class: {getClassName(row) || '—'}
                </p>
              </div>
            )}
          />

          <DataList
            title="My Attendance"
            icon="📅"
            rows={myAttendance}
            emptyText="Assigned class ki attendance abhi nahi hai."
            renderRow={(row) => (
              <div>
                <p className="font-black text-slate-900">
                  {row.studentName || row.name || 'Attendance'}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Status: {row.status || row.attendanceStatus || '—'}
                </p>
                <p className="mt-2 text-xs font-bold text-slate-500">
                  Class: {getClassName(row) || '—'} {formatDate(row.date || row.createdAt) ? ` • ${formatDate(row.date || row.createdAt)}` : ''}
                </p>
              </div>
            )}
          />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <DataList
            title="School Notices"
            icon="📢"
            rows={notices}
            emptyText="No notices found."
            renderRow={(row) => (
              <div>
                <p className="font-black text-slate-900">{row.title || 'Notice'}</p>
                <p className="mt-1 text-sm text-slate-600">{row.content || row.description || ''}</p>
              </div>
            )}
          />

          <DataList
            title="School Events"
            icon="🎉"
            rows={events}
            emptyText="No events found."
            renderRow={(row) => (
              <div>
                <p className="font-black text-slate-900">{row.title || 'Event'}</p>
                <p className="mt-1 text-sm text-slate-600">{row.description || ''}</p>
                {row.eventDate ? (
                  <p className="mt-2 text-xs font-bold text-slate-500">{formatDate(row.eventDate)}</p>
                ) : null}
              </div>
            )}
          />

          <DataList
            title="School Gallery"
            icon="🖼️"
            rows={gallery}
            emptyText="No gallery items found."
            renderRow={(row) => (
              <div>
                <p className="font-black text-slate-900">{row.title || row.caption || 'Gallery'}</p>
                {row.imageUrl ? (
                  <img
                    src={row.imageUrl}
                    alt={row.title || 'School gallery'}
                    className="mt-3 h-32 w-full rounded-xl object-cover"
                  />
                ) : null}
              </div>
            )}
          />
        </section>

        <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="font-black text-amber-900">🔒 Teacher Access</h3>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            Teacher ko School Information, Teachers, Staff Access, Subscription,
            school settings aur doosre schools ka admin panel nahi dikhaya jaata.
            Is dashboard ka school ID active teacher membership se liya jaata hai.
          </p>
        </section>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-xl bg-slate-200 px-5 py-3 font-black text-slate-900"
          >
            🏠 Home
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard/teacher')}
            className="rounded-xl bg-slate-900 px-5 py-3 font-black text-white"
          >
            🔄 Refresh Board
          </button>
        </div>
      </main>
    </div>
  );
}
