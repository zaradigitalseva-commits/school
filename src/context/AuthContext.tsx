import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';

import { auth, googleProvider } from '@/firebase/config';

import {
  fetchUserRole,
  ensureUserRecord,
  isPlatformAdminEmail,
} from '@/firebase/firestore';

import type { UserRole } from '@/firebase/types';

interface AuthContextValue {
  user: User | null;
  role: UserRole;
  loading: boolean;

  // New role helpers
  isPlatformAdmin: boolean;
  isSchoolAdmin: boolean;
  isTeacher: boolean;
  isUser: boolean;

  // Legacy compatibility
  isAdmin: boolean;
  isFaculty: boolean;

  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setLoading(true);

        if (!firebaseUser) {
          setUser(null);
          setRole('user');
          setLoading(false);
          return;
        }

        setUser(firebaseUser);

        try {
          /*
           * Create/update the user's basic Firestore record.
           * The Firestore helper decides the platform-admin role
           * from the configured platform-admin email.
           */
          await ensureUserRecord(
            firebaseUser.uid,
            firebaseUser.email,
            firebaseUser.displayName,
            firebaseUser.photoURL
          );

          /*
           * Resolve the actual application role.
           *
           * Priority:
           * 1. Platform Admin
           * 2. Active School Admin
           * 3. Active Teacher
           * 4. Normal User
           */
          const userRole = await fetchUserRole(
            firebaseUser.uid,
            firebaseUser.email
          );

          setRole(userRole);
        } catch (error) {
          console.error('Auth role resolution failed:', error);

          /*
           * Safe fallback.
           * Never give management access when role lookup fails.
           */
          if (isPlatformAdminEmail(firebaseUser.email)) {
            setRole('platform_admin');
          } else {
            setRole('user');
          }
        }

        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  /*
   * Google Login
   */
  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  /*
   * Logout
   */
  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);

    setUser(null);
    setRole('user');
  }, []);

  const isPlatformAdmin = role === 'platform_admin';
  const isSchoolAdmin = role === 'school_admin';
  const isTeacher = role === 'teacher';
  const isUser = role === 'user';

  /*
   * Legacy compatibility:
   *
   * Existing old components may still use isAdmin/isFaculty.
   * Keeping these prevents unnecessary breakage while we migrate
   * the remaining old dashboard files.
   */
  const isAdmin = isPlatformAdmin || isSchoolAdmin;
  const isFaculty = isTeacher;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,

        isPlatformAdmin,
        isSchoolAdmin,
        isTeacher,
        isUser,

        isAdmin,
        isFaculty,

        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within AuthProvider'
    );
  }

  return context;
}
