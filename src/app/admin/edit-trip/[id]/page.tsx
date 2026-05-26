'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { saveCitiesForTrip } from '@/lib/cities';
import { VEHICLE_TYPES } from '@/lib/types';
import AdminGuard from '@/components/AdminGuard';
import CityAutocomplete from '@/components/CityAutocomplete';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function EditTripPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fromCity: '',
    toCity: '',
    dateTime: '',
    vehicleType: 'Bus',
    seatsAvailable: 40,
    price: 0,
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadTrip() {
      try {
        const docRef = doc(db, 'trips', params.id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            fromCity: data.fromCity || '',
            toCity: data.toCity || '',
            dateTime: data.dateTime || '',
            vehicleType: data.vehicleType || 'Bus',
            seatsAvailable: data.seatsAvailable || 40,
            price: data.price || 0,
          });
          setExistingImageUrl(data.imageUrl || '');
          setImagePreview(data.imageUrl || null);
        } else {
          toast.error('Trip not found');
          router.push('/admin');
        }
      } catch (err) {
        console.error('Error loading trip:', err);
        toast.error('Failed to load trip');
      } finally {
        setLoading(false);
      }
    }
    loadTrip();
  }, [params.id, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatDateTimeForInput = (dateTimeStr: string) => {
    try {
      const d = new Date(dateTimeStr);
      return d.toISOString().slice(0, 16);
    } catch {
      return dateTimeStr;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fromCity || !formData.toCity || !formData.dateTime) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (formData.fromCity.trim().toLowerCase() === formData.toCity.trim().toLowerCase()) {
      toast.error('From and To cities must be different');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = existingImageUrl;

      // Upload new image if changed
      if (image) {
        // Delete old image if exists
        if (existingImageUrl) {
          try {
            const oldImageRef = ref(storage, existingImageUrl);
            await deleteObject(oldImageRef);
          } catch {
            // Old image might not exist
          }
        }

        const storageRef = ref(storage, `trips/${Date.now()}_${image.name}`);
        const snapshot = await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const docRef = doc(db, 'trips', params.id as string);
      await updateDoc(docRef, {
        ...formData,
        imageUrl,
        price: Number(formData.price),
        seatsAvailable: Number(formData.seatsAvailable),
      });
      await saveCitiesForTrip(formData.fromCity, formData.toCity);

      toast.success('Trip updated successfully!');
      router.push('/admin');
    } catch (err) {
      console.error('Error updating trip:', err);
      toast.error('Failed to update trip. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to dashboard
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Trip</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Vehicle Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
              <select
                value={formData.vehicleType}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              >
                {VEHICLE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* From City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From City</label>
              <CityAutocomplete
                value={formData.fromCity}
                onChange={(val) => setFormData({ ...formData, fromCity: val })}
                placeholder="Departure city"
              />
            </div>

            {/* To City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To City</label>
              <CityAutocomplete
                value={formData.toCity}
                onChange={(val) => setFormData({ ...formData, toCity: val })}
                placeholder="Destination city"
              />
            </div>

            {/* Date & Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
              <input
                type="datetime-local"
                value={formatDateTimeForInput(formData.dateTime)}
                onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                required
              />
            </div>

            {/* Price & Seats */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seats Available</label>
                <input
                  type="number"
                  value={formData.seatsAvailable}
                  onChange={(e) => setFormData({ ...formData, seatsAvailable: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  min="1"
                  required
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Image</label>
              <div className="mt-1">
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition-all">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="flex flex-col items-center">
                      <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-500">Click to upload vehicle image</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Link
                href="/admin"
                className="flex-1 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl text-center hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
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
                    Updating...
                  </span>
                ) : (
                  'Update Trip'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminGuard>
  );
}
