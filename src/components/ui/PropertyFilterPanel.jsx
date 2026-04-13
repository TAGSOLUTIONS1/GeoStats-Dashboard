import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import propertyListings from '../../data/properties/listings.json';

const EMPTY_FILTERS = {
  minRent: 0,
  maxRent: 500000,
  minBeds: 0,
  maxBeds: 10,
  minBaths: 0,
  maxBaths: 10,
  minRentPerSqft: 0,
  maxRentPerSqft: 300,
  type: '',
  furnishing: '',
  location: '',
};

const getNumericValues = (rows, accessor) => rows
  .map(accessor)
  .map((value) => Number(value))
  .filter((value) => Number.isFinite(value) && value >= 0);

const getRange = (values, fallbackMin, fallbackMax) => {
  if (!values.length) return { min: fallbackMin, max: fallbackMax };
  return {
    min: Math.floor(Math.min(...values)),
    max: Math.ceil(Math.max(...values)),
  };
};

const buildDraftFromFilters = (filters = {}, defaults = EMPTY_FILTERS) => ({
  minRent: filters?.minRent ?? defaults.minRent,
  maxRent: filters?.maxRent ?? defaults.maxRent,
  minBeds: filters?.minBeds ?? defaults.minBeds,
  maxBeds: filters?.maxBeds ?? defaults.maxBeds,
  minBaths: filters?.minBaths ?? defaults.minBaths,
  maxBaths: filters?.maxBaths ?? defaults.maxBaths,
  minRentPerSqft: filters?.minRentPerSqft ?? defaults.minRentPerSqft,
  maxRentPerSqft: filters?.maxRentPerSqft ?? defaults.maxRentPerSqft,
  type: filters?.type ?? '',
  furnishing: filters?.furnishing ?? '',
  location: filters?.location ?? '',
});

const toFilterNumber = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized) return undefined;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : undefined;
};

const PropertyFilterPanel = ({ isOpen, onClose, initialFilters = {}, onApply, onClear }) => {
  const numericDefaults = useMemo(() => {
    const rentRange = getRange(getNumericValues(propertyListings, (row) => row?.Rent), 0, 500000);
    const bedsRange = getRange(getNumericValues(propertyListings, (row) => row?.Beds), 0, 10);
    const bathsRange = getRange(getNumericValues(propertyListings, (row) => row?.Baths), 0, 10);
    const rentPerSqftRange = getRange(getNumericValues(propertyListings, (row) => row?.Rent_per_sqft), 0, 300);

    return {
      ...EMPTY_FILTERS,
      minRent: rentRange.min,
      maxRent: rentRange.max,
      minBeds: bedsRange.min,
      maxBeds: bedsRange.max,
      minBaths: bathsRange.min,
      maxBaths: bathsRange.max,
      minRentPerSqft: rentPerSqftRange.min,
      maxRentPerSqft: rentPerSqftRange.max,
    };
  }, []);

  const propertyTypeOptions = useMemo(() => {
    const set = new Set();
    propertyListings.forEach((row) => {
      const type = row?.Type ? String(row.Type).trim() : '';
      if (type) set.add(type);
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, []);

  const locationOptions = useMemo(() => {
    const set = new Set();
    propertyListings.forEach((row) => {
      const location = row?.Location ? String(row.Location).trim() : '';
      if (location) set.add(location);
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, []);

  const [draft, setDraft] = useState(() => buildDraftFromFilters(initialFilters, numericDefaults));

  useEffect(() => {
    setDraft(buildDraftFromFilters(initialFilters, numericDefaults));
  }, [initialFilters, numericDefaults, isOpen]);

  const setField = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    const payload = {
      minRent: toFilterNumber(draft.minRent),
      maxRent: toFilterNumber(draft.maxRent),
      minBeds: toFilterNumber(draft.minBeds),
      maxBeds: toFilterNumber(draft.maxBeds),
      minBaths: toFilterNumber(draft.minBaths),
      maxBaths: toFilterNumber(draft.maxBaths),
      minRentPerSqft: toFilterNumber(draft.minRentPerSqft),
      maxRentPerSqft: toFilterNumber(draft.maxRentPerSqft),
      type: draft.type ? String(draft.type).trim() : undefined,
      furnishing: draft.furnishing ? String(draft.furnishing).trim() : undefined,
      location: draft.location ? String(draft.location).trim() : undefined,
    };

    const cleaned = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== ''));
    onApply(cleaned);
    onClose();
  };

  const handleClear = () => {
    setDraft(buildDraftFromFilters({}, numericDefaults));
    onClear();
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={isOpen ? { opacity: 1, height: '82%' } : { opacity: 1, height: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed top-16 right-10 w-80 bg-white shadow-2xl z-50 overflow-hidden mobile-scroll-fix"
      onClick={onClose}
    >
      <div className="h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Property Filters</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <input type="number" placeholder="Min Rent" value={draft.minRent} onChange={(e) => setField('minRent', e.target.value)} className="px-2 py-1.5 text-xs border border-gray-300 rounded" />
            <input type="number" placeholder="Max Rent" value={draft.maxRent} onChange={(e) => setField('maxRent', e.target.value)} className="px-2 py-1.5 text-xs border border-gray-300 rounded" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input type="number" placeholder="Min Beds" value={draft.minBeds} onChange={(e) => setField('minBeds', e.target.value)} className="px-2 py-1.5 text-xs border border-gray-300 rounded" />
            <input type="number" placeholder="Max Beds" value={draft.maxBeds} onChange={(e) => setField('maxBeds', e.target.value)} className="px-2 py-1.5 text-xs border border-gray-300 rounded" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input type="number" placeholder="Min Baths" value={draft.minBaths} onChange={(e) => setField('minBaths', e.target.value)} className="px-2 py-1.5 text-xs border border-gray-300 rounded" />
            <input type="number" placeholder="Max Baths" value={draft.maxBaths} onChange={(e) => setField('maxBaths', e.target.value)} className="px-2 py-1.5 text-xs border border-gray-300 rounded" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input type="number" placeholder="Min Rent/sqft" value={draft.minRentPerSqft} onChange={(e) => setField('minRentPerSqft', e.target.value)} className="px-2 py-1.5 text-xs border border-gray-300 rounded" />
            <input type="number" placeholder="Max Rent/sqft" value={draft.maxRentPerSqft} onChange={(e) => setField('maxRentPerSqft', e.target.value)} className="px-2 py-1.5 text-xs border border-gray-300 rounded" />
          </div>

          <select value={draft.type} onChange={(e) => setField('type', e.target.value)} className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white">
            <option value="">Any Type</option>
            {propertyTypeOptions.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select value={draft.furnishing} onChange={(e) => setField('furnishing', e.target.value)} className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white">
            <option value="">Any Furnishing</option>
            <option value="Furnished">Furnished</option>
            <option value="Unfurnished">Unfurnished</option>
          </select>

          <div className="space-y-1">
            <input
              type="text"
              list="property-location-options"
              placeholder="Any Location"
              value={draft.location}
              onChange={(e) => setField('location', e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded"
            />
            <datalist id="property-location-options">
              {locationOptions.map((location) => (
                <option key={location} value={location} />
              ))}
            </datalist>
            <p className="text-[11px] text-gray-500">Type to filter locations, then select from suggestions.</p>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 grid grid-cols-2 gap-2">
          <button onClick={handleClear} className="py-2 px-3 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Clear
          </button>
          <button onClick={handleApply} className="py-2 px-3 text-xs font-medium text-white bg-azure rounded-lg hover:bg-azure-dark transition-colors">
            Apply
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PropertyFilterPanel;
