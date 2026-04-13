import React, { useMemo, useState } from 'react';
import Map from '../components/ui/Map';
import propertyListings from '../data/properties/listings.json';

const DEFAULT_FILTERS = {
  minRent: '',
  maxRent: '',
  minBeds: '',
  maxBeds: '',
  minBaths: '',
  maxBaths: '',
  type: '',
  furnishing: '',
  location: '',
  minRentPerSqft: '',
  maxRentPerSqft: '',
};

const PRESET_FILTERS = [
  {
    id: 'budget-apartments',
    title: 'Budget Apartments',
    description: 'Affordable options with practical rent range',
    viewMode: 'combined',
    searchQuery: '',
    filters: {
      minRent: 45000,
      maxRent: 95000,
      minBeds: 1,
      maxBeds: 2,
      minBaths: 1,
      maxBaths: 2,
      type: 'Apartment',
      furnishing: 'Unfurnished',
      location: '',
      minRentPerSqft: 70,
      maxRentPerSqft: 130,
    },
  },
  {
    id: 'furnished-studio',
    title: 'Furnished Studio Hunt',
    description: 'Short-stay focused listings',
    viewMode: 'points-only',
    searchQuery: 'studio',
    filters: {
      minRent: '',
      maxRent: 85000,
      minBeds: 0,
      maxBeds: 1,
      minBaths: 1,
      maxBaths: '',
      type: '',
      furnishing: 'Furnished',
      location: '',
      minRentPerSqft: '',
      maxRentPerSqft: 170,
    },
  },
  {
    id: 'family-villas',
    title: 'Family Villas',
    description: 'Spacious family homes with larger layouts',
    viewMode: 'combined',
    searchQuery: '',
    filters: {
      minRent: 150000,
      maxRent: 380000,
      minBeds: 3,
      maxBeds: 6,
      minBaths: 3,
      maxBaths: '',
      type: 'Villa',
      furnishing: '',
      location: '',
      minRentPerSqft: '',
      maxRentPerSqft: '',
    },
  },
  {
    id: 'high-yield-core',
    title: 'High Yield Core',
    description: 'Premium rents in sought-after zones',
    viewMode: 'combined',
    searchQuery: 'marina',
    filters: {
      minRent: 180000,
      maxRent: '',
      minBeds: 2,
      maxBeds: '',
      minBaths: 2,
      maxBaths: '',
      type: 'Apartment',
      furnishing: '',
      location: '',
      minRentPerSqft: 150,
      maxRentPerSqft: '',
    },
  },
];

const MapPage = () => {
  const [filter, setFilter] = useState('Area');
  const [viewMode, setViewMode] = useState('combined');
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyFilters, setPropertyFilters] = useState(DEFAULT_FILTERS);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [explorerSummary, setExplorerSummary] = useState({
    totalListings: 0,
    averageRent: null,
    averageRentPerSqft: null,
    mostCommonType: null,
    furnishingDistribution: [],
    searchMatchCount: 0,
  });
  const [searchResultCount, setSearchResultCount] = useState(0);
  const [activePreset, setActivePreset] = useState(null);

  const uniqueTypes = useMemo(() => {
    return [...new Set(propertyListings.map((listing) => listing.Type).filter(Boolean))].sort();
  }, []);

  const uniqueFurnishing = useMemo(() => {
    return [...new Set(propertyListings.map((listing) => listing.Furnishing).filter(Boolean))].sort();
  }, []);

  const uniqueLocations = useMemo(() => {
    return [...new Set(propertyListings.map((listing) => listing.Location).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 60);
  }, []);

  const explorerConfig = useMemo(() => ({
    enabled: true,
    viewMode,
    filters: propertyFilters,
    searchQuery,
    selectedAreaKey: selectedArea?.areaKey || null,
  }), [propertyFilters, searchQuery, selectedArea, viewMode]);

  const viewModes = [
    { id: 'points-only', label: 'Points Only' },
    { id: 'area-insights-only', label: 'Area Insights Only' },
    { id: 'combined', label: 'Combined View' },
  ];

  const mapFilters = [
    { id: 'Emirates', label: 'Emirates' },
    { id: 'Area', label: 'Area' },
  ];

  const updateFilter = (key, value) => {
    setActivePreset(null);
    setPropertyFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const applyPreset = (preset) => {
    setActivePreset(preset.id);
    setViewMode(preset.viewMode);
    setSearchQuery(preset.searchQuery);
    setSelectedArea(null);
    setSelectedProperty(null);
    setPropertyFilters({
      ...DEFAULT_FILTERS,
      ...preset.filters,
    });
  };

  const clearFilters = () => {
    setActivePreset(null);
    setSearchQuery('');
    setSelectedArea(null);
    setSelectedProperty(null);
    setSearchResultCount(0);
    setPropertyFilters(DEFAULT_FILTERS);
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'No Data';
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
  };

  const summaryCards = [
    { label: 'Filtered listings', value: explorerSummary.totalListings },
    { label: 'Search matches', value: searchResultCount || explorerSummary.searchMatchCount || 0 },
    { label: 'Avg rent', value: explorerSummary.averageRent ? `AED ${formatCurrency(explorerSummary.averageRent)}` : 'No Data' },
    { label: 'Avg rent / sqft', value: explorerSummary.averageRentPerSqft ? `AED ${explorerSummary.averageRentPerSqft.toFixed(2)}` : 'No Data' },
  ];

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (searchQuery.trim()) chips.push({ key: 'searchQuery', label: `Search: ${searchQuery.trim()}` });
    if (propertyFilters.location) chips.push({ key: 'location', label: `Location: ${propertyFilters.location}` });
    if (propertyFilters.type) chips.push({ key: 'type', label: `Type: ${propertyFilters.type}` });
    if (propertyFilters.furnishing) chips.push({ key: 'furnishing', label: `Furnishing: ${propertyFilters.furnishing}` });
    if (propertyFilters.minRent) chips.push({ key: 'minRent', label: `Min Rent: AED ${propertyFilters.minRent}` });
    if (propertyFilters.maxRent) chips.push({ key: 'maxRent', label: `Max Rent: AED ${propertyFilters.maxRent}` });
    if (propertyFilters.minBeds) chips.push({ key: 'minBeds', label: `Beds >= ${propertyFilters.minBeds}` });
    if (propertyFilters.maxBeds) chips.push({ key: 'maxBeds', label: `Beds <= ${propertyFilters.maxBeds}` });
    if (propertyFilters.minBaths) chips.push({ key: 'minBaths', label: `Baths >= ${propertyFilters.minBaths}` });
    if (propertyFilters.maxBaths) chips.push({ key: 'maxBaths', label: `Baths <= ${propertyFilters.maxBaths}` });
    if (propertyFilters.minRentPerSqft) chips.push({ key: 'minRentPerSqft', label: `Rent/sqft >= ${propertyFilters.minRentPerSqft}` });
    if (propertyFilters.maxRentPerSqft) chips.push({ key: 'maxRentPerSqft', label: `Rent/sqft <= ${propertyFilters.maxRentPerSqft}` });
    return chips;
  }, [propertyFilters, searchQuery]);

  const removeChip = (chipKey) => {
    if (chipKey === 'searchQuery') {
      setSearchQuery('');
      setActivePreset(null);
      return;
    }
    setActivePreset(null);
    setPropertyFilters((current) => ({
      ...current,
      [chipKey]: '',
    }));
  };

  const bestInsights = useMemo(() => {
    const notes = [];
    if (explorerSummary.totalListings > 0) {
      notes.push(`Filtered inventory: ${explorerSummary.totalListings.toLocaleString()} listings`);
    }
    if (explorerSummary.mostCommonType) {
      notes.push(`Dominant segment: ${explorerSummary.mostCommonType}`);
    }
    if (explorerSummary.averageRent) {
      notes.push(`Market average rent: AED ${formatCurrency(explorerSummary.averageRent)}`);
    }
    if (explorerSummary.averageRentPerSqft) {
      notes.push(`Average rent/sqft: AED ${explorerSummary.averageRentPerSqft.toFixed(2)}`);
    }
    if (searchResultCount > 0 && searchQuery.trim()) {
      notes.push(`Search focus "${searchQuery.trim()}" returned ${searchResultCount} matching listings`);
    }
    return notes;
  }, [explorerSummary, formatCurrency, searchQuery, searchResultCount]);

  return (
    <div className="min-h-screen bg-[#08111f] text-white">
      <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(62,126,255,0.25),_transparent_38%),linear-gradient(180deg,_#091220_0%,_#07101a_100%)]">
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
            <div className="space-y-5">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/90 font-semibold">Property intelligence explorer</p>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white max-w-4xl">
                Explore Dubai listings with live filters, search, clusters, and area insights.
              </h1>
              <p className="text-base md:text-lg text-slate-300 max-w-3xl leading-7">
                Move beyond static choropleths. Slice the market by rent, beds, baths, type, furnishing, location, and price per square foot while the map recalculates area-level insights from the filtered subset.
              </p>
              <div className="flex flex-wrap gap-3">
                {mapFilters.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFilter(item.id)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                      filter === item.id
                        ? 'border-cyan-400 bg-cyan-400/15 text-cyan-200 shadow-[0_0_0_1px_rgba(34,211,238,0.28)]'
                        : 'border-white/15 bg-white/5 text-slate-300 hover:border-cyan-300/70 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-sm">
              <div className="grid grid-cols-3 gap-3">
                {viewModes.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setViewMode(item.id)}
                    className={`rounded-2xl px-3 py-3 text-xs font-bold uppercase tracking-wide transition-all ${
                      viewMode === item.id
                        ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20'
                        : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                <span>Search results</span>
                <span className="font-semibold text-white">{searchResultCount}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-sm">
              <div className="mb-5">
                <div className="mb-3 text-xs uppercase tracking-[0.2em] text-cyan-300/90 font-semibold">Smart presets</div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {PRESET_FILTERS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset)}
                      className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                        activePreset === preset.id
                          ? 'border-cyan-400 bg-cyan-400/15 text-cyan-200'
                          : 'border-white/10 bg-slate-950/50 text-slate-300 hover:border-cyan-300/60 hover:text-white'
                      }`}
                    >
                      <div className="text-sm font-semibold">{preset.title}</div>
                      <div className="mt-1 text-xs text-slate-400">{preset.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="space-y-2 text-sm text-slate-300">
                  <span>Search</span>
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Area, building, or keyword"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-400/70"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-300">
                  <span>Location</span>
                  <input
                    list="property-locations"
                    value={propertyFilters.location}
                    onChange={(event) => updateFilter('location', event.target.value)}
                    placeholder="Filter by location"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-400/70"
                  />
                  <datalist id="property-locations">
                    {uniqueLocations.map((location) => (
                      <option key={location} value={location} />
                    ))}
                  </datalist>
                </label>

                <label className="space-y-2 text-sm text-slate-300">
                  <span>Property type</span>
                  <select
                    value={propertyFilters.type}
                    onChange={(event) => updateFilter('type', event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-400/70"
                  >
                    <option value="">All types</option>
                    {uniqueTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm text-slate-300">
                  <span>Furnishing</span>
                  <select
                    value={propertyFilters.furnishing}
                    onChange={(event) => updateFilter('furnishing', event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-400/70"
                  >
                    <option value="">All furnishing</option>
                    {uniqueFurnishing.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm text-slate-300">
                  <span>Min rent</span>
                  <input
                    type="number"
                    value={propertyFilters.minRent}
                    onChange={(event) => updateFilter('minRent', event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-400/70"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-300">
                  <span>Max rent</span>
                  <input
                    type="number"
                    value={propertyFilters.maxRent}
                    onChange={(event) => updateFilter('maxRent', event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-400/70"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-300">
                  <span>Beds</span>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      min="0"
                      placeholder="Min"
                      value={propertyFilters.minBeds}
                      onChange={(event) => updateFilter('minBeds', event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-400/70"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Max"
                      value={propertyFilters.maxBeds}
                      onChange={(event) => updateFilter('maxBeds', event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-400/70"
                    />
                  </div>
                </label>

                <label className="space-y-2 text-sm text-slate-300">
                  <span>Baths</span>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      min="0"
                      placeholder="Min"
                      value={propertyFilters.minBaths}
                      onChange={(event) => updateFilter('minBaths', event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-400/70"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Max"
                      value={propertyFilters.maxBaths}
                      onChange={(event) => updateFilter('maxBaths', event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-400/70"
                    />
                  </div>
                </label>

                <label className="space-y-2 text-sm text-slate-300">
                  <span>Rent / sqft</span>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      min="0"
                      placeholder="Min"
                      value={propertyFilters.minRentPerSqft}
                      onChange={(event) => updateFilter('minRentPerSqft', event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-400/70"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Max"
                      value={propertyFilters.maxRentPerSqft}
                      onChange={(event) => updateFilter('maxRentPerSqft', event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-400/70"
                    />
                  </div>
                </label>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={clearFilters}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-300 hover:text-white"
                >
                  Clear filters
                </button>
                <span className="text-sm text-slate-400">
                  The map updates instantly as you change filters.
                </span>
              </div>

              {activeFilterChips.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {activeFilterChips.map((chip) => (
                    <button
                      key={chip.key}
                      onClick={() => removeChip(chip.key)}
                      className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100 hover:bg-cyan-400/20"
                    >
                      {chip.label} x
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-[32px] border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
              <div className="h-[720px] bg-slate-950">
                <Map
                  selectedFilter={filter}
                  selectedDataPoint="property-combo-counts"
                  propertyExplorerConfig={explorerConfig}
                  onAreaSelect={setSelectedArea}
                  onPointSelect={setSelectedProperty}
                  onExplorerSummaryChange={setExplorerSummary}
                  onSearchResultsChange={(results) => setSearchResultCount(results.length)}
                />
              </div>
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6 self-start">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80 font-semibold">Filtered intelligence</p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Current snapshot</h2>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-right">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Mode</div>
                  <div className="text-sm font-semibold text-white capitalize">{viewMode.replace('-', ' ')}</div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {summaryCards.map((card) => (
                  <div key={card.label} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{card.label}</div>
                    <div className="mt-2 text-2xl font-bold text-white">{card.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="text-sm font-semibold text-white">Legend</div>
                <div className="mt-3 space-y-3 text-sm text-slate-300">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full bg-cyan-400" />
                    <span>Dots = individual listings</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full bg-indigo-500" />
                    <span>Colors = area-level aggregated insights</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full bg-orange-400" />
                    <span>Orange highlights = search matches</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="text-sm font-semibold text-white">Best insights now</div>
                {bestInsights.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm text-slate-300 list-disc list-inside">
                    {bestInsights.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-slate-400">Apply a preset or filters to generate intelligent market insights.</p>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80 font-semibold">Area insights</p>
              {selectedArea ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{selectedArea.areaName}</h3>
                    <p className="mt-1 text-sm text-slate-400">Area key: {selectedArea.areaKey}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Listings</div>
                      <div className="mt-2 text-2xl font-bold text-white">{selectedArea.areaMetrics?.listingCount ?? 'No Data'}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Average rent</div>
                      <div className="mt-2 text-2xl font-bold text-white">
                        {selectedArea.areaMetrics?.avgRent ? `AED ${formatCurrency(selectedArea.areaMetrics.avgRent)}` : 'No Data'}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Avg rent / sqft</div>
                      <div className="mt-2 text-2xl font-bold text-white">
                        {selectedArea.areaMetrics?.avgRentPerSqft ? `AED ${selectedArea.areaMetrics.avgRentPerSqft.toFixed(2)}` : 'No Data'}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Top type</div>
                      <div className="mt-2 text-2xl font-bold text-white">{selectedArea.areaMetrics?.dominantType || 'No Data'}</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="text-sm font-semibold text-white">Furnishing distribution</div>
                    <div className="mt-4 space-y-3">
                      {(selectedArea.areaMetrics?.furnishingCounts
                        ? Object.entries(selectedArea.areaMetrics.furnishingCounts)
                        : [])
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([label, count]) => {
                          const total = selectedArea.areaMetrics?.listingCount || 1;
                          const share = ((count / total) * 100).toFixed(1);
                          return (
                            <div key={label} className="space-y-1">
                              <div className="flex items-center justify-between text-sm text-slate-300">
                                <span>{label}</span>
                                <span>{share}%</span>
                              </div>
                              <div className="h-2 rounded-full bg-white/10">
                                <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${Math.min(100, Number(share))}%` }} />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-slate-950/30 p-5 text-sm text-slate-400">
                  Click an area to inspect filtered insights.
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80 font-semibold">Property detail</p>
              {selectedProperty ? (
                <div className="mt-4 space-y-3">
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedProperty.listing?.Address || selectedProperty.location || 'Listing'}</h3>
                    <p className="text-sm text-slate-400">{selectedProperty.location || 'Unknown location'}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Rent</div>
                      <div className="mt-2 text-xl font-bold text-white">{selectedProperty.rent ? `AED ${formatCurrency(selectedProperty.rent)}` : 'No Data'}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Beds / Baths</div>
                      <div className="mt-2 text-xl font-bold text-white">{selectedProperty.beds ?? 'N/A'} / {selectedProperty.baths ?? 'N/A'}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Type</div>
                      <div className="mt-2 text-xl font-bold text-white">{selectedProperty.type || 'N/A'}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Furnishing</div>
                      <div className="mt-2 text-xl font-bold text-white">{selectedProperty.furnishing || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
                    <div><span className="text-slate-500">Rent / sqft:</span> {selectedProperty.listing?.Rent_per_sqft ? `AED ${selectedProperty.listing.Rent_per_sqft.toFixed(2)}` : 'No Data'}</div>
                    <div><span className="text-slate-500">Address:</span> {selectedProperty.listing?.Address || 'No Data'}</div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-slate-950/30 p-5 text-sm text-slate-400">
                  Click a property point to open its detail card.
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default MapPage;
