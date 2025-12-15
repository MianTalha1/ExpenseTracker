/**
 * Auth Context
 * Global authentication state management with Firebase Auth
 */

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
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { DEFAULT_CATEGORIES } from '@casha/shared';
import type { User, LoginRequest, CreateUserRequest, AuthState } from '@casha/shared';

interface AuthContextType extends AuthState {
  firebaseUser: FirebaseUser | null;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: CreateUserRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Convert Firestore user doc to our User type
function toUser(uid: string, data: Record<string, unknown>): User {
  const createdAt = data.createdAt as { toDate?: () => Date } | undefined;
  return {
    id: uid,
    email: data.email as string,
    name: (data.name as string) || null,
    createdAt: createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        // Fetch user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            setUser(toUser(fbUser.uid, userDoc.data()));
          } else {
            // User document doesn't exist, create it
            const userData = {
              email: fbUser.email,
              name: fbUser.displayName,
              createdAt: serverTimestamp(),
            };
            await setDoc(doc(db, 'users', fbUser.uid), userData);
            setUser({
              id: fbUser.uid,
              email: fbUser.email || '',
              name: fbUser.displayName,
              createdAt: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fall back to basic user info from Firebase Auth
          setUser({
            id: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName,
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    await signInWithEmailAndPassword(auth, data.email, data.password);
    // Auth state listener will handle the rest
  }, []);

  const register = useCallback(async (data: CreateUserRequest) => {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    const { user: fbUser } = userCredential;

    // Update display name if provided
    if (data.name) {
      await updateFirebaseProfile(fbUser, { displayName: data.name });
    }

    // Create user document and default categories in Firestore using batch
    const batch = writeBatch(db);

    // Create user document
    const userRef = doc(db, 'users', fbUser.uid);
    batch.set(userRef, {
      email: data.email,
      name: data.name || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create default categories
    const categoriesRef = collection(db, 'users', fbUser.uid, 'categories');
    DEFAULT_CATEGORIES.forEach((category) => {
      const categoryRef = doc(categoriesRef);
      batch.set(categoryRef, {
        name: category.name,
        color: category.color,
        icon: category.icon,
        createdAt: serverTimestamp(),
      });
    });

    await batch.commit();
    // Auth state listener will handle setting the user
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    // Auth state listener will handle clearing the user
  }, []);

  const refreshUser = useCallback(async () => {
    if (firebaseUser) {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        setUser(toUser(firebaseUser.uid, userDoc.data()));
      }
    }
  }, [firebaseUser]);

  // Get Firebase ID token for API calls (AI features)
  const getIdToken = useCallback(async () => {
    if (firebaseUser) {
      return firebaseUser.getIdToken();
    }
    return null;
  }, [firebaseUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
