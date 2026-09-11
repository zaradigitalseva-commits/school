import { useEffect, useState } from 'react';
import { UserCog, Plus, Trash2, Mail } from 'lucide-react';
import {
  fetchAuthorizedFaculty,
  addAuthorizedFaculty,
  removeAuthorizedFaculty,
  fetchAllUsers,
} from '@/firebase/firestore';
import type { AppUser } from '@/firebase/types';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';

export default function FacultyAccessPage() {
  const { showToast } = useToast();
  const [faculty, setFaculty] = useState<AppUser[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteUid, setDeleteUid] = useState<string | null>(null);
  const [selectedUid, setSelectedUid] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([fetchAuthorizedFaculty(), fetchAllUsers().catch(() => [])])
      .then(([f, u]) => {
        setFaculty(f);
        setAllUsers(u);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!selectedUid) {
      showToast('Please select a user.', 'warning');
      return;
    }
    const user = allUsers.find((u) => u.uid === selectedUid);
    if (!user) return;
    try {
      await addAuthorizedFaculty(selectedUid, user.email);
      showToast('Faculty access granted!', 'success');
      setModalOpen(false);
      setSelectedUid('');
      load();
    } catch {
      showToast('Failed to grant faculty access.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteUid) return;
    try {
      await removeAuthorizedFaculty(deleteUid);
      showToast('Faculty access removed.', 'success');
      load();
    } catch {
      showToast('Failed to remove access.', 'error');
    }
  };

  if (loading) return <LoadingSpinner label="Loading faculty..." />;

  const availableUsers = allUsers.filter(
    (u) => !faculty.some((f) => f.uid === u.uid) && u.role !== 'admin'
  );

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCog className="w-6 h-6 text-amber-600" /> Faculty Access
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage who has faculty-level dashboard access.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-semibold btn-3d hover:bg-amber-700 inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Faculty
        </button>
      </div>

      {faculty.length === 0 ? (
        <div className="bg-white rounded-2xl card-shadow">
          <EmptyState
            icon={<UserCog className="w-8 h-8 text-gray-400" />}
            title="No faculty members yet"
            message="Add a registered user as faculty to grant dashboard access."
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {faculty.map((f) => (
            <div key={f.uid} className="bg-white rounded-2xl p-5 card-shadow flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <UserCog className="w-5 h-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{f.email}</p>
                  <p className="text-xs text-gray-400">Faculty Member</p>
                </div>
              </div>
              <button
                onClick={() => setDeleteUid(f.uid)}
                className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Faculty Member" maxWidth="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Select a registered user to grant faculty access. Only users who have signed in at least once will appear here.
          </p>
          {availableUsers.length === 0 ? (
            <div className="p-4 rounded-xl bg-gray-50 text-center">
              <Mail className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No available users. Users must sign in first before they can be added as faculty.</p>
            </div>
          ) : (
            <select
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={selectedUid}
              onChange={(e) => setSelectedUid(e.target.value)}
            >
              <option value="">Select a user...</option>
              {availableUsers.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.email} ({u.displayName || 'Unknown'})
                </option>
              ))}
            </select>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!availableUsers.length}
              className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-semibold btn-3d hover:bg-amber-700 disabled:opacity-60"
            >
              Grant Access
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteUid}
        onClose={() => setDeleteUid(null)}
        onConfirm={handleDelete}
        title="Remove Faculty Access"
        message="This user will no longer have faculty dashboard access. They can still sign in as a standard user."
        confirmText="Remove"
      />
    </div>
  );
}
