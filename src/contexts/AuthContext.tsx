'use client';

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserData } from '@/lib/types';
import toast from 'react-hot-toast';



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

async function syncUserProfile(firebaseUser: User, setUserData: (userData: UserData) => void) {
  const fallbackUserData: UserData = {
    uid: firebaseUser.uid,
    name: firebaseUser.displayName || 'User',
    email: firebaseUser.email || '',
  };

  try {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      setUserData(userDocSnap.data() as UserData);
      return;
    }

    await setDoc(userDocRef, fallbackUserData);
    setUserData(fallbackUserData);
  } catch (profileError) {
    console.error('User profile sync failed. Falling back to auth profile only.', profileError);
    setUserData(fallbackUserData);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const isSigningUpRef = useRef(false);

  const isAdmin = normalizeEmail(user?.email) === normalizeEmail(ADMIN_EMAIL);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active) return;

      setUser(firebaseUser);
      if (firebaseUser) {
        // If we are currently signing up, the signup function itself will handle
        // creating the user profile document with the correct name and data.
        if (!isSigningUpRef.current) {
          await syncUserProfile(firebaseUser, setUserData);
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
    isSigningUpRef.current = true;
    setLoading(true);
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
    } finally {
      isSigningUpRef.current = false;
      setLoading(false);
    }
  };

  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return signInWithPopup(auth, provider);
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
