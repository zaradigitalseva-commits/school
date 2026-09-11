import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, LogIn, AlertCircle, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function LoginPage() {
  const { user, role, loading, signInWithGoogle } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);

  if (loading) return <LoadingSpinner fullScreen label="Checking authentication..." />;

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl card-shadow p-8 text-center animate-scale-in">
          <img
            src={user.photoURL ?? ''}
            alt={user.displayName ?? 'User'}
            className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-blue-100"
          />
          <h2 className="text-xl font-bold text-gray-900">{user.displayName}</h2>
          <p className="text-sm text-gray-500 mb-4">{user.email}</p>

          <div className={`p-4 rounded-xl mb-6 ${
            role === 'admin' ? 'bg-blue-50' :
            role === 'faculty' ? 'bg-emerald-50' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-1">
              {role === 'admin' ? (
                <ShieldCheck className="w-5 h-5 text-blue-600" />
              ) : role === 'faculty' ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              ) : (
                <User className="w-5 h-5 text-gray-500" />
              )}
              <span className={`font-semibold ${
                role === 'admin' ? 'text-blue-700' :
                role === 'faculty' ? 'text-emerald-700' : 'text-gray-600'
              }`}>
                {role === 'admin' ? 'Administrator Access' :
                 role === 'faculty' ? 'Faculty Access' : 'Standard Public Access'}
              </span>
            </div>
            {role === 'user' && (
              <p className="text-xs text-gray-500 mt-1">
                You have standard public access. Only authorized administrators and faculty can access the dashboard.
              </p>
            )}
          </div>

          {role !== 'user' ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold btn-3d hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          ) : (
            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
            >
              Back to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
      showToast('Signed in successfully!', 'success');
    } catch {
      showToast('Sign-in failed. Please try again.', 'error');
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Bright Future Academy</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to access your dashboard</p>
        </div>

        <div className="bg-white rounded-3xl card-shadow p-8 animate-scale-in">
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Authorized Access Only</p>
                <p className="text-xs text-blue-700 mt-1">
                  Only authorized administrators and faculty members can access the dashboard.
                  If you are a standard user, you will have public viewing access only.
                </p>
              </div>
            </div>

            <button
              onClick={handleSignIn}
              disabled={signingIn}
              className="w-full px-6 py-3.5 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-semibold hover:border-blue-300 hover:bg-blue-50 transition-all disabled:opacity-60 inline-flex items-center justify-center gap-3"
            >
              {signingIn ? (
                <>
                  <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              By signing in, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full mt-4 text-sm text-gray-500 hover:text-blue-600 transition-colors inline-flex items-center justify-center gap-1.5"
        >
          <LogIn className="w-4 h-4" /> Continue as guest
        </button>
      </div>
    </div>
  );
}
