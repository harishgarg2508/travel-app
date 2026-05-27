'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

import { useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function getFirebaseErrorCode(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error
    ? (error as { code?: unknown }).code
    : undefined;
}

function getGoogleSignInErrorMessage(error: unknown) {
  const code = getFirebaseErrorCode(error);

  if (code === 'auth/unauthorized-domain') {
    return 'This production domain is not authorized in Firebase Authentication.';
  }

  if (code === 'auth/popup-blocked') {
    return 'The Google sign-in popup was blocked by the browser.';
  }

  if (code === 'auth/popup-closed-by-user') {
    return '';
  }

  if (code === 'auth/operation-not-allowed') {
    return 'Google sign-in is not enabled in Firebase Authentication.';
  }

  return 'Failed to sign in with Google. Please try again.';
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [showPopupHelp, setShowPopupHelp] = useState(false);
  const googleBtnRef = useRef<HTMLButtonElement>(null);

  const redirectTo = searchParams.get('redirect');
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase() || '';

  const getPostLoginPath = useCallback((email: string | null | undefined) => {
    if (redirectTo) return redirectTo;
    return email?.trim().toLowerCase() === adminEmail ? '/admin' : '/';
  }, [redirectTo, adminEmail]);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    // If the user is actively submitting the login form or signing in via Google,
    // let the submit/click handler handle the redirect and toast to avoid dual routing.
    if (submitting || googleSubmitting) return;

    router.replace(getPostLoginPath(user.email));
  }, [loading, user, submitting, googleSubmitting, router, getPostLoginPath]);

  useEffect(() => {
    const btn = googleBtnRef.current;
    if (!btn) return;

    const handleNativeClick = (e: MouseEvent) => {
      e.preventDefault();

      // 1. Defend against social media In-App WebViews (Google OAuth blocker)
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent || "" : "";
      const isInApp = /Instagram|FBAN|FBAV|FB_IAB|TikTok|Twitter|wv\)|WebView|InApp/i.test(ua);
      if (isInApp) {
        toast.error(
          "Google Login is blocked inside social media WebViews. " +
          "Please tap the options icon (...) and select 'Open in Chrome/Safari' to log in."
        );
        return;
      }
      
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      // CALL signInWithPopup synchronously FIRST inside the native mouse click context
      const signInPromise = signInWithPopup(auth, provider);
      
      // Update loading state in next tick/rendering cycle
      setGoogleSubmitting(true);
      setShowPopupHelp(false);

      signInPromise
        .then(async (credential) => {
          // 2. Await Secure user profile synchronization to prevent race conditions
          const userDocRef = doc(db, 'users', credential.user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (!userDocSnap.exists()) {
            await setDoc(userDocRef, {
              uid: credential.user.uid,
              name: credential.user.displayName || 'User',
              email: credential.user.email || '',
            });
          }

          toast.success('Signed in with Google!');
          router.replace(getPostLoginPath(credential.user.email));
        })
        .catch((err: any) => {
          console.error('Google sign-in native failed', err);
          if (err && (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request')) {
            setShowPopupHelp(true);
          } else {
            const message = getGoogleSignInErrorMessage(err);
            if (message) {
              toast.error(message);
            }
          }
        })
        .finally(() => {
          setGoogleSubmitting(false);
        });
    };

    btn.addEventListener('click', handleNativeClick);
    return () => {
      btn.removeEventListener('click', handleNativeClick);
    };
  }, [getPostLoginPath, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const credential = await login(email, password);
      toast.success('Welcome back!');
      router.replace(getPostLoginPath(credential.user.email));
    } catch (err: unknown) {
      console.error('Login form submit failed', err);
      const code = getFirebaseErrorCode(err);
      const message =
        code === 'auth/user-not-found'
          ? 'No account found with this email'
          : code === 'auth/wrong-password' || code === 'auth/invalid-credential'
          ? 'Invalid email or password'
          : 'Failed to login. Please try again.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-500 mt-1">Sign in to book your next trip</p>
          </div>

          {/* Popup Block Help Alert */}
          {showPopupHelp && (
            <div className="mb-5 p-4 bg-orange-50 border border-orange-200 rounded-xl animate-fade-in">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 shrink-0 mt-0.5">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-orange-800">Google Sign-in Blocked</h4>
                  <p className="text-xs text-orange-700 mt-1 leading-relaxed">
                    Your browser blocked the secure Google sign-in window. Please click the "Sign in with Google" button again and click **"Allow popups"** in your browser's address bar to log in.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Google Sign In */}
          <button
            type="button"
            ref={googleBtnRef}
            disabled={googleSubmitting}
            className="w-full py-3 border border-gray-200 rounded-xl text-gray-700 font-medium flex items-center justify-center gap-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mb-4"
          >
            {googleSubmitting ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Sign in with Google
          </button>

          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">or sign in with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-orange-500/25"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-orange-500 font-medium hover:text-orange-600">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
