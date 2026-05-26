'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserData } from '@/lib/types';

function isAbortError(error: unknown) {
  if (!error) return false;

  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }

  if (typeof error === 'object' && error !== null) {
    const name = 'name' in error ? (error as { name?: unknown }).name : undefined;
    if (name === 'AbortError') {
      return true;
    }
  }

  const message = typeof error === 'string'
    ? error
    : typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message?: unknown }).message
      : undefined;

  return typeof message === 'string' && /aborterror|aborted a request/i.test(message);
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (name: string, email: string, password: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() || '';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = normalizeEmail(user?.email) === normalizeEmail(ADMIN_EMAIL);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active) return;

      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (!active) return;
          if (docSnap.exists()) {
            setUserData(docSnap.data() as UserData);
          } else {
            setUserData({
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
            });
          }
        } catch (error) {
          if (!active) {
            return;
          }

          if (!isAbortError(error)) {
            console.error('Failed to load user data from Firestore for signed-in user. Falling back to auth profile only.', error);
          }

          setUserData({
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || '',
            email: firebaseUser.email || '',
          });
        }
      } else {
        setUserData(null);
      }
      if (active) {
        setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      return await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      console.error('Email/password login failed', error);
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: name });
      const userData: UserData = {
        uid: cred.user.uid,
        name,
        email: cred.user.email || email.trim(),
      };
      await setDoc(doc(db, 'users', cred.user.uid), userData);
      setUserData(userData);
      return cred;
    } catch (error) {
      console.error('Signup failed', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      // Create/update user document in Firestore
      const userDocRef = doc(db, 'users', cred.user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        const newUserData: UserData = {
          uid: cred.user.uid,
          name: cred.user.displayName || 'User',
          email: cred.user.email || '',
        };
        await setDoc(userDocRef, newUserData);
        setUserData(newUserData);
      }
      return cred;
    } catch (error) {
      console.error('Google sign-in failed', error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserData(null);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, isAdmin, login, signup, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
