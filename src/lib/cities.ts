import { INDIAN_CITIES } from './types';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

function normalizeCityName(city: string) {
  return city.trim().replace(/\s+/g, ' ');
}

function cityDocId(city: string) {
  return encodeURIComponent(normalizeCityName(city).toLowerCase());
}

export function mergeCities(cities: string[]) {
  const cityMap = new Map<string, string>();

  [...INDIAN_CITIES, ...cities].forEach((city) => {
    const normalized = normalizeCityName(city);
    if (normalized) {
      cityMap.set(normalized.toLowerCase(), normalized);
    }
  });

  return Array.from(cityMap.values()).sort((a, b) => a.localeCompare(b));
}

export function searchCities(query: string, cities = INDIAN_CITIES, limit = 5): string[] {
  if (!query || query.length < 1) return [];
  const lower = query.toLowerCase();
  return cities
    .filter((city) => city.toLowerCase().includes(lower))
    .slice(0, limit);
}

export async function saveCitiesForTrip(fromCity: string, toCity: string) {
  const cities = mergeCities([fromCity, toCity]).filter((city) =>
    [fromCity, toCity].some((tripCity) => normalizeCityName(tripCity).toLowerCase() === city.toLowerCase())
  );

  await Promise.all(
    cities.map((city) =>
      setDoc(
        doc(db, 'cities', cityDocId(city)),
        {
          name: city,
          searchName: city.toLowerCase(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    )
  );
}

export default INDIAN_CITIES;
