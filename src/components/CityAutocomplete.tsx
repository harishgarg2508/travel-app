'use client';

import { useState, useRef, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { mergeCities, searchCities, saveSingleCity } from '@/lib/cities';

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

export default function CityAutocomplete({
  value,
  onChange,
  placeholder = 'Search city...',
  icon,
}: CityAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>(() => mergeCities([]));
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const results = searchCities(inputValue, cities);
    setSuggestions(results);
    setShowSuggestions((current) => current && results.length > 0);
  }, [cities, inputValue]);

  useEffect(() => {
    const citiesQuery = query(collection(db, 'cities'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(
      citiesQuery,
      (snapshot) => {
        const firestoreCities = snapshot.docs
          .map((cityDoc) => cityDoc.data().name)
          .filter((name): name is string => typeof name === 'string');

        setCities(mergeCities(firestoreCities));
      },
      (error) => {
        console.error('Failed to load city suggestions:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        if (inputValue.trim()) {
          saveSingleCity(inputValue.trim());
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
    const results = searchCities(val, cities);
    setSuggestions(results);
    setShowSuggestions(results.length > 0);
    setActiveIndex(-1);
  };

  const handleSelect = (city: string) => {
    setInputValue(city);
    onChange(city);
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showSuggestions && activeIndex >= 0) {
        e.preventDefault();
        handleSelect(suggestions[activeIndex]);
      } else if (inputValue.trim()) {
        e.preventDefault();
        saveSingleCity(inputValue.trim());
        setShowSuggestions(false);
      }
      return;
    }

    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            const results = searchCities(inputValue, cities);
            setSuggestions(results);
            if (results.length > 0) setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all`}
        />
      </div>

      {showSuggestions && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((city, index) => (
            <button
              key={city}
              type="button"
              onClick={() => handleSelect(city)}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                index === activeIndex
                  ? 'bg-orange-50 text-orange-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
