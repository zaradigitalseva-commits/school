import { useEffect, useState } from 'react';
import { Eye, ShieldCheck, UserCog, User } from 'lucide-react';
import { fetchAllUsers, formatDate } from '@/firebase/firestore';
import type { AppUser } from '@/firebase/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllUsers()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner label="Loading users..." />;

  const roleBadge = (role: string) => {
    if (role === 'admin')
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
          <ShieldCheck className="w-3 h-3" /> Admin
        </span>
      );
    if (role === 'faculty')
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold">
          <UserCog className="w-3 h-3" /> Faculty
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 text-xs font-semibold">
        <User className="w-3 h-3" /> User
      </span>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Eye className="w-6 h-6 text-blue-600" /> Registered Users
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          View all users who have signed in with Google. Total: {users.length}
        </p>
      </div>

      {users.length === 0 ? (
        <div className="bg-white rounded-2xl card-shadow">
          <EmptyState
            icon={<Eye className="w-8 h-8 text-gray-400" />}
            title="No registered users yet"
            message="Users will appear here after they sign in with Google."
          />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl card-shadow overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.uid} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt="" className="w-9 h-9 rounded-full" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-900">{u.displayName || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{u.email}</td>
                    <td className="px-5 py-3">{roleBadge(u.role)}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{formatDate(u.lastLoginAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {users.map((u) => (
              <div key={u.uid} className="bg-white rounded-2xl p-4 card-shadow flex items-center gap-3">
                {u.photoURL ? (
                  <img src={u.photoURL} alt="" className="w-10 h-10 rounded-full shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.displayName || 'Unknown'}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  <div className="mt-1">{roleBadge(u.role)}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
