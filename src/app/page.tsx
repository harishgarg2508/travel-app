'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { collection, query, orderBy, limit, startAfter, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Trip } from '@/lib/types';
import HeroSection from '@/components/HeroSection';
import TripCard from '@/components/TripCard';
import SkeletonCard from '@/components/SkeletonCard';
import EmptyState from '@/components/EmptyState';
import CityAutocomplete from '@/components/CityAutocomplete';

const PAGE_SIZE = 20;
const REALTIME_LIMIT = 100;

export default function HomePage() {
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [hasMoreServer, setHasMoreServer] = useState(true);
  const lastDocRef = useRef<any>(null);
  const loadingMoreRef = useRef(false);

  // Search filters
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [searchDate, setSearchDate] = useState('');

  // Real-time listener for the first batch of trips
  useEffect(() => {
    setLoading(true);
    setDisplayCount(PAGE_SIZE);

    const q = query(
      collection(db, 'trips'),
      orderBy('dateTime', 'asc'),
      limit(REALTIME_LIMIT)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTrips = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Trip[];

      setAllTrips(fetchedTrips);
      setHasMoreServer(fetchedTrips.length >= REALTIME_LIMIT);

      // Track the last document for potential load-more via getDocs
      if (snapshot.docs.length > 0) {
        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
      }

      setLoading(false);
    }, (err) => {
      console.error('Error in real-time listener:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load more trips (beyond the real-time limit) via one-time fetch
  const handleLoadMore = async () => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const q = query(
        collection(db, 'trips'),
        orderBy('dateTime', 'asc'),
        startAfter(lastDocRef.current),
        limit(PAGE_SIZE)
      );
      const snapshot = await getDocs(q);

      const moreTrips = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Trip[];

      if (moreTrips.length > 0) {
        setAllTrips((prev) => [...prev, ...moreTrips]);
        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
      }

      setHasMoreServer(snapshot.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error loading more trips:', err);
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  };

  // Filter trips based on search criteria (client-side)
  const filteredTrips = useMemo(() => {
    let result = allTrips;

    if (searchFrom) {
      result = result.filter(
        (t) => t.fromCity.toLowerCase().includes(searchFrom.toLowerCase())
      );
    }
    if (searchTo) {
      result = result.filter(
        (t) => t.toCity.toLowerCase().includes(searchTo.toLowerCase())
      );
    }
    if (searchDate) {
      const target = searchDate;
      result = result.filter((t) => {
        const tripDate = t.dateTime.split('T')[0];
        return tripDate === target;
      });
    }

    return result;
  }, [allTrips, searchFrom, searchTo, searchDate]);

  // Paginate: show only up to displayCount
  const displayedTrips = useMemo(() => {
    return filteredTrips.slice(0, displayCount);
  }, [filteredTrips, displayCount]);

  const hasMore = filteredTrips.length > displayCount || hasMoreServer;

  const handleShowMore = () => {
    const nextCount = displayCount + PAGE_SIZE;
    setDisplayCount(nextCount);

    // If we're nearing the end of locally loaded trips, fetch more
    if (nextCount + PAGE_SIZE > allTrips.length && hasMoreServer) {
      handleLoadMore();
    }
  };

  return (
    <>
      <HeroSection />

      <section id="trips" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Trips</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CityAutocomplete
              value={searchFrom}
              onChange={setSearchFrom}
              placeholder="From city"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" suppressHydrationWarning>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
            <CityAutocomplete
              value={searchTo}
              onChange={setSearchTo}
              placeholder="To city"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" suppressHydrationWarning>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" suppressHydrationWarning>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Trip Listings */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : displayedTrips.length === 0 ? (
          <EmptyState
            title="No trips available"
            description={searchFrom || searchTo || searchDate
              ? 'No trips match your search criteria. Try different cities or dates.'
              : 'There are no upcoming trips right now. Check back later!'}
            action={
              (searchFrom || searchTo || searchDate) ? (
                <button
                  onClick={() => {
                    setSearchFrom('');
                    setSearchTo('');
                    setSearchDate('');
                  }}
                  className="px-6 py-2.5 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
                >
                  Clear Filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {displayedTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={handleShowMore}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    'Load More Trips'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
