'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Trip } from '@/lib/types';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import BookingForm from '@/components/BookingForm';
import Link from 'next/link';

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    async function loadTrip() {
      try {
        const docRef = doc(db, 'trips', params.id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTrip({ id: docSnap.id, ...docSnap.data() } as Trip);
        }
      } catch (err) {
        console.error('Error loading trip:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTrip();
  }, [params.id]);

  const handleBookClick = () => {
    if (!user) {
      router.push(`/login?redirect=/trips/${params.id}`);
      return;
    }
    setShowBooking(true);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Trip not found</h2>
        <Link href="/" className="text-orange-500 hover:text-orange-600 font-medium">
          Back to trips
        </Link>
      </div>
    );
  }

  const date = new Date(trip.dateTime);
  const isFullyBooked = trip.seatsAvailable <= 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/#trips" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to trips
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Trip Details */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Image */}
            <div className="h-64 sm:h-80 overflow-hidden bg-gray-200">
              {trip.imageUrl ? (
                <img
                  src={trip.imageUrl}
                  alt={`${trip.vehicleType}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
                  <svg className="w-24 h-24 text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 text-sm font-semibold bg-orange-100 text-orange-700 rounded-full">
                  {trip.vehicleType}
                </span>
                {isFullyBooked && (
                  <span className="px-3 py-1 text-sm font-semibold bg-red-100 text-red-700 rounded-full">
                    Fully Booked
                  </span>
                )}
              </div>

              {/* Route */}
              <div className="flex items-center gap-3 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{trip.fromCity}</p>
                </div>
                <div className="flex-1 flex items-center">
                  <div className="h-0.5 flex-1 bg-gray-200" />
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-1">
                    <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                  <div className="h-0.5 flex-1 bg-gray-200" />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{trip.toCity}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-semibold text-gray-900">{format(date, 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-semibold text-gray-900">{format(date, 'hh:mm a')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Seats Available</p>
                  <p className={`font-semibold ${isFullyBooked ? 'text-red-500' : 'text-gray-900'}`}>
                    {isFullyBooked ? 'Full' : trip.seatsAvailable}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="font-semibold text-gray-900">
                    {trip.price > 0 ? `₹${trip.price}` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
            {showBooking ? (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Book Your Trip</h2>
                <BookingForm
                  tripId={trip.id}
                  maxSeats={trip.seatsAvailable}
                  onSuccess={() => setShowBooking(false)}
                  onCancel={() => setShowBooking(false)}
                />
              </>
            ) : (
              <div className="text-center">
                <div className="mb-6">
                  <p className="text-3xl font-bold text-gray-900">
                    {trip.price > 0 ? `₹${trip.price}` : 'Price N/A'}
                  </p>
                  <p className="text-sm text-gray-500">per seat</p>
                </div>

                <button
                  onClick={handleBookClick}
                  disabled={isFullyBooked}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-orange-500/25"
                >
                  {isFullyBooked ? 'Fully Booked' : user ? 'Book Now' : 'Login to Book'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
