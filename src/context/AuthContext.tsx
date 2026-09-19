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
  ensureUserRecord,
  fetchMyMembership,
  isPlatformAdminEmail,
  subscribeToMyMembership,
} from '@/firebase/firestore';

import type { UserRole } from '@/firebase/types';

interface AuthContextValue {
  user: User | null;
  role: UserRole;
  loading: boolean;
  isPlatformAdmin: boolean;
  isSchoolAdmin: boolean;
  isTeacher: boolean;
  isUser: boolean;
  isAdmin: boolean;
  isFaculty: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setLoading(true);

        if (!firebaseUser) {
          const previousUser = auth.currentUser as any;
          previousUser?.__schoolMembershipUnsubscribe?.();
          setUser(null);
          setRole('user');
          setLoading(false);
          return;
        }

        setUser(firebaseUser);

        const email =
          firebaseUser.email?.trim().toLowerCase() ?? '';

        try {
          if (isPlatformAdminEmail(email)) {
            try {
              await ensureUserRecord(firebaseUser.uid, email);
            } catch (error) {
              console.error(
                'Platform admin user record sync failed:',
                error
              );
            }

            setRole('platform_admin');
            setLoading(false);
            return;
          }

          await ensureUserRecord(firebaseUser.uid, email);

          const membership = await fetchMyMembership();
          if (membership?.status === 'ACTIVE' && membership.role === 'school_admin') {
            setRole('school_admin');
          } else if (membership?.status === 'ACTIVE' && membership.role === 'teacher') {
            setRole('teacher');
          } else {
            setRole('user');
          }

          // Keep role live. If platform admin approves/suspends the membership,
          // this account changes role without requiring a browser refresh.
          const unsubscribeMembership = subscribeToMyMembership(
            firebaseUser.uid,
            (liveMembership) => {
              if (liveMembership?.status === 'ACTIVE' && liveMembership.role === 'school_admin') {
                setRole('school_admin');
              } else if (liveMembership?.status === 'ACTIVE' && liveMembership.role === 'teacher') {
                setRole('teacher');
              } else {
                setRole('user');
              }
            },
            (error) => console.error('Realtime membership listener failed:', error)
          );
          (firebaseUser as any).__schoolMembershipUnsubscribe = unsubscribeMembership;
        } catch (error) {
          console.error(
            'Auth role resolution failed:',
            error
          );

          // Never grant elevated access on a lookup error.
          setRole('user');
        } finally {
          setLoading(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
    } finally {
      setUser(null);
      setRole('user');
      setLoading(false);
    }
  }, []);

  const isPlatformAdmin = role === 'platform_admin';
  const isSchoolAdmin = role === 'school_admin';
  const isTeacher = role === 'teacher';
  const isUser = role === 'user';

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
        isAdmin: isPlatformAdmin || isSchoolAdmin,
        isFaculty: isTeacher,
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
