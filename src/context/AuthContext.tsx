
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

/*
 * =========================================================
 * AUTH CONTEXT TYPE
 * =========================================================
 */

interface AuthContextValue {
  user: User | null;
  role: UserRole;
  loading: boolean;

  /*
   * Current role helpers
   */
  isPlatformAdmin: boolean;
  isSchoolAdmin: boolean;
  isTeacher: boolean;
  isUser: boolean;

  /*
   * Legacy compatibility
   */
  isAdmin: boolean;
  isFaculty: boolean;

  /*
   * Authentication
   */
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

/*
 * =========================================================
 * CONTEXT
 * =========================================================
 */

const AuthContext =
  createContext<AuthContextValue | undefined>(undefined);

/*
 * =========================================================
 * PROVIDER
 * =========================================================
 */

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);

  const [role, setRole] =
    useState<UserRole>('user');

  const [loading, setLoading] =
    useState(true);

  /*
   * =======================================================
   * FIREBASE AUTH STATE
   * =======================================================
   */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        /*
         * Always enter loading state while resolving
         * authentication + application role.
         */
        setLoading(true);

        /*
         * ---------------------------------------------------
         * NO LOGIN
         * ---------------------------------------------------
         */

        if (!firebaseUser) {
          setUser(null);
          setRole('user');
          setLoading(false);
          return;
        }

        /*
         * ---------------------------------------------------
         * USER LOGGED IN
         * ---------------------------------------------------
         */

        setUser(firebaseUser);

        /*
         * Normalize email once.
         */
        const email =
          firebaseUser.email
            ?.trim()
            .toLowerCase() ?? '';

        try {
          /*
           * -------------------------------------------------
           * 1. PLATFORM ADMIN
           * -------------------------------------------------
           *
           * This is the highest priority role.
           *
           * The fixed platform-admin email must ALWAYS
           * receive platform_admin.
           *
           * This check happens before Firestore role lookup.
           */
          if (isPlatformAdminEmail(email)) {
            /*
             * Make sure the normal user record also exists.
             */
            try {
              await ensureUserRecord(
                firebaseUser.uid,
                email,
                firebaseUser.displayName,
                firebaseUser.photoURL
              );
            } catch (recordError) {
              /*
               * A user-record write failure should not remove
               * the fixed Platform Admin role.
               */
              console.error(
                'Platform admin user record update failed:',
                recordError
              );
            }

            setRole('platform_admin');
            setLoading(false);
            return;
          }

          /*
           * -------------------------------------------------
           * 2. NORMAL USER RECORD
           * -------------------------------------------------
           */

          await ensureUserRecord(
            firebaseUser.uid,
            email,
            firebaseUser.displayName,
            firebaseUser.photoURL
          );

          /*
           * -------------------------------------------------
           * 3. RESOLVE APPLICATION ROLE
           * -------------------------------------------------
           *
           * fetchUserRole is responsible for checking:
           *
           * - active school_admin membership
           * - active teacher membership
           * - normal user
           */
          const resolvedRole =
            await fetchUserRole(
              firebaseUser.uid,
              email
            );

          /*
           * -------------------------------------------------
           * 4. ACCEPT ONLY KNOWN ROLES
           * -------------------------------------------------
           *
           * Prevent unexpected Firestore values from becoming
           * management access.
           */
          if (
            resolvedRole === 'school_admin'
          ) {
            setRole('school_admin');
          } else if (
            resolvedRole === 'teacher'
          ) {
            setRole('teacher');
          } else {
            setRole('user');
          }
        } catch (error) {
          /*
           * -------------------------------------------------
           * ROLE LOOKUP FAILED
           * -------------------------------------------------
           *
           * Safe fallback:
           *
           * - Fixed Platform Admin -> platform_admin
           * - Everyone else -> user
           *
           * Never give school-admin/teacher access if lookup
           * fails.
           */
          console.error(
            'Auth role resolution failed:',
            error
          );

          if (isPlatformAdminEmail(email)) {
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
   * =========================================================
   * GOOGLE LOGIN
   * =========================================================
   */

  const signInWithGoogle =
    useCallback(async () => {
      await signInWithPopup(
        auth,
        googleProvider
      );
    }, []);

  /*
   * =========================================================
   * LOGOUT
   * =========================================================
   */

  const signOut =
    useCallback(async () => {
      try {
        await firebaseSignOut(auth);
      } finally {
        /*
         * Clear local state immediately.
         */
        setUser(null);
        setRole('user');
        setLoading(false);
      }
    }, []);

  /*
   * =========================================================
   * ROLE HELPERS
   * =========================================================
   */

  const isPlatformAdmin =
    role === 'platform_admin';

  const isSchoolAdmin =
    role === 'school_admin';

  const isTeacher =
    role === 'teacher';

  const isUser =
    role === 'user';

  /*
   * =========================================================
   * LEGACY HELPERS
   * =========================================================
   *
   * Existing components may still use:
   *
   * isAdmin
   * isFaculty
   *
   * Keep them working.
   */

  const isAdmin =
    isPlatformAdmin ||
    isSchoolAdmin;

  const isFaculty =
    isTeacher;

  /*
   * =========================================================
   * PROVIDER
   * =========================================================
   */

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

/*
 * =========================================================
 * useAuth HOOK
 * =========================================================
 */

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within AuthProvider'
    );
  }

  return context;
}

