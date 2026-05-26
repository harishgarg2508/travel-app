'use client';

import { useState } from 'react';
import { z } from 'zod';
import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const bookingSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  seatsBooked: z.number().min(1, 'At least 1 seat').max(20, 'Maximum 20 seats'),
});

interface BookingFormProps {
  tripId: string;
  maxSeats: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function BookingForm({ tripId, maxSeats, onSuccess, onCancel }: BookingFormProps) {
  const { user, userData } = useAuth();
  const [name, setName] = useState(userData?.name || '');
  const [email, setEmail] = useState(userData?.email || user?.email || '');
  const [phone, setPhone] = useState('');
  const [seats, setSeats] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = bookingSchema.safeParse({
      name,
      email,
      phone,
      seatsBooked: seats,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (seats > maxSeats) {
      setErrors({ seatsBooked: `Only ${maxSeats} seats available` });
      return;
    }

    if (maxSeats < 1) {
      setErrors({ seatsBooked: 'No seats available for this trip' });
      return;
    }

    setSubmitting(true);
    try {
      await runTransaction(db, async (transaction) => {
        const tripRef = doc(db, 'trips', tripId);
        const tripSnap = await transaction.get(tripRef);

        if (!tripSnap.exists()) {
          throw new Error('Trip not found');
        }

        const tripData = tripSnap.data();
        const currentAvailable = tripData.seatsAvailable ?? 0;

        // Check total booked seats from existing bookings
        const bookingsRef = collection(db, 'bookings');
        // Note: We can't query within a transaction, so we check against the trip's seatsAvailable
        if (currentAvailable < seats) {
          throw new Error(`Only ${currentAvailable} seats available`);
        }

        // Decrement seats on trip
        transaction.update(tripRef, {
          seatsAvailable: currentAvailable - seats,
        });

        const bookingRef = doc(collection(db, 'bookings'));
        transaction.set(bookingRef, {
          tripId,
          userId: user?.uid,
          name,
          email,
          phone,
          seatsBooked: seats,
          createdAt: serverTimestamp(),
        });
      });

      toast.success('Booking confirmed successfully!');
      onSuccess?.();
    } catch (err: any) {
      const message = err.message?.includes('Only ')
        ? err.message
        : 'Failed to create booking. Please try again.';
      toast.error(message);
      console.error('Booking error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
            errors.name ? 'border-red-400' : 'border-gray-200'
          }`}
          placeholder="Your name"
        />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
            errors.email ? 'border-red-400' : 'border-gray-200'
          }`}
          placeholder="your@email.com"
        />
        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
          className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
            errors.phone ? 'border-red-400' : 'border-gray-200'
          }`}
          placeholder="10-digit mobile number"
        />
        {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Number of Seats</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSeats(Math.max(1, seats - 1))}
            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="w-12 text-center text-xl font-semibold text-gray-900">{seats}</span>
          <button
            type="button"
            onClick={() => setSeats(Math.min(maxSeats, seats + 1))}
            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <span className="text-sm text-gray-500">/ {maxSeats} available</span>
        </div>
        {errors.seatsBooked && <p className="mt-1 text-sm text-red-500">{errors.seatsBooked}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-orange-500/25"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Booking...
            </span>
          ) : (
            'Confirm Booking'
          )}
        </button>
      </div>
    </form>
  );
}
