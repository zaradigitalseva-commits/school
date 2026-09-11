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
  isAdminEmail,
} from '@/firebase/firestore';
import type { UserRole } from '@/firebase/types';

interface AuthContextValue {
  user: User | null;
  role: UserRole;
  loading: boolean;
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          await ensureUserRecord(
            firebaseUser.uid,
            firebaseUser.email,
            firebaseUser.displayName,
            firebaseUser.photoURL
          );
          const userRole = await fetchUserRole(firebaseUser.uid, firebaseUser.email);
          setRole(userRole);
        } catch (err) {
          console.error('Auth role resolution failed:', err);
          setRole(isAdminEmail(firebaseUser.email) ? 'admin' : 'user');
        }
      } else {
        setUser(null);
        setRole('user');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setRole('user');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        isAdmin: role === 'admin',
        isFaculty: role === 'faculty',
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
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
