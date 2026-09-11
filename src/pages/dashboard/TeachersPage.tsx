import { useEffect, useState } from 'react';
import { Users, Plus, Pencil, Trash2, Mail, Phone } from 'lucide-react';
import {
  fetchTeachers,
  addTeacher,
  updateTeacher,
  deleteTeacher,
} from '@/firebase/firestore';
import type { Teacher } from '@/firebase/types';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';

export default function TeachersPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', designation: '', subject: '', qualification: '', bio: '',
    imageUrl: '', email: '', phone: '', order: 0,
  });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetchTeachers().then(setItems).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', designation: '', subject: '', qualification: '', bio: '', imageUrl: '', email: '', phone: '', order: items.length });
    setModalOpen(true);
  };

  const openEdit = (item: Teacher) => {
    setEditing(item);
    setForm({ name: item.name, designation: item.designation, subject: item.subject, qualification: item.qualification, bio: item.bio, imageUrl: item.imageUrl, email: item.email, phone: item.phone, order: item.order });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.designation) {
      showToast('Please fill in name and designation.', 'warning');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateTeacher(editing.id, form);
        showToast('Teacher updated!', 'success');
      } else {
        await addTeacher(form);
        showToast('Teacher added!', 'success');
      }
      setModalOpen(false);
      load();
    } catch {
      showToast('Failed to save teacher.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTeacher(deleteId);
      showToast('Teacher deleted.', 'success');
      load();
    } catch {
      showToast('Failed to delete.', 'error');
    }
  };

  if (loading) return <LoadingSpinner label="Loading teachers..." />;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-600" /> Teachers
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage teacher profiles displayed publicly.</p>
        </div>
        <button onClick={openAdd} className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-semibold btn-3d hover:bg-amber-700 inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl card-shadow">
          <EmptyState icon={<Users className="w-8 h-8 text-gray-400" />} title="No teachers yet" message="Click 'Add New' to add the first teacher." />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl overflow-hidden card-shadow card-shadow-hover">
              <div className="relative h-40 overflow-hidden">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-50 to-gray-100 flex items-center justify-center">
                    <Users className="w-12 h-12 text-amber-200" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <p className="text-sm text-amber-600 font-medium">{item.designation}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.subject}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  {item.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {item.email}</span>}
                  {item.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {item.phone}</span>}
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button onClick={() => openEdit(item)} className="flex-1 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 inline-flex items-center justify-center gap-1.5 transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => setDeleteId(item.id)} className="flex-1 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 inline-flex items-center justify-center gap-1.5 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Teacher' : 'New Teacher'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
              <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Designation</label>
              <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="e.g. Senior Teacher" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
              <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Mathematics" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Qualification</label>
              <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} placeholder="e.g. M.Sc, B.Ed" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
            <textarea rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Image URL</label>
            <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-semibold btn-3d hover:bg-amber-700 disabled:opacity-60">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Teacher"
        message="Are you sure you want to remove this teacher? This action cannot be undone."
      />
    </div>
  );
}
