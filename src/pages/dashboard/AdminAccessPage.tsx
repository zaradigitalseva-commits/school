import { useEffect, useState } from 'react';
import { ShieldCheck, Plus, Trash2, Crown } from 'lucide-react';
import {
  fetchAuthorizedAdmins,
  addAuthorizedAdmin,
  removeAuthorizedAdmin,
  fetchAllUsers,
  isAdminEmail,
} from '@/firebase/firestore';
import type { AppUser } from '@/firebase/types';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';

export default function AdminAccessPage() {
  const { showToast } = useToast();
  const [admins, setAdmins] = useState<AppUser[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteUid, setDeleteUid] = useState<string | null>(null);
  const [selectedUid, setSelectedUid] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([fetchAuthorizedAdmins(), fetchAllUsers().catch(() => [])])
      .then(([a, u]) => {
        setAdmins(a);
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
      await addAuthorizedAdmin(selectedUid, user.email);
      showToast('Admin access granted!', 'success');
      setModalOpen(false);
      setSelectedUid('');
      load();
    } catch {
      showToast('Failed to grant admin access.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteUid) return;
    try {
      await removeAuthorizedAdmin(deleteUid);
      showToast('Admin access removed.', 'success');
      load();
    } catch {
      showToast('Failed to remove access.', 'error');
    }
  };

  if (loading) return <LoadingSpinner label="Loading admins..." />;

  const availableUsers = allUsers.filter(
    (u) => !admins.some((a) => a.uid === u.uid) && !isAdminEmail(u.email)
  );

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" /> Admin Access
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage who has administrator-level access.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold btn-3d hover:bg-emerald-700 inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Admin
        </button>
      </div>

      {/* Super admin banner */}
      <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-2xl p-4 mb-6 flex items-center gap-3 border border-blue-100">
        <Crown className="w-5 h-5 text-blue-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gray-900">Super Admin (always authorized)</p>
          <p className="text-xs text-gray-500">ngogrant454@gmail.com has permanent admin access and cannot be removed.</p>
        </div>
      </div>

      {admins.length === 0 ? (
        <div className="bg-white rounded-2xl card-shadow">
          <EmptyState
            icon={<ShieldCheck className="w-8 h-8 text-gray-400" />}
            title="No additional admins"
            message="The super admin always has access. Add more admins from registered users."
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {admins.map((a) => (
            <div key={a.uid} className="bg-white rounded-2xl p-5 card-shadow flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{a.email}</p>
                  <p className="text-xs text-gray-400">Administrator</p>
                </div>
              </div>
              <button
                onClick={() => setDeleteUid(a.uid)}
                className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Admin" maxWidth="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Select a registered user to grant admin access. This is a powerful permission - only grant to trusted users.
          </p>
          {availableUsers.length === 0 ? (
            <div className="p-4 rounded-xl bg-gray-50 text-center">
              <ShieldCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No available users. Users must sign in first before they can be added as admin.</p>
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
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold btn-3d hover:bg-emerald-700 disabled:opacity-60"
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
        title="Remove Admin Access"
        message="This user will no longer have admin access. They will be downgraded to standard user."
        confirmText="Remove"
      />
    </div>
  );
}
