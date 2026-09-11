import { useEffect, useState } from 'react';
import { CalendarDays, Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import {
  fetchEvents,
  addEvent,
  updateEvent,
  deleteEvent,
  formatDate,
} from '@/firebase/firestore';
import type { SchoolEvent } from '@/firebase/types';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';

export default function EventsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolEvent | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', date: '', location: '', imageUrl: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetchEvents().then(setItems).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', description: '', date: new Date().toISOString().slice(0, 10), location: '', imageUrl: '' });
    setModalOpen(true);
  };

  const openEdit = (item: SchoolEvent) => {
    setEditing(item);
    setForm({ title: item.title, description: item.description, date: item.date.slice(0, 10), location: item.location, imageUrl: item.imageUrl });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.description) {
      showToast('Please fill in title and description.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const data = { ...form, date: new Date(form.date).toISOString() };
      if (editing) {
        await updateEvent(editing.id, data);
        showToast('Event updated!', 'success');
      } else {
        await addEvent(data);
        showToast('Event added!', 'success');
      }
      setModalOpen(false);
      load();
    } catch {
      showToast('Failed to save event.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteEvent(deleteId);
      showToast('Event deleted.', 'success');
      load();
    } catch {
      showToast('Failed to delete.', 'error');
    }
  };

  if (loading) return <LoadingSpinner label="Loading events..." />;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-emerald-600" /> Events
          </h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage school events.</p>
        </div>
        <button onClick={openAdd} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold btn-3d hover:bg-emerald-700 inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl card-shadow">
          <EmptyState icon={<CalendarDays className="w-8 h-8 text-gray-400" />} title="No events yet" message="Click 'Add New' to create your first event." />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl overflow-hidden card-shadow card-shadow-hover">
              {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-full h-32 object-cover" />}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {formatDate(item.date)}</span>
                  {item.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {item.location}</span>}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Event' : 'New Event'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <input type="date" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
              <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Image URL (optional)</label>
            <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold btn-3d hover:bg-emerald-700 disabled:opacity-60">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
      />
    </div>
  );
}
