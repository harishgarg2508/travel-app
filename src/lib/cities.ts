import { INDIAN_CITIES } from './types';

export function searchCities(query: string, limit = 5): string[] {
  if (!query || query.length < 1) return [];
  const lower = query.toLowerCase();
  return INDIAN_CITIES
    .filter((city) => city.toLowerCase().includes(lower))
    .slice(0, limit);
}

export default INDIAN_CITIES;
