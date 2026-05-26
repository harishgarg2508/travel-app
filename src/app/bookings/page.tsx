'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Booking, Trip } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { format } from 'date-fns';

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

interface BookingWithTrip extends Booking {
  trip?: Trip;
}

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<BookingWithTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    if (!user) {
      setLoading(false);
      return;
    }

    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
      void (async () => {
        try {
          const fetchedBookings = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Booking[];

          const bookingsWithTrips: BookingWithTrip[] = await Promise.all(
            fetchedBookings.map(async (booking) => {
              try {
                const tripRef = doc(db, 'trips', booking.tripId);
                const tripSnap = await getDoc(tripRef);
                if (tripSnap.exists()) {
                  return {
                    ...booking,
                    trip: { id: tripSnap.id, ...tripSnap.data() } as Trip,
                  };
                }
              } catch (error) {
                if (!isAbortError(error)) {
                  console.error('Error fetching trip for booking:', error);
                }
              }
              return booking;
            })
          );

          if (!active) return;

          setBookings(bookingsWithTrips);
          setLoading(false);
        } catch (error) {
          if (!isAbortError(error)) {
            console.error('Error in bookings listener:', error);
          }
          if (active) {
            setLoading(false);
          }
        }
      })();
    }, (error) => {
      if (!isAbortError(error)) {
        console.error('Error in bookings listener:', error);
      }
      if (active) {
        setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Login required</h2>
        <p className="text-gray-500">Please sign in to view your booking history.</p>
        <Link
          href="/login?redirect=/bookings"
          className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg shadow-orange-500/25"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-500 mt-1">View and manage your trip bookings</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h2>
          <p className="text-gray-500 mb-6">You haven&apos;t booked any trips yet. Start exploring!</p>
          <Link
            href="/#trips"
            className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg shadow-orange-500/25"
          >
            Browse Trips
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const trip = booking.trip;
            const bookingDate = booking.createdAt
              ? (typeof booking.createdAt === 'string'
                  ? new Date(booking.createdAt)
                  : (booking.createdAt as any).toDate?.() || new Date())
              : null;

            return (
              <div
                key={booking.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Trip Image */}
                    <div className="w-full sm:w-24 h-32 sm:h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {trip?.imageUrl ? (
                        <img
                          src={trip.imageUrl}
                          alt={`${trip.fromCity} to ${trip.toCity}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
                          <svg className="w-8 h-8 text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Booking Details */}
                    <div className="flex-1 min-w-0">
                      {trip ? (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold px-2.5 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                              {trip.vehicleType}
                            </span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              new Date(trip.dateTime) > new Date()
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {new Date(trip.dateTime) > new Date() ? 'Upcoming' : 'Completed'}
                            </span>
                          </div>

                          <h3 className="text-lg font-bold text-gray-900 mt-1">
                            <Link href={`/trips/${trip.id}`} className="hover:text-orange-500 transition-colors">
                              {trip.fromCity} → {trip.toCity}
                            </Link>
                          </h3>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {format(new Date(trip.dateTime), 'MMM dd, yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {format(new Date(trip.dateTime), 'hh:mm a')}
                            </span>
                          </div>
                        </>
                      ) : (
                        <h3 className="text-lg font-bold text-gray-900">
                          Trip (ID: {booking.tripId.slice(0, 8)}...)
                        </h3>
                      )}

                      <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                        <div>
                          <span className="text-xs text-gray-500">Seats booked</span>
                          <p className="font-semibold text-gray-900">{booking.seatsBooked}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Contact</span>
                          <p className="font-semibold text-gray-900 text-sm">{booking.phone}</p>
                        </div>
                        {bookingDate && (
                          <div>
                            <span className="text-xs text-gray-500">Booked on</span>
                            <p className="font-semibold text-gray-900 text-sm">
                              {format(bookingDate, 'MMM dd, yyyy')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* View Trip Link */}
                    {trip && (
                      <div className="flex-shrink-0">
                        <Link
                          href={`/trips/${trip.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
                        >
                          View Trip
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
