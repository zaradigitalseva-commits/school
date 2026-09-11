import { useState, useEffect } from 'react';
import { Save, School } from 'lucide-react';
import { fetchSchoolInfo, saveSchoolInfo } from '@/firebase/firestore';
import type { SchoolInfo } from '@/firebase/types';
import { useToast } from '@/components/ui/Toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const emptyInfo: SchoolInfo = {
  name: '', tagline: '', description: '', address: '', phone: '', email: '',
  logoUrl: '', heroImageUrl: '', campusImages: [], principalName: '',
  principalMessage: '', principalImageUrl: '', foundedYear: '', totalStudents: '',
  totalTeachers: '', totalCourses: '',
};

export default function SchoolInfoPage() {
  const { showToast } = useToast();
  const [info, setInfo] = useState<SchoolInfo>(emptyInfo);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSchoolInfo()
      .then((data) => data && setInfo(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSchoolInfo(info);
      showToast('School information saved successfully!', 'success');
    } catch {
      showToast('Failed to save school information.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof SchoolInfo, value: string | string[]) =>
    setInfo((prev) => ({ ...prev, [field]: value }));

  if (loading) return <LoadingSpinner label="Loading school info..." />;

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <School className="w-6 h-6 text-blue-600" /> School Information
          </h1>
          <p className="text-sm text-gray-500 mt-1">Update the public-facing school details.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold btn-3d hover:bg-blue-700 disabled:opacity-60 inline-flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white rounded-2xl card-shadow p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Basic Information</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>School Name</label>
              <input className={inputClass} value={info.name} onChange={(e) => update('name', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Tagline</label>
              <input className={inputClass} value={info.tagline} onChange={(e) => update('tagline', e.target.value)} />
            </div>
          </div>
          <div className="mt-4">
            <label className={labelClass}>Description</label>
            <textarea rows={4} className={inputClass} value={info.description} onChange={(e) => update('description', e.target.value)} />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Contact Details</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Address</label>
              <input className={inputClass} value={info.address} onChange={(e) => update('address', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input className={inputClass} value={info.phone} onChange={(e) => update('phone', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input className={inputClass} value={info.email} onChange={(e) => update('email', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Images</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Logo URL</label>
              <input className={inputClass} value={info.logoUrl} onChange={(e) => update('logoUrl', e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className={labelClass}>Hero Image URL</label>
              <input className={inputClass} value={info.heroImageUrl} onChange={(e) => update('heroImageUrl', e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className={labelClass}>Campus Images (comma-separated URLs)</label>
              <input
                className={inputClass}
                value={info.campusImages.join(', ')}
                onChange={(e) => update('campusImages', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Principal Information</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Principal Name</label>
              <input className={inputClass} value={info.principalName} onChange={(e) => update('principalName', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Principal Image URL</label>
              <input className={inputClass} value={info.principalImageUrl} onChange={(e) => update('principalImageUrl', e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div className="mt-4">
            <label className={labelClass}>Principal's Message</label>
            <textarea rows={4} className={inputClass} value={info.principalMessage} onChange={(e) => update('principalMessage', e.target.value)} />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Statistics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Founded Year</label>
              <input className={inputClass} value={info.foundedYear} onChange={(e) => update('foundedYear', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Total Students</label>
              <input className={inputClass} value={info.totalStudents} onChange={(e) => update('totalStudents', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Total Teachers</label>
              <input className={inputClass} value={info.totalTeachers} onChange={(e) => update('totalTeachers', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Total Courses</label>
              <input className={inputClass} value={info.totalCourses} onChange={(e) => update('totalCourses', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold btn-3d hover:bg-blue-700 disabled:opacity-60 inline-flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
