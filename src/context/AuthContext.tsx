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

  // Current role helpers
  isPlatformAdmin: boolean;
  isSchoolAdmin: boolean;
  isTeacher: boolean;
  isUser: boolean;

  // Legacy compatibility
  isAdmin: boolean;
  isFaculty: boolean;

  // Authentication
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

/*
 * =========================================================
 * CONTEXT
 * =========================================================
 */

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined
  );

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
  const [user, setUser] =
    useState<User | null>(null);

  const [role, setRole] =
    useState<UserRole>('user');

  const [loading, setLoading] =
    useState(true);

  /*
   * =======================================================
   * FIREBASE AUTH STATE
   * =======================================================
   *
   * This runs:
   *
   * - after Google login
   * - after browser refresh
   * - when Firebase restores the login session
   * - after logout
   *
   * IMPORTANT:
   * Platform Admin is resolved BEFORE Firestore role lookup.
   */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (firebaseUser) => {
          // Always show loading while authentication
          // and application role are being resolved.
          setLoading(true);

          /*
           * =================================================
           * NO USER
           * =================================================
           */

          if (!firebaseUser) {
            setUser(null);
            setRole('user');
            setLoading(false);
            return;
          }

          /*
           * =================================================
           * USER EXISTS
           * =================================================
           */

          setUser(firebaseUser);

          const email =
            firebaseUser.email
              ?.trim()
              .toLowerCase() ?? '';

          try {
            /*
             * =================================================
             * 1. PLATFORM ADMIN
             * =================================================
             *
             * ngogrant454@gmail.com is the fixed
             * Platform/Super Admin.
             *
             * This check MUST happen before Firestore
             * role lookup.
             *
             * Therefore even after refresh:
             *
             * ngogrant454@gmail.com
             *        ↓
             * platform_admin
             */

            if (
              isPlatformAdminEmail(email)
            ) {
              /*
               * Make sure the user document exists.
               *
               * If this Firestore write fails, we STILL
               * keep the platform_admin role.
               */

              try {
                await ensureUserRecord(
                  firebaseUser.uid,
                  email,
                  firebaseUser.displayName,
                  firebaseUser.photoURL
                );
              } catch (recordError) {
                console.error(
                  'Platform admin user record update failed:',
                  recordError
                );
              }

              /*
               * IMPORTANT:
               * Never wait for fetchUserRole() for the
               * fixed Platform Admin.
               */

              setRole('platform_admin');
              setLoading(false);

              return;
            }

            /*
             * =================================================
             * 2. NORMAL USER RECORD
             * =================================================
             */

            await ensureUserRecord(
              firebaseUser.uid,
              email,
              firebaseUser.displayName,
              firebaseUser.photoURL
            );

            /*
             * =================================================
             * 3. RESOLVE APPLICATION ROLE
             * =================================================
             *
             * IMPORTANT FIX:
             *
             * fetchUserRole() receives UID only.
             *
             * Do NOT pass email here.
             */

            const resolvedRole =
              await fetchUserRole(
                firebaseUser.uid
              );

            /*
             * =================================================
             * 4. ACCEPT ONLY VALID ROLES
             * =================================================
             */

            if (
              resolvedRole ===
              'school_admin'
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
             * =================================================
             * ROLE RESOLUTION ERROR
             * =================================================
             *
             * Safe fallback:
             *
             * Platform Admin
             *      → platform_admin
             *
             * Everyone else
             *      → user
             *
             * We NEVER give school_admin or teacher access
             * if role lookup fails.
             */

            console.error(
              'Auth role resolution failed:',
              error
            );

            if (
              isPlatformAdminEmail(email)
            ) {
              setRole('platform_admin');
            } else {
              setRole('user');
            }
          }

          setLoading(false);
        }
      );

    /*
     * Cleanup Firebase listener
     */

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
   * Existing old components may still use:
   *
   * isAdmin
   * isFaculty
   *
   * Keep these for compatibility.
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
