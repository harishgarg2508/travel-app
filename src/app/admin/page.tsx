'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Trip, Booking } from '@/lib/types';
import AdminGuard from '@/components/AdminGuard';
import Link from 'next/link';
import toast from 'react-hot-toast';

function toDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value === 'string') return new Date(value);
  if (value.toDate) return value.toDate();
  return new Date(value);
}

function formatDate(value: any): string {
  const d = toDate(value);
  if (!d) return 'N/A';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'trips' | 'bookings'>('trips');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    // Listen to trips
    const tripsQuery = query(collection(db, 'trips'), orderBy('createdAt', 'desc'));
    const unsubTrips = onSnapshot(tripsQuery, (snapshot) => {
      const fetchedTrips = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Trip[];
      setTrips(fetchedTrips);
      setLoading(false);
    });

    // Listen to bookings
    const bookingsQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubBookings = onSnapshot(bookingsQuery, (snapshot) => {
      const fetchedBookings = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Booking[];
      setBookings(fetchedBookings);
    });

    return () => {
      unsubTrips();
      unsubBookings();
    };
  }, []);

  const handleDeleteTrip = async (tripId: string, imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this trip?')) return;

    setDeleting(tripId);
    try {
      // Note: Storage cleanup skipped because download URLs can't be used directly with deleteObject
      // Consider storing the storage path separately in the trip document for cleanup
      await deleteDoc(doc(db, 'trips', tripId));
      toast.success('Trip deleted successfully');
    } catch (err) {
      console.error('Error deleting trip:', err);
      toast.error('Failed to delete trip');
    } finally {
      setDeleting(null);
    }
  };

  const getTripBookings = (tripId: string) => {
    return bookings.filter((b) => b.tripId === tripId);
  };

  return (
    <AdminGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage your trips and bookings</p>
          </div>
          <Link
            href="/admin/add-trip"
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg shadow-orange-500/25"
          >
            + Add Trip
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-500">Total Trips</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{trips.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-500">Total Bookings</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{bookings.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-500">Upcoming Trips</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {trips.filter((t) => new Date(t.dateTime) > new Date()).length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('trips')}
            className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'trips'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Trips
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'bookings'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Bookings
          </button>
        </div>

        {/* Trips Tab */}
        {activeTab === 'trips' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mx-auto" />
              </div>
            ) : trips.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 mb-4">No trips created yet</p>
                <Link
                  href="/admin/add-trip"
                  className="text-orange-500 font-medium hover:text-orange-600"
                >
                  Add your first trip
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Route</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Vehicle</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Date/Time</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Price</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Seats</th>
                      <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map((trip) => {
                      const tripBookings = getTripBookings(trip.id);
                      const totalBookedSeats = tripBookings.reduce(
                        (sum, b) => sum + b.seatsBooked, 0
                      );
                      return (
                        <tr key={trip.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{trip.fromCity}</span>
                              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                              <span className="font-medium text-gray-900">{trip.toCity}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                              {trip.vehicleType}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {new Date(trip.dateTime).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            ₹{trip.price}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {trip.seatsAvailable}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/admin/edit-trip/${trip.id}`}
                                className="px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDeleteTrip(trip.id, trip.imageUrl)}
                                disabled={deleting === trip.id}
                                className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {deleting === trip.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {bookings.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500">No bookings yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">User</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Contact</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Trip ID</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Seats</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Booked At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{booking.name}</p>
                          <p className="text-sm text-gray-500">{booking.email}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{booking.phone}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono text-gray-600">{booking.tripId.slice(0, 8)}...</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                            {booking.seatsBooked} seat{booking.seatsBooked > 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {formatDate(booking.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
