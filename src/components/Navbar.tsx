'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user, isAdmin, logout, loading } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <img
              src="/logo.png"
              alt="All India Tour & Travel"
              className="w-7 h-7 sm:w-9 h-9 object-contain rounded-lg shadow-sm"
            />
            <span className="text-sm sm:text-base md:text-xl font-bold text-gray-900 whitespace-nowrap">
              <span className="hidden min-[380px]:inline">All India </span>
              <span className="text-orange-500">Tour & Travel</span>
            </span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-4">
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link
                      href="/bookings"
                      className="px-2 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors whitespace-nowrap"
                    >
                      <span className="sm:hidden">Bookings</span>
                      <span className="hidden sm:inline">My Bookings</span>
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="px-2 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors whitespace-nowrap"
                      >
                        Admin
                      </Link>
                    )}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-sm text-gray-600 hidden md:block">{user.email}</span>
                      <button
                        onClick={logout}
                        className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Link
                      href="/login"
                      className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors whitespace-nowrap"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
