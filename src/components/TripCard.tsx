'use client';

import Link from 'next/link';
import { format } from 'date-fns';

interface TripCardProps {
  trip: {
    id: string;
    fromCity: string;
    toCity: string;
    dateTime: string;
    vehicleType: string;
    imageUrl: string;
    seatsAvailable: number;
    price: number;
  };
}

export default function TripCard({ trip }: TripCardProps) {
  const date = new Date(trip.dateTime);
  const isFullyBooked = trip.seatsAvailable <= 0;

  return (
    <Link href={`/trips/${trip.id}`}>
      <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-orange-200 transition-all duration-300">
        {/* Image */}
        <div className="relative h-48 overflow-hidden bg-gray-200">
          {trip.imageUrl ? (
            <img
              src={trip.imageUrl}
              alt={`${trip.vehicleType} from ${trip.fromCity} to ${trip.toCity}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
              <svg className="w-16 h-16 text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 text-xs font-semibold bg-white/90 backdrop-blur-sm rounded-full text-gray-800">
              {trip.vehicleType}
            </span>
          </div>
          {isFullyBooked && (
            <div className="absolute top-3 right-3">
              <span className="px-3 py-1 text-xs font-semibold bg-red-500/90 backdrop-blur-sm rounded-full text-white">
                Fully Booked
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Route */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-bold text-gray-900">{trip.fromCity}</span>
            <svg className="w-5 h-5 text-orange-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <span className="text-lg font-bold text-gray-900">{trip.toCity}</span>
          </div>

          {/* Date & Price */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{format(date, 'MMM dd, yyyy')}</span>
              <span>•</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{format(date, 'hh:mm a')}</span>
            </div>
          </div>

          {/* Seats & Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className={`text-sm font-medium ${isFullyBooked ? 'text-red-500' : 'text-gray-600'}`}>
                {isFullyBooked ? 'Full' : `${trip.seatsAvailable} seats`}
              </span>
            </div>
            <div className="text-right">
              {trip.price > 0 ? (
                <span className="text-xl font-bold text-gray-900">₹{trip.price}</span>
              ) : (
                <span className="text-sm text-gray-500">Price N/A</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
