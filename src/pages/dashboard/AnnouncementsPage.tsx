import { useEffect, useState } from 'react';
import { Megaphone, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  fetchAnnouncements,
  addAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  formatDate,
} from '@/firebase/firestore';
import type { Announcement } from '@/firebase/types';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';

export default function AnnouncementsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', date: '', priority: 'medium' as 'high' | 'medium' | 'low' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetchAnnouncements()
      .then(setItems)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', content: '', date: new Date().toISOString().slice(0, 10), priority: 'medium' });
    setModalOpen(true);
  };

  const openEdit = (item: Announcement) => {
    setEditing(item);
    setForm({ title: item.title, content: item.content, date: item.date.slice(0, 10), priority: item.priority });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.content) {
      showToast('Please fill in title and content.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const data = { ...form, date: new Date(form.date).toISOString() };
      if (editing) {
        await updateAnnouncement(editing.id, data);
        showToast('Announcement updated!', 'success');
      } else {
        await addAnnouncement(data);
        showToast('Announcement added!', 'success');
      }
      setModalOpen(false);
      load();
    } catch {
      showToast('Failed to save announcement.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAnnouncement(deleteId);
      showToast('Announcement deleted.', 'success');
      load();
    } catch {
      showToast('Failed to delete.', 'error');
    }
  };

  if (loading) return <LoadingSpinner label="Loading announcements..." />;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-blue-600" /> Announcements
          </h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage school announcements.</p>
        </div>
        <button onClick={openAdd} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold btn-3d hover:bg-blue-700 inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl card-shadow">
          <EmptyState icon={<Megaphone className="w-8 h-8 text-gray-400" />} title="No announcements yet" message="Click 'Add New' to create your first announcement." />
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-5 card-shadow flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  item.priority === 'high' ? 'bg-red-50' : item.priority === 'medium' ? 'bg-amber-50' : 'bg-blue-50'
                }`}>
                  <Megaphone className={`w-5 h-5 ${item.priority === 'high' ? 'text-red-600' : item.priority === 'medium' ? 'text-amber-600' : 'text-blue-600'}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{item.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${item.priority === 'high' ? 'bg-red-50 text-red-600' : item.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                      {item.priority}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(item.date)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(item)} className="p-2 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteId(item.id)} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Announcement' : 'New Announcement'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Content</label>
            <textarea rows={4} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <input type="date" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as 'high' | 'medium' | 'low' })}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold btn-3d hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Announcement"
        message="Are you sure you want to delete this announcement? This action cannot be undone."
      />
    </div>
  );
}
