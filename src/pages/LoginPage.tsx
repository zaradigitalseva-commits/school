```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  AlertCircle,
  ShieldCheck,
  User,
  School,
  Users,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function LoginPage() {
  const {
    user,
    role,
    loading,
    signInWithGoogle,
  } = useAuth();

  const { showToast } = useToast();
  const navigate = useNavigate();

  const [signingIn, setSigningIn] = useState(false);

  /*
   * =========================================================
   * AUTOMATIC REDIRECT AFTER LOGIN
   * =========================================================
   *
   * platform_admin
   *      -> /admin
   *
   * school_admin
   *      -> /dashboard
   *
   * teacher
   *      -> /dashboard
   *
   * user
   *      -> /
   */
  useEffect(() => {
    if (loading || !user || !role) {
      return;
    }

    if (role === 'platform_admin') {
      navigate('/admin', { replace: true });
      return;
    }

    if (role === 'school_admin') {
      navigate('/dashboard', { replace: true });
      return;
    }

    if (role === 'teacher') {
      navigate('/dashboard', { replace: true });
      return;
    }

    navigate('/', { replace: true });
  }, [loading, user, role, navigate]);

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */
  if (loading) {
    return (
      <LoadingSpinner
        fullScreen
        label="Checking authentication..."
      />
    );
  }

  /*
   * =========================================================
   * USER ALREADY LOGGED IN
   * =========================================================
   *
   * Normally useEffect will redirect automatically.
   * This fallback prevents showing a wrong login screen.
   */
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName ?? 'User'}
              className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-blue-100 object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-blue-100 flex items-center justify-center">
              <User className="w-10 h-10 text-blue-600" />
            </div>
          )}

          <h2 className="text-xl font-bold text-gray-900">
            {user.displayName || 'User'}
          </h2>

          <p className="text-sm text-gray-500 mb-5 break-all">
            {user.email}
          </p>

          <div
            className={`p-5 rounded-2xl mb-6 border ${
              role === 'platform_admin'
                ? 'bg-purple-50 border-purple-200'
                : role === 'school_admin'
                ? 'bg-blue-50 border-blue-200'
                : role === 'teacher'
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              {role === 'platform_admin' ? (
                <ShieldCheck className="w-6 h-6 text-purple-600" />
              ) : role === 'school_admin' ? (
                <School className="w-6 h-6 text-blue-600" />
              ) : role === 'teacher' ? (
                <Users className="w-6 h-6 text-emerald-600" />
              ) : (
                <User className="w-6 h-6 text-gray-500" />
              )}

              <span
                className={`font-bold ${
                  role === 'platform_admin'
                    ? 'text-purple-700'
                    : role === 'school_admin'
                    ? 'text-blue-700'
                    : role === 'teacher'
                    ? 'text-emerald-700'
                    : 'text-gray-600'
                }`}
              >
                {role === 'platform_admin'
                  ? 'Platform Administrator'
                  : role === 'school_admin'
                  ? 'School Administrator'
                  : role === 'teacher'
                  ? 'Teacher / Faculty'
                  : 'Public User'}
              </span>
            </div>

            {role === 'platform_admin' && (
              <p className="text-xs text-purple-700">
                Full access to the entire school platform and all
                registered schools.
              </p>
            )}

            {role === 'school_admin' && (
              <p className="text-xs text-blue-700">
                Access is limited to your own registered school.
              </p>
            )}

            {role === 'teacher' && (
              <p className="text-xs text-emerald-700">
                Access is limited to your assigned school/class.
              </p>
            )}

            {role === 'user' && (
              <p className="text-xs text-gray-500">
                You have public viewing access only.
              </p>
            )}
          </div>

          {role === 'platform_admin' && (
            <button
              onClick={() =>
                navigate('/admin', { replace: true })
              }
              className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold btn-3d hover:from-purple-700 hover:to-indigo-700 transition-all"
            >
              👨‍💼 Open Full Platform Admin
            </button>
          )}

          {role === 'school_admin' && (
            <button
              onClick={() =>
                navigate('/dashboard', { replace: true })
              }
              className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold btn-3d hover:from-blue-700 hover:to-cyan-700 transition-all"
            >
              🏫 Open My School Dashboard
            </button>
          )}

          {role === 'teacher' && (
            <button
              onClick={() =>
                navigate('/dashboard', { replace: true })
              }
              className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold btn-3d hover:from-emerald-700 hover:to-teal-700 transition-all"
            >
              👩‍🏫 Open Teacher Dashboard
            </button>
          )}

          {role === 'user' && (
            <button
              onClick={() =>
                navigate('/', { replace: true })
              }
              className="w-full px-6 py-3.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
            >
              🏠 Back to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * GOOGLE LOGIN
   * =========================================================
   */
  const handleSignIn = async () => {
    if (signingIn) return;

    setSigningIn(true);

    try {
      await signInWithGoogle();

      showToast(
        'Google sign-in successful. Checking your access...',
        'success'
      );

      /*
       * Redirect is handled by useEffect after AuthContext
       * finishes loading the user's role.
       */
    } catch (error) {
      console.error('Google sign-in failed:', error);

      showToast(
        'Sign-in failed. Please try again.',
        'error'
      );
    } finally {
      setSigningIn(false);
    }
  };

  /*
   * =========================================================
   * LOGIN SCREEN
   * =========================================================
   */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-8">
      <div className="max-w-md w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-blue-600/30">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl font-extrabold text-gray-900">
            School Platform
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            Sign in with your Google account
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-xl p-7 sm:p-8">

          {/* Information */}
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />

            <div>
              <p className="text-sm font-bold text-blue-900">
                Secure Google Login
              </p>

              <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                Your access is automatically determined from your
                registered school membership and account permissions.
              </p>
            </div>
          </div>

          {/* Access Types */}
          <div className="grid grid-cols-1 gap-3 mb-6">

            <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
              <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0" />

              <div>
                <p className="text-sm font-semibold text-purple-800">
                  Platform Admin
                </p>

                <p className="text-xs text-purple-600">
                  Full platform administration
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <School className="w-5 h-5 text-blue-600 shrink-0" />

              <div>
                <p className="text-sm font-semibold text-blue-800">
                  School Admin
                </p>

                <p className="text-xs text-blue-600">
                  Only your own school
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <Users className="w-5 h-5 text-emerald-600 shrink-0" />

              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  Teacher
                </p>

                <p className="text-xs text-emerald-600">
                  Assigned school/class access
                </p>
              </div>
            </div>

          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleSignIn}
            disabled={signingIn}
            className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-gray-200 text-gray-800 font-bold hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-3 shadow-sm btn-3d"
          >
            {signingIn ? (
              <>
                <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                Checking Google Account...
              </>
            ) : (
              <>
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />

                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />

                  <path
                    fill="#FBBC05"
                    d="M5.84 14.1a6.98 6.98 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
                  />

                  <path
                    fill="#EA4335"
                    d="M12 4.77c1.61 0 3.06.55 4.2 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.06l3.66 2.84C6.71 6.7 9.14 4.77 12 4.77z"
                  />
                </svg>

                Continue with Google
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400 mt-5">
            Access is based on your authorized account.
          </p>

        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
          >
            ← Back to Platform Home
          </button>
        </div>

      </div>
    </div>
  );
}
```
