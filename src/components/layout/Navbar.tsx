import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  GraduationCap,
  Home,
  Info,
  BookOpen,
  Users,
  Megaphone,
  CalendarDays,
  Phone,
  LogIn,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navLinks = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/about', label: 'About', icon: Info },
  { to: '/academics', label: 'Academics', icon: BookOpen },
  { to: '/teachers', label: 'Teachers', icon: Users },
  { to: '/notices', label: 'Notices', icon: Megaphone },
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/contact', label: 'Contact', icon: Phone },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, isAdmin, isFaculty } = useAuth();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const showDashboardLink = isAdmin || isFaculty;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md py-2'
          : 'bg-white/80 backdrop-blur-sm py-3'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="block text-base font-bold text-gray-900 leading-tight font-display">
              Bright Future
            </span>
            <span className="block text-xs text-blue-600 font-medium leading-tight">
              Academy
            </span>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {showDashboardLink && (
            <Link
              to="/dashboard"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold btn-3d hover:bg-blue-700"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
          )}
          {user ? (
            <img
              src={user.photoURL ?? ''}
              alt={user.displayName ?? 'User'}
              className="w-9 h-9 rounded-full border-2 border-blue-200"
            />
          ) : (
            <Link
              to="/login"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg border-2 border-blue-600 text-blue-600 text-sm font-semibold hover:bg-blue-50 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="lg:hidden bg-white border-t border-gray-100 animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'text-blue-700 bg-blue-50'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
            {showDashboardLink && (
              <Link
                to="/dashboard"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-700 bg-blue-50"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            )}
            {!user && (
              <Link
                to="/login"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
