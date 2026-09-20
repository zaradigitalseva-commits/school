import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  School,
  Megaphone,
  CalendarDays,
  Users,
  ShieldCheck,
  UserCog,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, isAdmin, isFaculty, isPlatformAdmin, isSchoolAdmin, isTeacher, signOut } = useAuth();

  const panelLabel = isPlatformAdmin
    ? 'Platform Admin'
    : isSchoolAdmin
      ? 'School Admin'
      : isTeacher
        ? 'Teacher Board'
        : 'Dashboard';

  const navItems: NavItem[] = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/dashboard/school', label: 'School Info', icon: School, adminOnly: true },
    { to: '/dashboard/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/dashboard/events', label: 'Events', icon: CalendarDays },
    { to: '/dashboard/teachers', label: 'Teachers', icon: Users },
    { to: '/dashboard/users', label: 'Registered Users', icon: Eye, adminOnly: true },
    { to: '/dashboard/faculty', label: 'Faculty Access', icon: UserCog, adminOnly: true },
    { to: '/dashboard/admins', label: 'Admin Access', icon: ShieldCheck, adminOnly: true },
  ];

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - desktop */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-gray-900 text-gray-300 z-50 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-800">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="block text-sm font-bold text-white leading-tight">
                Bright Future
              </span>
              <span className="block text-xs text-blue-400 leading-tight">
                {panelLabel}
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <img
              src={user?.photoURL ?? ''}
              alt=""
              className="w-9 h-9 rounded-full border-2 border-gray-700"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.displayName ?? 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {isPlatformAdmin ? 'Platform Administrator' : isSchoolAdmin ? 'School Administrator' : isTeacher ? 'Teacher' : 'User'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-semibold text-gray-800">{panelLabel}</span>
          <div className="w-10" />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
